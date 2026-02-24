import { NextResponse } from "next/server";
import { clearAdminSessionCookies } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const url = new URL("/admin/login", request.url);
  const response = NextResponse.redirect(url, { status: 303 });
  clearAdminSessionCookies(response.cookies);
  return response;
}
