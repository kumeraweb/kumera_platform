import {
  Ambulance,
  HeartHandshake,
  Stethoscope,
  Shield,
  Scale,
  Wrench,
  TriangleAlert,
} from "lucide-react";
import ExecutiveGrid from "@/app/components/ExecutiveGrid";
import RegionFilter from "@/app/components/RegionFilter";
import {
  getCategoryBySlug,
  getExecutivesByCategory,
  getRegions,
} from "@/lib/queries";
import type { ExecutiveRecord } from "@/lib/queries";
import type { ElementType } from "react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ coverage?: string; region?: string | string[] }>;
}

function filterExecutives(
  list: ExecutiveRecord[],
  coverageAllOnly: boolean,
  regionCodes: string[]
) {
  if (coverageAllOnly) {
    return list.filter((exec) => exec.coverage_all);
  }
  if (regionCodes.length === 0) {
    return list;
  }
  return list.filter((exec) => {
    if (exec.coverage_all) return true;
  const execRegionCodes = (exec.executive_regions ?? [])
    .map((join) => join?.regions?.code)
    .filter((code): code is string => Boolean(code));
    return execRegionCodes.some((code) => regionCodes.includes(code));
  });
}

const iconMap: Record<string, ElementType> = {
  "planes-de-rescate-y-ambulancia": Ambulance,
  "planes-de-salud": Stethoscope,
  "planes-funerarios": Shield,
  "planes-y-seguros-automotrices": Wrench,
  "planes-y-seguros-de-vida": HeartHandshake,
  "asesoria-legal": Scale,
};

export default async function ServicioDetallePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const safeSlug = decodeURIComponent(slug).trim();
  const category = await getCategoryBySlug(safeSlug);
  if (!category) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const coverage = resolvedSearchParams?.coverage ?? null;
  const selectedRegionsRaw = resolvedSearchParams?.region ?? [];
  const selectedRegions = Array.isArray(selectedRegionsRaw)
    ? selectedRegionsRaw
    : selectedRegionsRaw
      ? [selectedRegionsRaw]
      : [];
  const coverageAllOnly = coverage === "all";

  const [regions, allExecutives] = await Promise.all([
    getRegions(),
    getExecutivesByCategory(safeSlug),
  ]);

  const executives = filterExecutives(allExecutives, coverageAllOnly, selectedRegions);

  const Icon = iconMap[category.slug] || Shield;
  const showEmergencyWarning =
    category.slug === "planes-de-rescate-y-ambulancia";

  return (
    <main>
      <div className="bg-slate-900 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base font-semibold leading-7 text-emerald-400 flex items-center justify-center gap-2">
            <Icon className="w-6 h-6" /> Categoría
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {category.name}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {category.description}
          </p>
          <p className="mt-4 text-sm text-emerald-100/90">
            TuEjecutiva.cl no vende planes ni representa oficialmente a las empresas. Facilitamos
            el contacto directo con ejecutivas verificadas.
          </p>
        </div>
      </div>

      {showEmergencyWarning ? (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mx-auto max-w-7xl mt-8 mx-4 lg:mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Información Importante:</strong> Este portal conecta con
                ejecutivas de venta de planes.
                <span className="block mt-1 font-bold">
                  NO ATENDEMOS EMERGENCIAS MÉDICAS.
                </span>
                Si tienes una emergencia vital, llama al 131 o acude al servicio
                de urgencia más cercano.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <RegionFilter
              regions={regions}
              selectedRegions={selectedRegions}
              coverageAll={coverageAllOnly}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Ejecutivas disponibles
              </h2>
              <p
                id="filter-status"
                className={`text-sm text-slate-500 mt-1 ${
                  coverageAllOnly || selectedRegions.length > 0 ? "" : "hidden"
                }`}
              >
                Filtrando por:{" "}
                {coverageAllOnly
                  ? "Todo Chile"
                  : `${selectedRegions.length} regiones seleccionadas`}
              </p>
            </div>

            {executives.length > 0 ? (
              <ExecutiveGrid executives={executives} />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-slate-500">
                  No encontramos ejecutivas con esos filtros, pero seguimos
                  sumando profesionales cada semana.
                </p>
                <div className="mt-4">
                  <a
                    href={`/servicios/${category.slug}`}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Ver todas en esta categoría
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="bg-emerald-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            ¿Eres ejecutiva de {category.name}?
          </h2>
          <p className="mt-4 text-slate-600">
            Únete a nuestra plataforma y recibe clientes calificados.
          </p>
          <div className="mt-8">
            <a
              href="/postular"
              className="inline-block rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Postular como Ejecutiva
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
