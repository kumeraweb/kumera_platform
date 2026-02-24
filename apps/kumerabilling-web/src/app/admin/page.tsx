import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl font-bold text-slate-900">Panel Admin</h1>
          <p className="text-sm text-slate-700">Operación V1: revisar pagos, mora y estado de servicios.</p>
        </div>
        <Link href="/admin/login" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Cambiar sesión
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Clientes",
          "Pagos pendientes",
          "Por vencer",
          "Morosos",
          "Servicios activos",
          "Incidentes",
        ].map((label) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Métrica</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{label}</h2>
            <p className="mt-3 text-2xl font-bold text-emerald-700">--</p>
          </article>
        ))}
      </section>
    </main>
  );
}
