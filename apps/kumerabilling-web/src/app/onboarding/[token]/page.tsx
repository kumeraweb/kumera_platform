import { ContractAcceptForm } from "@/components/contract-accept-form";
import { TransferProofForm } from "@/components/transfer-proof-form";

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
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const response = await fetch(`${base}/api/onboarding/${token}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { ok: boolean; data?: ApiData };
  if (!payload.ok || !payload.data) {
    return null;
  }

  return payload.data;
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
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h1 className="text-2xl font-semibold">Link inválido o expirado</h1>
          <p className="mt-2 text-sm">Solicita a Kumera un nuevo enlace de onboarding.</p>
        </section>
      </main>
    );
  }

  const firstPayment = data.subscription.payments[0];
  const contractDownloadUrl = data.contract?.id
    ? `/api/contracts/${data.contract.id}/download?token=${encodeURIComponent(token)}`
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Onboarding Kumera</p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slate-900">
          Bienvenido, {data.subscription.company.legal_name}
        </h1>
        <p className="text-sm text-slate-700">
          Plan: {data.subscription.plan.name} · Monto: ${Math.floor(data.subscription.plan.price_cents / 100)} CLP
        </p>
        <p className="text-xs text-slate-500">Este enlace vence: {new Date(data.expiresAt).toLocaleString("es-CL")}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Paso 1: contrato</h2>
          {data.contract?.html_rendered ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="m-0 text-xs text-slate-500">
                  Versión: {data.contract.version} · Hash:{" "}
                  <span className="font-mono">{data.contract.content_hash?.slice(0, 16) ?? "-"}</span>
                </p>
              </div>
              <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: data.contract.html_rendered }} />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No hay contrato disponible para esta suscripción. Solicita un nuevo enlace.
            </div>
          )}
          <ContractAcceptForm token={token} subscriptionId={data.subscription.id} />
        </article>

        <article className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Paso 2: pago por transferencia</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            Titular: Servicios Digitales Kumera Spa
            <br />
            RUT: 78.299.262-7
            <br />
            Banco: Banco Bci
            <br />
            Tipo de cuenta: Cuenta corriente en pesos
            <br />
            N. cuenta: 70818970
            <br />
            Correo: CONTACTO@KUMERAWEB.COM
          </div>
          {!data.contract?.accepted ? (
            <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
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
            <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">No hay pago pendiente asociado.</p>
          )}
        </article>
      </section>
    </main>
  );
}
