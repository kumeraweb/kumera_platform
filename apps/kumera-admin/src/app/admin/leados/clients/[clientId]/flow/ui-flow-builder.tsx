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

type TemplateOption = {
  option_order: number;
  option_code: string;
  label_text: string;
  score_delta: number;
  is_contact_human: boolean;
  is_terminal: boolean;
  next_node_key: string | null;
};

type TemplateStep = {
  step_order: number;
  node_key: string;
  prompt_text: string;
  allow_free_text: boolean;
  options: TemplateOption[];
};

const MAX_NODES = 12;
const MAX_OPTIONS = 8;

const TRACTIVA_TEMPLATE: TemplateStep[] = [
  {
    step_order: 1,
    node_key: "inicio",
    prompt_text:
      "Hola 👋 Soy Tractiva. Somos expertos en administración de campañas en Google Ads 🚀 ¿Qué te gustaría hacer hoy?",
    allow_free_text: false,
    options: [
      {
        option_order: 1,
        option_code: "contratar_servicio",
        label_text: "Quiero contratar el servicio de Google Ads",
        score_delta: 40,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "pedir_datos_negocio",
      },
      {
        option_order: 2,
        option_code: "ver_planes",
        label_text: "Quiero conocer sus planes",
        score_delta: 20,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "mostrar_planes",
      },
      {
        option_order: 3,
        option_code: "que_es_google_ads",
        label_text: "No entiendo qué es Google Ads",
        score_delta: 10,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "explicacion_google_ads",
      },
      {
        option_order: 4,
        option_code: "hablar_ejecutiva",
        label_text: "Me gustaría hablar con una ejecutiva",
        score_delta: 100,
        is_contact_human: true,
        is_terminal: false,
        next_node_key: null,
      },
    ],
  },
  {
    step_order: 2,
    node_key: "explicacion_google_ads",
    prompt_text:
      "Google Ads es la plataforma de publicidad de Google que permite que tu negocio aparezca cuando las personas buscan tus productos o servicios. Pagas solo cuando alguien hace clic en tu anuncio y puedes atraer clientes que ya están interesados 🔎🚀",
    allow_free_text: false,
    options: [
      {
        option_order: 1,
        option_code: "quiero_contratar",
        label_text: "Perfecto, quiero contratar el servicio",
        score_delta: 40,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "pedir_datos_negocio",
      },
      {
        option_order: 2,
        option_code: "ver_planes",
        label_text: "Quiero conocer los planes",
        score_delta: 20,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "mostrar_planes",
      },
      {
        option_order: 3,
        option_code: "volver_inicio",
        label_text: "Volver al menú principal",
        score_delta: 0,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "inicio",
      },
    ],
  },
  {
    step_order: 3,
    node_key: "mostrar_planes",
    prompt_text:
      "Estos son nuestros planes de gestión de Google Ads 📊\n\n1️⃣ Plan Base – $59.000 + IVA / mes\n2️⃣ Plan Crecimiento – $89.000 + IVA / mes\n3️⃣ Plan Escala – Evaluación personalizada\n\nLa inversión publicitaria se paga directamente a Google.",
    allow_free_text: false,
    options: [
      {
        option_order: 1,
        option_code: "plan_base",
        label_text: "Quiero el Plan Base",
        score_delta: 30,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "pedir_datos_negocio",
      },
      {
        option_order: 2,
        option_code: "plan_crecimiento",
        label_text: "Quiero el Plan Crecimiento",
        score_delta: 40,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "pedir_datos_negocio",
      },
      {
        option_order: 3,
        option_code: "plan_escala",
        label_text: "Quiero el Plan Escala",
        score_delta: 50,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "pedir_datos_negocio",
      },
      {
        option_order: 4,
        option_code: "hablar_ejecutiva",
        label_text: "Prefiero hablar con una ejecutiva",
        score_delta: 100,
        is_contact_human: true,
        is_terminal: false,
        next_node_key: null,
      },
    ],
  },
  {
    step_order: 4,
    node_key: "pedir_datos_negocio",
    prompt_text:
      "Perfecto 👍 Para comenzar necesito algunos datos:\n\n• Nombre de tu negocio\n• Rubro\n• Ciudad\n• Presupuesto mensual estimado en Google Ads\n• Objetivo principal (ventas, contactos, visitas, etc.)\n\nEnvíame esa información y avanzamos 🚀",
    allow_free_text: true,
    options: [
      {
        option_order: 1,
        option_code: "datos_enviados",
        label_text: "Listo, ya envié mis datos",
        score_delta: 30,
        is_contact_human: true,
        is_terminal: true,
        next_node_key: null,
      },
      {
        option_order: 2,
        option_code: "volver_inicio",
        label_text: "Volver al menú principal",
        score_delta: 0,
        is_contact_human: false,
        is_terminal: false,
        next_node_key: "inicio",
      },
    ],
  },
];

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

function templateToBuilderNodes(template: TemplateStep[]): BuilderNode[] {
  return [...template]
    .sort((a, b) => a.step_order - b.step_order)
    .map((step) => ({
      id: makeId(),
      node_key: step.node_key,
      prompt_text: step.prompt_text,
      allow_free_text: step.allow_free_text,
      options: [...step.options]
        .sort((a, b) => a.option_order - b.option_order)
        .map((option) => ({
          id: makeId(),
          label_text: option.label_text,
          score_delta: option.score_delta,
          next_type: option.is_contact_human ? "human" : option.is_terminal ? "terminal" : "node",
          next_node_key: option.next_node_key ?? "",
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

  function applyTractivaTemplate() {
    setNodes(templateToBuilderNodes(TRACTIVA_TEMPLATE));
    setName("Flujo Tractiva Google Ads");
    setWelcomeMessage(
      "Hola 👋 Soy Tractiva. Somos expertos en administración de campañas en Google Ads 🚀 ¿Qué te gustaría hacer hoy?"
    );
    setMaxSteps(8);
    setMaxIrrelevantStreak(2);
    setMaxReminders(1);
    setReminderDelayMinutes(30);
    setError(null);
    setSuccess("Template Tractiva cargado.");
  }

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-bold text-slate-100">Configuración general</h3>
          <button
            type="button"
            onClick={applyTractivaTemplate}
            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
          >
            Usar template Tractiva
          </button>
        </div>
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
