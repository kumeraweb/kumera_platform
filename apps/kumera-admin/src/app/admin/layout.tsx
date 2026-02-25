import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, roles } = await requireAdminPage();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-5 py-3 backdrop-blur">
        <div>
          <h1 className="m-0 text-lg font-bold tracking-tight text-slate-100">Kumera Admin</h1>
          <p className="m-0.5 text-xs text-slate-400">
            {user.email} · roles: {roles.join(", ")}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100" href="/admin">Dashboard</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100" href="/admin/billing">Billing</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100" href="/admin/tuejecutiva">TuEjecutiva</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100" href="/admin/leados">LeadOS</Link>
        </nav>
        <form action="/logout" method="post">
          <button className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">Salir</button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-5 py-6">{children}</main>
    </div>
  );
}
