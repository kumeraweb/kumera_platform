"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  contractId: string;
};

export function ContractAcceptForm({ token, contractId }: Props) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRut, setSignerRut] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function postAccept(timeoutMs: number, traceId: string) {
    console.log("[billing-signature] starting request", { traceId, timeoutMs, contractId });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`/api/contracts/${contractId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kumera-trace-id": traceId },
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({
          token,
          accepted: true,
          signerName: signerName.trim(),
          signerRut: signerRut.trim(),
          signerEmail: signerEmail.trim().toLowerCase(),
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: { message: string } };
      console.log("[billing-signature] response received", {
        traceId,
        status: response.status,
        ok: response.ok,
        payload,
      });
      return { response, payload };
    } finally {
      clearTimeout(timeoutId);
    }
  }

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
    const traceId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    console.log("[billing-signature] submit", {
      traceId,
      contractId,
      signerName: signerName.trim(),
      signerRut: signerRut.trim(),
      signerEmail: signerEmail.trim().toLowerCase(),
    });

    try {
      const firstAttempt = await postAccept(15000, traceId);
      if (!firstAttempt.response.ok || !firstAttempt.payload.ok) {
        setMessage(
          firstAttempt.payload.error?.message ??
            `No se pudo registrar aceptación (HTTP ${firstAttempt.response.status}, trace ${traceId}).`,
        );
      } else {
        setMessage("Contrato aceptado correctamente.");
        console.log("[billing-signature] accepted on first attempt", { traceId });
        router.refresh();
      }
    } catch (error: unknown) {
      console.log("[billing-signature] first attempt error", {
        traceId,
        errorName: error instanceof Error ? error.name : typeof error,
      });
      if (error instanceof Error && error.name === "AbortError") {
        setMessage(`La firma tardó más de 15s. Reintentando automáticamente... (trace ${traceId})`);
        try {
          const secondAttempt = await postAccept(30000, traceId);
          if (!secondAttempt.response.ok || !secondAttempt.payload.ok) {
            setMessage(
              secondAttempt.payload.error?.message ??
                `No se pudo registrar aceptación tras reintento (HTTP ${secondAttempt.response.status}, trace ${traceId}).`,
            );
          } else {
            setMessage("Contrato aceptado correctamente.");
            console.log("[billing-signature] accepted on second attempt", { traceId });
            router.refresh();
          }
        } catch (secondError: unknown) {
          console.log("[billing-signature] second attempt error", {
            traceId,
            errorName: secondError instanceof Error ? secondError.name : typeof secondError,
          });
          setMessage(`No se recibió respuesta del servidor al firmar (trace ${traceId}). Intenta nuevamente.`);
        }
      } else {
        setMessage(`No se pudo conectar con el servidor al firmar (trace ${traceId}). Intenta nuevamente.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
      <p className="text-sm font-medium text-gray-700">Datos del firmante</p>
      <input
        type="text"
        value={signerName}
        onChange={(event) => setSignerName(event.target.value)}
        placeholder="Nombre completo firmante"
        className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
        required
      />
      <input
        type="text"
        value={signerRut}
        onChange={(event) => setSignerRut(event.target.value)}
        placeholder="RUT firmante (ej: 16370698-9)"
        className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
        required
      />
      <input
        type="email"
        value={signerEmail}
        onChange={(event) => setSignerEmail(event.target.value)}
        placeholder="Correo firmante"
        className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
        required
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-600"
        />
        Declaro que revisé y acepto el contrato de servicio.
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 active:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Firmando..." : "Aceptar contrato"}
      </button>
      {message ? (
        <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          {message}
        </p>
      ) : null}
    </form>
  );
}
