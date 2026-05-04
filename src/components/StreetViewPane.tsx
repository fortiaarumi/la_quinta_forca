import { useEffect, useRef } from 'react';
import { Location } from '@/lib/types';

interface Props {
  location: Location;
  gameMode?: string;
}

export default function StreetViewPane({ location, gameMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isCultural = gameMode === 'cultural';

    const options: google.maps.StreetViewPanoramaOptions = {
      addressControl: false,
      showRoadLabels: false,

      // ── RESTRICCIONS "NO MOVE" ──
      // Si és cultural, bloquegem el zoom i apaguem les fletxes de terra
      zoomControl: !isCultural,
      clickToGo: !isCultural,
      linksControl: !isCultural,

      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: true, // Sempre permetem girar el cap
      enableCloseButton: false,
      imageDateControl: false,
    };

    if (location.panoId) {
      options.pano = location.panoId;
    } else {
      options.position = { lat: location.lat, lng: location.lng };
    }

    new google.maps.StreetViewPanorama(containerRef.current, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Munta 1 sola vegada; la key del parent força remuntada entre rondes

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}