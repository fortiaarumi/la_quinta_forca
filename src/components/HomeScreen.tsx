'use client';

import { useState, useEffect } from 'react';
import { ref, set, get, query, orderByChild, endAt, remove, onValue, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/gameUtils';
import { useRouter } from 'next/navigation';
import { GameMode } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { getUserProfile } from '@/lib/userStats';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils'; // 👈 AFEGIT
import Link from 'next/link';
import FriendsTab from './FriendsTab';

// Per a convidats: manté el localStorage ID
function getOrCreateGuestId(): string {
  let id = localStorage.getItem('geoPlayerId');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('geoPlayerId', id); }
  return id;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, nickname, isAdmin, isGuest, logout } = useAuth();

  // L'ID del jugador és el UID de Firebase si està loguejat, o el localStorage si és convidat
  const getPlayerId = () => user ? user.uid : getOrCreateGuestId();

  // Nom pre-emplenat: nickname d'auth > guestNick guardat > buit
  const defaultName = nickname ?? localStorage.getItem('geoGuestName') ?? '';

  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'solo' | 'create' | 'join'>('solo');
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [timeMode, setTimeMode] = useState<'bala' | 'normal' | 'infinit'>('bala');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AFEGIT: Per canviar entre menú de joc i menú d'amics
  const [activeMenu, setActiveMenu] = useState<'play' | 'friends'>('play');
  
  // AFEGIT: Variables del vídeo dinàmic i suggeriments
  const [homeVideoUrl, setHomeVideoUrl] = useState('/Rochaesquiant.mp4');
  const [homeVideoCaption, setHomeVideoCaption] = useState('Roger Bernadó masterclass esquiant');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestLink, setSuggestLink] = useState('');
  const [suggestMsg, setSuggestMsg] = useState({ text: '', type: '' });
  
  // AFEGIT: Variable per guardar la invitació que ens arriba
  const [activeInvite, setActiveInvite] = useState<{roomId: string, from: string} | null>(null);
  const [activeFriendReq, setActiveFriendReq] = useState<{uid: string, nickname: string} | null>(null);

  // ── Llegir Vídeo Dinàmic des de Firebase ──
  useEffect(() => {
    const unsub = onValue(ref(db, 'appConfig/home'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.videoUrl) setHomeVideoUrl(data.videoUrl);
        if (data.videoCaption) setHomeVideoCaption(data.videoCaption);
      }
    });
    return () => unsub();
  }, []);

  // ── Enviar Suggeriment de Vídeo ──
  const handleSuggestVideo = async () => {
    if (!suggestLink.trim() || !user) return;
    try {
      const suggestId = crypto.randomUUID();
      await set(ref(db, `suggestions/${suggestId}`), {
        userId: user.uid,
        userName: nickname || 'Convidat',
        link: suggestLink.trim(),
        timestamp: Date.now(),
        status: 'pending'
      });
      setSuggestMsg({ text: '✅ Suggeriment enviat! Gràcies.', type: 'success' });
      setSuggestLink('');
      setTimeout(() => setShowSuggestModal(false), 2000);
    } catch (error) {
      setSuggestMsg({ text: '❌ Error en enviar.', type: 'error' });
    }
  };

  // ── EL GUÀRDIA DE SEGURETAT DEL LÍMIT DIARI ──
  const MAX_DAILY_ROOMS = 500; // 👈 Pots canviar aquest límit al que tu vulguis

  const checkDailyLimit = async () => {
    // Agafem la data d'avui en format "YYYY-MM-DD" (ex: "2026-04-28")
    const today = new Date().toISOString().split('T')[0]; 
    const limitRef = ref(db, `dailyLimits/${today}/roomsCreated`);
    
    // Fem una transacció segura per sumar 1
    const result = await runTransaction(limitRef, (currentCount) => {
      if (currentCount >= MAX_DAILY_ROOMS) {
        return; // Si ja estem al límit, avortem la missió (no sumem res)
      }
      return (currentCount || 0) + 1; // Si no, sumem 1 a la llista d'avui
    });
    
    // Retorna 'true' si ens ha deixat sumar, o 'false' si ha avortat pel límit
    return result.committed; 
  };

  // AFEGIT: El radar de peticions d'amistat
  useEffect(() => {
    if (!user) return;
    const reqRef = ref(db, `users/${user.uid}/friendRequests`);
    const unsub = onValue(reqRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const firstUid = Object.keys(data)[0];
        const uSnap = await get(ref(db, `users/${firstUid}/nickname`));
        setActiveFriendReq({ uid: firstUid, nickname: uSnap.exists() ? uSnap.val() : 'Un explorador' });
      } else {
        setActiveFriendReq(null);
      }
    });
    return () => unsub();
  }, [user]);

  // AFEGIT: El radar d'invitacions (La Bústia)
  useEffect(() => {
    if (!user) return;
    const invitesRef = ref(db, `users/${user.uid}/invites`);
    
    // Escoltem constantment la nostra carpeta d'invitacions
    const unsub = onValue(invitesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        // Agafem la primera invitació que trobem
        const firstRoomId = Object.keys(data)[0];
        setActiveInvite({ roomId: firstRoomId, from: data[firstRoomId].from });
      } else {
        setActiveInvite(null); // Si no hi ha res, amaguem el pop-up
      }
    });
    return () => unsub();
  }, [user]);

  // Funcions per als botons del pop-up
  const acceptInvite = async () => {
    if (!activeInvite || !user) return;
    
    const code = activeInvite.roomId;
    const playerId = user.uid;
    const playerNameToJoin = nickname ?? 'Convidat';

    try {
      // 1. Llegim la sala per assegurar-nos que existeix
      const snap = await get(ref(db, `rooms/${code}`));
      if (snap.exists()) {
        const room = snap.val();
        const existing = Object.keys(room.players || {});
        
        // 2. Si el jugador encara no hi és, l'apuntem oficialment a la sala
        if (!existing.includes(playerId)) {
          await set(ref(db, `rooms/${code}/players/${playerId}`), { 
            name: playerNameToJoin, 
            joinedAt: Date.now(), 
            isAdmin: !!isAdmin 
          });
          await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
        }
      }
      
      // 3. Esborrem la carta de la bústia i viatgem a la sala
      await remove(ref(db, `users/${user.uid}/invites/${code}`));
      setActiveInvite(null); // Tanquem el pop-up
      router.push(`/room/${code}`);
      
    } catch (error) {
      console.error("Error en acceptar la invitació:", error);
    }
  };

  const declineInvite = async () => {
    if (!activeInvite || !user) return;
    await remove(ref(db, `users/${user.uid}/invites/${activeInvite.roomId}`)); // Llencem la carta
    setActiveInvite(null);
  };

  // 👈 AFEGIT: Funcions per al pop-up d'amistat
  const acceptFriend = async () => {
    if (!activeFriendReq || !user) return;
    await acceptFriendRequest(user.uid, activeFriendReq.uid);
    setActiveFriendReq(null);
  };

  const declineFriend = async () => {
    if (!activeFriendReq || !user) return;
    await rejectFriendRequest(user.uid, activeFriendReq.uid);
    setActiveFriendReq(null);
  };

  // Estadístiques de l'usuari autenticat per la columna dreta
  const [myBestWorld, setMyBestWorld] = useState<number | null>(null);
  const [myBestCat, setMyBestCat] = useState<number | null>(null);
  const [my5k, setMy5k] = useState<number | null>(null);

  useEffect(() => {
    setPlayerName(defaultName);
  }, [defaultName]);

  // Carrega les estadístiques de l'usuari loguejat
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile) {
        setMyBestWorld(profile.bestScoreWorld);
        setMyBestCat(profile.bestScoreCatalunya);
        setMy5k(profile.total5k);
      }
    });
  }, [user]);

  // Neteja de sales antigues (>24h)
  useEffect(() => {
    const netejarBrossa = async () => {
      try {
        const unDia = 24 * 60 * 60 * 1000;
        const limitTemps = Date.now() - unDia;
        const oldRoomsQuery = query(ref(db, 'rooms'), orderByChild('createdAt'), endAt(limitTemps));
        const snap = await get(oldRoomsQuery);
        if (snap.exists()) snap.forEach((child) => { remove(child.ref); });
      } catch (e) { console.log('Error netejant sales antigues', e); }
    };
    netejarBrossa();
  }, []);

  const handleSolo = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    setLoading(true); setError('');
    try {
      // 1. Demanem permís al guàrdia
      const canCreate = await checkDailyLimit();
      if (!canCreate) {
        setLoading(false);
        return setError(`S'ha arribat al límit diari de ${MAX_DAILY_ROOMS} partides. Espera a demà per seguir jugant! 🛑`);
      }

      // 2. Si hi ha permís, creem la sala
      const playerId = getPlayerId();
      const roomCode = generateRoomCode();
      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: { name: playerName.trim(), joinedAt: Date.now(), isAdmin: !!isAdmin } },
        currentRound: 0, gameState: 'lobby', createdAt: Date.now(),
        isSinglePlayer: true, gameMode, timeMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      router.push(`/room/${roomCode}`);
    } catch { setError('Error en crear la partida.'); setLoading(false); }
  };

  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    setLoading(true); setError('');
    try {
      // 1. Demanem permís al guàrdia
      const canCreate = await checkDailyLimit();
      if (!canCreate) {
        setLoading(false);
        return setError(`S'ha arribat al límit diari de ${MAX_DAILY_ROOMS} partides. Espera a demà per seguir jugant! 🛑`);
      }

      // 2. Si hi ha permís, creem la sala
      const playerId = getPlayerId();
      const roomCode = generateRoomCode();
      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: { name: playerName.trim(), joinedAt: Date.now(), isAdmin: !!isAdmin } },
        currentRound: 0, gameState: 'lobby', createdAt: Date.now(),
        isSinglePlayer: false, gameMode, timeMode,
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      router.push(`/room/${roomCode}`);
    } catch { setError('Error en crear la sala.'); setLoading(false); }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    if (!joinCode.trim()) return setError('Introdueix el codi de sala');
    setLoading(true); setError('');
    const code = joinCode.trim().toUpperCase();
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setError('Sala no trobada.'); return setLoading(false); }
      const room = snap.val();
      const playerId = getPlayerId();
      const existing = Object.keys(room.players || {});
      if (existing.length >= 10 && !existing.includes(playerId)) {
        setError('La sala és plena (màxim 10 jugadors).'); return setLoading(false);
      }
      if (!existing.includes(playerId)) {
        await set(ref(db, `rooms/${code}/players/${playerId}`), { name: playerName.trim(), joinedAt: Date.now(), isAdmin: !!isAdmin });
        await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
      }
      router.push(`/room/${code}`);
    } catch { setError('Error en unir-se.'); setLoading(false); }
  };

  const tabs = [
    { id: 'solo' as const, label: '🧍 Individual' },
    { id: 'create' as const, label: '🏠 Crear Sala' },
    { id: 'join' as const, label: '🔗 Unir-se' },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden font-sans" style={{ background: '#06080f' }}>

      {/* Fons amb taques de color */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.13) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: '35%', height: '35%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '30%', height: '30%', background: 'radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Capçalera: info usuari + logout */}
      <div className="absolute top-5 right-6 z-20 hidden lg:flex items-center gap-3">
        {user ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0 }}>Connectat com</p>
              <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 800, margin: 0 }}>{nickname}</p>
            </div>
            <button
              onClick={logout}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Sortir
            </button>
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Projecte Alpha · <span style={{ color: 'rgba(255,255,255,0.35)' }}>Convidat</span>
          </p>
        )}
      </div>

      {/* Layout principal */}
      <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row items-start justify-center gap-10 lg:gap-14 py-12 px-6">

        {/* ═══ COLUMNA ESQUERRA ═══ */}
        <div className="w-full max-w-xl flex flex-col gap-5 mx-auto lg:mx-0">

          {/* Títol */}
          <div className="text-center pt-2 pb-1">
            <div style={{ fontSize: '62px', marginBottom: '10px', filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.35))' }}>🌍</div>
            <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
              La Quinta<br />
              <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forca</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: '10px', fontWeight: 700 }}>
              Quin lloc del món és?
            </p>
          </div>

          {/* TABS DE NAVEGACIÓ (PLAY / FRIENDS) */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '4px', gap: '4px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
            <button 
              onClick={() => setActiveMenu('play')}
              style={{
                flex: 1, padding: '14px', fontSize: '12px', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.1em', textTransform: 'uppercase',
                background: activeMenu === 'play' ? '#10b981' : 'transparent',
                color: activeMenu === 'play' ? 'black' : 'rgba(255,255,255,0.4)',
                boxShadow: activeMenu === 'play' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
              }}>🎮 Jugar</button>
            <button 
              onClick={() => setActiveMenu('friends')}
              style={{
                flex: 1, padding: '14px', fontSize: '12px', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.1em', textTransform: 'uppercase',
                background: activeMenu === 'friends' ? '#6366f1' : 'transparent',
                color: activeMenu === 'friends' ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: activeMenu === 'friends' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
              }}>👥 Amics</button>
          </div>

          {activeMenu === 'play' ? (
            <>
              {/* Nom del jugador */}
              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px 24px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {user ? 'Jugues com' : 'El teu nom'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={user ? (nickname ?? 'Nom de jugador') : 'Introdueix el teu nom'}
              readOnly={!!user} // Si estàs loguejat, el nom ve del nickname
              maxLength={20}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '14px 18px', color: 'white', fontSize: '18px',
                fontWeight: 800, outline: 'none', boxSizing: 'border-box',
                opacity: user ? 0.8 : 1,
                cursor: user ? 'default' : 'text',
              }}
            />
          </div>

          {/* Mode de joc */}
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Mode de joc</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {([
                { id: 'world', label: '🌍 Món', active: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
                { id: 'catalunya', label: '🔴🟡 Catalunya', active: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
              ] as const).map(({ id, label, active, shadow }) => (
                <button key={id} onClick={() => setGameMode(id)} style={{
                  padding: '12px 8px', fontSize: '12px', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: gameMode === id ? active : 'rgba(0,0,0,0.4)',
                  color: gameMode === id ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: gameMode === id ? `0 4px 16px ${shadow}` : 'none',
                  transform: gameMode === id ? 'scale(1.02)' : 'scale(1)',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Ritme */}
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Ritme de joc</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                { id: 'bala', label: '⚡ BALA (1 min)', active: '#f59e0b', shadow: 'rgba(245,158,11,0.3)' },
                { id: 'normal', label: '🚶 NORMAL (5 min)', active: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
                { id: 'infinit', label: '♾️ SENSE TEMPS', active: '#6366f1', shadow: 'rgba(99,102,241,0.3)' },
              ] as const).map(({ id, label, active, shadow }) => (
                <button key={id} onClick={() => setTimeMode(id)} style={{
                  padding: '11px 8px', fontSize: '11px', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: timeMode === id ? active : 'rgba(0,0,0,0.4)',
                  color: timeMode === id ? (id === 'infinit' ? 'white' : 'black') : 'rgba(255,255,255,0.4)',
                  transform: timeMode === id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: timeMode === id ? `0 4px 16px ${shadow}` : 'none'
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Accions */}
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px 28px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '14px', padding: '4px', marginBottom: '20px', gap: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: '10px 4px', fontSize: '11px', fontWeight: 900, borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.id ? '#10b981' : 'transparent',
                  color: tab === t.id ? 'black' : 'rgba(255,255,255,0.35)',
                  boxShadow: tab === t.id ? '0 2px 12px rgba(16,185,129,0.3)' : 'none'
                }}>{t.label}</button>
              ))}
            </div>

            {tab === 'solo' && (
              <button onClick={handleSolo} disabled={loading || !playerName.trim()} style={{
                width: '100%', background: loading || !playerName.trim() ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: loading || !playerName.trim() ? 'rgba(255,255,255,0.3)' : 'white',
                fontWeight: 900, padding: '20px', borderRadius: '16px', fontSize: '22px', border: 'none', cursor: loading || !playerName.trim() ? 'not-allowed' : 'pointer',
                boxShadow: loading || !playerName.trim() ? 'none' : '0 8px 32px rgba(16,185,129,0.35)', transition: 'all 0.2s', letterSpacing: '-0.01em'
              }}>
                {loading ? '⌛ PREPARANT...' : '🚀 JUGAR SOL'}
              </button>
            )}
            {tab === 'create' && (
              <button onClick={handleCreate} disabled={loading || !playerName.trim()} style={{
                width: '100%', background: loading || !playerName.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                color: loading || !playerName.trim() ? 'rgba(255,255,255,0.3)' : 'black',
                fontWeight: 900, padding: '20px', borderRadius: '16px', fontSize: '22px', border: 'none', cursor: loading || !playerName.trim() ? 'not-allowed' : 'pointer',
                boxShadow: loading || !playerName.trim() ? 'none' : '0 8px 32px rgba(255,255,255,0.15)', transition: 'all 0.2s', letterSpacing: '-0.01em'
              }}>
                {loading ? '⌛ CREANT SALA...' : '🏠 CREAR SALA'}
              </button>
            )}
            {tab === 'join' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="CODI" maxLength={6} style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                  padding: '18px 24px', color: 'white', textAlign: 'center', fontFamily: 'monospace', fontSize: '32px', fontWeight: 700, outline: 'none', letterSpacing: '0.2em', boxSizing: 'border-box', width: '100%'
                }} />
                <button onClick={handleJoin} disabled={loading || !playerName.trim() || joinCode.length < 6} style={{
                  background: loading || !playerName.trim() || joinCode.length < 6 ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: loading || !playerName.trim() || joinCode.length < 6 ? 'rgba(255,255,255,0.3)' : 'white',
                  padding: '18px', borderRadius: '14px', fontWeight: 900, fontSize: '18px', border: 'none',
                  cursor: loading || !playerName.trim() || joinCode.length < 6 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.25)', transition: 'all 0.2s'
                }}>UNIR-SE</button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </>
      ) : (
        /* CONTINGUT DE LA PESTANYA AMICS */
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <FriendsTab />
        </div>
      )}

          {/* ── AFEGIT PER A MÒBILS: Rànquing i Vídeo ── */}
          <div className="flex flex-col gap-6 lg:hidden w-full mt-4">
            {/* Botó Rànquings Mòbil */}
            <Link href="/stats" className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-black uppercase tracking-widest py-4 px-6 rounded-2xl text-center text-sm shadow-lg active:scale-95 transition-all">
              🏆 Veure Rànquings Globals
            </Link>

            {/* Vídeo Mòbil */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3 text-center">📹 Vídeo del dia</p>
              <div className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black flex justify-center">
                <video src="/Rochaesquiant.mp4" autoPlay loop muted playsInline className="w-full max-h-[60vh] object-contain" />
              </div>
            </div>
          </div>

          {/* Footer mòbil */}
          <div className="text-center lg:hidden mt-6 mb-8">
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Versió 2.0 · Ara amb comptes</p>
          </div>
        </div>

        {/* ═══ COLUMNA DRETA ═══ */}
        <div className="hidden lg:flex flex-col gap-4 w-full max-w-md" style={{ paddingTop: '8px' }}>

          {/* Etiqueta vídeo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>📹 Vídeo del dia</span>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Vídeo Dinàmic */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-2px', borderRadius: '26px', zIndex: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(99,102,241,0.2))', filter: 'blur(12px)' }} />
            <div style={{ position: 'relative', zIndex: 1, borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
              {/* Usem la variable homeVideoUrl en lloc del text fix */}
              <video src={homeVideoUrl} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'contain', background: '#000' }} />
            </div>
          </div>

          {/* Caption i Botons d'Admin/Suggeriment */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⛷️</span>
              <div>
                {/* Usem la variable homeVideoCaption */}
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 700, margin: 0 }}>{homeVideoCaption}</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0, marginTop: '2px' }}>Contingut exclusiu · Fase Alpha</p>
              </div>
            </div>
            
            {/* Botó de suggerir (o Admin) */}
            <div className="flex gap-2">
              {isAdmin && (
                <button onClick={() => window.location.href = '/admin'} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-2 rounded-lg text-[10px] font-black uppercase transition-all" title="Panell d'Admin">
                  ⚙️
                </button>
              )}
              {user && !isAdmin && (
                <button onClick={() => { setShowSuggestModal(true); setSuggestMsg({text:'', type:''}); }} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg text-[10px] font-black uppercase transition-all" title="Suggerir Vídeo">
                  💡
                </button>
              )}
            </div>
          </div>

          {/* ── BLOC D'ESTADÍSTIQUES (només si loguejat) ── */}
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>📊 Les teves estadístiques</span>
                <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <StatBox label="Millor Món" value={myBestWorld !== null ? myBestWorld.toLocaleString() : '—'} color="#10b981" />
                  <StatBox label="Millor Cat." value={myBestCat !== null ? myBestCat.toLocaleString() : '—'} color="#ef4444" />
                  <StatBox label="Total 5k ⭐" value={my5k !== null ? String(my5k) : '—'} color="#f59e0b" />
                </div>
                <Link href="/stats" style={{
                  display: 'block', textAlign: 'center', padding: '11px', borderRadius: '12px',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc', fontSize: '12px', fontWeight: 800, textDecoration: 'none',
                  letterSpacing: '0.05em', transition: 'all 0.2s',
                }}>
                  🏆 Veure Rànquings Globals →
                </Link>
              </div>
            </>
          )}

          {/* Si és convidat, mostrem invitació a registrar-se */}
          {isGuest && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                Crea un compte per guardar les teves<br />puntuacions als rànquings globals 🏆
              </p>
              <Link href="/stats" style={{ display: 'inline-block', marginTop: '10px', color: '#818cf8', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                Veure rànquings →
              </Link>
            </div>
          )}

          {/* Versió */}
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center' }}>
            Versió 3.0 · Creat per Fortià Arumí Casals
          </p>
        </div>

      </div>
      {/* ── MODAL D'INVITACIÓ ── */}
      {activeInvite && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '24px', padding: '32px',
            maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 24px 50px rgba(99,102,241,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'bounce 2s infinite' }}>💌</div>
            <h3 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0' }}>Invitació rebuda!</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              <strong style={{ color: '#818cf8', fontSize: '16px' }}>{activeInvite.from}</strong> t'ha convidat a jugar una partida.
            </p>
           <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={declineInvite} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}>Rebutjar</button>
              <button onClick={acceptInvite} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#4f46e5',
                color: 'white', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(79,70,229,0.4)'
              }}>Acceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AFEGIT: MODAL DE PETICIÓ D'AMISTAT ── */}
      {activeFriendReq && !activeInvite && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '24px', padding: '32px',
            maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 24px 50px rgba(16,185,129,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'bounce 2s infinite' }}>👋</div>
            <h3 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0' }}>Nou Amic!</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              <strong style={{ color: '#34d399', fontSize: '16px' }}>{activeFriendReq.nickname}</strong> vol afegir-te a la seva pinya.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={declineFriend} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}>Rebutjar</button>
              <button onClick={acceptFriend} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#10b981',
                color: 'black', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(16,185,129,0.4)'
              }}>Acceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AFEGIT: MODAL DE SUGGERIMENT DE VÍDEO ── */}
      {showSuggestModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
            maxWidth: '400px', width: '90%', boxShadow: '0 24px 50px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 900, margin: '0 0 8px 0', textAlign: 'center' }}>💡 Suggereix un Vídeo</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>
              Enganxa l'enllaç d'un vídeo divertit (TikTok, Reels, Youtube Shorts) i l'Admin el revisarà per posar-lo de "Vídeo del dia"!
            </p>
            
            <input 
              type="text" 
              value={suggestLink}
              onChange={(e) => setSuggestLink(e.target.value)}
              placeholder="https://..."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 mb-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
            
            {suggestMsg.text && (
              <div className={`text-xs font-bold mb-4 px-3 py-2 rounded-lg text-center ${suggestMsg.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {suggestMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowSuggestModal(false)} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}>Cancel·lar</button>
              <button onClick={handleSuggestVideo} disabled={!suggestLink.trim()} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', 
                background: suggestLink.trim() ? '#10b981' : 'rgba(16,185,129,0.2)',
                color: suggestLink.trim() ? 'black' : 'rgba(255,255,255,0.3)', 
                fontWeight: 900, cursor: suggestLink.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
              }}>Enviar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{label}</p>
      <p style={{ color, fontSize: '20px', fontWeight: 900, margin: 0 }}>{value}</p>
    </div>
  );
}