import Link from "next/link";
import { CheckCircle } from "lucide-react";

const benefits = [
    {
        name: "Validación de Identidad",
        description:
            "Verificamos tu identidad para que el cliente sepa que eres una ejecutiva real y confiable.",
    },
    {
        name: "Exposición Premium",
        description:
            "Destaca tu perfil para aparecer primero y recibir más contactos en tu rubro.",
    },
    {
        name: "Sin Intermediarios",
        description:
            "Te contactan directo por WhatsApp o teléfono. Tú controlas tu proceso y tu comisión.",
    },
];

export default function SoyEjecutivaPage() {
    return (
        <div className="bg-white">
            <div className="relative isolate overflow-hidden bg-slate-900 pb-16 pt-14 sm:pb-20">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-800 to-indigo-800 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-display">
                            Más contactos. Menos curiosos.
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                            Crea tu perfil verificado en TuEjecutiva.cl y recibe contactos directos de clientes que buscan contratar. Sin intermediarios.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/postular"
                                className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all"
                            >
                                Postular Gratis
                            </Link>
                            <Link href="/planes-ejecutivas" className="text-sm font-semibold leading-6 text-white group">
                                Ver Planes Premium <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-gray-400">
                            Empieza gratis. Sin compromiso.
                        </p>
                    </div>
                </div>

                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                    <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-emerald-800 to-indigo-800 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">
                        Por qué unirse
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        La confianza es lo que te hace vender
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        En un mercado saturado, un perfil verificado reduce la desconfianza y mejora la calidad de los contactos que recibes.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {benefits.map((benefit) => (
                            <div key={benefit.name} className="flex flex-col items-start text-left bg-slate-50 p-8 rounded-2xl border border-slate-100/50 hover:shadow-lg transition-shadow">
                                <div className="rounded-lg bg-white p-2 ring-1 ring-slate-900/10 mb-5">
                                    <CheckCircle className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                                </div>
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    {benefit.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                                    <p className="flex-auto">{benefit.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            <div className="bg-slate-50 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">
                            El Proceso
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Es simple y gratuito comenzar
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl lg:mt-20 lg:max-w-4xl">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 text-center">
                            <div className="relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xl mx-auto mb-4 relative z-10 shadow-lg ring-4 ring-white">1</div>
                                <h3 className="text-lg font-semibold text-slate-900">Postula</h3>
                                <p className="mt-2 text-slate-600">Completa tu perfil en 2 minutos con tus datos profesionales básicos.</p>
                            </div>
                            <div className="relative">
                                <div className="hidden lg:block absolute top-6 left-[-50%] right-[50%] h-0.5 bg-gray-200 z-0" aria-hidden="true" />

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xl mx-auto mb-4 relative z-10 shadow-lg ring-4 ring-white">2</div>
                                <h3 className="text-lg font-semibold text-slate-900">Verificamos</h3>
                                <p className="mt-2 text-slate-600">Validamos tu identidad y antecedentes para otorgarte el sello de confianza.</p>
                            </div>
                            <div className="relative">
                                <div className="hidden lg:block absolute top-6 left-[-50%] right-[50%] h-0.5 bg-gray-200 z-0" aria-hidden="true" />

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xl mx-auto mb-4 relative z-10 shadow-lg ring-4 ring-white">3</div>
                                <h3 className="text-lg font-semibold text-slate-900">Publicamos</h3>
                                <p className="mt-2 text-slate-600">Tu perfil queda listado para que te contacten clientes reales.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex justify-center">
                        <Link
                            href="/postular"
                            className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all"
                        >
                            Comenzar Postulación
                        </Link>
                    </div>
                </div>
            </div>

            <div className="relative bg-indigo-900 py-16 sm:py-24">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        ¿Quieres potenciar aún más tu alcance?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
                        Descubre nuestros planes diseñados para acelerar tu crecimiento y conectar con clientes específicos de tu rubro.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/planes-ejecutivas"
                            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-indigo-900 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all transform hover:scale-105"
                        >
                            Ver Planes y Precios
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
