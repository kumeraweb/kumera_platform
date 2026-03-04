import {
  getCompanyLogoUrl,
  getDefaultExecutivePhoto,
  getExecutivePhotoUrl,
} from "@/lib/executivePhoto";
import { getContactLinks } from "@/lib/contactLinks";
import TrackedWhatsappLink from "./TrackedWhatsappLink";
import TrackedCallLink from "./TrackedCallLink";

export interface ExecutiveRegion {
  code: string;
  name: string;
}

export interface ExecutiveRegionJoin {
  regions: ExecutiveRegion | null;
}

export interface Executive {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  company: string | null;
  experience_years: number | null;
  specialty: string | null;
  description: string | null;
  whatsapp_message: string | null;
  photo_url: string | null;
  company_logo_url: string | null;
  coverage_all: boolean;
  plan: "bronce" | "plata" | "oro" | null;
  verified: boolean | null;
  executive_regions?: ExecutiveRegionJoin[] | null;
}

interface ExecutiveCardProps {
  executive: Executive;
}

export default function ExecutiveCard({ executive }: ExecutiveCardProps) {
  const isGold = executive.plan === "oro";
  const isSilver = executive.plan === "plata";
  const isBronze = executive.plan === "bronce";

  const coverageRegions = (executive.executive_regions ?? [])
    .map((join) => join?.regions)
    .filter((region): region is ExecutiveRegion => Boolean(region));

  const coverageLabel = executive.coverage_all
    ? "Cobertura: Todo Chile"
    : coverageRegions.length > 0
      ? `Cobertura: ${coverageRegions.map((region) => region.name).join(", ")}`
      : "Cobertura: Sin definir";

  let containerClass =
    "relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow duration-300";
  if (isGold) {
    containerClass =
      "relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-amber-200 transform hover:-translate-y-1 transition-all duration-300";
  } else if (isSilver) {
    containerClass =
      "relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-300 hover:shadow-lg transition-all duration-300";
  } else if (isBronze) {
    containerClass =
      "relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow duration-300";
  }

  const safeWhatsapp = executive.whatsapp_message || "";
  const companyLogoUrl = getCompanyLogoUrl(executive.company_logo_url);
  const photoUrl =
    getExecutivePhotoUrl(executive.photo_url) ||
    getDefaultExecutivePhoto(executive.slug || executive.name);

  const contactLinks = getContactLinks(executive.phone, safeWhatsapp);
  const waLink = contactLinks.waHref;
  const telLink = contactLinks.telHref;

  const safeDescription = executive.description || "Sin descripción.";
  const safeSpecialty = executive.specialty || "Sin especialidad";
  const experienceLabel =
    executive.experience_years === null || executive.experience_years === undefined
      ? "—"
      : executive.experience_years;

  return (
    <article
      className={containerClass}
      data-executive-card="true"
      data-coverage-all={executive.coverage_all ? "true" : "false"}
      data-coverage-regions={coverageRegions.map((region) => region.code).join(",")}
    >
      {isGold ? (
        <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 px-3 py-1 text-[10px] tracking-wider font-bold rounded-bl-lg z-10 uppercase">
          Destacada
        </div>
      ) : null}
      {isSilver ? (
        <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 px-3 py-1 text-[10px] tracking-wider font-bold rounded-bl-lg z-10 uppercase">
          Más Elegida
        </div>
      ) : null}

      <a href={`/ejecutivas/${executive.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">Ver perfil de {executive.name}</span>
      </a>

      <div className="p-5 flex flex-col h-full relative pointer-events-none">
        {executive.verified && (
          <div className="absolute top-4 right-4 z-0 opacity-10 pointer-events-none">
            <img src="/images/certification.png" alt="" className="w-24 h-24" />
          </div>
        )}

        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="relative flex-shrink-0">
            <img
              src={photoUrl}
              alt={executive.name}
              className={`h-16 w-16 rounded-full object-cover ring-2 ring-offset-2 ${isGold
                ? "ring-amber-400"
                : isSilver
                  ? "ring-slate-200"
                  : "ring-emerald-500/30"
                }`}
            />
            {executive.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Ejecutiva Verificada">
                <img src="/images/certification.png" alt="Verificada" className="w-6 h-6" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
              {executive.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wide font-medium">
              {coverageLabel.replace("Cobertura: ", "")}
            </p>
          </div>
        </div>

        <div className="mb-4 relative z-10 bg-slate-50/80 rounded-xl p-3 border border-slate-100/80">
          <div className="flex items-center gap-3 mb-2">
            {companyLogoUrl ? (
              <div className="flex-shrink-0 bg-white border border-slate-100 rounded-lg p-1 h-8 w-8 flex items-center justify-center shadow-sm">
                <img
                  src={companyLogoUrl}
                  alt={executive.company || "Empresa"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-700 leading-none truncate block">
                {executive.company || "Ejecutiva Independiente"}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Ejecutiva verificada por TuEjecutiva.cl
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-snug border-t border-slate-200/50 pt-2 mt-1">
            <span className="font-semibold text-slate-500">Nota:</span> Gestiona planes de la compañía. TuEjecutiva.cl es independiente.
          </div>
        </div>

        <div className="flex-1 relative z-10">
          <div className="flex flex-wrap gap-2 mb-3">
            {safeSpecialty !== "Sin especialidad" && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                {safeSpecialty}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
              {experienceLabel} años exp.
            </span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {safeDescription}
          </p>
        </div>

        <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100 relative z-20 pointer-events-auto">
          <TrackedWhatsappLink
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all hover:shadow hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            WhatsApp
          </TrackedWhatsappLink>
          <TrackedCallLink
            href={telLink}
            className="rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Llamar
          </TrackedCallLink>
        </div>
      </div>
    </article>
  );
}
