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
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-pretty">
                ¿Eres ejecutiva y vives de comisiones?
                <span className="block text-emerald-400 mt-2">
                  Recibe contactos directos.
                </span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Deja de competir solo por precio. En TuEjecutiva.cl verificamos tu
                identidad y trayectoria para que clientes reales te elijan con
                confianza.
              </p>
              <div className="mt-8 flex gap-x-4 items-center">
                <a
                  href="/soy-ejecutiva"
                  className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all transform hover:scale-105"
                >
                  Postular Gratis
                </a>
                <a
                  href="/planes-ejecutivas"
                  className="text-sm font-semibold leading-6 text-white hover:text-emerald-300"
                >
                  Ver Planes Premium <span aria-hidden="true">→</span>
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Empieza gratis. Tú decides si destacas tu perfil después.
              </p>
            </div>
            <div className="relative lg:ml-auto">
              <div className="relative rounded-xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/10 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <img
                      src="/images/certification.png"
                      alt="Sello de Certificación"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Perfil Verificado
                    </h3>
                    <p className="text-sm text-slate-500">Más confianza, más cierres</p>
                  </div>
                </div>
                <ul className="space-y-4 text-slate-600 text-sm">
                  <li className="flex gap-2 items-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Más confianza = más cierres
                  </li>
                  <li className="flex gap-2 items-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Contactos directos
                  </li>
                  <li className="flex gap-2 items-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Menos curiosos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
