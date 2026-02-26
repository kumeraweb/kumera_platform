"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  paymentId: string;
  disabled?: boolean;
  contractDownloadUrl?: string | null;
  completionUrl?: string | null;
};

export function TransferProofForm({
  token,
  paymentId,
  disabled = false,
  contractDownloadUrl = null,
  completionUrl = null,
}: Props) {
  const router = useRouter();
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
        if (completionUrl) {
          setTimeout(() => {
            router.push(completionUrl);
          }, 900);
        }
      }
    } catch {
      setMessage("Error inesperado subiendo comprobante.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
      <label className="block text-sm font-medium text-gray-700">
        Comprobante de transferencia
        <div className={`mt-2 flex items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 ${disabled ? "border-gray-200 bg-gray-100" : "border-gray-300 bg-white hover:border-emerald-400"}`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            disabled={disabled}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 active:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Subir comprobante"}
      </button>
      {uploaded && contractDownloadUrl ? (
        <a
          href={contractDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 active:bg-gray-100"
        >
          Descargar contrato firmado
        </a>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          {message}
        </p>
      ) : null}
    </form>
  );
}
