export type KumeraMessagingPlanCode =
  | "emprendedor_500"
  | "base_1500"
  | "crecimiento_5000"
  | "pro_12000";

export type KumeraMessagingPlanPreset = {
  code: KumeraMessagingPlanCode;
  label: string;
  publicPriceLabel: string;
  monthlyInboundLimit: number;
  monthlyAiChecksLimit: number;
};

export const KUMERA_MESSAGING_PLAN_PRESETS: KumeraMessagingPlanPreset[] = [
  {
    code: "emprendedor_500",
    label: "Emprendedor",
    publicPriceLabel: "$39.000 + IVA / mes",
    monthlyInboundLimit: 500,
    monthlyAiChecksLimit: 250,
  },
  {
    code: "base_1500",
    label: "Base",
    publicPriceLabel: "$59.000 + IVA / mes",
    monthlyInboundLimit: 1500,
    monthlyAiChecksLimit: 700,
  },
  {
    code: "crecimiento_5000",
    label: "Crecimiento",
    publicPriceLabel: "$119.000 + IVA / mes",
    monthlyInboundLimit: 5000,
    monthlyAiChecksLimit: 2200,
  },
  {
    code: "pro_12000",
    label: "Pro",
    publicPriceLabel: "Desde $249.000 + IVA / mes",
    monthlyInboundLimit: 12000,
    monthlyAiChecksLimit: 5200,
  },
];

export function getPlanPreset(code: string): KumeraMessagingPlanPreset | null {
  return KUMERA_MESSAGING_PLAN_PRESETS.find((plan) => plan.code === code) ?? null;
}
