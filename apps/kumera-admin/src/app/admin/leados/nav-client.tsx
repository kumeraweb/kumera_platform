"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass = "admin-btn admin-btn-secondary admin-btn-sm no-underline";

export default function LeadosNavClient() {
  const pathname = usePathname();
  const isCreate = pathname === "/admin/kumeramessaging";
  const isClients = pathname.startsWith("/admin/kumeramessaging/clients");

  return (
    <div className="admin-card flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="section-title" style={{ fontSize: 20 }}>Kumera Messaging</h1>
        <p className="section-desc">Alta interna de clientes, canales WhatsApp y flujos operados por Kumera.</p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/admin/kumeramessaging"
          className={linkClass}
          style={isCreate ? { borderColor: "var(--admin-primary)", color: "var(--admin-primary)" } : undefined}
        >
          Crear cliente
        </Link>
        <Link
          href="/admin/kumeramessaging/clients"
          className={linkClass}
          style={isClients ? { borderColor: "var(--admin-primary)", color: "var(--admin-primary)" } : undefined}
        >
          Clientes activos
        </Link>
      </div>
    </div>
  );
}
