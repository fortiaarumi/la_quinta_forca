'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGuess: (lat: number, lng: number) => void;
  onPinChange?: (lat: number, lng: number) => void;
  onClose: () => void;
  gameMode?: string;
  userEmail?: string | null;
}

export default function GuessMap({ onGuess, onPinChange, onClose, gameMode = 'world', userEmail }: Props) {
  const isArnau = userEmail === 'arnau.montull@gmail.com';
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

    // \u2500\u2500 TASK 1: Full cleanup \u2013 clear all listeners and destroy map to prevent mobile memory leaks \u2500\u2500
    return () => {
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current);
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
      // Empty the container so the browser can GC the detached tile/WebGL context
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
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
      {/* Background Overlay */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/60 z-[90]"
          onClick={() => !submitting && setExpanded(false)}
        />
      )}

      {/* ── CONTENIDOR PRINCIPAL ── */}
      <div
        className={`fixed z-[100] flex flex-col items-end transition-all duration-300 ease-out
          ${isArnau && expanded 
            ? 'inset-0 w-full h-[100dvh] bg-black z-[99999]' 
            : isMobile
            ? (expanded
              ? 'inset-x-4 top-[12vh] bottom-[20vh]'
              : 'bottom-6 right-6 w-32 h-32')
            : (expanded
              ? 'bottom-6 right-6 w-[480px] h-[360px]'
              : 'bottom-6 right-6 w-48 h-32')
          }`}

      >

        {/* ── EL MAPA I LA UI ── */}
        <div className={`relative w-full h-full overflow-hidden shadow-2xl transition-all duration-300
          ${isArnau && expanded ? 'flex-1 rounded-none border-none' : (
            isMobile && !expanded ? 'rounded-2xl border-2 border-white/20 ml-auto' : 'flex-1 rounded-3xl border-2 border-emerald-500/50'
          )}
          ${!isMobile && !(isArnau && expanded) ? 'rounded-2xl border border-white/20' : ''}
        `}>
          {/* El contenidor del mapa de Google */}
          <div ref={mapRef} className="absolute inset-0 bg-slate-800" />

          {/* Clean Header Expand Button */}
          <div
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="absolute top-0 left-0 w-full bg-black/80 hover:bg-black text-white py-1.5 z-10 text-center cursor-pointer font-bold text-xs"
          >
            {expanded ? '↙️ COLLAPSAR' : '↗️ AMPLIAR MAPA'}
          </div>

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
