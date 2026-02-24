import { ShieldCheck } from "lucide-react";

interface ExecutiveCertificateProps {
    verifiedDate: string;
}

export default function ExecutiveCertificate({ verifiedDate }: ExecutiveCertificateProps) {
    return (
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-sm border border-slate-200">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-[0.08] pointer-events-none">
                <img src="/images/certification.png" alt="" className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <img src="/images/certification.png" alt="Sello de Verificación" className="w-16 h-16 object-contain" />
                </div>

                <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 text-sm font-bold uppercase tracking-wider">Verificación Activa</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Ejecutiva Certificada por TuEjecutiva.cl
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
                        Hemos validado manualmente su identidad, antecedentes comerciales y vínculo contractual con la compañía que representa.
                    </p>
                    <p className="mt-4 text-xs text-slate-500 font-mono">
                        Verificado: {verifiedDate}
                    </p>
                </div>
            </div>
        </div>
    );
}
