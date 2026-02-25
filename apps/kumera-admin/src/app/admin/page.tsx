import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="m-0 text-base font-bold text-slate-100">Panel administrativo central</h2>
      <p className="mt-2 text-sm text-slate-400">Desde aquí se administra billing, Tuejecutiva y LeadOS con un solo acceso.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700" href="/admin/billing">
          Billing admin central
        </Link>
        <Link className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700" href="/admin/tuejecutiva">
          TuEjecutiva admin
        </Link>
        <Link className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700" href="/admin/leados">
          LeadOS admin
        </Link>
      </div>
    </section>
  );
}
