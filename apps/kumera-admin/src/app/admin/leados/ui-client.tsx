"use client";

import { FormEvent, useState } from "react";

type ClientRow = {
  id: string;
  name: string;
  notification_email: string;
  score_threshold: number;
  human_forward_number: string | null;
  created_at: string;
};

type Props = {
  initialClients: ClientRow[];
};

export default function LeadosAdminClient({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clientForm, setClientForm] = useState({
    name: "",
    notification_email: "",
    human_forward_number: "",
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
    setClientForm({ name: "", notification_email: "", human_forward_number: "", score_threshold: 85 });
    setMessage("Cliente creado.");
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

  return (
    <div className="stack">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="card">
        <h3>Clientes</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.notification_email}</td>
                <td>{row.score_threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card form" onSubmit={onCreateClient}>
        <h3>Crear cliente LeadOS</h3>
        <input
          placeholder="Nombre cliente"
          value={clientForm.name}
          onChange={(e) => setClientForm((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="notification@cliente.com"
          value={clientForm.notification_email}
          onChange={(e) => setClientForm((v) => ({ ...v, notification_email: e.target.value }))}
          required
        />
        <input
          placeholder="+56912345678"
          value={clientForm.human_forward_number}
          onChange={(e) => setClientForm((v) => ({ ...v, human_forward_number: e.target.value }))}
          required
        />
        <input
          type="number"
          min={0}
          max={100}
          value={clientForm.score_threshold}
          onChange={(e) => setClientForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))}
          required
        />
        <button type="submit">Crear cliente</button>
      </form>

      <form className="card form" onSubmit={onAssignUser}>
        <h3>Asignar usuario a tenant</h3>
        <input
          placeholder="user_id (uuid)"
          value={assignForm.user_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, user_id: e.target.value }))}
          required
        />
        <input
          placeholder="client_id (uuid)"
          value={assignForm.client_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <button type="submit">Asignar</button>
      </form>

      <form className="card form" onSubmit={onCreateChannel}>
        <h3>Crear canal WhatsApp</h3>
        <input
          placeholder="client_id (uuid)"
          value={channelForm.client_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <input
          placeholder="phone_number_id"
          value={channelForm.phone_number_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, phone_number_id: e.target.value }))}
          required
        />
        <input
          placeholder="waba_id (opcional)"
          value={channelForm.waba_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, waba_id: e.target.value }))}
        />
        <input
          placeholder="meta_access_token"
          value={channelForm.meta_access_token}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_access_token: e.target.value }))}
          required
        />
        <input
          placeholder="meta_app_secret"
          value={channelForm.meta_app_secret}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_app_secret: e.target.value }))}
          required
        />
        <button type="submit">Crear canal</button>
      </form>
    </div>
  );
}
