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

  // NOU: Cadenats per evitar el bucle i controlar el botó de felicitar
  const [hasClosedPopup, setHasClosedPopup] = useState(false);
  const [hasCongratulated, setHasCongratulated] = useState(false);
  // NOU: Guardar el nom de qui felicita
  const [congratulatedBy, setCongratulatedBy] = useState<string | null>(null);

  // NOU: Reiniciem els cadenats cada cop que la ronda canvia
  useEffect(() => {
    setHasClosedPopup(false);
    setPerfectScorers([]);
    setHasCongratulated(false);
  }, [round]);

  // Guardarem una referència a la música de fons de la web
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Buscar TOTS els que han fet 5000 punts
    const foundPerfects: string[] = [];
    for (const pid of playerIds) {
      if (guesses[pid] && guesses[pid].score === 5000) {
        if (room.players[pid]?.name) {
          foundPerfects.push(room.players[pid].name);
        }
      }
    }

    // 2. Si hi ha 5K i encara NO hem tancat el popup manualment
    if (foundPerfects.length > 0 && !hasClosedPopup) {
      setPerfectScorers(foundPerfects);

      // Eliminem el confeti inicial. S'activarà només amb el botó "Felicitar"

      // Disparem event global per parar la música a l'AudioContext
      window.dispatchEvent(new Event('pauseBackgroundMusic'));

      // Fem que la música s'aturi enviant un missatge al document
      document.dispatchEvent(new Event('pauseBackgroundMusic'));

      // playSiu(); <- Tampoc reproduirem el SIU automàticament
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, playerIds, playSiu, hasClosedPopup]);
  // Treiem room.players perquè no es torni a disparar quan canvia alguna cosa menor

  // Funció per tancar manualment i trencar el bucle
  const handleClosePerfectScore = () => {
    setHasClosedPopup(true); // Marquem com a tancat
    setPerfectScorers([]);
    window.dispatchEvent(new Event('resumeBackgroundMusic')); // Reprenem música
  };

  // Funció pel nou botó de felicitar
  const handleFelicitar = () => {
    setHasCongratulated(true);
    setCongratulatedBy(room.players[playerId]?.name || 'Algú'); // Agafa el teu propi nom

    // MÀGIA DEL VÍDEO: Busquem l'etiqueta de vídeo i la forcem a reproduir-se de nou amb el so actiu
    const videoEl = document.getElementById('siu-video') as HTMLVideoElement;
    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.play().catch(e => console.log("L'usuari ha de fer clic a la pantalla per reproduir àudio", e));
    }

    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 10000 });

    // Amagar el missatge de felicitació al cap de 3 segons
    setTimeout(() => {
      setCongratulatedBy(null);
    }, 3000)
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
            padding: '30px', textAlign: 'center', boxShadow: '0 0 150px rgba(59, 130, 246, 0.8)',
            animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)', maxWidth: '500px', width: '90%'
          }}>
            <h2 style={{ color: 'white', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              SIUUUUU!
            </h2>
            <p style={{ color: '#bfdbfe', fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Felicitats! {perfectScorers.length > 1 ? 'Els jugadors' : 'El jugador'} <br />
              <span style={{ color: '#fcd34d', fontSize: '28px', display: 'block', marginTop: '5px' }}>
                {perfectScorers.join(', ').replace(/, ([^,]*)$/, ' i $1')}
              </span>
              {perfectScorers.length > 1 ? 'han clavat' : 'ha clavat'} els 5.000 punts!
            </p>

            {/* ── NOU: EL VÍDEO ── */}
            <video
              id="siu-video"
              src="/siu.mp4"
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxHeight: '250px',
                objectFit: 'cover',
                borderRadius: '16px',
                marginBottom: '20px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                background: '#000'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={handleFelicitar}
                disabled={hasCongratulated}
                style={{
                  flex: 1, background: hasCongratulated ? '#4b5563' : '#10b981', color: hasCongratulated ? '#9ca3af' : '#064e3b',
                  border: 'none', padding: '16px 10px', borderRadius: '16px', fontSize: '16px', fontWeight: 900,
                  cursor: hasCongratulated ? 'not-allowed' : 'pointer', boxShadow: hasCongratulated ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                }}
                onMouseOver={(e) => !hasCongratulated && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => !hasCongratulated && (e.currentTarget.style.transform = 'scale(1)')}
                onMouseDown={(e) => !hasCongratulated && (e.currentTarget.style.transform = 'scale(0.95)')}
              >
                {hasCongratulated ? 'Felicitat! 🎉' : 'Felicitar 👏'}
              </button>

              <button
                onClick={handleClosePerfectScore}
                style={{
                  flex: 1, background: '#f59e0b', color: '#78350f', border: 'none', padding: '16px 10px', borderRadius: '16px',
                  fontSize: '16px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              >
                Continuar 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOU: AVÍS DE FELICITACIÓ A LA PANTALLA PRINCIPAL ── */}
      {congratulatedBy && hasClosedPopup && (
        <div style={{
          position: 'absolute', top: '150px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'rgba(16, 185, 129, 0.9)', backdropFilter: 'blur(5px)',
          border: '2px solid #34d399', borderRadius: '20px', padding: '15px 30px', textAlign: 'center',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.6)', animation: 'slideInDown 0.3s ease-out'
        }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0, textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
            🎉 {congratulatedBy} t'ha felicitat!
          </h2>
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