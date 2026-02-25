import { requireAdminPage, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import LeadosAdminClient from "./ui-client";

export const dynamic = "force-dynamic";

export default async function LeadosAdminPage() {
  await requireAdminPage([ROLE.LEADOS]);
  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("clients")
    .select("id, name, notification_email, score_threshold, human_forward_number, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="m-0 text-base font-bold text-slate-100">LeadOS Admin (centralizado)</h2>
      {error ? <p className="mt-2 text-sm text-red-400">Error loading clients: {error.message}</p> : null}
      <LeadosAdminClient initialClients={data ?? []} />
    </section>
  );
}
