"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass = "admin-btn admin-btn-secondary admin-btn-sm no-underline";

export default function LeadosNavClient() {
  const pathname = usePathname();
  const isCreate = pathname === "/admin/leados";
  const isClients = pathname.startsWith("/admin/leados/clients");

  return (
    <div className="admin-card flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="section-title" style={{ fontSize: 20 }}>LeadOS</h1>
        <p className="section-desc">Flujo ordenado: crear cliente, listar activos, editar y gestionar flujo.</p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/admin/leados"
          className={linkClass}
          style={isCreate ? { borderColor: "var(--admin-primary)", color: "var(--admin-primary)" } : undefined}
        >
          Crear cliente
        </Link>
        <Link
          href="/admin/leados/clients"
          className={linkClass}
          style={isClients ? { borderColor: "var(--admin-primary)", color: "var(--admin-primary)" } : undefined}
        >
          Clientes activos
        </Link>
      </div>
    </div>
  );
}
