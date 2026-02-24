"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export default function LeadFormClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const name = String(data.name ?? "").trim();
    const phoneRaw = String(data.phone ?? "").trim();
    const phone = normalizePhone(phoneRaw);
    const email = String(data.email ?? "").trim();

    if (!phone && !email) {
      setIsSubmitting(false);
      setError("Ingresa teléfono o correo para poder contactarte.");
      return;
    }

    if (phone && (phone.length < 8 || phone.length > 9)) {
      setIsSubmitting(false);
      setError("Ingresa un número válido de 8 o 9 dígitos.");
      return;
    }

    try {
      const payload = new FormData();
      payload.set("nombre", name);
      payload.set("telefono", phone ? `+56${phone}` : "");
      payload.set("email", email);

      const response = await fetch("/api/contact", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "No pudimos enviar tu postulación.");
      }

      setIsSubmitted(true);
      form.reset();
      setTimeout(() => {
        router.push("/postular/gracias");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white px-6 py-12 shadow-xl rounded-2xl border border-gray-100">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-900">Inicia tu postulación</h3>
        <p className="text-sm text-slate-500 mt-2">
          Déjanos tus datos y te contactamos. Solo necesitas teléfono o correo.
        </p>
      </div>

      <form id="lead-form" className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold leading-6 text-slate-900"
          >
            Nombre completo
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Ej. María Pérez"
              className="block w-full rounded-lg border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold leading-6 text-slate-900"
          >
            Teléfono (WhatsApp)
          </label>
          <div className="mt-2 flex items-center rounded-lg ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-emerald-600">
            <span className="px-3 text-sm text-slate-700 border-r border-gray-200">
              +56
            </span>
            <input
              type="tel"
              name="phone"
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[0-9]{8,9}"
              placeholder="931478612"
              className="block w-full rounded-r-lg border-0 px-3.5 py-2 text-slate-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Sin espacios ni símbolos.</p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold leading-6 text-slate-900"
          >
            Correo electrónico
          </label>
          <div className="mt-2">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="contacto@ejemplo.com"
              className="block w-full rounded-lg border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="pt-4">
          <div
            id="status-message"
            className={`text-sm font-medium text-emerald-600 mb-3 text-center bg-emerald-50 p-2 rounded-lg ${
              isSubmitted ? "" : "hidden"
            }`}
          >
            ¡Solicitud recibida! Te contactaremos pronto.
          </div>
          {error ? (
            <div className="text-sm font-medium text-rose-600 mb-3 text-center bg-rose-50 p-2 rounded-lg">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            id="submit-btn"
            disabled={isSubmitting}
            className={`block w-full rounded-lg px-3.5 py-2.5 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors ${
              isSubmitted
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isSubmitting ? "Enviando..." : isSubmitted ? "Enviado" : "Postular Ahora"}
          </button>
        </div>
      </form>
    </div>
  );
}
