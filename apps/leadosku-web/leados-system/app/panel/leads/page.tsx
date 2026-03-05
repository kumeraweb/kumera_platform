'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { RefreshCw, LogOut, Eye, Building2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

type LeadRow = {
  id: string;
  wa_profile_name: string | null;
  wa_user_id: string;
  conversation_status: 'ACTIVE' | 'HUMAN_REQUIRED' | 'HUMAN_TAKEN' | 'CLOSED';
  score: number;
  updated_at: string;
  last_message: string;
};

type TenantInfo = {
  user_email: string | null;
  client_name: string | null;
};

type CloseReason = 'CLIENT_NO_RESPONSE' | 'ATTENDED_OTHER_LINE';

function askCloseReason(): CloseReason | null {
  const selected = window.prompt(
    'Selecciona motivo de cierre:\n1) Cliente no responde\n2) Atencion tomada en otra linea\n\nEscribe 1 o 2'
  );
  if (selected === '1') return 'CLIENT_NO_RESPONSE';
  if (selected === '2') return 'ATTENDED_OTHER_LINE';
  return null;
}

const PAGE_SIZE = 20;

export default function PanelLeadsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [closingLeadId, setClosingLeadId] = useState<string | null>(null);

  const activeLeads = leads.filter((lead) => lead.conversation_status !== 'CLOSED');
  const closedLeads = leads.filter((lead) => lead.conversation_status === 'CLOSED');
  const totalPages = Math.max(1, Math.ceil(activeLeads.length / PAGE_SIZE));
  const pagedLeads = activeLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const loadLeads = useCallback(
    async (options?: { silent?: boolean; keepPage?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/panel/login');
        return;
      }

      const response = await fetch('/api/panel/leads', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'No se pudo cargar leads');
      } else {
        const nextLeads = payload.leads ?? [];
        setLeads(nextLeads);
        setTenant(payload.tenant ?? null);
        if (!options?.keepPage) {
          setPage(0);
        } else {
          setPage((prev) => {
            const nextTotalPages = Math.max(1, Math.ceil(nextLeads.length / PAGE_SIZE));
            return Math.min(prev, nextTotalPages - 1);
          });
        }
      }
      if (!silent) {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function setup() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/panel/login');
        return;
      }
      if (!isMounted) return;

      await loadLeads();

      const realtimeChannel = supabase
        .channel(`panel-leads-${data.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads' },
          () => {
            void loadLeads({ silent: true, keepPage: true });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => {
            void loadLeads({ silent: true, keepPage: true });
          }
        )
        .subscribe();

      intervalId = setInterval(() => {
        void loadLeads({ silent: true, keepPage: true });
      }, 10000);

      return () => {
        if (intervalId) clearInterval(intervalId);
        void supabase.removeChannel(realtimeChannel);
      };
    }

    let cleanup: (() => void) | undefined;
    void setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadLeads, router, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/panel/login');
  }

  async function onCloseLead(leadId: string) {
    const reason = askCloseReason();
    if (!reason) return;

    setClosingLeadId(leadId);
    setError(null);

    const response = await fetch(`/api/panel/leads/${leadId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? 'No se pudo cerrar la conversación');
      setClosingLeadId(null);
      return;
    }

    await loadLeads({ silent: true, keepPage: true });
    setClosingLeadId(null);
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#111827', color: '#e5e7eb',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* ─── Compact Header ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: '#0f172a',
        borderBottom: '1px solid #1e293b', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>Leads</span>
          {tenant ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', borderRadius: 6,
              background: '#1e293b', fontSize: 11, color: '#94a3b8'
            }}>
              <Building2 size={12} />
              <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{tenant.client_name ?? 'Cliente'}</span>
              {tenant.user_email ? <span>· {tenant.user_email}</span> : null}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => void loadLeads()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 6,
            background: 'transparent', border: '1px solid #334155',
            color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={signOut} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 6,
            background: 'transparent', border: '1px solid #334155',
            color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Cargando...</span>
          </div>
        ) : null}

        {error ? (
          <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 10, overflow: 'hidden'
          }}>
            {activeLeads.length > 0 ? (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      {['Nombre', 'Número', 'Estado', 'Score', 'Último mensaje', 'Acciones'].map((h) => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 10px',
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.06em', color: '#64748b', whiteSpace: 'nowrap'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLeads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                          {lead.wa_profile_name ?? 'Sin nombre'}
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
                          {lead.wa_user_id}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${lead.conversation_status}`} style={{ fontSize: 10 }}>
                            {lead.conversation_status}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: '#f1f5f9', minWidth: 24 }}>{lead.score}</span>
                            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#1e293b', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 2, background: '#3b82f6', width: `${Math.min(lead.score, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '10px', maxWidth: 160, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: 12
                        }}>
                          {lead.last_message || '-'}
                        </td>
                        <td style={{ padding: '10px 6px 10px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                            <Link href={`/panel/leads/${lead.id}`}>
                              <button style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 6,
                                background: '#1e293b', border: '1px solid #334155',
                                color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}>
                                <Eye size={12} />
                                Ver
                              </button>
                            </Link>
                            <button
                              onClick={() => void onCloseLead(lead.id)}
                              disabled={closingLeadId === lead.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 6,
                                background: 'transparent', border: '1px solid #334155',
                                color: '#fca5a5',
                                fontSize: 11, fontWeight: 600,
                                cursor: closingLeadId === lead.id ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <XCircle size={12} />
                              {closingLeadId === lead.id ? 'Cerrando...' : 'Cerrar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '14px 12px', color: '#64748b', fontSize: 13 }}>
                No hay leads activos en este momento.
              </div>
            )}

            {/* ─── Pagination ─── */}
            {activeLeads.length > PAGE_SIZE ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderTop: '1px solid #1e293b',
                fontSize: 12, color: '#64748b'
              }}>
                <span>{activeLeads.length} leads activos · página {page + 1} de {totalPages}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 6,
                      background: page === 0 ? 'transparent' : '#1e293b',
                      border: '1px solid #334155',
                      color: page === 0 ? '#334155' : '#94a3b8',
                      cursor: page === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 6,
                      background: page >= totalPages - 1 ? 'transparent' : '#1e293b',
                      border: '1px solid #334155',
                      color: page >= totalPages - 1 ? '#334155' : '#94a3b8',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && closedLeads.length > 0 ? (
          <details style={{
            marginTop: 12,
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <summary style={{
              cursor: 'pointer',
              listStyle: 'none',
              padding: '10px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: '#94a3b8',
              borderBottom: '1px solid #1e293b'
            }}>
              Leads cerrados ({closedLeads.length})
            </summary>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['Nombre', 'Número', 'Score', 'Último mensaje', 'Acciones'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '8px 10px',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: '#64748b', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closedLeads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                        {lead.wa_profile_name ?? 'Sin nombre'}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
                        {lead.wa_user_id}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#f1f5f9' }}>{lead.score}</td>
                      <td style={{
                        padding: '10px', maxWidth: 160, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: 12
                      }}>
                        {lead.last_message || '-'}
                      </td>
                      <td style={{ padding: '10px 6px 10px 10px', textAlign: 'right' }}>
                        <Link href={`/panel/leads/${lead.id}`}>
                          <button style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 6,
                            background: '#1e293b', border: '1px solid #334155',
                            color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}>
                            <Eye size={12} />
                            Ver
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}

        {!loading && !error && leads.length === 0 ? (
          <div style={{
            padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13
          }}>
            Sin leads visibles para este tenant. Revisa mapping en <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>user_clients</code> y políticas RLS.
          </div>
        ) : null}
      </div>
    </div>
  );
}
