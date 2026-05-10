'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface AudioContextType {
  playMenuMusic: () => void;
  playGameMusic: () => void;
  stopAllMusic: () => void;
  toggleMute: () => void;
  setMuted: (val: boolean) => void;
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
  '/sounds/menu-bgm4.mp3', '/sounds/menu-bgm5.mp3', '/sounds/menu-bgm6.mp3',
  '/sounds/menu-bgm7.mp3', '/sounds/menu-bgm8.mp3'
];
export const GAME_TRACKS = [
  '/sounds/game-bgm.mp3', '/sounds/game-bgm2.mp3', '/sounds/game-bgm3.mp3',
  '/sounds/game-bgm4.mp3', '/sounds/game-bgm5.mp3', '/sounds/game-bgm6.mp3',
  '/sounds/game-bgm7.mp3', '/sounds/game-bgm8.mp3'
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
    
    const muted = sessionStorage.getItem('geoAudioMuted');
    if (muted === 'true') setIsMuted(true);
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

      // Lock per evitar doble-fire de onEnded (fadeOut + fadeIn simultanis)
      let nextScheduled = false;
      const onEnded = () => {
        if (currentCategory.current === 'none') return;
        if (nextScheduled) return;
        nextScheduled = true;
        setTimeout(() => { nextScheduled = false; }, 500);
        playCategory(currentCategory.current, true);
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
    const fadeInPlayer  = activePlayer.current === 'A' ? bgmPlayerB.current : bgmPlayerA.current;

    activePlayer.current = activePlayer.current === 'A' ? 'B' : 'A';
    isTransitioning.current = true;

    fadeInPlayer.src = newSrc;
    fadeInPlayer.volume = 0;
    fadeInPlayer.muted = isMuted;
    fadeInPlayer.play().catch(e => console.log('Play failed:', e));

    // Guardar al historial
    if (currentTrackPath.current) {
      const cat = currentCategory.current;
      if (cat === 'menu') historyMenu.current.push(currentTrackPath.current);
      else if (cat === 'game') historyGame.current.push(currentTrackPath.current);
    }
    currentTrackPath.current = newSrc;

    // Toast "Ara Sonant"
    setCurrentTrackName(formatTrackName(newSrc));
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
      if (player && player.paused) player.play().catch(e => console.log('Restarting', e));
      return;
    }
    currentCategory.current = category;
    const nextTrack = getNextTrack(category);
    crossfade(nextTrack, category === 'menu' ? 0.3 : 0.4);
  };

  const playMenuMusic = () => playCategory('menu');
  const playGameMusic = () => playCategory('game');

  const nextTrack = () => {
    if (currentCategory.current !== 'none') playCategory(currentCategory.current, true);
  };

  const prevTrack = () => {
    const cat = currentCategory.current;
    if (cat === 'none') return;
    const history = cat === 'menu' ? historyMenu : historyGame;
    if (history.current.length > 0) {
      const prevSrc = history.current.pop() as string;
      const listRef = cat === 'menu' ? unplayedMenu : unplayedGame;
      if (currentTrackPath.current) listRef.current.push(currentTrackPath.current);
      currentTrackPath.current = null;
      crossfade(prevSrc, cat === 'menu' ? 0.3 : 0.4);
      currentTrackPath.current = prevSrc;
    } else {
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
  const playDecepcion   = () => playSFX(decepcionRef);
  const playSiu         = () => playSFX(siuRef);
  const playRiure       = () => playSFX(riureRef);
  
  const handleSetMuted = (val: boolean) => {
    setIsMuted(val);
    sessionStorage.setItem('geoAudioMuted', String(val));
  };
  
  const toggleMute      = () => handleSetMuted(!isMuted);

  return (
    <AudioContext.Provider value={{
      playMenuMusic, playGameMusic, stopAllMusic, toggleMute, setMuted: handleSetMuted, isMuted,
      hasInteracted, setHasInteracted: handleSetInteracted,
      playCelebration, playDecepcion, playSiu, playRiure, nextTrack, prevTrack,
      currentTrackName
    }}>
      {children}

      {/* CONTROLS GLOBALS D'ÀUDIO — top-right fix */}
      {hasInteracted && (
        <div className={`fixed top-4 right-4 z-[9998] flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-[0_6px_30px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${currentCategory.current !== 'none' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={prevTrack} title="Pista anterior" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-transform active:scale-90 border-none cursor-pointer text-white text-sm">⏮</button>
          <button onClick={toggleMute} title={isMuted ? 'Activar so' : 'Silenciar'} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-sm transition-transform active:scale-90 border border-white/5 cursor-pointer shadow-inner">{isMuted ? '🔇' : '🔊'}</button>
          <button onClick={nextTrack} title="Pista següent" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-transform active:scale-90 border-none cursor-pointer text-white text-sm">⏭</button>
        </div>
      )}

      {/* POPUP ARA SONANT — centrat a baix */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] pointer-events-none transition-all duration-500 ${showTrackPopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] whitespace-nowrap">
          <div className="relative flex h-3 w-3 flex-shrink-0">
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