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
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="m-0 text-base font-bold">Billing Subscriptions (billing.subscriptions)</h2>
        {error ? <p className="mt-2 text-sm text-red-700">Error: {error.message}</p> : null}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">ID</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Service</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Subject</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Status</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Plan</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="border-b border-slate-100 px-2 py-2">{row.id}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.service_key}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.service_subject_id}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.status}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.plan_id}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="m-0 text-base font-bold">Billing Subscriptions (billing.subscriptions)</h2>
        <p className="mt-2 text-sm text-red-700">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </section>
    );
  }
}
