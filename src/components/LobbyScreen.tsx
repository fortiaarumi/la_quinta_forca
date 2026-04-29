'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/lib/types';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest } from '@/lib/friendUtils'; // 👈 AFEGIT

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

  // AFEGIT: Variables per als amics i per saber si ja els hem convidat
  const { user, nickname } = useAuth();
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const [myFriends, setMyFriends] = useState<string[]>([]); // 👈 AFEGIT
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({}); // 👈 AFEGIT

  // AFEGIT: Busquem només els amics que estiguin 'online'
  useEffect(() => {
    if (!user) return;
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    
    const unsubFriends = onValue(friendsRef, (snap) => {
      if (!snap.exists()) {
        setOnlineFriends([]);
        setMyFriends([]); // 👈 AFEGIT
        return;
      }
      
      const friendUids = Object.keys(snap.val());
      setMyFriends(friendUids); // 👈 AFEGIT: Guardem tots els teus amics
      const unsubList: (() => void)[] = [];
      const friendsMap = new Map();

      friendUids.forEach(uid => {
        const userRef = ref(db, `users/${uid}`);
        const unsub = onValue(userRef, (uSnap) => {
          if (uSnap.exists()) {
            const data = uSnap.val();
            // Només ens interessen els que estan online per convidar-los ara mateix
            if (data.status === 'online') {
              friendsMap.set(uid, { uid, ...data });
            } else {
              friendsMap.delete(uid); // Si es desconnecten, els traiem de la llista
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

  // AFEGIT: Funció que posa la invitació a la bústia de l'amic
  const sendInvite = async (friendUid: string) => {
    if (!user || !nickname) return;
    
    // Escrivim el codi de la sala a la carpeta "invites" de l'amic
    await set(ref(db, `users/${friendUid}/invites/${roomId}`), {
      from: nickname,
      timestamp: Date.now()
    });
    
    // Marquem el botó com a "Enviat" durant uns segons perquè no facis spam
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
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold">
                  {player.name}{id === playerId ? ' (Tu)' : ''}
                </span>
                
                <div className="ml-auto flex items-center gap-2">
                  {id === room.hostId && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                      HOST
                    </span>
                  )}
                  {/* 👈 AFEGIT: Botó d'afegir amic a desconeguts */}
                  {user && id !== playerId && !myFriends.includes(id) && (
                    <button
                      onClick={async () => {
                        await sendFriendRequest(user.uid, id);
                        setFriendReqSent(prev => ({ ...prev, [id]: true }));
                      }}
                      disabled={friendReqSent[id]}
                      className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg transition-all ${
                        friendReqSent[id] ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
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

        {/* ── AFEGIT: LLISTA D'AMICS ONLINE ── */}
        {user && onlineFriends.length > 0 && (
          <div className="mb-8 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">
              Amics en línia ({onlineFriends.length})
            </p>
            <div className="space-y-2">
              {onlineFriends.map((friend) => (
                <div key={friend.uid} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="font-bold text-sm">{friend.nickname}</span>
                  </div>
                  <button
                    onClick={() => sendInvite(friend.uid)}
                    disabled={invited[friend.uid] || Object.keys(room.players).includes(friend.uid)}
                    className={`text-xs px-4 py-2 rounded-lg font-black tracking-wider uppercase transition-all ${
                      Object.keys(room.players).includes(friend.uid)
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

        {/* ── AFEGIT: VÍDEO DEL DIA A LA SALA D'ESPERA ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">📹 Entreteniment</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black flex justify-center mb-3 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-50 pointer-events-none" />
              <video src="/Rochaesquiant.mp4" autoPlay loop muted playsInline className="w-full h-[200px] object-contain relative z-10" />
            </div>
            <div className="flex items-center gap-3 px-2">
              <span className="text-xl">⛷️</span>
              <div>
                <p className="text-gray-300 text-xs font-bold m-0">Roger Bernadó masterclass</p>
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
    </div>
  );
}