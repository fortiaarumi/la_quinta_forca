/// <reference types="@types/google.maps" />
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, update, set, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Room, PlayerGuess } from '@/lib/types';
import { haversineDistance, calculateScore, randomBiasedCoords, randomCatalunyaCoords } from '@/lib/gameUtils';
import { loadGoogleMaps } from '@/lib/mapsLoader';
import StreetViewPane from './StreetViewPane';
import GuessMap from './GuessMap';
import RoundResults from './RoundResults';
import FinalResults from './FinalResults';
import LobbyScreen from './LobbyScreen';
import { useAuth } from '@/lib/authContext';
import { updateUserStatsAfterGame } from '@/lib/userStats';

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
const getTimeSettings = (mode?: string) => {
  if (mode === 'normal') return { total: 300000, panic: 60000 }; // 5 minuts / 1 minut
  if (mode === 'infinit') return { total: null, panic: null };  // Sense temps
  return { total: 60000, panic: 15000 }; // Bala (per defecte)
};

export default function GameRoom({ roomId, playerId }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showGuessMap, setShowGuessMap] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const transitionedRef = useRef(false);
  const prevRoundRef = useRef(-1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { user, isGuest } = useAuth();
  const statsSavedRef = useRef(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch((e) => console.error('Error carregant Maps:', e));
  }, []);

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

 // ── CERVELL DEL TEMPS I RESULTATS ────────────────────────────────────────
  useEffect(() => {
    if (!room || room.gameState !== 'playing') return;
    if (transitionedRef.current) return;

    const interval = setInterval(() => {
      const guesses = room.rounds?.[room.currentRound]?.guesses || {};
      const playerIds = Object.keys(room.players);

      const allGuessed = isSinglePlayer
        ? playerIds.every((id) => guesses[id])
        : playerIds.length >= 2 && playerIds.every((id) => guesses[id]);

      let isTimeUp = false;

      // Només calculem el temps si NO estem en mode infinit i tenim una data límit
      if (room.timeMode !== 'infinit' && room.roundEndsAt) {
        const remaining = Math.max(0, room.roundEndsAt - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));
        if (remaining === 0) isTimeUp = true;
      } else {
        setTimeLeft(null); // Mode infinit: amaguem el rellotge
      }

      // Si s'acaba el temps O tothom ha endevinat
      if (isTimeUp || allGuessed) {
        clearInterval(interval);
        transitionedRef.current = true;

        // Tancar el mapa si a algú se li ha esgotat el temps
        if (isTimeUp && !hasGuessed) {
          setShowGuessMap(false);
          setHasGuessed(true);
        }

        // NOMÉS el Host calcula i suma els punts (per no sumar-los dues vegades)
        if (room.hostId === playerId) {
          const updates: Record<string, any> = { gameState: 'roundResults' };
          
          playerIds.forEach(id => {
            const roundScore = guesses[id]?.score || 0; // Si no ha votat, 0 punts
            const currentTotal = room.totalScores?.[id] || 0;
            updates[`totalScores/${id}`] = currentTotal + roundScore;
          });

          update(ref(db, `rooms/${roomId}`), updates);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room, roomId, playerId, isSinglePlayer, hasGuessed]);

  const generateLocations = useCallback(async () => {
  if (!mapsReady || !room) return;
  await update(ref(db, `rooms/${roomId}`), { gameState: 'generating' });

  const service = new (google.maps as any).StreetViewService();
  const locations: { lat: number; lng: number; panoId: string }[] = [];
  let attempts = 0;

  // Aquest bucle s'assegura que cada ubicació tingui foto real
  while (locations.length < 5 && attempts < 150) {
    attempts++;
    
    // Si és Catalunya, usem la teva funció de coordenades de Catalunya, si no, les del món
    const coords = room.gameMode === 'catalunya' 
      ? randomCatalunyaCoords() // Aquí hauries d'usar una que només doni coordenades de CAT
      : randomBiasedCoords();

    await new Promise<void>((resolve) => {
      service.getPanorama(
        {
          location: coords,
          radius: room.gameMode === 'catalunya' ? 1000 : 50000, // Radi més petit a CAT per ser més precís
          source: (google.maps as any).StreetViewSource?.OUTDOOR ?? 'outdoor',
          preference: (google.maps as any).StreetViewPreference?.NEAREST ?? 'nearest',
        },
        (data: any, status: any) => {
          // NOMÉS afegim la ubicació si Google ens confirma que l'estat és OK
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

  // Si després de 150 intents no n'hi ha 5 (molt difícil), usem els fallbacks
  while (locations.length < 5) {
    locations.push(FALLBACK_LOCATIONS[locations.length]);
  }

  const initialScores = Object.fromEntries(
    Object.keys(room.players).map((id) => [id, 0])
  );

  const tSettings = getTimeSettings(room.timeMode);

  await update(ref(db, `rooms/${roomId}`), {
    locations,
    gameState: 'playing',
    currentRound: 0,
    totalScores: initialScores,
    rounds: null,
    roundEndsAt: tSettings.total ? Date.now() + tSettings.total : null,
  });
}, [mapsReady, roomId, room]);;

  useEffect(() => {
    if (!room || !mapsReady || !isHost) return;
    if (!isSinglePlayer) return;
    if (room.gameState !== 'lobby') return;
    generateLocations();
  }, [room?.gameState, mapsReady, isSinglePlayer, isHost]);

  // ── ENVIAR LA JUGADA (Sense sumar punts i activant el pànic) ────────────
  const submitGuess = useCallback(
    async (guessLat: number, guessLng: number) => {
      if (!room?.locations || hasGuessed) return;

      const actual = room.locations[room.currentRound];
      const distance = haversineDistance(guessLat, guessLng, actual.lat, actual.lng);
      // Li passem el gameMode perquè sàpiga quina escala aplicar (divisor 30 o 2000)
      const score = calculateScore(distance, room.gameMode);

      const guess: PlayerGuess = { lat: guessLat, lng: guessLng, distance, score };

      // 1. Guardem la jugada de l'usuari (sense actualitzar el totalScores)
      await set(
        ref(db, `rooms/${roomId}/rounds/${room.currentRound}/guesses/${playerId}`),
        guess
      );

      // 2. Comprovem si som els PRIMERS a endevinar
      const existingGuesses = room.rounds?.[room.currentRound]?.guesses || {};
      const isFirstToGuess = Object.keys(existingGuesses).length === 0;

      // Si ets el primer en Multijugador, reduïm el temps de la sala segons el mode
      const tSettings = getTimeSettings(room.timeMode);
      if (isFirstToGuess && !isSinglePlayer && room.roundEndsAt && tSettings.panic) {
        const panicTime = Date.now() + tSettings.panic;
        if (panicTime < room.roundEndsAt) {
          await update(ref(db, `rooms/${roomId}`), { roundEndsAt: panicTime });
        }
      }

      setHasGuessed(true);
      setShowGuessMap(false);
    },
    [room, roomId, playerId, hasGuessed, isSinglePlayer]
  );

  const nextRound = useCallback(async () => {
    if (!room || !isHost) return;
    const next = room.currentRound + 1;
    if (next >= 5) {
      await update(ref(db, `rooms/${roomId}`), { gameState: 'finished' });
    } else {
      const tSettings = getTimeSettings(room.timeMode);
      await update(ref(db, `rooms/${roomId}`), {
        currentRound: next,
        gameState: 'playing',
        roundEndsAt: tSettings.total ? Date.now() + tSettings.total : null,
      });
}
  }, [room, isHost, roomId]);

  // ── GUARDAR ESTADÍSTIQUES AL FINAL DE LA PARTIDA ────────────────────────
  useEffect(() => {
    // Només ho fem si la partida ha acabat, si estem loguejats i si no ho hem guardat ja
    if (room?.gameState === 'finished' && user && !isGuest && !statsSavedRef.current) {
      statsSavedRef.current = true; // Tanquem el cadenat per evitar duplicats

      // 1. Agafem la nostra puntuació total
      const myTotalScore = room.totalScores?.[playerId] || 0;

      // 2. Recopilem quants punts hem fet a cadascuna de les 5 rondes
      const myRoundScores = [0, 1, 2, 3, 4].map(roundIdx => 
        room.rounds?.[roundIdx]?.guesses?.[playerId]?.score || 0
      );

      // 3. Enviem les dades al nostre perfil
      updateUserStatsAfterGame(user.uid, room.gameMode || 'world', myTotalScore, myRoundScores)
        .then(() => console.log('Estadístiques guardades amb èxit!'))
        .catch(e => console.error('Error guardant estadístiques:', e));
    }
  }, [room?.gameState, room?.totalScores, room?.rounds, room?.gameMode, user, isGuest, playerId]);

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

  const allPlayerIds = Object.keys(room.players);
  const modeBadge = room.gameMode === 'catalunya' ? '🔴🟡 Catalunya' : null;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      {mapsReady && room.locations?.[room.currentRound] && (
        <StreetViewPane
          key={`sv-${room.currentRound}`}
          location={room.locations[room.currentRound]}
        />
      )}

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
      {/* ⏱️ EL RELLOTGE I ALERTA DE PÀNIC */}
      {timeLeft !== null && room.gameState === 'playing' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
          <div className={`px-6 py-3 rounded-full font-black text-3xl shadow-2xl transition-all duration-300 ${
            timeLeft <= 15 
              ? 'bg-red-600 text-white animate-pulse scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)]' 
              : 'bg-black/80 text-white backdrop-blur-md border border-white/20'
          }`}>
            ⏱️ {timeLeft}s
          </div>
          
          {/* Missatge si l'altre ha tirat i a tu et queda poc temps */}
          {timeLeft <= 15 && !hasGuessed && !isSinglePlayer && (
            <div className="mt-3 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full animate-bounce shadow-lg">
              ⚠️ L'altre jugador ha tirat!
            </div>
          )}
        </div>
      )}

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

      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
        {!hasGuessed && !showGuessMap && (
          <button
            onClick={() => setShowGuessMap(true)}
            className="w-full bg-green-500 hover:bg-green-400 active:scale-95 text-white font-black py-5 rounded-full shadow-[0_10px_30px_rgba(34,197,94,0.4)] transition-all text-xl border-2 border-green-300/30 uppercase tracking-wide"
          >
            📍 Endevinar
          </button>
        )}
        {hasGuessed && !isSinglePlayer && (
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 text-sm shadow-xl">
            ⏳ Esperant {Object.entries(room.players).find(([id]) => id !== playerId)?.[1]?.name ?? "l'adversari"}... ({timeLeft}s)
          </div>
        )}
        {hasGuessed && isSinglePlayer && (
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 text-sm shadow-xl animate-pulse">
            ✅ Endevinança enviada...
          </div>
        )}
      </div>

      {showGuessMap && mapsReady && (
        <GuessMap 
          onGuess={submitGuess} 
          onClose={() => setShowGuessMap(false)} 
          gameMode={room.gameMode}
        />
      )}
    </div>
  );
}
