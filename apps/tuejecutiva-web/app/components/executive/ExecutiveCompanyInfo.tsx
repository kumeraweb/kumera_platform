import { ExternalLink, Building2 } from "lucide-react";

interface ExecutiveCompanyInfoProps {
    companyName: string | null;
    companyLogoUrl: string | null;
    companyWebsiteUrl: string | null;
}

export default function ExecutiveCompanyInfo({
    companyName,
    companyLogoUrl,
    companyWebsiteUrl,
}: ExecutiveCompanyInfoProps) {
    if (!companyName && !companyLogoUrl && !companyWebsiteUrl) {
        return null;
    }

    const websiteHref =
        companyWebsiteUrl && companyWebsiteUrl.trim().length > 0
            ? companyWebsiteUrl.startsWith("http://") || companyWebsiteUrl.startsWith("https://")
                ? companyWebsiteUrl
                : `https://${companyWebsiteUrl}`
            : null;

    return (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    {companyLogoUrl ? (
                        websiteHref ? (
                            <a
                                href={websiteHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm h-[5.75rem] w-[8.5rem] sm:h-[6.5rem] sm:w-[10.5rem] flex items-center justify-center hover:border-emerald-300 hover:shadow-md transition-all"
                                title={`Ir al sitio oficial de ${companyName || "la empresa"}`}
                            >
                                <img
                                    src={companyLogoUrl}
                                    alt={companyName || "Empresa"}
                                    className="h-full w-full object-contain object-center"
                                />
                            </a>
                        ) : (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm h-[5.75rem] w-[8.5rem] sm:h-[6.5rem] sm:w-[10.5rem] flex items-center justify-center">
                                <img
                                    src={companyLogoUrl}
                                    alt={companyName || "Empresa"}
                                    className="h-full w-full object-contain object-center"
                                />
                            </div>
                        )
                    ) : (
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm h-12 w-12 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                    <div>
                        {companyName ? (
                            <h4 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                                {companyName}
                            </h4>
                        ) : null}
                        <p className="text-sm text-slate-600 max-w-md mt-0.5">
                            Ejecutiva verificada que trabaja en esta compañía.
                        </p>
                        <p className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 leading-relaxed">
                            Contratación directa por WhatsApp o teléfono.
                        </p>
                    </div>
                </div>

                {websiteHref && (
                    <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
                    >
                        Sitio oficial
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

        </div>
    );
}
