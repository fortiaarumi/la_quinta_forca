'use client';

import { useAuth } from '@/lib/authContext';
import { ALL_BADGES } from '@/lib/badges';
import Link from 'next/link';

export default function BadgesPage() {
  const { badges, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#06080f] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <span className="text-xl">←</span> Tornar
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tighter">🏆 Col·lecció d'Insígnies</h1>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {!user ? (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 text-center">
            <p className="text-indigo-200 mb-4 font-bold">Has d'iniciar sessió per veure les teves insígnies.</p>
            <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg">
              Anar a l'Inici
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Icona</th>
                    <th className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalls</th>
                    <th className="p-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estat</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_BADGES.map((b) => {
                    const isUnlocked = badges.includes(b.id);
                    const profile: any = user || {};
                    const currentVal = b.field ? (profile[b.field] || 0) : 0;
                    const hasProgress = !!b.totalGoal;
                    const progressPercent = hasProgress ? Math.min(100, (currentVal / b.totalGoal!) * 100) : 0;

                    return (
                      <tr key={b.id} className={`border-b border-white/5 transition-all duration-500 ${isUnlocked ? 'bg-indigo-500/5' : 'opacity-60 grayscale'}`}>
                        <td className="p-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl border ${isUnlocked ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-gray-800 border-white/5'}`}>
                            {isUnlocked ? '🏅' : '🔒'}
                          </div>
                        </td>
                        <td className="p-5">
                          <h3 className={`font-black text-lg ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{b.label}</h3>
                          <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">{b.desc}</p>
                          
                          {/* Barra de Progrés */}
                          {hasProgress && !isUnlocked && (
                            <div className="mt-3 w-full max-w-[200px]">
                              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                <span>Progrés</span>
                                <span>{currentVal} / {b.totalGoal}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            isUnlocked 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-white/5 text-gray-500 border-white/10'
                          }`}>
                            {isUnlocked ? 'Desbloquejada' : 'Bloquejada'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Més insígnies properament... 🎉
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
