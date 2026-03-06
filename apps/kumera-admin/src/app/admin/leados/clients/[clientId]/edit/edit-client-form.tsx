"use client";

import { FormEvent, useState } from "react";
import { DEFAULT_LEADOS_TEMPLATES } from "../../../templates";

type ClientRow = {
  id: string;
  name: string;
  notification_email: string;
  score_threshold: number;
  human_forward_number: string | null;
  priority_contact_email: string | null;
  human_required_message_template: string | null;
  close_client_no_response_template: string | null;
  close_attended_other_line_template: string | null;
};

export default function EditClientForm({ client }: { client: ClientRow }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    notification_email: client.notification_email ?? "",
    human_forward_number: client.human_forward_number ?? "",
    priority_contact_email: client.priority_contact_email ?? "",
    human_required_message_template: client.human_required_message_template ?? "",
    close_client_no_response_template: client.close_client_no_response_template ?? "",
    close_attended_other_line_template: client.close_attended_other_line_template ?? "",
    score_threshold: client.score_threshold,
  });

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/kumeramessaging/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar cliente");
      return;
    }

    setMessage("Cliente actualizado correctamente.");
  }

  function applyDefaultTemplates() {
    setForm((prev) => ({ ...prev, ...DEFAULT_LEADOS_TEMPLATES }));
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <form className="admin-card" onSubmit={onSave}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Editar cliente</h2>
            <p className="mt-1 text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>
              {client.name} · {client.id}
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={applyDefaultTemplates}>
            Aplicar template base
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Email notificación</label>
            <input className="admin-input" type="email" value={form.notification_email} onChange={(e) => setForm((v) => ({ ...v, notification_email: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Teléfono reenvío humano</label>
            <input className="admin-input" value={form.human_forward_number} onChange={(e) => setForm((v) => ({ ...v, human_forward_number: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Email contacto prioritario</label>
            <input className="admin-input" type="email" value={form.priority_contact_email} onChange={(e) => setForm((v) => ({ ...v, priority_contact_email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Score threshold</label>
            <input className="admin-input" type="number" min={0} max={100} value={form.score_threshold} onChange={(e) => setForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))} required />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template HUMAN_REQUIRED</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={form.human_required_message_template} onChange={(e) => setForm((v) => ({ ...v, human_required_message_template: e.target.value }))} />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: cliente no responde</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={form.close_client_no_response_template} onChange={(e) => setForm((v) => ({ ...v, close_client_no_response_template: e.target.value }))} />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: atendido en otra línea</label>
            <textarea className="admin-input min-h-24" placeholder="Usa {priority_phone} y {priority_email}" value={form.close_attended_other_line_template} onChange={(e) => setForm((v) => ({ ...v, close_attended_other_line_template: e.target.value }))} />
          </div>
        </div>

        <button className="admin-btn admin-btn-primary mt-4" type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}
