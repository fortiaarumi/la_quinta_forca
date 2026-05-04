'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/lib/types';
import { ref, onValue, set, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils';
import LobbyChat from './LobbyChat';

interface Props {
  room: Room;
  roomId: string;
  playerId: string;
  isHost: boolean;
  onStart: () => void;
  isGenerating: boolean;
  mapsReady: boolean;
}

export default function LobbyScreen({
  room, roomId, playerId, isHost, onStart, isGenerating, mapsReady,
}: Props) {
  const [copied, setCopied] = useState(false);
  const players = Object.entries(room.players);
  const canStart = isHost && players.length >= 2 && mapsReady && !isGenerating;

  const { user, nickname } = useAuth();
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({});

  // Vídeo dinàmic de la sala d'espera
  const [lobbyVideo, setLobbyVideo] = useState({ url: '/Rochaesquiant.mp4', caption: 'Vídeo del dia' });

  // ── NOU: Petició d'amistat en temps real al lobby ──
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

  // ── NOU: Radar de peticions d'amistat al lobby ──
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

  // Busquem els amics que estiguin 'online'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌍</div>
          <h1 className="text-3xl font-black">Sala d&apos;espera</h1>
        </div>

        {/* Codi de sala */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 mb-6 text-center shadow-xl">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Codi de Sala</p>
          <p className="text-5xl font-black font-mono tracking-[0.3em] mb-4 text-white">{roomId}</p>
          <button
            onClick={copyCode}
            className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
          >
            {copied ? '✓ Copiat!' : '📋 Copiar codi'}
          </button>
        </div>

        {/* Jugadors */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Jugadors ({players.length}/10)
          </p>
          <div className="space-y-2">
            {players.map(([id, player]) => (
              <div key={id} className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg opacity-40">👤</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-800 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {player.name}{id === playerId ? ' (Tu)' : ''}
                  </span>
                  {player.badges && player.badges.length > 0 && (
                    <div className="flex gap-1 mt-0.5 overflow-hidden">
                      {player.badges.slice(0, 2).map((b, bi) => (
                        <span key={bi} className="text-[7px] text-indigo-300 font-bold uppercase truncate">🏅 {b}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {id === room.hostId && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                      HOST
                    </span>
                  )}
                  {user && id !== playerId && !myFriends.includes(id) && (
                    <button
                      onClick={async () => {
                        await sendFriendRequest(user.uid, id);
                        setFriendReqSent(prev => ({ ...prev, [id]: true }));
                      }}
                      disabled={friendReqSent[id]}
                      className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg transition-all ${friendReqSent[id] ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                        }`}
                    >
                      {friendReqSent[id] ? '✓ Petició Enviada' : '+ Afegir Amic'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amics online */}
        {user && onlineFriends.length > 0 && (
          <div className="mb-8 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">
              Amics en línia ({onlineFriends.length})
            </p>
            <div className="space-y-2">
              {onlineFriends.map((friend) => (
                <div key={friend.uid} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs opacity-40">👤</span>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                    <span className="font-bold text-sm">{friend.nickname}</span>
                  </div>
                  <button
                    onClick={() => sendInvite(friend.uid)}
                    disabled={invited[friend.uid] || Object.keys(room.players).includes(friend.uid)}
                    className={`text-xs px-4 py-2 rounded-lg font-black tracking-wider uppercase transition-all ${Object.keys(room.players).includes(friend.uid)
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      : invited[friend.uid]
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 shadow-lg'
                      }`}
                  >
                    {Object.keys(room.players).includes(friend.uid) ? 'A la sala' : invited[friend.uid] ? '✓ Enviat' : 'Convidar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOU: XAT DEL LOBBY ── */}
        <div className="mb-8">
          <LobbyChat roomId={roomId} playerId={playerId} room={room} />
        </div>

        {/* Vídeo del dia */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">📹 Entreteniment</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black flex justify-center mb-3 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-50 pointer-events-none" />
              <video src={lobbyVideo.url} autoPlay loop muted playsInline className="w-full h-[200px] object-contain relative z-10" />
            </div>
            <div className="flex items-center gap-3 px-2">
              <span className="text-xl">⛷️</span>
              <div>
                <p className="text-gray-300 text-xs font-bold m-0">{lobbyVideo.caption}</p>
                <p className="text-gray-500 text-[9px] uppercase tracking-widest m-0 mt-1">Video del dia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botó / estat */}
        {isHost ? (
          <>
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-3xl text-xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-20 uppercase tracking-tighter mt-4"
            >
              {isGenerating
                ? '⌛ GENERANT MAPA...'
                : !mapsReady
                  ? '⌛ CARREGANT...'
                  : players.length < 2
                    ? '⏳ ESPERANT JUGADORS...'
                    : '🚀 INICIAR PARTIDA'}
            </button>
            {!canStart && mapsReady && !isGenerating && players.length < 2 && (
              <p className="text-center text-gray-500 text-sm mt-3">
                Esperant almenys 1 jugador més per iniciar...
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 text-lg">
              {isGenerating
                ? '⚙️ El host genera les ubicacions...'
                : '⏳ Esperant que el host iniciï...'}
            </div>
          </div>
        )}
      </div>

      {/* ── POP-UP DE PETICIÓ D'AMISTAT AL LOBBY ── */}
      {activeFriendReq && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '24px', padding: '32px',
            maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 24px 50px rgba(16,185,129,0.2)',
            animation: 'none'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
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
    </div>
  );
}