"use client";

import { FormEvent, useState } from "react";

type Props = {
  token: string;
  subscriptionId: string;
};

export function ContractAcceptForm({ token, subscriptionId }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRut, setSignerRut] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!accepted) {
      setMessage("Debes aceptar el contrato para continuar.");
      return;
    }
    if (!signerName.trim() || !signerRut.trim() || !signerEmail.trim()) {
      setMessage("Completa nombre, RUT y correo del firmante.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/contracts/${subscriptionId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accepted: true,
          signerName: signerName.trim(),
          signerRut: signerRut.trim(),
          signerEmail: signerEmail.trim().toLowerCase(),
        }),
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
      <input
        type="text"
        value={signerName}
        onChange={(event) => setSignerName(event.target.value)}
        placeholder="Nombre completo firmante"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        required
      />
      <input
        type="text"
        value={signerRut}
        onChange={(event) => setSignerRut(event.target.value)}
        placeholder="RUT firmante (ej: 16370698-9)"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        required
      />
      <input
        type="email"
        value={signerEmail}
        onChange={(event) => setSignerEmail(event.target.value)}
        placeholder="Correo firmante"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        required
      />
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
