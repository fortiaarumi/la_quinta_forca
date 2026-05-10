'use client';

import { useAuth } from '@/lib/authContext';
import { ALL_BADGES } from '@/lib/badges';
import { getUserProfile } from '@/lib/userStats';
import { UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function BadgesPage() {
  const { badges, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null); // 👈 NOU: Controla el pop-up

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
    }
  }, [user]);

  const togglePin = async (badgeId: string) => {
    if (!user || !profile) return;
    const currentPins = profile.selectedBadges || [];
    let newPins = [...currentPins];
    
    if (newPins.includes(badgeId)) {
      newPins = newPins.filter(id => id !== badgeId);
    } else {
      if (newPins.length >= 3) {
        alert("Només pots fixar un màxim de 3 insígnies per mostrar a la sala d'espera i partida.");
        return;
      }
      newPins.push(badgeId);
    }
    
    setProfile({ ...profile, selectedBadges: newPins });
    await update(ref(db, `users/${user.uid}`), { selectedBadges: newPins });
  };

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
                    const userData: any = profile || {};
                    const currentVal = b.field ? (userData[b.field] || 0) : 0;
                    const hasProgress = !!b.totalGoal;
                    const progressPercent = hasProgress ? Math.min(100, (currentVal / b.totalGoal!) * 100) : 0;

                    return (
                      <tr
                        key={b.id}
                        className={`border-b border-white/5 transition-all duration-500 hover:bg-white/5 cursor-pointer ${isUnlocked ? 'bg-indigo-500/5' : ''}`}
                        onClick={() => setSelectedBadge(b.id)} // 👈 Clic a tota la fila obre el pop-up
                      >
                        <td className="p-5">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border transition-all relative ${isUnlocked ? 'bg-indigo-600/30 border-yellow-500/60 scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-gray-800/50 border-white/5'}`}>
                            {/* IMATGE DE LA INSÍGNIA */}
                            <img
                              src={b.image || '/badges/default.jpeg'}
                              alt={b.id}
                              className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${isUnlocked ? 'grayscale-0 opacity-100' : 'grayscale opacity-40'}`}
                            />
                            {/* XINXETA (Si està fixada) */}
                            {profile?.selectedBadges?.includes(b.id) && (
                              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-1 shadow-md z-10 w-6 h-6 flex items-center justify-center text-xs">
                                📌
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-black text-lg ${isUnlocked ? 'text-white drop-shadow-md' : 'text-gray-500'}`}>{b.label}</h3>
                            {profile?.selectedBadges?.includes(b.id) && <span className="text-yellow-500 text-sm">📌</span>}
                          </div>
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
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isUnlocked
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

      {/* 👈 NOU: POP-UP (MODAL) QUAN CLIQUES UNA INSÍGNIA */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-[#0c0f1a] border-2 border-indigo-500/30 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_80px_rgba(99,102,241,0.3)] relative cursor-default"
            onClick={(e) => e.stopPropagation()} /* Evita que es tanqui si fas clic al blanc */
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white text-2xl bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
            {(() => {
              const bDef = ALL_BADGES.find(b => b.id === selectedBadge);
              const isUnlocked = badges.includes(selectedBadge);
              return (
                <div className="flex flex-col items-center">
                  <div className={`w-40 h-40 mb-8 relative rounded-2xl overflow-hidden shadow-2xl border-4 ${isUnlocked ? 'border-yellow-500' : 'border-gray-700'}`}>
                    {/* Brillo darrere si està desbloquejada */}
                    {isUnlocked && <div className="absolute inset-0 bg-yellow-500/30 blur-2xl animate-pulse z-0" />}

                    <img
                      src={bDef?.image || '/badges/default.jpeg'}
                      alt={selectedBadge}
                      className={`w-full h-full object-cover relative z-10 hover:scale-110 transition-transform duration-500 ${!isUnlocked ? 'grayscale opacity-50' : ''}`}
                    />
                  </div>

                  <h2 className={`text-3xl font-black uppercase italic tracking-tighter mb-3 ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                    {bDef?.label}
                  </h2>
                  <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-8 px-4">
                    {bDef?.desc}
                  </p>

                  <div className={`px-8 py-3 rounded-full border mb-2 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                      {isUnlocked ? '🌟 Desbloquejada' : '🔒 Bloquejada'}
                    </p>
                  </div>
                  
                  {isUnlocked && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(selectedBadge); }}
                      className={`mt-4 w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all
                        ${profile?.selectedBadges?.includes(selectedBadge) 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'}`}
                    >
                      {profile?.selectedBadges?.includes(selectedBadge) ? 'Treu la xinxeta' : '📌 Fixa la insígnia'}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
