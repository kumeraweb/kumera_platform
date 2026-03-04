import Link from "next/link";
import {
  Home,
  ChevronRight,
  User,
  MapPin,
  Briefcase,
  Phone,
  MessageCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  getExecutiveBySlug,
  getExecutivePlansByExecutiveId,
  type ExecutiveCategoryJoin,
  type ExecutivePlanRecord,
  type ExecutiveRegionJoin,
} from "@/lib/queries";
import {
  getCompanyLogoUrl,
  getDefaultExecutivePhoto,
  getExecutivePhotoUrl,
} from "@/lib/executivePhoto";
import { getContactLinks } from "@/lib/contactLinks";
import ExecutiveHero from "@/app/components/executive/ExecutiveHero";
import ExecutivePlansGrid from "@/app/components/executive/ExecutivePlansGrid";
import ExecutiveCertificate from "@/app/components/executive/ExecutiveCertificate";
import ExecutiveCompanyInfo from "@/app/components/executive/ExecutiveCompanyInfo";
import ExecutiveStickyCTA from "@/app/components/executive/ExecutiveStickyCTA";
import TrackedWhatsappLink from "@/app/components/TrackedWhatsappLink";
import TrackedCallLink from "@/app/components/TrackedCallLink";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPhoneForDisplay(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("+56")) return trimmed;

  const digits = trimmed.slice(1).replace(/\D/g, "");
  if (digits.length < 11) return trimmed;

  const country = `+${digits.slice(0, 2)}`;
  const mobile = digits.slice(2, 3);
  const part1 = digits.slice(3, 7);
  const part2 = digits.slice(7, 11);
  return `${country} ${mobile} ${part1} ${part2}`;
}

export default async function ExecutiveDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const safeSlug = decodeURIComponent(slug).trim();

  const executive = await getExecutiveBySlug(safeSlug);
  if (!executive || !executive.verified) {
    notFound();
  }

  const exec = executive;
  let plans: ExecutivePlanRecord[] = [];
  try {
    plans = await getExecutivePlansByExecutiveId(exec.id);
  } catch (error) {
    console.error("Error fetching executive plans", { executiveId: exec.id, error });
  }

  const categories = (exec.executive_categories ?? [])
    .map((item) => item.categories)
    .filter(Boolean) as Array<NonNullable<ExecutiveCategoryJoin["categories"]>>;
  const category = categories[0] ?? { name: "General", slug: "general" };
  const showNonEmergencyNotice = categories.some((item) => {
    const normalizedSlug = item.slug.trim().toLowerCase();
    const normalizedName = item.name.trim().toLowerCase();
    return (
      normalizedSlug === "planes-de-rescate-y-ambulancia" ||
      normalizedSlug === "planes-de-salud" ||
      normalizedName.includes("rescate") ||
      normalizedName.includes("ambulancia") ||
      normalizedName.includes("salud")
    );
  });

  const coverageRegions = (exec.executive_regions ?? [])
    .map((item) => item.regions)
    .filter(Boolean) as Array<NonNullable<ExecutiveRegionJoin["regions"]>>;

  const coverageLabel = exec.coverage_all
    ? "Todo Chile"
    : coverageRegions.length > 0
      ? coverageRegions.map((region) => region.name).join(", ")
      : "Sin definir";

  const safeWhatsapp = exec.whatsapp_message || "Hola, vi tu perfil en TuEjecutiva.cl";
  const safePhotoUrl =
    getExecutivePhotoUrl(exec.photo_url) ||
    getDefaultExecutivePhoto(exec.slug || exec.name);
  const safeCompanyLogoUrl = getCompanyLogoUrl(exec.company_logo_url);

  const contactLinks = getContactLinks(exec.phone, safeWhatsapp);
  const waLink = contactLinks.waHref;
  const telLink = contactLinks.telHref;
  const phoneDisplay = formatPhoneForDisplay(contactLinks.normalizedPhone ? `+${contactLinks.normalizedPhone}` : "");
  const callLabel = phoneDisplay ? `Llamar al ${phoneDisplay}` : "Llamar ahora";
  const safeDescription = exec.description?.trim() || null;
  const safeSpecialty = exec.specialty?.trim() || null;
  const experienceLabel = exec.experience_years !== null && exec.experience_years !== undefined
    ? `${exec.experience_years} Años`
    : null;
  const verifiedDateLabel = exec.verified_date || "Reciente";

  return (
    <main className="bg-slate-50 flex-1 pb-24 sm:pb-32">
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-slate-500">
                  <span className="sr-only">Home</span>
                  <Home className="h-4 w-4" />
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <li>
                <Link
                  href={`/servicios/${category.slug}`}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  {category.name}
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <li>
                <span className="text-xs font-medium text-slate-900" aria-current="page">
                  {exec.name}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <ExecutiveHero
          name={exec.name}
          specialty={safeSpecialty}
          description={safeDescription}
          experienceYears={exec.experience_years ?? null}
          photoUrl={safePhotoUrl}
          verified={exec.verified}
          phoneLink={telLink}
          phoneDisplay={phoneDisplay}
          whatsappLink={waLink}
          companyName={exec.company}
          companyLogoUrl={safeCompanyLogoUrl}
          companyWebsiteUrl={exec.company_website_url}
          showNonEmergencyNotice={showNonEmergencyNotice}
          hasPlans={plans.length > 0}
          showFeaturedBadge={exec.plan === "oro"}
        />

        {plans.length > 0 && (
          <section id="planes-disponibles" className="scroll-mt-24">
            <ExecutivePlansGrid plans={plans} whatsappLink={waLink} />
          </section>
        )}

        <ExecutiveCertificate verifiedDate={verifiedDateLabel} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {safeDescription ? (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Sobre mi servicio
                </h2>
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="whitespace-pre-line leading-relaxed">
                    {safeDescription}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="bg-emerald-50 p-2.5 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cobertura</span>
                  <span className="text-sm font-semibold text-slate-700">{coverageLabel}</span>
                </div>
              </div>
              {experienceLabel ? (
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
                  <div className="bg-emerald-50 p-2.5 rounded-lg">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Experiencia</span>
                    <span className="text-sm font-semibold text-slate-700">{experienceLabel}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                Contacto Rápido
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Elige cómo prefieres contactar.
                </p>
                <TrackedCallLink
                  href={telLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:translate-y-px text-center leading-tight whitespace-normal"
                >
                  <Phone className="w-4 h-4" />
                  {callLabel}
                </TrackedCallLink>
                <TrackedWhatsappLink
                  href={waLink}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp a {exec.name.split(" ")[0]}
                </TrackedWhatsappLink>
                <p className="text-[10px] text-center text-slate-400">
                  Respuesta promedio: Menos de 1 hora
                </p>
              </div>
            </div>
          </div>
        </div>

        <ExecutiveCompanyInfo
          companyName={exec.company}
          companyLogoUrl={safeCompanyLogoUrl}
          companyWebsiteUrl={exec.company_website_url}
        />

      </div>

      <ExecutiveStickyCTA
        phoneLink={telLink}
        whatsappLink={waLink}
        hasPlans={plans.length > 0}
      />
    </main>
  );
}
