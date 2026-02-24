import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 md:px-10">
      <section className="space-y-5">
        <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
          Kumera Clientes V1
        </p>
        <h1 className="max-w-3xl font-[var(--font-display)] text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
          Portal centralizado para onboarding, contrato digital y validación de transferencias.
        </h1>
        <p className="max-w-2xl text-base text-slate-700 md:text-lg">
          Esta app organiza el cierre comercial de servicios Kumera con trazabilidad y operación manual simple.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/login"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-slate-900">Acceso Admin</h2>
          <p className="mt-2 text-sm text-slate-600">Ingresa con magic link para validar pagos y gestionar estados.</p>
        </Link>

        <Link
          href="/onboarding/demo-token"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-slate-900">Vista de Onboarding</h2>
          <p className="mt-2 text-sm text-slate-600">Flujo público por token con aceptación de contrato y carga de comprobante.</p>
        </Link>
      </section>
    </main>
  );
}
