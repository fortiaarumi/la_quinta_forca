'use client';

import { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/gameUtils';
import { useRouter } from 'next/navigation';
import { GameMode } from '@/lib/types';

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('geoPlayerId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('geoPlayerId', id);
  }
  return id;
}

export default function HomeScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'solo' | 'create' | 'join'>('solo');
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Mode un jugador ──────────────────────────────────────────────────────
  const handleSolo = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    setLoading(true);
    setError('');
    try {
      const playerId = getOrCreatePlayerId();
      const roomCode = generateRoomCode();
      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: { name: playerName.trim(), joinedAt: Date.now() } },
        currentRound: 0,
        gameState: 'lobby',
        createdAt: Date.now(),
        isSinglePlayer: true,
        gameMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      localStorage.setItem('geoPlayerName', playerName.trim());
      router.push(`/room/${roomCode}`);
    } catch {
      setError('Error en crear la partida. Comprova la connexió.');
      setLoading(false);
    }
  };

  // ── Crear sala multijugador ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    setLoading(true);
    setError('');
    try {
      const playerId = getOrCreatePlayerId();
      const roomCode = generateRoomCode();
      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: { name: playerName.trim(), joinedAt: Date.now() } },
        currentRound: 0,
        gameState: 'lobby',
        createdAt: Date.now(),
        isSinglePlayer: false,
        gameMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      localStorage.setItem('geoPlayerName', playerName.trim());
      router.push(`/room/${roomCode}`);
    } catch {
      setError('Error en crear la sala. Comprova la connexió.');
      setLoading(false);
    }
  };

  // ── Unir-se a sala ───────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    if (!joinCode.trim()) return setError('Introdueix el codi de sala');
    setLoading(true);
    setError('');
    const code = joinCode.trim().toUpperCase();
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) {
        setError('Sala no trobada. Comprova el codi.');
        return setLoading(false);
      }
      const room = snap.val();
      if (room.gameState !== 'lobby') {
        setError('La partida ja ha començat.');
        return setLoading(false);
      }
      const existing = Object.keys(room.players || {});
      const playerId = getOrCreatePlayerId();
      if (existing.length >= 2 && !existing.includes(playerId)) {
        setError('La sala és plena (màxim 2 jugadors).');
        return setLoading(false);
      }
      if (!existing.includes(playerId)) {
        await set(ref(db, `rooms/${code}/players/${playerId}`), {
          name: playerName.trim(),
          joinedAt: Date.now(),
        });
        await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
      }
      localStorage.setItem('geoPlayerName', playerName.trim());
      router.push(`/room/${code}`);
    } catch {
      setError('Error en unir-se a la sala.');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'solo' as const, label: '🧍 Un jugador' },
    { id: 'create' as const, label: '🏠 Crear Sala' },
    { id: 'join' as const, label: '🔗 Unir-se' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 drop-shadow-lg">🌍</div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-1">
            La Quinta Forca
          </h1>
          <p className="text-gray-400 text-base">Endevina on ets al món</p>
        </div>

        {/* Nom del jugador */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-2 tracking-wide uppercase">
            El teu nom
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Introdueix el teu nom..."
            maxLength={20}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Selector de mode de joc */}
        {tab !== 'join' && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-300 mb-2 tracking-wide uppercase">
              Mode de joc
            </label>
            <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setGameMode('world')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  gameMode === 'world'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🌍 Món
              </button>
              <button
                onClick={() => setGameMode('catalunya')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  gameMode === 'catalunya'
                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔴🟡 Catalunya
              </button>
            </div>
            {gameMode === 'catalunya' && (
              <p className="text-yellow-400/70 text-xs mt-2 text-center">
                Ubicacions de pobles i ciutats de Catalunya
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contingut del tab */}
        {tab === 'solo' && (
          <div>
            <p className="text-gray-400 text-sm text-center mb-5">
              Juga sol per practicar. Les 5 rondes es generen automàticament.
            </p>
            <button
              onClick={handleSolo}
              disabled={loading || !playerName.trim()}
              className="w-full bg-green-500 hover:bg-green-400 active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-500/25"
            >
              {loading ? '⌛ Creant partida...' : '▶ Jugar Sol'}
            </button>
          </div>
        )}

        {tab === 'create' && (
          <div>
            <p className="text-gray-400 text-sm text-center mb-5">
              Crea una sala i comparteix el codi amb el teu amic.
            </p>
            <button
              onClick={handleCreate}
              disabled={loading || !playerName.trim()}
              className="w-full bg-green-500 hover:bg-green-400 active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-500/25"
            >
              {loading ? '⌛ Creant...' : 'Crear Sala'}
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 tracking-wide uppercase">
              Codi de sala
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-3xl tracking-[0.4em] text-center mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={loading || !playerName.trim() || joinCode.length < 6}
              className="w-full bg-green-500 hover:bg-green-400 active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-500/25"
            >
              {loading ? '⌛ Unint-se...' : 'Unir-se a la Sala'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
