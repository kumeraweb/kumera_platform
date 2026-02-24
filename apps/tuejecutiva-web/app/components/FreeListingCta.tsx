import Link from "next/link";

export default function FreeListingCta() {
    return (
        <section className="bg-slate-50 border-y border-slate-200">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:flex lg:items-center lg:justify-between lg:px-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-pretty">
                        ¿Eres ejecutiva y vives de comisiones?
                        <span className="block text-emerald-600 mt-1">Listarte en TuEjecutiva.cl es gratis.</span>
                    </h2>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                        Crea tu perfil verificado y recibe contactos directos por WhatsApp o teléfono. Menos curiosos, más cierres.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Empieza gratis. Sin compromiso.
                    </p>
                </div>
                <div className="mt-10 flex items-center gap-x-6 lg:mt-0 lg:flex-shrink-0">
                    <Link
                        href="/soy-ejecutiva"
                        className="rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all"
                    >
                        Postular Gratis
                    </Link>
                    <Link href="/postular" className="text-sm font-semibold leading-6 text-slate-900 hover:text-emerald-600">
                        Ver proceso <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
