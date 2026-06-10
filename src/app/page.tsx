'use client';

import { useAuth } from '@/lib/authContext';
import AuthScreen from '@/components/AuthScreen';
import HomeScreen from '@/components/HomeScreen';

export default function Page() {
  const { user, isGuest, loading, loginAsGuest } = useAuth();

  // 1. Pantalla de càrrega — branded, premium
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--bg-deep)' }}>
        {/* Atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(212,167,44,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Pulsing globe */}
          <div className="text-5xl animate-pulse" style={{ filter: 'drop-shadow(0 0 20px rgba(212,167,44,0.5))' }}>
            🌍
          </div>
          {/* Display font wordmark */}
          <p
            className="tracking-[0.5em] uppercase animate-pulse text-sm font-black"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--gold)',
              letterSpacing: '0.5em',
            }}
          >
            La Quinta Forca
          </p>
          {/* Loading dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: 'var(--gold)',
                  opacity: 0.6,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
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