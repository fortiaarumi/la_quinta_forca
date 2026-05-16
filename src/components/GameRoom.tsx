/// <reference types="@types/google.maps" />
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onValue, update, set, runTransaction, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Room, PlayerGuess } from '@/lib/types';
import { haversineDistance, calculateScore, randomBiasedCoords, randomCatalunyaCoords, randomPixapinsCoords, getBalancedLocation, CAMP_NOU_COORDS, ESTADIS_FUTBOL, MONUMENTS_CULTURALS } from '@/lib/gameUtils';
import { loadGoogleMaps } from '@/lib/mapsLoader';
import StreetViewPane from './StreetViewPane';
import GuessMap from './GuessMap';
import RoundResults from './RoundResults';
import FinalResults from './FinalResults';
import LobbyScreen from './LobbyScreen';
import GoldButton from './GoldButton';
import PWAInstallPrompt from './PWAInstallPrompt';
import Head from 'next/head'; // 👈 AFEGIT
import { useAuth } from '@/lib/authContext';
import { updateUserStatsAfterGame, GameResult } from '@/lib/userStats';
import { useAudio } from '@/lib/AudioContext'; // 👈 AFEGIT: Importem el cervell musical
import { ALL_BADGES } from '@/lib/badges';

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
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(false); // 👈 NOU: Per garantir que tots tenen les coordenades
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showGuessMap, setShowGuessMap] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false); // 👈 NOU
  const [currentHint, setCurrentHint] = useState<string | null>(null); // 👈 NOU
  const [hintLoading, setHintLoading] = useState(false); // 👈 NOU
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

  // REVELAR PISTA SI L'EQUIP LA COMPRA (BATALLA PER EQUIPS)
  useEffect(() => {
    if (!room || room.gameState !== 'playing' || !room.rounds) return;
    const currentRoundData = room.rounds[room.currentRound];
    if (!currentRoundData) return;

    const teamHints = currentRoundData.teamHints;
    const myTeamId = room.players?.[playerId]?.teamId;
    const sharedHint = currentRoundData.sharedHint;
    
    if (myTeamId && teamHints?.[myTeamId] && sharedHint && !hasUsedHint) {
      setCurrentHint(sharedHint.isFree ? sharedHint.value : `${sharedHint.type}: ${sharedHint.value}`);
      setHasUsedHint(true);
    }
  }, [room?.rounds, room?.currentRound, room?.gameState, playerId, hasUsedHint, room?.players]);
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
  const [levelUpToast, setLevelUpToast] = useState<number | null>(null);
  const [questToast, setQuestToast] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null); // 👈 NOU
  const lastEventRef = useRef<number>(0); // 👈 NOU: Per no repetir missatges
  const [showRoundIntro, setShowRoundIntro] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false); // 👈 NOU

  // ── AFEGIT: ÀUDIO I EFECTES DE SO ──
  const { playGameMusic, playMenuMusic, isMuted, toggleMute, nextTrack, prevTrack } = useAudio();
  const tickTockRef = useRef<HTMLAudioElement | null>(null);
  const alertaRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tickTockRef.current = new Audio('/sounds/tick-tock.mp3');
    alertaRef.current = new Audio('/sounds/alerta.mp3');
  }, []);

  const prevGameStateRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!room) return;
    const gs = room.gameState;
    if (gs === prevGameStateRef.current) return;
    prevGameStateRef.current = gs;
    if (gs === 'playing' || gs === 'roundResults') {
      playGameMusic();
    } else if (gs === 'finished') {
      // Esperar que els efectes de so (celebració/decepció) acabin abans de la música de menú
      setTimeout(() => playMenuMusic(), 4000);
    }
  }, [room?.gameState]);

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

        // ── NOU: Verificar si les coordenades de la ronda actual estan syncades ──
        if (data.gameState === 'playing' && data.locations && data.locations[data.currentRound]) {
          setSyncReady(true);
        } else {
          setSyncReady(false);
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
      router.push('/');
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
    router.push('/');
  }, [room, roomId, playerId, isHost, router]);

  const requestLeave = () => setShowLeaveModal(true);

  // ── INTERCEPTORS DE SORTIDA ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    // Empenyem un estat inicial per poder interceptar el "back"
    window.history.pushState({ noBack: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Quan l'usuari prem "enrere", el forcem a quedar-se i mostrem el modal
      window.history.pushState({ noBack: true }, '');
      setShowLeaveModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      if (room.gameMode === 'catalunya') coords = getBalancedLocation('catalunya');
      else if (room.gameMode === 'pixapins') coords = randomPixapinsCoords();
      else if (room.gameMode === 'estadis') coords = ESTADIS_FUTBOL[Math.floor(Math.random() * ESTADIS_FUTBOL.length)];
      else if (room.gameMode === 'cultural') coords = MONUMENTS_CULTURALS[Math.floor(Math.random() * MONUMENTS_CULTURALS.length)];
      else coords = getBalancedLocation('world');

      await new Promise<void>((resolve) => {
        service.getPanorama(
          {
            location: coords,
            radius: (room.gameMode === 'catalunya' || room.gameMode === 'pixapins') ? 1000 : (room.gameMode === 'estadis' ? 250 : (room.gameMode === 'cultural' ? 150 : 50000)),
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
        currentRound: 0,
        gameState: 'playing',
        totalScores: initialScores,
        rounds: null,
        songState: null,
        roundEndsAt: tSettings.total ? Date.now() + tSettings.total : null,
        syncKey: Date.now() // 👈 NOU: Clau de sincronització
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
          } else if (gameMode === 'pixapins') {
            // Per Pixapins (Barcelona) usem Nominatim per obtenir barri + districte + CP
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'User-Agent': 'LaQuintaForcaApp/1.0 (fortiaarumi@gmail.com)' }
            }).then(r => r.json()).then(geo => {
              const addr = geo?.address || {};
              const neighbourhood = addr.neighbourhood || addr.quarter || addr.suburb || '';
              const district = addr.city_district || addr.city || 'Barcelona';
              const postcode = addr.postcode || '';
              const parts: string[] = [];
              if (neighbourhood) parts.push(neighbourhood);
              if (district && district !== neighbourhood) parts.push(district);
              if (postcode) parts.push(`CP ${postcode}`);
              resolve(parts.length > 0 ? parts.join(', ') : 'un barri de Barcelona');
            }).catch(() => resolve('un barri de Barcelona'));
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
    const myTeamId = room.players?.[playerId]?.teamId;

    if (roundData?.sharedHint) {
      setCurrentHint(roundData.sharedHint.isFree ? roundData.sharedHint.value : `${roundData.sharedHint.type}: ${roundData.sharedHint.value}`);
      setHasUsedHint(true);
      // Actualitzem l'estat de l'equip també
      if (myTeamId) {
        await update(ref(db, `rooms/${roomId}/rounds/${room.currentRound}/teamHints`), { [myTeamId]: true });
      }
      return;
    }

    setHintLoading(true);
    const actual = room.locations[room.currentRound];

    // RADIOGRAFIA 1
    console.log("📍 1. Coordenades de la ronda:", actual.lat, actual.lng);

    try {
      const getGeocodingData = async (): Promise<any> => {
        try {
          // Utilitzem Nominatim (OpenStreetMap) perquè és gratis i no requereix API Key, així no falla mai
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${actual.lat}&lon=${actual.lng}&zoom=18&addressdetails=1`, {
            headers: {
              'User-Agent': 'LaQuintaForcaApp/1.0 (fortiaarumi@gmail.com)'
            }
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.error("Nominatim fetch error:", e);
        }
        return null;
      };

      const options: { type: string, value: string, imageUrl?: string, isFree?: boolean }[] = [];
      const geoData = await getGeocodingData();

      if (room.gameMode === 'catalunya') {
        if (geoData && geoData.address) {
          const comarca = geoData.address.county || '';
          const province = geoData.address.province || '';
          const locality = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.municipality || '';

          if (comarca) options.push({ type: 'Comarca', value: comarca });
          if (province) options.push({ type: 'Província', value: province });
          if (locality) options.push({ type: 'Poble/Ciutat', value: locality });
          
          if (geoData.address.postcode) {
            options.push({ type: 'Codi Postal', value: `El codi postal és ${geoData.address.postcode}` });
          }

          if (locality) {
            const fillsIlustres: Record<string, string> = {
              'sallent': 'Joan Garcia',
              'santpedor': 'Pep Guardiola',
              'figueres': 'Salvador Dalí',
              'reus': 'Antoni Gaudí i Andreu Buenafuente',
              'cadaqués': 'Salvador Dalí',
              'badalona': 'Mireia Belmonte i Auronplay',
              'mataró': 'Lamine Yamal i The Tyets',
              'terrassa': 'Xavi Hernández i Dani Olmo',
              'sabadell': 'Marc Gené i Sergio Dalma',
              'granollers': 'Aleix i Pol Espargaró',
              'sant cugat del vallès': 'Àlex Corretja',
              'cervera': 'Marc i Àlex Márquez',
              'puig-reig': 'Oriol Romeu',
              'ulldecona': 'Aleix Garcia',
              'hostalric': 'Tommy Robredo',
              'sant joan despí': 'Elena Fort',
              'barcelona': 'Joan Laporta i Serrat',
              'girona': 'Carles Puigdemont i Joan Roca',
              'amer': 'Carles Puigdemont',
              'la pobla de segur': 'Carles Puyol',
              'esplugues de llobregat': 'Carme Chacón i Mercedes Milá',
              'argentona': 'Juliana Canet',
              'vic': 'Pilarín Bayés',
              'manlleu': 'Gerard Autet',
              'olot': 'Pau Bosch',
              'artés': 'Laura Escanes',
              'bellcaire d\'empordà': 'Tito Vilanova',
              'sitges': 'Facu Díaz',
              'sant esteve sesrovires': 'Rosalía',
              'vilassar de mar': 'Bad Gyal i Mushkaa',
              'cornellà de llobregat': 'Estopa, Jordi Évole i Paula Gonu',
              'sant climent de llobregat': 'Aitana',
              'sant boi de llobregat': 'Pau i Marc Gasol',
              'el masnou': 'Ricky Rubio',
              'palafrugell': 'Josep Pla i Sílvia Pérez Cruz',
              'verges': 'Lluís Llach',
              'cardona': 'Berto Romero',
              'santa coloma de gramenet': 'Gabriel Rufián i Joel Díaz',
              'les masies de voltregà': 'Peyu',
              'sant feliu de buixalleu': 'Quim Masferrer',
              'tornabous': 'Lluís Companys',
              'vilanova i la geltrú': 'Francesc Macià i Gerard Romero',
              'roda de ter': 'Miquel Martí i Pol, i Oques Grasses',
              'sant joan de les abadesses': 'Txarango',
              'aiguafreda': 'Els Catarres',
              'valls': 'Figa Flawas',
              'sant pol de mar': 'Carme Ruscalleda',
              'l\'hospitalet de llobregat': 'Ferran Adrià, Morad i Antonio Orozco',
              'sant feliu de llobregat': 'Nil Moliner',
              'olesa de montserrat': 'Chanel',
              'lloret de mar': 'Nina',
              'bescanó': 'Pau Cubarsí',
              'linyola': 'Bojan Krkić',
              'matadepera': 'Riqui Puig',
              'badia del vallès': 'Sergio Busquets',
              'riudarenes': 'Gerard Deulofeu',
              'arenys de mar': 'Cesc Fàbregas',
              'piera': 'Toni Bou',
              'sant antoni de vilamajor': 'Àlex Palou',
              'folgueroles': 'Jacint Verdaguer i Nani Roma',
              'roses': 'Maverick Viñales',
              'sant fruitós de bages': 'Carlos Checa',
              'castellar del vallès': 'Dani Pedrosa',
              'seva': 'Àlex Crivillé',
              'blanes': 'Quim Torra i CdeCiencia',
              'sant vicenç dels horts': 'Oriol Junqueras',
              'la roca del vallès': 'Salvador Illa',
              'pineda de mar': 'Pere Aragonès',
              'mollet del vallès': 'Alèxia Putellas i Josep Maria Pou',
              'esparreguera': 'Lluís Llongueras',
              'tortosa': 'Karmele Marchante',
              'malgrat de mar': 'David Verdaguer',
              'manresa': 'Jordi Wild i Miki Esparbé',
              'montcada i reixac': 'Carlos Cuevas',
              'sant pere de vilamajor': 'Úrsula Corberó',
              'gavà': 'Candela Peña',
              'sant adrià de besòs': 'Isabel Coixet',
              'banyoles': 'Albert Serra',
              'les planes d\'hostoles': 'Carla Simón',
              'constantí': 'Els Pets',
              'el vendrell': 'Pau Casals i Lax\'n\'Busto',
              'berga': 'Brams (Titot)',
              'igualada': 'Jordi Savall',
              'centelles': 'Ildefons Cerdà',
              'santa coloma de farners': 'Salvador Espriu',
              'tiana': 'Josep Cuní',
              'montgat': 'Dulceida'
            };
            const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const person = fillsIlustres[locality.toLowerCase()] || fillsIlustres[normalize(locality)];
            if (person) {
              options.push({ type: 'Fill Il·lustre', value: `${person} és fill/a il·lustre d'aquí` });
            }
          }
        }

        const distBcn = haversineDistance(actual.lat, actual.lng, 41.3870, 2.1700);
        options.push({ type: 'Distància a Barcelona', value: `A ${(distBcn).toFixed(2)} km de Barcelona (Pl. Catalunya)` });



        const distAndorra = haversineDistance(actual.lat, actual.lng, 42.506, 1.521);
        const distFranca = Math.min(
          haversineDistance(actual.lat, actual.lng, 42.420, 2.873), haversineDistance(actual.lat, actual.lng, 42.432, 1.926)
        );
        const distArago = Math.min(
          haversineDistance(actual.lat, actual.lng, 41.521, 0.347), haversineDistance(actual.lat, actual.lng, 42.111, 0.481)
        );
        
        if (distAndorra < 25) options.push({ type: 'Frontera', value: 'Molt a prop de la frontera amb Andorra' });
        if (distFranca < 25) options.push({ type: 'Frontera', value: 'Molt a prop de la frontera amb França' });
        if (distArago < 25) options.push({ type: 'Frontera', value: 'Molt a prop de la frontera amb l\'Aragó' });

      } else if (room.gameMode === 'pixapins') {
        if (geoData && geoData.address) {
          const sublocality = geoData.address.neighbourhood || geoData.address.quarter || geoData.address.suburb || '';
          const locality = geoData.address.city_district || geoData.address.city || '';

          if (sublocality) options.push({ type: 'Barri / Zona', value: sublocality });
          if (locality && locality !== sublocality) options.push({ type: 'Districte', value: locality });
          
          if (sublocality) {
            options.push({ type: 'Inicial del Barri', value: `Comença per la lletra ${sublocality.charAt(0).toUpperCase()}` });
          }

          if (geoData.address.postcode) {
            options.push({ type: 'Codi Postal', value: `És el ${geoData.address.postcode}` });
          }
        }
        
        const distCampNou = haversineDistance(actual.lat, actual.lng, CAMP_NOU_COORDS.lat, CAMP_NOU_COORDS.lng);
        options.push({ type: 'Camp Nou', value: `A ${(distCampNou).toFixed(2)} km del Camp Nou` });

        const distPlacaCatalunya = haversineDistance(actual.lat, actual.lng, 41.3870, 2.1700);
        options.push({ type: 'Plaça Catalunya', value: `A ${(distPlacaCatalunya).toFixed(2)} km de distància` });

        const distMar = haversineDistance(actual.lat, actual.lng, 41.3784, 2.1925);
        options.push({ type: 'Mar', value: `A ${(distMar).toFixed(2)} km de la platja` });

        const zona = distMar > 3.5 ? 'Més aviat cap a la Zona Alta (muntanya)' : 'Més aviat cap a la Zona Baixa (mar)';
        options.push({ type: 'Altitud', value: zona });

      } else {
        const code = geoData?.address?.country_code ? geoData.address.country_code.toUpperCase() : null;
      let countryData = null;

      if (code) {
        try {
          console.log("📂 4. Intentant llegir l'arxiu /countries.json...");
          const res = await fetch('/countries.json');
          if (res.ok) {
            const allCountries = await res.json();
            // Cerca ajustada per trobar el país només pel codi cca2
            countryData = allCountries.find((c: any) => c.cca2 === code);
            console.log("🎯 5. S'han trobat dades d'aquest país al teu arxiu JSON?:", countryData ? "SÍ" : "NO");
          } else {
            console.error("🚨 Error greu: L'arxiu /countries.json no carrega. Codi HTTP:", res.status);
          }
        } catch (localErr) {
          console.error("🚨 Error greu: No es troba l'arxiu /countries.json. Està ben posat a la carpeta public?", localErr);
        }
      }



      if (countryData) {
        const currencyKey = countryData.currencies ? Object.keys(countryData.currencies)[0] : null;
        const currency = currencyKey ? countryData.currencies[currencyKey] : null;
        const giniValue = countryData.gini ? Object.values(countryData.gini)[0] : null;
        const phonePrefix = countryData.idd?.root ? `${countryData.idd.root}${countryData.idd.suffixes?.[0] || ''}` : null;

        options.push(
          { type: 'Continent', value: countryData.region || 'Desconegut' },
          { type: 'Idioma Principal', value: countryData.languages ? Object.values(countryData.languages)[0] as string : 'Desconegut' },
          { type: 'Població', value: countryData.population ? `${(countryData.population / 1000000).toFixed(1)} Milions d'habitants` : 'Desconeguda' },
          { type: 'Moneda', value: currency ? `${currency.name} (${currency.symbol})` : 'Desconeguda' },
          { type: 'Àrea Total', value: countryData.area ? `${countryData.area.toLocaleString('ca-ES')} km²` : 'Desconeguda' },
          { type: 'Fronteres', value: countryData.borders ? `Fa frontera terrestre amb ${countryData.borders.length} països` : 'No té fronteres terrestres (és una illa 🏝️)' },
          { type: 'Índex Gini', value: giniValue ? `${giniValue} (Desigualtat de riquesa)` : 'Desconegut' },
          { type: 'Prefix Telefònic', value: phonePrefix ? `El prefix per trucar-hi és el ${phonePrefix} 📞` : 'Desconegut' }
        );

        if (countryData.flags?.png || countryData.flags?.svg) {
          options.push({ type: 'Bandera', value: 'Bandera', imageUrl: countryData.flags.png || countryData.flags.svg });
        }
        console.log("✨ 6. Pistes generades amb èxit des de la teva base de dades!");
      }
      }

      if (room.gameMode !== 'catalunya' && room.gameMode !== 'pixapins') {
        options.push(
          { type: 'Hemisferi', value: actual.lat > 0 ? 'Et trobes al Nord ⬆️' : 'Et trobes al Sud ⬇️' },
          { type: 'Latitud', value: `Estàs a ${Math.abs(Math.round(actual.lat))}° de l'Equador` },
          { type: 'Zona Climàtica', value: Math.abs(actual.lat) < 23.5 ? 'Intertropical ☀️' : (Math.abs(actual.lat) < 66.5 ? 'Temperada ⛅' : 'Polar ❄️') }
        );
      }

      const validOptions = options.filter(o => o.value && !o.value.includes('Desconegut') && !o.value.includes('Desconeguda'));

      if (validOptions.length > 0) {
        const hintToSave = validOptions[Math.floor(Math.random() * validOptions.length)];
        const updates: any = { sharedHint: hintToSave };
        if (myTeamId) updates[`teamHints/${myTeamId}`] = true;
        
        await update(ref(db, `rooms/${roomId}/rounds/${room.currentRound}`), updates);
        setCurrentHint(`${hintToSave.type}: ${hintToSave.value}`);
        setHasUsedHint(true);
        return;
      }

      throw new Error("No s'han pogut generar pistes");

    } catch (e) {
      console.log("⚠️ 7. El codi ha saltat al Catch (Emergència) per aquest error:", e);
      const finalFallback = { type: 'Hemisferi', value: actual.lat > 0 ? "Hemisferi Nord ⬆️" : "Hemisferi Sud ⬇️", isFree: true };
      const updates: any = { sharedHint: finalFallback };
      if (myTeamId) updates[`teamHints/${myTeamId}`] = true;

      await update(ref(db, `rooms/${roomId}/rounds/${room.currentRound}`), updates);
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
      
      const myTeamId = room.players[playerId]?.teamId;
      const teamHints = room.rounds?.[room.currentRound]?.teamHints || {};
      const teamUsedHint = myTeamId && teamHints[myTeamId];

      // Li passem el gameMode perquè sàpiga quina escala aplicar (divisor 30 o 2000)
      let score = calculateScore(distance, room.gameMode);
      
      // SI L'EQUIP HA USAT PISTA, PUNTUACIÓ A LA MEITAT
      if (teamUsedHint) {
        score = Math.floor(score / 2);
      }

      // 1. Guardem l'estimació BASE ràpidament per no bloquejar el joc
      const isFreeHint = room.rounds?.[room.currentRound]?.sharedHint?.isFree;
      const baseGuess: PlayerGuess = {
        lat: guessLat,
        lng: guessLng,
        distance,
        score,
        usedHint: !!(hasUsedHint && !isFreeHint || teamUsedHint)
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
      syncKey: Date.now() // 👈 NOU
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

      // 2. Recopilem dades de les rondes (Dinàmic per a Duels i BR)
      const roundsKeys = room.rounds ? Object.keys(room.rounds).map(Number).sort((a, b) => a - b) : [];
      const myRoundScores = roundsKeys.map(roundIdx =>
        room.rounds?.[roundIdx]?.guesses?.[playerId]?.score || 0
      );
      const myRoundHints = roundsKeys.map(roundIdx =>
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
        .then((result: GameResult) => {
          console.log('Estadístiques guardades amb èxit!');
          
          // Toasts de Insígnies
          if (result.badges && result.badges.length > 0) {
            result.badges.forEach((b, i) => {
              setTimeout(() => {
                setBadgeToast(b);
                setTimeout(() => setBadgeToast(null), 3000); // 👈 3s
              }, i * 4000);
            });
          }

          // Guardar animacions pendents al sessionStorage per a quan tornem al menú
          const pending: any = {};
          if (result.leveledUp) {
            pending.levelUp = result.newLevel;
          }
          if (result.completedQuests && result.completedQuests.length > 0) {
            pending.completedQuests = result.completedQuests;
          }
          if (result.badges && result.badges.length > 0) {
            pending.badges = result.badges; // 👈 NOU
          }
          if (Object.keys(pending).length > 0) {
            sessionStorage.setItem('pendingAnimations', JSON.stringify(pending));
          }

          // Mostrar level-up i quests immediatament també dins la partida
          if (result.leveledUp) {
            setTimeout(() => {
              setLevelUpToast(result.newLevel);
              setTimeout(() => setLevelUpToast(null), 3000); // 👈 3s
            }, 1000);
          }
          if (result.completedQuests && result.completedQuests.length > 0) {
            result.completedQuests.forEach((qDesc, i) => {
              setTimeout(() => {
                setQuestToast(qDesc);
                setTimeout(() => setQuestToast(null), 4000); // 👈 4s
              }, (result.leveledUp || (result.badges?.length) ? 8000 : 1000) + i * 5000);
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
          {room.gameMode === 'catalunya' ? 'Preparant Catalunya...' : (room.gameMode === 'pixapins' ? 'Buscant per Barcelona...' : 'Buscant ubicacions...')}
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
        onLeave={requestLeave}
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
        onLeave={requestLeave}
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
        onLeave={requestLeave}
        mapsReady={mapsReady}
        initialHealth={prevHealth}
      />
    );
  } else {
    const allPlayerIds = Object.keys(room.players);
    const isEliminated = !!room.players[playerId]?.isEliminated;

    content = (
      <div className="min-h-screen bg-[#06080f] relative">
      <link rel="preload" href="/siu.mp4" as="video" />
      <div className={`relative w-full h-[100dvh] overflow-hidden bg-black transition-all duration-700 ${isEliminated && isSpectating ? 'grayscale sepia-[0.2]' : ''}`}>
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
                  onClick={requestLeave}
                  className="w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all"
                >
                  ABANDONAR LA PARTIDA
                </button>
              </div>
            </div>
          </div>
        )}
        {room.gameState === 'playing' && (
        <div className="h-screen flex flex-col relative">
          {!syncReady ? (
            <div className="absolute inset-0 z-[10000] bg-[#06080f] flex items-center justify-center">
              <div className="text-center animate-pulse">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] italic">Sincronitzant coordenades...</p>
                <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase">Esperant autoritat del servidor</p>
              </div>
            </div>
          ) : (
            <>
              <StreetViewPane
                location={room.locations![room.currentRound]}
                onReady={() => setMapsReady(true)}
              />
            </>
          )}
        </div>
        )}

        <div className="absolute top-12 md:top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <div className="bg-black/70 backdrop-blur-md text-white px-5 py-2 rounded-full font-bold text-sm shadow-xl border border-white/10">
            {room.gameType === '1vs1'
              ? `Ronda ${room.currentRound + 1}`
              : room.gameType === 'battle_royale'
              ? `Ronda ${room.currentRound + 1} (${Object.keys(room.players).length} jugadors)`
              : `Ronda ${room.currentRound + 1} / 5`}
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

        <div className="absolute top-12 md:top-4 left-4 z-10 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 shadow-xl min-w-[160px]">
          {allPlayerIds.map((id, i) => {
            const player = room.players[id];
            const isMe = id === playerId;
            return (
              <div
                key={id}
                className={`flex items-center justify-between gap-3 text-sm ${i > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}`}
              >
                <div className="flex flex-col">
                  <span className={isMe ? 'text-green-400 font-bold' : 'text-gray-300'}>
                    {isMe ? '★ ' : ''}{player.name}
                  </span>
                  {((player.selectedBadges?.length ? player.selectedBadges : player.badges) || []).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {((player.selectedBadges?.length ? player.selectedBadges : player.badges) || []).slice(0, 3).map((bId: string, bi: number) => {
                        const badgeDef = ALL_BADGES.find(b => b.id === bId);
                        return (
                          <div key={bi} className="relative group cursor-pointer">
                            <img src={badgeDef?.image || '/badges/default.png'} alt={bId} className="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-black/90 border border-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                              {bId}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
          <div className="absolute top-12 md:top-4 right-4 z-10 flex flex-col gap-2 items-end">
            {!hasUsedHint ? (
              <button
                onClick={fetchHint}
                disabled={hintLoading}
                className="bg-indigo-600/80 backdrop-blur-md hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-400/30 shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                {hintLoading ? '⏳ Buscant...' : '💡 Demanar Pista (Costa 50%)'}
              </button>
            ) : (
              <div className="bg-yellow-500 text-black px-6 py-4 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.7)] animate-magic-reveal border-4 border-black flex flex-col items-center gap-2 max-w-[90vw] md:max-w-md text-center">
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
                    <span className="font-black uppercase tracking-tight text-sm md:text-lg whitespace-normal break-words">
                      {currentHint || `${room.rounds?.[room.currentRound]?.sharedHint?.type || ''}: ${room.rounds?.[room.currentRound]?.sharedHint?.value || ''}`}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-lg">
              <button onClick={prevTrack} title="Pista anterior" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏮</button>
              <button onClick={toggleMute} title={isMuted ? 'Activar so' : 'Silenciar'} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-xs border border-white/5 cursor-pointer">{isMuted ? '🔇' : '🔊'}</button>
              <button onClick={nextTrack} title="Pista següent" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏭</button>
            </div>
          </div>
        )}

        {(!room.hintsEnabled || hasGuessed) && (
          <div className="absolute top-4 right-4 z-[11] flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-lg">
            <button onClick={prevTrack} title="Pista anterior" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏮</button>
            <button onClick={toggleMute} title={isMuted ? 'Activar so' : 'Silenciar'} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-xs border border-white/5 cursor-pointer">{isMuted ? '🔇' : '🔊'}</button>
            <button onClick={nextTrack} title="Pista següent" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏭</button>
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
      </div>
    );
  }

  return (
    <main>
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

      {/* ── TOAST LEVEL UP ── */}
      {levelUpToast !== null && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-[3rem] px-12 py-8 shadow-[0_0_80px_rgba(234,179,8,0.8)] border-4 border-yellow-300/50 flex flex-col items-center gap-3">
                <p className="text-black/60 text-[11px] font-black uppercase tracking-[0.4em]">Felicitats!</p>
                <div className="text-7xl animate-bounce">⬆️</div>
                <p className="text-black text-4xl font-black italic uppercase tracking-tighter">Nivell {levelUpToast}!</p>
                <p className="text-black/70 text-[11px] font-black uppercase tracking-widest">Has pujat de nivell</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST QUEST COMPLETADA ── */}
      {questToast !== null && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10001] w-full max-w-[360px] animate-in slide-in-from-bottom duration-500">
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-2 border-emerald-400/50 rounded-2xl p-5 shadow-[0_20px_50px_rgba(16,185,129,0.5)] flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border-2 border-emerald-400/50 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">✅</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Objectiu Completat!</p>
              <p className="text-white text-sm font-black leading-tight">{questToast}</p>
              <p className="text-emerald-300/60 text-[9px] font-bold mt-1 uppercase tracking-widest">XP guanyada!</p>
            </div>
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
      <PWAInstallPrompt />

      {/* MODAL DE CONFIRMACIÓ PER ABANDONAR */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0c0f1a] border border-red-500/30 p-12 rounded-[3rem] max-w-md w-full text-center shadow-2xl shadow-red-500/10 animate-slide-up">
            <div className="text-6xl mb-6 animate-bounce">🏃💨</div>
            <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter text-white">Segur que vols abandonar?</h2>
            <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest leading-relaxed">
              Si abandones ara, perdràs tot el teu progrés i els teus punts d&apos;aquesta partida.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleLeave}
                className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                🏃 Sí, Abandonar
              </button>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
              >
                ❌ Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
