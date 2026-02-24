import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Kumera Admin"'
    }
  });
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const pass = process.env.ADMIN_BASIC_AUTH_PASS;

  // Fail closed: if credentials are not configured, deny access.
  if (!user || !pass) {
    return new NextResponse("Admin auth is not configured", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return unauthorizedResponse();
  }

  const reqUser = decoded.slice(0, separatorIndex);
  const reqPass = decoded.slice(separatorIndex + 1);

  if (reqUser !== user || reqPass !== pass) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
