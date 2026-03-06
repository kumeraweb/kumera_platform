import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getKumeraAdminUrl() {
  return (
    process.env.KUMERA_ADMIN_URL || "https://kumera-platform-kumera-admin.vercel.app"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/backoffice")) {
    return NextResponse.json(
      {
        error:
          "Legacy backoffice API disabled. Use kumera-admin (/admin/kumeramessaging).",
      },
      { status: 410 }
    );
  }

  if (pathname.startsWith("/backoffice")) {
    const target = new URL("/admin/kumeramessaging?legacy=leados_backoffice_disabled", getKumeraAdminUrl());
    return NextResponse.redirect(target, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/backoffice/:path*", "/api/backoffice/:path*"],
};
