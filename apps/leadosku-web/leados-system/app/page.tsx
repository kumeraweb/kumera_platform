'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, MessageCircle } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   KUMI NODE (Intro + Static)
   ══════════════════════════════════════════════════════════════ */
const KumiNode = ({
  triggerOnVisible = false,
  onComplete,
  staticMode = false
}: {
  triggerOnVisible?: boolean;
  onComplete?: () => void;
  staticMode?: boolean;
}) => {
  const [startAnim, setStartAnim] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (staticMode) {
      return;
    }

    if (triggerOnVisible) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setStartAnim(true);
          observer.disconnect();
        }
      }, { threshold: 0.5 });
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      const timer = setTimeout(() => setStartAnim(true), 300);
      return () => clearTimeout(timer);
    }
  }, [triggerOnVisible, staticMode]);

  useEffect(() => {
    if (startAnim && onComplete) {
      const timer = setTimeout(onComplete, 2200);
      return () => clearTimeout(timer);
    }
  }, [startAnim, onComplete]);

  const nodeStateClass = staticMode ? 'k-node-static' : startAnim ? 'k-node-enter' : 'k-node-pre';

  return (
    <div ref={containerRef} className="relative w-full max-w-[400px] aspect-square flex-shrink-0">
      <svg className={`w-full h-full ${nodeStateClass}`} viewBox="0 0 320 320">
        <circle cx="160" cy="160" r="132" fill="url(#kumiGlow)" className="k-node-glow" />
        <defs>
          <radialGradient id="kumiGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="160" cy="160" r="82" fill="none" stroke="#111" strokeWidth="1" className="k-node-ring-dashed" />
        <circle cx="160" cy="160" r="120" fill="none" stroke="#111" strokeWidth="1" className="k-node-ring" />

        <line x1="160" y1="160" x2="214" y2="118" stroke="#111" strokeWidth="1.2" className="k-node-line k-node-line-1" />
        <line x1="160" y1="160" x2="103" y2="129" stroke="#111" strokeWidth="1.2" className="k-node-line k-node-line-2" />
        <line x1="160" y1="160" x2="206" y2="205" stroke="#111" strokeWidth="1.2" className="k-node-line k-node-line-3" />
        <line x1="160" y1="160" x2="102" y2="188" stroke="#111" strokeWidth="1.2" className="k-node-line k-node-line-4" />

        <g className="k-node-core">
          <circle cx="160" cy="160" r="32" fill="#111" />
          <text x="160" y="161" fill="white" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="800" textAnchor="middle" dominantBaseline="central" letterSpacing="-0.02em">K</text>
        </g>

        <g className="k-node-sat k-node-sat-1">
          <circle cx="214" cy="118" r="8.5" fill="#10B981" />
        </g>
        <g className="k-node-sat k-node-sat-2">
          <circle cx="103" cy="129" r="7" fill="#111" />
        </g>
        <g className="k-node-sat k-node-sat-3">
          <circle cx="206" cy="205" r="7.5" fill="#10B981" />
        </g>
        <g className="k-node-sat k-node-sat-4">
          <circle cx="102" cy="188" r="8" fill="#111" />
        </g>
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STACKED INTERACTIVE HERO (Multi-Industry Showcase)
   ══════════════════════════════════════════════════════════════ */
type HeroFlow = {
  id: string;
  title: string;
  time: string;
  userMsg: string;
  botMsg: string;
  userChoice: string;
  analysisMsg: string;
  resultLabel: string;
  resultTitle: string;
  resultBody: string;
  resultTone: 'positive' | 'neutral';
};

const HERO_FLOWS: HeroFlow[] = [
  {
    id: 'salud',
    title: 'Clinica Dental',
    time: 'hace 2 min',
    userMsg: 'Hola, quiero tomar hora.',
    botMsg: 'Hola, para derivarte correctamente:\n1) Evaluacion inicial\n2) Ortodoncia\n3) Urgencia o dolor',
    userChoice: '3',
    analysisMsg: 'IA preventiva detecta urgencia y prioridad alta.',
    resultLabel: 'Correo enviado',
    resultTitle: 'Asignado a: Recepcion de urgencias',
    resultBody: 'Tu equipo toma el control desde el panel.',
    resultTone: 'positive'
  },
  {
    id: 'inmo',
    title: 'Inmobiliaria',
    time: 'hace 15 min',
    userMsg: 'Info de deptos en Nunoa.',
    botMsg: 'Hola, para darte opciones exactas:\n1) Comprar inversion\n2) Comprar vivir\n3) Arrendar',
    userChoice: '1',
    analysisMsg: 'IA preventiva detecta oportunidad comercial real.',
    resultLabel: 'Correo enviado',
    resultTitle: 'Asignado a: Equipo comercial',
    resultBody: 'El lead queda disponible en el panel de ventas.',
    resultTone: 'positive'
  },
  {
    id: 'fuera_rubro',
    title: 'Consulta fuera de rubro',
    time: 'hace 5 min',
    userMsg: 'Necesito pasajes a Cancun.',
    botMsg: 'Hola, esta empresa ofrece servicios dentales:\n1) Evaluacion inicial\n2) Ortodoncia\n3) Urgencia o dolor',
    userChoice: 'Quiero pasajes',
    analysisMsg: 'IA preventiva detecta solicitud fuera del rubro.',
    resultLabel: 'Filtro activo',
    resultTitle: 'No se deriva a ejecutivo',
    resultBody: 'Kumi contiene el mensaje y vuelve a mostrar opciones validas.',
    resultTone: 'neutral'
  },
  {
    id: 'auto',
    title: 'Servicio Automotriz',
    time: 'hace 1 hora',
    userMsg: 'Tengo un ruido en el motor del Kia.',
    botMsg: 'Hola, para orientarte mejor:\n1) Mantencion\n2) Falla mecanica\n3) Desabolladura',
    userChoice: '2',
    analysisMsg: 'IA preventiva detecta falla especifica y ruta correcta.',
    resultLabel: 'Correo enviado',
    resultTitle: 'Asignado a: Jefe de taller',
    resultBody: 'El equipo tecnico toma la conversacion desde el panel.',
    resultTone: 'positive'
  }
];

const StackedHeroShowcase = () => {
   const [phase, setPhase] = useState<'intro' | 'demo' | 'final'>('intro');
   const [activeCard, setActiveCard] = useState(0);
   const [step, setStep] = useState(0);
   const timerRef = useRef<number[]>([]);

   const clearTimers = () => {
      timerRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timerRef.current = [];
   };

   useEffect(() => {
      if (phase !== 'intro') return;
      const introTimer = window.setTimeout(() => setPhase('demo'), 2600);
      return () => window.clearTimeout(introTimer);
   }, [phase]);

   useEffect(() => {
      if (phase !== 'demo') return;

      let cancelled = false;
      clearTimers();

      const stepSchedule = [900, 2200, 3600, 5200];
      const cardDuration = 6900;

      const runCard = (index: number) => {
         if (cancelled) return;
         setActiveCard(index);
         setStep(0);

         stepSchedule.forEach((time, idx) => {
            const timeoutId = window.setTimeout(() => {
               if (!cancelled) setStep(idx + 1);
            }, time);
            timerRef.current.push(timeoutId);
         });

         const nextCardId = window.setTimeout(() => {
            if (cancelled) return;
            if (index < HERO_FLOWS.length - 1) {
               runCard(index + 1);
               return;
            }
            setPhase('final');
            setStep(0);
         }, cardDuration);
         timerRef.current.push(nextCardId);
      };

      runCard(0);

      return () => {
         cancelled = true;
         clearTimers();
      };
   }, [phase]);

   return (
      <div className="relative w-[330px] sm:w-[400px] md:w-[420px] h-[500px] sm:h-[540px] md:h-[560px] flex justify-center items-center">
         {/* INTRO: Kumi Node Assembly */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${phase === 'intro' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <KumiNode />
         </div>

         {/* MAIN: Stacked Cards */}
         <div className={`absolute left-1/2 -translate-x-1/2 top-6 sm:top-8 w-[300px] sm:w-[340px] md:w-[360px] h-[460px] sm:h-[500px] transition-all duration-700 ease-out ${phase === 'demo' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
         {HERO_FLOWS.map((flow, index) => {
            // Determine vertical position based on active index (cyclic)
            let relativeIndex = index - activeCard;
            if (relativeIndex < 0) relativeIndex += HERO_FLOWS.length;
            
            const isActive = relativeIndex === 0;
            // The further back, the lower it sits and the more it shrinks
            const yOffset = relativeIndex * 20; 
            const scale = 1 - (relativeIndex * 0.05);
            const zIndex = 30 - relativeIndex;
            const opacity = relativeIndex > 2 ? 0 : 1;

            return (
               <div 
                  key={flow.id}
                  className="absolute top-0 left-0 bg-white rounded-xl p-4 sm:p-5 w-full flex flex-col gap-2.5 border border-gray-100 h-[440px] sm:h-[480px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                     transform: `translateY(${yOffset}px) scale(${scale})`,
                     zIndex,
                     opacity,
                     boxShadow: isActive
                        ? '0 24px 42px rgba(0,0,0,0.14)'
                        : '0 10px 24px rgba(0,0,0,0.08)'
                  }}
               >
                  <div className="w-full h-10 border-b border-gray-100 flex items-center px-2 mb-2">
                     <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs mr-3">
                        {flow.title.charAt(0)}
                     </div>
                     <div>
                        <div className="text-[14px] font-bold text-gray-800 leading-tight">{flow.title}</div>
                        <div className="text-[11px] text-gray-500">{flow.time}</div>
                     </div>
                  </div>

                  {isActive ? (
                     <>
                        {/* Step 0: User Message */}
                        <div className="self-start bg-gray-100 p-3 rounded-2xl rounded-tl-sm text-[12px] sm:text-[13px] text-gray-800 max-w-[88%] animate-in fade-in slide-in-from-bottom-2">
                           {flow.userMsg}
                        </div>

                        {/* Step 1: Kumi Options */}
                        {step >= 1 && (
                           <div className="self-end bg-[#10B981] p-3 rounded-2xl rounded-tr-sm text-[12px] sm:text-[13px] text-white max-w-[92%] shadow-sm animate-in fade-in slide-in-from-bottom-2 whitespace-pre-line">
                              {flow.botMsg}
                           </div>
                        )}

                        {/* Step 2: User responds choice */}
                        {step >= 2 && (
                           <div className="self-start bg-gray-100 p-3 rounded-2xl rounded-tl-sm text-[12px] sm:text-[13px] text-gray-800 max-w-[88%] animate-in fade-in slide-in-from-bottom-2">
                              {flow.userChoice}
                           </div>
                        )}
                        
                        {/* Step 3: IA validation */}
                        {step >= 3 && (
                           <div className="w-full flex justify-center py-1 animate-in fade-in zoom-in">
                              <div className={`text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                                 flow.resultTone === 'neutral'
                                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                                    : 'bg-[#ECFDF3] border-[#A7F3D0] text-[#065F46]'
                              }`}>
                                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                 IA preventiva activa: {flow.analysisMsg}
                              </div>
                           </div>
                        )}

                        {/* Step 4: Human Handoff */}
                        {step >= 4 && (
                           <div className={`self-end p-3 rounded-2xl rounded-tr-sm text-[11px] sm:text-[12px] text-gray-600 border w-full animate-in fade-in slide-in-from-bottom-2 mt-auto ${
                              flow.resultTone === 'neutral'
                                 ? 'bg-amber-50 border-amber-200'
                                 : 'bg-[#E5E7EB] border-gray-200'
                           }`}>
                              <div className="font-bold text-black mb-1 flex justify-between items-center">
                                 <span>{flow.resultTitle}</span>
                                 <span className="text-[10px] bg-white px-2 py-0.5 rounded border shadow-sm">{flow.resultLabel} ✓</span>
                              </div>
                              {flow.resultBody}
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="mt-2 flex flex-col gap-4 opacity-75">
                        <div className="h-3 w-28 rounded bg-gray-200"></div>
                        <div className="h-3 w-44 rounded bg-gray-100"></div>
                        <div className="h-20 rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA]"></div>
                        <div className="h-6 w-32 rounded-full bg-emerald-50 border border-emerald-100"></div>
                     </div>
                  )}
               </div>
            );
         })}
         </div>

         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${phase === 'final' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <KumiNode staticMode />
         </div>
      </div>
   );
};

/* ══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeFeat, setActiveFeat] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({
    nombre: '',
    negocio: '',
    telefono: '',
    email: '',
    mensaje: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const waLink = 'https://wa.me/56994186218?text=Hola,%20quiero%20contratar%20Kumi%20para%20mi%20negocio';

  const faqItems = [
    {
      q: '¿Yo tengo que diseñar los mapas y rutas de Kumi?',
      a: 'No. Es un servicio gestionado por Kumera. Nosotros diseñamos el flujo contigo y lo dejamos operativo.'
    },
    {
      q: '¿Qué pasa si un cliente escribe algo fuera de mi rubro?',
      a: 'La IA preventiva lo detecta, evita derivarlo como oportunidad y Kumi lo contiene con opciones válidas.'
    },
    {
      q: '¿Por qué hay límites de conversaciones?',
      a: 'Meta cobra por ventanas de conversación en la API oficial de WhatsApp. Los planes se estructuran por tramos para cubrir costos y mantener estabilidad.'
    },
    {
      q: '¿Puedo operar conversaciones con mi equipo?',
      a: 'Sí. El panel permite que tu equipo tome, responda, cierre y derive conversaciones en tiempo real.'
    }
  ];

  async function onContactSubmit(event: FormEvent) {
    event.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    setContactError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setContactError(payload.error ?? 'No se pudo enviar tu solicitud.');
        return;
      }
      setContactSuccess('Recibimos tu solicitud. Te contactaremos pronto.');
      setContactForm({ nombre: '', negocio: '', telefono: '', email: '', mensaje: '' });
    } catch {
      setContactError('No se pudo enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <main className="kumi-light-landing overflow-x-clip">
      <header className="k-header">
        <Link href="/" className="k-logo">
          Kumi <span>by Kumera</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/panel/login" className="k-btn-ghost !border-none hidden md:inline-flex">Ingresar al Panel</Link>
          <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black">Escríbenos por WhatsApp</a>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E5E5E5] bg-white text-[#111]"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-[74px] z-40 border-b border-[#E5E5E5] bg-white">
          <div className="px-4 py-3 flex flex-col gap-2">
            <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black w-full">WhatsApp directo</a>
            <a href="/panel/login" className="k-btn-ghost w-full">Ingresar al panel</a>
          </div>
        </div>
      )}

      <section className="k-hero-split lg:grid-cols-[1.2fr_0.8fr]" style={{ alignItems: 'flex-start' }}>
        <div className="k-hero-content pt-10">
          <h1 className="k-h1 mb-6">Te escriben mucho. No todos son clientes.</h1>
          <p className="k-body mb-8">Kumi es un servicio gestionado de pre-calificación por WhatsApp con flujo determinístico. Filtra ruido, prioriza oportunidades y deriva a tu equipo cuando realmente corresponde.</p>
          <div className="flex flex-wrap gap-3">
            <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black">Solicitar cotización</a>
            <a href="#how-it-works" className="k-btn-ghost">Ver cómo funciona</a>
          </div>
        </div>
        <div className="k-hero-visual flex justify-center items-start pt-6 bg-transparent h-[540px]">
          <StackedHeroShowcase />
        </div>
      </section>

      <div className="k-divider !my-0"></div>
      <section className="k-trust-strip">
        <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mr-4">Operando para:</span>
        <div className="flex items-center gap-8 md:gap-16">
          <div className="k-trust-logo">Tractiva</div>
          <div className="k-trust-logo">TuEjecutiva</div>
          <div className="k-trust-logo">Sitiora</div>
        </div>
      </section>
      <div className="k-divider !my-0"></div>

      <section className="k-section-pad k-container text-center" id="how-it-works">
        <h2 className="k-h2 mb-20 max-w-4xl mx-auto">La IA se usa para proteger tu tiempo,<br/>no para inventar respuestas.</h2>
        <div className="k-stats-grid text-left">
          <div className="k-stat-box">
            <div className="k-stat-label">Cero Alucinaciones</div>
            <div className="k-stat-number">100%</div>
            <p className="k-body-sm m-0">Tus clientes eligen opciones definidas por flujo. Kumi no inventa servicios, precios ni promesas fuera de lo que vendes.</p>
          </div>
          <div className="k-stat-box">
            <div className="k-stat-label">Control Humano</div>
            <div className="k-stat-number">Panel</div>
            <p className="k-body-sm m-0">Cuando aparece una oportunidad real, se notifica por correo y tu equipo toma el control desde el panel comercial.</p>
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      <section className="k-section-pad k-container">
        <h2 className="k-h2 mb-16 text-center">Un servicio gestionado.<br/>Cero trabajo técnico para ti.</h2>
        <div className="k-feat-wrap">
          <div className="k-feat-nav">
            <div className="k-feat-item" onClick={() => setActiveFeat(0)} style={{ borderLeft: activeFeat === 0 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
              <h4>Todo Incluido (Número + WhatsApp)</h4>
              <p>Nosotros proveemos el número, dejamos la WABA operativa y montamos toda la infraestructura técnica por ti.</p>
            </div>
            <div className="k-feat-item" onClick={() => setActiveFeat(1)} style={{ borderLeft: activeFeat === 1 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
              <h4>Filtro y Control con IA preventiva</h4>
              <p>Detecta mensajes fuera de rubro, evita falsos leads y mantiene el flujo dentro de opciones válidas.</p>
            </div>
            <div className="k-feat-item" onClick={() => setActiveFeat(2)} style={{ borderLeft: activeFeat === 2 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
              <h4>Panel comercial simple</h4>
              <p>Tu equipo ve conversaciones, toma control humano, responde, cierra y deriva sin depender del celular.</p>
            </div>
          </div>

          <div className="k-feat-visual bg-[#F5F5F0] border border-[#E5E5E5] relative overflow-hidden">
            {activeFeat === 0 && <KumiNode triggerOnVisible={true} />}
            {activeFeat === 1 && (
              <div className="w-[82%] bg-white p-6 shadow-xl border border-gray-200 rounded-xl relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-sm">Validación IA Activa</span>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded">Fuera de rubro</span>
                </div>
                <div className="text-[13px] text-gray-600 italic">El usuario pide un servicio que la empresa no ofrece. Kumi evita escalarlo como oportunidad.</div>
                <div className="bg-gray-100 p-2 text-xs rounded border border-gray-200">
                  <strong>Acción de Kumi:</strong> responde con opciones válidas y mantiene el control del flujo.
                </div>
              </div>
            )}
            {activeFeat === 2 && (
              <div className="w-full flex gap-4 p-8 items-start opacity-90">
                <div className="flex-1 bg-white h-48 rounded shadow-sm border border-gray-200 p-4 relative">
                  <div className="w-1/2 h-4 bg-gray-200 rounded mb-2" />
                  <div className="w-full h-2 bg-gray-100 rounded mb-1" />
                  <div className="w-3/4 h-2 bg-gray-100 rounded" />
                  <div className="absolute inset-x-0 bottom-0 h-10 border-t border-gray-100 flex justify-between items-center px-4">
                    <div className="w-16 h-4 rounded-full bg-amber-100" />
                    <div className="text-[10px] font-bold text-gray-500">LEAD PRIORIZADO</div>
                  </div>
                </div>
                <div className="flex-1 bg-white h-56 rounded shadow-sm border border-gray-200 p-4 -mt-4 relative flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 font-bold">✓</div>
                  <div className="text-xs text-gray-500 font-medium">Tomado por ejecutivo</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      <section className="k-section-pad k-container">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 text-left">
            <h3 className="text-[30px] md:text-[34px] font-semibold tracking-[-0.03em] mb-6 text-emerald-700">Lo que sí incluye</h3>
            <ul className="flex flex-col gap-3 text-[16px] text-[#3F3F46] leading-relaxed">
              <li>✓ Implementación completa y configuración inicial.</li>
              <li>✓ Número de WhatsApp y WABA operada por Kumera.</li>
              <li>✓ IA preventiva para control de fuera de rubro.</li>
              <li>✓ Panel para tomar, responder, cerrar y derivar.</li>
              <li>✓ Notificaciones por correo para intervención humana.</li>
            </ul>
          </div>
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-8 text-left">
            <h3 className="text-[30px] md:text-[34px] font-semibold tracking-[-0.03em] mb-6 text-red-700">Lo que no hacemos</h3>
            <ul className="flex flex-col gap-3 text-[16px] text-[#52525B] leading-relaxed">
              <li>✕ No operamos como chatbot libre generativo.</li>
              <li>✕ No te dejamos solo con una plataforma técnica compleja.</li>
              <li>✕ No prometemos automatización sin control comercial.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      <section className="k-section-pad k-container">
        <h2 className="k-h2 mb-10 text-center">Planes Claros para Tu Escala</h2>
        <p className="k-body text-center mb-20 max-w-3xl mx-auto">Nuestro modelo absorbe costos variables de Meta + IA y te entrega una operación mensual predecible para tu negocio.</p>
        <div className="md:grid md:grid-cols-3 md:gap-6 flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory">
          <div className="k-card min-w-[290px] md:min-w-0 snap-start">
            <h3 className="k-h3 mb-2">Base</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para pymes y profesionales que quieren ordenar su WhatsApp.</p>
            <div className="mb-6"><span className="text-3xl font-bold tracking-tight">~1.5k</span> <span className="text-gray-500 text-sm">conversaciones / mes</span></div>
            <ul className="flex flex-col gap-3 mb-8">
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ 1 flujo de pre-calificación</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Panel de operación comercial</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ WABA operada por Kumera</li>
            </ul>
            <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-ghost w-full">Cotizar por WhatsApp</a>
          </div>
          <div className="k-card min-w-[290px] md:min-w-0 snap-start !border-emerald-500 relative shadow-xl md:transform md:scale-105 z-10 bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[11px] uppercase tracking-wider font-bold py-1 px-3 rounded-full shadow-md">Más elegido</div>
            <h3 className="k-h3 mb-2">Crecimiento</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para equipos comerciales con demanda constante.</p>
            <div className="mb-6"><span className="text-3xl font-bold tracking-tight">~5k</span> <span className="text-gray-500 text-sm">conversaciones / mes</span></div>
            <ul className="flex flex-col gap-3 mb-8">
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Flujo avanzado + scoring</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ IA preventiva activa</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Ajustes periódicos del flujo</li>
            </ul>
            <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black w-full">Cotizar por WhatsApp</a>
          </div>
          <div className="k-card min-w-[290px] md:min-w-0 snap-start">
            <h3 className="k-h3 mb-2">Pro</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para operaciones con alto volumen de conversaciones.</p>
            <div className="mb-6"><span className="text-3xl font-bold tracking-tight">12k+</span> <span className="text-gray-500 text-sm">conversaciones / mes</span></div>
            <ul className="flex flex-col gap-3 mb-8">
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Múltiples flujos por área</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Soporte operativo ampliado</li>
              <li className="text-[14px] text-gray-700 font-medium tracking-tight">✓ Gobierno de consumo</li>
            </ul>
            <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-ghost w-full">Cotizar por WhatsApp</a>
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      <section className="k-section-pad k-container max-w-6xl">
        <h2 className="k-h2 mb-14 text-center">Preguntas Frecuentes</h2>
        <div className="border-t border-[#E5E5E5]">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article key={item.q} className="border-b border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-5 flex items-center justify-between gap-4 text-left"
                >
                  <h4 className="text-[36px] md:text-[44px] font-medium tracking-[-0.03em] leading-[1.06] text-[#111] m-0">
                    {item.q}
                  </h4>
                  <ChevronDown size={22} className={`text-[#A1A1AA] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <p className="pb-5 mt-[-2px] text-[17px] leading-relaxed text-[#52525B] max-w-5xl">
                    {item.a}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="k-divider"></div>

      <section className="k-section-pad k-container max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start bg-white border border-[#E5E5E5] rounded-xl p-6 md:p-10">
          <div>
            <h2 className="k-h2 mb-5">Activa Kumi en tu negocio</h2>
            <p className="k-body mb-7">Déjanos tus datos y te proponemos un flujo realista para pre-calificar leads por WhatsApp según tu rubro.</p>
            <div className="flex flex-wrap gap-3">
              <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black">Ir a WhatsApp</a>
              <a href="/panel/login" className="k-btn-ghost">Ingresar al panel</a>
            </div>
          </div>
          <form onSubmit={onContactSubmit} className="flex flex-col gap-3">
            <input className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#111]" placeholder="Nombre" value={contactForm.nombre} onChange={(e) => setContactForm((prev) => ({ ...prev, nombre: e.target.value }))} />
            <input className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#111]" placeholder="Negocio / rubro" value={contactForm.negocio} onChange={(e) => setContactForm((prev) => ({ ...prev, negocio: e.target.value }))} />
            <div className="grid md:grid-cols-2 gap-3">
              <input className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#111]" placeholder="Teléfono" value={contactForm.telefono} onChange={(e) => setContactForm((prev) => ({ ...prev, telefono: e.target.value }))} />
              <input type="email" className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#111]" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <textarea className="w-full border border-[#E5E5E5] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#111] min-h-[120px] resize-y" placeholder="Cuéntanos qué quieres automatizar y cómo te llegan los contactos." value={contactForm.mensaje} onChange={(e) => setContactForm((prev) => ({ ...prev, mensaje: e.target.value }))} />
            <button type="submit" disabled={contactLoading} className="k-btn-black w-full disabled:opacity-60 disabled:cursor-not-allowed">{contactLoading ? 'Enviando...' : 'Enviar solicitud'}</button>
            {contactSuccess && <p className="text-[13px] text-emerald-700 font-medium">{contactSuccess}</p>}
            {contactError && <p className="text-[13px] text-red-600 font-medium">{contactError}</p>}
          </form>
        </div>
      </section>

      <footer className="py-12 border-t border-[#E5E5E5] mt-16 px-8">
        <div className="k-container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[13px] text-gray-500">
            <strong className="text-black font-semibold mr-2">Kumi Messaging.</strong>
            Desarrollado y operado por Kumera Servicios Digitales SpA.
          </div>
          <div className="flex gap-6">
            <a href="/panel/login" className="text-[13px] font-semibold text-gray-500 hover:text-black">Ingresar al Panel</a>
            <Link href="#" className="text-[13px] font-semibold text-gray-500 hover:text-black">Privacidad</Link>
          </div>
        </div>
      </footer>

      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="md:hidden fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 bg-[#111] text-white rounded-full px-4 py-3 shadow-lg border border-black"
      >
        <MessageCircle size={18} />
        <span className="text-[13px] font-semibold">Contactar</span>
      </a>
    </main>
  );
}
