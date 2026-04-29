'use client';

import { useState, useEffect } from 'react';
import { ref, get, set, update, onValue, remove } from 'firebase/database'; // 👈 AFEGITS onValue i remove
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';

type AdminTab = 'users' | 'rooms' | 'app';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('app');
  
  // Estats per a la configuració de l'App
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 👈 AFEGIT: Estats i funcions per a les Sales
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

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
            <h1 className="text-4xl font-black tracking-tight">Panell d'Admin 👑</h1>
          </div>
          <button onClick={() => window.location.href = '/'} className="bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm font-bold transition-all">
            Sortir de l'Admin
          </button>
        </div>

        {/* Pestanyes de navegació */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl mb-8 border border-white/5 overflow-x-auto">
          {([
            { id: 'app', icon: '📱', label: 'App & Vídeo' },
            { id: 'users', icon: '👥', label: 'Gestió Usuaris' },
            { id: 'rooms', icon: '🌍', label: 'Sales Actives' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
            <h2 className="text-xl font-black mb-6 text-emerald-400 border-b border-white/10 pb-4">Personalització de l'Inici</h2>
            
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
                <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black aspect-video mb-3">
                  {videoUrl ? (
                    <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
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
          </div>
        )}

        {/* ── CONTINGUT PESTANYA USUARIS (Ho farem a la Fase 3) ── */}
        {activeTab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center animate-fade-in-up">
            <h2 className="text-2xl font-black text-white mb-2">Base de Dades de Jugadors</h2>
            <p className="text-gray-400">Aquí carregarem tota la llista d'usuaris per editar stats, noms i forçar el restabliment de contrasenyes.</p>
            <div className="mt-6 text-emerald-400 font-bold uppercase tracking-widest text-sm">Això ho programarem al proper pas! 🛠️</div>
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

      </div>
    </div>
  );
}