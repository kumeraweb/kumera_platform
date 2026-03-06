import Link from "next/link";

function IconBilling() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-accent-hover)" }}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconTuejecutiva() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-success)" }}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconKumeraMessaging() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-warning)" }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-text-muted)" }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const modules = [
  {
    href: "/admin/billing",
    title: "Billing",
    desc: "Gestión de onboarding, pagos, suscripciones y plantillas de contrato.",
    icon: IconBilling,
    accent: "var(--admin-accent-subtle)",
  },
  {
    href: "/admin/tuejecutiva",
    title: "TuEjecutiva",
    desc: "Tokens de onboarding, creación de ejecutivas y postulaciones pendientes.",
    icon: IconTuejecutiva,
    accent: "var(--admin-success-subtle)",
  },
  {
    href: "/admin/kumeramessaging",
    title: "Kumera Messaging",
    desc: "Clientes, canales WhatsApp, panel operativo y flujos conversacionales.",
    icon: IconKumeraMessaging,
    accent: "var(--admin-warning-subtle)",
  },
];

export default function AdminHomePage() {
  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="m-0 text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          Panel administrativo
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Administra billing, TuEjecutiva y Kumera Messaging desde un solo lugar.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group admin-card flex flex-col gap-4 no-underline transition-all duration-200 hover:shadow-lg"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: mod.accent }}
                >
                  <Icon />
                </div>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <IconArrow />
                </span>
              </div>
              <div>
                <p className="m-0 text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                  {mod.title}
                </p>
                <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                  {mod.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
