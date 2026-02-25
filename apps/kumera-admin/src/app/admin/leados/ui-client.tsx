"use client";

import Link from "next/link";
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
    <div className="mt-4 grid gap-4">
      {message ? <p className="text-sm font-medium text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="m-0 text-sm font-bold text-slate-100">Clientes</h3>
          <p className="m-0 text-xs text-slate-400">Cada cliente tiene su constructor de flujo dedicado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">ID</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Nombre</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Email</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Score</th>
              <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((row) => (
              <tr key={row.id}>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-300">{row.id}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.name}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.notification_email}</td>
                <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.score_threshold}</td>
                <td className="border-b border-slate-800 px-2 py-2">
                  <Link
                    className="inline-flex items-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                    href={`/admin/leados/clients/${row.id}/flow`}
                  >
                    Gestionar flujo
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <form className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={onCreateClient}>
        <h3 className="m-0 text-sm font-bold text-slate-100">Crear cliente LeadOS</h3>
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="Nombre cliente"
          value={clientForm.name}
          onChange={(e) => setClientForm((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          type="email"
          placeholder="notification@cliente.com"
          value={clientForm.notification_email}
          onChange={(e) => setClientForm((v) => ({ ...v, notification_email: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="+56912345678"
          value={clientForm.human_forward_number}
          onChange={(e) => setClientForm((v) => ({ ...v, human_forward_number: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          type="number"
          min={0}
          max={100}
          value={clientForm.score_threshold}
          onChange={(e) => setClientForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">Crear cliente</button>
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={onAssignUser}>
        <h3 className="m-0 text-sm font-bold text-slate-100">Asignar usuario a tenant</h3>
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="user_id (uuid)"
          value={assignForm.user_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, user_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="client_id (uuid)"
          value={assignForm.client_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">Asignar</button>
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={onCreateChannel}>
        <h3 className="m-0 text-sm font-bold text-slate-100">Crear canal WhatsApp</h3>
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="client_id (uuid)"
          value={channelForm.client_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="phone_number_id"
          value={channelForm.phone_number_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, phone_number_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="waba_id (opcional)"
          value={channelForm.waba_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, waba_id: e.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="meta_access_token"
          value={channelForm.meta_access_token}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_access_token: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="meta_app_secret"
          value={channelForm.meta_app_secret}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_app_secret: e.target.value }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">Crear canal</button>
      </form>
    </div>
  );
}
