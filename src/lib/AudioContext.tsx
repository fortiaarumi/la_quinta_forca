'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface AudioContextType {
  playMenuMusic: () => void;
  playGameMusic: () => void;
  stopAllMusic: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Inicialitzem els àudios només quan carregui el navegador (client-side)
  useEffect(() => {
    menuAudioRef.current = new Audio('/sounds/menu-bgm.mp3');
    menuAudioRef.current.loop = true;
    menuAudioRef.current.volume = 0.3; // Volum suau pel menú

    gameAudioRef.current = new Audio('/sounds/game-bgm.mp3');
    gameAudioRef.current.loop = true;
    gameAudioRef.current.volume = 0.4; // Una mica més fort per l'acció
  }, []);

  // Actualitza el volum si mutegem
  useEffect(() => {
    if (menuAudioRef.current) menuAudioRef.current.muted = isMuted;
    if (gameAudioRef.current) gameAudioRef.current.muted = isMuted;
  }, [isMuted]);

  const playMenuMusic = () => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0; // Tornem al principi
    }
    if (menuAudioRef.current && menuAudioRef.current.paused) {
      // El .catch evita errors si el navegador bloqueja l'àudio abans del primer clic
      menuAudioRef.current.play().catch(e => console.log("Esperant interacció de l'usuari...", e));
    }
  };

  const playGameMusic = () => {
    if (menuAudioRef.current) {
      menuAudioRef.current.pause();
    }
    if (gameAudioRef.current && gameAudioRef.current.paused) {
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AudioContext.Provider value={{ playMenuMusic, playGameMusic, stopAllMusic, toggleMute, isMuted }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio s'ha d'utilitzar dins d'un AudioProvider");
  return context;
};