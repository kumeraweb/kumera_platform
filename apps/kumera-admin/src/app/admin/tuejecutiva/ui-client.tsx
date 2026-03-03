"use client";

import { FormEvent, useState } from "react";

type ExecutiveRow = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  company: string;
  plan: "bronce" | "plata" | "oro" | null;
  status: "draft" | "pending" | "active" | "inactive";
  verified: boolean;
  created_at: string;
  executive_categories?: Array<{ categories: { id: string; name: string; slug: string } | null }>;
  executive_regions?: Array<{ regions: { id: string; code: string; name: string } | null }>;
};

type SubmissionRow = {
  id: string;
  token_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  created_at: string;
};

type Props = {
  initialSubmissions: SubmissionRow[];
  initialExecutives: ExecutiveRow[];
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-success",
    approved: "badge-success",
    pending: "badge-warning",
    reviewed: "badge-accent",
    draft: "badge-neutral",
    inactive: "badge-neutral",
    rejected: "badge-error",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}

export default function TuejecutivaAdminClient({
  initialSubmissions,
  initialExecutives,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenResult, setTokenResult] = useState<null | {
    token: string;
    email: string | null;
    expires_at: string;
    link: string;
    reused: boolean;
  }>(null);

  const [submissions] = useState<SubmissionRow[]>(initialSubmissions);
  const [executives] = useState<ExecutiveRow[]>(initialExecutives);
  const [tokenForm, setTokenForm] = useState({ email: "", expires_in_days: 7 });

  async function onCreateToken(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/tuejecutiva/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenForm),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear token");
      return;
    }

    setTokenResult(payload.token);
    setMessage(
      payload.token.reused
        ? "Token activo reutilizado."
        : "Token creado correctamente."
    );
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <form className="admin-card" onSubmit={onCreateToken}>
        <h2 className="section-title">Generar token onboarding</h2>
        <p className="section-desc">
          Crea el enlace para que la ejecutiva complete su onboarding.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Email (opcional)</label>
            <input
              className="admin-input"
              type="email"
              placeholder="ejecutiva@empresa.cl"
              value={tokenForm.email}
              onChange={(e) =>
                setTokenForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Días de expiración</label>
            <input
              className="admin-input"
              type="number"
              min={1}
              max={30}
              value={tokenForm.expires_in_days}
              onChange={(e) =>
                setTokenForm((prev) => ({
                  ...prev,
                  expires_in_days: Number(e.target.value),
                }))
              }
              required
            />
          </div>
        </div>
        <button className="admin-btn admin-btn-primary mt-4" type="submit">
          Generar token
        </button>

        {tokenResult ? (
          <div className="admin-alert admin-alert-success mt-4">
            <p className="m-0 text-xs font-semibold">
              {tokenResult.reused ? "Token activo reutilizado" : "Token creado"}
            </p>
            <p className="m-0 mt-1 break-all text-xs">{tokenResult.link}</p>
            <p className="m-0 mt-0.5 text-xs">Email: {tokenResult.email ?? "—"}</p>
            <p className="m-0 mt-0.5 text-xs">
              Expira: {new Date(tokenResult.expires_at).toLocaleString("es-CL")}
            </p>
          </div>
        ) : null}
      </form>

      <div className="admin-card">
        <h2 className="section-title">Postulaciones pendientes</h2>
        <p className="section-desc">
          Haz clic en revisar para abrir el formulario precargado y crear la ejecutiva.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      color: "var(--admin-text-muted)",
                      textAlign: "center",
                      padding: "24px 14px",
                    }}
                  >
                    No hay postulaciones pendientes por activar.
                  </td>
                </tr>
              ) : (
                submissions.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.full_name}</td>
                    <td>{row.company || "-"}</td>
                    <td>
                      <p className="m-0 text-xs">{row.email}</p>
                      <p
                        className="m-0 text-[11px]"
                        style={{ color: "var(--admin-text-muted)" }}
                      >
                        {row.phone || "-"}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(row.created_at).toLocaleString("es-CL")}
                    </td>
                    <td>
                      <a
                        href={`/admin/tuejecutiva/submissions/${row.id}`}
                        className="admin-btn admin-btn-secondary admin-btn-sm no-underline"
                      >
                        Revisar
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="section-title">Ejecutivas actuales</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Categorías</th>
                <th>Regiones</th>
              </tr>
            </thead>
            <tbody>
              {executives.map((row) => {
                const categories = (row.executive_categories ?? [])
                  .map((item) => item.categories?.name)
                  .filter(Boolean)
                  .join(", ");
                const regions = (row.executive_regions ?? [])
                  .map((item) => item.regions?.code ?? item.regions?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <tr key={row.id}>
                    <td>
                      <p className="m-0 font-medium">{row.name}</p>
                      <p
                        className="m-0 text-[11px] font-mono"
                        style={{ color: "var(--admin-text-muted)" }}
                      >
                        /{row.slug}
                      </p>
                    </td>
                    <td>{row.company}</td>
                    <td>
                      {row.plan ? <span className="badge badge-accent">{row.plan}</span> : "-"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        {row.verified ? (
                          <span className="badge badge-success">✓</span>
                        ) : (
                          <span className="badge badge-neutral">sin verificar</span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{ color: "var(--admin-text-secondary)", maxWidth: 160 }}
                    >
                      {categories || "-"}
                    </td>
                    <td
                      style={{ color: "var(--admin-text-secondary)", maxWidth: 160 }}
                    >
                      {regions || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
