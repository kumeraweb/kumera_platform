import { z } from 'zod';
import { requireTenantClientId } from '@/lib/domain/authz';
import { fail, ok } from '@/lib/domain/http';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { decryptSecret } from '@/lib/domain/crypto';
import { sendWhatsappText } from '@/lib/domain/messaging';
import { getLeadCloseReasonLabel, getLeadCloseText, type LeadCloseReason } from '@/lib/domain/leadMessaging';

const bodySchema = z.object({
  reason: z.enum(['CLIENT_NO_RESPONSE', 'ATTENDED_OTHER_LINE'])
});

export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const auth = await requireTenantClientId();
  if (!auth.ok) {
    return fail(auth.error, auth.status);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid close reason', 400);
  }

  const { leadId } = await params;
  const reason = parsed.data.reason as LeadCloseReason;

  const { data: lead, error: leadError } = await auth.supabase
    .from('leads')
    .select('id, wa_user_id, conversation_status')
    .eq('id', leadId)
    .eq('client_id', auth.clientId)
    .maybeSingle();

  if (leadError) {
    return fail(leadError.message, 500);
  }

  if (!lead) {
    return fail('Lead not found', 404);
  }

  if (lead.conversation_status === 'CLOSED') {
    return fail('Lead is already closed', 409);
  }

  const service = createSupabaseServiceClient();

  const { data: client, error: clientError } = await service
    .from('clients')
    .select(
      'id, notification_email, human_forward_number, priority_contact_email, human_required_message_template, close_client_no_response_template, close_attended_other_line_template'
    )
    .eq('id', auth.clientId)
    .maybeSingle();

  if (clientError) {
    return fail(clientError.message, 500);
  }

  const { data: latestMsg } = await auth.supabase
    .from('messages')
    .select('phone_number_id')
    .eq('lead_id', leadId)
    .eq('client_id', auth.clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let phoneNumberId = latestMsg?.phone_number_id;
  if (!phoneNumberId) {
    const { data: anyChannel } = await service
      .from('client_channels')
      .select('phone_number_id')
      .eq('client_id', auth.clientId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    phoneNumberId = anyChannel?.phone_number_id;
  }

  if (!phoneNumberId) {
    return fail('No active channel for client', 409);
  }

  const { data: channel, error: channelError } = await service
    .from('client_channels')
    .select('meta_access_token_enc')
    .eq('client_id', auth.clientId)
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle();

  if (channelError) {
    return fail(channelError.message, 500);
  }

  if (!channel) {
    return fail('Channel not found', 404);
  }

  const text = getLeadCloseText({ reason, client: client ?? {} });

  try {
    const accessToken = decryptSecret(channel.meta_access_token_enc);
    const waResponse = await sendWhatsappText({
      phoneNumberId,
      accessToken,
      to: lead.wa_user_id,
      text
    });

    await service.from('messages').insert({
      client_id: auth.clientId,
      lead_id: lead.id,
      direction: 'OUTBOUND',
      phone_number_id: phoneNumberId,
      wa_message_id: waResponse?.messages?.[0]?.id ?? null,
      text_content: text,
      raw_payload: waResponse ?? {}
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Could not send close message', 502);
  }

  const { data, error } = await auth.supabase
    .from('leads')
    .update({
      conversation_status: 'CLOSED',
      human_required_reason: `MANUAL_CLOSE_${getLeadCloseReasonLabel(reason)}`,
      closed_at: new Date().toISOString()
    })
    .eq('id', leadId)
    .eq('client_id', auth.clientId)
    .select('id, conversation_status, human_required_reason, closed_at')
    .maybeSingle();

  if (error) {
    return fail(error.message, 500);
  }

  if (!data) {
    return fail('Lead not found', 404);
  }

  return ok({ lead: data, closeReason: reason, closeMessageSent: true });
}
