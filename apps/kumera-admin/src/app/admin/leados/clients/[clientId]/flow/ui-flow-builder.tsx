"use client";

import { FormEvent, useMemo, useState } from "react";

type BuilderOption = {
  id: string;
  label_text: string;
  score_delta: number;
  next_type: "node" | "human" | "terminal";
  next_node_key: string;
};

type BuilderNode = {
  id: string;
  node_key: string;
  prompt_text: string;
  allow_free_text: boolean;
  options: BuilderOption[];
};

type Props = {
  clientId: string;
};

const MAX_NODES = 12;
const MAX_OPTIONS = 8;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "opcion";
}

function nextUniqueNodeKey(existingKeys: string[], base: string): string {
  const normalizedBase = slugify(base || "nodo");
  if (!existingKeys.includes(normalizedBase)) return normalizedBase;

  let idx = 2;
  while (existingKeys.includes(`${normalizedBase}_${idx}`)) idx += 1;
  return `${normalizedBase}_${idx}`;
}

function toPayload(nodes: BuilderNode[]) {
  return nodes.map((node, idx) => ({
    step_order: idx + 1,
    node_key: node.node_key,
    prompt_text: node.prompt_text,
    allow_free_text: node.allow_free_text,
    options: node.options.map((option, optionIdx) => ({
      option_order: optionIdx + 1,
      option_code: slugify(option.label_text || `opcion_${optionIdx + 1}`),
      label_text: option.label_text,
      score_delta: Number(option.score_delta) || 0,
      is_contact_human: option.next_type === "human",
      is_terminal: option.next_type === "terminal",
      next_node_key: option.next_type === "node" ? option.next_node_key || null : null,
    })),
  }));
}

export default function FlowBuilderClient({ clientId }: Props) {
  const [name, setName] = useState("Flujo comercial");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hola, soy el asistente comercial. Te haré unas preguntas breves para ayudarte mejor."
  );
  const [maxSteps, setMaxSteps] = useState(8);
  const [maxIrrelevantStreak, setMaxIrrelevantStreak] = useState(2);
  const [maxReminders, setMaxReminders] = useState(1);
  const [reminderDelayMinutes, setReminderDelayMinutes] = useState(30);
  const [nodes, setNodes] = useState<BuilderNode[]>([
    {
      id: makeId(),
      node_key: "inicio",
      prompt_text: "¿Qué necesitas hoy?",
      allow_free_text: false,
      options: [
        { id: makeId(), label_text: "Quiero cotizar", score_delta: 35, next_type: "node", next_node_key: "datos" },
        { id: makeId(), label_text: "Hablar con ejecutiva", score_delta: 100, next_type: "human", next_node_key: "" },
      ],
    },
    {
      id: makeId(),
      node_key: "datos",
      prompt_text: "Perfecto. Cuéntame tu necesidad principal.",
      allow_free_text: true,
      options: [{ id: makeId(), label_text: "Continuar", score_delta: 10, next_type: "terminal", next_node_key: "" }],
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nodeKeyOptions = useMemo(() => nodes.map((n) => n.node_key).filter(Boolean), [nodes]);
  const payloadPreview = useMemo(() => JSON.stringify(toPayload(nodes), null, 2), [nodes]);

  function updateNode(nodeId: string, patch: Partial<BuilderNode>) {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)));
  }

  function addNode() {
    if (nodes.length >= MAX_NODES) return;
    setNodes((prev) => [
      ...prev,
      {
        id: makeId(),
        node_key: `nodo_${prev.length + 1}`,
        prompt_text: "",
        allow_free_text: false,
        options: [{ id: makeId(), label_text: "", score_delta: 0, next_type: "terminal", next_node_key: "" }],
      },
    ]);
  }

  function removeNode(nodeId: string) {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
  }

  function createLinkedSubnode(nodeId: string, optionId: string) {
    setNodes((prev) => {
      const parentIndex = prev.findIndex((node) => node.id === nodeId);
      if (parentIndex === -1 || prev.length >= MAX_NODES) return prev;

      const parentNode = prev[parentIndex];
      const targetOption = parentNode.options.find((option) => option.id === optionId);
      if (!targetOption) return prev;

      const key = nextUniqueNodeKey(
        prev.map((node) => node.node_key),
        targetOption.label_text || "nuevo_nodo"
      );

      const subnode: BuilderNode = {
        id: makeId(),
        node_key: key,
        prompt_text: "",
        allow_free_text: false,
        options: [{ id: makeId(), label_text: "", score_delta: 0, next_type: "terminal", next_node_key: "" }],
      };

      const next = [...prev];
      next[parentIndex] = {
        ...parentNode,
        options: parentNode.options.map((option) =>
          option.id === optionId ? { ...option, next_type: "node", next_node_key: key } : option
        ),
      };
      next.splice(parentIndex + 1, 0, subnode);
      return next;
    });
  }

  function addOption(nodeId: string) {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId || node.options.length >= MAX_OPTIONS) return node;
        return {
          ...node,
          options: [...node.options, { id: makeId(), label_text: "", score_delta: 0, next_type: "terminal", next_node_key: "" }],
        };
      })
    );
  }

  function updateOption(nodeId: string, optionId: string, patch: Partial<BuilderOption>) {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          options: node.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)),
        };
      })
    );
  }

  function removeOption(nodeId: string, optionId: string) {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        return { ...node, options: node.options.filter((option) => option.id !== optionId) };
      })
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const nodeKeys = new Set<string>();
    for (const node of nodes) {
      if (!node.node_key.trim()) {
        setError("Todos los nodos deben tener node_key");
        setSubmitting(false);
        return;
      }
      if (!node.prompt_text.trim()) {
        setError(`El nodo \"${node.node_key}\" no tiene pregunta/mensaje.`);
        setSubmitting(false);
        return;
      }
      if (node.options.length === 0) {
        setError(`El nodo \"${node.node_key}\" no tiene opciones.`);
        setSubmitting(false);
        return;
      }
      if (nodeKeys.has(node.node_key)) {
        setError(`node_key duplicado: ${node.node_key}`);
        setSubmitting(false);
        return;
      }
      nodeKeys.add(node.node_key);
    }

    for (const node of nodes) {
      for (const option of node.options) {
        if (!option.label_text.trim()) {
          setError(`Hay una opción vacía en el nodo \"${node.node_key}\".`);
          setSubmitting(false);
          return;
        }
        if (option.next_type === "node" && !option.next_node_key.trim()) {
          setError(`La opción \"${option.label_text}\" debe apuntar a un nodo destino.`);
          setSubmitting(false);
          return;
        }
      }
    }

    const response = await fetch("/api/admin/leados/client-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        name,
        welcome_message: welcomeMessage,
        is_active: true,
        max_steps: maxSteps,
        max_irrelevant_streak: maxIrrelevantStreak,
        max_reminders: maxReminders,
        reminder_delay_minutes: reminderDelayMinutes,
        steps: toPayload(nodes),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear flujo");
      setSubmitting(false);
      return;
    }

    setSuccess("Flujo creado y activado correctamente.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="m-0 text-sm font-bold text-slate-100">Configuración general</h3>
        <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre flujo" required />
        <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Mensaje de bienvenida" required />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" type="number" min={1} max={20} value={maxSteps} onChange={(e) => setMaxSteps(Number(e.target.value))} required />
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" type="number" min={1} max={10} value={maxIrrelevantStreak} onChange={(e) => setMaxIrrelevantStreak(Number(e.target.value))} required />
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" type="number" min={0} max={10} value={maxReminders} onChange={(e) => setMaxReminders(Number(e.target.value))} required />
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" type="number" min={1} max={10080} value={reminderDelayMinutes} onChange={(e) => setReminderDelayMinutes(Number(e.target.value))} required />
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-sm font-bold text-slate-100">Nodos conversacionales</h3>
          <button type="button" className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700" onClick={addNode}>+ Nodo</button>
        </div>

        {nodes.map((node, index) => (
          <div key={node.id} className="grid gap-2 rounded-lg border border-slate-700 bg-slate-800/70 p-3">
            <div className="flex items-center justify-between">
              <p className="m-0 text-xs font-semibold text-slate-300">Nodo {index + 1}</p>
              {index > 0 ? (
                <button type="button" className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-300 hover:bg-red-500/20" onClick={() => removeNode(node.id)}>
                  Eliminar
                </button>
              ) : null}
            </div>

            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" value={node.node_key} placeholder="node_key" onChange={(e) => updateNode(node.id, { node_key: e.target.value })} required />
            <textarea className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20" rows={2} value={node.prompt_text} placeholder="Texto del nodo" onChange={(e) => updateNode(node.id, { prompt_text: e.target.value })} required />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={node.allow_free_text} onChange={(e) => updateNode(node.id, { allow_free_text: e.target.checked })} />
              Permitir texto libre en este nodo
            </label>

            <div className="grid gap-2">
              {node.options.map((option) => (
                <div key={option.id} className="grid gap-2 rounded border border-slate-700 bg-slate-900 p-2">
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                    value={option.label_text}
                    placeholder="Texto opción"
                    onChange={(e) => updateOption(node.id, option.id, { label_text: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                      type="number"
                      value={option.score_delta}
                      onChange={(e) => updateOption(node.id, option.id, { score_delta: Number(e.target.value) })}
                    />
                    <select
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                      value={option.next_type}
                      onChange={(e) => updateOption(node.id, option.id, { next_type: e.target.value as BuilderOption["next_type"] })}
                    >
                      <option value="node">Ir a nodo</option>
                      <option value="human">Escalar humano</option>
                      <option value="terminal">Terminal</option>
                    </select>
                    {option.next_type === "node" ? (
                      <select
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
                        value={option.next_node_key}
                        onChange={(e) => updateOption(node.id, option.id, { next_node_key: e.target.value })}
                      >
                        <option value="">Selecciona nodo</option>
                        {nodeKeyOptions.map((nodeKey) => (
                          <option key={nodeKey} value={nodeKey}>
                            {nodeKey}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                        onClick={() => createLinkedSubnode(node.id, option.id)}
                      >
                        Crear subnodo
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-fit rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                    onClick={() => removeOption(node.id, option.id)}
                  >
                    Eliminar opción
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-fit rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700"
              onClick={() => addOption(node.id)}
            >
              + Opción
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="m-0 text-sm font-bold text-slate-100">Preview JSON</h3>
        <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none" rows={12} readOnly value={payloadPreview} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar flujo activo"}
      </button>
    </form>
  );
}
