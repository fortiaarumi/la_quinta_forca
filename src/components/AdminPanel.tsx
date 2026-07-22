'use client';

import { useState, useEffect } from 'react';
import { ref, get, set, update, onValue, remove } from 'firebase/database';
import { db, auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/lib/authContext';
import DailyVideo from './DailyVideo';
import { useRouter } from 'next/navigation';
import HistoricViewPane from './HistoricViewPane';

type AdminTab = 'users' | 'rooms' | 'app' | 'proves';

export default function AdminPanel() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('app');
  
  // Estats per a la configuració de l'App
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [testFile, setTestFile] = useState<string>('');

  useEffect(() => {
    if (!isAdmin || activeTab !== 'rooms') return;
    const roomsRef = ref(db, 'rooms');
    const unsub = onValue(roomsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        // Convertim l'objecte en un array per poder-lo llistar
        const roomsArray = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        // Ordenem de més noves a més velles
        roomsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setActiveRooms(roomsArray);
      } else {
        setActiveRooms([]);
      }
    });
    return () => unsub();
  }, [isAdmin, activeTab]);

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm(`Segur que vols esborrar la sala ${roomId}?`)) {
      await remove(ref(db, `rooms/${roomId}`));
    }
  };

  const handleClearAllRooms = async () => {
    if (confirm("🚨 ATENCIÓ: Això tancarà TOTES les partides actuals i farà fora els jugadors. N'estàs segur?")) {
      await remove(ref(db, 'rooms'));
    }
  };
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'users') return;
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const uArray = Object.entries(data).map(([uid, val]: [string, any]) => ({ uid, ...val }));
        // Ordenem alfabèticament pel nom
        uArray.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''));
        setUsersList(uArray);
      } else {
        setUsersList([]);
      }
    });
    return () => unsub();
  }, [isAdmin, activeTab]);

  const handleResetUserPassword = async (email: string) => {
    if (!email) return alert("⚠️ Aquest usuari no té el correu guardat a la base de dades.");
    if (confirm(`Vols enviar un correu de restabliment de contrasenya a ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert('✅ Correu enviat amb èxit!');
      } catch (e: any) {
        alert('❌ Error enviant el correu: ' + e.message);
      }
    }
  };

  const handleDeleteUser = async (uid: string, nickname: string) => {
    if (confirm(`🚨 Segur que vols ESBORRAR el perfil de ${nickname}? No podrà jugar fins que es torni a registrar.`)) {
      await remove(ref(db, `users/${uid}`));
    }
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      await update(ref(db, `users/${editingUser.uid}`), {
        nickname: editingUser.nickname,
        bestScoreWorld_bala: Number(editingUser.bestScoreWorld_bala) || 0,
        bestScoreWorld_normal: Number(editingUser.bestScoreWorld_normal) || 0,
        bestScoreWorld_infinit: Number(editingUser.bestScoreWorld_infinit) || 0,
        bestScoreCatalunya_bala: Number(editingUser.bestScoreCatalunya_bala) || 0,
        bestScoreCatalunya_normal: Number(editingUser.bestScoreCatalunya_normal) || 0,
        bestScoreCatalunya_infinit: Number(editingUser.bestScoreCatalunya_infinit) || 0,
        bestScoreEstadis_bala: Number(editingUser.bestScoreEstadis_bala) || 0,
        bestScoreEstadis_normal: Number(editingUser.bestScoreEstadis_normal) || 0,
        bestScoreEstadis_infinit: Number(editingUser.bestScoreEstadis_infinit) || 0,
        bestScoreCultural_bala: Number(editingUser.bestScoreCultural_bala) || 0,
        bestScoreCultural_normal: Number(editingUser.bestScoreCultural_normal) || 0,
        bestScoreCultural_infinit: Number(editingUser.bestScoreCultural_infinit) || 0,
        bestScorePixapins_bala: Number(editingUser.bestScorePixapins_bala) || 0,
        bestScorePixapins_normal: Number(editingUser.bestScorePixapins_normal) || 0,
        bestScorePixapins_infinit: Number(editingUser.bestScorePixapins_infinit) || 0,
        bestScoreHistoric_bala: Number(editingUser.bestScoreHistoric_bala) || 0,
        bestScoreHistoric_normal: Number(editingUser.bestScoreHistoric_normal) || 0,
        bestScoreHistoric_infinit: Number(editingUser.bestScoreHistoric_infinit) || 0,
        total5k: Number(editingUser.total5k) || 0,
        total5kHistoric: Number(editingUser.total5kHistoric) || 0,
        badges: editingUser.badges || [],
      });
      setEditingUser(null);
      alert('✅ Dades de l\'usuari actualitzades!');
    } catch (e: any) {
      alert('❌ Error guardant: ' + e.message);
    }
  };

  // Carregar la configuració actual de l'App quan obrim el panell
  useEffect(() => {
    if (!isAdmin) return;
    const fetchConfig = async () => {
      const snap = await get(ref(db, 'appConfig/home'));
      if (snap.exists()) {
        const data = snap.val();
        setVideoUrl(data.videoUrl || '');
        setVideoCaption(data.videoCaption || '');
      }
    };
    fetchConfig();
  }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin || activeTab !== 'app') return;
    const sugRef = ref(db, 'suggestions');
    const unsub = onValue(sugRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        arr.sort((a, b) => b.timestamp - a.timestamp); // Els més nous primer
        setSuggestions(arr);
      } else {
        setSuggestions([]);
      }
    });
    return () => unsub();
  }, [isAdmin, activeTab]);

  const handleDeleteSuggestion = async (id: string) => {
    await remove(ref(db, `suggestions/${id}`));
  };

  const handleUseSuggestion = (link: string, userName: string, id: string) => {
    setVideoUrl(link);
    setVideoCaption(`Vídeo suggerit per ${userName}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guardar els canvis del vídeo/text a la base de dades
  const handleSaveAppConfig = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await update(ref(db, 'appConfig/home'), {
        videoUrl: videoUrl.trim(),
        videoCaption: videoCaption.trim(),
        updatedAt: Date.now(),
        updatedBy: user?.uid
      });
      setMsg({ text: 'Configuració actualitzada amb èxit! L\'App ha canviat.', type: 'success' });
    } catch (e: any) {
      setMsg({ text: 'Error guardant: ' + e.message, type: 'error' });
    }
    setLoading(false);
  };

  // Si no ets admin, et fem fora directament amb un missatge clar
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white p-6">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl text-center">
          <h1 className="text-4xl mb-4">⛔</h1>
          <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Accés Denegat</h2>
          <p className="text-gray-400 mt-2 text-sm">Aquesta àrea és exclusiva per al Creador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-white p-6 md:p-12 font-sans relative">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Capçalera Admin */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b border-white/10 pb-6">
          <div>
            <div className="text-emerald-400 text-[10px] font-black tracking-[0.3em] uppercase mb-1">Centre de Comandament</div>
            <h1 className="text-4xl font-black tracking-tight">Panell d&apos;Admin 👑</h1>
          </div>
          <button onClick={() => router.push('/')} className="bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm font-bold transition-all">
            Sortir de l&apos;Admin
          </button>
        </div>

        {/* Pestanyes de navegació */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl mb-8 border border-white/5 overflow-x-auto">
          {([
            { id: 'app', icon: '📱', label: 'App & Vídeo' },
            { id: 'users', icon: '👥', label: 'Gestió Usuaris' },
            { id: 'rooms', icon: '🌍', label: 'Sales Actives' },
            { id: 'proves', icon: '🧪', label: 'Proves' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTINGUT PESTANYA APP (VÍDEO I TEXT) ── */}
        {activeTab === 'app' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in-up">
            <h2 className="text-xl font-black mb-6 text-emerald-400 border-b border-white/10 pb-4">Personalització de l&apos;Inici</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Enllaç del Vídeo (.mp4)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ex: /Rochaesquiant.mp4 o https://..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none text-white transition-all"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">Pots posar un enllaç de la teva carpeta public o un link extern segur.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Títol del Vídeo</label>
                  <input 
                    type="text" 
                    value={videoCaption}
                    onChange={(e) => setVideoCaption(e.target.value)}
                    placeholder="Ex: Roger Bernadó masterclass"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none text-white transition-all"
                  />
                </div>

                {msg.text && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${msg.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {msg.text}
                  </div>
                )}

                <button 
                  onClick={handleSaveAppConfig}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? '⌛ Aplicant canvis...' : '💾 Publicar a tota l\'App'}
                </button>
              </div>

              {/* Vista prèvia de com quedarà */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 text-center">Vista Prèvia</div>
                <div className="mb-3">
                  {videoUrl ? (
                    <DailyVideo 
                      src={videoUrl} 
                      containerClassName="rounded-xl shadow-lg border border-white/10" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">Sense vídeo</div>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-xl">⛷️</span>
                  <div>
                    <p className="text-gray-300 text-xs font-bold m-0">{videoCaption || 'Sense títol'}</p>
                    <p className="text-gray-500 text-[9px] uppercase tracking-widest m-0 mt-1">Video del dia</p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                💡 Bústia de Suggeriments <span className="bg-emerald-500 text-black text-xs px-2 py-1 rounded-full">{suggestions.length}</span>
              </h3>
              
              {suggestions.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No hi ha cap suggeriment pendent.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map((sug) => (
                    <div key={sug.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-emerald-400 text-xs font-bold">{sug.userName}</p>
                          <p className="text-gray-500 text-[10px]">{new Date(sug.timestamp).toLocaleString('ca-ES')}</p>
                        </div>
                        <button onClick={() => handleDeleteSuggestion(sug.id)} className="text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors text-xs" title="Esborrar sense publicar">
                          🗑️
                        </button>
                      </div>
                      <a href={sug.link} target="_blank" rel="noreferrer" className="text-blue-400 text-xs truncate block hover:underline">
                        {sug.link}
                      </a>
                      <button 
                        onClick={() => handleUseSuggestion(sug.link, sug.userName, sug.id)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors mt-auto border border-white/10"
                      >
                        Aplicar a dalt i posar "Suggerit per {sug.userName}"
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── CONTINGUT PESTANYA USUARIS (Fase 3 Completada!) ── */}
        {activeTab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-emerald-400">Base de Dades de Jugadors</h2>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-1">Total Registrats: {usersList.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/10">
                    <th className="pb-3 font-black">Jugador</th>
                    <th className="pb-3 font-black">Avatar</th>
                    <th className="pb-3 font-black">Estat</th>
                    <th className="pb-3 font-black">Rècords (Món / Cat)</th>
                    <th className="pb-3 font-black">5K ⭐</th>
                    <th className="pb-3 font-black text-right">Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          {u.nickname || 'Sense Nom'} 
                          {u.isAdmin && <span className="text-[8px] bg-red-600 px-2 py-0.5 rounded text-white uppercase tracking-widest">Admin</span>}
                        </div>
                        <div className="text-xs text-gray-500">{u.email || 'Sense correu'}</div>
                      </td>
                      <td className="py-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center relative group">
                          {u.avatarUrl ? (
                            <>
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                              <button 
                                onClick={async () => {
                                  if (confirm(`Vols esborrar l'avatar de ${u.nickname}?`)) {
                                    await update(ref(db, `users/${u.uid}`), { avatarUrl: null });
                                  }
                                }}
                                className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                              >
                                BORRAR
                              </button>
                            </>
                          ) : (
                            <span className="text-xs opacity-20">👤</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.status === 'online' ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {u.status === 'online' ? 'En línia' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-gray-300">
                        <span className="text-emerald-400">{Math.max(u.bestScoreWorld_bala||0, u.bestScoreWorld_normal||0, u.bestScoreWorld_infinit||0)}</span> / <span className="text-red-400">{Math.max(u.bestScoreCatalunya_bala||0, u.bestScoreCatalunya_normal||0, u.bestScoreCatalunya_infinit||0)}</span>
                      </td>
                      <td className="py-3 font-bold text-yellow-400">{u.total5k || 0}</td>
                      <td className="py-3 text-right space-x-2">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 p-2 rounded-lg transition-colors"
                          title="Editar Estadístiques i Nom"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleResetUserPassword(u.email)}
                          className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 p-2 rounded-lg transition-colors"
                          title="Enviar correu de restabliment de contrasenya"
                        >
                          🔑
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.uid, u.nickname)}
                          disabled={u.isAdmin} // Protegim els admins perquè no t'esborris a tu mateix!
                          className="bg-red-500/10 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors disabled:opacity-20"
                          title="Esborrar/Banejar Perfil"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL D'EDICIÓ D'USUARIS ── */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black text-white mb-4 border-b border-white/10 pb-2">Editar Usuari</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom (Nickname)</label>
                  {/* TASK 1: maxLength={20} keeps admin-side edits consistent with the public signup cap */}
                  <input type="text" value={editingUser.nickname || ''} onChange={(e) => setEditingUser({...editingUser, nickname: e.target.value})} maxLength={20} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 border-b border-emerald-900/50 pb-1">Món</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScoreWorld_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreWorld_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScoreWorld_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreWorld_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScoreWorld_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreWorld_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 border-b border-red-900/50 pb-1">Catalunya</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScoreCatalunya_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCatalunya_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScoreCatalunya_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCatalunya_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScoreCatalunya_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCatalunya_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 border-b border-blue-900/50 pb-1">Estadis</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScoreEstadis_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreEstadis_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScoreEstadis_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreEstadis_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScoreEstadis_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreEstadis_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 border-b border-purple-900/50 pb-1">Cultural</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScoreCultural_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCultural_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScoreCultural_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCultural_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScoreCultural_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreCultural_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 border-b border-blue-900/50 pb-1">Pixapins (BCN)</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScorePixapins_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScorePixapins_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScorePixapins_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScorePixapins_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScorePixapins_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScorePixapins_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1 border-b border-amber-900/50 pb-1">Històric</label>
                    <div className="space-y-2 mt-2">
                      <input type="number" placeholder="Bala" value={editingUser.bestScoreHistoric_bala || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreHistoric_bala: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Bala" />
                      <input type="number" placeholder="Normal" value={editingUser.bestScoreHistoric_normal || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreHistoric_normal: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Normal" />
                      <input type="number" placeholder="Infinit" value={editingUser.bestScoreHistoric_infinit || 0} onChange={(e) => setEditingUser({...editingUser, bestScoreHistoric_infinit: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs font-mono placeholder:text-gray-600" title="Rècord Infinit" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Total 5K (general)</label>
                    <input type="number" value={editingUser.total5k || 0} onChange={(e) => setEditingUser({...editingUser, total5k: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-yellow-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Total 5K Històrics</label>
                    <input type="number" value={editingUser.total5kHistoric || 0} onChange={(e) => setEditingUser({...editingUser, total5kHistoric: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-amber-700 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Insígnies (Badges)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingUser.badges || []).map((badge: string, bi: number) => (
                      <span key={bi} className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-[10px] font-black flex items-center gap-1">
                        {badge}
                        <button onClick={() => {
                          const newBadges = editingUser.badges.filter((_: any, i: number) => i !== bi);
                          setEditingUser({...editingUser, badges: newBadges});
                        }} className="text-red-400 hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      placeholder="Nova insígnia..." 
                      id="new-badge-input"
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            const newBadges = [...(editingUser.badges || []), val];
                            setEditingUser({...editingUser, badges: newBadges});
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('new-badge-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          const newBadges = [...(editingUser.badges || []), val];
                          setEditingUser({...editingUser, badges: newBadges});
                          input.value = '';
                        }
                      }}
                      className="bg-indigo-600 px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditingUser(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition-colors">Cancel·lar</button>
                <button onClick={handleSaveUserEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black transition-colors shadow-lg shadow-indigo-500/20">💾 Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTINGUT PESTANYA SALES (Fase 2 completada!) ── */}
        {activeTab === 'rooms' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-emerald-400">Control del Servidor</h2>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-1">Sales Actives: {activeRooms.length}</p>
              </div>
              {activeRooms.length > 0 && (
                <button 
                  onClick={handleClearAllRooms}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest transition-all"
                >
                  🚨 Buidar totes les sales
                </button>
              )}
            </div>

            {activeRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest text-sm bg-black/40 rounded-xl border border-white/5">
                No hi ha cap partida en curs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/10">
                      <th className="pb-3 font-black">Codi</th>
                      <th className="pb-3 font-black">Estat</th>
                      <th className="pb-3 font-black">Mode</th>
                      <th className="pb-3 font-black">Jugadors</th>
                      <th className="pb-3 font-black text-right">Acció</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRooms.map((room) => {
                      const playersCount = room.players ? Object.keys(room.players).length : 0;
                      // Donem colors als estats perquè es vegi clar
                      const stateColor = room.gameState === 'playing' ? 'text-emerald-400' 
                                       : room.gameState === 'finished' ? 'text-gray-500' 
                                       : 'text-yellow-400';

                      return (
                        <tr key={room.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 font-mono font-bold text-white">{room.id}</td>
                          <td className={`py-3 font-bold ${stateColor}`}>{room.gameState}</td>
                          <td className="py-3 text-gray-300">
                            {room.gameMode === 'catalunya' ? '🔴🟡 CAT' : '🌍 Món'} <br/>
                            <span className="text-[9px] text-gray-500">{room.timeMode}</span>
                          </td>
                          <td className="py-3 font-bold text-gray-300">{playersCount} / 10</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleDeleteRoom(room.id)}
                              className="bg-red-500/10 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                              title="Esborrar sala"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CONTINGUT PESTANYA PROVES ── */}
        {activeTab === 'proves' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in-up">
            <h2 className="text-xl font-black mb-6 text-emerald-400 border-b border-white/10 pb-4">Proves de Fitxers (Panoràmiques/Vídeos)</h2>
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ruta de l'arxiu (dins de public)</label>
              <input 
                type="text" 
                value={testFile}
                onChange={(e) => setTestFile(e.target.value)}
                placeholder="Ex: historic/graumans_chinese_theatre_opening.webp o historic_5k.mp4"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none text-white transition-all"
              />
              <p className="text-[10px] text-gray-500 mt-2">Posa la ruta a partir de 'public/'. Exemples: <code className="text-emerald-400">historic_5k.mp4</code>, <code className="text-emerald-400">historic/test.webp</code></p>
            </div>

            {testFile && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black relative min-h-[400px] flex items-center justify-center">
                {testFile.endsWith('.mp4') || testFile.endsWith('.webm') ? (
                  <video src={`/${testFile}`} autoPlay controls playsInline className="w-full h-full max-h-[60vh] object-contain" />
                ) : testFile.endsWith('.webp') || testFile.endsWith('.jpg') || testFile.endsWith('.jpeg') ? (
                  <div className="absolute inset-0 w-full h-full">
                    <HistoricViewPane location={{ lat: 0, lng: 0, panoUrl: `/${testFile}`, hasStreetView: false }} />
                  </div>
                ) : (
                  <img src={`/${testFile}`} alt="Prova" className="w-full h-full max-h-[60vh] object-contain" />
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}