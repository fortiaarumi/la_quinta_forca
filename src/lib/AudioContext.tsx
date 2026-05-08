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
}

const AudioContext = createContext<AudioContextType | null>(null);

const MENU_TRACKS = [
  '/sounds/menu-bgm.mp3', '/sounds/menu-bgm2.mp3', '/sounds/menu-bgm3.mp3',
  '/sounds/menu-bgm4.mp3', '/sounds/menu-bgm5.mp3', '/sounds/menu-bgm6.mp3'
];
const GAME_TRACKS = [
  '/sounds/game-bgm.mp3', '/sounds/game-bgm2.mp3', '/sounds/game-bgm3.mp3',
  '/sounds/game-bgm4.mp3', '/sounds/game-bgm5.mp3', '/sounds/game-bgm6.mp3'
];

// Funció per barrejar aleatòriament els arrays (Fisher-Yates)
const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export function AudioProvider({ children }: { children: ReactNode }) {
  // PING-PONG per crossfading (dos reproductors)
  const bgmPlayerA = useRef<HTMLAudioElement | null>(null);
  const bgmPlayerB = useRef<HTMLAudioElement | null>(null);
  const activePlayer = useRef<'A' | 'B'>('A');

  // Efectes de so
  const celebrationRef = useRef<HTMLAudioElement | null>(null);
  const decepcionRef = useRef<HTMLAudioElement | null>(null);
  const siuRef = useRef<HTMLAudioElement | null>(null);
  const riureRef = useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Playlists no reproduïdes (per evitar repeticions)
  const unplayedMenu = useRef<string[]>([]);
  const unplayedGame = useRef<string[]>([]);

  // Estats interns
  const currentCategory = useRef<'menu' | 'game' | 'none'>('none');
  const isTransitioning = useRef(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Llegim de sessionStorage al carregar
  useEffect(() => {
    const interacted = sessionStorage.getItem('geoAudioInteracted');
    if (interacted === 'true') {
      setHasInteracted(true);
    }
  }, []);

  const handleSetInteracted = (val: boolean) => {
    setHasInteracted(val);
    sessionStorage.setItem('geoAudioInteracted', String(val));
  };

  const getNextTrack = (category: 'menu' | 'game') => {
    const listRef = category === 'menu' ? unplayedMenu : unplayedGame;
    const baseTracks = category === 'menu' ? MENU_TRACKS : GAME_TRACKS;

    if (listRef.current.length === 0) {
      listRef.current = shuffleArray(baseTracks);
    }
    return listRef.current.pop() as string;
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

      // Quan una cançó s'acaba, reproduir la següent del mateix tipus
      const onEnded = () => {
        if (currentCategory.current !== 'none') {
          playCategory(currentCategory.current, true);
        }
      };
      
      bgmPlayerA.current.onended = onEnded;
      bgmPlayerB.current.onended = onEnded;
    }
  }, []);

  useEffect(() => {
    initPlayers();
  }, [initPlayers]);

  // Actualitza el volum si mutegem
  useEffect(() => {
    const applyMute = (audio: HTMLAudioElement | null) => { if (audio) audio.muted = isMuted; };
    
    applyMute(bgmPlayerA.current);
    applyMute(bgmPlayerB.current);
    applyMute(celebrationRef.current);
    applyMute(decepcionRef.current);
    applyMute(siuRef.current);
    applyMute(riureRef.current);

    // Si desmutegem, restaurem el volum objectiu ràpidament si estem reproduint
    if (!isMuted && !isTransitioning.current && currentCategory.current !== 'none') {
      const active = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (active) {
        active.volume = currentCategory.current === 'menu' ? 0.3 : 0.4;
      }
    }
  }, [isMuted]);

  // Escoltar events globals per parar i reprendre la música quan hi ha un 5K o altres coses
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

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const fadeOutPlayer = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
    const fadeInPlayer = activePlayer.current === 'A' ? bgmPlayerB.current : bgmPlayerA.current;
    
    // Canviem l'identificador del reproductor actiu
    activePlayer.current = activePlayer.current === 'A' ? 'B' : 'A';
    isTransitioning.current = true;

    fadeInPlayer.src = newSrc;
    fadeInPlayer.volume = 0;
    fadeInPlayer.muted = isMuted;
    fadeInPlayer.play().catch(e => console.log("Play failed:", e));

    const steps = 30; // 30 passos de 50ms = 1.5 segons de transició
    let currentStep = 0;
    const initialFadeOutVol = fadeOutPlayer.volume;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      
      // Fade out de l'antiga
      if (!fadeOutPlayer.paused) {
        fadeOutPlayer.volume = Math.max(0, initialFadeOutVol * (1 - currentStep / steps));
      }

      // Fade in de la nova
      if (!isMuted) {
        fadeInPlayer.volume = targetVolume * (currentStep / steps);
      } else {
        fadeInPlayer.volume = 0;
      }

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

    // Si ja estem reproduint la categoria correcta i no ens han obligat a saltar, no fem res (persistència)
    if (!forceNext && currentCategory.current === category) {
      // Però ens assegurem que realment estigui reproduint (ex: l'usuari potser havia pausat o el navegador ha intervingut)
      const player = activePlayer.current === 'A' ? bgmPlayerA.current : bgmPlayerB.current;
      if (player && player.paused) {
        player.play().catch(e => console.log("Restarting paused track", e));
      }
      return;
    }

    currentCategory.current = category;
    const nextTrack = getNextTrack(category);
    const targetVolume = category === 'menu' ? 0.3 : 0.4;
    crossfade(nextTrack, targetVolume);
  };

  const playMenuMusic = () => playCategory('menu');
  const playGameMusic = () => playCategory('game');

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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AudioContext.Provider value={{
      playMenuMusic, playGameMusic, stopAllMusic, toggleMute, isMuted,
      hasInteracted, setHasInteracted: handleSetInteracted, 
      playCelebration, playDecepcion, playSiu, playRiure
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio s'ha d'utilitzar dins d'un AudioProvider");
  return context;
};