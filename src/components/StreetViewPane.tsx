import { useEffect, useRef } from 'react';
import { Location } from '@/lib/types';

interface Props {
  location: Location;
  gameMode?: string;
  onReady?: () => void;
}

export default function StreetViewPane({ location, gameMode, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    new google.maps.StreetViewPanorama(containerRef.current, options);
    if (onReady) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Munta 1 sola vegada; la key del parent força remuntada entre rondes

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}