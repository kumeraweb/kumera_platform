export const HARD_BLOCK_TERMS = [
  "garantizado",
  "cura",
  "urgencia inmediata",
  "emergencia 24/7",
  "100% seguro",
  "mejor plan",
] as const;

export const SOFT_WARNING_TERMS = [
  "ambulancia",
  "rescate",
  "emergencias",
  "atencion inmediata",
] as const;

export interface GuardrailInput {
  field: string;
  value: string;
}

export interface GuardrailMatch {
  field: string;
  term: string;
}

export interface GuardrailResult {
  hardMatches: GuardrailMatch[];
  softMatches: GuardrailMatch[];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findMatches(inputs: GuardrailInput[], terms: readonly string[]): GuardrailMatch[] {
  const matches: GuardrailMatch[] = [];

  for (const input of inputs) {
    const normalizedValue = normalizeText(input.value);
    if (!normalizedValue) continue;

    for (const term of terms) {
      if (normalizedValue.includes(normalizeText(term))) {
        matches.push({ field: input.field, term });
      }
    }
  }

  return matches;
}

export function analyzeGuardrails(inputs: GuardrailInput[]): GuardrailResult {
  return {
    hardMatches: findMatches(inputs, HARD_BLOCK_TERMS),
    softMatches: findMatches(inputs, SOFT_WARNING_TERMS),
  };
}

