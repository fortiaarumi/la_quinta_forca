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
  const [timeMode, setTimeMode] = useState<'bala' | 'normal' | 'infinit'>('bala');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        timeMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      localStorage.setItem('geoPlayerName', playerName.trim());
      router.push(`/room/${roomCode}`);
    } catch {
      setError('Error en crear la partida.');
      setLoading(false);
    }
  };

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
        timeMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      localStorage.setItem('geoPlayerName', playerName.trim());
      router.push(`/room/${roomCode}`);
    } catch {
      setError('Error en crear la sala.');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    if (!joinCode.trim()) return setError('Introdueix el codi de sala');
    setLoading(true);
    setError('');
    const code = joinCode.trim().toUpperCase();
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) {
        setError('Sala no trobada.');
        return setLoading(false);
      }
      const room = snap.val();
      const playerId = getOrCreatePlayerId();
      const existing = Object.keys(room.players || {});
      
      // Comprovar el límit de 10 jugadors ABANS de deixar-lo entrar
      if (existing.length >= 10 && !existing.includes(playerId)) {
        setError('La sala és plena (màxim 10 jugadors).');
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
      setError('Error en unir-se.');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'solo' as const, label: '🧍 Individual' },
    { id: 'create' as const, label: '🏠 Crear Sala' },
    { id: 'join' as const, label: '🔗 Unir-se' },
  ];

  // ── DISSENY NOU (Aplicat sobre la teva estructura de return) ──────────────
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1a] overflow-hidden p-6">
      
      {/* Llums decoratives de fons */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px]" />

      {/* Crèdits d'autor */}
      <div className="absolute top-8 right-10 text-right hidden sm:block">
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Projecte Alpha</p>
        <p className="text-white font-medium text-sm italic">Creat per: <span className="text-emerald-400 font-bold not-italic">Fortià Arumí Casals</span></p>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo i Títol */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 drop-shadow-[0_0_20px_rgba(52,211,153,0.2)] animate-bounce">🌍</div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
            LA QUINTA <span className="text-emerald-400 not-italic">FORCA</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Endevina on ets al món</p>
        </div>

        {/* Targeta Principal amb Glassmorphism */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          
          {/* Nom del jugador */}
          <div className="mb-6">
            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">El teu Nickname</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
              placeholder="Introdueix el teu nom..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-emerald-500/50 transition-all text-lg shadow-inner"
            />
          </div>

          {/* Selector de mode de joc (Respectant l'estat original) */}
          {tab !== 'join' && (
            <div className="mb-6">
              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">Regió de joc</label>
              <div className="flex bg-black/40 rounded-xl p-1 gap-2 border border-white/5">
                <button
                  onClick={() => setGameMode('world')}
                  className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${gameMode === 'world' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                >
                  🌎 MÓN
                </button>
                <button
                  onClick={() => setGameMode('catalunya')}
                  className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${gameMode === 'catalunya' ? 'bg-yellow-400 text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                >
                  🔴🟡 CATALUNYA
                </button>
              </div>
            </div>
          )}
          {/* Selector de Ritme de joc */}
          {tab !== 'join' && (
            <div className="mb-6">
              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">Ritme de joc</label>
              <div className="flex bg-black/40 rounded-xl p-1 gap-1 border border-white/5">
                <button
                  onClick={() => setTimeMode('bala')}
                  className={`flex-1 py-3 text-[9px] font-black rounded-lg transition-all ${timeMode === 'bala' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                >
                  ⚡ BALA (1m)
                </button>
                <button
                  onClick={() => setTimeMode('normal')}
                  className={`flex-1 py-3 text-[9px] font-black rounded-lg transition-all ${timeMode === 'normal' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                >
                  🚶 NORMAL (5m)
                </button>
                <button
                  onClick={() => setTimeMode('infinit')}
                  className={`flex-1 py-3 text-[9px] font-black rounded-lg transition-all ${timeMode === 'infinit' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                >
                  ♾️ SENSE TEMPS
                </button>
              </div>
            </div>
          )}

          {/* Tabs Navegació */}
          <div className="flex bg-black/40 rounded-xl p-1 mb-8 gap-1 border border-white/5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all ${tab === t.id ? 'bg-emerald-500 text-black' : 'text-gray-500 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contingut del Tab (Botons d'Acció Principals) */}
          <div className="space-y-4">
            {tab === 'solo' && (
              <button
                onClick={handleSolo}
                disabled={loading || !playerName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-3xl text-xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-20"
              >
                {loading ? '⌛ PREPARANT...' : '🚀 JUGAR SOL'}
              </button>
            )}

            {tab === 'create' && (
              <button
                onClick={handleCreate}
                disabled={loading || !playerName.trim()}
                className="w-full bg-white text-black font-black py-6 rounded-3xl text-xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-20"
              >
                {loading ? '⌛ CREANT SALA...' : '🏠 CREAR SALA'}
              </button>
            )}

            {tab === 'join' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODI"
                  maxLength={6}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-mono text-2xl focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoin}
                  disabled={loading || !playerName.trim() || joinCode.length < 6}
                  className="bg-indigo-600 px-6 rounded-2xl text-white font-bold hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-20"
                >
                  ➜
                </button>
              </div>
            )}
          </div>

          {/* Missatge d'Error */}
          {error && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] text-center font-bold uppercase tracking-widest">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer amb versió */}
        <p className="text-center text-gray-700 text-[10px] mt-10 font-black uppercase tracking-[0.2em]">
          Versió 1.2.6 • Core Original Restaurat
        </p>
      </div>
    </div>
  );
}