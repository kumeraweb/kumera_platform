import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-emerald-600">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Página no encontrada
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          La página que buscas no existe o fue movida. Puedes volver al inicio o
          explorar nuestras categorías.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            Ir al inicio
          </Link>
          <Link
            href="/servicios"
            className="text-sm font-semibold text-slate-700 hover:text-emerald-600"
          >
            Ver categorías
          </Link>
        </div>
      </div>
    </main>
  );
}
