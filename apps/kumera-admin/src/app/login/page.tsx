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
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-100">Kumera Admin Login</h1>
        <p className="mt-2 text-sm text-slate-400">Acceso unificado para operación de Billing, Tuejecutiva y LeadOS.</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm text-slate-300">
            Email
            <input
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-300">
            Contraseña
            <input
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-60" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
