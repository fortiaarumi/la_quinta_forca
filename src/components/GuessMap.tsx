'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGuess: (lat: number, lng: number) => Promise<void>;
  onPinChange?: (lat: number, lng: number) => void; // 👈 AFEGIT
  onClose: () => void;
  gameMode?: 'world' | 'catalunya';
}

export default function GuessMap({ onGuess, onPinChange, onClose, gameMode = 'world' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // 👈 AFEGIT

  // 👈 AFEGIT: Detectem si és mòbil al carregar
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      // Si és Catalunya, fem un zoom de 7; si és el món, zoom d'1
      zoom: gameMode === 'catalunya' ? 7 : 1,
      // Si és Catalunya, centrem a prop de Manresa; si no, a l'equador
      center: gameMode === 'catalunya' ? { lat: 41.5912, lng: 1.5209 } : { lat: 20, lng: 0 },
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
      clickableIcons: false,
      gestureHandling: 'greedy',
      mapTypeId: google.maps.MapTypeId.TERRAIN,
    });

    mapInstanceRef.current = map;

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const latLng = e.latLng;
      const pos = { lat: latLng.lat(), lng: latLng.lng() };
      setPinPos(pos);
      
      // 👈 AFEGIT 1: Avisem a la sala just quan fem el clic
      if (onPinChange) onPinChange(pos.lat, pos.lng); 

      if (markerRef.current) {
        markerRef.current.setPosition(latLng);
      } else {
        markerRef.current = new google.maps.Marker({
          position: latLng,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });
        markerRef.current.addListener('dragend', (de: google.maps.MapMouseEvent) => {
          if (de.latLng) {
            setPinPos({ lat: de.latLng.lat(), lng: de.latLng.lng() });
            
            // 👈 AFEGIT 2: Avisem a la sala just quan acabem d'arrossegar la xinxeta
            if (onPinChange) onPinChange(de.latLng.lat(), de.latLng.lng()); 
          }
        });
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!pinPos || submitting) return;
    setSubmitting(true);
    await onGuess(pinPos.lat, pinPos.lng);
  };

 return (
    <>
      {/* ── FONS FOSC (només per mòbil, quan està expandit) ── */}
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/60 z-40" 
          onClick={() => !submitting && setExpanded(false)} 
        />
      )}

      <div
        className={`fixed z-50 overflow-hidden transition-all duration-300 ease-out shadow-2xl 
          ${isMobile 
            ? (expanded 
                ? 'inset-x-4 top-[15vh] bottom-[20vh] rounded-3xl border-2 border-emerald-500/50' 
                : 'bottom-6 right-6 w-32 h-32 rounded-2xl border-2 border-white/20')
            : (expanded 
                ? 'bottom-6 right-6 w-[480px] h-[360px] rounded-2xl border border-white/20' 
                : 'bottom-6 right-6 w-48 h-32 rounded-xl border border-white/20 cursor-pointer hover:scale-105')
          }`}
        onMouseEnter={() => !isMobile && setExpanded(true)}
        onMouseLeave={() => !isMobile && !submitting && setExpanded(false)}
        onClick={() => isMobile && !expanded && setExpanded(true)}
      >
        {/* El contenidor del mapa de Google */}
        <div ref={mapRef} className="w-full h-full bg-slate-800" />

        {/* Overlay col·lapsat (text "Ampliar") */}
        {!expanded && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <span className="text-white text-xs font-black tracking-widest drop-shadow bg-black/50 px-3 py-1.5 rounded-full uppercase border border-white/10">
              {isMobile ? '📍 Mapa' : 'Ampliar'}
            </span>
          </div>
        )}

        {/* Controls expandits */}
        {expanded && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 md:p-4 flex gap-2 pt-12">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); if(isMobile) onClose(); }}
              className="bg-gray-700/80 hover:bg-gray-600 text-white text-sm font-bold px-4 py-3 rounded-xl flex-none transition-colors border border-white/10"
            >
              ✕
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
              disabled={!pinPos || submitting}
              className={`flex-1 text-white text-sm md:text-base font-black py-3 rounded-xl transition-all shadow-lg uppercase tracking-wider
                ${!pinPos || submitting 
                  ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
                  : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.4)]'
                }`}
            >
              {submitting
                ? '⌛ Enviant...'
                : pinPos
                ? '✓ Confirmar Posició'
                : '📍 Toca per posar el pin'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
