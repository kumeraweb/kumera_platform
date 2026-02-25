import { requireAdminPage, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

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
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Billing Subscriptions (billing.subscriptions)</h2>
        {error ? <p className="mt-2 text-sm text-red-400">Error: {error.message}</p> : null}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">ID</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Service</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Subject</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Status</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Plan</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.id}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.service_key}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.service_subject_id}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.status}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.plan_id}</td>
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
        <h2 className="m-0 text-base font-bold text-slate-100">Billing Subscriptions (billing.subscriptions)</h2>
        <p className="mt-2 text-sm text-red-400">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </section>
    );
  }
}
