'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { LogIn } from 'lucide-react';

export default function PanelLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/panel/leads');
  }

  return (
    <div className="kumi-light-landing flex items-center justify-center min-h-screen">
      <div className="k-card w-full max-w-md mx-4 animate-fade-in-up">
        
        <div className="k-logo justify-center mb-8">
          Kumi <span>by Kumera</span>
        </div>
        
        <h1 className="k-h2 mb-2 text-center text-[28px]">Panel Cliente</h1>
        <p className="k-body text-center mb-8 text-[14px]">Accede a tus leads y conversaciones en tiempo real.</p>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-widest text-[#52525B]">Email</label>
            <input
              className="w-full px-4 py-4 md:py-3 border border-[#E5E5E5] rounded-lg text-[15px] focus:outline-none focus:border-[#111] transition-colors bg-white text-[#111]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-widest text-[#52525B]">Contraseña</label>
            <input
              className="w-full px-4 py-4 md:py-3 border border-[#E5E5E5] rounded-lg text-[15px] focus:outline-none focus:border-[#111] transition-colors bg-white text-[#111]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && <div className="bg-red-50 text-red-600 text-[13px] font-semibold p-3 rounded border border-red-100">{error}</div>}
          
          <button className="k-btn-black w-full mt-4 h-[52px] md:h-[48px] text-[15px]" disabled={loading}>
            {loading ? (
              'Ingresando...'
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={20} />
                Ingresar al Flow
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
