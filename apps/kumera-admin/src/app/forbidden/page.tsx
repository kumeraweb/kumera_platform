import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="m-0 text-2xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="mt-2 text-sm text-slate-600">Tu usuario no tiene permisos para este módulo administrativo.</p>
        <Link className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline" href="/admin">Volver al dashboard</Link>
      </section>
    </main>
  );
}
