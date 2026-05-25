'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';

const DAILY_VIEW_LIMIT = 150;

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
  const [videoViews, setVideoViews] = useState<number | null>(null);

  // Guard: only increment once per component mount, regardless of autoPlay re-fires
  const hasIncrementedRef = useRef(false);

  // ── LISTENER: Comptador de reproduccions del dia ──
  useEffect(() => {
    const viewsRef = ref(db, 'appConfig/home/videoViews');
    const unsub = onValue(viewsRef, (snap) => {
      setVideoViews(snap.exists() ? (snap.val() as number) : 0);
    });
    return () => unsub();
  }, []);

  // ── HANDLER: Incrementa el comptador quan comença la reproducció ──
  const handlePlay = () => {
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;

    const viewsRef = ref(db, 'appConfig/home/videoViews');
    runTransaction(viewsRef, (current) => (current || 0) + 1).catch((err) => {
      // No és fatal — si falla, simplement no incrementem
      console.warn('[DailyVideo] Error incrementant videoViews:', err);
    });
  };

  // Mentre esperem la resposta de Firebase, no renderitzem res
  // (evita un flash del vídeo quan el límit ja s'ha assolit)
  if (videoViews === null) {
    return (
      <div
        className={`relative overflow-hidden bg-black/20 flex items-center justify-center transition-all duration-500 ${containerClassName}`}
        style={{ aspectRatio: '16/9', width: '100%' }}
      />
    );
  }

  // ── KILL SWITCH: Límit diari assolit ──
  if (videoViews >= DAILY_VIEW_LIMIT) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center transition-all duration-500 ${containerClassName}`}
        style={{ aspectRatio: '16/9', width: '100%' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <span className="text-4xl">🌙</span>
          <p className="text-white/80 text-sm font-bold leading-relaxed max-w-xs">
            Ja hi ha hagut prous reproduccions del vídeo del dia. Fins demà no n&apos;hi haurà més.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-8 bg-indigo-500/40" />
            <span className="text-indigo-400/60 text-[10px] font-black uppercase tracking-widest">
              Límit diari assolit
            </span>
            <div className="h-px w-8 bg-indigo-500/40" />
          </div>
        </div>
      </div>
    );
  }

  // ── REPRODUCCIÓ NORMAL ──
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
        onPlay={handlePlay}
        onLoadedMetadata={(e) => setIsVertical(e.currentTarget.videoHeight > e.currentTarget.videoWidth)}
        className={`w-full h-full transition-all duration-700 ${isVertical ? 'object-contain' : 'object-cover'} ${className}`}
      />
    </div>
  );
}
