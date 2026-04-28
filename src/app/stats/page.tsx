'use client';

import { useState, useEffect } from 'react';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

interface UserStats {
  uid: string;
  nickname: string;
  isAdmin?: boolean;
  bestScoreWorld: number;
  bestScoreCatalunya: number;
  total5k: number;
}

export default function StatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]); // Canviem a any[] pels camps dinàmics
  const [mode, setMode] = useState<'world' | 'catalunya' | '5k'>('world');
  const [timeFilter, setTimeFilter] = useState<'bala' | 'normal' | 'infinit'>('bala'); // 👈 AFEGIT

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const usersRef = ref(db, 'users');
        
        // Construïm el camp exacte que volem buscar
        const field = mode === '5k' 
          ? 'total5k' 
          : mode === 'world' 
            ? `bestScoreWorld_${timeFilter}` 
            : `bestScoreCatalunya_${timeFilter}`;
            
        const q = query(usersRef, orderByChild(field), limitToLast(10));
        
        const snap = await get(q);
        if (snap.exists()) {
          const data: UserStats[] = [];
          snap.forEach((child) => {
            data.push({ uid: child.key, ...child.val() });
          });
          // Invertim l'ordre per tenir els més alts a dalt
          setRanking(data.reverse());
        }
      } catch (error) {
        console.error("Error carregant rànquings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [mode, timeFilter]); // 👈 AQUÍ AFEGIM EL timeFilter

  return (
    <div className="relative min-h-screen w-full bg-[#0a0f1a] text-white p-6 md:p-12 overflow-x-hidden font-sans">
      {/* Fons decoratiu (igual que a la Home) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Capçalera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8 pt-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight">
              RÀNQUINGS <span className="text-emerald-400 not-italic block md:inline">GLOBALS</span>
            </h1>
            <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold mt-3">Hall of Fame — La Quinta Forca</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            ← Tornar al Joc
          </button>
        </div>

        {/* Selector de Rànquing */}
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-8 gap-1">
          <button 
            onClick={() => setMode('world')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'world' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            🌎 Mode Món
          </button>
          <button 
            onClick={() => setMode('catalunya')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'catalunya' ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            🔴 Mode Catalunya
          </button>
          <button 
            onClick={() => setMode('5k')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === '5k' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            🏆 Mestres 5K
          </button>
        </div>

        {/* AFEGIT: Selector de Temps (només es mostra si no estem a Mestres 5K) */}
        {mode !== '5k' && (
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-8 gap-1 max-w-md mx-auto">
            <button onClick={() => setTimeFilter('bala')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'bala' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>⚡ Bala</button>
            <button onClick={() => setTimeFilter('normal')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'normal' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>🚶 Normal</button>
            <button onClick={() => setTimeFilter('infinit')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'infinit' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>♾️ Infinit</button>
          </div>
        )}

        {/* Taula de Rànquing */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
              Carregant dades del servidor...
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[700px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Pos</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Explorador</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">
                      {mode === '5k' ? 'Rondes Perfectes' : 'Màxima Puntuació'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((player, index) => (
                    <tr 
                      key={player.uid} 
                      className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${user?.uid === player.uid ? 'bg-emerald-500/10' : ''}`}
                    >
                      <td className="p-6 font-black text-xl italic opacity-30 italic">#{index + 1}</td>
                      <td className="p-6">
                      <div className="font-bold text-lg flex items-center gap-2">
                        {player.nickname}
                        {player.isAdmin && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-md font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.6)]">👑 ADMIN</span>}
                      </div>
                      {user?.uid === player.uid && <span className="text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block">Tu</span>}
                    </td>
                      <td className="p-6 text-right font-mono text-2xl font-black text-emerald-400">
                        {mode === '5k' ? player.total5k : player[mode === 'world' ? `bestScoreWorld_${timeFilter}` : `bestScoreCatalunya_${timeFilter}`] || 0}
                      </td>
                    </tr>
                  ))}
                  {ranking.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-20 text-center text-gray-600 uppercase text-xs font-bold">Encara no hi ha dades en aquest rànquing.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Peu de pàgina estadístic */}
        <p className="text-center mt-12 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
          Dades actualitzades en temps real • Firebase Auth Engine
        </p>
      </div>
    </div>
  );
}