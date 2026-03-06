"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminBrowserAuthClient } from "@/lib/auth-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let supabase;
    try {
      supabase = createAdminBrowserAuthClient();
    } catch (clientError) {
      setLoading(false);
      setError(clientError instanceof Error ? clientError.message : "No se pudo inicializar auth");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main
      className="grid min-h-screen place-items-center p-6"
      style={{ background: "var(--admin-bg)" }}
    >
      <section
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-black text-white"
            style={{ background: "var(--admin-accent)" }}
          >
            K
          </div>
          <div className="text-center">
            <h1 className="m-0 text-xl font-bold" style={{ color: "var(--admin-text)" }}>
              Kumera Admin
            </h1>
            <p className="m-0 mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Acceso unificado para Billing, TuEjecutiva y Kumera Messaging
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="admin-field">
            <label className="admin-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@kumera.cl"
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              className="admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="admin-alert admin-alert-error">
              <span>{error}</span>
            </div>
          ) : null}

          <button
            className="admin-btn admin-btn-primary mt-1 w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
