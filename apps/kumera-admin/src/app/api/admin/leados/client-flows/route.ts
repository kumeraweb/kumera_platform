import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const optionSchema = z.object({
  option_order: z.number().int().min(1).max(20),
  option_code: z.string().min(1),
  label_text: z.string().min(1),
  score_delta: z.number().int().min(-100).max(100).default(0),
  is_contact_human: z.boolean().default(false),
  is_terminal: z.boolean().default(false),
  next_node_key: z.string().min(1).optional().nullable(),
});

const stepSchema = z.object({
  step_order: z.number().int().min(1).max(50),
  node_key: z.string().min(1),
  prompt_text: z.string().min(1),
  allow_free_text: z.boolean().default(false),
  options: z.array(optionSchema).min(1).max(20),
});

const createFlowSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1),
  welcome_message: z.string().min(1),
  is_active: z.boolean().default(true),
  max_steps: z.number().int().min(1).max(20).default(4),
  max_irrelevant_streak: z.number().int().min(1).max(10).default(2),
  max_reminders: z.number().int().min(0).max(10).default(1),
  reminder_delay_minutes: z.number().int().min(1).max(10080).default(30),
  steps: z.array(stepSchema).min(1).max(20),
});

const getFlowQuerySchema = z.object({
  client_id: z.string().uuid(),
});

type FlowRow = {
  id: string;
  client_id: string;
  name: string;
  welcome_message: string;
  is_active: boolean;
  max_steps: number;
  max_irrelevant_streak: number;
  max_reminders: number;
  reminder_delay_minutes: number;
  created_at: string;
};

type StepRow = {
  id: string;
  flow_id: string;
  step_order: number;
  node_key: string;
  prompt_text: string;
  allow_free_text: boolean;
};

type OptionRow = {
  id: string;
  step_id: string;
  option_order: number;
  option_code: string;
  label_text: string;
  score_delta: number;
  is_contact_human: boolean;
  is_terminal: boolean;
  next_step_id: string | null;
};

async function getClientFlowBundle(clientId: string) {
  const leados = createLeadosServiceClient();

  const { data: activeFlow, error: activeFlowError } = await leados
    .from("client_flows")
    .select(
      "id, client_id, name, welcome_message, is_active, max_steps, max_irrelevant_streak, max_reminders, reminder_delay_minutes, created_at"
    )
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<FlowRow>();
  if (activeFlowError) {
    return { error: activeFlowError.message } as const;
  }

  if (!activeFlow) {
    return { flow: null } as const;
  }

  const { data: steps, error: stepsError } = await leados
    .from("flow_steps")
    .select("id, flow_id, step_order, node_key, prompt_text, allow_free_text")
    .eq("flow_id", activeFlow.id)
    .order("step_order", { ascending: true });
  if (stepsError) {
    return { error: stepsError.message } as const;
  }

  const stepRows = (steps ?? []) as StepRow[];
  if (stepRows.length === 0) {
    return { flow: { ...activeFlow, steps: [] } } as const;
  }

  const stepIds = stepRows.map((step) => step.id);
  const { data: options, error: optionsError } = await leados
    .from("flow_step_options")
    .select("id, step_id, option_order, option_code, label_text, score_delta, is_contact_human, is_terminal, next_step_id")
    .in("step_id", stepIds)
    .order("option_order", { ascending: true });
  if (optionsError) {
    return { error: optionsError.message } as const;
  }

  const stepById = new Map(stepRows.map((step) => [step.id, step]));
  const optionsByStepId = new Map<string, OptionRow[]>();
  for (const option of (options ?? []) as OptionRow[]) {
    const optionList = optionsByStepId.get(option.step_id) ?? [];
    optionList.push(option);
    optionsByStepId.set(option.step_id, optionList);
  }

  const stepsPayload = stepRows.map((step) => ({
    ...step,
    options: (optionsByStepId.get(step.id) ?? []).map((option) => ({
      ...option,
      next_node_key: option.next_step_id ? stepById.get(option.next_step_id)?.node_key ?? null : null,
    })),
  }));

  return {
    flow: {
      ...activeFlow,
      steps: stepsPayload,
    },
  } as const;
}

export async function GET(req: Request) {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsedQuery = getFlowQuerySchema.safeParse({
    client_id: url.searchParams.get("client_id"),
  });
  if (!parsedQuery.success) return fail("Invalid client_id", 400);

  const flowBundle = await getClientFlowBundle(parsedQuery.data.client_id);
  if ("error" in flowBundle) return fail(flowBundle.error ?? "Could not load client flow", 500);

  return ok(flowBundle);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createFlowSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const leados = createLeadosServiceClient();

  if (body.is_active) {
    const deactivate = await leados
      .from("client_flows")
      .update({ is_active: false })
      .eq("client_id", body.client_id)
      .eq("is_active", true);
    if (deactivate.error) return fail(deactivate.error.message, 500);
  }

  const { data: flow, error: flowError } = await leados
    .from("client_flows")
    .insert({
      client_id: body.client_id,
      name: body.name,
      welcome_message: body.welcome_message,
      is_active: body.is_active,
      max_steps: body.max_steps,
      max_irrelevant_streak: body.max_irrelevant_streak,
      max_reminders: body.max_reminders,
      reminder_delay_minutes: body.reminder_delay_minutes,
    })
    .select("id, client_id, name, is_active")
    .single();

  if (flowError || !flow) return fail(flowError?.message ?? "Could not create flow", 500);

  const orderedSteps = [...body.steps].sort((a, b) => a.step_order - b.step_order);
  const uniqueNodeKeys = new Set(orderedSteps.map((s) => s.node_key));
  if (uniqueNodeKeys.size !== orderedSteps.length) return fail("Duplicate node_key in steps", 400);

  const stepIdByNodeKey = new Map<string, string>();
  const optionsByStepId = new Map<string, z.infer<typeof optionSchema>[]>();

  for (const step of orderedSteps) {
    const { data: createdStep, error: stepError } = await leados
      .from("flow_steps")
      .insert({
        flow_id: flow.id,
        step_order: step.step_order,
        node_key: step.node_key,
        prompt_text: step.prompt_text,
        allow_free_text: step.allow_free_text,
      })
      .select("id, step_order, node_key")
      .single();

    if (stepError || !createdStep) return fail(stepError?.message ?? "Could not create flow step", 500);
    stepIdByNodeKey.set(step.node_key, createdStep.id);
    optionsByStepId.set(createdStep.id, step.options);
  }

  for (const [stepId, options] of optionsByStepId.entries()) {
    const optionsPayload = [];
    for (const option of options) {
      const nextStepId = option.next_node_key ? stepIdByNodeKey.get(option.next_node_key) : null;
      if (option.next_node_key && !nextStepId) return fail(`Unknown next_node_key: ${option.next_node_key}`, 400);

      optionsPayload.push({
        step_id: stepId,
        option_order: option.option_order,
        option_code: option.option_code,
        label_text: option.label_text,
        score_delta: option.score_delta,
        is_contact_human: option.is_contact_human,
        is_terminal: option.is_terminal,
        next_step_id: nextStepId,
      });
    }

    const { error: optionsError } = await leados.from("flow_step_options").insert(optionsPayload);
    if (optionsError) return fail(optionsError.message, 500);
  }

  return ok({ flow }, 201);
}
