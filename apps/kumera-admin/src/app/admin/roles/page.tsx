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
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Global Roles (core.user_roles)</h2>
        {error ? <p className="mt-2 text-sm text-red-400">Error: {error.message}</p> : null}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">User ID</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Role</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Active</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={`${row.user_id}-${row.role}`}>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.user_id}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.role}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{String(row.active)}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-300">{row.created_at}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Global Roles (core.user_roles)</h2>
        <p className="mt-2 text-sm text-red-400">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </section>
    );
  }
}
