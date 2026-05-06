'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, PlayerGuess } from '@/lib/types';
import { useAudio } from '@/lib/AudioContext';
import GoldButton from '@/components/GoldButton';
import { ref, update, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import confetti from 'canvas-confetti';

interface Props {
  room: Room;
  roomId: string;
  round: number;
  isHost: boolean;
  playerId: string;
  onNext: () => void;
  onLeave: () => void;
  mapsReady: boolean;
  initialHealth: Record<string, number>;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

export default function RoundResults({ room, roomId, round, isHost, playerId, onNext, onLeave, mapsReady, initialHealth }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const actual = room.locations?.[round];
  const guesses = room.rounds?.[round]?.guesses ?? {};
  const playerIds = Object.keys(room.players);

  if (!actual) return null;

  const [perfectScorers, setPerfectScorers] = useState<string[]>([]);
  const [hasClosedPopup, setHasClosedPopup] = useState(false);
  const [hasCongratulated, setHasCongratulated] = useState(false);
  const [congratulatedBy, setCongratulatedBy] = useState<string | null>(null);

  const [eliminatedPlayer, setEliminatedPlayer] = useState<string | null>(null);
  const [hasLaughed, setHasLaughed] = useState(false);
  const [laughedBy, setLaughedBy] = useState<string | null>(null);

  const { playSiu, playRiure, isMuted } = useAudio();
  const [showPenalty, setShowPenalty] = useState(false);

  const prevHealthRef = useRef<Record<string, number>>({});
  const [damageDealt, setDamageDealt] = useState<Record<string, number>>({});
  const [damageMsg, setDamageMsg] = useState<string | null>(null);

  // NOU: Estats per animacions
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const [isDividing, setIsDividing] = useState<Record<string, boolean>>({});
  const [damageStage, setDamageStage] = useState<Record<string, 'none' | 'impact' | 'draining' | 'done'>>({});

  // NOU: Seqüència de combat 1vs1
  const [combatStage, setCombatStage] = useState<'idle' | 'scores' | 'collision' | 'diff' | 'mult' | 'impact' | 'drain' | 'done'>('idle');
  const [combatDiff, setCombatDiff] = useState(0);
  const [combatMult, setCombatMult] = useState(0);
  const [combatFinalDamage, setCombatFinalDamage] = useState(0);
  const [combatLoser, setCombatLoser] = useState<string | null>(null);
  const [combatWinner, setCombatWinner] = useState<string | null>(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteWinnerId, setRouletteWinnerId] = useState<string | null>(null);

  // NOU: Vida visual per evitar salts en l'animació
  const [displayHealth, setDisplayHealth] = useState<Record<string, number>>({});

  // Inicialitzem la vida visual amb la que tenien al començar la ronda (passada per prop)
  useEffect(() => {
    setDisplayHealth(initialHealth || {});
  }, [initialHealth]);

  useEffect(() => {
    setHasClosedPopup(false);
    setPerfectScorers([]);
    setHasCongratulated(false);
    setHasLaughed(false);
    setShowPenalty(false);
    setEliminatedPlayer(null);
    setDamageDealt({});
    setDamageMsg(null);

    const timer = setTimeout(() => {
      setShowPenalty(true);
      
      // Iniciem animació de divisió de puntuació per als que han fet servir pista
      playerIds.forEach(pid => {
        const g = guesses[pid];
        if (g?.usedHint) {
          setIsDividing(prev => ({ ...prev, [pid]: true }));
          setTimeout(() => {
            setAnimatedScores(prev => ({ ...prev, [pid]: Math.round(g.score / 2) }));
          }, 800);
        }
      });

      // LÒGICA DE COMBAT SEQÜENCIAL (1VS1)
      if (room.gameType === '1vs1') {
        const pIds = Object.keys(room.players);
        // La vida visual ja està inicialitzada pel prop initialHealth

        if (pIds.length === 2) {
          const p1 = pIds[0];
          const p2 = pIds[1];
          const getS = (pid: string) => {
            const g = guesses[pid];
            if (!g) return 0;
            return g.usedHint ? Math.round(g.score / 2) : g.score;
          };
          const s1 = getS(p1);
          const s2 = getS(p2);
          
          if (s1 !== s2) {
            const winner = s1 > s2 ? p1 : p2;
            const loser = s1 > s2 ? p2 : p1;
            const diff = Math.abs(s1 - s2);
            const mult = 0.5 + (round * 0.5);
            const damage = Math.round(diff * mult);

            setCombatWinner(winner);
            setCombatLoser(loser);
            setCombatDiff(diff);
            setCombatMult(mult);
            setCombatFinalDamage(damage);

            // SEQÜÈNCIA TEMPORITZADA
            setTimeout(() => setCombatStage('scores'), 500);
            setTimeout(() => setCombatStage('collision'), 2500);
            setTimeout(() => setCombatStage('diff'), 3500);
            setTimeout(() => setCombatStage('mult'), 5000);
            setTimeout(() => setCombatStage('impact'), 6500);
            setTimeout(() => {
              setCombatStage('drain');
              // Actualitzem la vida visual del perdedor localment
              setDisplayHealth(prev => ({ 
                ...prev, 
                [loser]: Math.max(0, (prev[loser] || 10000) - damage) 
              }));
              setDamageDealt({ [loser]: damage });
              setDamageStage({ [loser]: 'impact' });
            }, 8000);
            setTimeout(() => {
              setDamageStage({ [loser]: 'draining' });
            }, 9000);
            setTimeout(() => {
              setDamageStage({ [loser]: 'done' });
              setCombatStage('done');
              
              // ARA SÍ: Actualitzem la ref per la següent ronda un cop acabada l'animació
              const finalHealths: Record<string, number> = {};
              pIds.forEach(pid => {
                finalHealths[pid] = pid === loser ? Math.max(0, (prevHealthRef.current[pid] || 10000) - damage) : (prevHealthRef.current[pid] || 10000);
              });
              prevHealthRef.current = finalHealths;
            }, 11000);
          } else {
             setCombatStage('done');
          }
        }
      } else {
        setCombatStage('done');
      }

    }, 1500);
    return () => clearTimeout(timer);
  }, [round]);

  // Inicialitzar puntuacions animades quan canvia la ronda
  useEffect(() => {
    const initial: Record<string, number> = {};
    playerIds.forEach(pid => {
      initial[pid] = guesses[pid]?.score || 0;
    });
    setAnimatedScores(initial);
    setIsDividing({});
    setDamageStage({});
  }, [round, guesses]);

  // ── LÒGICA DE MODES ESPECIALS (NOMÉS HOST) ──
  const logicProcessedRef = useRef<number>(-1);

  useEffect(() => {
    if (!isHost || !room || logicProcessedRef.current === round) return;
    logicProcessedRef.current = round;

    const calculateSpecialLogic = async () => {
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // 1. LÒGICA 1VS1
      if (room.gameType === '1vs1') {
        const pIds = Object.keys(room.players);
        if (pIds.length === 2) {
          const p1 = pIds[0];
          const p2 = pIds[1];

          const getScoreWithHint = (pId: string) => {
            const g = guesses[pId];
            if (!g) return 0;
            return g.usedHint ? Math.round(g.score / 2) : g.score;
          };

          const s1 = getScoreWithHint(p1);
          const s2 = getScoreWithHint(p2);

          if (s1 !== s2) {
            const loser = s1 > s2 ? p2 : p1;
            const diff = Math.abs(s1 - s2);
            // Multiplicador: 0.5 a la ronda 1 (index 0), 1.0 a la ronda 2, etc.
            const damage = Math.round(diff * (0.5 + (round * 0.5)));

            const currentHealth = room.players[loser]?.health ?? 10000;
            const newHealth = Math.max(0, currentHealth - damage);

            updates[`players/${loser}/health`] = newHealth;
            needsUpdate = true;
            // No posem gameState = finished aquí per deixar que l'animació acabi
          }
        }
      }

      // 2. LÒGICA BATTLE ROYALE
      if (room.gameType === 'battle_royale') {
        const activePlayers = Object.entries(room.players)
          .filter(([, p]) => !p.isEliminated)
          .map(([id, p]) => {
            const g = guesses[id];
            const score = g ? (g.usedHint ? Math.round(g.score / 2) : g.score) : 0;
            return { id, score };
          });

        if (activePlayers.length > 1) {
          const sorted = [...activePlayers].sort((a, b) => a.score - b.score);
          const minScore = sorted[0].score;
          const tiedPlayers = sorted.filter(p => p.score === minScore);

          if (tiedPlayers.length > 1) {
            // DESEMPAT AMB RULETA
            const loser = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
            updates.tieBreak = {
              players: tiedPlayers.map(p => p.id),
              loserId: loser.id,
              timestamp: Date.now()
            };
            needsUpdate = true;
          } else {
            const worst = sorted[0];
            updates[`players/${worst.id}/isEliminated`] = true;
            needsUpdate = true;
            setEliminatedPlayer(room.players[worst.id]?.name || 'Algú');

            if (activePlayers.length <= 2) {
              updates.gameState = 'finished';
            }
          }
        }
      }

      if (needsUpdate) {
        // Esperem a què l'animació estigui en fase de drain per sincronitzar Firebase
        setTimeout(async () => {
          await update(ref(db, `rooms/${roomId}`), updates);
        }, 8000);
      }
    };

    calculateSpecialLogic();
  }, [isHost, round, guesses, room, roomId]);

  // ── ESCULTAR EVENTS DE RIURE I FELICITACIÓ ──
  useEffect(() => {
    const laughRef = ref(db, `rooms/${roomId}/laughEvent`);
    const unsubLaugh = onValue(laughRef, (snap) => {
      const data = snap.val();
      if (data && data.timestamp > (room.lastLaughAt || 0)) {
        triggerLaughEffect(data.from);
      }
    });

    const congratsRef = ref(db, `rooms/${roomId}/congratsEvent`);
    const unsubCongrats = onValue(congratsRef, (snap) => {
      const data = snap.val();
      if (data && data.timestamp > (room.lastCongratsAt || 0)) {
        setCongratulatedBy(data.from);
        setTimeout(() => setCongratulatedBy(null), 4000);
      }
    });

    return () => {
      unsubLaugh();
      unsubCongrats();
    };
  }, [roomId, room.lastLaughAt, room.lastCongratsAt]);

  // Lògica per la ruleta de desempat
  useEffect(() => {
    if (room.tieBreak && room.tieBreak.timestamp > (room.createdAt || 0)) {
      setShowRoulette(true);
      setRouletteWinnerId(null);
      
      // Simulem el gir de la ruleta
      const spinTime = 4000;
      setTimeout(() => {
        setRouletteWinnerId(room.tieBreak!.loserId);
        
        // El host executa l'eliminació final després de la ruleta
        if (isHost) {
          setTimeout(async () => {
            const updates: any = {};
            updates[`players/${room.tieBreak!.loserId}/isEliminated`] = true;
            
            // Si només queda un, final de partida
            const activeCount = Object.values(room.players).filter(p => !p.isEliminated).length;
            if (activeCount <= 2) {
              updates.gameState = 'finished';
            }
            
            await update(ref(db, `rooms/${roomId}`), updates);
          }, 2000);
        }
      }, spinTime);
    }
  }, [room.tieBreak?.timestamp, isHost, roomId]);

  // Detectar eliminacions per a tots els jugadors (no només el host)
  const initialEliminatedRef = useRef<Set<string>>(new Set());
  const prevEliminatedRef = useRef<Record<string, boolean>>({});

  // Al muntar, guardem qui ja està eliminat per no mostrar avisos antics
  useEffect(() => {
    if (room?.players) {
      Object.entries(room.players).forEach(([pid, p]) => {
        if (p.isEliminated) initialEliminatedRef.current.add(pid);
      });
    }
  }, []);

  useEffect(() => {
    if (!room?.players) return;
    playerIds.forEach(pid => {
      const isEliminated = !!room.players[pid]?.isEliminated;
      // Només mostrem l'avís si s'acaba d'eliminar ARA (no estava a la llista inicial ni a la prèvia)
      if (isEliminated && !initialEliminatedRef.current.has(pid) && !prevEliminatedRef.current[pid]) {
        setEliminatedPlayer(room.players[pid].name);
      }
      prevEliminatedRef.current[pid] = isEliminated;
    });
  }, [room?.players]);

  const triggerLaughEffect = (from: string) => {
    setLaughedBy(from);
    playRiure();
    const container = document.getElementById('emoji-container');
    if (container) {
      for (let i = 0; i < 20; i++) {
        const span = document.createElement('span');
        span.innerText = '😂';
        span.className = 'absolute text-4xl animate-laugh-emoji pointer-events-none';
        span.style.left = `${Math.random() * 100}%`;
        span.style.top = `${Math.random() * 100}%`;
        span.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(span);
        setTimeout(() => span.remove(), 3000);
      }
    }
    setTimeout(() => setLaughedBy(null), 4000);
  };

  const handleLaugh = async () => {
    if (hasLaughed) return;
    setHasLaughed(true);
    await update(ref(db, `rooms/${roomId}`), {
      laughEvent: { from: room.players[playerId]?.name || 'Algú', timestamp: Date.now() },
      lastLaughAt: Date.now()
    });
  };

  const handleCongratulate = async () => {
    if (hasCongratulated) return;
    setHasCongratulated(true);

    const videoEl = document.getElementById('siu-video') as HTMLVideoElement;
    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.play().catch(e => console.log(e));
    }
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 10000 });

    await update(ref(db, `rooms/${roomId}`), {
      congratsEvent: { from: room.players[playerId]?.name || 'Algú', timestamp: Date.now() },
      lastCongratsAt: Date.now()
    });
  };

  // ── DETECTAR ELIMINATS I PERFECTES ──
  useEffect(() => {
    // 5K Logic
    const foundPerfects: string[] = [];
    for (const pid of playerIds) {
      if (guesses[pid]?.score === 5000 && room.players[pid]?.name) {
        foundPerfects.push(room.players[pid].name);
      }
    }
    if (foundPerfects.length > 0 && !hasClosedPopup) {
      setPerfectScorers(foundPerfects);
      window.dispatchEvent(new Event('pauseBackgroundMusic'));
    }

    // Elimination Logic
    if (room.gameType === 'battle_royale') {
      const pIds = Object.keys(room.players);
      for (const pid of pIds) {
        if (room.players[pid]?.isEliminated) {
          // Només ho mostrem si s'acaba d'eliminar (score pitjor de la ronda)
          // Comprovar si era un dels actius
          setEliminatedPlayer(room.players[pid].name);
        }
      }
    }
  }, [guesses, playerIds, room.players, hasClosedPopup]);

  useEffect(() => {
    if (!mapRef.current || !mapsReady || !actual) return;
    const actualLatLng = new google.maps.LatLng(actual.lat, actual.lng);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(actualLatLng);

    const map = new google.maps.Map(mapRef.current, {
      zoom: 3, center: actualLatLng, disableDefaultUI: true, zoomControl: true, mapTypeId: google.maps.MapTypeId.TERRAIN,
    });

    new google.maps.Marker({
      position: actualLatLng, map, zIndex: 10, title: 'Ubicació real',
      icon: {
        path: 'M 0,-15 L 3.5,-5 L 14,-5 L 5.5,2 L 8.5,13 L 0,7 L -8.5,13 L -5.5,2 L -14,-5 L -3.5,-5 Z',
        fillColor: '#FBBF24', fillOpacity: 1, strokeColor: '#92400E', strokeWeight: 1.5, scale: 1.2, anchor: new google.maps.Point(0, 0),
      },
    });

    playerIds.forEach((pid, i) => {
      const guess = guesses[pid];
      if (!guess) return;
      const guessLatLng = new google.maps.LatLng(guess.lat, guess.lng);
      bounds.extend(guessLatLng);
      const color = COLORS[i % COLORS.length];

      new google.maps.Marker({
        position: guessLatLng, map, zIndex: 5, title: room.players[pid]?.name,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5 },
      });

      new google.maps.Polyline({ path: [guessLatLng, actualLatLng], map, strokeColor: color, strokeOpacity: 0.85, strokeWeight: 2.5, geodesic: true });
    });

    map.fitBounds(bounds, 80);
  }, [mapsReady, actual]);


  // Funció per saber si el joc s'hauria d'acabar per rondes (només Classic)
  const isInfiniteMode = room.gameType === '1vs1' || room.gameType === 'battle_royale';

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative overflow-hidden">
      
      {/* MODAL RULETA DESEMPAT */}
      {showRoulette && room.tieBreak && (
        <div className="fixed inset-0 z-[15000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="text-center w-full max-w-lg">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-yellow-500 mb-2 animate-pulse">EMPATS AL LÍMIT!</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12">La ruleta decidirà qui abandona la competició...</p>
            
            <div className="relative w-64 h-64 mx-auto mb-12">
              {/* La fletxa indicadora */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl">🔽</div>
              
              {/* El cercle de la ruleta */}
              <div 
                className={`w-full h-full rounded-full border-8 border-white/20 relative overflow-hidden transition-all duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)`}
                style={{ 
                  transform: rouletteWinnerId && room.tieBreak ? `rotate(${360 * 5 + (room.tieBreak.players.indexOf(rouletteWinnerId) * (360 / room.tieBreak.players.length))}deg)` : 'rotate(0deg)',
                  background: `conic-gradient(${
                    room.tieBreak!.players.map((_, i) => {
                      const color = COLORS[i % COLORS.length];
                      const start = (i * (360 / room.tieBreak!.players.length)).toFixed(1);
                      const end = ((i + 1) * (360 / room.tieBreak!.players.length)).toFixed(1);
                      return `${color} ${start}deg ${end}deg`;
                    }).join(', ')
                  })`
                }}
              >
                {room.tieBreak!.players.map((pid, idx) => (
                  <div 
                    key={pid}
                    className="absolute top-0 left-1/2 h-1/2 w-1 origin-bottom flex flex-col items-center"
                    style={{ transform: `rotate(${(360 / room.tieBreak!.players.length) * idx}deg)` }}
                  >
                    <div className="text-[10px] font-black text-white whitespace-nowrap bg-black/40 px-2 py-1 rounded-full mt-4 -rotate-90 origin-center">
                      {room.players[pid]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rouletteWinnerId && (
              <div className="animate-in zoom-in duration-500">
                <div className="text-6xl mb-4">💀</div>
                <h3 className="text-3xl font-black uppercase text-red-500 mb-6">
                  {room.players[rouletteWinnerId]?.name} ELIMINAT!
                </h3>
                <GoldButton onClick={() => setShowRoulette(false)} className="px-12 py-4 rounded-2xl">
                  CONTINUAR
                </GoldButton>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* OVERLAY ELIMINACIÓ */}
      {eliminatedPlayer && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-[#1a0c0c] border-2 border-red-500/50 rounded-[4rem] p-12 text-center max-w-xl shadow-[0_0_100px_rgba(239,68,68,0.3)]">
            <div className="text-8xl mb-8 animate-bounce">💀</div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">JUGADOR ELIMINAT</h2>
            <p className="text-red-400 text-3xl font-black uppercase tracking-widest mb-10">{eliminatedPlayer}</p>
            <div className="flex flex-col gap-4 items-center">
              <button
                onClick={() => { handleLaugh(); }}
                disabled={hasLaughed}
                className={`w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-3 border-none ${hasLaughed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
              >
                <span className="text-2xl">😂</span> {hasLaughed ? 'JA TE N\'HAS ENRIGUT' : 'ENRIURE-SE\'N'}
              </button>

              <button
                onClick={() => setEliminatedPlayer(null)}
                className="w-full py-4 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer bg-transparent border border-white/10"
              >
                Tancar avís
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 5K */}
      {perfectScorers.length > 0 && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-br from-indigo-900 to-blue-600 border-2 border-blue-400 rounded-[3rem] p-10 text-center max-w-xl shadow-[0_0_150px_rgba(59,130,246,0.8)]">
            <h2 className="text-white text-5xl font-black uppercase tracking-widest mb-2 italic shadow-text">SIUUUUU!</h2>
            <p className="text-blue-200 font-bold mb-6">
              {perfectScorers.join(', ')} ha{perfectScorers.length > 1 ? 'n' : ''} clavat els 5.000 punts!
            </p>
            <video id="siu-video" src="/siu.mp4" autoPlay playsInline className="w-full max-h-60 object-cover rounded-2xl mb-8 shadow-2xl bg-black" />
            <div className="flex gap-4">
              <button onClick={handleCongratulate} disabled={hasCongratulated} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border-none cursor-pointer ${hasCongratulated ? 'bg-gray-600 text-gray-400' : 'bg-emerald-500 text-emerald-950 shadow-lg hover:scale-105 active:scale-95'}`}>
                {hasCongratulated ? 'Felicitat! 🎉' : 'Felicitar 👏'}
              </button>
              <button onClick={() => { setHasClosedPopup(true); setPerfectScorers([]); window.dispatchEvent(new Event('resumeBackgroundMusic')); }} className="flex-1 bg-yellow-500 text-yellow-950 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg hover:scale-105 active:scale-95 border-none cursor-pointer">
                Continuar 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {laughedBy && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[12000] animate-bounce pointer-events-none">
          <div className="bg-yellow-500 text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl border-4 border-black text-xl">
            {laughedBy} SE N&apos;ESTÀ ENRIENT! 😂
          </div>
        </div>
      )}
      {congratulatedBy && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[12000] animate-in slide-in-from-top duration-500 pointer-events-none">
          <div className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl border-4 border-emerald-300 text-xl">
            🎉 {congratulatedBy} T&apos;HA FELICITAT!
          </div>
        </div>
      )}

      <div id="emoji-container" className="fixed inset-0 pointer-events-none z-[13000] overflow-hidden" />

      <div ref={mapRef} className="flex-1 min-h-0" />

      <div className="bg-gray-900 border-t border-gray-700/50 p-5 flex-shrink-0 relative">
        {damageMsg && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase text-sm animate-bounce shadow-2xl z-50">
            {damageMsg}
          </div>
        )}
        <h2 className="text-white text-xl font-black text-center mb-1 uppercase tracking-tighter italic">Resultats — Ronda {round + 1}</h2>
        <p className="text-gray-500 text-[10px] text-center mb-4 font-mono tracking-widest uppercase">{actual.lat.toFixed(4)}, {actual.lng.toFixed(4)}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {playerIds.map((pid, i) => {
            const guess = guesses[pid];
            const player = room.players[pid];
            const color = COLORS[i % COLORS.length];
            const isMe = pid === playerId;

            // Calcular dany rebut per animació
            const lostHP = damageDealt[pid];
            const isHurt = showPenalty && lostHP > 0;

            return (
              <div key={pid} className={`rounded-xl p-4 relative overflow-hidden transition-all duration-1000 ${player?.isEliminated ? 'opacity-40 grayscale' : ''}`} style={{ background: `${color}10`, borderLeft: `4px solid ${color}` }}>
                {player?.isEliminated && <div className="absolute top-2 right-2 text-2xl animate-pulse">💀</div>}
                
                {/* Overlay de dany */}
                {isHurt && (
                  <div className="absolute inset-0 bg-red-600/20 animate-pulse z-10 flex items-center justify-center pointer-events-none" />
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-black/40">
                    {player?.avatarUrl ? <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs opacity-40">👤</div>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-black text-xs uppercase truncate">{player?.name}{isMe ? ' (Tu)' : ''}</span>
                  </div>
                </div>
                {guess ? (
                  <div className={`text-yellow-400 font-black text-3xl flex items-center gap-2 transition-all duration-1000 ${room.gameType === '1vs1' && combatStage === 'collision' ? (i === 0 ? 'animate-collide-p1' : 'animate-collide-p2') : ''}`}>
                    <span 
                      className="transition-all duration-700" 
                      style={{ 
                        transform: isDividing[pid] ? 'scale(1.2)' : 'scale(1)',
                        color: isDividing[pid] ? '#EF4444' : '#FBBF24'
                      }}
                    >
                      +{animatedScores[pid]?.toLocaleString() || 0}
                    </span>
                    {guess.usedHint && showPenalty && (
                      <span className="text-[10px] text-red-500 font-black animate-bounce bg-red-600/20 px-2 py-1 rounded border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"> 
                        50% PISTA
                      </span>
                    )}
                  </div>
                ) : <div className="text-gray-500 text-[10px] font-black uppercase italic">Sense tirada</div>}

                {room.gameType === '1vs1' && player?.health !== undefined && (
                  <div className="mt-4 relative">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                      <span className="text-gray-400">Vida Restant</span>
                      <span className={`text-sm ${(displayHealth[pid] ?? 10000) > 5000 ? 'text-emerald-400' : 'text-red-500'}`}>{displayHealth[pid] ?? 10000} / 10000</span>
                    </div>
                    <div className="h-4 w-full bg-black/40 rounded-lg overflow-hidden border-2 border-white/10 relative">
                      <div 
                        className={`h-full transition-all duration-[2000ms] ${damageStage[pid] === 'impact' ? 'bg-red-600 animate-pulse' : ((displayHealth[pid] ?? 10000) > 5000 ? 'bg-emerald-500' : (displayHealth[pid] ?? 10000) > 2000 ? 'bg-yellow-500' : 'bg-red-500')}`} 
                        style={{ 
                          width: `${((damageStage[pid] === 'impact' ? (initialHealth[pid] || 10000) : (displayHealth[pid] ?? 10000)) / 10000) * 100}%` 
                        }} 
                      />
                    </div>
                    {/* Missatge de dany flotant */}
                    {damageStage[pid] === 'impact' && (
                       <div className="absolute -top-12 right-0 text-red-500 font-black text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20">
                         -{lostHP} HP
                       </div>
                    )}
                    {damageStage[pid] === 'draining' && (
                       <div className="absolute -top-12 right-0 text-red-400 font-black text-2xl animate-out fade-out slide-out-to-top duration-1000 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20">
                         -{lostHP} HP
                       </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* OVERLAY COMBAT 1VS1 CENTRAL (SOBRE EL MAPA) */}
        {room.gameType === '1vs1' && (combatStage === 'diff' || combatStage === 'mult' || combatStage === 'impact') && (
          <div className="absolute top-0 left-0 w-full h-[60%] pointer-events-none z-[2000] flex items-center justify-center">
            <div className="text-center animate-in zoom-in duration-300">
               {combatStage === 'diff' && (
                 <div className="bg-red-600/20 backdrop-blur-md border-4 border-red-600 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(220,38,38,0.3)]">
                   <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">Diferència</div>
                   <div className="text-7xl font-black text-white italic tracking-tighter">
                     {combatDiff.toLocaleString()}
                   </div>
                 </div>
               )}
               {combatStage === 'mult' && (
                 <div className="bg-red-600/20 backdrop-blur-md border-4 border-red-600 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(220,38,38,0.3)]">
                   <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">Multiplicador Ronda {round + 1}</div>
                   <div className="text-5xl font-black text-red-500 italic tracking-tighter mb-4">
                     x{combatMult.toFixed(1)}
                   </div>
                   <div className="text-8xl font-black text-white italic tracking-tighter animate-bounce">
                     {combatFinalDamage.toLocaleString()}
                   </div>
                 </div>
               )}
               {combatStage === 'impact' && (
                 <div className={`text-9xl font-black text-red-600 italic tracking-tighter drop-shadow-[0_0_50px_rgba(220,38,38,0.6)] ${combatLoser === playerIds[0] ? 'animate-impact-to-p1' : 'animate-impact-to-p2'}`}>
                   {combatFinalDamage.toLocaleString()}
                 </div>
               )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onLeave} className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-black py-4 rounded-2xl text-xs transition-all border border-red-500/20 uppercase tracking-widest cursor-pointer border-none">🏃 Abandonar</button>
          {isHost ? (
            <button 
              disabled={combatStage !== 'done'}
              onClick={async () => {
                // Si algú ha mort, canviem a finished
                const pIds = Object.keys(room.players);
                const hasDead = pIds.some(pid => (room.players[pid]?.health ?? 10000) <= 0);
                if (hasDead) {
                  await update(ref(db, `rooms/${roomId}`), { gameState: 'finished' });
                } else {
                  onNext();
                }
              }} 
              className={`flex-[2] bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 text-black font-black py-4 rounded-2xl text-lg transition-all shadow-lg uppercase tracking-tighter italic border-none cursor-pointer ${combatStage !== 'done' ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95'}`}
            >
              {combatStage !== 'done' ? '⚔️ Lluitant...' : (Object.keys(room.players).some(pid => (room.players[pid]?.health ?? 10000) <= 0) ? '🏆 Resultats Finals' : 'Ronda Següent →')}
            </button>
          ) : (
            <div className="flex-[2] text-center text-gray-500 py-4 text-xs font-black uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5 animate-pulse flex items-center justify-center italic">⏳ Esperant Host...</div>
          )}
        </div>
      </div>
    </div>
  );
}