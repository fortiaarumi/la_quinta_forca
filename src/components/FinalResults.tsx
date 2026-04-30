'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest } from '@/lib/friendUtils';
import { Room } from '@/lib/types';
import { useAudio } from '@/lib/AudioContext';
import confetti from 'canvas-confetti';

interface Props {
  room: Room;
  playerId: string;
  onRestart: () => void; // 👈 AFEGIT: Funció per reiniciar la partida
  isHost: boolean;       // 👈 AFEGIT: Saber si soc l'amfitrió
}

const MAX_SCORE = 25000;

export default function FinalResults({ room, playerId, onRestart, isHost }: Props) {
  const { user } = useAuth();
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({});

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
      isAdmin: (player as any).isAdmin, // Afegim això!
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];
  const iWon = winner?.id === playerId;

  const { playCelebration, playDecepcion, stopAllMusic } = useAudio();
  const [grayscale, setGrayscale] = useState(false);

  useEffect(() => {
    // Aturem la música general
    stopAllMusic();

    if (iWon) {
      playCelebration();
      // Confeti durant 5 segons
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);
      
      return () => clearInterval(interval);
    } else {
      playDecepcion();
      // Blanc i negre durant 5 segons
      setGrayscale(true);
      const timeout = setTimeout(() => {
        setGrayscale(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [iWon, playCelebration, playDecepcion, stopAllMusic]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8 transition-all duration-1000"
      style={{ filter: grayscale ? 'grayscale(100%)' : 'grayscale(0%)' }}
    >
      <div className="w-full max-w-md">
        {/* Capçalera */}
        <div className="text-center mb-10">
          <div className="text-8xl mb-4 drop-shadow-2xl">{iWon ? '🏆' : '🌍'}</div>
          <h1 className="text-5xl font-black mb-2">Fi del Joc!</h1>
          <p className="text-gray-400 text-xl">
            {iWon
              ? 'Has guanyat! Quines habilitats geogràfiques!'
              : `${winner?.name} guanya!`}
          </p>
        </div>

        {/* Classificació */}
        <div className="space-y-4 mb-10">
          {sorted.map((p, i) => {
            const isMe = p.id === playerId;
            const pct = Math.min(100, Math.round((p.score / MAX_SCORE) * 100));
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 transition-all ${
                  isMe
                    ? 'bg-gradient-to-r from-yellow-500/15 to-green-500/15 border-2 border-yellow-500/40 shadow-xl'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{medals[i] ?? '🎮'}</span>
                    <div>
                      <div className="font-black text-xl flex items-center gap-2">
                        {p.name} 
                        {p.isAdmin && <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-md font-black uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]">👑 ADMIN</span>}
                      </div>
                      {isMe && <div className="text-xs text-gray-400">Tu</div>}
                      {/* 👈 AFEGIT: Botó d'afegir amic a la pantalla final */}
                      {user && !isMe && !myFriends.includes(p.id) && (
                        <button
                          onClick={async () => {
                            await sendFriendRequest(user.uid, p.id);
                            setFriendReqSent(prev => ({ ...prev, [p.id]: true }));
                          }}
                          disabled={friendReqSent[p.id]}
                          className={`mt-1 text-[9px] uppercase font-black px-2 py-1 rounded transition-all ${
                            friendReqSent[p.id] ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                          }`}
                        >
                          {friendReqSent[p.id] ? '✓ Petició Enviada' : '+ Afegir Amic'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-yellow-400">
                      {p.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">/ 25.000 pts</div>
                  </div>
                </div>
                {/* Barra de progrés */}
                <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${pct}%`, transition: 'width 1s ease-out' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── NOU: GRUP DE BOTONS ── */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={onRestart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black py-4 rounded-xl text-lg transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-wide border-b-4 border-emerald-700"
            >
              🔄 Jugar de nou la revenja!
            </button>
          ) : (
            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 font-bold py-4 rounded-xl text-sm text-center uppercase tracking-wide">
              ⏳ Esperant l'amfitrió...
            </div>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 active:scale-95 text-white font-bold py-4 rounded-xl text-sm transition-all uppercase tracking-widest text-gray-400 hover:text-white"
          >
            🏠 Tornar a l'inici
          </button>
        </div>
      </div>
    </div>
  );
}