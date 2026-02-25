import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="card">
      <h2>Panel administrativo central</h2>
      <p>Desde aquí se administra billing, Tuejecutiva y LeadOS con un solo acceso.</p>
      <div className="admin-grid">
        <Link className="card-link" href="/admin/roles">
          Roles globales (core)
        </Link>
        <Link className="card-link" href="/admin/subscriptions">
          Suscripciones (billing)
        </Link>
        <Link className="card-link" href="/admin/leados">
          LeadOS admin
        </Link>
      </div>
    </section>
  );
}
