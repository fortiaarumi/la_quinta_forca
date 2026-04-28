'use client';

import { useState } from 'react';
import { Room } from '@/lib/types';

interface Props {
  room: Room;
  roomId: string;
  playerId: string;
  isHost: boolean;
  onStart: () => void;
  isGenerating: boolean;
  mapsReady: boolean;
}

export default function LobbyScreen({
  room, roomId, playerId, isHost, onStart, isGenerating, mapsReady,
}: Props) {
  const [copied, setCopied] = useState(false);
  const players = Object.entries(room.players);
  const canStart = isHost && players.length >= 2 && mapsReady && !isGenerating;

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌍</div>
          <h1 className="text-3xl font-black">Sala d&apos;espera</h1>
        </div>

        {/* Codi de sala */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 mb-6 text-center shadow-xl">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Codi de Sala</p>
          <p className="text-5xl font-black font-mono tracking-[0.3em] mb-4 text-white">{roomId}</p>
          <button
            onClick={copyCode}
            className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
          >
            {copied ? '✓ Copiat!' : '📋 Copiar codi'}
          </button>
        </div>

        {/* Jugadors */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Jugadors ({players.length}/10)
          </p>
          <div className="space-y-2">
            {players.map(([id, player]) => (
              <div key={id} className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold">
                  {player.name}{id === playerId ? ' (Tu)' : ''}
                </span>
                {id === room.hostId && (
                  <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botó / estat */}
        {isHost ? (
          <>
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-3xl text-xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-20 uppercase tracking-tighter mt-4"
            >
              {isGenerating
                ? '⌛ GENERANT MAPA...'
                : !mapsReady
                ? '⌛ CARREGANT...'
                : players.length < 2
                ? '⏳ ESPERANT JUGADORS...'
                : '🚀 INICIAR PARTIDA'}
            </button>
            {!canStart && mapsReady && !isGenerating && players.length < 2 && (
              <p className="text-center text-gray-500 text-sm mt-3">
                Esperant almenys 1 jugador més per iniciar...
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 text-lg">
              {isGenerating
                ? '⚙️ El host genera les ubicacions...'
                : '⏳ Esperant que el host iniciï...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}