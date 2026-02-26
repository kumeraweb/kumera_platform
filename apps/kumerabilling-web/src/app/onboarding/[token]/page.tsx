import { ContractAcceptForm } from "@/components/contract-accept-form";
import { TransferProofForm } from "@/components/transfer-proof-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveValidToken } from "@/lib/onboarding";

type ApiData = {
  subscription: {
    id: string;
    status: string;
    company: { legal_name: string; rut: string; email: string };
    plan: { name: string; price_cents: number };
    payments: Array<{ id: string; status: string }>;
  };
  contract: {
    id: string;
    version: string;
    accepted: boolean;
    accepted_at: string | null;
    html_rendered: string | null;
    content_hash: string | null;
  } | null;
  expiresAt: string;
};

async function getOnboardingData(token: string): Promise<ApiData | null> {
  const valid = await resolveValidToken(token);
  if (!valid.ok) return null;

  const supabase = createAdminClient();
  const subscriptionId = valid.record.subscription_id;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id,status,company:companies(legal_name,email,rut,address,phone,tax_document_type),plan:plans(name,price_cents,billing_cycle_days),payments(id,status,due_date)")
    .eq("id", subscriptionId)
    .single();

  if (!subscription) return null;

  const { data: contract } = await supabase
    .from("contracts")
    .select("id,version,accepted,accepted_at,html_rendered,content_hash")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("onboarding_events").insert({
    subscription_id: subscriptionId,
    token_id: valid.record.id,
    event_type: "onboarding.opened",
    payload: {},
  });

  const rawCompany = Array.isArray(subscription.company) ? subscription.company[0] : subscription.company;
  const rawPlan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
  const normalizedSubscription: ApiData["subscription"] = {
    id: subscription.id,
    status: subscription.status,
    company: {
      legal_name: rawCompany?.legal_name ?? "",
      rut: rawCompany?.rut ?? "",
      email: rawCompany?.email ?? "",
    },
    plan: {
      name: rawPlan?.name ?? "",
      price_cents: Number(rawPlan?.price_cents ?? 0),
    },
    payments: (subscription.payments ?? []).map((payment) => ({
      id: payment.id,
      status: payment.status,
    })),
  };

  return {
    subscription: normalizedSubscription,
    contract: (contract as ApiData["contract"]) ?? null,
    expiresAt: valid.record.expires_at,
  };
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getOnboardingData(token);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">!</div>
          <h1 className="font-[var(--font-display)] text-xl font-bold text-gray-900">Link inválido o expirado</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">Solicita a Kumera un nuevo enlace de onboarding.</p>
        </section>
      </main>
    );
  }

  const firstPayment = data.subscription.payments[0];
  const contractDownloadUrl = data.contract?.id
    ? `/api/contracts/${data.contract.id}/download?token=${encodeURIComponent(token)}`
    : null;

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* ── Top bar ─────────────────────────────── */}
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-[var(--font-display)] text-lg font-bold tracking-tight text-gray-900">
            Kumera
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Activación de servicio
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* ── Welcome card ──────────────────────── */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Proceso de contratación
          </p>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-gray-900 sm:text-3xl">
            Bienvenido, {data.subscription.company.legal_name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <span>
              <strong className="font-medium text-gray-900">Plan:</strong> {data.subscription.plan.name}
            </span>
            <span>
              <strong className="font-medium text-gray-900">Monto:</strong> ${Math.floor(data.subscription.plan.price_cents / 100)} CLP
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Este enlace vence: {new Date(data.expiresAt).toLocaleString("es-CL")}
          </p>
        </section>

        {/* ── Steps grid ────────────────────────── */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* ── Step 1: Contrato ────────────────── */}
          <article className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                1
              </span>
              <h2 className="font-[var(--font-display)] text-lg font-semibold text-gray-900">
                Revisión y aceptación del contrato
              </h2>
            </div>
            <div className="space-y-4 p-6">
              {data.contract?.html_rendered ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="m-0 text-xs text-gray-400">
                      Versión: {data.contract.version} · Hash:{" "}
                      <span className="font-mono">{data.contract.content_hash?.slice(0, 16) ?? "-"}</span>
                    </p>
                  </div>
                  <article
                    className="prose prose-sm prose-gray max-h-[420px] max-w-none overflow-y-auto pr-2"
                    dangerouslySetInnerHTML={{ __html: data.contract.html_rendered }}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No hay contrato disponible para esta suscripción. Solicita un nuevo enlace.
                </div>
              )}
              <ContractAcceptForm token={token} subscriptionId={data.subscription.id} />
            </div>
          </article>

          {/* ── Step 2: Pago ────────────────────── */}
          <article className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${data.contract?.accepted ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                2
              </span>
              <h2 className="font-[var(--font-display)] text-lg font-semibold text-gray-900">
                Pago por transferencia
              </h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-7 text-gray-700">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <span className="font-medium text-gray-500">Titular</span>
                  <span>Servicios Digitales Kumera Spa</span>
                  <span className="font-medium text-gray-500">RUT</span>
                  <span>78.299.262-7</span>
                  <span className="font-medium text-gray-500">Banco</span>
                  <span>Banco Bci</span>
                  <span className="font-medium text-gray-500">Cuenta</span>
                  <span>Cuenta corriente en pesos · N.° 70818970</span>
                  <span className="font-medium text-gray-500">Correo</span>
                  <span>CONTACTO@KUMERAWEB.COM</span>
                </div>
              </div>
              {!data.contract?.accepted ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Debes aceptar el contrato primero para habilitar la carga de comprobante.
                </p>
              ) : null}
              {firstPayment ? (
                <TransferProofForm
                  token={token}
                  paymentId={firstPayment.id}
                  disabled={!data.contract?.accepted}
                  contractDownloadUrl={contractDownloadUrl}
                />
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No hay pago pendiente asociado.</p>
              )}
            </div>
          </article>
        </section>

        {/* ── Footer ────────────────────────────── */}
        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-center text-xs text-gray-400">
          Kumera Servicios Digitales SpA · Todos los derechos reservados
        </footer>
      </div>
    </main>
  );
}
