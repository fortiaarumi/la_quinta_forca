'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, update, set, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Room, PlayerGuess } from '@/lib/types';
import { haversineDistance, calculateScore, randomBiasedCoords, randomCatalunyaLocations } from '@/lib/gameUtils';
import { loadGoogleMaps } from '@/lib/mapsLoader';
import StreetViewPane from './StreetViewPane';
import GuessMap from './GuessMap';
import RoundResults from './RoundResults';
import FinalResults from './FinalResults';
import LobbyScreen from './LobbyScreen';

interface Props {
  roomId: string;
  playerId: string;
}

const FALLBACK_LOCATIONS = [
  { lat: 48.8566, lng: 2.3522, panoId: '' },
  { lat: 40.7128, lng: -74.006, panoId: '' },
  { lat: 35.6762, lng: 139.6503, panoId: '' },
  { lat: -33.8688, lng: 151.2093, panoId: '' },
  { lat: 51.5074, lng: -0.1278, panoId: '' },
];

export default function GameRoom({ roomId, playerId }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showGuessMap, setShowGuessMap] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const transitionedRef = useRef(false);
  const prevRoundRef = useRef(-1);

  // Carregar Google Maps
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch((e) => console.error('Error carregant Maps:', e));
  }, []);

  // Subscripció Firebase
  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(
      roomRef,
      (snap) => {
        const data = snap.val() as Room | null;
        if (!data) {
          setError('Sala no trobada');
          setLoading(false);
          return;
        }
        setRoom(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [roomId]);

  // Reiniciar estat per ronda nova
  useEffect(() => {
    if (!room) return;
    if (prevRoundRef.current !== room.currentRound) {
      setHasGuessed(false);
      setShowGuessMap(false);
      transitionedRef.current = false;
      prevRoundRef.current = room.currentRound;
    }
  }, [room?.currentRound]);

  const isSinglePlayer = room?.isSinglePlayer ?? false;
  const isHost = room?.hostId === playerId;

  // Transició automàtica quan tots han endevinat
  // En mode un jugador: passa quan el jugador sol ha endevinat
  // En mode multijugador: espera tots dos jugadors (comportament original)
  useEffect(() => {
    if (!room || room.hostId !== playerId || room.gameState !== 'playing') return;
    if (transitionedRef.current) return;

    const guesses = room.rounds?.[room.currentRound]?.guesses || {};
    const playerIds = Object.keys(room.players);

    const allGuessed = isSinglePlayer
      ? playerIds.every((id) => guesses[id])           // 1 jugador: només ell
      : playerIds.length >= 2 && playerIds.every((id) => guesses[id]); // 2 jugadors

    if (allGuessed) {
      transitionedRef.current = true;
      update(ref(db, `rooms/${roomId}`), { gameState: 'roundResults' });
    }
  }, [room, playerId, roomId, isSinglePlayer]);

  // Generar ubicacions — món o Catalunya
  const generateLocations = useCallback(async () => {
    if (!mapsReady || !room) return;
    await update(ref(db, `rooms/${roomId}`), { gameState: 'generating' });

    let locations: { lat: number; lng: number; panoId: string }[] = [];

    if (room.gameMode === 'catalunya') {
      // Mode Catalunya: coordenades predefinides, sense cerca de Street View
      locations = randomCatalunyaLocations();
    } else {
      // Mode Món: cerca aleatòria de Street View (comportament original)
      const service = new google.maps.StreetViewService();
      let attempts = 0;

      while (locations.length < 5 && attempts < 150) {
        attempts++;
        const coords = randomBiasedCoords();

        await new Promise<void>((resolve) => {
          service.getPanorama(
            {
              location: coords,
              radius: 50000,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source: (google.maps as any).StreetViewSource?.OUTDOOR ?? 'outdoor',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              preference: (google.maps as any).StreetViewPreference?.NEAREST ?? 'nearest',
            },
            (data: google.maps.StreetViewPanoramaData | null, status: google.maps.StreetViewStatus) => {
              if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
                locations.push({
                  lat: data.location.latLng.lat(),
                  lng: data.location.latLng.lng(),
                  panoId: data.location.pano || '',
                });
              }
              resolve();
            }
          );
        });
      }

      while (locations.length < 5) {
        locations.push(FALLBACK_LOCATIONS[locations.length]);
      }
    }

    const initialScores = Object.fromEntries(
      Object.keys(room.players).map((id) => [id, 0])
    );

    await update(ref(db, `rooms/${roomId}`), {
      locations,
      gameState: 'playing',
      currentRound: 0,
      totalScores: initialScores,
      rounds: null,
    });
  }, [mapsReady, roomId, room]);

  // En mode un jugador, el lobby arrenca sol automàticament quan Maps està llest
  useEffect(() => {
    if (!room || !mapsReady || !isHost) return;
    if (!isSinglePlayer) return;
    if (room.gameState !== 'lobby') return;
    generateLocations();
  }, [room?.gameState, mapsReady, isSinglePlayer, isHost]);

  // Enviar endevinança
  const submitGuess = useCallback(
    async (guessLat: number, guessLng: number) => {
      if (!room?.locations || hasGuessed) return;

      const actual = room.locations[room.currentRound];
      const distance = haversineDistance(guessLat, guessLng, actual.lat, actual.lng);
      const score = calculateScore(distance);

      const guess: PlayerGuess = { lat: guessLat, lng: guessLng, distance, score };

      await set(
        ref(db, `rooms/${roomId}/rounds/${room.currentRound}/guesses/${playerId}`),
        guess
      );
      await runTransaction(
        ref(db, `rooms/${roomId}/totalScores/${playerId}`),
        (current) => (current ?? 0) + score
      );

      setHasGuessed(true);
      setShowGuessMap(false);
    },
    [room, roomId, playerId, hasGuessed]
  );

  // Avançar ronda (host)
  const nextRound = useCallback(async () => {
    if (!room || !isHost) return;
    const next = room.currentRound + 1;
    if (next >= 5) {
      await update(ref(db, `rooms/${roomId}`), { gameState: 'finished' });
    } else {
      await update(ref(db, `rooms/${roomId}`), {
        currentRound: next,
        gameState: 'playing',
      });
    }
  }, [room, isHost, roomId]);

  // ──── Renders ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Carregant sala...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-2xl">{error || 'Sala no trobada'}</div>
        <a href="/" className="text-green-400 underline">Tornar a l&apos;inici</a>
      </div>
    );
  }

  // En mode un jugador, el lobby i la generació mostren una pantalla de càrrega simple
  // (no es mostra el LobbyScreen de multijugador)
  if (isSinglePlayer && (room.gameState === 'lobby' || room.gameState === 'generating')) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl animate-spin-slow">🌍</div>
        <div className="text-white text-xl animate-pulse font-bold">
          {room.gameMode === 'catalunya' ? 'Preparant Catalunya...' : 'Buscant ubicacions...'}
        </div>
        <div className="text-gray-400 text-sm">Això pot trigar uns segons</div>
      </div>
    );
  }

  if (!isSinglePlayer && (room.gameState === 'lobby' || room.gameState === 'generating')) {
    return (
      <LobbyScreen
        room={room}
        roomId={roomId}
        playerId={playerId}
        isHost={isHost}
        onStart={generateLocations}
        isGenerating={room.gameState === 'generating'}
        mapsReady={mapsReady}
      />
    );
  }

  if (room.gameState === 'finished') {
    return <FinalResults room={room} playerId={playerId} />;
  }

  if (room.gameState === 'roundResults') {
    return (
      <RoundResults
        room={room}
        round={room.currentRound}
        isHost={isHost}
        playerId={playerId}
        onNext={nextRound}
        mapsReady={mapsReady}
      />
    );
  }

  // gameState === 'playing'
  const roundGuesses = room.rounds?.[room.currentRound]?.guesses || {};
  const allPlayerIds = Object.keys(room.players);

  // Badge de mode
  const modeBadge = room.gameMode === 'catalunya' ? '🔴🟡 Catalunya' : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Street View */}
      {mapsReady && room.locations?.[room.currentRound] && (
        <StreetViewPane
          key={`sv-${room.currentRound}`}
          location={room.locations[room.currentRound]}
        />
      )}

      {/* HUD superior — ronda */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="bg-black/70 backdrop-blur-md text-white px-5 py-2 rounded-full font-bold text-sm shadow-xl border border-white/10">
          Ronda {room.currentRound + 1} / 5
        </div>
        {modeBadge && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-full text-xs font-semibold">
            {modeBadge}
          </div>
        )}
      </div>

      {/* HUD puntuacions */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 shadow-xl min-w-[160px]">
        {allPlayerIds.map((id, i) => {
          const player = room.players[id];
          const isMe = id === playerId;
          return (
            <div
              key={id}
              className={`flex items-center justify-between gap-3 text-sm ${i > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}`}
            >
              <span className={isMe ? 'text-green-400 font-bold' : 'text-gray-300'}>
                {isMe ? '★ ' : ''}{player.name}
              </span>
              <span className="text-yellow-400 font-bold">
                {(room.totalScores?.[id] ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botó d'endevinar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        {!hasGuessed && !showGuessMap && (
          <button
            onClick={() => setShowGuessMap(true)}
            className="bg-green-500 hover:bg-green-400 active:scale-95 text-white font-black px-8 py-4 rounded-full shadow-2xl shadow-green-500/40 transition-all text-lg border-2 border-green-300/30"
          >
            📍 Endevinar
          </button>
        )}
        {/* En mode un jugador, quan ha endevinat no cal esperar ningú */}
        {hasGuessed && !isSinglePlayer && (
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 text-sm shadow-xl">
            ⏳ Esperant {Object.entries(room.players).find(([id]) => id !== playerId)?.[1]?.name ?? "l'adversari"}...
          </div>
        )}
        {hasGuessed && isSinglePlayer && (
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 text-sm shadow-xl animate-pulse">
            ✅ Endevinança enviada...
          </div>
        )}
      </div>

      {/* Mapa d'endevinar */}
      {showGuessMap && mapsReady && (
        <GuessMap onGuess={submitGuess} onClose={() => setShowGuessMap(false)} />
      )}
    </div>
  );
}
