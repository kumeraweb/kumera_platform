import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createCoreServiceClient } from "@/lib/db";
import { createAdminServerAuthClient } from "@/lib/auth-server";

export type GlobalRole = "superadmin" | "admin_billing" | "admin_tuejecutiva" | "admin_leados";

export const ROLE = {
  SUPERADMIN: "superadmin" as GlobalRole,
  BILLING: "admin_billing" as GlobalRole,
  TUEJECUTIVA: "admin_tuejecutiva" as GlobalRole,
  LEADOS: "admin_leados" as GlobalRole,
};

async function getUserRoles(userId: string): Promise<GlobalRole[]> {
  const core = createCoreServiceClient();
  const { data, error } = await core
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.role as GlobalRole);
}

function hasAnyRequiredRole(userRoles: GlobalRole[], required: GlobalRole[]) {
  if (userRoles.includes(ROLE.SUPERADMIN)) return true;
  return required.some((role) => userRoles.includes(role));
}

export async function requireAdminPage(requiredRoles: GlobalRole[] = []) {
  const auth = await createAdminServerAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const roles = await getUserRoles(user.id);
  if (requiredRoles.length > 0 && !hasAnyRequiredRole(roles, requiredRoles)) {
    redirect("/forbidden");
  }

  return { user, roles };
}

export async function requireAdminApi(requiredRoles: GlobalRole[] = []) {
  try {
    const auth = await createAdminServerAuthClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const roles = await getUserRoles(user.id);
    if (requiredRoles.length > 0 && !hasAnyRequiredRole(roles, requiredRoles)) {
      return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { ok: true as const, user, roles };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth check failed";
    return { ok: false as const, response: NextResponse.json({ error: message }, { status: 500 }) };
  }
}
