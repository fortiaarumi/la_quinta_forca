'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGuess: (lat: number, lng: number) => Promise<void>;
  onClose: () => void;
}

export default function GuessMap({ onGuess, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 1,
      center: { lat: 20, lng: 0 },
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
    <div
      className="absolute bottom-6 right-6 z-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 cursor-pointer"
      style={{
        width: expanded ? 420 : 200,
        height: expanded ? 320 : 150,
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => !submitting && setExpanded(false)}
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay col·lapsat */}
      {!expanded && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs font-semibold drop-shadow bg-black/40 px-2 py-1 rounded-full">
            Ampliar mapa
          </span>
        </div>
      )}

      {/* Controls expandits */}
      {expanded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="bg-gray-700/90 hover:bg-gray-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex-none transition-colors"
          >
            ✕
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
            disabled={!pinPos || submitting}
            className="flex-1 bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-400 text-white text-sm font-black py-2 rounded-lg transition-colors shadow-lg"
          >
            {submitting
              ? '⌛ Enviant...'
              : pinPos
              ? '✓ Confirmar Endevinança'
              : 'Clica per posar el pin'}
          </button>
        </div>
      )}
    </div>
  );
}
