"use client";

import Image from "next/image";

interface HeroOnboardingProps {
  onActivate: () => void;
}

const BENEFITS = [
  "Perfil público optimizado para Google",
  "Contacto directo por WhatsApp",
  "Visibilidad independiente de la marca que representas",
];

export default function HeroOnboarding({ onActivate }: HeroOnboardingProps) {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden text-center">
      <div className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center opacity-[0.03]">
        <Image
          src="/images/certification.png"
          alt="Sello de Certificación"
          width={600}
          height={600}
          className="h-[120%] w-auto max-w-none object-contain blur-[1px]"
          priority
        />
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-4 sm:px-6">
        <div className="mb-8">
          <Image
            src="/logo/logonbg.png"
            alt="TuEjecutiva.cl Logo"
            width={260}
            height={90}
            className="h-auto w-52 sm:w-72"
            priority
          />
        </div>

        <h1 className="mb-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Forma parte de la red verificada de ejecutivas en Chile
        </h1>

        <p className="mx-auto mb-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
          Activa tu perfil profesional y comienza a recibir consultas directas relacionadas con tu
          servicio.
        </p>

        <p className="mb-8 text-sm font-medium text-slate-500">
          Proceso de revisión manual para asegurar calidad y confianza.
        </p>

        <div
          aria-label="Beneficios de activar tu perfil"
          className="mb-8 w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm sm:p-6"
        >
          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.266a1 1 0 0 1-1.42-.006L3.29 9.081a1 1 0 1 1 1.42-1.408l4.09 4.122 6.49-6.5a1 1 0 0 1 1.414-.006Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onActivate}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-900 px-10 py-4 text-base font-semibold text-white shadow-xl transition-colors duration-300 hover:bg-slate-800"
        >
          <span className="relative z-20">Activar mi perfil profesional</span>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </button>

        <p className="mt-6 text-xs font-medium text-slate-500">
          Perfiles revisados manualmente antes de su publicación.
        </p>
      </div>
    </div>
  );
}
