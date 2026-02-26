import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const billing = createBillingServiceClient();

  const { data: proof, error } = await billing
    .from("payment_transfer_proofs")
    .select("id,payment_id,file_path,mime_type,size_bytes,created_at")
    .eq("payment_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!proof) return fail("No hay comprobante para este pago", 404);

  const { data: signed, error: signedError } = await billing.storage
    .from("payment-proofs")
    .createSignedUrl(proof.file_path, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return fail(signedError?.message ?? "No se pudo generar preview del comprobante", 500);
  }

  return ok({
    proof: {
      ...proof,
      signed_url: signed.signedUrl,
      expires_in_seconds: 600,
    },
  });
}
