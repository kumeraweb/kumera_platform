import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../data/site";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="block mb-4">
              <Image
                src="/logo/logonbg.png"
                alt="TuEjecutiva"
                className="h-8 w-auto"
                width={128}
                height={32}
              />
            </Link>
            <p className="mt-4 text-sm text-slate-500 max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/verificacion"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  Proceso de Verificación
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
              Transparencia
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="text-sm text-slate-500">
                Operado por{" "}
                <a
                  href="https://www.kumeraweb.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
                >
                  Kumera
                </a>
              </li>
              <li className="text-sm text-slate-500">
                Contacto:{" "}
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-emerald-600 hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-100 pt-8">
          <p className="text-center text-xs text-slate-600 max-w-3xl mx-auto font-medium">
            TuEjecutiva.cl es un directorio informativo independiente. No vende planes directamente ni representa
            oficialmente a las empresas listadas. Cada ejecutiva es un agente independiente responsable de su
            relación comercial y cumplimiento normativo con la empresa indicada.
          </p>
          <p className="text-center text-xs text-slate-400 mt-3">
            © {currentYear} {siteConfig.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
