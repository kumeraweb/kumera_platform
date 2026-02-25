"use client";

import { FormEvent, useState } from "react";

type Props = {
  token: string;
  paymentId: string;
  disabled?: boolean;
  contractDownloadUrl?: string | null;
};

export function TransferProofForm({ token, paymentId, disabled = false, contractDownloadUrl = null }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setMessage("Selecciona una imagen de comprobante.");
      return;
    }
    if (disabled) {
      setMessage("Primero debes aceptar el contrato para habilitar este paso.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);

      const response = await fetch(`/api/payments/${paymentId}/transfer-proof`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { ok: boolean; error?: { message: string } };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error?.message ?? "No se pudo subir comprobante.");
      } else {
        setMessage("Comprobante enviado. Queda pendiente validación admin.");
        setUploaded(true);
      }
    } catch {
      setMessage("Error inesperado subiendo comprobante.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-sm text-slate-700">
        Comprobante (imagen)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          disabled={disabled}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-slate-700"
        />
      </label>
      <button
        type="submit"
        disabled={loading || disabled}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Subir comprobante"}
      </button>
      {uploaded && contractDownloadUrl ? (
        <a
          href={contractDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Descargar contrato
        </a>
      ) : null}
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
