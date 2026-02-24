"use client";

import { FormEvent, useState } from "react";

type Props = {
  token: string;
  subscriptionId: string;
};

export function ContractAcceptForm({ token, subscriptionId }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!accepted) {
      setMessage("Debes aceptar el contrato para continuar.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/contracts/${subscriptionId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accepted: true }),
      });

      const payload = (await response.json()) as { ok: boolean; error?: { message: string } };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error?.message ?? "No se pudo registrar aceptación.");
      } else {
        setMessage("Contrato aceptado correctamente.");
      }
    } catch {
      setMessage("Error inesperado aceptando contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1"
        />
        Declaro que revisé y acepto el contrato de servicio.
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Aceptar contrato"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
