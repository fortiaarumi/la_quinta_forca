'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Room } from '@/lib/types';

interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface Props {
    roomId: string;
    playerId: string;
    room: Room;
}

export default function LobbyChat({ roomId, playerId, room }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Descarregar i escoltar els missatges en temps real
    useEffect(() => {
        const chatRef = ref(db, `rooms/${roomId}/chat`);
        const unsub = onValue(chatRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const msgList = Object.entries(data).map(([key, val]: any) => ({
                    id: key,
                    ...val
                })).sort((a, b) => a.timestamp - b.timestamp);
                setMessages(msgList);
            } else {
                setMessages([]);
            }
        });
        return () => unsub();
    }, [roomId]);

    // Fer auto-scroll cap a baix quan arriba un missatge nou
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Enviar el missatge a Firebase
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const chatRef = ref(db, `rooms/${roomId}/chat`);
        const newMsgRef = push(chatRef);

        await set(newMsgRef, {
            senderId: playerId,
            text: newMessage.trim(),
            timestamp: Date.now()
        });

        setNewMessage('');
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-72 md:h-96 w-full bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {/* Capçalera del xat */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-5 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest text-zinc-100">Xat de la Sala</span>
            </div>

            {/* Llista de missatges */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-zinc-600 text-sm text-center italic h-full flex items-center justify-center">
                        Cap missatge encara. Saluda als teus amics!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === playerId;
                        const senderName = room.players[msg.senderId]?.name || 'Jugador desconegut';

                        return (
                            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0 mt-1 bg-zinc-800">
                                    {room.players[msg.senderId]?.avatarUrl ? (
                                        <img src={room.players[msg.senderId].avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-[10px]">👤</div>
                                    )}
                                </div>
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className="text-[10px] text-zinc-500 mb-1 ml-1 mr-1 font-bold flex gap-2">
                                        <span>{isMe ? 'Tu' : senderName}</span>
                                        <span>{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-base shadow-md break-words w-full ${
                                            isMe
                                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input per escriure */}
            <form onSubmit={handleSendMessage} className="bg-zinc-950/80 p-3 border-t border-white/5 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escriu un missatge..."
                    className="flex-1 bg-zinc-800 border border-white/5 rounded-2xl px-4 py-3 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    maxLength={150}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white min-w-[48px] py-3 px-4 rounded-2xl text-base font-black transition-all active:scale-95"
                >
                    ➤
                </button>
            </form>
        </div>
    );
}