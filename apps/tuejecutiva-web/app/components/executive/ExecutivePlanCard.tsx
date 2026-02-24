import { Check, ArrowRight } from "lucide-react";
import type { ExecutivePlanRecord } from "@/lib/queries";
import TrackedWhatsappLink from "@/app/components/TrackedWhatsappLink";

interface ExecutivePlanCardProps {
    plan: ExecutivePlanRecord;
    whatsappLink: string;
}

function getFeatures(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default function ExecutivePlanCard({ plan, whatsappLink }: ExecutivePlanCardProps) {
    const features = getFeatures(plan.features);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative group">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-500" />

            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">
                        {plan.name}
                    </h3>
                    {plan.target && (
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {plan.target}
                        </p>
                    )}
                </div>

                <div className="mb-6 pb-6 border-b border-slate-100">
                    {plan.price_from ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm text-slate-500 font-medium">desde</span>
                            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
                                {plan.price_from}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm text-slate-500 font-medium">Cotizar valor</span>
                        </div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                        Valor referencial sujeto a evaluación.
                    </p>
                </div>

                <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                        {features.slice(0, 5).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 leading-snug">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    {plan.description && (
                        <p className="mt-4 text-xs text-slate-500 border-t border-slate-50 pt-3 leading-relaxed line-clamp-3">
                            {plan.description}
                        </p>
                    )}
                </div>

                <TrackedWhatsappLink
                    href={`${whatsappLink}&text=Hola,%20me%20interesa%20cotizar%20el%20plan%20*${encodeURIComponent(plan.name)}*`}
                    target="_blank"
                    className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group-hover:bg-emerald-600 group-hover:text-white"
                >
                    Cotizar este plan
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </TrackedWhatsappLink>
            </div>
        </div>
    );
}
