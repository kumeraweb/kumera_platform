import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { onboardingSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/onboarding";

export async function POST(request: NextRequest) {
  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(400, "VALIDATION_ERROR", "Invalid onboarding payload", parsed.error.flatten());
  }

  const payload = parsed.data;
  const supabase = createAdminClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      legal_name: payload.companyName,
      rut: payload.rut,
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      tax_document_type: payload.taxDocumentType,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return fail(500, "DB_ERROR", "Failed creating company", companyError?.message);
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id")
    .eq("slug", payload.serviceSlug)
    .single();

  if (serviceError || !service) {
    return fail(404, "SERVICE_NOT_FOUND", "Service slug not found", payload.serviceSlug);
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      company_id: company.id,
      service_id: service.id,
      plan_id: payload.planId,
      status: "pending_activation",
    })
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    return fail(500, "DB_ERROR", "Failed creating subscription", subscriptionError?.message);
  }

  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: onboardingToken, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .insert({
      subscription_id: subscription.id,
      token,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (tokenError || !onboardingToken) {
    return fail(500, "DB_ERROR", "Failed creating onboarding token", tokenError?.message);
  }

  await supabase.from("payments").insert({
    subscription_id: subscription.id,
    method: "bank_transfer",
    status: "pending",
    amount_cents: 0,
    due_date: new Date().toISOString(),
  });

  await writeAuditLog("onboarding.created", "system", {
    companyId: company.id,
    subscriptionId: subscription.id,
  });

  return ok({
    subscriptionId: subscription.id,
    onboardingToken: token,
    onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding/${token}`,
  });
}
