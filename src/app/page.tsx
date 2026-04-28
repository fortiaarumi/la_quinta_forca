'use client';

import { useAuth } from '@/lib/authContext';
import AuthScreen from '@/components/AuthScreen';
import HomeScreen from '@/components/HomeScreen';

export default function Page() {
  // Afegim loginAsGuest aquí
  const { user, isGuest, loading, loginAsGuest } = useAuth();

  // 1. Pantalla de càrrega
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-emerald-400 font-black animate-pulse tracking-[0.5em] uppercase text-center">
          Carregant La Quinta Forca...
        </div>
      </div>
    );
  }

  // 2. Si no hi ha usuari ni és convidat, passem la funció al porter (AuthScreen)
  if (!user && !isGuest) {
    return <AuthScreen onGuestContinue={loginAsGuest} />;
  }

  // 3. Si ja està dins, Home
  return <HomeScreen />;
}