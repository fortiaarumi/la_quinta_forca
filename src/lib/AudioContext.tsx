'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

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
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const celebrationRef = useRef<HTMLAudioElement | null>(null);
  const decepcionRef = useRef<HTMLAudioElement | null>(null);
  const siuRef = useRef<HTMLAudioElement | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Inicialitzem els àudios només quan carregui el navegador (client-side)
  useEffect(() => {
    menuAudioRef.current = new Audio('/sounds/menu-bgm.mp3');
    menuAudioRef.current.loop = true;
    menuAudioRef.current.volume = 0.3; // Volum suau pel menú

    gameAudioRef.current = new Audio('/sounds/game-bgm.mp3');
    gameAudioRef.current.loop = true;
    gameAudioRef.current.volume = 0.4; // Una mica més fort per l'acció
    
    celebrationRef.current = new Audio('/sounds/celebracio.mp3');
    celebrationRef.current.volume = 0.6;
    
    decepcionRef.current = new Audio('/sounds/decepcio.mp3');
    decepcionRef.current.volume = 0.6;
    
    siuRef.current = new Audio('/sounds/siu.mp3');
    siuRef.current.volume = 0.8;
  }, []);

  // Actualitza el volum si mutegem
  useEffect(() => {
    if (menuAudioRef.current) menuAudioRef.current.muted = isMuted;
    if (gameAudioRef.current) gameAudioRef.current.muted = isMuted;
    if (celebrationRef.current) celebrationRef.current.muted = isMuted;
    if (decepcionRef.current) decepcionRef.current.muted = isMuted;
    if (siuRef.current) siuRef.current.muted = isMuted;
  }, [isMuted]);

  const playMenuMusic = () => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0; // Tornem al principi
    }
    if (menuAudioRef.current && menuAudioRef.current.paused && hasInteracted) {
      menuAudioRef.current.play().catch(e => console.log("Esperant interacció de l'usuari...", e));
    }
  };

  const playGameMusic = () => {
    if (menuAudioRef.current) {
      menuAudioRef.current.pause();
    }
    if (gameAudioRef.current && gameAudioRef.current.paused && hasInteracted) {
      gameAudioRef.current.play().catch(e => console.log("Esperant interacció...", e));
    }
  };

  const stopAllMusic = () => {
    if (menuAudioRef.current) {
      menuAudioRef.current.pause();
      menuAudioRef.current.currentTime = 0;
    }
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0;
    }
  };

  const playCelebration = () => {
    if (celebrationRef.current && hasInteracted) {
      celebrationRef.current.currentTime = 0;
      celebrationRef.current.play().catch(e => console.log(e));
    }
  };

  const playDecepcion = () => {
    if (decepcionRef.current && hasInteracted) {
      decepcionRef.current.currentTime = 0;
      decepcionRef.current.play().catch(e => console.log(e));
    }
  };

  const playSiu = () => {
    if (siuRef.current && hasInteracted) {
      siuRef.current.currentTime = 0;
      siuRef.current.play().catch(e => console.log(e));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AudioContext.Provider value={{ 
      playMenuMusic, playGameMusic, stopAllMusic, toggleMute, isMuted,
      hasInteracted, setHasInteracted, playCelebration, playDecepcion, playSiu 
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