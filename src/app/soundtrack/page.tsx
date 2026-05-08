'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useAudio, MENU_TRACKS, GAME_TRACKS } from '@/lib/AudioContext';
import Link from 'next/link';

function formatTime(d: number | null): string {
  if (!d || isNaN(d) || !isFinite(d)) return '--:--';
  const m = Math.floor(d / 60);
  const s = Math.floor(d % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── TrackRow definit FORA del component pare per evitar remuntatge en cada render ──
interface TrackRowProps {
  url: string;
  name: string;
  accent: string;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (url: string, name: string) => void;
}

const TrackRow = memo(function TrackRow({ url, name, accent, isActive, isPlaying, onPlay }: TrackRowProps) {
  const [rowDuration, setRowDuration] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      if (!cancelled) setRowDuration(a.duration);
    };
    a.src = url;
    return () => {
      cancelled = true;
      a.src = '';
    };
  }, [url]);

  const accentActive = accent === 'indigo' ? 'bg-indigo-500 border-indigo-400' : 'bg-emerald-500 border-emerald-400';
  const accentHover  = accent === 'indigo' ? 'group-hover:bg-indigo-500/20' : 'group-hover:bg-emerald-500/20';
  const borderActive = accent === 'indigo' ? 'bg-white/10 border-indigo-500/30' : 'bg-white/10 border-emerald-500/30';

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer group border ${isActive ? borderActive : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'}`}
      onClick={() => onPlay(url, name)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border border-white/10 transition-all ${isActive && isPlaying ? `${accentActive} animate-pulse` : `bg-white/5 ${accentHover}`}`}>
          {isActive && isPlaying ? '▶' : '▶'}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{name}</p>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{formatTime(rowDuration)}</p>
        </div>
      </div>
      <a
        href={url}
        download
        onClick={e => e.stopPropagation()}
        className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 text-gray-300 no-underline transition-colors"
      >
        ↓ MP3
      </a>
    </div>
  );
});

interface NowPlaying {
  url: string;
  name: string;
}

export default function SoundtrackPage() {
  const { isMuted, stopAllMusic } = useAudio();

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  const playTrack = (url: string, name: string) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.ontimeupdate = null;
      activeAudioRef.current.onloadedmetadata = null;
      activeAudioRef.current.onended = null;
      activeAudioRef.current = null;
    }
    stopAllMusic();

    const audio = new Audio(url);
    audio.muted = isMuted;
    activeAudioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => setIsPlaying(false);
    audio.play().catch(() => {});
    setNowPlaying({ url, name });
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayPause = () => {
    if (!activeAudioRef.current) return;
    if (isPlaying) {
      activeAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      activeAudioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const restart = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (activeAudioRef.current) activeAudioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const remaining = duration > 0 ? duration - currentTime : 0;

  return (
    <main className="min-h-screen bg-[#06080f] text-white pb-40">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#06080f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-lg no-underline text-white">
            ←
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">Banda Sonora Original</h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">La Quinta Forca — OST</p>
          </div>
          <div className="ml-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">🎵</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Menú */}
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block"></span>
            <h2 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Música de Menú</h2>
          </div>
          <div className="flex flex-col gap-2">
            {MENU_TRACKS.map((url, i) => (
              <TrackRow
                key={url}
                url={url}
                name={`Menú BGM ${i + 1}`}
                accent="indigo"
                isActive={nowPlaying?.url === url}
                isPlaying={isPlaying}
                onPlay={playTrack}
              />
            ))}
          </div>
        </div>

        {/* Joc */}
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            <h2 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Música de Joc</h2>
          </div>
          <div className="flex flex-col gap-2">
            {GAME_TRACKS.map((url, i) => (
              <TrackRow
                key={url}
                url={url}
                name={`Joc BGM ${i + 1}`}
                accent="emerald"
                isActive={nowPlaying?.url === url}
                isPlaying={isPlaying}
                onPlay={playTrack}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Player */}
      <div className={`fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-500 ${nowPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-[#0d1117]/95 backdrop-blur-2xl border-t border-white/10 px-6 py-4 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg flex-shrink-0 shadow-lg">🎵</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{nowPlaying?.name}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Banda Sonora Original</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={restart} title="Torna a l'inici" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm border border-white/5 cursor-pointer transition-colors text-white">↺</button>
                <button onClick={togglePlayPause} className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-base cursor-pointer border-none shadow-lg transition-all active:scale-90">
                  {isPlaying ? '⏸' : '▶'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-500 w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={seek}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 bg-white/10"
                />
              </div>
              <span className="text-[10px] font-black text-gray-500 w-10 tabular-nums">-{formatTime(remaining)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
