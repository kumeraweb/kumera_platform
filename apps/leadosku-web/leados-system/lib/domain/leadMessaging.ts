export type LeadCloseReason = 'CLIENT_NO_RESPONSE' | 'ATTENDED_OTHER_LINE' | 'MANUAL_INTERNAL';

type LeadMessagingClient = {
  human_forward_number?: string | null;
  priority_contact_email?: string | null;
  notification_email?: string | null;
  human_required_message_template?: string | null;
  close_client_no_response_template?: string | null;
  close_attended_other_line_template?: string | null;
};

function applyTemplate(
  template: string,
  vars: {
    priority_phone: string;
    priority_email: string;
  }
) {
  return template
    .replaceAll('{priority_phone}', vars.priority_phone)
    .replaceAll('{priority_email}', vars.priority_email)
    .trim();
}

function resolveVars(client: LeadMessagingClient) {
  const priorityPhone = (client.human_forward_number || '').trim();
  const priorityEmail = (client.priority_contact_email || client.notification_email || '').trim();
  return { priorityPhone, priorityEmail };
}

export function getHumanRequiredHandoffText(client: LeadMessagingClient) {
  const { priorityPhone, priorityEmail } = resolveVars(client);
  const template =
    client.human_required_message_template ||
    'Muchas gracias. En unos minutos un ejecutivo tomara la conversacion. Si necesitas con urgencia tener respuesta puedes escribirnos ya mismo al {priority_phone} donde te atenderemos de manera prioritaria. Tambien puedes escribirnos a {priority_email}.';

  return applyTemplate(template, {
    priority_phone: priorityPhone,
    priority_email: priorityEmail
  });
}

export function getLeadCloseText(params: {
  reason: LeadCloseReason;
  client: LeadMessagingClient;
}) {
  const { priorityPhone, priorityEmail } = resolveVars(params.client);

  if (params.reason === 'CLIENT_NO_RESPONSE') {
    const template =
      params.client.close_client_no_response_template ||
      'Gracias por contactarnos. Esta conversacion sera finalizada por falta de respuesta. Si tienes cualquier duda puedes escribirnos con prioridad al {priority_phone} o enviarnos un correo a {priority_email}.';
    return applyTemplate(template, {
      priority_phone: priorityPhone,
      priority_email: priorityEmail
    });
  }

  if (params.reason === 'ATTENDED_OTHER_LINE') {
    const template =
      params.client.close_attended_other_line_template ||
      'Tu contacto esta siendo atendido en nuestra linea prioritaria. Muchas gracias por contactarnos.';
    return applyTemplate(template, {
      priority_phone: priorityPhone,
      priority_email: priorityEmail
    });
  }

  return '';
}

export function getLeadCloseReasonLabel(reason: LeadCloseReason) {
  if (reason === 'CLIENT_NO_RESPONSE') return 'CLIENT_NO_RESPONSE';
  if (reason === 'ATTENDED_OTHER_LINE') return 'ATTENDED_OTHER_LINE';
  return 'MANUAL_INTERNAL';
}
