import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  clearAdminSessionCookies,
  getAdminFromTokens,
  writeAdminSessionCookies,
} from "@/lib/adminAuth";

function getUnauthorizedApiResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function buildAdminLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl, { status: 307 });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isProtectedAdminPath = isAdminPage || isAdminApi;

  if (isProtectedAdminPath) {
    const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
    const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value;
    const { isAdmin, session } = await getAdminFromTokens({
      accessToken,
      refreshToken,
    });

    if (isAdminLogin) {
      if (isAdmin) {
        const response = NextResponse.redirect(new URL("/admin", request.url), {
          status: 307,
        });
        if (session) {
          writeAdminSessionCookies(response.cookies, session);
        }
        response.headers.set("x-pathname", pathname);
        return response;
      }

      const response = NextResponse.next();
      response.headers.set("x-pathname", pathname);
      return response;
    }

    if (!isAdmin) {
      if (isAdminApi) {
        const response = getUnauthorizedApiResponse();
        clearAdminSessionCookies(response.cookies);
        return response;
      }

      const response = buildAdminLoginRedirect(request);
      clearAdminSessionCookies(response.cookies);
      return response;
    }

    const nextResponse = NextResponse.next();
    if (session) {
      writeAdminSessionCookies(nextResponse.cookies, session);
    }
    nextResponse.headers.set("x-pathname", pathname);
    return nextResponse;
  }

  const nextResponse = NextResponse.next();
  nextResponse.headers.set("x-pathname", pathname);
  return nextResponse;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*", "/onboarding/:path*"],
};
