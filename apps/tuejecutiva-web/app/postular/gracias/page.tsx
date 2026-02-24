import Link from "next/link";

export default function PostularGraciasPage() {
  return (
    <main className="relative isolate overflow-hidden bg-slate-50 py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_35rem_at_top,theme(colors.emerald.50),theme(colors.slate.50),white)] opacity-90" />
      <div className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl sm:p-14">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-7 w-7 text-emerald-600"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 111.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Postulación enviada
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Gracias por postular en TuEjecutiva.cl
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Recibimos tu información correctamente. Nuestro equipo revisará tu
            postulación y te contactará para los siguientes pasos de verificación.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Volver al inicio
            </Link>
            <Link
              href="/soy-ejecutiva"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600"
            >
              Ver beneficios para ejecutivas <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
