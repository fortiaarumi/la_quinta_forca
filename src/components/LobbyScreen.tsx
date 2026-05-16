'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/lib/types';
import { ref, onValue, set, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils';
import LobbyChat from './LobbyChat';
import DailyVideo from './DailyVideo';
import { useRouter } from 'next/navigation';
import { ALL_BADGES } from '@/lib/badges';
import { useAudio } from '@/lib/AudioContext';

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
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const { isMuted, toggleMute, nextTrack, prevTrack, hasInteracted } = useAudio();

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

  const handleShuffleTeams = async () => {
    if (!isHost || !room.teamSettings) return;
    const teamCount = room.teamSettings.count;
    const playerIds = Object.keys(room.players);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    
    const updates: Record<string, any> = {};
    shuffled.forEach((id, index) => {
      const teamIdx = (index % teamCount) + 1;
      updates[`players/${id}/teamId`] = `Equip ${teamIdx}`;
    });
    
    await update(ref(db, `rooms/${roomId}`), updates);
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
            {isHost && room.gameType === 'teams' && (
              <button
                onClick={handleShuffleTeams}
                className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/30 transition-all text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                🎲 BARREJAR
              </button>
            )}
          </div>
          <div className="space-y-6">
            {room.gameType === 'teams' ? (
              // VISTA PER EQUIPS
              Array.from({ length: room.teamSettings?.count || 2 }).map((_, i) => {
                const teamName = `Equip ${i + 1}`;
                const teamPlayers = players.filter(([_, p]) => p.teamId === teamName);
                const colors = ['border-blue-500/30 bg-blue-500/5', 'border-red-500/30 bg-red-500/5', 'border-emerald-500/30 bg-emerald-500/5', 'border-yellow-500/30 bg-yellow-500/5'];
                const textColors = ['text-blue-400', 'text-red-400', 'text-emerald-400', 'text-yellow-400'];
                
                return (
                  <div key={teamName} className={`rounded-3xl border p-4 ${colors[i % 4]}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2 ${textColors[i % 4]}`}>
                      <span className="opacity-50">#</span> {teamName}
                    </h4>
                    <div className="space-y-2">
                      {teamPlayers.length > 0 ? teamPlayers.map(([id, player]) => (
                        <div key={id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border border-white/5">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                            {player.avatarUrl ? <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs opacity-40">👤</span>}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-[11px] uppercase tracking-tight truncate">{player.name}{id === playerId ? ' (Tu)' : ''}</span>
                            {id === playerId && (
                              <select 
                                value={player.teamId}
                                onChange={async (e) => {
                                  await update(ref(db, `rooms/${roomId}/players/${playerId}`), { teamId: e.target.value });
                                }}
                                className="bg-transparent text-indigo-400 text-[9px] font-black uppercase tracking-widest border-none outline-none cursor-pointer hover:text-white transition-colors appearance-auto pr-8"
                              >
                                {Array.from({ length: room.teamSettings?.count || 2 }).map((_, idx) => {
                                  const tName = `Equip ${idx + 1}`;
                                  const tSize = players.filter(([_, p]) => p.teamId === tName).length;
                                  const isFull = tSize >= (room.teamSettings?.size || 2) && player.teamId !== tName;
                                  return (
                                    <option key={tName} value={tName} disabled={isFull} className="bg-[#0c0f1a] text-white">
                                      {tName} {isFull ? '(Ple)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                          {id === room.hostId && <span className="ml-auto text-[6px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-black">HOST</span>}
                        </div>
                      )) : (
                        <p className="text-[9px] text-gray-600 italic uppercase tracking-widest text-center py-2">Esperant jugadors...</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // VISTA CLÀSSICA (LLISTA PLANA)
              players.map(([id, player]) => (
                <div key={id} className={`flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10 ${id === playerId ? 'border-indigo-500/30' : ''}`}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-black/40 flex items-center justify-center shadow-inner">
                      {player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" /> : <span className="text-xl opacity-40">👤</span>}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c0f1a] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">{player.name}{id === playerId ? ' (Tu)' : ''}</span>
                    {((player.selectedBadges?.length ? player.selectedBadges : player.badges) || []).length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {((player.selectedBadges?.length ? player.selectedBadges : player.badges) || []).slice(0, 3).map((bId: string, bi: number) => {
                          const badgeDef = ALL_BADGES.find(b => b.id === bId);
                          return (
                            <div
                              key={bi}
                              className="group relative flex items-center justify-center cursor-pointer"
                              onClick={() => setSelectedBadge(bId)}
                            >
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
              ))
            )}
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
            <div className="mb-4 relative group">
              <DailyVideo 
                src={lobbyVideo.url} 
                containerClassName="rounded-2xl shadow-2xl border border-white/10" 
                className="transition-transform duration-700 group-hover:scale-110" 
              />
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

      {/* NOU: MODAL GLOBAL D'INSÍGNIES */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer" onClick={() => setSelectedBadge(null)}>
          <div className="bg-[#0c0f1a] border-2 border-indigo-500/30 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_80px_rgba(99,102,241,0.3)] relative cursor-default" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedBadge(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white text-2xl bg-transparent border-none cursor-pointer">✕</button>
            {(() => {
              const bDef = ALL_BADGES.find(b => b.id === selectedBadge);
              return (
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 mb-6 relative"><div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" /><img src={bDef?.image || '/badges/default.jpeg'} alt={selectedBadge} className="w-full h-full object-contain relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500" /></div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">{bDef?.label}</h2>
                  <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-6">{bDef?.desc}</p>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full"><p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Insígnia de La Quinta Forca</p></div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* ── CONTROLS D'ÀUDIO ── */}
      {hasInteracted && (
        <div className="fixed top-4 right-4 z-[5000] flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-lg">
          <button onClick={prevTrack} title="Pista anterior" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏮</button>
          <button onClick={toggleMute} title={isMuted ? 'Activar so' : 'Silenciar'} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-xs border border-white/5 cursor-pointer">{isMuted ? '🔇' : '🔊'}</button>
          <button onClick={nextTrack} title="Pista següent" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center border-none cursor-pointer text-white text-xs">⏭</button>
        </div>
      )}
    </div>
  );
}