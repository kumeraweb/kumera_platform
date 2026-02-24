import type { Session } from "@supabase/supabase-js";
import { createTuejecutivaAnonClient, createTuejecutivaRlsClient } from "@/lib/db";
import { getServiceAccess } from "@/lib/billingAccess";

export const ADMIN_ACCESS_COOKIE = "te_admin_access_token";
export const ADMIN_REFRESH_COOKIE = "te_admin_refresh_token";
type CookieStore = {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      secure?: boolean;
      maxAge?: number;
    }
  ) => unknown;
};

function createSupabaseAuthClient() {
  return createTuejecutivaAnonClient();
}

function createSupabaseRlsClient(accessToken: string) {
  return createTuejecutivaRlsClient(accessToken);
}

async function isTuejecutivaSubscriptionActive() {
  if (process.env.TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION !== "true") {
    return true;
  }
  const subject = process.env.TUEJECUTIVA_SERVICE_SUBJECT_ID || "default";
  const access = await getServiceAccess({
    serviceKey: "tuejecutiva",
    serviceSubjectId: subject,
  });
  return access.allowed;
}

function secureCookies() {
  return process.env.NODE_ENV === "production";
}

export function writeAdminSessionCookies(
  cookieStore: CookieStore,
  session: Session
) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: secureCookies(),
  };

  cookieStore.set(ADMIN_ACCESS_COOKIE, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in ?? 60 * 60,
  });
  cookieStore.set(ADMIN_REFRESH_COOKIE, session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminSessionCookies(cookieStore: CookieStore) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: secureCookies(),
    maxAge: 0,
  };

  cookieStore.set(ADMIN_ACCESS_COOKIE, "", cookieOptions);
  cookieStore.set(ADMIN_REFRESH_COOKIE, "", cookieOptions);
}

export async function signInAdminWithPassword(email: string, password: string) {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error("No session returned by Supabase Auth");
  }

  return data;
}

async function isUserInAdminsWhitelist(accessToken: string, userId: string) {
  try {
    const supabase = createSupabaseRlsClient(accessToken);
    // Admin authorization is intentionally based on public.admins + auth.uid() + RLS.
    // Do NOT replace with email, ENV, or frontend checks.
    const { data, error } = await supabase
      .from("admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return false;
    }

    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function isAdminSession(accessToken: string, userId: string) {
  try {
    const [isAdmin, hasActiveSubscription] = await Promise.all([
      isUserInAdminsWhitelist(accessToken, userId),
      isTuejecutivaSubscriptionActive(),
    ]);
    return isAdmin && hasActiveSubscription;
  } catch {
    return false;
  }
}

export async function getAdminFromTokens(params: {
  accessToken?: string;
  refreshToken?: string;
}) {
  try {
    const supabase = createSupabaseAuthClient();

    if (params.accessToken) {
      const { data, error } = await supabase.auth.getUser(params.accessToken);
      if (!error && data.user) {
        const isAdmin = await isUserInAdminsWhitelist(
          params.accessToken,
          data.user.id
        );
        return { isAdmin, session: null as Session | null };
      }
    }

    if (params.refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: params.refreshToken,
      });

      if (!error && data.user && data.session) {
        const isAdmin = await isUserInAdminsWhitelist(
          data.session.access_token,
          data.user.id
        );
        return { isAdmin, session: data.session };
      }
    }
  } catch {
    return { isAdmin: false, session: null as Session | null };
  }

  return { isAdmin: false, session: null as Session | null };
}
