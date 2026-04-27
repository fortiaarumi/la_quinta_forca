'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/gameUtils';

// Funció original per gestionar l'ID del jugador
function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('geoPlayerId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('geoPlayerId', id);
  }
  return id;
}

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameMode, setGameMode] = useState<'world' | 'catalunya'>('world');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Lògica per CREAR (Solo o Multi)
  const handleCreateRoom = async (isSingle: boolean) => {
    if (!name.trim()) return setError('Introdueix el teu nom');
    setLoading(true);
    setError('');

    try {
      const playerId = getOrCreatePlayerId();
      const roomCode = generateRoomCode(); // Fem servir el codi de 6 lletres original

      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: { name: name.trim(), joinedAt: Date.now() } },
        currentRound: 0,
        gameState: 'lobby',
        createdAt: Date.now(),
        isSinglePlayer: isSingle,
        gameMode,
      });

      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      localStorage.setItem('geoPlayerName', name.trim());
      router.push(`/room/${roomCode}`);
    } catch (err) {
      setError('Error en crear la partida.');
      setLoading(false);
    }
  };

  // Lògica per UNIR-SE (Nova en el disseny Pro)
  const handleJoinRoom = async () => {
    if (!name.trim()) return setError('Introdueix el teu nom');
    if (!joinCode.trim() || joinCode.length < 6) return setError('Codi de sala invàlid');
    
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

      const playerId = getOrCreatePlayerId();
      const existingPlayers = Object.keys(room.players || {});
      
      if (existingPlayers.length >= 2 && !existingPlayers.includes(playerId)) {
        setError('La sala és plena.');
        return setLoading(false);
      }

      if (!existingPlayers.includes(playerId)) {
        await set(ref(db, `rooms/${code}/players/${playerId}`), {
          name: name.trim(),
          joinedAt: Date.now(),
        });
        await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
      }

      localStorage.setItem('geoPlayerName', name.trim());
      router.push(`/room/${code}`);
    } catch (err) {
      setError('Error en unir-se a la sala.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1a] overflow-hidden">
      
      {/* Decoració de fons */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]" />

      {/* Crèdits */}
      <div className="absolute top-6 right-8 text-right hidden sm:block">
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Projecte Alpha</p>
        <p className="text-white font-medium text-xs">Creat per: <span className="text-emerald-400">Fortià Arumí Casals</span></p>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">
            LA QUINTA <span className="text-emerald-400">FORCA</span>
          </h1>
          <p className="text-gray-400 font-medium text-sm">Endevina on ets al món</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          
          {/* Input Nom */}
          <div className="mb-6">
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">El teu Nickname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ex: ElMestreDelsMapes"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Selector Regió */}
          <div className="mb-8">
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 ml-1">Regió de joc</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGameMode('world')}
                className={`py-3 rounded-xl font-bold text-xs transition-all ${gameMode === 'world' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                🌎 Tot el Món
              </button>
              <button
                onClick={() => setGameMode('catalunya')}
                className={`py-3 rounded-xl font-bold text-xs transition-all ${gameMode === 'catalunya' ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                🔴🟡 Catalunya
              </button>
            </div>
          </div>

          {/* Botons d'Acció */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleCreateRoom(true)}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'CARREGANT...' : '▶ JUGAR SOL'}
            </button>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => handleCreateRoom(false)}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl text-xs transition-all"
              >
                ➕ Crear Sala
              </button>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  placeholder="Codi"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 text-center text-white focus:outline-none focus:border-indigo-500/50 text-xs font-mono"
                />
                <button 
                  onClick={handleJoinRoom}
                  className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-all"
                >
                  ➜
                </button>
              </div>
            </div>
          </div>

          {/* Missatge d'Error */}
          {error && (
            <p className="text-red-400 text-[10px] text-center mt-4 font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              ⚠️ {error}
            </p>
          )}
        </div>
        
        <p className="text-center text-gray-600 text-[10px] mt-8 font-medium">
          Versió 1.2.0 • Sistema de coordenades verificat
        </p>
      </div>
    </div>
  );
}