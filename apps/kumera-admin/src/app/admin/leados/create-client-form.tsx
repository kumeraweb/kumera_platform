"use client";

import { FormEvent, useState } from "react";
import { DEFAULT_LEADOS_TEMPLATES } from "./templates";

export default function LeadosCreateClientForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    notification_email: "",
    human_forward_number: "",
    priority_contact_email: "",
    human_required_message_template: "",
    close_client_no_response_template: "",
    close_attended_other_line_template: "",
    score_threshold: 85,
    phone_number_id: "",
    waba_id: "",
    meta_access_token: "",
    meta_app_secret: "",
    assign_to_current_user: true,
  });

  async function onCreateClient(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/kumeramessaging/onboard-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...clientForm, strategic_questions: [] }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear cliente");
      return;
    }

    setClientForm({
      name: "",
      notification_email: "",
      human_forward_number: "",
      priority_contact_email: "",
      human_required_message_template: "",
      close_client_no_response_template: "",
      close_attended_other_line_template: "",
      score_threshold: 85,
      phone_number_id: "",
      waba_id: "",
      meta_access_token: "",
      meta_app_secret: "",
      assign_to_current_user: true,
    });
    setMessage("Cliente, canal y asignación creados. Ahora puedes ir a Clientes activos para editar o crear flujo.");
  }

  function applyDefaultTemplates() {
    setClientForm((prev) => ({ ...prev, ...DEFAULT_LEADOS_TEMPLATES }));
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <form className="admin-card" onSubmit={onCreateClient}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="badge badge-accent">ALTA INTERNA</span>
            <h2 className="section-title">Crear cliente operativo Kumera Messaging</h2>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={applyDefaultTemplates}
          >
            Aplicar template base
          </button>
        </div>

        <p className="section-desc mb-4">
          Este formulario crea el cliente, cifra el canal WhatsApp con la clave actual y asigna el cliente al usuario actual.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Nombre cliente</label>
            <input className="admin-input" value={clientForm.name} onChange={(e) => setClientForm((v) => ({ ...v, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Email notificación</label>
            <input className="admin-input" type="email" value={clientForm.notification_email} onChange={(e) => setClientForm((v) => ({ ...v, notification_email: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Teléfono reenvío humano</label>
            <input className="admin-input" value={clientForm.human_forward_number} onChange={(e) => setClientForm((v) => ({ ...v, human_forward_number: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Email contacto prioritario</label>
            <input className="admin-input" type="email" value={clientForm.priority_contact_email} onChange={(e) => setClientForm((v) => ({ ...v, priority_contact_email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Score threshold</label>
            <input className="admin-input" type="number" min={0} max={100} value={clientForm.score_threshold} onChange={(e) => setClientForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Meta Phone Number ID (webhook)</label>
            <input className="admin-input" value={clientForm.phone_number_id} onChange={(e) => setClientForm((v) => ({ ...v, phone_number_id: e.target.value }))} required />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Debe coincidir exactamente con <span className="font-mono">metadata.phone_number_id</span> que llega desde Meta en el webhook. Ejemplo: <span className="font-mono">995622260298959</span>.
            </p>
          </div>
          <div className="admin-field">
            <label className="admin-label">WhatsApp Business Account ID (WABA ID)</label>
            <input className="admin-input" value={clientForm.waba_id} onChange={(e) => setClientForm((v) => ({ ...v, waba_id: e.target.value }))} />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Identificador de la cuenta de WhatsApp Business. No reemplaza al Phone Number ID.
            </p>
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Meta Access Token</label>
            <textarea className="admin-input min-h-24" value={clientForm.meta_access_token} onChange={(e) => setClientForm((v) => ({ ...v, meta_access_token: e.target.value }))} required />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Token operativo del número/cuenta conectado a la app de Meta que enviará mensajes por WhatsApp Cloud API.
            </p>
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Meta App Secret</label>
            <input className="admin-input" type="password" value={clientForm.meta_app_secret} onChange={(e) => setClientForm((v) => ({ ...v, meta_app_secret: e.target.value }))} required />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Se obtiene desde la app en <span className="font-mono">developers.facebook.com</span> y se usa para validar la firma del webhook.
            </p>
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template HUMAN_REQUIRED</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={clientForm.human_required_message_template} onChange={(e) => setClientForm((v) => ({ ...v, human_required_message_template: e.target.value }))} />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: cliente no responde</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={clientForm.close_client_no_response_template} onChange={(e) => setClientForm((v) => ({ ...v, close_client_no_response_template: e.target.value }))} />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: atendido en otra línea</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={clientForm.close_attended_other_line_template} onChange={(e) => setClientForm((v) => ({ ...v, close_attended_other_line_template: e.target.value }))} />
          </div>
          <label className="admin-field md:col-span-2 flex items-center gap-3 rounded-lg border px-3 py-3" style={{ borderColor: "var(--admin-border)" }}>
            <input
              type="checkbox"
              checked={clientForm.assign_to_current_user}
              onChange={(e) => setClientForm((v) => ({ ...v, assign_to_current_user: e.target.checked }))}
            />
            <div>
              <div className="admin-label" style={{ marginBottom: 2 }}>Asignación</div>
              <div style={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                Asignar automáticamente este cliente al usuario actual para operación y pruebas.
              </div>
            </div>
          </label>
        </div>

        <button className="admin-btn admin-btn-primary mt-4" type="submit">Crear cliente operativo</button>
      </form>
    </div>
  );
}
