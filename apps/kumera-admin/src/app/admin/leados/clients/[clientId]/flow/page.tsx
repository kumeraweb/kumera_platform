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
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <h2 className="m-0 text-base font-bold text-slate-100">PASO 4 · Flujo conversacional · {client.name}</h2>
          <p className="m-0.5 text-xs text-slate-400">Client ID: {client.id}</p>
        </div>
        <Link className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700" href="/admin/leados">
          Volver a LeadOS Admin
        </Link>
      </div>

      <FlowBuilderClient clientId={client.id} />
    </section>
  );
}
