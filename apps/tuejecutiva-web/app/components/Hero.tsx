import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.slate.50),white)] opacity-40" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

      <div className="mx-auto max-w-2xl text-center relative z-10">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20 bg-white/50 backdrop-blur-sm">
            Portal de confianza y verificación{" "}
            <Link href="/verificacion" className="font-semibold text-emerald-600">
              <span className="absolute inset-0" aria-hidden="true" />
              Leer más <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl text-balance">
          Encuentra el plan perfecto con una <span className="text-emerald-600">experta real</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 text-pretty">
          No hables con robots. Contacta ejecutivas verificadas que te orientarán
          con mayor trazabilidad y verificación, para conocer opciones según tu necesidad de Isapre, Seguros o
          Servicios.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#buscar"
            className="rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            ¿Qué estás buscando?
          </a>
          <Link href="/verificacion" className="text-sm font-semibold leading-6 text-slate-900">
            Ver cómo verificamos <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
