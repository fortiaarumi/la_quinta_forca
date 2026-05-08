'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface AudioContextType {
  playMenuMusic: () => void;
  playGameMusic: () => void;
  stopAllMusic: () => void;
  toggleMute: () => void;
  isMuted: boolean;
  hasInteracted: boolean;
  setHasInteracted: (val: boolean) => void;
  playCelebration: () => void;
  playDecepcion: () => void;
  playSiu: () => void;
  playRiure: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  currentTrackName: string | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const MENU_TRACKS = [
  '/sounds/menu-bgm.mp3', '/sounds/menu-bgm2.mp3', '/sounds/menu-bgm3.mp3',
  '/sounds/menu-bgm4.mp3', '/sounds/menu-bgm5.mp3', '/sounds/menu-bgm6.mp3'
];
export const GAME_TRACKS = [
  '/sounds/game-bgm.mp3', '/sounds/game-bgm2.mp3', '/sounds/game-bgm3.mp3',
  '/sounds/game-bgm4.mp3', '/sounds/game-bgm5.mp3', '/sounds/game-bgm6.mp3'
];

const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const bgmPlayerA = useRef<HTMLAudioElement | null>(null);
  const bgmPlayerB = useRef<HTMLAudioElement | null>(null);
  const activePlayer = useRef<'A' | 'B'>('A');

  const celebrationRef = useRef<HTMLAudioElement | null>(null);
  const decepcionRef = useRef<HTMLAudioElement | null>(null);
  const siuRef = useRef<HTMLAudioElement | null>(null);
  const riureRef = useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const unplayedMenu = useRef<string[]>([]);
  const unplayedGame = useRef<string[]>([]);
  const lastMenuTrack = useRef<string | null>(null);
  const lastGameTrack = useRef<string | null>(null);
  // Historial real de pistes reproduïdes (per prevTrack)
  const historyMenu = useRef<string[]>([]);
  const historyGame = useRef<string[]>([]);
  const currentTrackPath = useRef<string | null>(null);

  const currentCategory = useRef<'menu' | 'game' | 'none'>('none');
  const isTransitioning = useRef(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Popup "Ara Sonant"
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null);
  const [showTrackPopup, setShowTrackPopup] = useState(false);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interacted = sessionStorage.getItem('geoAudioInteracted');
    if (interacted === 'true') setHasInteracted(true);
  }, []);

  const handleSetInteracted = (val: boolean) => {
    setHasInteracted(val);
    sessionStorage.setItem('geoAudioInteracted', String(val));
  };

  const getNextTrack = (category: 'menu' | 'game') => {
    const listRef = category === 'menu' ? unplayedMenu : unplayedGame;
    const baseTracks = category === 'menu' ? MENU_TRACKS : GAME_TRACKS;
    const lastPlayed = category === 'menu' ? lastMenuTrack.current : lastGameTrack.current;

    if (listRef.current.length === 0) {
      const newShuffle = shuffleArray(baseTracks);
      // Evitar que la mateixa cançó soni dos cops seguits
      if (newShuffle.length > 1 && newShuffle[newShuffle.length - 1] === lastPlayed) {
         const temp = newShuffle[newShuffle.length - 1];
         newShuffle[newShuffle.length - 1] = newShuffle[0];
         newShuffle[0] = temp;
      }
      listRef.current = newShuffle;
    }
    
    const nextTrack = listRef.current.pop() as string;
    if (category === 'menu') lastMenuTrack.current = nextTrack;
    else lastGameTrack.current = nextTrack;
    return nextTrack;
  };

  const formatTrackName = (path: string) => {
    const filename = path.split('/').pop()?.replace('.mp3', '') || '';
    if (filename === 'menu-bgm') return 'Menú BGM 1';
    if (filename === 'game-bgm') return 'Joc BGM 1';
    return filename.replace('menu-bgm', 'Menú BGM ').replace('game-bgm', 'Joc BGM ');
  };

  const initPlayers = useCallback(() => {
    if (!bgmPlayerA.current) {
      bgmPlayerA.current = new Audio();
      bgmPlayerB.current = new Audio();
      
      celebrationRef.current = new Audio('/sounds/celebracio.mp3');
      celebrationRef.current.volume = 0.6;
      decepcionRef.current = new Audio('/sounds/decepcio.mp3');
      decepcionRef.current.volume = 0.6;
      siuRef.current = new Audio('/sounds/siu.mp3');
      siuRef.current.volume = 0.8;
      riureRef.current = new Audio('/sounds/riure.mp3');
      riureRef.current.volume = 0.6;

      const onEnded = () => {
        if (currentCategory.current !== 'none') {
          playCategory(currentCategory.current, true);
        }
      };
      
      bgmPlayerA.current.onended = onEnded;
      bgmPlayerB.current.onended = onEnded;
    }
  }, []);

  useEffect(() => { initPlayers(); }, [initPlayers]);

  useEffect(() => {
    const applyMute = (audio: HTMLAudioElement | null) => { if (audio) audio.muted = isMuted; };
    applyMute(bgmPlayerA.current);
    applyMute(bgmPlayerB.current);
    applyMute(celebrationRef.current);
    applyMute(decepcionRef.current);
    applyMute(siuRef.current);
    applyMute(riureRef.current);

    if (!isMuted && !isTransitioning.current && currentCategory.current !== 'none') {
      const active = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (active) active.volume = currentCategory.current === 'menu' ? 0.3 : 0.4;
    }
  }, [isMuted]);

  useEffect(() => {
    const pauseMusic = () => {
      const player = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (player) player.pause();
    };
    const resumeMusic = () => {
      if (!isMuted) {
        const player = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
        player?.play().catch(e => console.log(e));
      }
    };

    window.addEventListener('pauseBackgroundMusic', pauseMusic);
    window.addEventListener('resumeBackgroundMusic', resumeMusic);
    return () => {
      window.removeEventListener('pauseBackgroundMusic', pauseMusic);
      window.removeEventListener('resumeBackgroundMusic', resumeMusic);
    };
  }, [isMuted]);

  const crossfade = (newSrc: string, targetVolume: number) => {
    if (!bgmPlayerA.current || !bgmPlayerB.current) return;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const fadeOutPlayer = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
    const fadeInPlayer = activePlayer.current === 'A' ? bgmPlayerB.current : bgmPlayerA.current;
    
    activePlayer.current = activePlayer.current === 'A' ? 'B' : 'A';
    isTransitioning.current = true;

    fadeInPlayer.src = newSrc;
    fadeInPlayer.volume = 0;
    fadeInPlayer.muted = isMuted;
    fadeInPlayer.play().catch(e => console.log("Play failed:", e));

    // Guardar al historial
    if (currentTrackPath.current) {
      const cat = currentCategory.current;
      if (cat === 'menu') historyMenu.current.push(currentTrackPath.current);
      else if (cat === 'game') historyGame.current.push(currentTrackPath.current);
    }
    currentTrackPath.current = newSrc;

    // Mostrar el Toast Ara Sonant
    const name = formatTrackName(newSrc);
    setCurrentTrackName(name);
    setShowTrackPopup(false);
    setTimeout(() => setShowTrackPopup(true), 50);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setShowTrackPopup(false), 4000);

    const steps = 30; 
    let currentStep = 0;
    const initialFadeOutVol = fadeOutPlayer.volume;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (!fadeOutPlayer.paused) fadeOutPlayer.volume = Math.max(0, initialFadeOutVol * (1 - currentStep / steps));
      if (!isMuted) fadeInPlayer.volume = targetVolume * (currentStep / steps);
      else fadeInPlayer.volume = 0;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeOutPlayer.pause();
        fadeOutPlayer.currentTime = 0;
        isTransitioning.current = false;
      }
    }, 50);
  };

  const playCategory = (category: 'menu' | 'game', forceNext = false) => {
    if (!hasInteracted) return;
    if (!forceNext && currentCategory.current === category) {
      const player = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (player && player.paused) player.play().catch(e => console.log("Restarting paused track", e));
      return;
    }
    currentCategory.current = category;
    const nextTrack = getNextTrack(category);
    const targetVolume = category === 'menu' ? 0.3 : 0.4;
    crossfade(nextTrack, targetVolume);
  };

  const playMenuMusic = () => playCategory('menu');
  const playGameMusic = () => playCategory('game');

  const nextTrack = () => {
    if (currentCategory.current !== 'none') {
      playCategory(currentCategory.current, true);
    }
  };

  const prevTrack = () => {
    const cat = currentCategory.current;
    if (cat === 'none') return;
    const history = cat === 'menu' ? historyMenu : historyGame;
    if (history.current.length > 0) {
      // Recuperem la pista anterior
      const prevSrc = history.current.pop() as string;
      // Tornem-la a afegir al front de la llista sense-reproduir perquè no es perdi del shuffle
      const listRef = cat === 'menu' ? unplayedMenu : unplayedGame;
      if (currentTrackPath.current) listRef.current.push(currentTrackPath.current);
      const targetVolume = cat === 'menu' ? 0.3 : 0.4;
      // Actualitzem currentTrackPath manualment abans de crossfade
      currentTrackPath.current = null; // evitem que crossfade la guardi al historial dos cops
      crossfade(prevSrc, targetVolume);
      currentTrackPath.current = prevSrc;
    } else {
      // Si no hi ha historial, anem a l'inici de la cançó actual
      const player = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (player) player.currentTime = 0;
    }
  };

  const stopAllMusic = () => {
    currentCategory.current = 'none';
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    isTransitioning.current = false;
    if (bgmPlayerA.current) { bgmPlayerA.current.pause(); bgmPlayerA.current.currentTime = 0; }
    if (bgmPlayerB.current) { bgmPlayerB.current.pause(); bgmPlayerB.current.currentTime = 0; }
  };

  const playSFX = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (ref.current && hasInteracted) {
      ref.current.currentTime = 0;
      ref.current.play().catch(e => console.log(e));
    }
  };

  const playCelebration = () => playSFX(celebrationRef);
  const playDecepcion = () => playSFX(decepcionRef);
  const playSiu = () => playSFX(siuRef);
  const playRiure = () => playSFX(riureRef);
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AudioContext.Provider value={{
      playMenuMusic, playGameMusic, stopAllMusic, toggleMute, isMuted,
      hasInteracted, setHasInteracted: handleSetInteracted, 
      playCelebration, playDecepcion, playSiu, playRiure, nextTrack, prevTrack,
      currentTrackName
    }}>
      {children}
      
      {/* CONTROLS GLOBALS D'ÀUDIO — bottom-left, no interfereix amb les pistes */}
      {hasInteracted && (
        <div className={`fixed bottom-6 left-6 z-[9998] flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${currentCategory.current !== 'none' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={prevTrack} title="Pista anterior" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-transform active:scale-90 border-none cursor-pointer text-white text-base">⏮</button>
          <button onClick={toggleMute} title={isMuted ? 'Activar so' : 'Silenciar'} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-base transition-transform active:scale-90 border border-white/5 cursor-pointer mx-0.5 shadow-inner">{isMuted ? '🔇' : '🔊'}</button>
          <button onClick={nextTrack} title="Pista següent" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-transform active:scale-90 border-none cursor-pointer text-white text-base">⏭</button>
        </div>
      )}
      
      {/* POPUP ARA SONANT — bottom-right, sobre el player global */}
      <div className={`fixed bottom-20 left-6 z-[9997] pointer-events-none transition-all duration-700 ${showTrackPopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest leading-tight">Ara Sonant</span>
            <span className="text-white text-xs font-bold leading-tight">{currentTrackName}</span>
          </div>
        </div>
      </div>
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio s'ha d'utilitzar dins d'un AudioProvider");
  return context;
};