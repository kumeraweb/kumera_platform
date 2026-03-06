'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

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
      <div className="relative w-[420px] h-[560px] flex justify-center items-center">
         {/* INTRO: Kumi Node Assembly */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${phase === 'intro' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <KumiNode />
         </div>

         {/* MAIN: Stacked Cards */}
         <div className={`absolute left-1/2 -ml-[180px] top-8 w-[360px] h-[500px] transition-all duration-700 ease-out ${phase === 'demo' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
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
                  className="absolute top-0 left-0 bg-white rounded-xl p-5 w-full flex flex-col gap-3 border border-gray-100 h-[480px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
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
                        <div className="self-start bg-gray-100 p-3 rounded-2xl rounded-tl-sm text-[13px] text-gray-800 max-w-[85%] animate-in fade-in slide-in-from-bottom-2">
                           {flow.userMsg}
                        </div>

                        {/* Step 1: Kumi Options */}
                        {step >= 1 && (
                           <div className="self-end bg-[#10B981] p-3 rounded-2xl rounded-tr-sm text-[13px] text-white max-w-[90%] shadow-sm animate-in fade-in slide-in-from-bottom-2 whitespace-pre-line">
                              {flow.botMsg}
                           </div>
                        )}

                        {/* Step 2: User responds choice */}
                        {step >= 2 && (
                           <div className="self-start bg-gray-100 p-3 rounded-2xl rounded-tl-sm text-[13px] text-gray-800 max-w-[85%] animate-in fade-in slide-in-from-bottom-2">
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
                           <div className={`self-end p-3 rounded-2xl rounded-tr-sm text-[12px] text-gray-600 border w-full animate-in fade-in slide-in-from-bottom-2 mt-auto ${
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
  const waLink = "https://wa.me/56985440784?text=Hola,%20me%20interesa%20Kumi";

  return (
    <main className="kumi-light-landing">
      {/* ─── HEADER ─── */}
      <header className="k-header">
        <Link href="/" className="k-logo">
          Kumi <span>by Kumera</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/panel/login" className="k-btn-ghost !border-none hidden md:inline-flex">Ingresar al Panel</Link>
          <a href={waLink} target="_blank" rel="noreferrer" className="k-btn-black">Solicitar una demo</a>
        </div>
      </header>

      {/* ─── HERO SPLIT ─── */}
      <section className="k-hero-split lg:grid-cols-[1.2fr_0.8fr]" style={{ alignItems: 'flex-start' }}>
        <div className="k-hero-content pt-10">
          <h1 className="k-h1 mb-6">Te escriben mucho. No todos son clientes.</h1>
          <p className="k-body mb-8">Kumi no es un "bot conversacional mágico". Es un servicio gestionado de pre-calificación por WhatsApp que usa flujos determinísticos para filtrar a los curiosos, calificar la intención y derivar solo oportunidades reales a tu equipo de ventas.</p>
          <div className="flex gap-4">
            <a href={waLink} className="k-btn-black">Solicitar cotización</a>
            <a href="#how-it-works" className="k-btn-ghost">Ver cómo funciona</a>
          </div>
        </div>
        
        {/* Removed .k-burst heavily restrained bg, now just positioning the stack with native dropshadow against the offwhite bg */}
        <div className="k-hero-visual flex justify-center items-start pt-6 bg-transparent h-[540px]">
           <StackedHeroShowcase />
        </div>
      </section>

      {/* ─── TRUST STRIP (Real Social Proof) ─── */}
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

      {/* ─── DUO STATS (Reality Check) ─── */}
      <section className="k-section-pad k-container text-center" id="how-it-works">
        <h2 className="k-h2 mb-16 max-w-4xl mx-auto">La IA se usa para proteger tu tiempo,<br/>no para inventar respuestas.</h2>
        
        <div className="k-stats-grid text-left">
          <div className="k-stat-box">
            <div className="k-stat-label">Cero Alucinaciones</div>
            <div className="k-stat-number">100%</div>
            <p className="k-body-sm m-0">El flujo es determinístico. Tus clientes eligen opciones de un menú que nosotros diseñamos contigo. La IA no tiene permiso para inventar precios o servicios que no ofreces. Es un embudo, no una charla.</p>
          </div>
          <div className="k-stat-box">
            <div className="k-stat-label">Control Humano</div>
            <div className="k-stat-number">Panel</div>
            <p className="k-body-sm m-0">Cuando Kumi detecta urgencias o pre-califica un lead de alto valor (Lead Scoring), te manda un correo. Tu equipo entra al Panel Asesor Kumera, lee el resumen y toma la conversación de inmediato.</p>
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      {/* ─── ACCORDION FEATURES (The True Scope) ─── */}
      <section className="k-section-pad k-container">
         <h2 className="k-h2 mb-16 text-center">Un servicio gestionado.<br/>Cero trabajo técnico para ti.</h2>
         
         <div className="k-feat-wrap">
            <div className="k-feat-nav">
               <div className="k-feat-item" onClick={() => setActiveFeat(0)} style={{ borderLeft: activeFeat === 0 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
                  <h4>Todo Incluido (Línea + WhatsApp)</h4>
                  <p>No tienes que comprar chips ni configurar APIs complejas. Nosotros proveemos el número, verificamos tu WhatsApp Business Oficial y montamos la infraestructura tecnológica.</p>
               </div>
               <div className="k-feat-item" onClick={() => setActiveFeat(1)} style={{ borderLeft: activeFeat === 1 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
                  <h4>Lead Scoring y Filtro de Ruido</h4>
                  <p>Mide cada respuesta del cliente. Si preguntan tonterías, el score baja y Kumi los contiene. Si eligen cotizar un servicio premium, el score sube y se clasifica como Venta Caliente.</p>
               </div>
               <div className="k-feat-item" onClick={() => setActiveFeat(2)} style={{ borderLeft: activeFeat === 2 ? '4px solid #111' : '4px solid transparent', paddingLeft: '20px', marginLeft: '-24px' }}>
                  <h4>El Panel Principal</h4>
                  <p>Dile adiós al celular de la empresa tirado en un cajón. Tu equipo comercial se loguea por web, mira las tarjetas de clientes ordenadas, y chatea desde el navegador sin interrumpir a Kumi.</p>
               </div>
            </div>
            
            <div className="k-feat-visual bg-[#F5F5F0] border border-[#E5E5E5] relative overflow-hidden">
               {activeFeat === 0 && <KumiNode triggerOnVisible={true} />}
               {activeFeat === 1 && (
                  <div className="w-[80%] bg-white p-6 shadow-xl border border-gray-200 rounded-xl relative z-10 flex flex-col gap-4">
                     <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-bold text-sm">Validación IA Activa</span>
                        <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded">Fuera de Scope</span>
                     </div>
                     <div className="text-[13px] text-gray-600 italic">"Evaluando intención: el usuario pregunta por pasajes de avión. La empresa vende servicios dentales. Bloqueando pase a Ejecutivo."</div>
                     <div className="bg-gray-100 p-2 text-xs rounded border border-gray-200">
                        <strong>Acción Kumi:</strong> "Disculpa, solo brindamos servicios odontológicos. No puedo ayudarte con pasajes."
                     </div>
                  </div>
               )}
               {activeFeat === 2 && (
                  <div className="w-full flex gap-4 p-8 items-start opacity-80">
                      <div className="flex-1 bg-white h-48 rounded shadow-sm border border-gray-200 p-4 relative">
                         <div className="w-1/2 h-4 bg-gray-200 rounded mb-2" />
                         <div className="w-full h-2 bg-gray-100 rounded mb-1" />
                         <div className="w-3/4 h-2 bg-gray-100 rounded" />
                         <div className="absolute inset-x-0 bottom-0 h-10 border-t border-gray-100 flex justify-between items-center px-4">
                            <div className="w-16 h-4 rounded-full bg-amber-100" />
                            <div className="text-[10px] font-bold text-gray-400">SCORE: +40</div>
                         </div>
                      </div>
                      <div className="flex-1 bg-white h-56 rounded shadow-sm border border-gray-200 p-4 -mt-4 relative flex flex-col items-center justify-center">
                         <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 font-bold">✓</div>
                         <div className="text-xs text-gray-500 font-medium">Asignado a Javier</div>
                      </div>
                  </div>
               )}
            </div>
         </div>
      </section>

      <div className="k-divider"></div>

      {/* ─── SHOWCASE WHAT WE DO / DONT DO ─── */}
      <section className="k-section-pad">
         <div className="k-banner-card k-burst-green">
            <div className="relative z-10 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
               <div className="grid md:grid-cols-2 text-left">
                  <div className="p-10 border-b md:border-b-0 md:border-r border-gray-200">
                     <h3 className="text-xl font-bold mb-4 text-emerald-700">Lo que SÍ incluye el servicio</h3>
                     <ul className="flex flex-col gap-3">
                        <li className="text-[14px] text-gray-700">✔ Línea y WABA oficial de Meta validada.</li>
                        <li className="text-[14px] text-gray-700">✔ Diseño de flujo determinístico por el equipo Kumera.</li>
                        <li className="text-[14px] text-gray-700">✔ Integración con IA preventiva (detección contextos).</li>
                        <li className="text-[14px] text-gray-700">✔ Licencias del panel de ejecutivos para responder.</li>
                        <li className="text-[14px] text-gray-700">✔ Alertas automáticas por email de leads urgentes.</li>
                     </ul>
                  </div>
                   <div className="p-10 bg-gray-50">
                     <h3 className="text-xl font-bold mb-4 text-red-700">Lo que NO hacemos</h3>
                     <ul className="flex flex-col gap-3">
                        <li className="text-[14px] text-gray-600">✖ No es un bot "generativo" en modo libre (peligrosísimo para marca).</li>
                        <li className="text-[14px] text-gray-600">✖ No te damos una app técnica para que "armes rutas tu mismo".</li>
                        <li className="text-[14px] text-gray-600">✖ No cobramos por "asientos extras" en el panel.</li>
                     </ul>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <div className="k-divider"></div>

      {/* ─── PRICING REALITY ─── */}
      <section className="k-section-pad k-container">
        <h2 className="k-h2 mb-4 text-center">Planes Claros para Tu Escala</h2>
        <p className="k-body text-center mb-16 max-w-2xl mx-auto">Nuestro modelo absorbe los altos costos variables de Meta (WhatsApp API) más el procesamiento de IA, entregándote un precio fijo que puedes predecir comercialmente.</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="k-card">
            <h3 className="k-h3 mb-2">Base</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para pymes y clínicas pequeñas que buscan orden urgente.</p>
            <div className="mb-6">
               <span className="text-3xl font-bold tracking-tight">~1.5k</span> <span className="text-gray-500 text-sm">conversaciones / mes</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8">
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ 1 Flujo de Pre-calificación</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Panel Ejecutivo Kumera incluído</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ WABA operada por Kumera</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Soporte técnico Base (email)</li>
            </ul>
            <div className="mt-auto pt-6 border-t border-[#E5E5E5]">
               <div className="text-[11px] text-gray-500 mb-4 line-height-tight">Las conversaciones adicionales por sobre las 1.500 tienen un costo extra para absorber cargos de Meta.</div>
               <a href={waLink} className="k-btn-ghost w-full">Cotizar Plan</a>
            </div>
          </div>

          <div className="k-card !border-emerald-500 relative shadow-xl transform scale-105 z-10 bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[11px] uppercase tracking-wider font-bold py-1 px-3 rounded-full shadow-md">Más Elegido</div>
            <h3 className="k-h3 mb-2">Crecimiento</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para equipos de venta activos que manejan leads diarios.</p>
            <div className="mb-6">
               <span className="text-3xl font-bold tracking-tight">~5k</span> <span className="text-gray-500 text-sm">conversaciones / mes</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8">
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Flujo avanzado + Scoring Inteligente</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Filtro de IA Preventiva activo</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Ajustes dinámicos mensuales del flujo</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Soporte Prioritario WhatsApp</li>
            </ul>
             <div className="mt-auto pt-6 border-t border-[#E5E5E5]">
               <div className="text-[11px] text-gray-500 mb-4 line-height-tight">Equilibrio perfecto de margen si buscas conversiones perfiladas y ventas.</div>
               <a href={waLink} className="k-btn-black w-full">Cotizar Plan</a>
            </div>
          </div>

          <div className="k-card">
            <h3 className="k-h3 mb-2">Pro</h3>
            <p className="k-body-sm mb-6 pb-6 border-b border-[#E5E5E5] h-[60px]">Para inmobiliarias y operaciones de muy alto volumen publicitario.</p>
             <div className="mb-6">
               <span className="text-3xl font-bold tracking-tight">12k+</span> <span className="text-gray-500 text-sm">conversaciones / mes</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8">
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Múltiples flujos iterativos por área</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Transcripción de audios ilimitada</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Escalamiento por derivación multi-panel</li>
               <li className="text-[14px] text-gray-700 font-medium tracking-tight">✔ Account Manager dedicado</li>
            </ul>
             <div className="mt-auto pt-6 border-t border-[#E5E5E5]">
               <div className="text-[11px] text-gray-500 mb-4 line-height-tight">Despliegue robusto garantizando disponibilidad para gran flujo de ads.</div>
               <a href={waLink} className="k-btn-ghost w-full">Contactar Ventas</a>
            </div>
          </div>
        </div>
      </section>

      <div className="k-divider"></div>

      {/* ─── FAQ REALITIES ─── */}
      <section className="k-section-pad k-container max-w-3xl">
         <h2 className="k-h2 mb-10 text-center">Preguntas Frecuentes</h2>
         <div className="border-t border-[#E5E5E5]">
            <article className="k-faq-row group">
               <div>
                  <h4 className="mb-1">¿Yo tengo que diseñar los mapas y rutas de Kumi?</h4>
                  <p className="text-[13px] text-gray-500 m-0 opacity-0 group-hover:opacity-100 transition-opacity h-0 overflow-hidden group-hover:h-auto group-hover:mt-2">No. Es un servicio gestionado. Nosotros diseñamos y conectamos el flujo en base a lo que vendes. No tienes que prender tu computador para configurar sistemas.</p>
               </div>
               <ChevronDown size={20} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            </article>
            <article className="k-faq-row group">
               <div>
                  <h4 className="mb-1">¿Qué pasa si mi cliente escribe algo que Kumi no entiende?</h4>
                  <p className="text-[13px] text-gray-500 m-0 opacity-0 group-hover:opacity-100 transition-opacity h-0 overflow-hidden group-hover:h-auto group-hover:mt-2">Su Score de Lead se marca bajo, Kumi lanza una respuesta de contención programada y lo deriva al buzón general de tu Panel Comercial para que un humano lo resuelva.</p>
               </div>
               <ChevronDown size={20} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            </article>
            <article className="k-faq-row group">
               <div>
                  <h4 className="mb-1">¿Por qué hay límites de conversaciones?</h4>
                  <p className="text-[13px] text-gray-500 m-0 opacity-0 group-hover:opacity-100 transition-opacity h-0 overflow-hidden group-hover:h-auto group-hover:mt-2">A diferencia de un WhatsApp normal de celular, usamos la API Oficial de Meta (Facebook). Ellos cobran centavos de dólar por ventana de conversación. Nuestros planes calculan y absorben ese costo técnico y de IA de manera transparente para ti.</p>
               </div>
               <ChevronDown size={20} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            </article>
            <article className="k-faq-row group border-b border-[#E5E5E5]">
               <div>
                  <h4 className="mb-1">Cobran por agregar asesores al panel web?</h4>
                  <p className="text-[13px] text-gray-500 m-0 opacity-0 group-hover:opacity-100 transition-opacity h-0 overflow-hidden group-hover:h-auto group-hover:mt-2">No. Creemos que el valor de Kumi es la automatización. Si tu equipo crece y 10 personas necesitan conectarse a mirar el panel Kumera y contestar chats escalados, lo hacen sin costo extra de licencia de asiento.</p>
               </div>
               <ChevronDown size={20} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            </article>
         </div>
      </section>

      {/* ─── FOOTER ─── */}
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
    </main>
  );
}
