import { useEffect, useRef } from 'react';
import { Location } from '@/lib/types';

interface Props {
  location: Location;
  gameMode?: string;
  onReady?: () => void;
}

export default function StreetViewPane({ location, gameMode, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // ── TASK 1: Store panorama instance so we can destroy it on unmount ──
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fix #2: "Cultural" i "Barcelona/Pixapins" modes apliquen restricció de no-moviment
    const isRestricted = gameMode === 'cultural' || gameMode === 'pixapins' || gameMode === 'barcelona';

    const options: google.maps.StreetViewPanoramaOptions = {
      addressControl: false,
      showRoadLabels: false,

      // ── RESTRICCIONS "NO MOVE" ──
      // Si és cultural, pixapins o barcelona, bloquegem el moviment completament
      zoomControl: !isRestricted,
      clickToGo: false,        // Sempre desactivat per evitar navegació accidental
      linksControl: !isRestricted,
      scrollwheel: !isRestricted,

      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: true, // Sempre permetem girar el cap (360°)
      enableCloseButton: false,
      imageDateControl: false,
    };

    if (location.panoId) {
      options.pano = location.panoId;
    } else {
      options.position = { lat: location.lat, lng: location.lng };
    }

    const panorama = new google.maps.StreetViewPanorama(containerRef.current, options);
    panoramaRef.current = panorama;
    if (onReady) onReady();

    // ── TASK 1: Cleanup – destroy panorama to prevent mobile memory leaks ──
    return () => {
      if (panoramaRef.current) {
        // Clear all event listeners attached to this panorama instance
        google.maps.event.clearInstanceListeners(panoramaRef.current);
        panoramaRef.current = null;
      }
      // Empty the container DOM node so the browser can GC the detached WebGL context
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Munta 1 sola vegada; la key del parent força remuntada entre rondes

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}