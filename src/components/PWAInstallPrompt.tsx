'use client';

import { useState, useEffect } from 'react';

const PWA_DISMISSED_KEY = 'pwaPromptDismissed';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);

  // TASK 3: Persist dismissal — if the user has already closed it once, never show again
  const dismiss = () => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  useEffect(() => {
    // TASK 3: If already dismissed in a previous session, bail out immediately
    if (localStorage.getItem(PWA_DISMISSED_KEY) === 'true') return;

    // 1. Detectar si ja està instal·lada (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone 
                         || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Detectar plataforma
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('other');

    // 3. Mostrar només en mòbils i si no està instal·lada
    if (isIOS || isAndroid) {
      // Esperem 3 segons perquè no surti de cop amb la música
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[15000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#0c0f1a] border border-indigo-500/30 rounded-[3.5rem] w-full max-w-sm p-8 relative shadow-[0_0_80px_rgba(99,102,241,0.25)] text-center overflow-hidden">
        {/* TASK 3: Botó de tancar — w-12 h-12 garanteix un tap target ≥44×44px en mòbil */}
        <button 
          onClick={dismiss}
          aria-label="Tancar"
          className="absolute top-4 right-4 z-[15001] w-12 h-12 flex items-center justify-center text-red-500 hover:text-red-400 text-4xl font-black cursor-pointer bg-transparent border-none transition-transform hover:scale-110 active:scale-90"
        >
          ×
        </button>

        {/* Decoració de fons */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_20px_40px_rgba(99,102,241,0.3)] transform rotate-12">
            <span className="text-5xl">🏰</span>
          </div>
          
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-3">Instal·la l&apos;App</h2>
          <p className="text-gray-400 text-xs mb-10 font-medium leading-relaxed px-4">
            Per a la millor experiència i accés ràpid, afegeix <span className="text-indigo-400 font-bold italic">La Quinta Forca</span> a la teva pantalla d&apos;inici.
          </p>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 text-left mb-10 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-5 italic text-center">Instruccions de joc</p>
            
            {platform === 'ios' ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300">1</div>
                  <p className="text-[11px] text-gray-300 leading-tight">Clica el botó <span className="font-bold text-white px-2 py-0.5 bg-white/10 rounded-md">Compartir</span> (icona quadrada amb fletxa).</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300">2</div>
                  <p className="text-[11px] text-gray-300 leading-tight">Busca l&apos;opció <span className="text-white font-black italic">&quot;Afegir a la pantalla d&apos;inici&quot;</span>.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300">1</div>
                  <p className="text-[11px] text-gray-300 leading-tight">Clica els <span className="font-bold text-white">tres punts</span> (menú) del navegador.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300">2</div>
                  <p className="text-[11px] text-gray-300 leading-tight">Selecciona <span className="text-white font-black italic">&quot;Instal·lar aplicació&quot;</span>.</p>
                </div>
              </div>
            )}
          </div>

          {/* TASK 3: "Got it" button also writes the dismissed key */}
          <button 
            onClick={dismiss}
            className="w-full py-5 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all active:scale-95 border-none cursor-pointer"
          >
            D&apos;acord, entès! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
