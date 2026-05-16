'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGuess: (lat: number, lng: number) => void;
  onPinChange?: (lat: number, lng: number) => void;
  onClose: () => void;
  gameMode?: string;
}

export default function GuessMap({ onGuess, onPinChange, onClose, gameMode = 'world' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      // Si és Pixapins zoom 12, si és Catalunya zoom 7, si és món zoom 1
      zoom: gameMode === 'pixapins' ? 12 : (gameMode === 'catalunya' ? 7 : 1),
      // Si és Pixapins centrem a Barcelona, si és Catalunya a prop de Manresa, si no a l'equador
      center: gameMode === 'pixapins' ? { lat: 41.3874, lng: 2.1686 } : (gameMode === 'catalunya' ? { lat: 41.5912, lng: 1.5209 } : { lat: 20, lng: 0 }),
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

      {/* ── CONTENIDOR PRINCIPAL ── */}
      <div
        className={`fixed z-50 flex flex-col items-end transition-all duration-300 ease-out
          ${isMobile
            ? (expanded
              ? 'inset-x-4 top-[12vh] bottom-[20vh]'
              : 'bottom-6 right-6')
            : (expanded
              ? 'bottom-6 right-6 w-[480px] h-[360px]'
              : 'bottom-6 right-6 w-48 h-32')
          }`}

      >
        {/* ── BOTÓ EXPLÍCIT PER A TOTHOM (A SOBRE DEL MAPA) ── */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`mb-3 px-6 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all border backdrop-blur-xl group
            ${expanded
              ? 'bg-black/80 text-red-400 border-red-500/30 hover:bg-red-500/10'
              : 'bg-black/80 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10'
            }`}
        >
          <span className="group-hover:scale-110 transition-transform inline-block mr-2">
            {expanded ? '↙️' : '↗️'}
          </span>
          {expanded ? 'Fer mapa petit' : 'Fer mapa gran'}
        </button>

        {/* ── EL MAPA I LA UI ── */}
        <div className={`relative w-full overflow-hidden shadow-2xl transition-all duration-300
          ${isMobile && !expanded ? 'w-32 h-32 rounded-2xl border-2 border-white/20 ml-auto' : 'flex-1 rounded-3xl border-2 border-emerald-500/50'}
          ${!isMobile ? 'h-full rounded-2xl border border-white/20' : ''}
        `}>
          {/* El contenidor del mapa de Google */}
          <div ref={mapRef} className="absolute inset-0 bg-slate-800" />

          {/* Overlay col·lapsat (text "Ampliar" - només PC) */}
          {!isMobile && !expanded && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs font-black tracking-widest drop-shadow bg-black/50 px-3 py-1.5 rounded-full uppercase border border-white/10">
                Ampliar
              </span>
            </div>
          )}

          {/* Controls expandits */}
          {expanded && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 md:p-4 flex gap-2 pt-12">
              {!isMobile && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="bg-[#0c101d] hover:bg-white/5 text-white text-lg font-black px-6 py-6 rounded-2xl flex-none transition-all border border-white/10 shadow-xl"
                >
                  ✕
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                disabled={!pinPos || submitting}
                className={`flex-1 text-sm md:text-base font-black py-6 rounded-2xl transition-all shadow-2xl uppercase tracking-[0.2em] border-2
                  ${!pinPos || submitting
                    ? 'bg-gray-900/50 cursor-not-allowed text-gray-600 border-white/5'
                    : 'bg-[#06080f] text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-400 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                  }`}
              >
                <span className="flex items-center justify-center gap-3">
                  {submitting ? '⌛' : (pinPos ? '✓' : '📍')}
                  {submitting
                    ? 'Enviant...'
                    : pinPos
                      ? 'Confirmar Posició'
                      : 'Toca el mapa'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
