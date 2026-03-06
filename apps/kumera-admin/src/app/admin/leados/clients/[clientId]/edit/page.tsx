import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import EditClientForm from "./edit-client-form";

export const dynamic = "force-dynamic";

type Params = { clientId: string };

export default async function LeadosClientEditPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage([ROLE.LEADOS]);
  const { clientId } = await params;

  const leados = createLeadosServiceClient();
  const { data: client, error } = await leados
    .from("clients")
    .select(
      "id, name, notification_email, score_threshold, human_forward_number, priority_contact_email, human_required_message_template, close_client_no_response_template, close_attended_other_line_template"
    )
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="grid gap-5">
      <div className="admin-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Configuración de cliente</h2>
          <p className="section-desc">Edita datos y templates sin salir del flujo de clientes.</p>
        </div>
        <div className="flex gap-2">
          <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href="/admin/kumeramessaging/clients">
            ← Volver a clientes
          </Link>
          <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href={`/admin/kumeramessaging/clients/${client.id}/flow`}>
            Ir a flujo
          </Link>
        </div>
      </div>

      <EditClientForm client={client} />
    </div>
  );
}
