import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import EditClientForm from "./edit-client-form";

export const dynamic = "force-dynamic";

type Params = { clientId: string };

export default async function LeadosClientEditPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage([ROLE.KUMERA_MESSAGING, ROLE.LEADOS]);
  const { clientId } = await params;

  const leados = createLeadosServiceClient();
  const { data: client, error } = await leados
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  const [{ data: channel }, { data: userClients }] = await Promise.all([
    leados
      .from("client_channels")
      .select("id, client_id, phone_number_id, waba_id, is_active")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    leados
      .from("user_clients")
      .select("user_id, client_id, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

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

      <EditClientForm client={client} channel={channel ?? null} userClients={(userClients ?? []) as Array<{ user_id: string; client_id: string; created_at: string }>} />
    </div>
  );
}
