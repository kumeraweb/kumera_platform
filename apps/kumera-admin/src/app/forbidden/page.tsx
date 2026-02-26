import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main
      className="grid min-h-screen place-items-center p-6"
      style={{ background: "var(--admin-bg)" }}
    >
      <section
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl"
          style={{ background: "var(--admin-error-subtle)", color: "var(--admin-error)" }}
        >
          ✕
        </div>
        <h1 className="m-0 text-xl font-bold" style={{ color: "var(--admin-text)" }}>
          Acceso denegado
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Tu usuario no tiene permisos para este módulo administrativo.
        </p>
        <Link
          className="admin-btn admin-btn-secondary mt-5 inline-flex"
          href="/admin"
        >
          Volver al dashboard
        </Link>
      </section>
    </main>
  );
}
