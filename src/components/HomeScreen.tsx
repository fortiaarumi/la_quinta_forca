'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, set, get, query, orderByChild, endAt, remove, onValue, runTransaction, update, limitToLast, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/gameUtils';
import { useRouter } from 'next/navigation';
import { GameMode } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { getUserProfile } from '@/lib/userStats';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils'; // 👈 AFEGIT
import Link from 'next/link';
import FriendsTab from './FriendsTab';
import { useAudio } from '@/lib/AudioContext'; // 👈 AFEGIT: Importem el cervell musical

// Per a convidats: manté el localStorage ID
import { ALL_BADGES } from '@/lib/badges';

function getOrCreateGuestId(): string {
  let id = localStorage.getItem('geoPlayerId');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('geoPlayerId', id); }
  return id;
}

export default function HomeScreen() {
  const router = useRouter();
  const { 
    user, nickname, avatarUrl, badges, isAdmin, logout, isGuest 
  } = useAuth();
  
  // ── ESTATS PER A L'AVATAR ──
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 👈 AFEGIT: Agafem la funció per reproduir la música del menú i gestionar l'estat d'interacció
  const { playMenuMusic, isMuted, toggleMute, hasInteracted, setHasInteracted } = useAudio();

  useEffect(() => {
    if (hasInteracted) {
      playMenuMusic();
    }
  }, [playMenuMusic, hasInteracted]);

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
  const [homeVideoSuggestedBy, setHomeVideoSuggestedBy] = useState(''); // 👈 AFEGIT: Nom de l'amic
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState(''); // Títol del vídeo
  const [videoFile, setVideoFile] = useState<File | null>(null); // El fitxer .mp4
  const [suggestMsg, setSuggestMsg] = useState({ text: '', type: '' });

  // AFEGIT: Estat pel manual de Suno
  const [showSunoManual, setShowSunoManual] = useState(false);

  // AFEGIT: Variable per guardar la invitació que ens arriba
  const [activeInvite, setActiveInvite] = useState<{ roomId: string, from: string } | null>(null);
  const [activeFriendReq, setActiveFriendReq] = useState<{ uid: string, nickname: string } | null>(null);

  // ── XAT NOTIFICACIONS ──
  const [chatToast, setChatToast] = useState<{ from: string, text: string } | null>(null);

  // ── VARIABLES SALES PÚBLIQUES I PRESÈNCIA ──
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [searchingPublic, setSearchingPublic] = useState(false);
  const [publicError, setPublicError] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);

  // ── SISTEMA DE PRESÈNCIA (QUI ESTÀ ONLINE) ──
  useEffect(() => {
    if (!user) return;
    const connectedRef = ref(db, '.info/connected');
    const myOnlineRef = ref(db, `system/onlineUsers/${user.uid}`);

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(myOnlineRef, true);
        onDisconnect(myOnlineRef).remove();
      }
    });
    return () => unsub();
  }, [user]);

  // Escoltar quants usuaris hi ha en línia
  useEffect(() => {
    const countRef = ref(db, 'system/onlineUsers');
    const unsub = onValue(countRef, (snap) => {
      if (snap.exists()) {
        setOnlineCount(Object.keys(snap.val()).length);
      } else {
        setOnlineCount(1);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || isGuest) return;

    // 1. Obtenim la llista d'amics
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsubFriends = onValue(friendsRef, (snap) => {
      if (!snap.exists()) return;
      const friendUids = Object.keys(snap.val());

      // 2. Per cada amic, escoltem el seu xat
      friendUids.forEach(fUid => {
        const chatId = [user.uid, fUid].sort().join('_');
        // Només escoltem l'últim missatge per no carregar tot l'historial
        const lastMsgQuery = query(ref(db, `chats/${chatId}/messages`), orderByChild('timestamp'), endAt(Date.now() + 10000));

        onValue(ref(db, `chats/${chatId}/messages`), (mSnap) => {
          if (!mSnap.exists()) return;
          const msgs = mSnap.val();
          const lastMsgId = Object.keys(msgs).pop();
          const lastMsg = msgs[lastMsgId!];

          // Si el missatge és nou (fa menys de 5 segons) i no és nostre
          if (lastMsg.from !== user.uid && !lastMsg.read && (Date.now() - lastMsg.timestamp < 5000)) {
            setChatToast({ from: lastMsg.fromNickname || 'Un amic', text: lastMsg.text });
            // Amaguem el toast després de 4 segons
            setTimeout(() => setChatToast(null), 4000);
          }
        });
      });
    });

    return () => unsubFriends();
  }, [user, isGuest]);

  // Sincronitzem el playerName quan el nickname canvia
  useEffect(() => {
    if (nickname) setPlayerName(nickname);
    else if (localStorage.getItem('geoGuestName')) setPlayerName(localStorage.getItem('geoGuestName')!);
  }, [nickname]);

  // ── Llegir Vídeo Dinàmic des de Firebase ──
  useEffect(() => {
    const unsub = onValue(ref(db, 'appConfig/home'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.videoUrl) setHomeVideoUrl(data.videoUrl);
        if (data.videoCaption) setHomeVideoCaption(data.videoCaption);
        if (data.suggestedBy) setHomeVideoSuggestedBy(data.suggestedBy); else setHomeVideoSuggestedBy(''); // 👈 Llegeix qui ho ha suggerit
      }
    });
    return () => unsub();
  }, []);

  // ── Enviar Suggeriment de Vídeo ──
  const handleSuggestVideo = async () => {
    if (!videoFile || !suggestTitle.trim() || !user) return;

    setLoading(true);
    setSuggestMsg({ text: '⌛ Comprovant límit diari...', type: '' });

    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = ref(db, `users/${user.uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();

      // 1. LÍMIT DIARI: Comprovem si ja ha pujat un vídeo avui
      if (userData?.lastVideoUploadDate === today) {
        setLoading(false);
        setSuggestMsg({ text: '✋ Ja has pujat un vídeo avui. Torna demà!', type: 'error' });
        return;
      }

      setSuggestMsg({ text: '🚀 Pujant vídeo a Cloudinary... (això pot trigar)', type: '' });

      // 2. PUJADA A CLOUDINARY
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('upload_preset', 'la_quinta_forca_videos'); // El teu preset

      const res = await fetch(`https://api.cloudinary.com/v1_1/ddvvk5jii/video/upload`, {
        method: 'POST',
        body: formData,
      });

      const cloudinaryData = await res.json();
      if (!cloudinaryData.secure_url) throw new Error('Error en la pujada');

      // 3. GUARDAR A LA CUA DE FIREBASE
      const queueRef = ref(db, 'videoQueue');
      const newVideoRef = ref(db, `videoQueue/${crypto.randomUUID()}`);

      await set(newVideoRef, {
        url: cloudinaryData.secure_url,
        title: suggestTitle.trim(),
        suggestedBy: nickname || 'Un amic',
        userEmail: user.email,
        userId: user.uid,
        timestamp: Date.now()
      });

      // 4. MARCAR DATA DE PUJADA A L'USUARI
      await update(userRef, { lastVideoUploadDate: today });

      setSuggestMsg({ text: '✅ Vídeo enviat! Si és triat, rebràs un correu.', type: 'success' });
      setVideoFile(null);
      setSuggestTitle('');
      setTimeout(() => setShowSuggestModal(false), 3000);

    } catch (error: any) {
      console.error(error);
      setSuggestMsg({ text: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // ── PUJADA D'AVATAR A CLOUDINARY ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'la_quinta_forca_avatars');

      const res = await fetch(`https://api.cloudinary.com/v1_1/ddvvk5jii/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        // Apliquem la transformació via URL per si el preset no la té (150x150 fill)
        const transformedUrl = data.secure_url.replace('/upload/', '/upload/c_fill,g_face,w_150,h_150/');
        await update(ref(db, `users/${user.uid}`), { avatarUrl: transformedUrl });
      }
    } catch (error) {
      console.error("Error pujant avatar:", error);
    } finally {
      setUploadingAvatar(false);
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
            isAdmin: !!isAdmin,
            avatarUrl: avatarUrl || undefined, // 👈 NOU
            badges: badges || []               // 👈 NOU
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
  const [myBestEstadis, setMyBestEstadis] = useState<number | null>(null); // 👈 NOU
  const [myBestCultural, setMyBestCultural] = useState<number | null>(null); // 👈 NOU
  const [my5k, setMy5k] = useState<number | null>(null);

  useEffect(() => {
    setPlayerName(defaultName);
  }, [defaultName]);

  // Carrega les estadístiques de l'usuari loguejat
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile) {
        // Busquem la puntuació més alta de les 3 modalitats
        const maxWorld = Math.max(
          profile.bestScoreWorld_bala || 0,
          profile.bestScoreWorld_normal || 0,
          profile.bestScoreWorld_infinit || 0
        );
        const maxCat = Math.max(
          profile.bestScoreCatalunya_bala || 0,
          profile.bestScoreCatalunya_normal || 0,
          profile.bestScoreCatalunya_infinit || 0
        );
        const maxEstadis = Math.max(
          profile.bestScoreEstadis_bala || 0,
          profile.bestScoreEstadis_normal || 0,
          profile.bestScoreEstadis_infinit || 0
        );
        const maxCultural = Math.max(
          profile.bestScoreCultural_bala || 0,
          profile.bestScoreCultural_normal || 0,
          profile.bestScoreCultural_infinit || 0
        );

        setMyBestWorld(maxWorld);
        setMyBestCat(maxCat);
        setMyBestEstadis(maxEstadis);
        setMyBestCultural(maxCultural);
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
        players: { [playerId]: { 
          name: (playerName.trim() || nickname || 'Explorador'), 
          joinedAt: Date.now(), 
          isAdmin: !!isAdmin,
          avatarUrl: avatarUrl || null,
          badges: badges || []
        } },
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
        players: { [playerId]: { 
          name: (playerName.trim() || nickname || 'Explorador'), 
          joinedAt: Date.now(), 
          isAdmin: !!isAdmin,
          avatarUrl: avatarUrl || null,
          badges: badges || []
        } },
        currentRound: 0, gameState: 'lobby', createdAt: Date.now(),
        isSinglePlayer: false, gameMode, timeMode,
        isPublic: isPublicRoom // 👈 Guardem l'estat del botó
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      router.push(`/room/${roomCode}`);
    } catch { setError('Error en crear la sala.'); setLoading(false); }
  };

  // ── NOVA FUNCIÓ: BUSCAR PARTIDA PÚBLICA ──
  const handleJoinPublic = async () => {
    if (!playerName.trim()) return setError('Introdueix el teu nom');
    setSearchingPublic(true); setPublicError(''); setError('');

    try {
      const recentRoomsQuery = query(ref(db, 'rooms'), orderByChild('createdAt'), limitToLast(30));
      const snap = await get(recentRoomsQuery);

      if (snap.exists()) {
        const rooms = snap.val();
        const availableRooms = Object.entries(rooms).filter(([id, r]: [string, any]) =>
          r.isPublic === true &&
          r.gameState === 'lobby' &&
          r.isSinglePlayer === false &&
          (!r.players || Object.keys(r.players).length < 10)
        );

        if (availableRooms.length > 0) {
          const [code, room] = availableRooms[availableRooms.length - 1];
          const playerId = getPlayerId();
          const existing = Object.keys((room as any).players || {});

          if (!existing.includes(playerId)) {
            await set(ref(db, `rooms/${code}/players/${playerId}`), { 
              name: (playerName.trim() || nickname || 'Explorador'), 
              joinedAt: Date.now(), 
              isAdmin: !!isAdmin,
              avatarUrl: avatarUrl || null,
              badges: badges || []
            });
            await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
          }
          router.push(`/room/${code}`);
          return;
        }
      }
      setPublicError("⚠️ No hi ha cap sala pública disponible. Crea'n una tu!");
    } catch (e) {
      setPublicError("❌ Error en buscar sala.");
    } finally {
      setSearchingPublic(false);
    }
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
        await set(ref(db, `rooms/${code}/players/${playerId}`), { 
          name: (playerName.trim() || nickname || 'Explorador'), 
          joinedAt: Date.now(), 
          isAdmin: !!isAdmin,
          avatarUrl: avatarUrl || null,
          badges: badges || []
        });
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

      {/* ── TOAST DE XAT (NOTIFICACIÓ) ── */}
      {chatToast && (
        <div
          onClick={() => setActiveMenu('friends')}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[320px] bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 flex items-center gap-4 cursor-pointer hover:scale-105 transition-all animate-in slide-in-from-top-full duration-500"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xl shadow-lg">💬</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{chatToast.from}</p>
            <p className="text-white text-sm font-bold truncate">{chatToast.text}</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}

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

          {/* Títol i Toggle de Música */}
          <div className="text-center pt-2 pb-1 relative">
            <div style={{ fontSize: '62px', marginBottom: '10px', filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.35))' }}>🌍</div>
            <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
              La Quinta<br />
              <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forca</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: '10px', fontWeight: 700 }}>
              Quin lloc del món és?
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 12px', borderRadius: '20px', marginTop: '16px' }}>
              <span className="animate-pulse" style={{ fontSize: '10px' }}>🟢</span>
              <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{onlineCount} Jugadors en línia</span>
            </div>

            {/* Toggle de música centralitzat */}
            <div className="flex items-center justify-center gap-3 mt-6 mb-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full transition-all duration-300">
                {isMuted ? (
                  <svg className="w-4 h-4 text-red-400 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-emerald-400 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest transition-all duration-300">
                  Música: {isMuted ? 'Desactivada' : 'Activada'}
                </span>
              </div>

              <button
                onClick={toggleMute}
                className={`px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${isMuted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  }`}
              >
                {isMuted ? 'Activar' : 'Desactivar'}
              </button>
            </div>
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
                <div className="flex items-center gap-5">
                  {/* Avatar Circular */}
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-black/40 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-40">👤</span>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {user && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-400 text-black p-1.5 rounded-full shadow-lg transition-all scale-100 lg:scale-0 lg:group-hover:scale-100 active:scale-90"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="flex-1">
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {user ? 'Jugues com' : 'El teu nom'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder={user ? (nickname ?? 'Nom de jugador') : 'Introdueix el teu nom'}
                        readOnly={!!user}
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
                  </div>
                </div>

                {/* Secció d'Insígnies */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                    {badges.map((badge, i) => (
                      <span 
                        key={i} 
                        className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm"
                      >
                        🏅 {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode de joc */}
              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Mode de joc</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {([
                    { id: 'world', label: '🌍 Món', active: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
                    { id: 'catalunya', label: '🔴🟡 Catalunya', active: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
                    { id: 'estadis', label: '⚽ Estadis', active: '#3b82f6', shadow: 'rgba(59,130,246,0.3)' },
                    { id: 'cultural', label: '🏛️ Cultural', active: '#8b5cf6', shadow: 'rgba(139,92,246,0.3)' },
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
                  <>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setIsPublicRoom(!isPublicRoom)}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isPublicRoom ? '#10b981' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPublicRoom ? '#10b981' : 'transparent', transition: 'all 0.2s' }}>
                        {isPublicRoom && <span style={{ color: 'black', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>🌍 Fer aquesta sala Pública</span>
                    </div>
                    <button onClick={handleCreate} disabled={loading || !playerName.trim()} style={{
                      width: '100%', background: loading || !playerName.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                      color: loading || !playerName.trim() ? 'rgba(255,255,255,0.3)' : 'black',
                      fontWeight: 900, padding: '20px', borderRadius: '16px', fontSize: '22px', border: 'none', cursor: loading || !playerName.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: loading || !playerName.trim() ? 'none' : '0 8px 32px rgba(255,255,255,0.15)', transition: 'all 0.2s', letterSpacing: '-0.01em'
                    }}>
                      {loading ? '⌛ CREANT SALA...' : '🏠 CREAR SALA'}
                    </button>
                  </>
                )}
                {tab === 'join' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    <button onClick={handleJoinPublic} disabled={searchingPublic || !playerName.trim()} style={{
                      background: searchingPublic || !playerName.trim() ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: searchingPublic || !playerName.trim() ? 'rgba(255,255,255,0.3)' : 'white',
                      padding: '18px', borderRadius: '14px', fontWeight: 900, fontSize: '16px', border: 'none',
                      cursor: searchingPublic || !playerName.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: '0 8px 32px rgba(16,185,129,0.25)', transition: 'all 0.2s', marginBottom: '8px', width: '100%'
                    }}>
                      {searchingPublic ? '🔍 CERCANT SALA...' : '🌍 UNIR-SE A PARTIDA PÚBLICA'}
                    </button>

                    {publicError && <div style={{ color: '#f87171', fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>{publicError}</div>}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>O AMB CODI PRIVAT</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>

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
            {/* Botó Rànquings Mòbil */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/stats" className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-black uppercase tracking-widest py-4 px-4 rounded-2xl text-center text-[10px] shadow-lg active:scale-95 transition-all">
                🏆 Rànquings
              </Link>
              <Link href="/badges" className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black uppercase tracking-widest py-4 px-4 rounded-2xl text-center text-[10px] shadow-lg active:scale-95 transition-all">
                🏅 Insígnies
              </Link>
            </div>

            {/* Estadístiques Mòbil */}
            {user && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-4 text-center">📊 Les teves estadístiques</p>
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Millor Món" value={myBestWorld !== null ? myBestWorld.toLocaleString() : '—'} color="#10b981" />
                  <StatBox label="Millor Cat." value={myBestCat !== null ? myBestCat.toLocaleString() : '—'} color="#ef4444" />
                  <StatBox label="Estadis" value={myBestEstadis !== null ? myBestEstadis.toLocaleString() : '—'} color="#3b82f6" />
                  <StatBox label="Cultural" value={myBestCultural !== null ? myBestCultural.toLocaleString() : '—'} color="#8b5cf6" />
                </div>
              </div>
            )}

            {/* Vídeo Mòbil Dinàmic */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3 px-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] m-0">📹 Vídeo del dia</p>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => window.location.href = '/admin'} className="text-emerald-400 text-lg">⚙️</button>}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black flex justify-center">
                <video src={homeVideoUrl} autoPlay loop muted playsInline className="w-full max-h-[60vh] object-contain" />
              </div>
              <div className="text-center mt-3">
                <p className="text-[11px] text-gray-300 font-bold m-0">{homeVideoCaption}</p>
                {homeVideoSuggestedBy && (
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest m-0 mt-1">
                    Suggerit per <span className="text-emerald-400 font-black">{homeVideoSuggestedBy}</span>
                  </p>
                )}
              </div>

              {/* 👈 NOU BOTÓ GEGANT MÒBIL */}
              {user && (
                <button
                  onClick={() => { setShowSuggestModal(true); setSuggestMsg({ text: '', type: '' }); }}
                  className="w-full mt-5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">💡</span>
                  <div className="text-left">
                    <p className="text-yellow-400 font-black text-xs uppercase tracking-widest m-0">Vols sortir aquí?</p>
                    <p className="text-gray-400 text-[9px] m-0 mt-1">Puja un vídeo i sigues el protagonista!</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Manual i Suport Mòbil */}
          <div className="flex flex-col gap-2 lg:hidden w-full mt-4 px-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowSunoManual(true)}
                className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider py-3 px-3 rounded-xl transition-all"
              >
                🤖 Manual Suno
              </button>
              <a
                href="https://paypal.me/fortiaarumi"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider py-3 px-3 rounded-xl text-center transition-all"
              >
                ☕ Suport
              </a>
            </div>
            <a href="mailto:laquintaforca.joc@gmail.com" className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-black mt-2 text-center">
              laquintaforca.joc@gmail.com
            </a>
          </div>

          {/* Footer mòbil */}
          <div className="text-center lg:hidden mt-6 mb-8 flex flex-col items-center gap-3">
            {user && (
              <div className="flex flex-col items-center gap-1 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-emerald-400">Connectat com {nickname} {isAdmin && '👑'}</span>
                <button onClick={logout} className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-black">Sortir de la sessió</button>
              </div>
            )}
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Versió 3.0 · Ara amb comptes</p>
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
                <p style={{ color: 'white', fontSize: '13px', fontWeight: 800, margin: 0 }}>{homeVideoCaption}</p>
                {homeVideoSuggestedBy ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', margin: 0, marginTop: '2px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em' }}>
                    Suggerit per <span style={{ color: '#10b981' }}>{homeVideoSuggestedBy}</span>
                  </p>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0, marginTop: '2px' }}>Contingut exclusiu · Fase Alpha</p>
                )}
              </div>
            </div>

            {/* Botó de Admin */}
            <div className="flex gap-2">
              {isAdmin && (
                <button onClick={() => window.location.href = '/admin'} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-2 rounded-lg text-[10px] font-black uppercase transition-all" title="Panell d'Admin">
                  ⚙️
                </button>
              )}
            </div>
          </div>

          {/* 👈 NOU BOTÓ GEGANT PC */}
          {user && (
            <button
              onClick={() => { setShowSuggestModal(true); setSuggestMsg({ text: '', type: '' }); }}
              style={{
                width: '100%', marginTop: '4px', padding: '16px', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.3)',
                background: 'linear-gradient(to right, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgba(245,158,11,0.15), rgba(245,158,11,0.1))'}
              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgba(245,158,11,0.1), rgba(245,158,11,0.05))'}
            >
              <span style={{ fontSize: '32px' }}>💡</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>Vols sortir aquí dalt?</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: 0 }}>Puja un vídeo divertit i sigues el protagonista de demà!</p>
              </div>
            </button>
          )}

          {/* ── BLOC D'ESTADÍSTIQUES (només si loguejat) ── */}
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>📊 Les teves estadístiques</span>
                <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px 24px' }}>
                {/* He canviat el grid a 2 columnes perquè càpiguen bé */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <StatBox label="Millor Món" value={myBestWorld !== null ? myBestWorld.toLocaleString() : '—'} color="#10b981" />
                  <StatBox label="Millor Cat." value={myBestCat !== null ? myBestCat.toLocaleString() : '—'} color="#ef4444" />
                  <StatBox label="Estadis" value={myBestEstadis !== null ? myBestEstadis.toLocaleString() : '—'} color="#3b82f6" />
                  <StatBox label="Cultural" value={myBestCultural !== null ? myBestCultural.toLocaleString() : '—'} color="#8b5cf6" />
                </div>
                <div style={{ marginBottom: '16px' }}>
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

                <Link href="/badges" style={{
                  display: 'block', textAlign: 'center', padding: '11px', borderRadius: '12px', marginTop: '8px',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fcd34d', fontSize: '12px', fontWeight: 800, textDecoration: 'none',
                  letterSpacing: '0.05em', transition: 'all 0.2s',
                }}>
                  🏅 Col·lecció d'Insígnies →
                </Link>
            </>
          )}

          {/* Si és convidat, mostrem invitació a registrar-se */}
          {isGuest && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', padding: '16px 20px', textAlign: 'center', marginBottom: '8px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                Crea un compte per guardar les teves<br />puntuacions als rànquings globals 🏆
              </p>
              <Link href="/stats" style={{ display: 'inline-block', marginTop: '10px', color: '#818cf8', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                Veure rànquings →
              </Link>
            </div>
          )}

          {/* ── NOU: BOTONS DE MANUAL I SUPORT ── */}
          <div className="flex justify-between items-center gap-2 mt-2 mb-4">
            <button
              onClick={() => setShowSunoManual(true)}
              className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all"
            >
              🤖 Manual Suno
            </button>
            <a
              href="https://paypal.me/fortiaarumi"
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-1"
            >
              <span>☕</span> Donar suport
            </a>
          </div>

          <div className="text-center mb-6">
            <a href="mailto:laquintaforca.joc@gmail.com" className="text-gray-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors">
              Contacte & Errors
            </a>
            {/* El correu explícit a sota perquè la gent el pugui veure i copiar */}
            <span className="text-gray-600 text-[10px] font-mono lowercase tracking-normal">
              laquintaforca.joc@gmail.com
            </span>
          </div>

          {/* Versió */}
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center' }}>
            Versió 3.0 · Creat per Fortià Arumí Casals
          </p>
        </div>

      </div>

      {/* ── MODAL DEL MANUAL DE SUNO ── */}
      {showSunoManual && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '24px', padding: '32px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 50px rgba(59,130,246,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🤖</span> Manual d'Instal·lació de Suno
              </h3>
              <button onClick={() => setShowSunoManual(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div className="text-gray-300 text-sm space-y-4 text-left">
              <p>Per generar les teves pròpies cançons, necessites configurar el teu compte de Suno a la web.</p>

              <h4 className="font-bold text-white mt-4">Pas 1: Entrar a Suno</h4>
              <p>Vés a <a href="https://suno.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Suno.com</a> i inicia sessió amb el teu compte.</p>

              <h4 className="font-bold text-white mt-4">Pas 2: Obtenir la Cookie</h4>
              <p>Depenent del teu navegador i sistema operatiu, has d'obrir les eines de desenvolupador (F12 o Clic dret {'>'} Inspeccionar) i buscar una galeta (cookie) que es diu <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-300">__client_id</code>.</p>

              <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
                <li><strong className="text-gray-300">Windows / Linux (Chrome/Edge):</strong> Prem <kbd className="bg-gray-800 px-1 rounded">F12</kbd> {'>'} Ves a la pestanya <em>Application</em> {'>'} <em>Cookies</em>.</li>
                <li><strong className="text-gray-300">Mac (Safari):</strong> Prem <kbd className="bg-gray-800 px-1 rounded">Cmd + Option + I</kbd> {'>'} Ves a la pestanya <em>Storage</em> {'>'} <em>Cookies</em>.</li>
              </ul>

              <h4 className="font-bold text-white mt-4">Pas 3: Guardar al teu Perfil</h4>
              <p>Copia el valor sencer de la cookie i enganxa'l a la configuració del teu perfil de <i>La Quinta Forca</i> (a través de la pestanya Admin o directament a la configuració de l'usuari).</p>
            </div>

            <button onClick={() => setShowSunoManual(false)} style={{
              width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(59,130,246,0.1)',
              color: '#60a5fa', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', borderTop: '1px solid rgba(59,130,246,0.2)'
            }}>Entès, tancar manual</button>
          </div>
        </div>
      )}

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
              <strong style={{ color: '#818cf8', fontSize: '16px' }}>{activeInvite?.from}</strong> t'ha convidat a jugar una partida.
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
              <strong style={{ color: '#34d399', fontSize: '16px' }}>{activeFriendReq?.nickname}</strong> vol afegir-te a la seva pinya.
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

      {/* ── MODAL DE MÚSICA (NOMÉS EL PRIMER COP) ── */}
      {!hasInteracted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.4s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '28px', padding: '36px', maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 30px 60px rgba(16,185,129,0.25)', transform: 'translateY(0)', transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.4))' }}>🎵</div>
            <h3 style={{ color: 'white', fontSize: '26px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>Benvingut/da!</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
              Vols activar la música d'aquest joc?<br />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '8px' }}>
                Si canvies d'opinió més endavant, aquesta opció la podràs canviar a la pàgina d'inici.
              </span>
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => {
                if (!isMuted) toggleMute();
                setHasInteracted(true);
              }} style={{
                flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>No, gràcies</button>

              <button onClick={() => {
                if (isMuted) toggleMute();
                setHasInteracted(true);
              }} style={{
                flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontWeight: 900, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(16,185,129,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>Sí, si us plau!</button>
            </div>
          </div>
        </div>
      )}


      {/* ── MODAL DE PUJADA DE VÍDEO (Cloudinary) ── */}
      {showSuggestModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '95%' }}>
            <h3 style={{ color: 'white', fontSize: '22px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>🎬 Proposa el Vídeo del Dia</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>
              Tria un vídeo divertit de la teva galeria. El sistema en triarà un cada nit!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>Títol del vídeo</label>
                <input type="text" value={suggestTitle} onChange={(e) => setSuggestTitle(e.target.value)} placeholder="Ex: El Roger fent un picao" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>Arxiu de vídeo (.mp4)</label>
                <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
              </div>
            </div>

            {suggestMsg.text && (
              <div style={{ padding: '12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, textAlign: 'center', marginBottom: '20px', background: suggestMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: suggestMsg.type === 'error' ? '#f87171' : '#34d399', border: '1px solid currentColor' }}>
                {suggestMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowSuggestModal(false)} disabled={loading} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontWeight: 800, cursor: 'pointer' }}>Cancel·lar</button>
              <button onClick={handleSuggestVideo} disabled={loading || !videoFile || !suggestTitle.trim()} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#10b981', color: 'black', fontWeight: 900, cursor: 'pointer', opacity: (loading || !videoFile || !suggestTitle.trim()) ? 0.5 : 1 }}>
                {loading ? '⌛ PUJANT...' : '🚀 ENVIAR'}
              </button>
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