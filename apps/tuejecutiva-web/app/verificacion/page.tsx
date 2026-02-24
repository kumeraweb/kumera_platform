import Image from "next/image";

export default function VerificacionPage() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              Nuestro estándar de{" "}
              <span className="text-emerald-600">verificación</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Entendemos que contratar servicios hoy en día requiere confianza.
              Por eso, cada ejecutiva en nuestro portal pasa por un proceso
              manual de validación antes de aparecer visible.
            </p>

            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                    1
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-900">
                    Identidad Confirmada
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Validamos RUT y antecedentes de identidad de la persona.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                    2
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-900">
                    Relación Comercial / Laboral
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Solicitamos credenciales, correos corporativos o contratos
                    que acrediten que vende lo que dice vender.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                    3
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-900">
                    Canales de Contacto
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Verificamos que el teléfono y WhatsApp de contacto sean
                    reales y estén operativos.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-10 rounded-md bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> La verificación reduce riesgos
                significativamente, pero no reemplaza tu criterio. Siempre
                solicita credenciales oficiales antes de transferir dinero o
                firmar contratos. TuEjecutiva es un conector, no el proveedor
                del servicio final.
              </p>
            </div>
          </div>

          <div className="mt-12 lg:mt-0 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-slate-100 rounded-3xl transform rotate-3 scale-95 opacity-70" />
            <div className="relative bg-white p-8 rounded-3xl shadow-xl ring-1 ring-gray-900/5">
              <div className="text-center py-12">
                <div className="mx-auto h-32 w-32 flex items-center justify-center mb-6">
                  <Image
                    src="/images/certification.png"
                    alt="Sello de Certificación TuEjecutiva"
                    className="h-full w-full object-contain drop-shadow-md"
                    width={128}
                    height={128}
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Sello de Confianza
                </h3>
                <p className="mt-2 text-slate-500">
                  Busca este sello en los perfiles de nuestras ejecutivas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
