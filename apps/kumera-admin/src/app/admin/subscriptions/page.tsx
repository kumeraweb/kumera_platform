import { createBillingAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  try {
    const client = createBillingAdminClient();
    const { data, error } = await client
      .from("subscriptions")
      .select("id, service_key, service_subject_id, status, plan_code, period_start, period_end, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    return (
      <section className="card">
        <h2>Billing Subscriptions (billing.subscriptions)</h2>
        {error ? <p>Error: {error.message}</p> : null}
        <table className="table">
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
                <td>{row.id}</td>
                <td>{row.service_key}</td>
                <td>{row.service_subject_id}</td>
                <td>{row.status}</td>
                <td>{row.plan_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  } catch (error) {
    return (
      <section className="card">
        <h2>Billing Subscriptions (billing.subscriptions)</h2>
        <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </section>
    );
  }
}
