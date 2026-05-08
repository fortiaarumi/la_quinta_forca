'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, set, get, query, orderByChild, endAt, remove, onValue, runTransaction, update, limitToLast, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/gameUtils';
import { useRouter } from 'next/navigation';
import { GameMode, Room } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { getUserProfile } from '@/lib/userStats';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils';
import Link from 'next/link';
import FriendsTab from './FriendsTab';
import { useAudio } from '@/lib/AudioContext';
import PWAInstallPrompt from './PWAInstallPrompt';

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
    user, nickname, avatarUrl, badges, selectedBadges, isAdmin, logout, isGuest 
  } = useAuth();
  
  // ── ESTATS PER A L'AVATAR ──
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agafem la funció per reproduir la música del menú i gestionar l'estat d'interacció
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
  const [gameType, setGameType] = useState<'classic' | '1vs1' | 'battle_royale'>('classic'); // 👈 NOU
  const [hintsEnabled, setHintsEnabled] = useState(false); // 👈 NOU
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Per canviar entre menú de joc i menú d'amics
  const [activeMenu, setActiveMenu] = useState<'play' | 'friends'>('play');

  // ── NOU: ESTAT PEL MODAL DE MÚSICA ──
  const [showMusicModal, setShowMusicModal] = useState(false);

  useEffect(() => {
    if (!hasInteracted) {
      setShowMusicModal(true);
    }
  }, [hasInteracted]);

  // ── NOU: ESTATS PER AL FLUX DE CONFIGURACIÓ ELEGANT ──
  const [setupStep, setSetupStep] = useState<'idle' | 'type' | 'gameType' | 'mode' | 'time' | 'hints' | 'join' | 'joinChoice'>('idle');
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');
  const [publicRooms, setPublicRooms] = useState<{id: string, room: Room}[]>([]); // 👈 NOU

  const goToStep = (step: typeof setupStep, direction: 'forward' | 'backward' = 'forward') => {
    if (step === setupStep) return; // No fem transició si és el mateix pas (toggling options)
    setAnimDirection(direction);
    setSetupStep(step);
  };

  // Variables del vídeo dinàmic i suggeriments
  const [homeVideoUrl, setHomeVideoUrl] = useState('/Rochaesquiant.mp4');
  const [homeVideoCaption, setHomeVideoCaption] = useState('Roger Bernadó masterclass esquiant');
  const [homeVideoSuggestedBy, setHomeVideoSuggestedBy] = useState('');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [suggestMsg, setSuggestMsg] = useState({ text: '', type: '' });

  // Estat pel manual de Suno
  const [showSunoManual, setShowSunoManual] = useState(false);

  // Variable per guardar la invitació que ens arriba
  const [activeInvite, setActiveInvite] = useState<{ roomId: string, from: string } | null>(null);
  const [activeFriendReq, setActiveFriendReq] = useState<{ uid: string, nickname: string } | null>(null);

  // XAT NOTIFICACIONS
  const [chatToast, setChatToast] = useState<{ from: string, text: string } | null>(null);

  // VARIABLES SALES PÚBLIQUES I PRESÈNCIA
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [searchingPublic, setSearchingPublic] = useState(false);
  const [publicError, setPublicError] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);

  // SISTEMA DE PRESÈNCIA (QUI ESTÀ ONLINE)
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
        onValue(ref(db, `chats/${chatId}/messages`), (mSnap) => {
          if (!mSnap.exists()) return;
          const msgs = mSnap.val();
          const lastMsgId = Object.keys(msgs).pop();
          const lastMsg = msgs[lastMsgId!];

          if (lastMsg.from !== user.uid && !lastMsg.read && (Date.now() - lastMsg.timestamp < 5000)) {
            setChatToast({ from: lastMsg.fromNickname || 'Un amic', text: lastMsg.text });
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

  // Llegir Vídeo Dinàmic des de Firebase
  useEffect(() => {
    const unsub = onValue(ref(db, 'appConfig/home'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.videoUrl) setHomeVideoUrl(data.videoUrl);
        if (data.videoCaption) setHomeVideoCaption(data.videoCaption);
        if (data.suggestedBy) setHomeVideoSuggestedBy(data.suggestedBy); else setHomeVideoSuggestedBy('');
      }
    });
    return () => unsub();
  }, []);

  // Enviar Suggeriment de Vídeo
  const handleSuggestVideo = async () => {
    if (!videoFile || !suggestTitle.trim() || !user) return;
    setLoading(true);
    setSuggestMsg({ text: '⌛ Comprovant límit diari...', type: '' });
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = ref(db, `users/${user.uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();
      if (userData?.lastVideoUploadDate === today) {
        setLoading(false);
        setSuggestMsg({ text: '✋ Ja has pujat un vídeo avui. Torna demà!', type: 'error' });
        return;
      }
      setSuggestMsg({ text: '🚀 Pujant vídeo... (això pot trigar)', type: '' });
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('upload_preset', 'la_quinta_forca_videos');
      const res = await fetch(`https://api.cloudinary.com/v1_1/ddvvk5jii/video/upload`, {
        method: 'POST',
        body: formData,
      });
      const cloudinaryData = await res.json();
      if (!cloudinaryData.secure_url) throw new Error('Error en la pujada');
      const newVideoRef = ref(db, `videoQueue/${crypto.randomUUID()}`);
      await set(newVideoRef, {
        url: cloudinaryData.secure_url,
        title: suggestTitle.trim(),
        suggestedBy: nickname || 'Un amic',
        userEmail: user.email,
        userId: user.uid,
        timestamp: Date.now()
      });
      await update(userRef, { lastVideoUploadDate: today });
      setSuggestMsg({ text: '✅ Vídeo enviat! Si és triat, rebràs un correu.', type: 'success' });
      setVideoFile(null);
      setSuggestTitle('');
      setTimeout(() => setShowSuggestModal(false), 3000);
    } catch (error: any) {
      setSuggestMsg({ text: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // PUJADA D'AVATAR
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
        const transformedUrl = data.secure_url.replace('/upload/', '/upload/c_fill,g_face,w_150,h_150/');
        await update(ref(db, `users/${user.uid}`), { avatarUrl: transformedUrl });
      }
    } catch (error) {
      console.error("Error pujant avatar:", error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const MAX_DAILY_ROOMS = 500;
  const checkDailyLimit = async () => {
    const today = new Date().toISOString().split('T')[0];
    const limitRef = ref(db, `dailyLimits/${today}/roomsCreated`);
    const result = await runTransaction(limitRef, (currentCount) => {
      if (currentCount >= MAX_DAILY_ROOMS) return;
      return (currentCount || 0) + 1;
    });
    return result.committed;
  };

  // El radar de peticions d'amistat
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

  // El radar d'invitacions
  useEffect(() => {
    if (!user) return;
    const invitesRef = ref(db, `users/${user.uid}/invites`);
    const unsub = onValue(invitesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const firstRoomId = Object.keys(data)[0];
        setActiveInvite({ roomId: firstRoomId, from: data[firstRoomId].from });
      } else {
        setActiveInvite(null);
      }
    });
    return () => unsub();
  }, [user]);

  // Escolta de sales públiques
  useEffect(() => {
    if (setupStep === 'joinChoice') {
      const roomsRef = ref(db, 'rooms');
      const unsub = onValue(roomsRef, (snap) => {
        if (snap.exists()) {
          const all = snap.val();
          const listed = Object.entries(all)
            .filter(([_, r]: any) => r.isPublic && r.gameState === 'lobby' && !r.isSinglePlayer)
            .map(([id, r]: any) => ({ id, room: r }))
            .sort((a, b) => (b.room.createdAt || 0) - (a.room.createdAt || 0));
          setPublicRooms(listed);
        } else {
          setPublicRooms([]);
        }
      });
      return () => unsub();
    }
  }, [setupStep]);

  const acceptInvite = async () => {
    if (!activeInvite || !user) return;
    const code = activeInvite.roomId;
    const playerId = user.uid;
    const playerNameToJoin = nickname ?? 'Convidat';
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (snap.exists()) {
        const room = snap.val();
        const existing = Object.keys(room.players || {});
        if (!existing.includes(playerId)) {
          await set(ref(db, `rooms/${code}/players/${playerId}`), {
            name: playerNameToJoin,
            joinedAt: Date.now(),
            isAdmin: !!isAdmin,
            avatarUrl: avatarUrl || null,
            badges: badges || []
          });
          await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
        }
      }
      await remove(ref(db, `users/${user.uid}/invites/${code}`));
      setActiveInvite(null);
      router.push(`/room/${code}`);
    } catch (error) {
      console.error("Error en acceptar la invitació:", error);
    }
  };

  // Estadístiques
  const [myBestWorld, setMyBestWorld] = useState<number | null>(null);
  const [myBestCat, setMyBestCat] = useState<number | null>(null);
  const [myBestEstadis, setMyBestEstadis] = useState<number | null>(null);
  const [myBestCultural, setMyBestCultural] = useState<number | null>(null);
  const [my5k, setMy5k] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile) {
        setMyBestWorld(Math.max(profile.bestScoreWorld_bala || 0, profile.bestScoreWorld_normal || 0, profile.bestScoreWorld_infinit || 0));
        setMyBestCat(Math.max(profile.bestScoreCatalunya_bala || 0, profile.bestScoreCatalunya_normal || 0, profile.bestScoreCatalunya_infinit || 0));
        setMyBestEstadis(Math.max(profile.bestScoreEstadis_bala || 0, profile.bestScoreEstadis_normal || 0, profile.bestScoreEstadis_infinit || 0));
        setMyBestCultural(Math.max(profile.bestScoreCultural_bala || 0, profile.bestScoreCultural_normal || 0, profile.bestScoreCultural_infinit || 0));
        setMy5k(profile.total5k);
      }
    });
  }, [user]);

  // Neteja de sales antigues
  useEffect(() => {
    const netejarBrossa = async () => {
      try {
        const unDia = 24 * 60 * 60 * 1000;
        const limitTemps = Date.now() - unDia;
        const oldRoomsQuery = query(ref(db, 'rooms'), orderByChild('createdAt'), endAt(limitTemps));
        const snap = await get(oldRoomsQuery);
        if (snap.exists()) snap.forEach((child) => { remove(child.ref); });
      } catch (e) { console.log('Error netejant sales', e); }
    };
    netejarBrossa();
  }, []);

  const handleSolo = async () => {
    setLoading(true); setError('');
    try {
      const playerId = getPlayerId();
      const roomCode = generateRoomCode();
      const initialPlayer: Record<string, any> = { 
        name: (playerName.trim() || nickname || 'Explorador'), 
        joinedAt: Date.now(), 
        isAdmin: !!isAdmin,
        avatarUrl: avatarUrl || null,
        badges: badges || [],
        selectedBadges: selectedBadges || []
      };
      if (gameType === '1vs1') initialPlayer.health = 10000;

      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: initialPlayer },
        currentRound: 0, gameState: 'lobby', createdAt: Date.now(),
        isSinglePlayer: true, gameMode, timeMode,
        gameType, hintsEnabled
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      router.push(`/room/${roomCode}`);
    } catch { setError('Error en crear la partida.'); setLoading(false); }
  };

  const handleCreate = async () => {
    setLoading(true); setError('');
    try {
      const canCreate = await checkDailyLimit();
      if (!canCreate) { setLoading(false); return setError(`Límit diari de sales assolit.`); }
      const playerId = getPlayerId();
      const roomCode = generateRoomCode();
      const initialPlayer: Record<string, any> = { 
        name: (playerName.trim() || nickname || 'Explorador'), 
        joinedAt: Date.now(), 
        isAdmin: !!isAdmin,
        avatarUrl: avatarUrl || null,
        badges: badges || [],
        selectedBadges: selectedBadges || []
      };
      if (gameType === '1vs1') initialPlayer.health = 10000;

      await set(ref(db, `rooms/${roomCode}`), {
        hostId: playerId,
        players: { [playerId]: initialPlayer },
        currentRound: 0, gameState: 'lobby', createdAt: Date.now(),
        isSinglePlayer: false, gameMode, timeMode,
        isPublic: isPublicRoom,
        gameType, hintsEnabled
      });
      await set(ref(db, `rooms/${roomCode}/totalScores/${playerId}`), 0);
      router.push(`/room/${roomCode}`);
    } catch { setError('Error en crear la sala.'); setLoading(false); }
  };

  const handleJoinDirect = async (code: string) => {
    setLoading(true); setError('');
    const playerId = getPlayerId();
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setError('La sala no existeix.'); setLoading(false); return; }
      const room = snap.val();
      const existing = Object.keys(room.players || {});
      if (!existing.includes(playerId)) {
        await set(ref(db, `rooms/${code}/players/${playerId}`), { 
          name: (playerName.trim() || nickname || 'Explorador'), 
          joinedAt: Date.now(), 
          isAdmin: !!isAdmin,
          avatarUrl: avatarUrl || null,
          badges: badges || [],
          selectedBadges: selectedBadges || []
        });
        await set(ref(db, `rooms/${code}/totalScores/${playerId}`), 0);
      }
      router.push(`/room/${code}`);
    } catch { setError('Error en entrar.'); setLoading(false); }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError('Introdueix el codi');
    handleJoinDirect(code);
  };

  // COMPONENTS ELEGANTS
  const GoldButton = ({ onClick, children, className = "", disabled = false, pulse = false }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group overflow-hidden px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50
        ${pulse ? 'animate-gold-pulse' : ''}
        bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 
        text-black shadow-[0_10px_40px_rgba(212,175,55,0.3)]
        hover:shadow-[0_15px_50px_rgba(212,175,55,0.5)] hover:-translate-y-1
        ${className}`}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
      <span className="relative z-10 flex items-center justify-center gap-3">{children}</span>
    </button>
  );

  const StepWrapper = ({ children, direction }: { children: React.ReactNode, direction: 'forward' | 'backward' }) => (
    <div className={direction === 'forward' ? 'animate-step-in' : 'animate-step-back'}>
      {children}
    </div>
  );

  const OptionCard = ({ selected, onClick, title, desc, icon }: any) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-500 group flex items-center gap-5
        ${selected 
          ? 'bg-indigo-600/20 border-yellow-500 shadow-[0_0_30px_rgba(212,175,55,0.2)]' 
          : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors
        ${selected ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
        {icon}
      </div>
      <div>
        <h4 className={`font-black uppercase tracking-widest ${selected ? 'text-yellow-400' : 'text-white'}`}>{title}</h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{desc}</p>
      </div>
    </button>
  );

  const StatBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-black italic" style={{ color }}>{value}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#06080f] text-white selection:bg-yellow-500/30 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen flex flex-col relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 animate-fade-in">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-5xl">🌍</span>
              <h1 className="text-5xl font-black uppercase tracking-tighter italic">La Quinta Forca</h1>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">
              Creat per <span className="text-yellow-500/80">Fortià Arumí Casals</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleMute}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-xl"
            >
              <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
            </button>

            {user && (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 pr-6 rounded-full shadow-2xl backdrop-blur-md">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#06080f]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest">{nickname}</span>
                  <button onClick={logout} className="text-[10px] text-red-400 font-black uppercase hover:underline text-left tracking-tighter">Sortir</button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTINGUT PRINCIPAL */}
        <div className="flex-1 flex flex-col items-center justify-center">
          
          {setupStep === 'idle' && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-slide-up">
              
              {/* Columna Esquerra: Juga i Botons */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start gap-12">
                <div className="text-center lg:text-left">
                  <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic mb-8 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent leading-[0.85] select-none">
                    Explora.<br/>Endevina.
                  </h2>
                  <GoldButton 
                    pulse 
                    onClick={() => {
                      if (!hasInteracted) setHasInteracted(true);
                      goToStep('type');
                    }}
                    className="text-2xl py-7 px-20 rounded-[2rem]"
                  >
                    <span>JUGA ARA</span>
                    <span className="text-4xl ml-2">→</span>
                  </GoldButton>
                </div>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link href="/stats" className="group relative px-10 py-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[11px] backdrop-blur-md text-white no-underline overflow-hidden flex items-center gap-3 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="text-xl group-hover:scale-125 transition-transform">🏆</span>
                    <span>Rànquing Global</span>
                  </Link>
                  <Link href="/badges" className="group relative px-10 py-5 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl hover:bg-indigo-600/20 transition-all font-black uppercase tracking-widest text-[11px] text-indigo-200 backdrop-blur-md no-underline overflow-hidden flex items-center gap-3 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="text-xl group-hover:rotate-12 transition-transform">🏅</span>
                    <span>Les meves Insígnies</span>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="group relative px-10 py-5 bg-red-600/10 border border-red-500/20 rounded-3xl hover:bg-red-600/20 transition-all font-black uppercase tracking-widest text-[11px] text-red-400 no-underline flex items-center gap-3">
                      <span className="text-xl">⚡</span>
                      <span>Administració</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Columna Dreta: Vídeo i Stats Ràpides */}
              <div className="lg:col-span-5 w-full flex flex-col gap-6">
                {/* Vídeo del dia */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden group backdrop-blur-md">
                  <div className="absolute top-4 right-4 z-20">
                    <span className="bg-indigo-600 text-[8px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg tracking-widest">Vídeo del dia</span>
                  </div>
                  <div className="aspect-video rounded-[2rem] overflow-hidden bg-black mb-4 relative shadow-inner">
                    <video src={homeVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-6">
                      <p className="text-sm font-black italic uppercase tracking-tight text-white">{homeVideoCaption}</p>
                      {homeVideoSuggestedBy && <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Suggerit per: {homeVideoSuggestedBy}</p>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSuggestModal(true)}
                    className="w-full mt-2 py-5 px-6 group bg-gradient-to-br from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 rounded-3xl transition-all shadow-xl flex flex-col items-center gap-2"
                  >
                    <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">
                      Vols ser l&apos;autor del següent vídeo del dia?
                    </span>
                    <span className="text-white text-[9px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                      Suggereix un vídeo del dia clicant aquí
                    </span>
                  </button>
                </div>

                {/* Estadístiques Ràpides */}
                {user && (
                  <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Millor Món" value={myBestWorld !== null ? myBestWorld.toLocaleString() : '—'} color="#10b981" />
                    <StatBox label="Millor Cat" value={myBestCat !== null ? myBestCat.toLocaleString() : '—'} color="#ef4444" />
                  </div>
                )}

                {/* Usuaris Online */}
                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 px-8 py-4 rounded-3xl backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      {onlineCount} Jugadors en línia
                    </span>
                  </div>
                  {user && !isGuest && (
                    <button onClick={() => setActiveMenu('friends')} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Veure Amics →</button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SETUP FLOW STEPS */}
          {setupStep !== 'idle' && (
            <div className="w-full max-w-xl mx-auto py-12">
              <button 
                onClick={() => {
                  const getPrevStep = (): 'idle' | 'type' | 'gameType' | 'mode' | 'time' | 'hints' | 'join' | 'joinChoice' => {
                    if (setupStep === 'mode' && tab === 'solo') return 'type';
                    const prevMap: Record<string, 'idle' | 'type' | 'gameType' | 'mode' | 'time' | 'hints' | 'join' | 'joinChoice'> = { 
                      'type': 'idle', 
                      'gameType': 'type',
                      'mode': 'gameType', 
                      'time': 'mode', 
                      'hints': 'time',
                      'join': 'joinChoice',
                      'joinChoice': 'type'
                    };
                    return prevMap[setupStep] || 'idle';
                  };
                  goToStep(getPrevStep(), 'backward');
                }}
                className="mb-12 text-gray-500 hover:text-white flex items-center gap-3 font-black uppercase tracking-[0.3em] text-[10px] transition-all group bg-transparent border-none cursor-pointer"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Tornar enrere
              </button>

              {setupStep === 'type' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-12 tracking-tighter">Com vols jugar?</h3>
                  <div className="space-y-4">
                    <OptionCard 
                      title="Individual" 
                      desc="Explora al teu ritme i bat el rànquing." 
                      icon="👤"
                      onClick={() => { setTab('solo'); setGameType('classic'); goToStep('mode'); }}
                    />
                    <OptionCard 
                      title="Crear Sala" 
                      desc="Convida amics i demostra qui és millor." 
                      icon="🏠"
                      onClick={() => { setTab('create'); goToStep('gameType'); }}
                    />
                    <OptionCard 
                      title="Unir-se" 
                      desc="Entra en una sala pública o per codi." 
                      icon="🔑"
                      onClick={() => goToStep('joinChoice')}
                    />
                  </div>
                </StepWrapper>
              )}

              {setupStep === 'joinChoice' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-12 tracking-tighter">Com vols entrar?</h3>
                  <div className="space-y-4">
                    <OptionCard 
                      title="Codi de Sala" 
                      desc="Si t'han passat un codi privat." 
                      icon="🔢"
                      onClick={() => goToStep('join')}
                    />
                    
                    <div className="pt-8">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 italic text-center">Sales Públiques Disponibles</p>
                      
                      {publicRooms.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {publicRooms.map(({ id, room }) => (
                            <button
                              key={id}
                              onClick={() => handleJoinDirect(id)}
                              className="w-full bg-white/5 border border-white/10 hover:border-yellow-500/50 hover:bg-white/10 p-5 rounded-3xl flex items-center justify-between transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🌍</div>
                                <div className="text-left">
                                  <p className="text-white font-black uppercase text-xs tracking-widest">{Object.values(room.players)[0]?.name || 'Explorador'}&apos;s Room</p>
                                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{room.gameMode} • {room.timeMode} • {Object.keys(room.players).length} jugadors</p>
                                </div>
                              </div>
                              <span className="text-yellow-500 font-black tracking-widest text-xs group-hover:translate-x-1 transition-transform">ENTRAR →</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/5 p-10 rounded-3xl text-center">
                          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic">No hi ha sales públiques en aquest moment.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </StepWrapper>
              )}

              {setupStep === 'join' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-12 tracking-tighter">Codi de Sala</h3>
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl backdrop-blur-md">
                    <input 
                      type="text" 
                      placeholder="ABCD"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-6 py-6 text-5xl font-black text-center tracking-[0.6em] focus:border-yellow-500 outline-none transition-all mb-10 text-yellow-500"
                    />
                    <GoldButton onClick={handleJoin} disabled={loading} className="w-full py-6 text-xl rounded-[1.5rem]">
                      {loading ? 'Entrant...' : 'ENTRAR A LA SALA'}
                    </GoldButton>
                  </div>
                </StepWrapper>
              )}

               {setupStep === 'gameType' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-4 tracking-tighter leading-none">Tipus de Joc</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10">⚠️ L&apos;1vs1 i el Battle Royale no sumen al rànquing global.</p>
                  <div className="space-y-4">
                    <OptionCard selected={gameType === 'classic'} title="Clàssic" desc="Puntuació estàndard de 5 rondes." icon="⭐" onClick={() => setGameType('classic')} />
                    <OptionCard selected={gameType === '1vs1'} title="1vs1 (Duel)" desc="10.000 de vida. Si perds punts, reps dany." icon="⚔️" onClick={() => setGameType('1vs1')} />
                    <OptionCard selected={gameType === 'battle_royale'} title="Battle Royale" desc="L'últim en fer punts queda eliminat." icon="👑" onClick={() => setGameType('battle_royale')} />
                  </div>
                  <GoldButton onClick={() => goToStep('mode')} className="w-full mt-10 py-6 text-xl rounded-[1.5rem]">CONTINUAR</GoldButton>
                </StepWrapper>
              )}

              {setupStep === 'mode' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-12 tracking-tighter leading-none">Escull el Mode</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <OptionCard selected={gameMode === 'world'} title="Món" desc="Ubicacions de tot el planeta." icon="🌎" onClick={() => setGameMode('world')} />
                    <OptionCard selected={gameMode === 'catalunya'} title="Catalunya" desc="Pobles i ciutats de casa nostra." icon="🔴" onClick={() => setGameMode('catalunya')} />
                    <OptionCard selected={gameMode === 'pixapins'} title="Pixapins" desc="Només indrets de Barcelona." icon="🏙️" onClick={() => setGameMode('pixapins')} />
                    <OptionCard selected={gameMode === 'estadis'} title="Estadis" desc="Camps de futbol i recintes." icon="⚽" onClick={() => setGameMode('estadis')} />
                    <OptionCard selected={gameMode === 'cultural'} title="Cultura" desc="Monuments i edificis històrics." icon="🏛️" onClick={() => setGameMode('cultural')} />
                  </div>
                  <GoldButton onClick={() => goToStep('time')} className="w-full mt-10 py-6 text-xl rounded-[1.5rem]">CONTINUAR</GoldButton>
                </StepWrapper>
              )}

              {setupStep === 'time' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-12 tracking-tighter leading-none">Temps per Ronda</h3>
                  <div className="space-y-4">
                    <OptionCard selected={timeMode === 'bala'} title="Mode Bala" desc="Ràpid com un llamp (30s)." icon="⚡" onClick={() => setTimeMode('bala')} />
                    <OptionCard selected={timeMode === 'normal'} title="Mode Normal" desc="Equilibri perfecte (60s)." icon="⏱️" onClick={() => setTimeMode('normal')} />
                    <OptionCard selected={timeMode === 'infinit'} title="Infinit" desc="Gaudeix de les vistes (Sense límit)." icon="♾️" onClick={() => setTimeMode('infinit')} />
                  </div>
                  <GoldButton onClick={() => {
                    goToStep('hints');
                  }} className="w-full mt-10 py-6 text-xl rounded-[1.5rem]">CONTINUAR</GoldButton>
                </StepWrapper>
              )}

              {setupStep === 'hints' && (
                <StepWrapper direction={animDirection}>
                  <h3 className="text-5xl font-black uppercase italic mb-4 tracking-tighter leading-none">Activar Pistes</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10">⚠️ Redueix els punts un 50% a canvi d&apos;informació clau. No guarden insígnies.</p>
                  <div className="space-y-4">
                    <OptionCard selected={hintsEnabled === true} title="Activat" desc="Permet demanar ajuda durant la ronda." icon="💡" onClick={() => setHintsEnabled(true)} />
                    <OptionCard selected={hintsEnabled === false} title="Desactivat" desc="Juga de forma pura sense ajudes." icon="🚫" onClick={() => setHintsEnabled(false)} />
                  </div>
                  <GoldButton 
                    onClick={() => { if (tab === 'create') handleCreate(); else handleSolo(); }} 
                    disabled={loading} 
                    className="w-full mt-10 py-6 text-xl rounded-[1.5rem]"
                  >
                    {loading ? 'Preparant...' : tab === 'create' ? 'CREAR SALA ARA' : 'COMENÇAR PARTIDA'}
                  </GoldButton>
                </StepWrapper>
              )}

              {error && <p className="mt-8 text-center text-red-400 text-xs font-black uppercase tracking-widest animate-pulse">{error}</p>}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left animate-fade-in pb-12">
          <div className="flex flex-wrap gap-12 justify-center">
            <button onClick={() => setShowSunoManual(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-yellow-500 transition-colors bg-transparent border-none cursor-pointer">📖 Manual Suno</button>
            <a href="mailto:laquintaforca.joc@gmail.com" className="flex flex-col text-left no-underline group">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-indigo-400 transition-colors">✉️ Contactar</span>
              <span className="text-[8px] font-bold text-gray-700 lowercase tracking-widest group-hover:text-indigo-300 transition-colors">laquintaforca.joc@gmail.com</span>
            </a>
            <a href="https://paypal.me/fortiaarumi" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-emerald-400 transition-colors no-underline">☕ Donar Suport</a>
          </div>
          <p className="text-[9px] font-bold text-gray-800 uppercase tracking-[0.3em]">© 2026 La Quinta Forca • Tots els drets reservats</p>
        </footer>

      </div>

      {/* MODAL DE PERMÍS DE MÚSICA */}
      {showMusicModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0c101d] border border-white/10 p-12 rounded-[3rem] max-w-md w-full text-center shadow-2xl shadow-yellow-500/10">
            <div className="text-6xl mb-6 text-yellow-500">🎵</div>
            <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">Vols activar la música?</h2>
            <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest leading-relaxed">
              La Quinta Forca té una banda sonora original per a una experiència immersiva.
            </p>
            <div className="flex flex-col gap-4">
              <GoldButton onClick={() => { setHasInteracted(true); setShowMusicModal(false); }} className="w-full py-6 rounded-2xl">
                SÍ, ACTIVAR ARA
              </GoldButton>
              <button 
                onClick={() => setShowMusicModal(false)}
                className="py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
              >
                No, prefereixo el silenci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showSunoManual && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0c0f1a] border border-white/10 rounded-[4rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Música al Lobby</h2>
              <button onClick={() => setShowSunoManual(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-2xl text-white border-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 text-gray-400 text-sm leading-relaxed custom-scrollbar">
              <section className="space-y-4">
                <h3 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center text-[10px]">1</span>
                  Instal·lació Bàsica
                </h3>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                  <p>• Instal·la <strong>Node.js (LTS)</strong> de nodejs.org.</p>
                  <p>• Obre la terminal i descarrega el joc:</p>
                  <code className="block bg-black/40 p-3 rounded-xl text-emerald-400 text-[10px]">git clone https://github.com/fortiaarumi/la_quinta_forca.git</code>
                  <p>• Entra a la carpeta i prepara-ho: <code className="text-white">cd la_quinta_forca</code> i després <code className="text-white">npm install</code>.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center text-[10px]">2</span>
                  Configuració Secreta
                </h3>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                  <p>• Crea un fitxer anomenat <code className="text-white">.env.local</code> i enganxa-hi això:</p>
                  <pre className="bg-black/40 p-4 rounded-xl text-emerald-400 text-[8px] overflow-x-auto">
                    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58{"\n"}
                    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com{"\n"}
                    NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app{"\n"}
                    NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5{"\n"}
                    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app{"\n"}
                    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386{"\n"}
                    NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb
                  </pre>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center text-[10px]">3</span>
                  Engegar el Robot
                </h3>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                  <p>• Executa aquesta ordre a la terminal:</p>
                  <code className="block bg-black/40 p-3 rounded-xl text-emerald-400 text-[10px]">node --env-file=.env.local suno-puppeteer.mjs</code>
                  <p>• S&apos;obrirà Chrome: inicia sessió a <strong>Suno.com</strong> i ja ho tens!</p>
                </div>
              </section>

              <p className="text-[10px] text-gray-600 italic text-center">Un cop surti &quot;Bot Online&quot;, el joc detectarà el teu bot i podràs generar cançons!</p>
            </div>
          </div>
        </div>
      )}

      {showSuggestModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0c0f1a] border border-white/10 rounded-[4rem] w-full max-w-md shadow-2xl p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Sugerir Vídeo</h2>
              <button onClick={() => { setShowSuggestModal(false); setSuggestMsg({ text: '', type: '' }); }} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-2xl text-white border-none cursor-pointer">✕</button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3 ml-2 italic">Títol del vídeo</label>
                <input type="text" value={suggestTitle} onChange={(e) => setSuggestTitle(e.target.value)} placeholder="Ex: Moment èpic" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-yellow-500 transition-all text-sm font-bold text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3 ml-2 italic">Arxiu .MP4</label>
                <input type="file" accept="video/mp4" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:bg-indigo-600 file:text-white file:border-none file:px-4 file:py-2 file:rounded-full cursor-pointer" />
              </div>
              {suggestMsg.text && (
                <div className={`p-4 rounded-2xl border text-center ${suggestMsg.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest">{suggestMsg.text}</p>
                </div>
              )}
              <GoldButton onClick={handleSuggestVideo} disabled={loading || !videoFile || !suggestTitle} className="w-full py-5 rounded-2xl">
                {loading ? 'Enviant...' : 'ENVIAR SUGGERIMENT'}
              </GoldButton>
            </div>
          </div>
        </div>
      )}

      {/* Invitacions i Peticions */}
      {activeInvite && (
        <div className="fixed bottom-10 left-10 z-[2000] animate-in slide-in-from-left duration-1000">
          <div className="bg-indigo-900/90 backdrop-blur-xl border border-indigo-400/50 rounded-[3rem] p-8 shadow-2xl flex items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-4xl shadow-2xl animate-bounce text-black">✉️</div>
            <div>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Convidat a jugar!</p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{activeInvite.from}</h3>
              <div className="flex gap-3 mt-5">
                <button onClick={acceptInvite} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl cursor-pointer border-none">Jugar ara</button>
                <button onClick={async () => { await remove(ref(db, `users/${user!.uid}/invites/${activeInvite.roomId}`)); setActiveInvite(null); }} className="bg-black/20 text-indigo-200 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black/40 transition-all cursor-pointer border-none">Refusar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFriendReq && (
        <div className="fixed bottom-10 right-10 z-[2000] animate-in slide-in-from-right duration-1000">
          <div className="bg-[#0c0f1a] border border-indigo-500/30 rounded-[3rem] p-8 shadow-2xl flex items-center gap-8 backdrop-blur-xl">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl shadow-2xl">🤝</div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Petició d&apos;amistat</p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{activeFriendReq.nickname}</h3>
              <div className="flex gap-3 mt-5">
                <button onClick={async () => { await acceptFriendRequest(user!.uid, activeFriendReq.uid); setActiveFriendReq(null); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl cursor-pointer border-none">Acceptar</button>
                <button onClick={async () => { await rejectFriendRequest(user!.uid, activeFriendReq.uid); setActiveFriendReq(null); }} className="bg-white/5 text-gray-500 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all cursor-pointer border-none">Ignorar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[3000] animate-fade-in">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 shadow-2xl flex items-center gap-6">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-sm font-bold tracking-tight text-white">
              <span className="text-indigo-400 uppercase font-black mr-3 italic tracking-widest">{chatToast.from}:</span>
              {chatToast.text}
            </p>
          </div>
        </div>
      )}

      {user && !isGuest && activeMenu === 'friends' && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0c0f1a] border border-white/10 rounded-[4rem] w-full max-w-2xl h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-slide-up">
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Comunitat</h2>
              <button onClick={() => setActiveMenu('play')} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-2xl text-white border-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-10 pb-10">
              <FriendsTab />
            </div>
          </div>
        </div>
      )}
      <PWAInstallPrompt />
    </main>
  );
}