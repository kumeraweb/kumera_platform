"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
  created_at: string;
};

type Props = {
  initialClients: ClientRow[];
};

const DEFAULT_LEADOS_TEMPLATES = {
  human_required_message_template:
    "Muchas gracias. En unos minutos un ejecutivo tomara la conversacion. Si necesitas con urgencia tener respuesta puedes escribirnos ya mismo al {priority_phone} donde te atenderemos de manera prioritaria. Tambien puedes escribirnos a {priority_email}.",
  close_client_no_response_template:
    "Gracias por contactarnos. Esta conversacion sera finalizada por falta de respuesta. Si tienes cualquier duda puedes escribirnos con prioridad al {priority_phone} o enviarnos un correo a {priority_email}.",
  close_attended_other_line_template:
    "Tu contacto esta siendo atendido en nuestra linea prioritaria. Muchas gracias por contactarnos.",
};

export default function LeadosAdminClient({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients);
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
  const [editingClientId, setEditingClientId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    notification_email: "",
    human_forward_number: "",
    priority_contact_email: "",
    human_required_message_template: "",
    close_client_no_response_template: "",
    close_attended_other_line_template: "",
    score_threshold: 85,
  });

  const [assignForm, setAssignForm] = useState({
    user_id: "",
    client_id: "",
  });

  const [channelForm, setChannelForm] = useState({
    client_id: "",
    phone_number_id: "",
    waba_id: "",
    meta_access_token: "",
    meta_app_secret: "",
    is_active: true,
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

    setClients((prev) => [payload.client, ...prev]);
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
    setMessage("Cliente creado.");
  }

  function onStartEdit(clientId: string) {
    const found = clients.find((client) => client.id === clientId);
    if (!found) return;
    setEditingClientId(clientId);
    setEditForm({
      notification_email: found.notification_email ?? "",
      human_forward_number: found.human_forward_number ?? "",
      priority_contact_email: found.priority_contact_email ?? "",
      human_required_message_template: found.human_required_message_template ?? "",
      close_client_no_response_template: found.close_client_no_response_template ?? "",
      close_attended_other_line_template: found.close_attended_other_line_template ?? "",
      score_threshold: found.score_threshold,
    });
  }

  async function onSaveEditClient(event: FormEvent) {
    event.preventDefault();
    if (!editingClientId) return;
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/leados/clients/${editingClientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar cliente");
      return;
    }

    setClients((prev) =>
      prev.map((client) => (client.id === editingClientId ? payload.client : client))
    );
    setMessage("Cliente actualizado.");
  }

  async function onAssignUser(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/leados/user-clients/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo asignar usuario");
      return;
    }
    setAssignForm({ user_id: "", client_id: "" });
    setMessage("Usuario asignado al tenant.");
  }

  async function onCreateChannel(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/leados/client-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(channelForm),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear canal");
      return;
    }
    setChannelForm({
      client_id: "",
      phone_number_id: "",
      waba_id: "",
      meta_access_token: "",
      meta_app_secret: "",
      is_active: true,
    });
    setMessage("Canal creado.");
  }

  function applyDefaultTemplatesToCreate() {
    setClientForm((prev) => ({
      ...prev,
      ...DEFAULT_LEADOS_TEMPLATES,
    }));
  }

  function applyDefaultTemplatesToEdit() {
    setEditForm((prev) => ({
      ...prev,
      ...DEFAULT_LEADOS_TEMPLATES,
    }));
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      {/* ─── Clients table ─── */}
      <div className="admin-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">Clientes</h2>
          <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Orden: PASO 1 cliente → PASO 2 usuario → PASO 3 canal → PASO 4 flujo</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Score</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((row) => (
                <tr key={row.id}>
                  <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{row.id.slice(0, 8)}…</span></td>
                  <td style={{ fontWeight: 500 }}>{row.name}</td>
                  <td>{row.notification_email}</td>
                  <td><span className="badge badge-accent">{row.score_threshold}</span></td>
                  <td>
                    <Link className="admin-btn admin-btn-secondary admin-btn-sm no-underline" href={`/admin/leados/clients/${row.id}/flow`}>
                      Gestionar flujo
                    </Link>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm ml-2"
                      onClick={() => onStartEdit(row.id)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── PASO 1: Create client ─── */}
      <form className="admin-card" onSubmit={onCreateClient}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <span className="badge badge-accent">PASO 1</span>
          <h2 className="section-title">Crear cliente LeadOS</h2>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={applyDefaultTemplatesToCreate}
          >
            Aplicar template base
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Nombre cliente</label>
            <input className="admin-input" placeholder="Nombre cliente" value={clientForm.name} onChange={(e) => setClientForm((v) => ({ ...v, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Email notificación</label>
            <input className="admin-input" type="email" placeholder="notification@cliente.com" value={clientForm.notification_email} onChange={(e) => setClientForm((v) => ({ ...v, notification_email: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Teléfono reenvío humano</label>
            <input className="admin-input" placeholder="+56912345678" value={clientForm.human_forward_number} onChange={(e) => setClientForm((v) => ({ ...v, human_forward_number: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Email contacto prioritario</label>
            <input className="admin-input" type="email" placeholder="contacto@cliente.com" value={clientForm.priority_contact_email} onChange={(e) => setClientForm((v) => ({ ...v, priority_contact_email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Score threshold</label>
            <input className="admin-input" type="number" min={0} max={100} value={clientForm.score_threshold} onChange={(e) => setClientForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))} required />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template HUMAN_REQUIRED</label>
            <textarea
              className="admin-input min-h-24"
              placeholder="Usa {priority_phone} y {priority_email}"
              value={clientForm.human_required_message_template}
              onChange={(e) => setClientForm((v) => ({ ...v, human_required_message_template: e.target.value }))}
            />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: cliente no responde</label>
            <textarea
              className="admin-input min-h-24"
              placeholder="Usa {priority_phone} y {priority_email}"
              value={clientForm.close_client_no_response_template}
              onChange={(e) => setClientForm((v) => ({ ...v, close_client_no_response_template: e.target.value }))}
            />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Template cierre: atendido en otra línea</label>
            <textarea
              className="admin-input min-h-24"
              placeholder="Usa {priority_phone} y {priority_email}"
              value={clientForm.close_attended_other_line_template}
              onChange={(e) => setClientForm((v) => ({ ...v, close_attended_other_line_template: e.target.value }))}
            />
          </div>
        </div>
        <button className="admin-btn admin-btn-primary mt-4" type="submit">Crear cliente</button>
      </form>

      {/* ─── Edit client config ─── */}
      {editingClientId ? (
        <form className="admin-card" onSubmit={onSaveEditClient}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="badge badge-accent">EDIT</span>
              <h2 className="section-title">Editar configuración cliente</h2>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={applyDefaultTemplatesToEdit}
            >
              Aplicar template base
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="admin-field">
              <label className="admin-label">Email notificación</label>
              <input className="admin-input" type="email" value={editForm.notification_email} onChange={(e) => setEditForm((v) => ({ ...v, notification_email: e.target.value }))} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Teléfono reenvío humano</label>
              <input className="admin-input" value={editForm.human_forward_number} onChange={(e) => setEditForm((v) => ({ ...v, human_forward_number: e.target.value }))} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Email contacto prioritario</label>
              <input className="admin-input" type="email" value={editForm.priority_contact_email} onChange={(e) => setEditForm((v) => ({ ...v, priority_contact_email: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Score threshold</label>
              <input className="admin-input" type="number" min={0} max={100} value={editForm.score_threshold} onChange={(e) => setEditForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))} required />
            </div>
            <div className="admin-field md:col-span-2">
              <label className="admin-label">Template HUMAN_REQUIRED</label>
              <textarea className="admin-input min-h-24" value={editForm.human_required_message_template} onChange={(e) => setEditForm((v) => ({ ...v, human_required_message_template: e.target.value }))} />
            </div>
            <div className="admin-field md:col-span-2">
              <label className="admin-label">Template cierre: cliente no responde</label>
              <textarea className="admin-input min-h-24" value={editForm.close_client_no_response_template} onChange={(e) => setEditForm((v) => ({ ...v, close_client_no_response_template: e.target.value }))} />
            </div>
            <div className="admin-field md:col-span-2">
              <label className="admin-label">Template cierre: atendido en otra línea</label>
              <textarea className="admin-input min-h-24" value={editForm.close_attended_other_line_template} onChange={(e) => setEditForm((v) => ({ ...v, close_attended_other_line_template: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="admin-btn admin-btn-primary" type="submit">Guardar cambios</button>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setEditingClientId("")}>Cancelar</button>
          </div>
        </form>
      ) : null}

      {/* ─── PASO 2: Assign user ─── */}
      <form className="admin-card" onSubmit={onAssignUser}>
        <div className="mb-4 flex items-center gap-3">
          <span className="badge badge-accent">PASO 2</span>
          <h2 className="section-title">Asignar usuario a tenant</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">User ID (UUID)</label>
            <input className="admin-input" placeholder="user_id (uuid)" value={assignForm.user_id} onChange={(e) => setAssignForm((v) => ({ ...v, user_id: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Client ID (UUID)</label>
            <input className="admin-input" placeholder="client_id (uuid)" value={assignForm.client_id} onChange={(e) => setAssignForm((v) => ({ ...v, client_id: e.target.value }))} required />
          </div>
        </div>
        <button className="admin-btn admin-btn-primary mt-4" type="submit">Asignar</button>
      </form>

      {/* ─── PASO 3: Create channel ─── */}
      <form className="admin-card" onSubmit={onCreateChannel}>
        <div className="mb-4 flex items-center gap-3">
          <span className="badge badge-accent">PASO 3</span>
          <h2 className="section-title">Crear canal WhatsApp</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Client ID (UUID)</label>
            <input className="admin-input" placeholder="client_id (uuid)" value={channelForm.client_id} onChange={(e) => setChannelForm((v) => ({ ...v, client_id: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Phone Number ID</label>
            <input className="admin-input" placeholder="phone_number_id" value={channelForm.phone_number_id} onChange={(e) => setChannelForm((v) => ({ ...v, phone_number_id: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">WABA ID (opcional)</label>
            <input className="admin-input" placeholder="waba_id" value={channelForm.waba_id} onChange={(e) => setChannelForm((v) => ({ ...v, waba_id: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Meta Access Token</label>
            <input className="admin-input" placeholder="meta_access_token" value={channelForm.meta_access_token} onChange={(e) => setChannelForm((v) => ({ ...v, meta_access_token: e.target.value }))} required />
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Meta App Secret</label>
            <input className="admin-input" placeholder="meta_app_secret" value={channelForm.meta_app_secret} onChange={(e) => setChannelForm((v) => ({ ...v, meta_app_secret: e.target.value }))} required />
          </div>
        </div>
        <button className="admin-btn admin-btn-primary mt-4" type="submit">Crear canal</button>
      </form>
    </div>
  );
}
