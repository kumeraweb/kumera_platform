import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import FlowBuilderClient from "./ui-flow-builder";

export const dynamic = "force-dynamic";

type Params = { clientId: string };

export default async function LeadosClientFlowPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage([ROLE.LEADOS]);
  const { clientId } = await params;

  const leados = createLeadosServiceClient();
  const { data: client, error } = await leados
    .from("clients")
    .select("id, name, notification_email")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="grid gap-5">
      <div
        className="admin-card flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="badge badge-accent">PASO 4</span>
            <h1 className="section-title">Flujo conversacional</h1>
          </div>
          <p className="mt-1 text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>
            {client.name} · {client.id}
          </p>
        </div>
        <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href="/admin/kumeramessaging/clients">
          ← Volver a clientes
        </Link>
      </div>

      <FlowBuilderClient clientId={client.id} />
    </div>
  );
}
