'use client';

import { useEffect, useRef } from 'react';

type AdType = 'vertical' | 'square';

const AD_CONFIGS = {
  vertical: {
    key: 'd44d91807a3cd10077c161a15344a1b0',
    width: 160,
    height: 300,
  },
  square: {
    key: '321cb3c4d2cdb42d23e831f23b5b303e',
    width: 300,
    height: 250,
  }
};

export default function AdBanner({ type = 'vertical' }: { type?: AdType }) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const config = AD_CONFIGS[type];

  useEffect(() => {
    // Evitem duplicats
    if (!bannerRef.current || bannerRef.current.firstChild) return;

    const adScript = document.createElement('script');

    // Configurem les opcions de Adsterra
    // Nota: window.atOptions és global, si hi ha múltiples banners a la vegada, 
    // s'han de carregar de forma seqüencial o en iframes per a màxima seguretat.
    // @ts-ignore
    window.atOptions = {
      'key' : config.key,
      'format' : 'iframe',
      'height' : config.height,
      'width' : config.width,
      'params' : {}
    };

    adScript.src = `https://www.highperformanceformat.com/${config.key}/invoke.js`;
    adScript.async = true;

    // Injectem el script al container
    bannerRef.current.appendChild(adScript);

    return () => {
      if (bannerRef.current) {
        bannerRef.current.innerHTML = '';
      }
    };
  }, [type, config.key, config.height, config.width]);

  return (
    <div className="flex flex-col items-center gap-2 max-w-full overflow-hidden">
      <div 
        ref={bannerRef}
        style={{ width: config.width, maxWidth: '100%', height: config.height }}
        className="bg-[#0c101d]/50 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shadow-2xl relative group"
      >
        {/* Placeholder mentre carrega */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-2xl mb-2 opacity-20">📢</span>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-tight">Publicitat</p>
        </div>
      </div>
      <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">Publicitat La Quinta Forca</p>
    </div>
  );
}
