import Link from "next/link";
import { requireAdminPage, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeadosClientsPage() {
  await requireAdminPage([ROLE.LEADOS]);

  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("clients")
    .select(
      "id, name, notification_email, score_threshold, human_forward_number, priority_contact_email, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="admin-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">Clientes activos</h2>
        <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          Desde aquí gestionas edición y flujo por cliente.
        </p>
      </div>

      {error ? <div className="admin-alert admin-alert-error mb-4">Error loading clients: {error.message}</div> : null}

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Prioritario</th>
              <th>Score</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>
                    {row.id.slice(0, 8)}…
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{row.name}</td>
                <td>{row.notification_email}</td>
                <td>{row.priority_contact_email ?? "-"}</td>
                <td><span className="badge badge-accent">{row.score_threshold}</span></td>
                <td>
                  <div className="flex gap-2">
                    <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href={`/admin/kumeramessaging/clients/${row.id}/edit`}>
                      Editar
                    </Link>
                    <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href={`/admin/kumeramessaging/clients/${row.id}/flow`}>
                      Crear / editar flujo
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
