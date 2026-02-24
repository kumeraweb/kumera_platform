import { NextResponse } from "next/server";
import { createOnboardingToken } from "@/lib/onboarding";

function parseExpiresInDays(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return 7;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 7;
  return Math.min(Math.max(parsed, 1), 30);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" && emailValue.trim().length > 0
      ? emailValue.trim()
      : null;
  const expiresInDays = parseExpiresInDays(formData.get("expires_in_days"));

  const result = await createOnboardingToken({ email, expiresInDays });

  const url = new URL("/admin", request.url);
  url.searchParams.set("token", result.token.token);
  url.searchParams.set("expires_at", result.token.expires_at);
  if (result.token.email) {
    url.searchParams.set("email", result.token.email);
  }
  url.searchParams.set("reused", result.reused ? "1" : "0");

  return NextResponse.redirect(url, { status: 303 });
}
