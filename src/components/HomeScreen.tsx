'use client';

import { useState, useEffect } from 'react';
import { ref, set, get, query, orderByChild, endAt, remove } from 'firebase/database';
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

  // Camió de les escombraries: Elimina sales de més de 24h quan algú obre la web
  useEffect(() => {
    const netejarBrossa = async () => {
      try {
        const unDia = 24 * 60 * 60 * 1000;
        const limitTemps = Date.now() - unDia;
        
        // Busquem totes les sales creades abans d'ahir a aquesta mateixa hora
        const oldRoomsQuery = query(
          ref(db, 'rooms'), 
          orderByChild('createdAt'), 
          endAt(limitTemps)
        );
        
        const snap = await get(oldRoomsQuery);
        if (snap.exists()) {
          snap.forEach((child) => {
            remove(child.ref); // Esborra la sala
          });
        }
      } catch (e) {
        console.log('Error netejant sales antigues', e);
      }
    };

    netejarBrossa();
  }, []);

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

  // ── DISSENY NOU MODULAR (Adaptatiu Mòbil / PC) ──────────────
  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center bg-[#0a0f1a] overflow-x-hidden p-4 md:p-8 font-sans">
      
      {/* Llums decoratives de fons */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Crèdits d'autor (A dalt a la dreta en PC) */}
      <div className="absolute top-8 right-10 text-right hidden lg:block z-0">
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Projecte Alpha</p>
        <p className="text-white font-medium text-sm italic">Creat per: <span className="text-emerald-400 font-bold not-italic">Fortià Arumí Casals</span></p>
      </div>

      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6 md:gap-8 my-8">
        
        {/* BLOC 1: Logo i Títol */}
        <div className="text-center mt-4 mb-2">
          <div className="text-6xl md:text-8xl mb-4 drop-shadow-[0_0_20px_rgba(52,211,153,0.2)] animate-bounce">🌍</div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 italic">
            LA QUINTA <span className="text-emerald-400 not-italic">FORCA</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px] md:text-xs">Endevina on ets al món</p>
        </div>

        {/* BLOC 2: Identitat (Nickname) */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl max-w-xl w-full mx-auto">
          <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-4 text-center">Identificació</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
            placeholder="Escriu el teu Nickname..."
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all text-xl md:text-2xl text-center font-bold shadow-inner"
          />
        </div>

        {/* BLOC 3: Configuració (Només visible si no t'estàs unint a una sala) */}
        {tab !== 'join' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl w-full mx-auto">
            
            {/* Columna Esquerra: Regió */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col">
              <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-4 text-center">Regió de joc</label>
              <div className="flex flex-col gap-3 flex-1">
                <button
                  onClick={() => setGameMode('world')}
                  className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${gameMode === 'world' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'bg-black/40 text-gray-500 border border-white/5 hover:text-white'}`}
                >
                  🌎 TOT EL MÓN
                </button>
                <button
                  onClick={() => setGameMode('catalunya')}
                  className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${gameMode === 'catalunya' ? 'bg-yellow-400 text-black shadow-lg scale-[1.02]' : 'bg-black/40 text-gray-500 border border-white/5 hover:text-white'}`}
                >
                  🔴🟡 CATALUNYA
                </button>
              </div>
            </div>

            {/* Columna Dreta: Ritme */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col">
              <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-4 text-center">Ritme de joc</label>
              <div className="flex flex-col gap-3 flex-1">
                <button
                  onClick={() => setTimeMode('bala')}
                  className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all ${timeMode === 'bala' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-[1.02]' : 'bg-black/40 text-gray-500 border border-white/5 hover:text-white'}`}
                >
                  ⚡ BALA (1 min)
                </button>
                <button
                  onClick={() => setTimeMode('normal')}
                  className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all ${timeMode === 'normal' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]' : 'bg-black/40 text-gray-500 border border-white/5 hover:text-white'}`}
                >
                  🚶 NORMAL (5 min)
                </button>
                <button
                  onClick={() => setTimeMode('infinit')}
                  className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all ${timeMode === 'infinit' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-[1.02]' : 'bg-black/40 text-gray-500 border border-white/5 hover:text-white'}`}
                >
                  ♾️ SENSE TEMPS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BLOC 4: Acció Principal */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl max-w-xl w-full mx-auto">
          
          {/* Pestanyes d'acció */}
          <div className="flex bg-black/50 rounded-xl p-1 mb-8 gap-1 border border-white/5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${tab === t.id ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Botons d'Inici */}
          <div className="space-y-4">
            {tab === 'solo' && (
              <button
                onClick={handleSolo}
                disabled={loading || !playerName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-2xl text-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-20 tracking-tight"
              >
                {loading ? '⌛ PREPARANT...' : '🚀 JUGAR SOL'}
              </button>
            )}

            {tab === 'create' && (
              <button
                onClick={handleCreate}
                disabled={loading || !playerName.trim()}
                className="w-full bg-white hover:bg-gray-200 text-black font-black py-6 rounded-2xl text-2xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-20 tracking-tight"
              >
                {loading ? '⌛ CREANT SALA...' : '🏠 CREAR SALA'}
              </button>
            )}

            {tab === 'join' && (
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODI"
                  maxLength={6}
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white text-center font-mono text-3xl tracking-widest focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <button
                  onClick={handleJoin}
                  disabled={loading || !playerName.trim() || joinCode.length < 6}
                  className="bg-indigo-600 px-8 py-5 rounded-2xl text-white font-black text-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-20"
                >
                  UNIR-SE
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold uppercase tracking-widest">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer (Només Mòbil) */}
        <div className="text-center lg:hidden mt-4">
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">Versió 1.3 • Disseny Modular</p>
        </div>

      </div>
    </div>
  );
}