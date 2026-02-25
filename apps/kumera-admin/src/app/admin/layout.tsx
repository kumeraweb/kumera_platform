import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, roles } = await requireAdminPage();

  return (
    <>
      <header className="shell-header">
        <div>
          <h1>Kumera Admin</h1>
          <p className="muted">
            {user.email} · roles: {roles.join(", ")}
          </p>
        </div>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/roles">Roles</Link>
          <Link href="/admin/subscriptions">Billing</Link>
          <Link href="/admin/leados">LeadOS</Link>
        </nav>
        <form action="/logout" method="post">
          <button type="submit">Salir</button>
        </form>
      </header>
      <main className="shell-main">{children}</main>
    </>
  );
}
