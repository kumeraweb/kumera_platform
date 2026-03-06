'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { RefreshCw, LogOut, Eye, Building2, ChevronLeft, ChevronRight, MessageCircle, Archive, ChevronRight as ChevronRightRow } from 'lucide-react';

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

const PAGE_SIZE = 20;

export default function PanelLeadsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [mobileTab, setMobileTab] = useState<'active' | 'closed'>('active');

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

  return (
    <div className="min-h-[100dvh] bg-[#F9F9F6] text-[#111] flex flex-col font-sans antialiased">
      {/* ─── Compact Header ─── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-white border-b border-[#E5E5E5] shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-[18px] font-extrabold tracking-[-0.04em]">Chats</span>
          {tenant && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#F4F4F0] border border-[#E5E5E5] text-[12px] text-[#52525B]">
              <Building2 size={14} />
              <span className="font-bold text-[#111]">{tenant.client_name ?? 'Cliente'}</span>
              {tenant.user_email && <span className="text-[#A1A1AA]">· {tenant.user_email}</span>}
            </div>
          )}
        </div>
        <div className="hidden md:flex gap-3">
          <button 
            onClick={() => void loadLeads()} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[#52525B] text-[13px] font-bold shadow-sm hover:bg-[#F9F9F6] hover:text-[#111] transition-colors"
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          <button 
            onClick={signOut} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[#52525B] text-[13px] font-bold shadow-sm hover:bg-[#F9F9F6] hover:text-[#111] transition-colors"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-auto p-0 md:p-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-8">
        {loading && (
          <div className="flex items-center justify-center h-[200px]">
            <span className="text-[14px] text-[#A1A1AA] font-medium tracking-wide">Cargando leads...</span>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="md:hidden px-4 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] text-[#71717A] font-medium">
                {tenant?.client_name ? `Cuenta: ${tenant.client_name}` : 'Panel de conversaciones'}
              </p>
              <button
                onClick={() => void loadLeads()}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#52525B] bg-white border border-[#E5E5E5] rounded-md px-2.5 py-1.5"
              >
                <RefreshCw size={13} /> Refrescar
              </button>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              {((mobileTab === 'active' && activeLeads.length === 0) ||
                (mobileTab === 'closed' && closedLeads.length === 0)) && (
                <div className="p-6 text-center text-[13px] text-[#71717A]">
                  {mobileTab === 'active'
                    ? 'No hay chats activos por ahora.'
                    : 'No hay chats cerrados en historial.'}
                </div>
              )}

              {(mobileTab === 'active' ? activeLeads : closedLeads).map((lead) => (
                <Link key={lead.id} href={`/panel/leads/${lead.id}`} className="block border-b border-[#F4F4F0] last:border-b-0">
                  <div className="px-4 py-3 flex items-start gap-3 hover:bg-[#FAFAF8] transition-colors">
                    <div className="w-11 h-11 rounded-full bg-[#E9F9EF] text-[#059669] flex items-center justify-center text-[14px] font-bold shrink-0">
                      {(lead.wa_profile_name?.trim()?.charAt(0) ?? '#').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-bold text-[#111827] truncate">
                          {lead.wa_profile_name ?? 'Sin nombre'}
                        </p>
                        <span
                          className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${
                            lead.conversation_status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.conversation_status === 'HUMAN_REQUIRED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : lead.conversation_status === 'HUMAN_TAKEN'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {lead.conversation_status === 'CLOSED' ? 'CERRADO' : 'ACTIVO'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#52525B] truncate mt-0.5">
                        {lead.last_message || 'Sin mensajes'}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-[#A1A1AA] font-mono">{lead.wa_user_id}</span>
                        <span className="text-[11px] font-semibold text-[#374151]">Score {lead.score}</span>
                      </div>
                    </div>
                    <ChevronRightRow size={16} className="text-[#A1A1AA] mt-3 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="hidden md:block bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
            {activeLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] bg-[#F9F9F6]">
                      {['Nombre', 'Número', 'Estado', 'Score', 'Último mensaje', 'Acción'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-[11px] font-black uppercase tracking-[0.08em] text-[#A1A1AA] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-[#F4F4F0] hover:bg-[#F9F9F6] transition-colors">
                        <td className="py-4 px-4 font-bold text-[#111] whitespace-nowrap">
                          {lead.wa_profile_name ?? 'Sin nombre'}
                        </td>
                        <td className="py-4 px-4 font-mono text-[12px] text-[#52525B]">
                          {lead.wa_user_id}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            lead.conversation_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            lead.conversation_status === 'HUMAN_TAKEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            lead.conversation_status === 'HUMAN_REQUIRED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {lead.conversation_status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#111] min-w-[24px]">{lead.score}</span>
                            <div className="w-10 h-1.5 rounded-full bg-[#F4F4F0] overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${lead.score > 30 ? 'bg-emerald-500' : lead.score > 0 ? 'bg-amber-400' : 'bg-gray-300'}`} 
                                style={{ width: `${Math.min(Math.max(lead.score, 0), 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-[#52525B] text-[13px]">
                          {lead.last_message || '-'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex gap-2 justify-end">
                            <Link href={`/panel/leads/${lead.id}`}>
                              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E5E5E5] text-[#111] text-[12px] font-bold shadow-sm hover:bg-[#F9F9F6] transition-colors whitespace-nowrap">
                                <Eye size={14} /> Atender
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[#A1A1AA] text-[14px]">
                No hay leads activos en este momento.
              </div>
            )}

            {/* ─── Pagination ─── */}
            {activeLeads.length > PAGE_SIZE && (
              <div className="flex items-center justify-between p-4 border-t border-[#E5E5E5] bg-[#F9F9F6] text-[12px] font-medium text-[#52525B]">
                <span>{activeLeads.length} leads activos · página {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-[#E5E5E5] text-[#111] disabled:text-[#A1A1AA] disabled:bg-transparent shadow-sm hover:bg-[#F4F4F0] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-[#E5E5E5] text-[#111] disabled:text-[#A1A1AA] disabled:bg-transparent shadow-sm hover:bg-[#F4F4F0] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Closed Leads ─── */}
        {!loading && !error && closedLeads.length > 0 && (
          <details className="hidden md:block mt-8 bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden group">
            <summary className="cursor-pointer list-none flex items-center justify-between p-4 bg-[#F9F9F6] border-b border-transparent group-open:border-[#E5E5E5]">
              <span className="text-[13px] font-black uppercase tracking-[0.05em] text-[#52525B]">
                Historial Cerrado ({closedLeads.length})
              </span>
              <span className="text-[#A1A1AA] group-open:rotate-180 transition-transform"><ChevronRight size={16}/></span>
            </summary>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F9F9F6]">
                    {['Nombre', 'Número', 'Score', 'Último mensaje', 'Acción'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[11px] font-black uppercase tracking-[0.08em] text-[#A1A1AA] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closedLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#F4F4F0] hover:bg-[#F9F9F6] transition-colors">
                      <td className="py-4 px-4 font-bold text-[#111] whitespace-nowrap">
                        {lead.wa_profile_name ?? 'Sin nombre'}
                      </td>
                      <td className="py-4 px-4 font-mono text-[12px] text-[#A1A1AA]">
                        {lead.wa_user_id}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-[#A1A1AA]">{lead.score}</td>
                      <td className="py-4 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-[#A1A1AA] text-[13px]">
                        {lead.last_message || '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/panel/leads/${lead.id}`}>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent border border-[#E5E5E5] text-[#52525B] text-[12px] font-bold hover:bg-white hover:text-[#111] hover:border-[#111] transition-colors whitespace-nowrap">
                            <Eye size={14} /> Historial
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="p-8 mt-4 text-center text-[#52525B] text-[14px] bg-[#F4F4F0] rounded-lg border border-[#E5E5E5] border-dashed">
            Sin leads visibles para este tenant. 
          </div>
        )}
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[#E5E5E5] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="grid grid-cols-3">
          <button
            onClick={() => setMobileTab('active')}
            className={`py-3.5 px-2 flex flex-col items-center gap-1 text-[11px] font-semibold ${
              mobileTab === 'active' ? 'text-[#111] bg-[#F9F9F6]' : 'text-[#71717A]'
            }`}
          >
            <MessageCircle size={18} />
            <span>Leads activos</span>
          </button>
          <button
            onClick={() => setMobileTab('closed')}
            className={`py-3.5 px-2 flex flex-col items-center gap-1 text-[11px] font-semibold ${
              mobileTab === 'closed' ? 'text-[#111] bg-[#F9F9F6]' : 'text-[#71717A]'
            }`}
          >
            <Archive size={18} />
            <span>Leads cerrados</span>
          </button>
          <button
            onClick={signOut}
            className="py-3.5 px-2 flex flex-col items-center gap-1 text-[11px] font-semibold text-[#71717A]"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
