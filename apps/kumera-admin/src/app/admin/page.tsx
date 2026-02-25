import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="m-0 text-base font-bold">Panel administrativo central</h2>
      <p className="mt-2 text-sm text-slate-600">Desde aquí se administra billing, Tuejecutiva y LeadOS con un solo acceso.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" href="/admin/roles">
          Roles globales (core)
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" href="/admin/subscriptions">
          Suscripciones (billing)
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" href="/admin/leados">
          LeadOS admin
        </Link>
      </div>
    </section>
  );
}
