'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, update, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { getUserByEmail, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '@/lib/friendUtils';

interface FriendData {
  uid: string;
  nickname: string;
  status: string;
}

interface RequestData {
  uid: string;
  nickname: string;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  read: boolean;
}

// Genera l'ID de xat entre dos usuaris (sempre el mateix ordre)
function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export default function FriendsTab({ onNewMessage }: { onNewMessage?: (from: string, text: string) => void }) {
  const { user, isGuest, nickname } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  
  // Vídeo de la pestanya d'amics
  const [friendVideo, setFriendVideo] = useState({ url: '/Rochaesquiant.mp4', caption: 'Vídeo del dia' });

  // ── XAT ──
  const [openChatFriend, setOpenChatFriend] = useState<FriendData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    const unsub = onValue(ref(db, 'appConfig/home'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setFriendVideo({
          url: data.videoUrl || '/Rochaesquiant.mp4',
          caption: data.videoCaption || 'Vídeo del dia'
        });
      }
    });
    return () => unsub();
  }, []);

  // 1. Carregar amics en temps real
  useEffect(() => {
    if (!user || isGuest) return;
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    
    const unsubFriends = onValue(friendsRef, (snap) => {
      if (!snap.exists()) {
        setFriends([]);
        return;
      }
      
      const friendUids = Object.keys(snap.val());
      const unsubList: (() => void)[] = [];
      const friendsMap = new Map();

      friendUids.forEach(uid => {
        const userRef = ref(db, `users/${uid}`);
        const unsub = onValue(userRef, (uSnap) => {
          if (uSnap.exists()) {
            friendsMap.set(uid, { uid, ...uSnap.val() });
            const sortedFriends = Array.from(friendsMap.values()).sort((a, b) => {
              if (a.status === 'online' && b.status !== 'online') return -1;
              if (a.status !== 'online' && b.status === 'online') return 1;
              return 0;
            });
            setFriends(sortedFriends);
          }
        });
        unsubList.push(unsub);
      });

      return () => unsubList.forEach(u => u());
    });
    
    return () => unsubFriends();
  }, [user, isGuest]);

  // 2. Carregar peticions d'amistat
  useEffect(() => {
    if (!user || isGuest) return;
    const reqRef = ref(db, `users/${user.uid}/friendRequests`);
    const unsubReq = onValue(reqRef, async (snap) => {
      if (!snap.exists()) {
        setRequests([]);
        return;
      }
      
      const reqUids = Object.keys(snap.val());
      const reqData = await Promise.all(reqUids.map(async (uid) => {
        const uSnap = await get(ref(db, `users/${uid}/nickname`));
        return { uid, nickname: uSnap.exists() ? uSnap.val() : 'Explorador' };
      }));
      setRequests(reqData);
    });
    return () => unsubReq();
  }, [user, isGuest]);

  // 3. Comptar missatges no llegits de tots els amics
  useEffect(() => {
    if (!user || isGuest || friends.length === 0) return;
    const unsubs: (() => void)[] = [];

    friends.forEach(friend => {
      const chatId = getChatId(user.uid, friend.uid);
      const msgsRef = ref(db, `chats/${chatId}/messages`);
      const unsub = onValue(msgsRef, (snap) => {
        if (!snap.exists()) return;
        let count = 0;
        snap.forEach(child => {
          const m = child.val();
          if (m.from !== user.uid && !m.read) count++;
        });
        setUnreadCounts(prev => ({ ...prev, [friend.uid]: count }));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user, isGuest, friends]);

  // 4. Obrir xat amb un amic
  useEffect(() => {
    if (!openChatFriend || !user) return;
    const chatId = getChatId(user.uid, openChatFriend.uid);
    const msgsRef = ref(db, `chats/${chatId}/messages`);
    
    const unsub = onValue(msgsRef, (snap) => {
      if (!snap.exists()) { setChatMessages([]); return; }
      const msgs: ChatMessage[] = [];
      snap.forEach(child => {
        msgs.push({ id: child.key!, ...child.val() });
      });
      setChatMessages(msgs);
      
      // Marcar com llegits els missatges rebuts
      snap.forEach(child => {
        const m = child.val();
        if (m.from !== user.uid && !m.read) {
          update(ref(db, `chats/${chatId}/messages/${child.key}`), { read: true });
        }
      });
    });

    return () => unsub();
  }, [openChatFriend, user]);

  // Scroll automàtic als nous missatges
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Enviar missatge
  const sendMessage = async () => {
    if (!chatInput.trim() || !openChatFriend || !user) return;
    const chatId = getChatId(user.uid, openChatFriend.uid);
    await push(ref(db, `chats/${chatId}/messages`), {
      from: user.uid,
      fromNickname: nickname || 'Tu',
      text: chatInput.trim(),
      timestamp: Date.now(),
      read: false,
    });
    setChatInput('');
  };

  // Afegir amic per email
  const handleAddFriend = async () => {
    if (!emailInput || !user) return;
    setMsg({ text: 'Buscant...', type: 'info' });
    try {
      const targetUser: any = await getUserByEmail(emailInput);
      if (!targetUser) {
        setMsg({ text: "No hem trobat cap jugador amb aquest correu.", type: 'error' });
        return;
      }
      if (targetUser.uid === user.uid) {
        setMsg({ text: 'No et pots afegir a tu mateix, Fortià! 😅', type: 'error' });
        return;
      }
      await sendFriendRequest(user.uid, targetUser.uid);
      setMsg({ text: 'Petició enviada! Esperant que accepti.', type: 'success' });
      setEmailInput('');
    } catch (e: any) {
      setMsg({ text: e.message || 'Error enviant petició', type: 'error' });
    }
  };

  if (isGuest) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center text-gray-400">
        <p>Has d&apos;iniciar sessió per afegir amics.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      
      {/* Afegir Amic */}
      <div className="flex gap-2 mb-4">
        <input 
          type="email" 
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Correu electrònic de l'amic..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button 
          onClick={handleAddFriend}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
        >
          Afegir
        </button>
      </div>
      {msg.text && (
        <div className={`text-xs font-bold mb-6 px-3 py-2 rounded-lg ${msg.type === 'error' ? 'bg-red-500/20 text-red-400' : msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Peticions Pendents */}
      {requests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Peticions Pendents ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.uid} className="flex items-center justify-between bg-white/5 border border-emerald-500/30 rounded-xl p-3">
                <span className="text-white font-bold text-sm">{req.nickname} vol ser amic teu</span>
                <div className="flex gap-2">
                  <button onClick={() => acceptFriendRequest(user!.uid, req.uid)} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 px-3 py-1 rounded-lg text-sm transition-colors">Acceptar</button>
                  <button onClick={() => rejectFriendRequest(user!.uid, req.uid)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded-lg text-sm transition-colors">Rebutjar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Llista d'amics */}
      <div>
        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">La teva pinya ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Encara no tens cap amic afegit.</p>
        ) : (
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.uid} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${friend.status === 'online' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-gray-600'}`}></div>
                  <span className="text-white font-bold">{friend.nickname}</span>
                  <div className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                    {friend.status === 'online' ? <span className="text-emerald-400">En línia</span> : 'Desconnectat'}
                  </div>
                </div>
                <button
                  onClick={() => setOpenChatFriend(openChatFriend?.uid === friend.uid ? null : friend)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    openChatFriend?.uid === friend.uid
                      ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300'
                  }`}
                >
                  💬 Xat
                  {(unreadCounts[friend.uid] || 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                      {unreadCounts[friend.uid]}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PANELL DE XAT ── */}
      {openChatFriend && (
        <div className="mt-4 border border-indigo-500/30 rounded-2xl overflow-hidden bg-black/40 shadow-2xl shadow-indigo-500/10">
          {/* Capçalera del xat */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-900/40 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${openChatFriend.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-white font-black text-sm">💬 {openChatFriend.nickname}</span>
            </div>
            <button
              onClick={() => setOpenChatFriend(null)}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Missatges */}
          <div className="h-52 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-xs italic">
                Envia el primer missatge! 👋
              </div>
            ) : (
              chatMessages.map(m => {
                const isMe = m.from === user?.uid;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white/10 text-gray-200 rounded-bl-md'
                    }`}>
                      {!isMe && (
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{openChatFriend.nickname}</p>
                      )}
                      <p className="m-0 leading-snug">{m.text}</p>
                      <p className={`text-[8px] mt-0.5 m-0 ${isMe ? 'text-white/40 text-right' : 'text-gray-500'}`}>
                        {new Date(m.timestamp).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input d'enviament */}
          <div className="flex gap-2 p-3 border-t border-white/5">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escriu un missatge..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black px-4 py-2 rounded-xl transition-all active:scale-95 text-sm"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Vídeo del dia */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4 text-center">Mentre esperes els amics...</h3>
        <div className="bg-black/30 rounded-2xl p-3 border border-white/5">
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black flex justify-center mb-3">
            <video src={friendVideo.url} autoPlay loop muted playsInline className="w-full h-[150px] object-contain" />
          </div>
          <div className="text-center px-2">
            <p className="text-gray-300 text-xs font-bold m-0">{friendVideo.caption}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}