import Link from "next/link";
import type { ElementType } from "react";
import {
  Ambulance,
  HeartHandshake,
  Stethoscope,
  Shield,
  Scale,
  Wrench,
} from "lucide-react";
import { getCategoriesWithExecutives } from "@/lib/queries";

export const dynamic = "force-dynamic";

const iconMap: Record<string, ElementType> = {
  "planes-de-rescate-y-ambulancia": Ambulance,
  "planes-de-salud": Stethoscope,
  "planes-funerarios": Shield,
  "planes-y-seguros-automotrices": Wrench,
  "planes-y-seguros-de-vida": HeartHandshake,
  "asesoria-legal": Scale,
};

export default async function ServiciosIndexPage() {
  const categories = await getCategoriesWithExecutives();

  return (
    <main className="bg-white">
      <div className="px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Índice de Servicios
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Encuentra la categoría que buscas y conecta con una ejecutiva
            verificada especializada en el rubro.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            TuEjecutiva.cl no vende planes ni representa oficialmente a las empresas.
            Facilitamos el contacto directo con ejecutivas verificadas.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = iconMap[category.slug] || Shield;
              return (
                <Link
                  key={category.id}
                  href={`/servicios/${category.slug}`}
                  className="relative flex flex-col gap-4 rounded-2xl border border-gray-200 p-8 hover:border-emerald-500 hover:shadow-lg transition-all group"
                >
                  <div className="text-emerald-600">
                    <Icon
                      className="w-12 h-12 group-hover:scale-110 transition-transform"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
