type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ contractId?: string }>;
};

export default async function OnboardingCompletedPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { contractId } = await searchParams;
  const contractDownloadUrl = contractId
    ? `/api/contracts/${contractId}/download?token=${encodeURIComponent(token)}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm sm:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Proceso completado</p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-gray-900">
          Gracias por contratar servicios con Kumera
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Tu proceso de onboarding quedó finalizado y tu comprobante fue recibido correctamente. En las próximas horas
          nuestro equipo validará el pago para activar tu servicio.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {contractDownloadUrl ? (
            <a
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
              href={contractDownloadUrl}
              rel="noreferrer"
              target="_blank"
            >
              Descargar acuerdo de servicios
            </a>
          ) : null}
          <a
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            href="https://kumeraweb.com"
            rel="noreferrer"
            target="_blank"
          >
            Ir a Kumera
          </a>
        </div>
      </section>
    </main>
  );
}
