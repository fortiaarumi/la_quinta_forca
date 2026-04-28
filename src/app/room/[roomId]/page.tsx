'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import GameRoom from '@/components/GameRoom';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, isGuest, loading } = useAuth();

  // Esperem a saber qui és l'usuari abans de carregar el joc
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-emerald-400 font-black animate-pulse uppercase tracking-widest">
          Verificant Identitat...
        </div>
      </div>
    );
  }

  // Si no hi ha usuari ni és convidat, alguna cosa ha anat malament, tornem a inici
  if (!user && !isGuest) {
    window.location.href = '/';
    return null;
  }

  // DETERMINEM EL PLAYER ID:
  // Si està loguejat, usem el UID. Si és convidat, busquem el de sempre al localStorage.
  const playerId = user ? user.uid : localStorage.getItem('geoPlayerId') || 'convidat';

  return <GameRoom roomId={roomId} playerId={playerId} />;
}