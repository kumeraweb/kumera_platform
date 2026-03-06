'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ArrowLeft, UserCheck, XCircle, Send, RotateCcw } from 'lucide-react';

type Lead = {
  id: string;
  wa_profile_name: string | null;
  wa_user_id: string;
  conversation_status: 'ACTIVE' | 'HUMAN_REQUIRED' | 'HUMAN_TAKEN' | 'CLOSED';
  score: number;
};

type Message = {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  text_content: string;
  created_at: string;
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

export default function LeadConversationPage() {
  const params = useParams<{ leadId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/panel/leads/${params.leadId}/messages`, { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'No se pudo cargar la conversación');
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      setLead(payload.lead);
      setMessages(payload.messages ?? []);
      if (!silent) {
        setLoading(false);
      }
    },
    [params.leadId]
  );

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function run() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/panel/login');
        return;
      }

      if (!active) return;
      await load();

      realtimeChannel = supabase
        .channel(`panel-lead-${params.leadId}-${data.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `lead_id=eq.${params.leadId}`
          },
          () => {
            void load({ silent: true });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `id=eq.${params.leadId}`
          },
          () => {
            void load({ silent: true });
          }
        )
        .subscribe();

      intervalId = setInterval(() => {
        void load({ silent: true });
      }, 6000);
    }

    void run();
    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, [load, params.leadId, router, supabase]);

  async function onTake() {
    const response = await fetch(`/api/panel/leads/${params.leadId}/take`, { method: 'POST' });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? 'No se pudo tomar conversación');
      return;
    }
    await load();
  }

  async function onCloseLead() {
    const reason = askCloseReason();
    if (!reason) return;

    const response = await fetch(`/api/panel/leads/${params.leadId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? 'No se pudo cerrar');
      return;
    }
    await load();
  }

  async function onReopenLead() {
    const response = await fetch(`/api/panel/leads/${params.leadId}/reopen`, { method: 'POST' });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? 'No se pudo reabrir');
      return;
    }
    await load();
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!messageText.trim()) return;

    const response = await fetch(`/api/panel/leads/${params.leadId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: messageText.trim() })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? 'No se pudo enviar');
      return;
    }

    setMessageText('');
    await load({ silent: true });
  }

  return (
    <div className="min-h-[100dvh] bg-[#F9F9F6] text-[#111] flex flex-col font-sans antialiased">
      {/* ─── Chat Top Bar ─── */}
      <div className="px-4 md:px-6 py-3 bg-white border-b border-[#E5E5E5] shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/panel/leads">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[#52525B] text-[12px] font-semibold shadow-sm hover:bg-[#F9F9F6] hover:text-[#111] transition-colors">
                <ArrowLeft size={14} />
                Volver
              </button>
            </Link>
            {lead ? (
              <div className="min-w-0">
                <p className="text-[15px] md:text-[16px] font-extrabold tracking-[-0.02em] text-[#111] truncate">
                  {lead.wa_profile_name ?? 'Sin nombre'}
                </p>
                <p className="text-[11px] font-mono text-[#71717A] truncate">{lead.wa_user_id}</p>
              </div>
            ) : (
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-[#111]">Conversación</span>
            )}
          </div>

          {lead && (
            <div className="flex gap-1.5 md:gap-2 shrink-0">
              <button
                onClick={onTake}
                disabled={lead.conversation_status !== 'HUMAN_REQUIRED'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] md:text-[12px] font-bold transition-all ${
                  lead.conversation_status === 'HUMAN_REQUIRED'
                    ? 'bg-[#111] text-white hover:bg-black'
                    : 'bg-[#F4F4F0] text-[#A1A1AA] border border-[#E5E5E5] cursor-not-allowed'
                }`}
              >
                <UserCheck size={13} /> Atender
              </button>
              <button
                onClick={onCloseLead}
                disabled={lead.conversation_status === 'CLOSED'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] md:text-[12px] font-bold transition-colors ${
                  lead.conversation_status === 'CLOSED'
                    ? 'bg-[#F4F4F0] text-[#A1A1AA] border border-[#E5E5E5] cursor-not-allowed'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
              >
                <XCircle size={13} /> Cerrar
              </button>
              <button
                onClick={onReopenLead}
                disabled={lead.conversation_status !== 'CLOSED'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] md:text-[12px] font-bold transition-colors ${
                  lead.conversation_status === 'CLOSED'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-[#F4F4F0] text-[#A1A1AA] border border-[#E5E5E5] cursor-not-allowed'
                }`}
              >
                <RotateCcw size={13} /> Reabrir
              </button>
            </div>
          )}
        </div>
        {lead && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              lead.conversation_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              lead.conversation_status === 'HUMAN_TAKEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              lead.conversation_status === 'HUMAN_REQUIRED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {lead.conversation_status}
            </span>
            <span className="text-[11px] text-[#52525B] font-medium">
              Score <strong className="font-bold text-[#111]">{lead.score}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ─── Loading / Error ─── */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[14px] font-medium text-[#A1A1AA] tracking-wide">Cargando...</span>
        </div>
      )}
      {error && (
        <div className="m-4 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold mx-auto w-full max-w-3xl">
          {error}
        </div>
      )}

      {/* ─── Chat Messages Area ─── */}
      {lead && !loading && (
        <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-4 bg-[#F9F9F6] max-w-4xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[13px] text-[#A1A1AA] font-medium">Conversación sin historial</span>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col max-w-[85%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 ${
                message.direction === 'INBOUND' ? 'self-start' : 'self-end'
              }`}
            >
              <div 
                className={`px-4 py-3 text-[14px] leading-relaxed break-words shadow-sm border ${
                  message.direction === 'INBOUND' 
                  ? 'bg-white border-[#E5E5E5] text-[#111] rounded-2xl rounded-tl-sm' 
                  : 'bg-[#111] border-[#111] text-white rounded-2xl rounded-tr-sm'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {message.text_content}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1 ${
                message.direction === 'INBOUND' ? 'text-[#A1A1AA] self-start' : 'text-[#A1A1AA] self-end'
              }`}>
                {message.direction === 'INBOUND' ? 'Lead' : 'Bot / Agente'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Message Input ─── */}
      {lead && !loading && (
        <div className="p-4 bg-white border-t border-[#E5E5E5] shrink-0 sticky bottom-0">
          <form onSubmit={onSend} className="max-w-4xl mx-auto w-full flex items-center gap-3">
            <input
              type="text"
              placeholder="Escribe un mensaje para el cliente..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-[#F9F9F6] border border-[#E5E5E5] text-[#111] text-[14px] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all placeholder:text-[#A1A1AA]"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="w-12 h-12 rounded-xl bg-[#111] text-white flex items-center justify-center shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:bg-[#A1A1AA] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send size={18} className="translate-x-0.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
