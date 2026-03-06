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

type ChannelRow = {
  id: string;
  client_id: string;
  phone_number_id: string;
  waba_id: string | null;
  is_active: boolean;
};

type UserClientRow = {
  user_id: string;
  client_id: string;
  created_at: string;
};

export default function EditClientForm({
  client,
  channel,
  userClients,
}: {
  client: ClientRow;
  channel: ChannelRow | null;
  userClients: UserClientRow[];
}) {
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
  const [channelForm, setChannelForm] = useState({
    phone_number_id: channel?.phone_number_id ?? "",
    waba_id: channel?.waba_id ?? "",
    meta_access_token: "",
    meta_app_secret: "",
    is_active: channel?.is_active ?? true,
  });
  const [assignUserId, setAssignUserId] = useState("");

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

  async function onSaveChannel(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload = {
      phone_number_id: channelForm.phone_number_id,
      waba_id: channelForm.waba_id || null,
      meta_access_token: channelForm.meta_access_token || undefined,
      meta_app_secret: channelForm.meta_app_secret || undefined,
      is_active: channelForm.is_active,
    };

    const response = await fetch(
      channel
        ? `/api/admin/kumeramessaging/client-channels/${channel.id}`
        : `/api/admin/kumeramessaging/client-channels`,
      {
        method: channel ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channel ? payload : { ...payload, client_id: client.id }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No se pudo guardar el canal");
      return;
    }

    setChannelForm((prev) => ({
      ...prev,
      meta_access_token: "",
      meta_app_secret: "",
    }));
    setMessage(channel ? "Canal actualizado correctamente." : "Canal creado correctamente. Recarga la página para ver el identificador persistido.");
  }

  async function onAssignUser(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/kumeramessaging/user-clients/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: assignUserId, client_id: client.id }),
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No se pudo asignar el usuario");
      return;
    }

    setAssignUserId("");
    setMessage("Usuario asignado correctamente. Recarga la página para ver la lista actualizada.");
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

      <form className="admin-card" onSubmit={onSaveChannel}>
        <div className="mb-4">
          <h2 className="section-title">Canal WhatsApp</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Define el `phone_number_id`, `waba_id` y reingresa credenciales Meta para cifrarlas con la clave actual.
          </p>
          {channel ? (
            <p className="mt-2 text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>
              Canal actual: {channel.id}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Meta Phone Number ID (webhook)</label>
            <input className="admin-input" value={channelForm.phone_number_id} onChange={(e) => setChannelForm((v) => ({ ...v, phone_number_id: e.target.value }))} required />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Debe coincidir con el valor real que Meta envía como <span className="font-mono">metadata.phone_number_id</span> en los logs del webhook.
            </p>
          </div>
          <div className="admin-field">
            <label className="admin-label">WhatsApp Business Account ID (WABA ID)</label>
            <input className="admin-input" value={channelForm.waba_id} onChange={(e) => setChannelForm((v) => ({ ...v, waba_id: e.target.value }))} />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Identificador de la cuenta WABA asociada al número.
            </p>
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Meta Access Token</label>
            <textarea className="admin-input min-h-24" placeholder={channel ? "Déjalo vacío para mantener el actual" : ""} value={channelForm.meta_access_token} onChange={(e) => setChannelForm((v) => ({ ...v, meta_access_token: e.target.value }))} />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Si el canal ya existe, puedes dejarlo vacío para no cambiar el token. Ingresa uno nuevo solo si vas a rotarlo o rehacer el canal.
            </p>
          </div>
          <div className="admin-field md:col-span-2">
            <label className="admin-label">Meta App Secret</label>
            <input className="admin-input" type="password" placeholder={channel ? "Déjalo vacío para mantener el actual" : ""} value={channelForm.meta_app_secret} onChange={(e) => setChannelForm((v) => ({ ...v, meta_app_secret: e.target.value }))} />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Se obtiene desde la app de Meta y valida la firma del webhook. No es el WABA ID ni el número visible.
            </p>
          </div>
          <label className="admin-field md:col-span-2 flex items-center gap-3 rounded-lg border px-3 py-3" style={{ borderColor: "var(--admin-border)" }}>
            <input type="checkbox" checked={channelForm.is_active} onChange={(e) => setChannelForm((v) => ({ ...v, is_active: e.target.checked }))} />
            <div>
              <div className="admin-label" style={{ marginBottom: 2 }}>Estado del canal</div>
              <div style={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                Activo para recibir y responder mensajes.
              </div>
            </div>
          </label>
        </div>

        <button className="admin-btn admin-btn-primary mt-4" type="submit">
          {channel ? "Guardar canal" : "Crear canal"}
        </button>
      </form>

      <form className="admin-card" onSubmit={onAssignUser}>
        <div className="mb-4">
          <h2 className="section-title">Usuarios autorizados</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Vincula un `auth.users.id` para que ese usuario pueda abrir el panel del cliente.
          </p>
        </div>

        {userClients.length > 0 ? (
          <div className="mb-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Asignado</th>
                </tr>
              </thead>
              <tbody>
                {userClients.map((item) => (
                  <tr key={item.user_id}>
                    <td><span className="font-mono text-xs">{item.user_id}</span></td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">User ID (auth.users.id)</label>
            <input className="admin-input" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} required />
            <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Debe ser el <span className="font-mono">id</span> real de <span className="font-mono">auth.users</span> del usuario que abrirá el panel cliente.
            </p>
          </div>
          <div className="admin-field">
            <label className="admin-label">Client ID</label>
            <input className="admin-input" value={client.id} disabled />
          </div>
        </div>

        <button className="admin-btn admin-btn-primary mt-4" type="submit">Asignar usuario</button>
      </form>
    </div>
  );
}
