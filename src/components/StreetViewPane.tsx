'use client';

import { useEffect, useRef } from 'react';
import { Location } from '@/lib/types';

interface Props {
  location: Location;
}

export default function StreetViewPane({ location }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const options: google.maps.StreetViewPanoramaOptions = {
      addressControl: false,
      showRoadLabels: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: false,
      clickToGo: true,
      linksControl: true,
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
