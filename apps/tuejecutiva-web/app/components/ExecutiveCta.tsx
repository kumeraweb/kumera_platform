import Link from "next/link";
import { TrendingUp, Star, Megaphone } from "lucide-react";

export default function ExecutiveCta() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32">
      <div
        className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-emerald-900/20 to-slate-800/30 opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div
        className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
        aria-hidden="true"
      >
        <div
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-emerald-900/20 to-slate-800/30 opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-pretty">
            ¿Vives de vender servicios?
            <span className="block text-emerald-400 mt-2">
              Publica tu perfil y recibe contactos.
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-xl mx-auto">
            Empieza gratis. A medida que crezcas, elige un plan para destacar y
            recibir más oportunidades.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Plan Gratis */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Gratis</h3>
                <p className="text-xs text-gray-400">Para empezar</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 flex-1">
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Perfil verificado publicado
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Contacto directo de clientes
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Tráfico base de tu categoría
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-2xl font-bold text-white">$0</p>
            </div>
          </div>

          {/* Plan Destacada */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 ring-2 ring-emerald-500/50 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
              Recomendado
            </span>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <Star className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Destacada</h3>
                <p className="text-xs text-gray-400">Más visibilidad</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 flex-1">
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Todo lo del plan Gratis
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Posición destacada en categoría
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Mayor prioridad en listados
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-2xl font-bold text-white">
                $49.000 <span className="text-sm font-normal text-gray-400">+ IVA / mes</span>
              </p>
            </div>
          </div>

          {/* Plan Tráfico */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Megaphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Tráfico a Perfil</h3>
                <p className="text-xs text-gray-400">Máximo alcance</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300 flex-1">
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Todo lo del plan Destacada
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Campañas dirigidas a tu perfil
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">✓</span> Tráfico pagado calificado
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-2xl font-bold text-white">
                $120.000 <span className="text-sm font-normal text-gray-400">+ IVA / mes</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/postular"
            className="rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all transform hover:scale-105"
          >
            Publicar mi Perfil Gratis
          </Link>
          <p className="mt-3 text-sm text-gray-400">
            Sin compromiso. Tú decides si destacas después.
          </p>
        </div>
      </div>
    </section>
  );
}
