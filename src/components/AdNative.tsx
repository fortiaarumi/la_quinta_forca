'use client';

import { useEffect, useRef } from 'react';

export default function AdNative() {
  const containerId = "container-f90cd89712fac2bf24ff77874909f870";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Evitem duplicats
    if (!containerRef.current || containerRef.current.firstChild) return;

    const script = document.createElement('script');
    script.src = "https://pl29435558.profitablecpmratenetwork.com/f90cd89712fac2bf24ff77874909f870/invoke.js";
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    // Injectem el script al container
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto my-12 animate-fade-in px-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.4em] bg-black/40 px-3 py-1 rounded-full border border-white/5">Contingut Patrocinat</span>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">💡</span>
            <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">Potser t&apos;interessa</h4>
          </div>
          
          {/* Contenidor de l'anunci Native */}
          <div 
            id={containerId} 
            ref={containerRef} 
            className="min-h-[200px] w-full rounded-2xl overflow-hidden" 
          />
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Publicitat La Quinta Forca — Ajuda&apos;ns a mantenir el servidor</p>
        </div>
      </div>
    </div>
  );
}
