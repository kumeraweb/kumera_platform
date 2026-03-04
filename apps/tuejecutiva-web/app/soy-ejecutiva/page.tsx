import Link from "next/link";
import { CheckCircle, TrendingUp, Star, Megaphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Publica tu Perfil Profesional",
    description:
        "Crea tu perfil verificado en TuEjecutiva.cl y recibe contactos directos de clientes. Empieza gratis, sin compromiso.",
};

const benefits = [
    {
        name: "Perfil Verificado",
        description:
            "Validamos tu identidad para que los clientes confíen en ti desde el primer contacto.",
    },
    {
        name: "Contacto Directo",
        description:
            "Te contactan por WhatsApp o teléfono. Sin intermediarios, sin comisiones. Tú controlas tu proceso.",
    },
    {
        name: "Tráfico Base Incluido",
        description:
            "Aunque tu plan sea gratuito, recibes visitas de clientes que buscan servicios de tu categoría.",
    },
];

export default function SoyEjecutivaPage() {
    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="relative isolate overflow-hidden bg-slate-900 pb-16 pt-14 sm:pb-20">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-800 to-indigo-800 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-display">
                            Publica tu perfil. Recibe clientes.
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                            Crea tu perfil verificado en TuEjecutiva.cl y deja que
                            los clientes te encuentren. Contacto directo, sin
                            intermediarios.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/postular"
                                className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all"
                            >
                                Publicar Gratis
                            </Link>
                            <Link href="/planes-ejecutivas" className="text-sm font-semibold leading-6 text-white group">
                                Ver Planes <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-gray-400">
                            Empieza gratis. Crece con planes opcionales.
                        </p>
                    </div>
                </div>

                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                    <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-emerald-800 to-indigo-800 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
                </div>
            </div>

            {/* Benefits */}
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">
                        Por qué publicar tu perfil
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Tu perfil trabaja por ti las 24 horas
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        En un mercado saturado, un perfil verificado reduce la
                        desconfianza y mejora la calidad de los contactos que
                        recibes.
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

            {/* Process */}
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
                                <h3 className="text-lg font-semibold text-slate-900">Recibes contactos</h3>
                                <p className="mt-2 text-slate-600">Tu perfil queda publicado y empiezas a recibir tráfico de tu categoría.</p>
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

            {/* 3-Plan Progression */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">
                            Crece a tu ritmo
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Empieza gratis, escala cuando veas resultados
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            Tu perfil gratuito ya recibe tráfico. Cuando quieras más visibilidad, da el siguiente paso.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 flex flex-col text-center">
                            <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-900 text-lg">Gratis</h3>
                            <p className="text-sm text-slate-500 mt-2 flex-1">
                                Perfil publicado, sello de verificación y contacto directo. Recibes tráfico base de tu categoría.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white p-6 ring-2 ring-emerald-500 flex flex-col text-center relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                                Próximo paso
                            </span>
                            <Star className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-900 text-lg">Destacada</h3>
                            <p className="text-sm text-slate-500 mt-2 flex-1">
                                Posición prioritaria en tu categoría. Más visibilidad, más contactos.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 flex flex-col text-center">
                            <Megaphone className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-900 text-lg">Tráfico a Perfil</h3>
                            <p className="text-sm text-slate-500 mt-2 flex-1">
                                Campañas dirigidas a tu perfil. Tráfico calificado para acelerar tu crecimiento.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href="/planes-ejecutivas"
                            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Comparar Planes y Precios
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
