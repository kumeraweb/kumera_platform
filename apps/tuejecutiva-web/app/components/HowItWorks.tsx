import { Search, FileCheck, MessageCircle } from "lucide-react";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            ¿Cómo funciona TuEjecutiva?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Conecta con profesionales reales en 3 simples pasos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/10 mb-6 text-emerald-600">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              1. Elige una categoría
            </h3>
            <p className="mt-2 text-slate-600">
              Explora las categorías de servicio disponibles y encuentra
              profesionales especializados en lo que necesitas.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/10 mb-6 text-emerald-600">
              <FileCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              2. Revisa perfiles verificados
            </h3>
            <p className="mt-2 text-slate-600">
              Cada profesional tiene identidad confirmada y credenciales
              validadas. Revisa su perfil y elige con confianza.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/10 mb-6 text-emerald-600">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              3. Contacta directamente
            </h3>
            <p className="mt-2 text-slate-600">
              Escribe por WhatsApp o llama. Sin intermediarios, sin bots. Hablas
              directo con quien te va a atender.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
