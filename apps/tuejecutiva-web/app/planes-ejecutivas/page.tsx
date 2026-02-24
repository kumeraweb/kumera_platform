import Link from "next/link";
import { Check } from "lucide-react";

const tiers = [
    {
        name: "Gratuito",
        id: "free",
        href: "/postular?plan=free",
        priceMonthly: "$0",
        description: "Empieza con tu perfil verificado y recibe contactos directos.",
        features: [
            "Perfil listado en el directorio",
            "Sello de verificación (tras validación)",
            "Contacto directo de clientes",
        ],
        featured: false,
        cta: "Registrarse Gratis",
    },
    {
        name: "Bronce",
        id: "bronze",
        href: "/postular?plan=bronze",
        priceMonthly: "$25.000",
        suffix: "+ IVA / mes",
        description: "Destaca entre tus colegas de rubro.",
        features: [
            "Todo lo incluido en el plan Gratuito",
            "Perfil destacado en tu rubro",
            "Más visibilidad en búsquedas por categoría",
        ],
        featured: false,
        cta: "Solicitar Plan Bronce",
    },
    {
        name: "Plata",
        id: "silver",
        href: "/postular?plan=silver",
        priceMonthly: "$49.000",
        suffix: "+ IVA / mes",
        description: "Aumenta tu exposición para recibir más contactos.",
        features: [
            "Todo lo incluido en el plan Bronce",
            "Aparición destacada en diversas páginas del sitio",
            "Inclusión en campañas para tu rubro",
            "Prioridad en resultados de búsqueda",
        ],
        featured: false,
        cta: "Solicitar Plan Plata",
    },
    {
        name: "Oro",
        id: "gold",
        href: "/postular?plan=gold",
        priceMonthly: "$120.000",
        suffix: "+ IVA / mes",
        description: "Máxima exposición para atraer clientes de tu rubro.",
        features: [
            "Todo lo incluido en el plan Plata",
            "Campañas publicitarias exclusivas dirigidas a tu perfil",
            "Destacado Premium en Home y categorías",
            "Soporte preferencial",
        ],
        featured: true,
        cta: "Solicitar Plan Oro",
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
                        Destaca tu perfil y recibe más contactos
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        Empieza gratis con perfil verificado. Si quieres más exposición, elige un plan para aparecer destacado y atraer clientes de tu rubro.
                    </p>
                </div>

                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4">
                    {tiers.map((tier, tierIdx) => (
                        <div
                            key={tier.id}
                            className={classNames(
                                tier.featured ? "relative bg-slate-900 shadow-2xl" : "bg-white/60 sm:mx-8 lg:mx-0",
                                tier.featured
                                    ? ""
                                    : tierIdx === 0
                                        ? "rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl"
                                        : "sm:rounded-t-none lg:rounded-tr-none lg:rounded-bl-none",
                                "rounded-3xl p-8 ring-1 ring-slate-900/10 xl:p-10 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300"
                            )}
                        >
                            <div>
                                <div className="flex justify-between items-center gap-x-4">
                                    <h3
                                        id={tier.id}
                                        className={classNames(
                                            tier.featured ? "text-white" : "text-slate-900",
                                            "text-lg font-semibold leading-8"
                                        )}
                                    >
                                        {tier.name}
                                    </h3>
                                    {tier.featured ? (
                                        <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                                            Más Popular
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">
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
                    ))}
                </div>
            </div>
        </div>
    );
}
