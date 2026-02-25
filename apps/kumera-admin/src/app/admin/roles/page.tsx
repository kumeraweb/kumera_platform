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
      <section className="card">
        <h2>Global Roles (core.user_roles)</h2>
        {error ? <p>Error: {error.message}</p> : null}
        <table className="table">
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
                <td>{row.user_id}</td>
                <td>{row.role}</td>
                <td>{String(row.active)}</td>
                <td>{row.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  } catch (error) {
    return (
      <section className="card">
        <h2>Global Roles (core.user_roles)</h2>
        <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </section>
    );
  }
}
