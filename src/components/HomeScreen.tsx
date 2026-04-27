'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameMode, setGameMode] = useState<'world' | 'catalunya'>('world');
  const router = useRouter();

  // Funció per crear sala (Multijugador)
  const createRoom = async (isSingle: boolean) => {
    if (!name.trim()) return alert('Posa el teu nom!');
    const roomRef = push(ref(db, 'rooms'));
    const roomId = roomRef.key!;
    const playerId = Math.random().toString(36).substring(7);

    await set(roomRef, {
      hostId: playerId,
      gameState: 'lobby',
      gameMode: gameMode,
      isSinglePlayer: isSingle,
      createdAt: Date.now(),
      players: {
        [playerId]: { name, isAdmin: true }
      }
    });

    localStorage.setItem('geoPlayerId', playerId);
    localStorage.setItem('geoPlayerName', name);
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1a] overflow-hidden">
      
      {/* 1. DECORACIÓ DE FONS (Efecte de llums) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]" />

      {/* 2. CRÈDITS (Dalt a la dreta) */}
      <div className="absolute top-6 right-8 text-right">
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-1">Projecte Alpha</p>
        <p className="text-white font-medium text-sm">Creat per: <span className="text-emerald-400">Fortià Arumí Casals</span></p>
      </div>

      {/* 3. CONTENIDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* LOGO */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
            LA QUINTA <span className="text-emerald-400">FORCA</span>
          </h1>
          <p className="text-gray-400 font-medium">Endevina on ets al món</p>
        </div>

        {/* TARGETA DE JOC */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          
          {/* INPUT NOM */}
          <div className="mb-8">
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">El teu Nickname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: ElMestreDelsMapes"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all text-lg"
            />
          </div>

          {/* SELECTOR DE MODE (Món / Catalunya) */}
          <div className="mb-10">
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Regió de joc</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGameMode('world')}
                className={`py-3 rounded-xl font-bold transition-all ${gameMode === 'world' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                🌎 Tot el Món
              </button>
              <button
                onClick={() => setGameMode('catalunya')}
                className={`py-3 rounded-xl font-bold transition-all ${gameMode === 'catalunya' ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                🔴🟡 Catalunya
              </button>
            </div>
          </div>

          {/* BOTONS D'ACCIÓ */}
          <div className="flex flex-col gap-4">
            {/* BOTÓ PRINCIPAL - JUGAR SOL */}
            <button
              onClick={() => createRoom(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl text-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <span>🚀</span> JUGAR SOL
            </button>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => createRoom(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                ➕ Crear Sala
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Codi"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 text-center text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-gray-600 text-xs mt-8 font-medium">
          Versió 1.2.0 • Sistema de coordenades verificat
        </p>
      </div>
    </div>
  );
}