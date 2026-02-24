import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  isAdminSession,
  signInAdminWithPassword,
  writeAdminSessionCookies,
} from "@/lib/adminAuth";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function loginAction(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");
  const nextValue = formData.get("next");

  const safeNext =
    typeof nextValue === "string" && nextValue.startsWith("/admin")
      ? nextValue
      : "/admin";

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`/admin/login?error=missing&next=${encodeURIComponent(safeNext)}`);
  }

  let authData: Awaited<ReturnType<typeof signInAdminWithPassword>>;
  try {
    authData = await signInAdminWithPassword(email.trim(), password);
  } catch {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  const isAdmin = await isAdminSession(
    authData.session.access_token,
    authData.user.id
  );
  if (!isAdmin) {
    redirect(`/admin/login?error=forbidden&next=${encodeURIComponent(safeNext)}`);
  }

  const cookieStore = await cookies();
  writeAdminSessionCookies(cookieStore, authData.session);
  redirect(safeNext);
}

function getErrorMessage(errorCode: string | undefined) {
  if (errorCode === "forbidden") {
    return "Tu cuenta no tiene permisos de administrador.";
  }
  if (errorCode === "missing") {
    return "Debes ingresar email y contraseña.";
  }
  if (errorCode === "invalid") {
    return "Credenciales inválidas.";
  }
  return null;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextParam = resolvedSearchParams.next;
  const errorParam = resolvedSearchParams.error;

  const safeNext =
    typeof nextParam === "string" && nextParam.startsWith("/admin")
      ? nextParam
      : "/admin";
  const errorMessage =
    typeof errorParam === "string" ? getErrorMessage(errorParam) : null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Ingreso Admin</h1>
        <p className="mt-2 text-sm text-slate-600">
          Accede con tus credenciales de administrador.
        </p>

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={safeNext} />

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
