'use client';

import { useState } from 'react';

interface DailyVideoProps {
  src: string;
  className?: string;
  containerClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

export default function DailyVideo({ 
  src, 
  className = "", 
  containerClassName = "",
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true
}: DailyVideoProps) {
  const [isVertical, setIsVertical] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden bg-black flex items-center justify-center transition-all duration-500 ${containerClassName}`}
      style={{ 
        aspectRatio: isVertical ? '9/16' : '16/9',
        width: '100%',
        maxHeight: isVertical ? '500px' : 'none',
      }}
    >
      <video 
        src={src} 
        autoPlay={autoPlay} 
        loop={loop} 
        muted={muted} 
        playsInline={playsInline}
        onLoadedMetadata={(e) => setIsVertical(e.currentTarget.videoHeight > e.currentTarget.videoWidth)}
        className={`w-full h-full transition-all duration-700 ${isVertical ? 'object-contain' : 'object-cover'} ${className}`} 
      />
    </div>
  );
}
