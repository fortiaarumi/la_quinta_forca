'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/userStats';
import { useAuth } from '@/lib/authContext';

interface Props {
  onGuestContinue: () => void;
}

type Panel = 'welcome' | 'login' | 'signup' | 'guest' | 'reset';

const GlassInput = ({
  type, placeholder, value, onChange, autoComplete,
}: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    autoComplete={autoComplete}
    style={{
      width: '100%',
      background: 'rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '14px',
      padding: '15px 20px',
      color: 'white',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    }}
    onFocus={(e) => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
  />
);

export default function AuthScreen({ onGuestContinue }: Props) {
  const { setGuestMode } = useAuth();
  const [panel, setPanel] = useState<Panel>('welcome');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRepeat, setSignupRepeat] = useState('');
  const [signupNick, setSignupNick] = useState('');

  // Guest
  const [guestNick, setGuestNick] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetRepeat, setResetRepeat] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');
  const handleResetPassword = async () => {
    if (!resetEmail.trim() || !resetRepeat.trim()) return setError('Emplena tots els camps');
    if (resetEmail.trim() !== resetRepeat.trim()) return setError('Els correus no coincideixen');
    setLoading(true); clearError(); setResetMsg('');
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMsg('✅ Revisa el teu correu (i la carpeta de Spam). T\'hem enviat les instruccions per restablir la contrasenya.');
      setResetEmail('');
      setResetRepeat('');
    } catch (e: any) {
      setError('Error en enviar el correu. Segur que està ben escrit?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) return setError('Emplena tots els camps');
    setLoading(true); clearError();
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      // onAuthStateChanged del context s'encarregarà de la resta
    } catch (e: any) {
      const codes: Record<string, string> = {
        'auth/user-not-found': 'Usuari no trobat.',
        'auth/wrong-password': 'Contrasenya incorrecta.',
        'auth/invalid-email': 'Correu electrònic invàlid.',
        'auth/invalid-credential': 'Credencials incorrectes.',
      };
      setError(codes[e.code] ?? 'Error en accedir. Torna-ho a provar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupNick.trim()) return setError('El nickname és obligatori');
    if (signupNick.trim().length < 2) return setError('El nickname ha de tenir almenys 2 caràcters');
    if (!signupEmail.trim()) return setError('El correu és obligatori');
    if (signupPassword.length < 6) return setError('La contrasenya ha de tenir almenys 6 caràcters');
    if (signupPassword !== signupRepeat) return setError('Les contrasenyes no coincideixen');
    setLoading(true); clearError();
    try {
      const cred = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword);
      await createUserProfile(cred.user.uid, signupNick.trim(), signupEmail.trim());
    } catch (e: any) {
      const codes: Record<string, string> = {
        'auth/email-already-in-use': 'Aquest correu ja està en ús.',
        'auth/invalid-email': 'Correu electrònic invàlid.',
        'auth/weak-password': 'La contrasenya és massa feble.',
      };
      setError(codes[e.code] ?? 'Error en registrar-se.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (!guestNick.trim()) return setError('Introdueix un nom de convidat');
    localStorage.setItem('geoGuestName', guestNick.trim());
    let id = localStorage.getItem('geoPlayerId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('geoPlayerId', id); }
    setGuestMode(true);
    onGuestContinue();
  };

  const bg = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '28px',
    padding: '36px 32px',
  };

  const btnPrimary = (disabled = false) => ({
    width: '100%',
    background: disabled ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
    fontWeight: 900 as const,
    padding: '17px',
    borderRadius: '14px',
    fontSize: '16px',
    border: 'none',
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    boxShadow: disabled ? 'none' : '0 6px 24px rgba(16,185,129,0.35)',
    transition: 'all 0.2s',
    letterSpacing: '-0.01em',
  });

  const btnSecondary = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 700 as const,
    padding: '15px',
    borderRadius: '14px',
    fontSize: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
  };

  const label = {
    display: 'block' as const,
    color: 'rgba(255,255,255,0.3)',
    fontSize: '9px',
    fontWeight: 900 as const,
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  };

  return (
    <div
      className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden"
      style={{ background: '#06080f' }}
    >
      {/* Fons decoratiu */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.13) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '30%', height: '30%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 py-12">

        {/* Logo / Títol */}
        <div className="text-center mb-8">
          <div style={{ fontSize: '52px', marginBottom: '10px', filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.4))' }}>🌍</div>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
            La Quinta Forca
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '6px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            Projecte Alpha
          </p>
        </div>

        {/* ── PANELL BENVINGUDA ── */}
        {panel === 'welcome' && (
          <div style={bg}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => { setPanel('signup'); clearError(); }}
                style={btnPrimary()}
              >
                ✨ Crear Compte
              </button>
              <button
                onClick={() => { setPanel('login'); clearError(); }}
                style={{
                  ...btnSecondary,
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontWeight: 800,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                🔑 Iniciar Sessió
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em' }}>O</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <button
                onClick={() => { setPanel('guest'); clearError(); }}
                style={btnSecondary}
              >
                👤 Continuar com a Convidat
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
              El compte guarda les teves estadístiques i puntuacions als rànquings globals.
            </p>
          </div>
        )}

        {/* ── PANELL LOGIN ── */}
        {panel === 'login' && (
          <div style={bg}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>
              🔑 Iniciar Sessió
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={label}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={loginEmail} onChange={setLoginEmail} autoComplete="email" />
              </div>
              <div>
                <label style={label}>Contrasenya</label>
                <GlassInput type="password" placeholder="••••••••" value={loginPassword} onChange={setLoginPassword} autoComplete="current-password" />
              </div>
            </div>
            {}
            <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
              <button 
                onClick={() => { setPanel('reset'); clearError(); }} 
                style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '11px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Has oblidat la contrasenya?
              </button>
            </div>
            {error && <ErrorBox msg={error} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={btnPrimary(loading)}
              >
                {loading ? '⌛ Accedint...' : 'Accedir'}
              </button>
              <button onClick={() => { setPanel('welcome'); clearError(); }} style={btnSecondary}>
                ← Tornar
              </button>
            </div>
          </div>
        )}

        {/* ── AFEGIT: PANELL RECUPERAR CONTRASENYA ── */}
        {panel === 'reset' && (
          <div style={bg}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>
              🔒 Recuperar Contrasenya
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textAlign: 'center', marginBottom: '10px', lineHeight: 1.5 }}>
              Introdueix el teu correu electrònic i t'enviarem un enllaç per crear una nova contrasenya.
            </p>
            <p style={{ color: '#f59e0b', fontSize: '10px', textAlign: 'center', marginBottom: '20px', fontWeight: 700 }}>
              ⚠️ Revisa la carpeta de Correu Brossa (Spam) si triga a arribar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={label}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={resetEmail} onChange={setResetEmail} />
              </div>
              <div>
                <label style={label}>Repetir Correu</label>
                <GlassInput type="email" placeholder="Repeteix el correu" value={resetRepeat} onChange={setResetRepeat} />
              </div>
            </div>
            {error && <ErrorBox msg={error} />}
            {resetMsg && (
              <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#34d399', fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '15px' }}>
                {resetMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleResetPassword} disabled={loading} style={btnPrimary(loading)}>
                {loading ? '⌛ Enviant correu...' : '📧 Enviar Correu'}
              </button>
              <button onClick={() => { setPanel('login'); clearError(); setResetMsg(''); }} style={btnSecondary}>
                ← Tornar a Iniciar Sessió
              </button>
            </div>
          </div>
        )}

        {/* ── PANELL SIGNUP ── */}
        {panel === 'signup' && (
          <div style={bg}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>
              ✨ Crear Compte
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={label}>Nickname (públic)</label>
                <GlassInput type="text" placeholder="El teu nom als rànquings" value={signupNick} onChange={setSignupNick} autoComplete="username" />
              </div>
              <div>
                <label style={label}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={signupEmail} onChange={setSignupEmail} autoComplete="email" />
              </div>
              <div>
                <label style={label}>Contrasenya</label>
                <GlassInput type="password" placeholder="Mínim 6 caràcters" value={signupPassword} onChange={setSignupPassword} autoComplete="new-password" />
              </div>
              <div>
                <label style={label}>Repetir Contrasenya</label>
                <GlassInput type="password" placeholder="Repeteix la contrasenya" value={signupRepeat} onChange={setSignupRepeat} autoComplete="new-password" />
              </div>
            </div>
            {error && <ErrorBox msg={error} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleSignup}
                disabled={loading}
                style={btnPrimary(loading)}
              >
                {loading ? '⌛ Creant compte...' : 'Registrar-se'}
              </button>
              <button onClick={() => { setPanel('welcome'); clearError(); }} style={btnSecondary}>
                ← Tornar
              </button>
            </div>
          </div>
        )}

        {/* ── PANELL CONVIDAT ── */}
        {panel === 'guest' && (
          <div style={bg}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>
              👤 Mode Convidat
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5 }}>
              Juga sense registrar-te. Les teves puntuacions no es guardaran als rànquings.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={label}>El teu nom per la partida</label>
              <GlassInput type="text" placeholder="Nickname temporal" value={guestNick} onChange={setGuestNick} />
            </div>
            {error && <ErrorBox msg={error} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleGuest}
                disabled={!guestNick.trim()}
                style={btnPrimary(!guestNick.trim())}
              >
                Jugar com a Convidat →
              </button>
              <button onClick={() => { setPanel('welcome'); clearError(); }} style={btnSecondary}>
                ← Tornar
              </button>
            </div>
          </div>
        )}

        {/* Suggeriment de compte des del panell convidat/welcome */}
        {(panel === 'welcome') && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Ja tens compte? </span>
            <button
              onClick={() => { setPanel('login'); clearError(); }}
              style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Inicia sessió →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '12px',
      color: '#f87171',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      textAlign: 'center',
    }}>
      ⚠️ {msg}
    </div>
  );
}