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

  const [flowForm, setFlowForm] = useState({
    client_id: "",
    name: "Flujo Base",
    welcome_message: "Hola, te ayudo a cotizar. ¿Qué necesitas?",
    is_active: true,
    max_steps: 4,
    max_irrelevant_streak: 2,
    max_reminders: 1,
    reminder_delay_minutes: 30,
    steps_json: JSON.stringify(
      [
        {
          step_order: 1,
          node_key: "inicio",
          prompt_text: "Hola, ¿qué tipo de ayuda necesitas?",
          allow_free_text: false,
          options: [
            {
              option_order: 1,
              option_code: "cotizar",
              label_text: "Quiero cotizar",
              score_delta: 20,
              is_contact_human: false,
              is_terminal: false,
              next_node_key: "datos",
            },
            {
              option_order: 2,
              option_code: "hablar_humano",
              label_text: "Hablar con un ejecutivo",
              score_delta: 40,
              is_contact_human: true,
              is_terminal: false,
              next_node_key: null,
            },
          ],
        },
        {
          step_order: 2,
          node_key: "datos",
          prompt_text: "Perfecto. ¿Nos compartes tu nombre y necesidad principal?",
          allow_free_text: true,
          options: [
            {
              option_order: 1,
              option_code: "continuar",
              label_text: "Continuar",
              score_delta: 10,
              is_contact_human: false,
              is_terminal: true,
              next_node_key: null,
            },
          ],
        },
      ],
      null,
      2
    ),
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

  async function onCreateFlow(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    let parsedSteps: unknown;
    try {
      parsedSteps = JSON.parse(flowForm.steps_json);
    } catch {
      setError("steps_json no es un JSON válido");
      return;
    }

    if (!Array.isArray(parsedSteps)) {
      setError("steps_json debe ser un arreglo JSON");
      return;
    }

    const response = await fetch("/api/admin/leados/client-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: flowForm.client_id,
        name: flowForm.name,
        welcome_message: flowForm.welcome_message,
        is_active: flowForm.is_active,
        max_steps: flowForm.max_steps,
        max_irrelevant_streak: flowForm.max_irrelevant_streak,
        max_reminders: flowForm.max_reminders,
        reminder_delay_minutes: flowForm.reminder_delay_minutes,
        steps: parsedSteps,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear flujo");
      return;
    }

    setMessage(`Flujo creado: ${payload.flow?.name ?? "ok"}`);
  }

  return (
    <div className="mt-4 grid gap-3">
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="m-0 text-sm font-bold">Clientes</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">ID</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Nombre</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Email</th>
              <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-500">Score</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((row) => (
              <tr key={row.id}>
                <td className="border-b border-slate-100 px-2 py-2">{row.id}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.name}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.notification_email}</td>
                <td className="border-b border-slate-100 px-2 py-2">{row.score_threshold}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4" onSubmit={onCreateClient}>
        <h3 className="m-0 text-sm font-bold">Crear cliente LeadOS</h3>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="Nombre cliente"
          value={clientForm.name}
          onChange={(e) => setClientForm((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          type="email"
          placeholder="notification@cliente.com"
          value={clientForm.notification_email}
          onChange={(e) => setClientForm((v) => ({ ...v, notification_email: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="+56912345678"
          value={clientForm.human_forward_number}
          onChange={(e) => setClientForm((v) => ({ ...v, human_forward_number: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          type="number"
          min={0}
          max={100}
          value={clientForm.score_threshold}
          onChange={(e) => setClientForm((v) => ({ ...v, score_threshold: Number(e.target.value) }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800" type="submit">Crear cliente</button>
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4" onSubmit={onAssignUser}>
        <h3 className="m-0 text-sm font-bold">Asignar usuario a tenant</h3>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="user_id (uuid)"
          value={assignForm.user_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, user_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="client_id (uuid)"
          value={assignForm.client_id}
          onChange={(e) => setAssignForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800" type="submit">Asignar</button>
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4" onSubmit={onCreateChannel}>
        <h3 className="m-0 text-sm font-bold">Crear canal WhatsApp</h3>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="client_id (uuid)"
          value={channelForm.client_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="phone_number_id"
          value={channelForm.phone_number_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, phone_number_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="waba_id (opcional)"
          value={channelForm.waba_id}
          onChange={(e) => setChannelForm((v) => ({ ...v, waba_id: e.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="meta_access_token"
          value={channelForm.meta_access_token}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_access_token: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="meta_app_secret"
          value={channelForm.meta_app_secret}
          onChange={(e) => setChannelForm((v) => ({ ...v, meta_app_secret: e.target.value }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800" type="submit">Crear canal</button>
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4" onSubmit={onCreateFlow}>
        <h3 className="m-0 text-sm font-bold">Crear flujo conversacional</h3>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="client_id (uuid)"
          value={flowForm.client_id}
          onChange={(e) => setFlowForm((v) => ({ ...v, client_id: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="Nombre del flujo"
          value={flowForm.name}
          onChange={(e) => setFlowForm((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          placeholder="Mensaje de bienvenida"
          value={flowForm.welcome_message}
          onChange={(e) => setFlowForm((v) => ({ ...v, welcome_message: e.target.value }))}
          required
        />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            type="number"
            min={1}
            max={20}
            value={flowForm.max_steps}
            onChange={(e) => setFlowForm((v) => ({ ...v, max_steps: Number(e.target.value) }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            type="number"
            min={1}
            max={10}
            value={flowForm.max_irrelevant_streak}
            onChange={(e) =>
              setFlowForm((v) => ({ ...v, max_irrelevant_streak: Number(e.target.value) }))
            }
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            type="number"
            min={0}
            max={10}
            value={flowForm.max_reminders}
            onChange={(e) => setFlowForm((v) => ({ ...v, max_reminders: Number(e.target.value) }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            type="number"
            min={1}
            max={10080}
            value={flowForm.reminder_delay_minutes}
            onChange={(e) =>
              setFlowForm((v) => ({ ...v, reminder_delay_minutes: Number(e.target.value) }))
            }
            required
          />
        </div>
        <textarea
          className="rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs leading-5 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          rows={16}
          value={flowForm.steps_json}
          onChange={(e) => setFlowForm((v) => ({ ...v, steps_json: e.target.value }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800" type="submit">Crear flujo</button>
      </form>
    </div>
  );
}
