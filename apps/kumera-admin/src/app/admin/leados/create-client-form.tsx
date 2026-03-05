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
  });

  async function onCreateClient(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/leados/clients", {
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
    });
    setMessage("Cliente creado. Ahora puedes ir a Clientes activos para editar o crear flujo.");
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
            <span className="badge badge-accent">PASO 1</span>
            <h2 className="section-title">Crear cliente LeadOS</h2>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={applyDefaultTemplates}
          >
            Aplicar template base
          </button>
        </div>

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
        </div>

        <button className="admin-btn admin-btn-primary mt-4" type="submit">Crear cliente</button>
      </form>
    </div>
  );
}
