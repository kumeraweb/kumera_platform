import { requireAdminPage, ROLE } from "@/lib/auth";
import { createCoreServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  try {
    await requireAdminPage([ROLE.SUPERADMIN]);
    const client = createCoreServiceClient();
    const { data, error } = await client
      .from("user_roles")
      .select("user_id, role, active, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    return (
      <div>
        <div className="mb-6">
          <h1 className="section-title" style={{ fontSize: 20 }}>Global Roles</h1>
          <p className="section-desc">Tabla core.user_roles — permisos de acceso al panel.</p>
        </div>
        {error ? <div className="admin-alert admin-alert-error mb-4">Error: {error.message}</div> : null}
        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((row) => (
                  <tr key={`${row.user_id}-${row.role}`}>
                    <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{row.user_id}</span></td>
                    <td><span className="badge badge-accent">{row.role}</span></td>
                    <td>{row.active ? <span className="badge badge-success">true</span> : <span className="badge badge-error">false</span>}</td>
                    <td style={{ color: "var(--admin-text-muted)" }}>{row.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="section-title" style={{ fontSize: 20 }}>Global Roles</h1>
          <p className="section-desc">Tabla core.user_roles</p>
        </div>
        <div className="admin-alert admin-alert-error">Error: {error instanceof Error ? error.message : "Unknown error"}</div>
      </div>
    );
  }
}
