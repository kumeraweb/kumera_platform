import { NextResponse } from "next/server";
import { createAdminServerAuthClient } from "@/lib/auth-server";

export async function POST(request: Request) {
  const supabase = await createAdminServerAuthClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
