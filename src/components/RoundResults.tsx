'use client';

import { useEffect, useRef, useState } from 'react';
import { Room } from '@/lib/types';
import { useAudio } from '@/lib/AudioContext';
import confetti from 'canvas-confetti';

interface Props {
  room: Room;
  round: number;
  isHost: boolean;
  playerId: string;
  onNext: () => void;
  mapsReady: boolean;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

export default function RoundResults({ room, round, isHost, playerId, onNext, mapsReady }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const actual = room.locations?.[round];
  const guesses = room.rounds?.[round]?.guesses ?? {};
  const playerIds = Object.keys(room.players);

  // Necessitem el playMenuMusic (o playGameMusic) per reprendre la música després
  const { playSiu, isMuted } = useAudio();
  const [perfectScorers, setPerfectScorers] = useState<string[]>([]); // 👈 ARA ÉS UN ARRAY

  // Guardarem una referència a la música de fons de la web
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Busquem l'element d'àudio principal del fons (si està actiu)
    bgMusicRef.current = document.getElementById('bg-music-player') as HTMLAudioElement;

    // 2. Buscar TOTS els que han fet 5000 punts
    const foundPerfects: string[] = [];
    for (const pid of playerIds) {
      if (guesses[pid] && guesses[pid].score === 5000) {
        if (room.players[pid]?.name) {
          foundPerfects.push(room.players[pid].name);
        }
      }
    }

    if (foundPerfects.length > 0) {
      setPerfectScorers(foundPerfects);

      // 3. Aturem la música de fons un moment
      if (bgMusicRef.current && !isMuted) {
        bgMusicRef.current.pause();
      }

      // 4. Llançem el confeti des de les cantonades
      var duration = 3000;
      var end = Date.now() + duration;

      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fbbf24', '#3b82f6', '#10b981'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fbbf24', '#3b82f6', '#10b981'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());

      // 5. Reproduim el crit de guerra a tot drap
      playSiu();
    }
  }, [guesses, playerIds, playSiu, isMuted, room.players]);

  // NOU BOTÓ: Funció per tancar el popup i reprendre la música
  const handleClosePerfectScore = () => {
    setPerfectScorers([]);
    if (bgMusicRef.current && !isMuted) {
      bgMusicRef.current.play().catch(e => console.log('Error reprenent música', e));
    }
  };

  useEffect(() => {
    if (!mapRef.current || !mapsReady || !actual) return;

    const actualLatLng = new google.maps.LatLng(actual.lat, actual.lng);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(actualLatLng);

    const map = new google.maps.Map(mapRef.current, {
      zoom: 3,
      center: actualLatLng,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
    });

    // Marcador de la ubicació real (estrella groga)
    new google.maps.Marker({
      position: actualLatLng,
      map,
      zIndex: 10,
      title: 'Ubicació real',
      icon: {
        path: 'M 0,-15 L 3.5,-5 L 14,-5 L 5.5,2 L 8.5,13 L 0,7 L -8.5,13 L -5.5,2 L -14,-5 L -3.5,-5 Z',
        fillColor: '#FBBF24',
        fillOpacity: 1,
        strokeColor: '#92400E',
        strokeWeight: 1.5,
        scale: 1.2,
        anchor: new google.maps.Point(0, 0),
      },
    });

    // Marcadors i línies de cada jugador
    playerIds.forEach((pid, i) => {
      const guess = guesses[pid];
      if (!guess) return;
      const guessLatLng = new google.maps.LatLng(guess.lat, guess.lng);
      bounds.extend(guessLatLng);
      const color = COLORS[i % COLORS.length];

      new google.maps.Marker({
        position: guessLatLng,
        map,
        zIndex: 5,
        title: room.players[pid]?.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
        },
      });

      new google.maps.Polyline({
        path: [guessLatLng, actualLatLng],
        map,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        geodesic: true,
      });
    });

    map.fitBounds(bounds, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, actual]);

  if (!actual) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative overflow-hidden">

      {/* ── ANIMACIÓ 5K MULTIJUGADOR MILLORADA ── */}
      {perfectScorers.length > 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: '2px solid #60a5fa', borderRadius: '30px',
            padding: '40px', textAlign: 'center', boxShadow: '0 0 150px rgba(59, 130, 246, 0.8)',
            animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)', maxWidth: '500px'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '15px', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))', animation: 'pulse 1s infinite' }}>🐐</div>
            <h2 style={{ color: 'white', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 15px 0', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              SIUUUUU!
            </h2>
            <p style={{ color: '#bfdbfe', fontSize: '18px', fontWeight: 800, margin: '0 0 30px 0', lineHeight: 1.4 }}>
              Felicitats! {perfectScorers.length > 1 ? 'Els jugadors' : 'El jugador'} <br />
              <span style={{ color: '#fcd34d', fontSize: '28px', display: 'block', marginTop: '5px' }}>
                {perfectScorers.join(', ').replace(/, ([^,]*)$/, ' i $1')}
              </span>
              {perfectScorers.length > 1 ? 'han clavat' : 'ha clavat'} els 5.000 punts!
            </p>

            <button
              onClick={handleClosePerfectScore}
              style={{
                background: '#f59e0b', color: '#78350f', border: 'none', padding: '16px 32px', borderRadius: '16px',
                fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.2s', width: '100%', textTransform: 'uppercase', letterSpacing: '1px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            >
              Continuar 🚀
            </button>
          </div>
        </div>
      )}

      {/* Mapa de resultats */}
      <div ref={mapRef} className="flex-1 min-h-0" />

      {/* Panell de puntuacions */}
      <div className="bg-gray-900 border-t border-gray-700/50 p-5 flex-shrink-0">
        <h2 className="text-white text-xl font-black text-center mb-1">
          Resultats — Ronda {round + 1}
        </h2>
        <p className="text-gray-500 text-xs text-center mb-4 font-mono">
          {actual.lat.toFixed(4)}, {actual.lng.toFixed(4)}
        </p>

        {/* Targetes de jugadors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {playerIds.map((pid, i) => {
            const guess = guesses[pid];
            const player = room.players[pid];
            const color = COLORS[i % COLORS.length];
            const isMe = pid === playerId;
            return (
              <div
                key={pid}
                className={`rounded-xl p-4 ${isMe ? 'ring-2 ring-white/20' : ''}`}
                style={{ background: `${color}18`, borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                    {player?.name}
                    {(player as any)?.isAdmin && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-black shadow-[0_0_8px_rgba(220,38,38,0.8)]">👑 ADMIN</span>}
                    {isMe ? ' (Tu)' : ''}
                  </span>
                </div>
                {guess ? (
                  <>
                    <div className="text-gray-400 text-xs">
                      {Math.round(guess.distance).toLocaleString()} km
                    </div>
                    <div className="text-yellow-400 font-black text-xl">
                      +{guess.score.toLocaleString()}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-xs italic">Sense endevinança</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total acumulat */}
        <div className="bg-gray-800 rounded-xl p-3 mb-4 flex justify-around">
          {playerIds.map((pid) => (
            <div key={pid} className="text-center">
              <div className="text-gray-400 text-xs mb-1 flex justify-center items-center gap-1">
                {room.players[pid]?.name} {(room.players[pid] as any)?.isAdmin && '👑'}
              </div>
              <div className="text-yellow-400 font-black text-lg">
                {(room.totalScores?.[pid] ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Botó / espera */}
        {isHost ? (
          <button
            onClick={onNext}
            className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-black py-3.5 rounded-xl text-lg transition-all shadow-lg shadow-green-500/20"
          >
            {round >= 4 ? '🏆 Resultats Finals' : 'Ronda Següent →'}
          </button>
        ) : (
          <div className="text-center text-gray-500 py-3.5 text-sm">
            Esperant que el host continuï...
          </div>
        )}
      </div>
    </div>
  );
}