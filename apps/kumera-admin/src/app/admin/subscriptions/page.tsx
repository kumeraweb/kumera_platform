import { requireAdminPage, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-success", paid: "badge-success", pending: "badge-warning",
    pending_onboarding: "badge-warning", cancelled: "badge-error", draft: "badge-neutral",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}

export default async function SubscriptionsPage() {
  try {
    await requireAdminPage([ROLE.BILLING]);
    const client = createBillingServiceClient();
    const { data, error } = await client
      .from("subscriptions")
      .select("id, service_key, service_subject_id, status, plan_id, period_start, period_end, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    return (
      <div>
        <div className="mb-6">
          <h1 className="section-title" style={{ fontSize: 20 }}>Subscriptions</h1>
          <p className="section-desc">Tabla billing.subscriptions — suscripciones activas y pendientes.</p>
        </div>
        {error ? <div className="admin-alert admin-alert-error mb-4">Error: {error.message}</div> : null}
        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{row.id.slice(0, 8)}…</span></td>
                    <td style={{ fontWeight: 500 }}>{row.service_key}</td>
                    <td><span className="font-mono text-xs">{row.service_subject_id?.slice(0, 8) ?? "-"}…</span></td>
                    <td><StatusBadge status={row.status} /></td>
                    <td><span className="font-mono text-xs">{row.plan_id?.slice(0, 8) ?? "-"}…</span></td>
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
          <h1 className="section-title" style={{ fontSize: 20 }}>Subscriptions</h1>
          <p className="section-desc">Tabla billing.subscriptions</p>
        </div>
        <div className="admin-alert admin-alert-error">Error: {error instanceof Error ? error.message : "Unknown error"}</div>
      </div>
    );
  }
}
