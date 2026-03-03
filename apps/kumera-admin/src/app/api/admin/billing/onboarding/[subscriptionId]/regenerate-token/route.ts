import { randomUUID } from "node:crypto";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import {
  getOnboardingBaseUrl,
  getOnboardingTokenTtlHours,
  writeBillingAuditLog,
  writeOnboardingEvent,
} from "@/lib/billing";

export async function POST(_: Request, context: { params: Promise<{ subscriptionId: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { subscriptionId } = await context.params;
  const billing = createBillingServiceClient();

  const ttlHours = getOnboardingTokenTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  const { data: renewableToken, error: renewableTokenError } = await billing
    .from("onboarding_tokens")
    .select("id,token")
    .eq("subscription_id", subscriptionId)
    .is("consumed_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (renewableTokenError) return fail(renewableTokenError.message, 500);

  if (renewableToken) {
    const { error: renewError } = await billing
      .from("onboarding_tokens")
      .update({ expires_at: expiresAt })
      .eq("id", renewableToken.id);
    if (renewError) return fail(renewError.message, 500);

    await writeOnboardingEvent({
      subscriptionId,
      tokenId: renewableToken.id,
      eventType: "onboarding.token.renewed",
      payload: { extendedHours: ttlHours },
    });

    await writeBillingAuditLog("onboarding.token.renewed", auth.user.id, { subscriptionId });

    return ok({
      onboardingToken: renewableToken.token,
      onboardingUrl: `${getOnboardingBaseUrl()}/onboarding/${renewableToken.token}`,
      expiresAt,
      renewed: true,
    });
  }

  const { error: revokeError } = await billing
    .from("onboarding_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("subscription_id", subscriptionId)
    .is("consumed_at", null)
    .is("revoked_at", null);
  if (revokeError) return fail(revokeError.message, 500);

  const token = randomUUID() + randomUUID();

  const { data: createdToken, error } = await billing
    .from("onboarding_tokens")
    .insert({
      subscription_id: subscriptionId,
      token,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !createdToken) return fail(error?.message ?? "Could not regenerate token", 500);

  await writeOnboardingEvent({
    subscriptionId,
    tokenId: createdToken.id,
    eventType: "onboarding.token.regenerated",
  });

  await writeBillingAuditLog("onboarding.token.regenerated", auth.user.id, { subscriptionId });

  return ok({
    onboardingToken: token,
    onboardingUrl: `${getOnboardingBaseUrl()}/onboarding/${token}`,
    expiresAt,
    renewed: false,
  });
}
