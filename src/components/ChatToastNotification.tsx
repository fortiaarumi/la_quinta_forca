'use client';

import { useEffect, useRef, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

interface Props {
  /** Firebase room ID — used to subscribe to rooms/{roomId}/chat */
  roomId: string;
  /** The current player's ID — used to skip own messages */
  playerId: string;
  /** When true, all toast pop-ups are suppressed (mute toggle from FriendsTab) */
  muted: boolean;
}

interface ToastPayload {
  sender: string;
  text: string;
}

/**
 * In-game chat toast notification (Task 3c).
 *
 * Mounts silently. When a new room-chat message arrives from another player
 * (identified by comparing the last message timestamp to the previous value),
 * renders a premium iOS-style pill pop-up at the top of the viewport.
 * Auto-dismisses after exactly 5 000 ms. Fully suppressed when `muted` is true.
 */
export default function ChatToastNotification({ roomId, playerId, muted }: Props) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the last seen message timestamp to detect genuinely NEW messages
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    const chatRef = ref(db, `rooms/${roomId}/chat`);

    const unsub = onValue(chatRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.val();
      const keys = Object.keys(data);
      if (keys.length === 0) return;

      // Grab the chronologically last message
      const sorted = keys
        .map((k) => ({ id: k, ...data[k] }))
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      const last = sorted[sorted.length - 1] as any;

      // Only fire if the message is genuinely new (not a re-snapshot of old data)
      // and it was not sent by the current player
      if (
        last.timestamp <= lastTimestampRef.current ||
        last.senderId === playerId
      ) {
        return;
      }

      lastTimestampRef.current = last.timestamp;

      // Suppress when muted
      if (muted) return;

      const sender = last.senderName || last.senderId || 'Un company';
      const text = last.text || '';

      // Clear any pending dismiss
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      setToast({ sender, text });

      // Auto-dismiss after exactly 5 seconds
      dismissTimer.current = setTimeout(() => {
        setToast(null);
      }, 5000);
    });

    return () => {
      unsub();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [roomId, playerId, muted]);

  if (!toast) return null;

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="bg-black/80 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 max-w-xs">
        {/* Animated presence dot */}
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />

        {/* Message content */}
        <p className="text-sm font-bold tracking-tight truncate">
          <span className="text-indigo-300 font-black uppercase tracking-widest text-[10px] mr-2">
            {toast.sender}:
          </span>
          {toast.text}
        </p>

        {/* Dismiss manually by tapping */}
        <button
          className="pointer-events-auto ml-1 text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-base flex-shrink-0 leading-none"
          onClick={() => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
            setToast(null);
          }}
          aria-label="Tancar notificació"
        >
          ×
        </button>
      </div>
    </div>
  );
}
