'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/lib/types';
import { ref, onValue, set, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils';
import LobbyChat from './LobbyChat';
import { useRouter } from 'next/navigation';
import { ALL_BADGES } from '@/lib/badges';

interface Props {
  room: Room;
  roomId: string;
  playerId: string;
  isHost: boolean;
  onStart: () => void;
  isGenerating: boolean;
  mapsReady: boolean;
  onLeave: () => void;
}

export default function LobbyScreen({
  room, roomId, playerId, isHost, onStart, isGenerating, mapsReady, onLeave
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showHostMessage, setShowHostMessage] = useState(false);

  useEffect(() => {
    if (room.hostId === playerId && !isHost) {
      setShowHostMessage(true);
      setTimeout(() => setShowHostMessage(false), 5000);
    }
  }, [room.hostId, playerId, isHost]);

  const players = Object.entries(room.players).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
  const canStart = isHost && players.length >= 2 && mapsReady && !isGenerating;

  const { user, nickname } = useAuth();
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({});

  const [lobbyVideo, setLobbyVideo] = useState({ url: '/Rochaesquiant.mp4', caption: 'Vídeo del dia' });
  const [activeFriendReq, setActiveFriendReq] = useState<{ uid: string; nickname: string } | null>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'appConfig/home'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setLobbyVideo({
          url: data.videoUrl || '/Rochaesquiant.mp4',
          caption: data.videoCaption || 'Vídeo del dia'
        });
      }
    });
    return () => unsub();
  }, []);

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

  useEffect(() => {
    if (!user) return;
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsubFriends = onValue(friendsRef, (snap) => {
      if (!snap.exists()) {
        setOnlineFriends([]);
        setMyFriends([]);
        return;
      }
      const friendUids = Object.keys(snap.val());
      setMyFriends(friendUids);
      const unsubList: (() => void)[] = [];
      const friendsMap = new Map();
      friendUids.forEach(uid => {
        const userRef = ref(db, `users/${uid}`);
        const unsub = onValue(userRef, (uSnap) => {
          if (uSnap.exists()) {
            const data = uSnap.val();
            if (data.status === 'online') {
              friendsMap.set(uid, { uid, ...data });
            } else {
              friendsMap.delete(uid);
            }
            setOnlineFriends(Array.from(friendsMap.values()));
          }
        });
        unsubList.push(unsub);
      });
      return () => unsubList.forEach(u => u());
    });
    return () => unsubFriends();
  }, [user]);

  const sendInvite = async (friendUid: string) => {
    if (!user || !nickname) return;
    await set(ref(db, `users/${friendUid}/invites/${roomId}`), {
      from: nickname,
      timestamp: Date.now()
    });
    setInvited(prev => ({ ...prev, [friendUid]: true }));
    setTimeout(() => {
      setInvited(prev => ({ ...prev, [friendUid]: false }));
    }, 3000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex flex-col items-center justify-start pt-16 md:pt-20 p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🌍</div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Sala d&apos;espera</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">La Quinta Forca — Multiplayer</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 mb-8 text-center shadow-2xl">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic">Codi de Sala</p>
          <p className="text-6xl font-black font-mono tracking-[0.3em] mb-6 text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">{roomId}</p>
          <button onClick={copyCode} className="text-[10px] uppercase font-black tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors bg-transparent border-none cursor-pointer">
            {copied ? '✓ Copiat al porta-retalls' : '📋 Copiar codi'}
          </button>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Jugadors <span className="text-white italic">({players.length}/10)</span>
            </p>
          </div>
          <div className="space-y-3">
            {players.map(([id, player]) => (
              <div key={id} className={`flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10 ${id === playerId ? 'border-indigo-500/30' : ''}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-black/40 flex items-center justify-center shadow-inner">
                    {player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" /> : <span className="text-xl opacity-40">👤</span>}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c0f1a] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase tracking-tight">{player.name}{id === playerId ? ' (Tu)' : ''}</span>
                  {player.badges && player.badges.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {player.badges.slice(0, 3).map((bId: string, bi: number) => {
                        const badgeDef = ALL_BADGES.find(b => b.id === bId);
                        return (
                          <div key={bi} className="group relative flex items-center justify-center cursor-pointer">
                            <img src={badgeDef?.image || '/badges/default.png'} alt={bId} className="w-5 h-5 object-contain drop-shadow-md group-hover:scale-125 transition-transform" />
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-yellow-500/50 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                              {bId}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {id === room.hostId && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-yellow-500/30">HOST</span>}
                  {user && id !== playerId && !myFriends.includes(id) && (
                    <button
                      onClick={async () => { await sendFriendRequest(user.uid, id); setFriendReqSent(prev => ({ ...prev, [id]: true })); }}
                      disabled={friendReqSent[id]}
                      className={`text-[9px] uppercase font-black px-3 py-2 rounded-xl transition-all ${friendReqSent[id] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
                    >
                      {friendReqSent[id] ? '✓ Enviada' : '+ Amic'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {user && onlineFriends.length > 0 && (
          <div className="mb-10 bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-6 shadow-2xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 text-center">Amics en línia ({onlineFriends.length})</p>
            <div className="space-y-3">
              {onlineFriends.map((friend) => (
                <div key={friend.uid} className="flex items-center justify-between bg-black/40 rounded-2xl p-3 border border-white/5 transition-all hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                        {friend.avatarUrl ? <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs opacity-40">👤</span>}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight">{friend.nickname}</span>
                  </div>
                  <button
                    onClick={() => sendInvite(friend.uid)}
                    disabled={invited[friend.uid] || Object.keys(room.players).includes(friend.uid)}
                    className={`text-[9px] px-4 py-2 rounded-xl font-black tracking-widest uppercase transition-all ${Object.keys(room.players).includes(friend.uid) ? 'bg-gray-500/20 text-gray-400' : invited[friend.uid] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
                  >
                    {Object.keys(room.players).includes(friend.uid) ? 'A la sala' : invited[friend.uid] ? '✓ Enviat' : 'Convidar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <LobbyChat roomId={roomId} playerId={playerId} room={room} />
        </div>

        <div className="mb-10">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black flex justify-center mb-4 relative group">
              <video src={lobbyVideo.url} autoPlay loop muted playsInline className="w-full h-[220px] object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black text-sm shadow-lg">📹</div>
                <div>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest leading-none">{lobbyVideo.caption}</p>
                  <p className="text-gray-400 text-[8px] uppercase tracking-widest mt-1">Vídeo del dia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isHost ? (
            <>
              <button
                onClick={onStart}
                disabled={!canStart}
                className={`w-full py-6 rounded-[2rem] text-xl font-black uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-20
                  ${canStart
                    ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 text-black shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_50px_rgba(212,175,55,0.5)]'
                    : 'bg-white/10 text-gray-500'}`}
              >
                {isGenerating ? '⌛ GENERANT...' : !mapsReady ? '⌛ CARREGANT...' : players.length < 2 ? '⏳ ESPERANT JUGADORS...' : '🚀 COMENÇAR PARTIDA'}
              </button>
            </>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center">
              <div className="text-gray-400 text-sm font-black uppercase tracking-widest animate-pulse">
                {isGenerating ? '⚙️ Generant ubicacions...' : '⏳ Esperant que el host iniciï...'}
              </div>
            </div>
          )}

          <button
            onClick={onLeave}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.3em] mt-2"
          >
            🚪 Sortir de la sala
          </button>
        </div>
      </div>

      {showHostMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[5000]">
          <div className="bg-yellow-500 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl flex items-center gap-4">
            <span className="text-2xl">👑</span> ARA ETS EL HOST DE LA PARTIDA!
          </div>
        </div>
      )}

      {activeFriendReq && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-indigo-500/30 rounded-[2rem] p-8 maxWidth-[360px] width-[90%] text-center shadow-2xl">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="text-white text-2xl font-black mb-2">Nou Amic!</h3>
            <p className="text-gray-400 text-sm mb-6"><strong>{activeFriendReq.nickname}</strong> vol afegir-te.</p>
            <div className="flex gap-4">
              <button onClick={declineFriend} className="flex-1 p-4 rounded-xl bg-white/5 text-gray-500 font-black">Rebutjar</button>
              <button onClick={acceptFriend} className="flex-1 p-4 rounded-xl bg-emerald-500 text-black font-black shadow-lg">Acceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}