import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.50),white)] opacity-60" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

      <div className="mx-auto max-w-2xl text-center relative z-10">
        <div className="mb-8 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20 bg-white/50 backdrop-blur-sm">
              Perfiles verificados · Contacto directo{" "}
              <Link href="/verificacion" className="font-semibold text-emerald-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Conoce el proceso <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div
              className="rounded-full px-3 py-1 text-sm leading-6 text-slate-500 ring-1 ring-slate-900/10 bg-white/70 backdrop-blur-sm"
              title="TuEjecutiva es una empresa operada por Kumera Servicios Digitales SpA."
            >
              Operada por Kumera Servicios Digitales SpA
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl text-balance">
          Conecta con profesionales{" "}
          <span className="text-emerald-600">verificados</span> en Chile
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 text-pretty">
          Encuentra ejecutivas y ejecutivos reales, con identidad confirmada y
          trayectoria validada. Contacto directo por WhatsApp o teléfono, sin
          intermediarios.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
          <Link
            href="/servicios"
            className="w-full sm:w-auto rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors text-center"
          >
            Buscar Profesional
          </Link>
          <Link
            href="/postular"
            className="w-full sm:w-auto rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors text-center"
          >
            Publicar mi Perfil Gratis
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Sin costo para publicarte. Crece con planes opcionales.
        </p>
      </div>
    </section>
  );
}
