import { requireAdminPage, ROLE } from "@/lib/auth";
import BillingAdminClient from "./ui-billing-client";

export const dynamic = "force-dynamic";

export default async function BillingAdminPage() {
  await requireAdminPage([ROLE.BILLING]);
  const legacyAdminUrl = process.env.BILLING_LEGACY_ADMIN_URL || "https://clientes.kumeraweb.com/admin";

  return (
    <BillingAdminClient legacyAdminUrl={legacyAdminUrl} />
  );
}
