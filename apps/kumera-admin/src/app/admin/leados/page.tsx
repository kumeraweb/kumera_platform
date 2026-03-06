import { requireAdminPage, ROLE } from "@/lib/auth";
import LeadosCreateClientForm from "./create-client-form";

export const dynamic = "force-dynamic";

export default async function LeadosAdminPage() {
  await requireAdminPage([ROLE.KUMERA_MESSAGING, ROLE.LEADOS]);

  return (
    <LeadosCreateClientForm />
  );
}
