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
    <div>
      <div className="mb-6">
        <h1 className="section-title" style={{ fontSize: 20 }}>LeadOS</h1>
        <p className="section-desc">Gestión centralizada de clientes, usuarios, canales y flujos conversacionales.</p>
      </div>
      {error ? <div className="admin-alert admin-alert-error mb-4">Error loading clients: {error.message}</div> : null}
      <LeadosAdminClient initialClients={data ?? []} />
    </div>
  );
}
