/// <reference types="@types/google.maps" />
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, update, set, runTransaction, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Room, PlayerGuess } from '@/lib/types';
import { haversineDistance, calculateScore, randomBiasedCoords, randomCatalunyaCoords, ESTADIS_FUTBOL, MONUMENTS_CULTURALS } from '@/lib/gameUtils';
import { loadGoogleMaps } from '@/lib/mapsLoader';
import StreetViewPane from './StreetViewPane';
import GuessMap from './GuessMap';
import RoundResults from './RoundResults';
import FinalResults from './FinalResults';
import LobbyScreen from './LobbyScreen';
import GoldButton from './GoldButton';
import { useAuth } from '@/lib/authContext';
import { updateUserStatsAfterGame } from '@/lib/userStats';
import { useAudio } from '@/lib/AudioContext'; // 👈 AFEGIT: Importem el cervell musical

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
  // Reset de pistes cada cop que canvia la ronda o l'estat del joc
  useEffect(() => {
    setHasUsedHint(false);
    setCurrentHint(null);
  }, [room?.currentRound, room?.gameState]);
  const [prevHealth, setPrevHealth] = useState<Record<string, number>>({});
  const statsSavedRef = useRef(false);

  // Sincronitzem la vida prèvia cada cop que comença una ronda nova de joc
  useEffect(() => {
    if (room?.gameState === 'playing' && room?.players) {
      const currentH: Record<string, number> = {};
      Object.keys(room.players).forEach(pid => {
        currentH[pid] = room.players[pid]?.health ?? 10000;
      });
      setPrevHealth(currentH);
    }
  }, [room?.currentRound, room?.gameState]); // S'actualitza en canviar de ronda o tornar a 'playing'
  const tempPinRef = useRef<{ lat: number, lng: number } | null>(null); // 👈 AFEGIT
  const [showAlert, setShowAlert] = useState(false);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null); // 👈 NOU
  const lastEventRef = useRef<number>(0); // 👈 NOU: Per no repetir missatges
  const [hasUsedHint, setHasUsedHint] = useState(false); // 👈 NOU
  const [currentHint, setCurrentHint] = useState<string | null>(null); // 👈 NOU
  const [hintLoading, setHintLoading] = useState(false); // 👈 NOU
  const [showRoundIntro, setShowRoundIntro] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);

  // ── AFEGIT: ÀUDIO I EFECTES DE SO ──
  const { playGameMusic, playMenuMusic } = useAudio();
  const tickTockRef = useRef<HTMLAudioElement | null>(null);
  const alertaRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tickTockRef.current = new Audio('/sounds/tick-tock.mp3');
    alertaRef.current = new Audio('/sounds/alerta.mp3');
  }, []);

  useEffect(() => {
    if (!room) return;
    if (room.gameState === 'playing' || room.gameState === 'roundResults') {
      playGameMusic();
    } else if (room.gameState === 'finished') {
      playMenuMusic();
    }
  }, [room?.gameState, playGameMusic, playMenuMusic]);
  // ───────────────────────────────────

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

        // ── NOU: Escolta d'esdeveniments del sistema (jugadors que marxen) ──
        if (data.lastEvent && data.lastEvent.timestamp > lastEventRef.current) {
          lastEventRef.current = data.lastEvent.timestamp;
          if (data.lastEvent.type === 'leave') {
            setSystemMessage(`${data.lastEvent.playerName} ha abandonat la partida!!.`);
            setTimeout(() => setSystemMessage(null), 4000);
          }
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
      tempPinRef.current = null; // 👈 AFEGIT: Netejem el pin al canviar de ronda
      setHasUsedHint(false); // 👈 NOU
      setCurrentHint(null);  // 👈 NOU
      prevRoundRef.current = room.currentRound;

      if (room.gameState === 'playing') {
        setShowRoundIntro(true);
        setTimeout(() => setShowRoundIntro(false), 3000);
      }
    }
  }, [room?.currentRound, room?.gameState]);

  const isSinglePlayer = room?.isSinglePlayer ?? false;
  const isHost = room?.hostId === playerId;

  // NOU: Detectar canvi d'host per mostrar missatge
  const isHostRef = useRef(isHost);
  useEffect(() => {
    if (isHost && !isHostRef.current && room?.gameState !== 'lobby') {
      setSystemMessage('👑 Ara ets el HOST de la sala!');
      setTimeout(() => setSystemMessage(null), 5000);
    }
    isHostRef.current = isHost;
  }, [isHost, room?.gameState]);

  // ── LÒGICA D'ABANDONAR (UNIFICADA) ──
  const handleLeave = useCallback(async () => {
    if (!room) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const playerIds = Object.keys(room.players);

    if (playerIds.length <= 1) {
      // Únic jugador: eliminem la sala
      await set(roomRef, null);
      window.location.href = '/';
      return;
    }

    const remainingPlayers = playerIds
      .filter(id => id !== playerId)
      .map(id => ({ id, joinedAt: (room.players[id] as any).joinedAt || 0 }))
      .sort((a, b) => a.joinedAt - b.joinedAt);

    const updates: any = {};
    updates[`players/${playerId}`] = null;
    updates[`totalScores/${playerId}`] = null; // Netegem també puntuació

    // Si som el host, migrem al següent
    if (isHost && remainingPlayers.length > 0) {
      updates.hostId = remainingPlayers[0].id;
    }

    // Notifiquem als altres
    updates.lastEvent = {
      type: 'leave',
      playerName: room.players[playerId]?.name || 'Un jugador',
      timestamp: Date.now()
    };

    await update(roomRef, updates);
    window.location.href = '/';
  }, [room, roomId, playerId, isHost]);

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
      // Només calculem el temps si NO estem en mode infinit i tenim una data límit
      if (room.timeMode !== 'infinit' && room.roundEndsAt) {
        const remaining = Math.max(0, room.roundEndsAt - Date.now());
        const secondsLeft = Math.ceil(remaining / 1000);
        setTimeLeft(secondsLeft);

        // 👈 AFEGIT: Si queden exactament 10 segons, disparem el so
        if (secondsLeft === 10 && tickTockRef.current && tickTockRef.current.paused) {
          tickTockRef.current.play().catch(e => console.log('Error àudio', e));
          if (alertaRef.current) {
            alertaRef.current.play().catch(e => console.log('Error alerta', e));
          }
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 2000); // 👈 CANVIAT A 2 SEGONS
        }

        if (remaining === 0) isTimeUp = true;
      } else {
        setTimeLeft(null); // Mode infinit: amaguem el rellotge
      }

      // Si s'acaba el temps O tothom ha endevinat
      if (isTimeUp || allGuessed) {
        clearInterval(interval);
        transitionedRef.current = true;

        // Ho posem dins d'una funció asyncrona per poder esperar
        const wrapUpRound = async () => {
          // 1. Tancar el mapa i enviar el pin auto-guardat si s'ha esgotat el temps
          if (isTimeUp && !hasGuessed) {
            if (tempPinRef.current) {
              await submitGuess(tempPinRef.current.lat, tempPinRef.current.lng); // Esperem que s'enviï siusplau
            } else {
              setShowGuessMap(false);
              setHasGuessed(true);
            }
          }

          // 2. NOMÉS el Host calcula i suma els punts
          if (room.hostId === playerId) {
            // Donem 1.5 segons de marge de gràcia perquè els pins automàtics arribin a la base de dades
            setTimeout(async () => {
              // Llegim les dades més FRESCAS de Firebase
              const snap = await get(ref(db, `rooms/${roomId}/rounds/${room.currentRound}/guesses`));
              const finalGuesses = snap.val() || {};

              const updates: Record<string, any> = { gameState: 'roundResults' };

              playerIds.forEach(id => {
                const g = finalGuesses[id];
                let roundScore = g?.score || 0;
                if (g?.usedHint) roundScore = Math.min(2500, Math.round(roundScore / 2)); // 👈 NOU: Penalització

                const currentTotal = room.totalScores?.[id] || 0;
                updates[`totalScores/${id}`] = currentTotal + roundScore;
              });

              update(ref(db, `rooms/${roomId}`), updates);
            }, 1500); // 1.5 segons d'espera abans de calcular
          }
        };

        wrapUpRound();
      }
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, roomId, playerId, isSinglePlayer, hasGuessed]);

  const addMoreLocations = useCallback(async (count = 5) => {
    if (!mapsReady || !room) return;
    const service = new (google.maps as any).StreetViewService();
    const newLocations: any[] = [];
    let attempts = 0;

    while (newLocations.length < count && attempts < 150) {
      attempts++;
      let coords;
      if (room.gameMode === 'catalunya') coords = randomCatalunyaCoords();
      else if (room.gameMode === 'estadis') coords = ESTADIS_FUTBOL[Math.floor(Math.random() * ESTADIS_FUTBOL.length)];
      else if (room.gameMode === 'cultural') coords = MONUMENTS_CULTURALS[Math.floor(Math.random() * MONUMENTS_CULTURALS.length)];
      else coords = randomBiasedCoords();

      await new Promise<void>((resolve) => {
        service.getPanorama(
          {
            location: coords,
            radius: room.gameMode === 'catalunya' ? 1000 : (room.gameMode === 'estadis' ? 250 : (room.gameMode === 'cultural' ? 150 : 50000)),
            source: (google.maps as any).StreetViewSource?.OUTDOOR ?? 'outdoor',
            preference: (google.maps as any).StreetViewPreference?.NEAREST ?? 'nearest',
          },
          (data: any, status: any) => {
            if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
              newLocations.push({
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

    const currentLocations = room.locations || [];
    const updatedLocations = [...currentLocations, ...newLocations];

    if (room.gameState === 'lobby' || room.gameState === 'generating') {
      const initialScores = Object.fromEntries(Object.keys(room.players).map((id) => [id, 0]));
      const tSettings = getTimeSettings(room.timeMode);
      await update(ref(db, `rooms/${roomId}`), {
        locations: updatedLocations,
        gameState: 'playing',
        currentRound: 0,
        totalScores: initialScores,
        rounds: null,
        songState: null,
        roundEndsAt: tSettings.total ? Date.now() + tSettings.total : null,
      });
    } else {
      await update(ref(db, `rooms/${roomId}`), { locations: updatedLocations });
    }
  }, [mapsReady, roomId, room]);

  const generateLocations = () => addMoreLocations(5);

  useEffect(() => {
    if (!room || !mapsReady || !isHost) return;
    if (!isSinglePlayer) return;
    if (room.gameState !== 'lobby') return;
    generateLocations();
  }, [room?.gameState, mapsReady, isSinglePlayer, isHost]);

  // ── ENVIAR LA JUGADA (Sense sumar punts i activant el pànic) ────────────
  const getLocationName = async (lat: number, lng: number, gameMode: string): Promise<string> => {
    return new Promise((resolve) => {
      const geocoder = new (google.maps as any).Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results && results.length > 0) {

          // Filtre anti-codis: busquem el primer resultat que NO sigui un codi estrany (Plus Code)
          const validResult = results.find((r: any) => !r.formatted_address.includes('+')) || results[0];
          const components = validResult.address_components;

          if (gameMode === 'catalunya') {
            let comarca = '';
            let locality = '';
            for (const comp of components) {
              if (comp.types.includes('administrative_area_level_3')) comarca = comp.long_name;
              if (comp.types.includes('locality')) locality = comp.long_name;
            }
            if (comarca && locality) resolve(`${locality} (${comarca})`);
            else if (comarca) resolve(`la comarca de ${comarca}`);
            else if (locality) resolve(locality);
            else resolve("un indret remot de Catalunya");
          } else {
            // Mode Món: Busquem el país a tots els components de geolocalització
            const countryComp = components.find((c: any) => c.types.includes('country'));
            if (countryComp) {
              resolve(countryComp.long_name);
              return;
            }

            // Si no el troba directament, mirem si l'adreça formatada té el país al final
            const addressParts = validResult.formatted_address.split(',');
            const lastPart = addressParts[addressParts.length - 1].trim();
            // Evitem codis postals o plus codes
            if (lastPart && !lastPart.includes('+') && isNaN(parseInt(lastPart))) {
              resolve(lastPart);
            } else {
              resolve("un indret perdut del món");
            }
          }
        } else {
          resolve("un indret completament aïllat");
        }
      });
    });
  };

  const fetchHint = async () => {
    if (!room?.locations || hasUsedHint || hintLoading) return;

    const roundData = room.rounds?.[room.currentRound];
    if (roundData?.sharedHint) {
      setCurrentHint(roundData.sharedHint.isFree ? roundData.sharedHint.value : `${roundData.sharedHint.type}: ${roundData.sharedHint.value}`);
      setHasUsedHint(true);
      return;
    }

    setHintLoading(true);
    const actual = room.locations[room.currentRound];

    try {
      // 1. Obtenim el codi de país de forma nativa amb Google Maps (No falla mai per bloquejos)
      const getCountryCode = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const geocoder = new (google.maps as any).Geocoder();
          geocoder.geocode({ location: { lat: actual.lat, lng: actual.lng } }, (results: any, status: any) => {
            if (status === 'OK' && results?.[0]) {
              const c = results[0].address_components.find((comp: any) => comp.types.includes('country'));
              resolve(c?.short_name || null);
            } else {
              resolve(null);
            }
          });
        });
      };

      const code = await getCountryCode();
      let countryData = null;

      // 2. Busquem a la base de dades RestCountries
      if (code) {
        const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
        if (res.ok) {
          const data = await res.json();
          countryData = Array.isArray(data) ? data[0] : data;
        }
      }

      // 3. PISTES PRINCIPALS (Només si tenim país)
      if (countryData && !countryData.status) {
        const currencyKey = countryData.currencies ? Object.keys(countryData.currencies)[0] : null;
        const currency = currencyKey ? countryData.currencies[currencyKey] : null;

        const options = [
          { type: 'Bandera', value: countryData.flag, imageUrl: countryData.flags?.png },
          { type: 'Continent', value: countryData.continents?.[0] || 'Desconegut' },
          { type: 'Idioma Principal', value: countryData.languages ? Object.values(countryData.languages)[0] as string : 'Desconegut' },
          { type: 'Població', value: `${(countryData.population / 1000000).toFixed(1)} Milions d'habitants` },
          { type: 'Moneda Oficial', value: currency ? `${currency.name} (${currency.symbol})` : 'Desconeguda' },
          { type: 'Fus Horari', value: countryData.timezones?.[0] || 'Desconegut' },
          { type: 'Codi Internet', value: countryData.tld?.[0] || '.com' },
          { type: 'Conducció', value: `Es condueix per la ${countryData.car?.side === 'left' ? 'esquerra ⬅️' : 'dreta ➡️'}` }
        ];

        const validOptions = options.filter(o => o.value && !o.value.includes('Desconegut') && !o.value.includes('Desconeguda'));

        if (validOptions.length > 0) {
          const hintToSave = validOptions[Math.floor(Math.random() * validOptions.length)];
          await update(ref(db, `rooms/${roomId}/rounds/${room.currentRound}`), { sharedHint: hintToSave });
          setCurrentHint(`${hintToSave.type}: ${hintToSave.value}`);
          setHasUsedHint(true);
          setHintLoading(false);
          return; // Sortim perquè tot ha funcionat perfectament
        }
      }

      // Si l'ordinador arriba aquí, és perquè estàs enmig de l'oceà o l'API ha fallat, forcem el Catch
      throw new Error("Sense dades de país");

    } catch (e) {
      console.error("Emergència de pistes activada:", e);
      // PISTES D'EMERGÈNCIA FÍSIQUES (Si falla, escull a l'atzar una d'aquestes tres)
      const fallbacks = [
        { type: 'Hemisferi', value: actual.lat > 0 ? 'Et trobes al Nord ⬆️' : 'Et trobes al Sud ⬇️' },
        { type: 'Latitud', value: `Estàs a ${Math.abs(Math.round(actual.lat))}° de l'Equador` },
        { type: 'Zona Climàtica', value: Math.abs(actual.lat) < 23.5 ? 'Intertropical ☀️' : (Math.abs(actual.lat) < 66.5 ? 'Temperada ⛅' : 'Polar ❄️') }
      ];
      const finalFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await update(ref(db, `rooms/${roomId}/rounds/${room.currentRound}`), { sharedHint: finalFallback });
      setCurrentHint(finalFallback.value);
      setHasUsedHint(true);
    } finally {
      setHintLoading(false);
    }
  };

  const submitGuess = useCallback(
    async (guessLat: number, guessLng: number) => {
      if (!room?.locations || hasGuessed || (room.players[playerId]?.isEliminated && isSpectating)) return;

      const actual = room.locations[room.currentRound];
      const distance = haversineDistance(guessLat, guessLng, actual.lat, actual.lng);
      // Li passem el gameMode perquè sàpiga quina escala aplicar (divisor 30 o 2000)
      const score = calculateScore(distance, room.gameMode);

      // 1. Guardem l'estimació BASE ràpidament per no bloquejar el joc
      const isFreeHint = room.rounds?.[room.currentRound]?.sharedHint?.isFree;
      const baseGuess: PlayerGuess = {
        lat: guessLat,
        lng: guessLng,
        distance,
        score,
        usedHint: hasUsedHint && !isFreeHint
      };

      const guessRef = ref(db, `rooms/${roomId}/rounds/${room.currentRound}/guesses/${playerId}`);
      await set(guessRef, baseGuess);

      // 2. En segon pla (sense bloquejar), calculem les ciutats i les afegim.
      // Així el joc pot continuar, però la IA tindrà les dades per a la cançó final.
      Promise.all([
        getLocationName(guessLat, guessLng, room.gameMode || 'world'),
        getLocationName(actual.lat, actual.lng, room.gameMode || 'world')
      ]).then(([guessCountry, actualCountry]) => {
        update(guessRef, { guessCountry, actualCountry }).catch(e => console.log('Error actualitzant zones', e));
      });

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
    [room, roomId, playerId, hasGuessed, isSinglePlayer, hasUsedHint]
  );

  const nextRound = useCallback(async () => {
    if (!room || !isHost) return;
    const next = room.currentRound + 1;

    // LÒGICA DE FINALITZACIÓ SEGONS MODE
    const isSpecialMode = room.gameType === '1vs1' || room.gameType === 'battle_royale';

    // Si és mode clàssic, acabem a la ronda 5
    if (!isSpecialMode && next >= 5) {
      await update(ref(db, `rooms/${roomId}`), { gameState: 'finished' });
      return;
    }

    // Si estem en mode especial però algú ja ha guanyat (marcat per RoundResults)
    if (isSpecialMode && room.gameState === 'finished') return;

    // Si ens quedem sense ubicacions, n'afegim més abans de passar de ronda
    if (room.locations && next >= room.locations.length) {
      await addMoreLocations(1); // Afegim una de nova
    }

    const tSettings = getTimeSettings(room.timeMode);
    await update(ref(db, `rooms/${roomId}`), {
      currentRound: next,
      gameState: 'playing',
      roundEndsAt: tSettings.total ? Date.now() + tSettings.total : null,
    });
  }, [room, isHost, roomId, addMoreLocations]);

  // ── GUARDAR ESTADÍSTIQUES AL FINAL DE LA PARTIDA ────────────────────────
  useEffect(() => {
    // Només ho fem si la partida ha acabat, si estem loguejats i si no ho hem guardat ja
    if (room?.gameState === 'finished' && user && !isGuest && !statsSavedRef.current) {
      statsSavedRef.current = true; // Tanquem el cadenat per evitar duplicats

      // 1. Agafem la nostra puntuació total
      const myTotalScore = room.totalScores?.[playerId] || 0;

      // Calculem guanyador i últim
      const playerEntries = Object.entries(room.players).map(([id, p]) => ({
        id,
        score: room.totalScores?.[id] ?? 0,
        isEliminated: p.isEliminated || false,
        eliminatedAtRound: p.eliminatedAtRound ?? -1
      }));

      const sortedForRank = [...playerEntries].sort((a, b) => {
        if (room.gameType === 'battle_royale') {
          if (!a.isEliminated && b.isEliminated) return -1;
          if (a.isEliminated && !b.isEliminated) return 1;
          if (a.isEliminated && b.isEliminated) {
            if (b.eliminatedAtRound !== a.eliminatedAtRound) return b.eliminatedAtRound - a.eliminatedAtRound;
          }
        }
        return b.score - a.score;
      });

      const isWinner = sortedForRank[0]?.id === playerId && myTotalScore > 0;
      const isLast = sortedForRank[sortedForRank.length - 1]?.id === playerId;

      // 2. Recopilem dades de les rondes
      const myRoundScores = [0, 1, 2, 3, 4].map(roundIdx =>
        room.rounds?.[roundIdx]?.guesses?.[playerId]?.score || 0
      );
      const myRoundHints = [0, 1, 2, 3, 4].map(roundIdx =>
        !!room.rounds?.[roundIdx]?.guesses?.[playerId]?.usedHint
      );

      // 3. Enviem les dades al nostre perfil (afegim el nombre total de jugadors per a la insígnia Rocha)
      updateUserStatsAfterGame(
        user.uid,
        room.gameMode || 'world',
        room.timeMode || 'bala',
        myTotalScore,
        myRoundScores,
        isWinner,
        room.gameType || 'classic',
        myRoundHints,
        Object.keys(room.players).length,
        isLast
      )
        .then((newBadges) => {
          console.log('Estadístiques guardades amb èxit!');
          if (newBadges && newBadges.length > 0) {
            newBadges.forEach((b, i) => {
              setTimeout(() => {
                setBadgeToast(b);
                setTimeout(() => setBadgeToast(null), 5000);
              }, i * 6000);
            });
          }
        })
        .catch(e => console.error('Error guardant estadístiques:', e));
    }
  }, [room?.gameState, room?.totalScores, room?.rounds, room?.gameMode, user, isGuest, playerId]);

  let content;

  if (loading) {
    content = (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Carregant sala...</div>
      </div>
    );
  } else if (error || !room) {
    content = (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-2xl">{error || 'Sala no trobada'}</div>
        <a href="/" className="text-green-400 underline">Tornar a l&apos;inici</a>
      </div>
    );
  } else if (isSinglePlayer && (room.gameState === 'lobby' || room.gameState === 'generating')) {
    content = (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl animate-spin-slow">🌍</div>
        <div className="text-white text-xl animate-pulse font-bold">
          {room.gameMode === 'catalunya' ? 'Preparant Catalunya...' : 'Buscant ubicacions...'}
        </div>
        <div className="text-gray-400 text-sm">Això pot trigar uns segons</div>
      </div>
    );
  } else if (!isSinglePlayer && (room.gameState === 'lobby' || room.gameState === 'generating')) {
    content = (
      <LobbyScreen
        room={room}
        roomId={roomId}
        playerId={playerId}
        isHost={isHost}
        onStart={generateLocations}
        onLeave={handleLeave} // 👈 Passem el nou handler
        isGenerating={room.gameState === 'generating'}
        mapsReady={mapsReady}
      />
    );
  } else if (room.gameState === 'finished') {
    content = (
      <FinalResults
        roomId={roomId}
        room={room}
        playerId={playerId}
        onRestart={generateLocations}
        onLeave={handleLeave}
        isHost={isHost}
      />
    );
  } else if (room.gameState === 'roundResults') {
    content = (
      <RoundResults
        room={room}
        roomId={roomId}
        round={room.currentRound}
        isHost={isHost}
        playerId={playerId}
        onNext={nextRound}
        onLeave={handleLeave}
        mapsReady={mapsReady}
        initialHealth={prevHealth}
      />
    );
  } else {
    const allPlayerIds = Object.keys(room.players);
    const isEliminated = !!room.players[playerId]?.isEliminated;

    content = (
      <div className={`relative w-full h-[100dvh] overflow-hidden bg-black transition-all duration-700 ${isEliminated && isSpectating ? 'grayscale sepia-[0.2]' : ''}`}>
        {/* ROUND INTRO OVERLAY */}
        {showRoundIntro && room.gameState === 'playing' && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
            <div className="text-center bg-black/60 backdrop-blur-xl p-16 rounded-[4rem] border border-white/20 shadow-2xl scale-110">
              <p className="text-yellow-500 font-black uppercase tracking-[0.5em] text-sm mb-4">Iniciant Ronda</p>
              <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white mb-6">Ronda {room.currentRound + 1}</h2>
              {room.gameType === '1vs1' && (
                <div className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-2xl animate-pulse">
                  MAL x{(1 + (room.currentRound * 0.5)).toFixed(1)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ELIMINATION OVERLAY */}
        {isEliminated && !isSpectating && (
          <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-1000">
            <div className="text-center max-w-md">
              <div className="text-8xl mb-8 animate-bounce">💀</div>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white mb-4">HAS ESTAT ELIMINAT</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-12">
                {room.gameType === 'battle_royale'
                  ? `Has quedat a la posició ${Object.values(room.players).filter(p => !p.isEliminated).length + 1}`
                  : "Has perdut tota la teva vida"}
              </p>

              <div className="space-y-4">
                <GoldButton onClick={() => setIsSpectating(true)} className="w-full py-6 rounded-2xl text-lg">
                  QUEDAR-SE COM A ESPECTADOR
                </GoldButton>
                <button
                  onClick={handleLeave}
                  className="w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all"
                >
                  ABANDONAR LA PARTIDA
                </button>
              </div>
            </div>
          </div>
        )}
        {mapsReady && room.locations?.[room.currentRound] && (
          <StreetViewPane
            key={`sv-${room.currentRound}`}
            location={room.locations[room.currentRound]}
            gameMode={room.gameMode}
          />
        )}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <div className="bg-black/70 backdrop-blur-md text-white px-5 py-2 rounded-full font-bold text-sm shadow-xl border border-white/10">
            Ronda {room.currentRound + 1} / 5
          </div>
          {room.gameMode === 'catalunya' && (
            <div className="bg-red-600/20 border border-red-500/40 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              🚩 Catalunya
            </div>
          )}
          {room.timeMode !== 'infinit' && room.roundEndsAt && (
            <div className="flex flex-col items-center">
              <div className={`px-5 py-2 rounded-2xl font-black text-xl transition-all duration-300 border-2 ${(timeLeft ?? 100) <= 15
                ? 'bg-red-600 text-white animate-pulse scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)]'
                : 'bg-black/80 text-white backdrop-blur-md border border-white/20'
                }`}>
                ⏱️ {timeLeft}s
              </div>
              {(timeLeft ?? 100) <= 15 && !hasGuessed && !isSinglePlayer && (
                <div className="mt-3 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full animate-bounce shadow-lg">
                  ⚠️ L'altre jugador ha tirat!
                </div>
              )}
            </div>
          )}
        </div>

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
                <div className="flex flex-col items-end">
                  {room.gameType === '1vs1' ? (
                    <>
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full transition-all duration-1000 ${player.health! > 5000 ? 'bg-emerald-500' : player.health! > 2000 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${(player.health! / 10000) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">{player.health} HP</span>
                    </>
                  ) : (
                    <span className="text-yellow-400 font-bold">
                      {(room.totalScores?.[id] ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {room.hintsEnabled && !hasGuessed && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
            {!hasUsedHint ? (
              <button
                onClick={fetchHint}
                disabled={hintLoading}
                className="bg-indigo-600/80 backdrop-blur-md hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-400/30 shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                {hintLoading ? '⏳ Buscant...' : '💡 Demanar Pista (Costa 50%)'}
              </button>
            ) : (
              <div className="bg-yellow-500 text-black px-6 py-4 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.7)] animate-magic-reveal border-4 border-black flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">✨ Pista Revelada</span>
                <div className="flex items-center gap-3">
                  {room.rounds?.[room.currentRound]?.sharedHint?.imageUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={room.rounds?.[room.currentRound]?.sharedHint?.imageUrl}
                        alt="Flag"
                        className="h-20 w-auto rounded-lg shadow-lg border-2 border-black"
                      />
                      <span className="font-black uppercase text-xs">{room.rounds?.[room.currentRound]?.sharedHint?.type}</span>
                    </div>
                  ) : (
                    <span className="font-black uppercase tracking-tight text-lg">
                      {currentHint || `${room.rounds?.[room.currentRound]?.sharedHint?.type || ''}: ${room.rounds?.[room.currentRound]?.sharedHint?.value || ''}`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
            onPinChange={(lat, lng) => { tempPinRef.current = { lat, lng }; }}
            onClose={() => setShowGuessMap(false)}
            gameMode={room.gameMode}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {content}

      {showAlert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyItems: 'center',
          pointerEvents: 'none', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            position: 'absolute', top: '150px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)', backdropFilter: 'blur(5px)', border: '2px solid #fca5a5',
            borderRadius: '20px', padding: '15px 30px', textAlign: 'center', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.8)',
            animation: 'pulse 0.5s infinite', display: 'flex', alignItems: 'center', gap: '15px'
          }}>
            <div style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>⚠️</div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: 0, textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
              10 SEGONS!
            </h2>
          </div>
        </div>
      )}

      {badgeToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-[320px] bg-gradient-to-r from-indigo-900 to-indigo-800 border-2 border-yellow-400/50 rounded-2xl p-5 shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center gap-4 animate-in slide-in-from-top-full duration-700">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center text-3xl shadow-lg animate-bounce">🏅</div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1">Nova Insígnia!</p>
            <p className="text-white text-lg font-black leading-tight uppercase tracking-tighter italic">
              {badgeToast}
            </p>
            <p className="text-indigo-200 text-[9px] font-bold mt-1">Enhorabona, explorador!</p>
          </div>
        </div>
      )}

      {/* ── TOAST DE SISTEMA (ABANDONAMENTS) ── */}
      {systemMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-[350px] bg-red-950/90 border border-red-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in slide-in-from-top-10 duration-500">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">🏃</div>
          <div className="flex-1">
            <p className="text-white text-sm font-black italic uppercase tracking-tighter">
              {systemMessage}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
