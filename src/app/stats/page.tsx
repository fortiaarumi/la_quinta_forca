'use client';

import { useState, useEffect } from 'react';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { ALL_BADGES } from '@/lib/badges';

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
  const [mode, setMode] = useState<'world' | 'catalunya' | 'pixapins' | 'estadis' | 'cultural' | 'historic' | '5k' | '5k_historic'>('world');
  const [timeFilter, setTimeFilter] = useState<'bala' | 'normal' | 'infinit'>('bala');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const usersRef = ref(db, 'users');

        // Construïm el camp exacte que volem buscar
        let field = 'total5k';
        if (mode === '5k_historic') {
          field = 'total5kHistoric';
        } else if (mode !== '5k') {
          // Mirem quin mode és i li concatenem el temps
          if (mode === 'world') field = `bestScoreWorld_${timeFilter}`;
          else if (mode === 'catalunya') field = `bestScoreCatalunya_${timeFilter}`;
          else if (mode === 'pixapins') field = `bestScorePixapins_${timeFilter}`;
          else if (mode === 'estadis') field = `bestScoreEstadis_${timeFilter}`;
          else if (mode === 'cultural') field = `bestScoreCultural_${timeFilter}`;
          else if (mode === 'historic') field = `bestScoreHistoric_${timeFilter}`;
        }

        const q = query(usersRef, orderByChild(field), limitToLast(10));

        const snap = await get(q);
        if (snap.exists()) {
          const data: any[] = [];
          snap.forEach((child) => {
            const val = child.val();
            const score = val[field] ?? 0;
            if (score > 0 || mode === '5k' || mode === '5k_historic') { // Filtrem per no mostrar gent amb 0 (excepte si és 5k i el field és total5k)
              data.push({ uid: child.key, ...val });
            }
          });

          // Ordenació manual extra per seguretat (Firebase a vegades és lent amb índexs nous)
          data.sort((a, b) => {
            const scoreA = a[field] ?? 0;
            const scoreB = b[field] ?? 0;
            return scoreB - scoreA;
          });

          setRanking(data);
        } else {
          setRanking([]);
        }
      } catch (error) {
        console.error("Error carregant rànquings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [mode, timeFilter]);

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

        {/* Selector de Rànquing (Horitzontal Scrollable per escalar millor i més elegant) */}
        <div className="overflow-x-auto pb-4 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex bg-black/40 p-2 rounded-[2rem] border border-white/5 gap-2 min-w-max">
            <button onClick={() => setMode('world')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'world' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>🌎 Món</button>
            <button onClick={() => setMode('catalunya')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'catalunya' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>🚩 Catalunya</button>
            <button onClick={() => setMode('pixapins')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'pixapins' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>🏙️ Pixapins</button>
            <button onClick={() => setMode('estadis')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'estadis' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>⚽ Estadis</button>
            <button onClick={() => setMode('cultural')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'cultural' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>🏛️ Cultura</button>
            <button onClick={() => setMode('historic')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'historic' ? 'bg-[rgb(126,104,78)] text-white shadow-[0_0_20px_rgba(126,104,78,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>⏳ Històric</button>
            <button onClick={() => setMode('5k')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === '5k' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>🏆 5K</button>
            <button onClick={() => setMode('5k_historic')} className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === '5k_historic' ? 'bg-amber-700 text-white shadow-[0_0_20px_rgba(180,83,9,0.3)] scale-105' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>📜 5K Històrics</button>
          </div>
        </div>

        {/* AFEGIT: Selector de Temps (només es mostra si no estem a Mestres 5K) */}
        {!mode.startsWith('5k') && (
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-8 gap-1 max-w-md mx-auto">
            <button onClick={() => setTimeFilter('bala')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'bala' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>⚡ Bala</button>
            <button onClick={() => setTimeFilter('normal')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'normal' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>🚶 Normal</button>
            <button onClick={() => setTimeFilter('infinit')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === 'infinit' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>♾️ Infinit</button>
          </div>
        )}

        {/* Taula de Rànquing */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
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
                      {mode.startsWith('5k') ? 'Rondes Perfectes' : 'Màxima Puntuació'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((player, index) => (
                    <tr
                      key={player.uid}
                      className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] animate-slide-up opacity-0 ${user?.uid === player.uid ? 'bg-emerald-500/10' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="p-6 font-black text-xl italic opacity-30 italic">#{index + 1}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 flex-shrink-0 flex items-center justify-center">
                            {player.avatarUrl ? (
                              <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg opacity-40">👤</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 pb-1">
                            <div className="font-bold text-lg flex items-center gap-2 flex-wrap">
                              <span className="break-words">{player.nickname}</span>
                              {player.isAdmin && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-md font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.6)]">👑 ADMIN</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                              {user?.uid === player.uid && <span className="text-[8px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter h-fit">Tu</span>}
                              {player.badges && player.badges.map((bId: string, bi: number) => {
                                const badgeDef = ALL_BADGES.find(b => b.id === bId);
                                return (
                                  <div
                                    key={bi}
                                    className="group relative flex items-center justify-center cursor-pointer p-0.5"
                                    onClick={() => setSelectedBadge(bId)}
                                  >
                                    <img
                                      src={badgeDef?.image || '/badges/default.png'}
                                      alt={bId}
                                      className="w-6 h-6 object-contain drop-shadow-md group-hover:scale-125 transition-transform"
                                    />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-yellow-500/50 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
                                      {bId}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right font-mono text-2xl font-black text-emerald-400">
                        {mode === '5k' ? player.total5k : (
                          mode === '5k_historic' ? player.total5kHistoric : (
                            mode === 'world' ? player[`bestScoreWorld_${timeFilter}`] :
                              mode === 'catalunya' ? player[`bestScoreCatalunya_${timeFilter}`] :
                                mode === 'pixapins' ? player[`bestScorePixapins_${timeFilter}`] :
                                  mode === 'estadis' ? player[`bestScoreEstadis_${timeFilter}`] :
                                    mode === 'historic' ? player[`bestScoreHistoric_${timeFilter}`] :
                                      player[`bestScoreCultural_${timeFilter}`]
                          )
                        ) || 0}
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

      {}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-[#0c0f1a] border-2 border-indigo-500/30 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_80px_rgba(99,102,241,0.3)] relative cursor-default"
            onClick={(e) => e.stopPropagation()} /* Evita tancar si cliques a dins la caixa blanca */
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white text-2xl bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
            {(() => {
              const bDef = ALL_BADGES.find(b => b.id === selectedBadge);
              return (
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 mb-6 relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
                    <img
                      src={bDef?.image || '/badges/default.png'}
                      alt={selectedBadge}
                      className="w-full h-full object-contain relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">{bDef?.label}</h2>
                  <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-6">
                    {bDef?.desc}
                  </p>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                      Insígnia de La Quinta Forca
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}