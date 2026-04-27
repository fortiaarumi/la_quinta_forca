'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GameRoom from '@/components/GameRoom';

export default function RoomPage() {
  const params = useParams();
  const roomId = (params.roomId as string).toUpperCase();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('geoPlayerId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('geoPlayerId', id);
    }
    setPlayerId(id);
  }, []);

  if (!playerId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregant...</div>
      </div>
    );
  }

  return <GameRoom roomId={roomId} playerId={playerId} />;
}