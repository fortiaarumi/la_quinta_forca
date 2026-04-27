'use client';

import { Room } from '@/lib/types';

interface Props {
  room: Room;
  playerId: string;
}

const MAX_SCORE = 25000;

export default function FinalResults({ room, playerId }: Props) {
  const sorted = Object.entries(room.players)
    .map(([id, player]) => ({
      id,
      name: player.name,
      score: room.totalScores?.[id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];
  const iWon = winner?.id === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8">
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
                      <div className="font-black text-xl">{p.name}</div>
                      {isMe && <div className="text-xs text-gray-400">Tu</div>}
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

        <button
          onClick={() => (window.location.href = '/')}
          className="w-full bg-green-500 hover:bg-green-400 active:scale-95 text-white font-black py-5 rounded-2xl text-2xl transition-all shadow-xl shadow-green-500/30"
        >
          🔄 Jugar de Nou
        </button>
      </div>
    </div>
  );
}