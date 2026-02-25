import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, roles } = await requireAdminPage();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div>
          <h1 className="m-0 text-lg font-bold tracking-tight">Kumera Admin</h1>
          <p className="m-0.5 text-xs text-slate-500">
            {user.email} · roles: {roles.join(", ")}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900" href="/admin">Dashboard</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900" href="/admin/roles">Roles</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900" href="/admin/subscriptions">Billing</Link>
          <Link className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900" href="/admin/leados">LeadOS</Link>
        </nav>
        <form action="/logout" method="post">
          <button className="cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800" type="submit">Salir</button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-5 py-6">{children}</main>
    </div>
  );
}
