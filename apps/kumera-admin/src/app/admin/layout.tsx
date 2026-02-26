import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconBilling() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconTuejecutiva() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLeados() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconDashboard },
  { href: "/admin/billing", label: "Billing", icon: IconBilling },
  { href: "/admin/tuejecutiva", label: "TuEjecutiva", icon: IconTuejecutiva },
  { href: "/admin/leados", label: "LeadOS", icon: IconLeados },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, roles } = await requireAdminPage();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--admin-bg)" }}>
      {/* ─── Sidebar ─── */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r"
        style={{
          width: "var(--admin-sidebar-w)",
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: "var(--admin-accent)" }}
          >
            K
          </div>
          <div>
            <p className="m-0 text-sm font-bold" style={{ color: "var(--admin-text)" }}>
              Kumera Admin
            </p>
            <p className="m-0 text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
              Panel central
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: "var(--admin-border)" }} />

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium no-underline transition-all duration-150"
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user area */}
        <div className="mt-auto border-t px-4 py-4" style={{ borderColor: "var(--admin-border)" }}>
          <div className="mb-3">
            <p
              className="m-0 truncate text-xs font-medium"
              style={{ color: "var(--admin-text)" }}
            >
              {user.email}
            </p>
            <p className="m-0 mt-0.5 text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
              {roles.join(", ")}
            </p>
          </div>
          <form action="/logout" method="post">
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm w-full"
              type="submit"
            >
              <IconLogout />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main
        className="min-h-screen flex-1"
        style={{
          marginLeft: "var(--admin-sidebar-w)",
          padding: "32px 40px",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
