import Link from "next/link";
import { Check, TrendingUp, Star, Megaphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Planes y Precios",
    description:
        "Empieza gratis con tu perfil verificado. Destaca en tu categoría o recibe tráfico dirigido con nuestros planes de crecimiento.",
};

const tiers = [
    {
        name: "Gratis",
        id: "free",
        href: "/postular?plan=free",
        priceMonthly: "$0",
        description: "Para empezar a recibir contactos sin costo.",
        icon: TrendingUp,
        features: [
            "Perfil publicado en el directorio",
            "Sello de verificación (tras validación)",
            "Contacto directo por WhatsApp y teléfono",
            "Tráfico base de tu categoría",
            "Perfil visible en búsquedas",
        ],
        featured: false,
        cta: "Publicar Gratis",
        badge: null,
        metrics: {
            label: "Lo que recibes",
            items: ["Visitas de perfil", "Clics de contacto"],
        },
    },
    {
        name: "Destacada",
        id: "destacada",
        href: "/postular?plan=destacada",
        priceMonthly: "$49.000",
        suffix: "+ IVA / mes",
        description: "Más visibilidad para recibir más contactos.",
        icon: Star,
        features: [
            "Todo lo incluido en el plan Gratis",
            "Posición destacada en tu categoría",
            "Mayor prioridad en listados",
            "Badge de perfil destacado",
            "Exposición en bloques premium",
        ],
        featured: true,
        cta: "Solicitar Plan Destacada",
        badge: "Recomendado",
        metrics: {
            label: "Resultado esperado",
            items: ["Más visitas de perfil", "Más clics de contacto", "Mayor tasa de respuesta"],
        },
    },
    {
        name: "Tráfico a Perfil",
        id: "trafico",
        href: "/postular?plan=trafico",
        priceMonthly: "$120.000",
        suffix: "+ IVA / mes",
        description: "Campañas dirigidas para acelerar tu crecimiento.",
        icon: Megaphone,
        features: [
            "Todo lo incluido en el plan Destacada",
            "Micro-campañas dirigidas a tu perfil",
            "Tráfico pagado calificado a tu ficha",
            "Mayor volumen de visitas",
            "Soporte preferencial",
        ],
        featured: false,
        cta: "Solicitar Plan Tráfico",
        badge: "Máximo alcance",
        metrics: {
            label: "Resultado esperado",
            items: ["Máximo volumen de visitas", "Contactos calificados", "Aceleración de cierres"],
        },
    },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function PlanesEjecutivasPage() {
    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">
                        Planes y Precios
                    </h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl font-display">
                        Empieza gratis, crece a tu ritmo
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        Tu perfil gratuito ya recibe tráfico de tu categoría. Cuando
                        veas resultados, da el siguiente paso para potenciar tu
                        alcance.
                    </p>
                </div>

                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        return (
                            <div
                                key={tier.id}
                                className={classNames(
                                    tier.featured
                                        ? "relative bg-slate-900 shadow-2xl ring-2 ring-emerald-500"
                                        : "bg-white/60 ring-1 ring-slate-900/10",
                                    "rounded-3xl p-8 xl:p-10 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300"
                                )}
                            >
                                <div>
                                    <div className="flex justify-between items-center gap-x-4">
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={classNames(
                                                    tier.featured ? "text-emerald-400" : "text-emerald-600",
                                                    "w-6 h-6"
                                                )}
                                            />
                                            <h3
                                                id={tier.id}
                                                className={classNames(
                                                    tier.featured ? "text-white" : "text-slate-900",
                                                    "text-lg font-semibold leading-8"
                                                )}
                                            >
                                                {tier.name}
                                            </h3>
                                        </div>
                                        {tier.badge ? (
                                            <span className={classNames(
                                                tier.featured
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
                                                "rounded-full px-2.5 py-1 text-xs font-semibold leading-5"
                                            )}>
                                                {tier.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className={classNames(
                                        tier.featured ? "text-gray-300" : "text-slate-600",
                                        "mt-4 text-sm leading-6"
                                    )}>
                                        {tier.description}
                                    </p>
                                    <p className="mt-6 flex items-baseline gap-x-1">
                                        <span
                                            className={classNames(
                                                tier.featured ? "text-white" : "text-slate-900",
                                                "text-4xl font-bold tracking-tight"
                                            )}
                                        >
                                            {tier.priceMonthly}
                                        </span>
                                        {tier.suffix && (
                                            <span
                                                className={classNames(
                                                    tier.featured ? "text-gray-300" : "text-gray-500",
                                                    "text-sm font-semibold leading-6"
                                                )}
                                            >
                                                {tier.suffix}
                                            </span>
                                        )}
                                    </p>
                                    <ul
                                        role="list"
                                        className={classNames(
                                            tier.featured ? "text-gray-300" : "text-gray-600",
                                            "mt-8 space-y-3 text-sm leading-6"
                                        )}
                                    >
                                        <li className="flex gap-x-3 items-center">
                                            <img src="/images/certification.png" alt="Sello" className="h-5 w-5 object-contain opacity-80" />
                                            <span className={tier.featured ? "text-white font-medium" : "text-slate-900 font-medium"}>
                                                Incluye Sello de Verificación
                                            </span>
                                        </li>
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex gap-x-3">
                                                <Check
                                                    className={classNames(
                                                        tier.featured ? "text-emerald-400" : "text-emerald-600",
                                                        "h-6 w-5 flex-none"
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Value Metrics Placeholder */}
                                    <div className={classNames(
                                        tier.featured ? "bg-white/5 ring-white/10" : "bg-slate-50 ring-slate-200/50",
                                        "mt-6 rounded-xl p-4 ring-1"
                                    )}>
                                        <p className={classNames(
                                            tier.featured ? "text-gray-400" : "text-slate-500",
                                            "text-xs font-semibold uppercase tracking-wide mb-2"
                                        )}>
                                            {tier.metrics.label}
                                        </p>
                                        <ul className="space-y-1">
                                            {tier.metrics.items.map((item) => (
                                                <li key={item} className={classNames(
                                                    tier.featured ? "text-gray-300" : "text-slate-600",
                                                    "text-sm flex items-center gap-2"
                                                )}>
                                                    <span className={classNames(
                                                        tier.featured ? "bg-emerald-400" : "bg-emerald-500",
                                                        "w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    )} />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <Link
                                    href={tier.href}
                                    aria-describedby={tier.id}
                                    className={classNames(
                                        tier.featured
                                            ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 focus-visible:outline-emerald-500"
                                            : "text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:ring-emerald-300",
                                        "mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                                    )}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                <div className="mx-auto max-w-2xl text-center mt-16">
                    <p className="text-sm text-slate-500">
                        ¿No sabes cuál elegir? Empieza con el plan Gratis — recibirás
                        tráfico real de tu categoría y podrás evaluar resultados antes
                        de escalar.
                    </p>
                </div>
            </div>
        </div>
    );
}
