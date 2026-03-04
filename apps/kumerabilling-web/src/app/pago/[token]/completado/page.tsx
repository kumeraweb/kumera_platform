type Props = {
  params: Promise<{ token: string }>;
};

export default async function PaymentCompletedPage({ params }: Props) {
  await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm sm:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Proceso completado</p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-gray-900">
          Pago enviado correctamente
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Recibimos tu comprobante y lo revisaremos a la brevedad. Te confirmaremos la activación o continuidad del servicio por correo.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-1">
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
