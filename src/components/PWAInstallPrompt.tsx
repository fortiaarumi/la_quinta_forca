'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);

  useEffect(() => {
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-[#12141c] border border-yellow-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden">
        {/* Decoració de fons */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-yellow-500/20 transform rotate-12">
            <span className="text-4xl">🏰</span>
          </div>
          
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Instal·la l&apos;App</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Per a la millor experiència de joc i accés ràpid, afegeix <span className="text-yellow-500 font-bold italic">La Quinta Forca</span> a la teva pantalla d&apos;inici.
          </p>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-left mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/70 mb-4 italic">Instruccions</p>
            
            {platform === 'ios' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-xs text-gray-300">Clica el botó <span className="inline-block px-2 py-0.5 bg-white/10 rounded">Compartir</span> (quadrat amb fletxa).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-xs text-gray-300">Selecciona <span className="text-white font-bold italic">&quot;Afegir a la pantalla d&apos;inici&quot;</span>.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-xs text-gray-300">Clica els <span className="font-bold text-white">tres punts</span> del navegador.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-xs text-gray-300">Selecciona <span className="text-white font-bold italic">&quot;Instal·lar aplicació&quot;</span>.</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowPrompt(false)}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 transition-all active:scale-95"
          >
            Entès, ho faré després
          </button>
        </div>
      </div>
    </div>
  );
}
