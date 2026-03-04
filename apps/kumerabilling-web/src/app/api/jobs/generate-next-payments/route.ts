import { NextRequest } from "next/server";
import { getCronSecret } from "@/lib/env";
import { fail, ok } from "@/lib/http";

function isAuthorized(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header) return false;
  return header === `Bearer ${getCronSecret()}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return fail(401, "UNAUTHORIZED", "Invalid CRON secret");
  }

  // Next pending payments are now created in admin validation flow to avoid duplicates.
  return ok({
    created: 0,
    skipped: true,
    reason: "handled_in_admin_payment_validation",
  });
}
