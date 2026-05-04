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
        <div className="flex flex-col h-64 md:h-80 w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-inner">
            {/* Capçalera del xat */}
            <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-700 text-sm font-bold text-gray-300 flex items-center gap-2">
                <span>💬</span> Xat de la Sala
            </div>

            {/* Llista de missatges */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-gray-500 text-xs text-center italic h-full flex items-center justify-center">
                        Cap missatge encara. Saluda als teus amics!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === playerId;
                        const senderName = room.players[msg.senderId]?.name || 'Jugador desconegut';

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="text-[10px] text-gray-500 mb-0.5 ml-1 mr-1 flex gap-2">
                                    <span>{isMe ? 'Tu' : senderName}</span>
                                    <span>{formatTime(msg.timestamp)}</span>
                                </div>
                                <div
                                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-md break-words ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input per escriure */}
            <form onSubmit={handleSendMessage} className="bg-gray-800/80 p-2 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escriu un missatge..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    maxLength={150}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95"
                >
                    ➤
                </button>
            </form>
        </div>
    );
}