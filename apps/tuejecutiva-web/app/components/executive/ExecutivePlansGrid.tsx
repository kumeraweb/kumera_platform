import type { ExecutivePlanRecord } from "@/lib/queries";
import ExecutivePlanCard from "./ExecutivePlanCard";

interface ExecutivePlansGridProps {
    plans: ExecutivePlanRecord[];
    whatsappLink: string;
}

export default function ExecutivePlansGrid({ plans, whatsappLink }: ExecutivePlansGridProps) {
    if (!plans || plans.length === 0) return null;

    return (
        <div className="py-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="h-6 w-1 bg-emerald-500 rounded-full" />
                Planes disponibles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <ExecutivePlanCard key={plan.id} plan={plan} whatsappLink={whatsappLink} />
                ))}
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-800/80 font-medium">
                    <span className="font-bold text-amber-900">Nota:</span> Valores referenciales. La contratación final se realiza directamente con la ejecutiva.
                </p>
            </div>
        </div>
    );
}
