'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest } from '@/lib/friendUtils';
import { Room } from '@/lib/types';
import { useAudio } from '@/lib/AudioContext';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { ALL_BADGES } from '@/lib/badges';
import { completeSongQuest } from '@/lib/userStats';

interface Props {
  roomId: string;
  room: Room;
  playerId: string;
  onRestart: () => void;
  onLeave: () => void;
  isHost: boolean;
}

const MAX_SCORE = 25000;

export default function FinalResults({ roomId, room, playerId, onRestart, onLeave, isHost }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({});
  const [songVolume, setSongVolume] = useState(1);
  const { playCelebration, playDecepcion, stopAllMusic } = useAudio();
  const [grayscale, setGrayscale] = useState(false);
  const songRef = useRef<HTMLAudioElement | null>(null);
  const [songCurrentTime, setSongCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);

  const [showManual, setShowManual] = useState(false);
  const [manualTab, setManualTab] = useState<'windows' | 'mac' | 'linux'>('windows');

  const [botAlive, setBotAlive] = useState(false);
  const [botCredits, setBotCredits] = useState<number | null>(null);

  useEffect(() => {
    const botStatusRef = ref(db, 'system/bot_status');
    const unsub = onValue(botStatusRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const now = Date.now();
        const isAlive = data.last_seen && (now - data.last_seen < 30000);
        setBotAlive(isAlive);
        setBotCredits(data.credits ?? null);
      } else {
        setBotAlive(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsub = onValue(friendsRef, (snap) => {
      if (snap.exists()) setMyFriends(Object.keys(snap.val()));
    });
    return () => unsub();
  }, [user]);

  const sorted = Object.entries(room.players)
    .map(([id, player]) => ({
      id,
      name: player.name,
      score: room.totalScores?.[id] ?? 0,
      isAdmin: (player as any).isAdmin,
      isEliminated: player.isEliminated || false,
      eliminatedAtRound: (player as any).eliminatedAtRound ?? -1,
    }))
    .sort((a, b) => {
      if (room.gameType === 'battle_royale') {
        // 1. Si un està viu i l'altre no, el viu va primer
        if (!a.isEliminated && b.isEliminated) return -1;
        if (a.isEliminated && !b.isEliminated) return 1;

        // 2. Si tots dos estan eliminats, el que va sobreviure a més rondes guanya
        if (a.isEliminated && b.isEliminated) {
          if (b.eliminatedAtRound !== a.eliminatedAtRound) {
            return b.eliminatedAtRound - a.eliminatedAtRound;
          }
        }
        // 3. Si empaten o estan vius tots dos, desempatem pels punts totals
        return b.score - a.score;
      }
      // Mode Clàssic o 1vs1: Només ens importen els punts
      return b.score - a.score;
    });

  const winner = sorted[0];
  const iWon = winner?.id === playerId;

  useEffect(() => {
    stopAllMusic();
    if (iWon) {
      playCelebration();
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);
      return () => clearInterval(interval);
    } else {
      playDecepcion();
      setGrayscale(true);
      const timeout = setTimeout(() => setGrayscale(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [iWon, playCelebration, playDecepcion, stopAllMusic]);

  const numberToCatalan = (n: number): string => {
    if (n === 0) return 'zero';
    const units = ['', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou'];
    const tens = ['', 'deu', 'vint', 'trenta', 'quaranta', 'cinquanta', 'seixanta', 'setanta', 'vuitanta', 'noranta'];
    const specials: Record<number, string> = {
      11: 'onze', 12: 'dotze', 13: 'tretze', 14: 'catorze', 15: 'quinze', 16: 'setze', 17: 'disset', 18: 'divuit', 19: 'dinou',
      21: 'vint-i-un', 22: 'vint-i-dos', 23: 'vint-i-tres', 24: 'vint-i-quatre', 25: 'vint-i-cinc', 26: 'vint-i-sis', 27: 'vint-i-set', 28: 'vint-i-vuit', 29: 'vint-i-nou'
    };
    if (n < 10) return units[n];
    if (n <= 29 && specials[n]) return specials[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + units[n % 10] : '');
    if (n === 100) return 'cent';
    if (n < 1000) return (Math.floor(n / 100) === 1 ? 'cent' : units[Math.floor(n / 100)] + '-cents') + (n % 100 !== 0 ? ' ' + numberToCatalan(n % 100) : '');
    if (n === 1000) return 'mil';
    if (n < 1000000) return (Math.floor(n / 1000) === 1 ? 'mil' : numberToCatalan(Math.floor(n / 1000)) + ' mil') + (n % 1000 !== 0 ? ' ' + numberToCatalan(n % 1000) : '');
    return n.toString();
  };

  const handleGenerateSong = async () => {
    if (!isHost) return;
    try {
      await update(ref(db, `rooms/${roomId}/songState`), { status: 'generating_lyrics', error: null });
      const roundsSnap = await get(ref(db, `rooms/${roomId}/rounds`));
      const freshRounds = roundsSnap.val() || room.rounds || [];
      const gameMode = room.gameMode || 'world';
      const totalRounds = Object.keys(freshRounds).length;

      const guesses = Object.entries(room.players).map(([id, p]) => {
        const roundLines: string[] = [];
        for (let i = 0; i < totalRounds; i++) {
          const guessObj = freshRounds[i]?.guesses?.[id];
          if (!guessObj) continue;
          const distWords = numberToCatalan(Math.round(guessObj.distance));
          const actual = guessObj.actualCountry || 'un lloc desconegut';
          const guess = guessObj.guessCountry || 'un lloc desconegut';
          roundLines.push(`  Ronda ${i+1}: estava a "${actual}", ha posat el pin a "${guess}" (error: ${distWords} km)`);
        }
        if (roundLines.length > 0) {
          return `- Jugador: ${p.name}\n${roundLines.join('\n')}\n`;
        }
        return `- Jugador: ${p.name} (ha jugat perfecte)\n`;
      }).join('\n');

      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guesses, gameMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconegut al generar la cançó');
      await update(ref(db, `rooms/${roomId}/songState`), {
        status: 'waiting_for_bot',
        lyrics: data.lyrics,
        genre: data.genre,
        prompt: guesses
      });

      // Completar quest diarià si el jugador la té activa
      if (user?.uid) {
        completeSongQuest(user.uid).catch(() => {});
      }
    } catch (err: any) {
      await update(ref(db, `rooms/${roomId}/songState`), { status: 'error', error: err.message });
    }
  };

  const handlePlaySong = async () => {
    if (!isHost) return;
    await update(ref(db, `rooms/${roomId}/songState`), { status: 'playing' });
  };

  useEffect(() => {
    if (room.songState?.status === 'playing' && room.songState?.audioUrl) {
      stopAllMusic();
      if (!songRef.current) songRef.current = new Audio(room.songState.audioUrl);
      const audio = songRef.current;
      const updateTime = () => setSongCurrentTime(audio.currentTime);
      const updateDuration = () => setSongDuration(audio.duration);
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.volume = songVolume;
      audio.play().catch(e => console.error("Auto-play prevented", e));
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    } else if (songRef.current) {
      songRef.current.pause();
    }
  }, [room.songState?.status, room.songState?.audioUrl, stopAllMusic, songVolume]);

  useEffect(() => {
    if (songRef.current) songRef.current.volume = songVolume;
  }, [songVolume]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen bg-[#06080f] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden transition-all duration-1000"
      style={{ filter: grayscale ? 'grayscale(100%)' : 'grayscale(0%)' }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-yellow-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="text-9xl mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-bounce">{iWon ? '🏆' : '🌍'}</div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2">Fi del Joc!</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] italic">La Quinta Forca — Hall of Fame</p>
          <div className="mt-4 px-6 py-2 bg-white/5 rounded-full inline-block border border-white/10 backdrop-blur-md">
            <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">
              {iWon ? 'VICTÒRIA MAGISTRAL!' : `${winner?.name.toUpperCase()} HA GUANYAT!`}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          {sorted.map((p, i) => {
            const isMe = p.id === playerId;
            const pct = Math.min(100, Math.round((p.score / MAX_SCORE) * 100));
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={p.id}
                className={`rounded-[2rem] p-6 transition-all duration-500 animate-slide-up opacity-0 backdrop-blur-2xl border ${isMe ? 'bg-white/10 border-yellow-500/40 shadow-[0_0_40px_rgba(212,175,55,0.15)]' : 'bg-white/5 border-white/10'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-black/40 shadow-2xl flex items-center justify-center">
                        {room.players[p.id]?.avatarUrl ? (
                          <img src={room.players[p.id].avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl opacity-40">👤</span>
                        )}
                      </div>
                      <div className="absolute -top-2 -left-2 text-4xl drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">{medals[i] ?? '🎮'}</div>
                    </div>
                    <div>
                      <div className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-2">
                        {p.name}
                        {p.isAdmin && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-md font-black tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]">👑 ADMIN</span>}
                        {p.isEliminated && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]">ELIMINAT {p.eliminatedAtRound >= 0 ? `(R${p.eliminatedAtRound + 1})` : ''}</span>}
                        {!p.isEliminated && room.gameType === 'battle_royale' && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.5)]">SUPERVIVENT</span>}
                      </div>
                      {room.players[p.id]?.badges && room.players[p.id].badges!.length > 0 && (
                        <div className="flex gap-2 mb-1 mt-1">
                          {room.players[p.id].badges!.map((bId, bi) => {
                            const badgeDef = ALL_BADGES.find(b => b.id === bId);
                            return (
                              <div key={bi} className="group relative flex items-center justify-center cursor-pointer">
                                {/* La Foto */}
                                <img
                                  src={badgeDef?.image || '/badges/default.png'}
                                  alt={bId}
                                  className="w-6 h-6 object-contain drop-shadow-lg group-hover:scale-125 transition-transform"
                                />
                                {/* El Tooltip Flotant */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 border border-yellow-500/50 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                  {bId}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isMe && <div className="text-xs text-gray-400">Tu</div>}
                      {user && !isMe && !myFriends.includes(p.id) && (
                        <button
                          onClick={async () => {
                            await sendFriendRequest(user.uid, p.id);
                            setFriendReqSent(prev => ({ ...prev, [p.id]: true }));
                          }}
                          disabled={friendReqSent[p.id]}
                          className={`mt-1 text-[9px] uppercase font-black px-2 py-1 rounded transition-all ${friendReqSent[p.id] ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
                        >
                          {friendReqSent[p.id] ? '✓ Petició Enviada' : '+ Afegir Amic'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-yellow-500 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] font-mono">
                      {p.score.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">PUNTS</div>
                  </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-emerald-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    style={{ width: `${pct}%`, transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                </div>

                {/* VIDA (NOMÉS 1VS1) */}
                {room.gameType === '1vs1' && room.players[p.id]?.health !== undefined && (
                  <div className="mt-4 animate-in fade-in duration-1000 delay-500">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-gray-500">Vida Final</span>
                      <span className={room.players[p.id].health! > 0 ? 'text-emerald-400' : 'text-red-500'}>{room.players[p.id].health} / 10000</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                      <div className={`h-full transition-all duration-1000 ${room.players[p.id].health! > 5000 ? 'bg-emerald-500' : room.players[p.id].health! > 2000 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(room.players[p.id].health! / 10000) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* HISTORIAL DE BATALLA (1VS1) */}
        {room.gameType === '1vs1' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-2xl mb-12 animate-in slide-in-from-bottom duration-1000">
            <h2 className="text-xl font-black uppercase tracking-widest text-red-400 mb-6 italic text-center">⚔️ Historial de Batalla</h2>
            <div className="space-y-3">
              {Object.keys(room.rounds || {}).map(rKey => {
                const r = parseInt(rKey);
                const roundData = room.rounds?.[r];
                if (!roundData) return null;
                const pIds = Object.keys(room.players);
                if (pIds.length < 2) return null;
                const s1 = roundData.guesses[pIds[0]]?.score || 0;
                const s2 = roundData.guesses[pIds[1]]?.score || 0;
                const ps1 = roundData.guesses[pIds[0]]?.usedHint ? Math.round(s1 / 2) : s1;
                const ps2 = roundData.guesses[pIds[1]]?.usedHint ? Math.round(s2 / 2) : s2;
                const diff = Math.abs(ps1 - ps2);
                const mult = 0.5 + (r * 0.5);
                const damage = Math.round(diff * mult);
                const winnerId = ps1 > ps2 ? pIds[0] : pIds[1];
                const loserId = ps1 > ps2 ? pIds[1] : pIds[0];

                return (
                  <div key={r} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 w-20">Ronda {r + 1}</span>
                    {ps1 === ps2 ? (
                      <span className="text-gray-400">Empat (0 dany)</span>
                    ) : (
                      <div className="flex-1 flex justify-center items-center gap-2">
                        <span className="text-white">{room.players[winnerId]?.name}</span>
                        <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded-lg border border-red-500/20">-{damage} HP</span>
                        <span className="text-gray-500">a {room.players[loserId]?.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 mt-2 text-center shadow-2xl overflow-hidden relative">
            {!room.songState || room.songState.status === 'idle' ? (
              isHost ? (
                botAlive && (botCredits === null || botCredits > 0) ? (
                  <button onClick={handleGenerateSong} className="w-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95 text-white font-black py-5 rounded-2xl text-xs transition-all uppercase tracking-[0.2em] shadow-xl border-none cursor-pointer">
                    🎵 Generar Cançó Satírica (Gratis)
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button disabled className="w-full bg-white/5 text-gray-600 font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] cursor-not-allowed border border-white/5">
                      {!botAlive ? '💤 Bot Apagat' : '💳 Sense Crèdits'}
                    </button>
                    <button onClick={() => setShowManual(true)} className="text-[10px] bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-md font-black uppercase tracking-widest transition-all active:scale-95">
                      📖 Llegir Manual
                    </button>
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-xs italic">El Host pot generar una cançó satírica.</div>
              )
            ) : null}

            {room.songState?.status === 'generating_lyrics' && <div className="text-indigo-400 font-bold animate-pulse text-sm">✍️ Escrivint lletra...</div>}
            {room.songState?.status === 'waiting_for_bot' && <div className="text-blue-400 font-bold animate-pulse text-sm">🤖 Esperant al Bot...</div>}
            {room.songState?.status === 'generating_music' && <div className="text-purple-400 font-bold animate-pulse text-sm">🎧 Composant música...</div>}
            {room.songState?.status === 'ready' && isHost && (
              <div className="flex flex-col gap-2 w-full">
                <button onClick={handlePlaySong} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm uppercase">▶️ Reproduir</button>
                {room.songState?.audioUrl && (
                  <a href={room.songState.audioUrl} download="canco-satirica-la-quinta-forca.mp3" target="_blank" rel="noopener noreferrer" className="w-full text-center bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 font-bold py-2 rounded-lg text-xs uppercase tracking-widest no-underline transition-colors cursor-pointer">
                    ⬇️ Descarregar MP3
                  </a>
                )}
              </div>
            )}
            {room.songState?.status === 'playing' && (
              <div className="text-left w-full mt-2 bg-black/40 p-4 rounded-lg">
                <div className="text-green-400 font-bold text-center mb-2 animate-pulse">🔊 Sonant ara</div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{formatTime(songCurrentTime)}</span>
                    <span>{formatTime(songDuration)}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${songDuration > 0 ? (songCurrentTime / songDuration) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <button onClick={() => { if (songRef.current) { songRef.current.currentTime = 0; songRef.current.play(); } }} className="text-xs bg-indigo-600 px-3 py-1 rounded-full text-white font-bold">🔄</button>
                  <input type="range" min="0" max="1" step="0.01" value={songVolume} onChange={(e) => setSongVolume(parseFloat(e.target.value))} className="w-24 accent-purple-500" />
                  {room.songState?.audioUrl && (
                    <a href={room.songState.audioUrl} download="canco-satirica-la-quinta-forca.mp3" target="_blank" rel="noopener noreferrer" className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 font-bold px-3 py-1 rounded-full no-underline transition-colors">
                      ⬇️ MP3
                    </a>
                  )}
                </div>
                <div className="text-gray-300 text-sm italic text-center whitespace-pre-wrap leading-relaxed px-4">{room.songState.lyrics}</div>
              </div>
            )}
            {room.songState?.status === 'error' && <div className="text-red-400 font-bold text-sm">❌ Error al generar</div>}
          </div>

          {isHost ? (
            <button onClick={onRestart} className="w-full bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 text-black font-black py-6 rounded-[2rem] text-xl transition-all duration-300 shadow-xl active:scale-95 uppercase tracking-tighter italic">
              🔄 Revenja!
            </button>
          ) : (
            <div className="w-full bg-white/5 border border-white/10 text-gray-500 font-black py-6 rounded-[2rem] text-xs text-center uppercase tracking-[0.3em] animate-pulse">⏳ Esperant...</div>
          )}

          <button onClick={onLeave} className="w-full bg-transparent text-gray-500 hover:text-white font-black py-4 rounded-2xl text-[10px] transition-all uppercase tracking-[0.4em]">
            🏠 Tornar a l&apos;inici
          </button>
        </div>
      </div>

      {showManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-900/20">
              <h2 className="text-2xl font-black text-white">Manual del Bot 🤖</h2>
              <button onClick={() => setShowManual(false)} className="text-gray-400 hover:text-white text-3xl">×</button>
            </div>
            <div className="flex bg-slate-800/50 p-1 m-4 rounded-xl border border-white/5">
              {(['windows', 'mac', 'linux'] as const).map(os => (
                <button key={os} onClick={() => setManualTab(os)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${manualTab === os ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                  {os}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm space-y-6">
              {manualTab === 'windows' && (
                <>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">1. Instal·lar el motor</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs">1. Baixa el botó verd &quot;LTS&quot; de <a href="https://nodejs.org/" target="_blank" className="text-emerald-400 underline">nodejs.org</a>.</p>
                      <p className="text-xs">2. Baixa i instal·la Git de <a href="https://gitforwindows.org/" target="_blank" className="text-emerald-400 underline">gitforwindows.org</a>.</p>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">2. Descarregar el robot</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs">Obre el <code className="text-white">cmd</code> i posa aquestes ordres:</p>
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-[10px] text-emerald-400 overflow-x-auto">
                        git clone https://github.com/fortiaarumi/la_quinta_forca.git{"\n"}
                        cd la_quinta_forca{"\n"}
                        npm install
                      </pre>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">3. Configurar fitxer .env.local</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-[10px]">Crea un fitxer <code className="text-white">.env.local</code> amb el Bloc de Notes i enganxa-hi això:</p>
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-[8px] text-emerald-400 overflow-x-auto">
                        NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58{"\n"}
                        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com{"\n"}
                        NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app{"\n"}
                        NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5{"\n"}
                        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app{"\n"}
                        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386{"\n"}
                        NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb
                      </pre>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">4. Engegar</h3>
                    <code className="block bg-black p-4 rounded text-xs text-emerald-400">node --env-file=.env.local suno-puppeteer.mjs</code>
                  </section>
                </>
              )}

              {manualTab === 'linux' && (
                <>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">1. Programes bàsics</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                      <p className="text-xs">Obre la Terminal (Ctrl+Alt+T) i posa:</p>
                      <code className="block bg-black p-2 mt-2 rounded text-[10px] text-emerald-400">sudo apt update && sudo apt install nodejs npm git -y</code>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">2. Robot i Configuració</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-[10px]">Copia/enganxa ordres i claus al fitxer:</p>
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-[10px] text-emerald-400 overflow-x-auto">
                        git clone https://github.com/fortiaarumi/la_quinta_forca.git{"\n"}
                        cd la_quinta_forca{"\n"}
                        npm install{"\n"}
                        nano .env.local
                      </pre>
                      <p className="text-[9px] text-gray-500 italic">Dins del nano, enganxa les claus que hi ha al README.md o al manual de Windows.</p>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">3. Engegar</h3>
                    <code className="block bg-black p-4 rounded text-xs text-emerald-400">node --env-file=.env.local suno-puppeteer.mjs</code>
                  </section>
                </>
              )}

              {manualTab === 'mac' && (
                <>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">1. Motor i Terminal</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs">1. Baixa l&apos;instal·lador LTS de <a href="https://nodejs.org/" target="_blank" className="text-emerald-400 underline">nodejs.org</a>.</p>
                      <p className="text-xs">2. Obre la Terminal i posa <code className="text-white">git --version</code> per instal·lar les eines.</p>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-indigo-400 font-black uppercase text-xs mb-3">2. Robot i Engegar</h3>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-[10px] text-emerald-400 overflow-x-auto">
                        git clone https://github.com/fortiaarumi/la_quinta_forca.git{"\n"}
                        cd la_quinta_forca{"\n"}
                        npm install{"\n"}
                        nano .env.local{"\n"}
                        node --env-file=.env.local suno-puppeteer.mjs
                      </pre>
                      <p className="text-[9px] text-gray-500 italic">Dins del nano, enganxa les claus que hi ha al README.md o al manual de Windows.</p>
                    </div>
                  </section>
                </>
              )}
            </div>
            <div className="p-6 border-t border-white/10 bg-indigo-900/10 flex justify-center">
              <button onClick={() => setShowManual(false)} className="bg-indigo-600 text-white font-black px-10 py-3 rounded-xl uppercase text-xs">Entès!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}