import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Acceso denegado</h1>
        <p>Tu usuario no tiene permisos para este módulo administrativo.</p>
        <Link href="/admin">Volver al dashboard</Link>
      </section>
    </main>
  );
}
