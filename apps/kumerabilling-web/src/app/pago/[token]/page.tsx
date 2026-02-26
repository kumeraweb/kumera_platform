import { TransferProofForm } from "@/components/transfer-proof-form";
import { resolveValidPaymentAccessToken } from "@/lib/payment-access";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentData = {
  tokenExpiresAt: string;
  subscription: {
    id: string;
    companyName: string;
    planName: string;
    priceCents: number;
  };
  payment: {
    id: string;
    dueDate: string | null;
    status: string;
  };
  contract: {
    id: string;
    accepted: boolean;
  } | null;
};

async function getPaymentData(token: string): Promise<PaymentData | null> {
  const tokenStatus = await resolveValidPaymentAccessToken(token);
  if (!tokenStatus.ok) return null;

  const supabase = createAdminClient();

  const [subscriptionResult, paymentResult, contractResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id,company:companies(legal_name),plan:plans(name,price_cents)")
      .eq("id", tokenStatus.record.subscription_id)
      .single(),
    supabase
      .from("payments")
      .select("id,status,due_date")
      .eq("id", tokenStatus.record.payment_id)
      .single(),
    supabase
      .from("contracts")
      .select("id,accepted")
      .eq("subscription_id", tokenStatus.record.subscription_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (subscriptionResult.error || paymentResult.error || !subscriptionResult.data || !paymentResult.data) {
    return null;
  }

  const subscription = subscriptionResult.data;
  const company = Array.isArray(subscription.company) ? subscription.company[0] : subscription.company;
  const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;

  return {
    tokenExpiresAt: tokenStatus.record.expires_at,
    subscription: {
      id: subscription.id,
      companyName: company?.legal_name ?? "Cliente",
      planName: plan?.name ?? "Plan",
      priceCents: Number(plan?.price_cents ?? 0),
    },
    payment: {
      id: paymentResult.data.id,
      dueDate: paymentResult.data.due_date,
      status: paymentResult.data.status,
    },
    contract: contractResult.data
      ? {
          id: contractResult.data.id,
          accepted: contractResult.data.accepted === true,
        }
      : null,
  };
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPaymentData(token);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-[var(--font-display)] text-xl font-bold text-gray-900">Link de pago inválido o expirado</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">Solicita un nuevo enlace de pago a Kumera.</p>
        </section>
      </main>
    );
  }

  const amountClp = Math.floor(data.subscription.priceCents / 100);
  const ivaClp = Math.round(amountClp * 0.19);
  const totalClp = amountClp + ivaClp;
  const contractDownloadUrl = data.contract?.id
    ? `/api/contracts/${data.contract.id}/download?token=${encodeURIComponent(token)}`
    : null;
  const completionUrl = data.contract?.id
    ? `/pago/${encodeURIComponent(token)}/completado?contractId=${encodeURIComponent(data.contract.id)}`
    : `/pago/${encodeURIComponent(token)}/completado`;

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-8">
          <span className="font-[var(--font-display)] text-base font-bold tracking-tight text-gray-900 sm:text-lg">
            Plataforma de contratación de servicios Kumera
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-0 py-6 sm:px-8 sm:py-10">
        <section className="mb-6 border-y border-[var(--border)] bg-white px-4 py-6 shadow-sm sm:rounded-2xl sm:border sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Pago mensual</p>
          <h1 className="mt-1 font-[var(--font-display)] text-2xl font-bold text-gray-900 sm:text-3xl">
            {data.subscription.companyName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <span>
              <strong className="font-medium text-gray-900">Plan:</strong> {data.subscription.planName}
            </span>
            <span>
              <strong className="font-medium text-gray-900">Monto:</strong> ${amountClp} CLP + IVA
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Link válido hasta: {new Date(data.tokenExpiresAt).toLocaleString("es-CL")}
          </p>
        </section>

        <article className="border-y border-[var(--border)] bg-white shadow-sm sm:rounded-2xl sm:border">
          <div className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
            <h2 className="font-[var(--font-display)] text-lg font-semibold text-gray-900">Subir comprobante</h2>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
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
              <div className="mt-3 border-t border-gray-200 pt-3 text-xs leading-5 text-gray-600">
                <p>MONTO: ${amountClp} CLP</p>
                <p>IVA (19%): ${ivaClp} CLP</p>
                <p className="font-semibold text-gray-900">TOTAL A TRANSFERIR: ${totalClp} CLP</p>
              </div>
            </div>

            {!data.contract?.accepted ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Este pago requiere contrato aceptado. Solicita a Kumera un enlace de onboarding actualizado.
              </p>
            ) : null}

            <TransferProofForm
              token={token}
              paymentId={data.payment.id}
              disabled={!data.contract?.accepted || data.payment.status !== "pending"}
              contractDownloadUrl={contractDownloadUrl}
              completionUrl={completionUrl}
            />
          </div>
        </article>
      </div>
    </main>
  );
}
