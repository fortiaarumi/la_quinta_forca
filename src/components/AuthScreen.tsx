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

/* ── Glass Input ────────────────────────────────────────
   Refined: indigo focus ring, indigo-tinted border, DM Sans
   ───────────────────────────────────────────────────── */
const GlassInput = ({
  type, placeholder, value, onChange, autoComplete, maxLength,
}: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; maxLength?: number;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    autoComplete={autoComplete}
    maxLength={maxLength}
    className="w-full px-5 py-[15px] rounded-2xl text-sm font-medium outline-none transition-all duration-200"
    style={{
      background: 'rgba(6, 8, 16, 0.55)',
      border: '1px solid rgba(99, 102, 241, 0.18)',
      color: 'var(--text-base)',
      fontFamily: 'var(--font-body)',
      caretColor: 'var(--gold)',
    }}
    onFocus={(e) => {
      e.target.style.borderColor = 'rgba(212, 167, 44, 0.5)';
      e.target.style.boxShadow = '0 0 0 3px rgba(212, 167, 44, 0.08)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = 'rgba(99, 102, 241, 0.18)';
      e.target.style.boxShadow = 'none';
    }}
  />
);

/* ── Error box ───────────────────────────────────────── */
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="px-4 py-3 rounded-xl text-center"
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.22)',
        color: '#f87171',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-body)',
      }}>
      ⚠️ {msg}
    </div>
  );
}

export default function AuthScreen({ onGuestContinue }: Props) {
  const { setGuestMode } = useAuth();
  const [panel, setPanel] = useState<Panel>('welcome');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRepeat, setSignupRepeat] = useState('');
  const [signupNick, setSignupNick] = useState('');
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
      setResetEmail(''); setResetRepeat('');
    } catch {
      setError('Error en enviar el correu. Segur que està ben escrit?');
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) return setError('Emplena tots els camps');
    setLoading(true); clearError();
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (e: any) {
      const codes: Record<string, string> = {
        'auth/user-not-found': 'Usuari no trobat.',
        'auth/wrong-password': 'Contrasenya incorrecta.',
        'auth/invalid-email': 'Correu electrònic invàlid.',
        'auth/invalid-credential': 'Credencials incorrectes.',
      };
      setError(codes[e.code] ?? 'Error en accedir. Torna-ho a provar.');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!signupNick.trim()) return setError('El nickname és obligatori');
    if (signupNick.trim().length < 2) return setError('El nickname ha de tenir almenys 2 caràcters');
    if (!signupEmail.trim()) return setError('El correu és obligatori');
    if (signupPassword.length < 6) return setError('La contrasenya ha de tenir almenys 6 caràcters');
    if (signupPassword !== signupRepeat) return setError('Les contrasenyes no coincideixen');
    setLoading(true); clearError();
    const safeNick = signupNick.trim().slice(0, 20);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword);
      await createUserProfile(cred.user.uid, safeNick, signupEmail.trim());
    } catch (e: any) {
      const codes: Record<string, string> = {
        'auth/email-already-in-use': 'Aquest correu ja està en ús.',
        'auth/invalid-email': 'Correu electrònic invàlid.',
        'auth/weak-password': 'La contrasenya és massa feble.',
      };
      setError(codes[e.code] ?? 'Error en registrar-se.');
    } finally { setLoading(false); }
  };

  const handleGuest = () => {
    if (!guestNick.trim()) return setError('Introdueix un nom de convidat');
    const safeGuestNick = guestNick.trim().slice(0, 20);
    localStorage.setItem('geoGuestName', safeGuestNick);
    let id = localStorage.getItem('geoPlayerId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('geoPlayerId', id); }
    setGuestMode(true);
    onGuestContinue();
  };

  /* ── Shared panel card style ──────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: 'rgba(11, 15, 28, 0.75)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(99, 102, 241, 0.14)',
    borderRadius: '24px',
    padding: '36px 32px',
  };

  /* ── Label ────────────────────────────────────────── */
  const labelCls = "block text-[9px] font-black uppercase tracking-[0.28em] mb-2 ml-0.5";

  /* ── Primary gold button ──────────────────────────── */
  const PrimaryBtn = ({
    onClick, disabled = false, children,
  }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="shimmer-host w-full min-h-[52px] px-6 rounded-2xl font-black uppercase tracking-widest text-sm
        transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none
        flex items-center justify-center gap-2"
      style={{
        background: disabled
          ? 'rgba(212,167,44,0.2)'
          : 'linear-gradient(135deg, #d4a72c 0%, #f0c040 50%, #c49820 100%)',
        color: '#0b0f1c',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.1em',
        boxShadow: disabled ? 'none' : '0 6px 28px rgba(212,167,44,0.3)',
      }}
    >
      {children}
    </button>
  );

  /* ── Secondary ghost button ───────────────────────── */
  const SecondaryBtn = ({
    onClick, children,
  }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="w-full min-h-[48px] px-6 rounded-2xl font-bold uppercase tracking-wider text-xs
        transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(99, 102, 241, 0.16)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-base)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden noise-overlay"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* ── Atmospheric background ─────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-left: indigo bloom */}
        <div style={{
          position: 'absolute', top: '-12%', left: '-8%',
          width: '55%', height: '55%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        {/* Bottom-right: amber bloom */}
        <div style={{
          position: 'absolute', bottom: '-18%', right: '-8%',
          width: '60%', height: '60%',
          background: 'radial-gradient(ellipse, rgba(212,167,44,0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        {/* Subtle grid mesh */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.022,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 py-12">

        {/* ── Wordmark / Logo ───────────────────────── */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 0 28px rgba(212,167,44,0.45))' }}>
            🌍
          </div>
          <h1
            className="text-[34px] leading-none font-black italic tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-base)' }}
          >
            La Quinta Forca
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>
            Projecte Alpha
          </p>
        </div>

        {/* ── WELCOME PANEL ─────────────────────────── */}
        {panel === 'welcome' && (
          <div style={cardStyle} className="animate-slide-up">
            <div className="flex flex-col gap-3">
              <PrimaryBtn onClick={() => { setPanel('signup'); clearError(); }}>
                ✨ Crear Compte
              </PrimaryBtn>
              <button
                onClick={() => { setPanel('login'); clearError(); }}
                className="shimmer-host w-full min-h-[52px] px-6 rounded-2xl font-black uppercase tracking-widest text-sm
                  transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.28)',
                  color: 'var(--text-base)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.1em',
                }}
              >
                🔑 Iniciar Sessió
              </button>

              <div className="flex items-center gap-3 my-1">
                <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.1)' }} />
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em' }}>O</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.1)' }} />
              </div>

              <SecondaryBtn onClick={() => { setPanel('guest'); clearError(); }}>
                👤 Continuar com a Convidat
              </SecondaryBtn>
            </div>
            <p className="text-center mt-5" style={{ color: 'var(--text-dim)', fontSize: '10px', lineHeight: 1.7 }}>
              El compte guarda les teves estadístiques i puntuacions als rànquings globals.
            </p>
          </div>
        )}

        {/* ── LOGIN PANEL ───────────────────────────── */}
        {panel === 'login' && (
          <div style={cardStyle} className="animate-slide-up">
            <h2 className="text-xl font-black italic text-center mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-base)' }}>
              🔑 Iniciar Sessió
            </h2>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={loginEmail} onChange={setLoginEmail} autoComplete="email" />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Contrasenya</label>
                <GlassInput type="password" placeholder="••••••••" value={loginPassword} onChange={setLoginPassword} autoComplete="current-password" />
              </div>
            </div>
            <div className="text-right mb-4">
              <button
                onClick={() => { setPanel('reset'); clearError(); }}
                className="text-[11px] font-semibold transition-colors"
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Has oblidat la contrasenya?
              </button>
            </div>
            {error && <ErrorBox msg={error} />}
            <div className="flex flex-col gap-2.5 mt-4">
              <PrimaryBtn onClick={handleLogin} disabled={loading}>
                {loading ? '⌛ Accedint...' : 'Accedir'}
              </PrimaryBtn>
              <SecondaryBtn onClick={() => { setPanel('welcome'); clearError(); }}>
                ← Tornar
              </SecondaryBtn>
            </div>
          </div>
        )}

        {/* ── RESET PANEL ───────────────────────────── */}
        {panel === 'reset' && (
          <div style={cardStyle} className="animate-slide-up">
            <h2 className="text-xl font-black italic text-center mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-base)' }}>
              🔒 Recuperar Contrasenya
            </h2>
            <p className="text-center mb-2" style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.6 }}>
              Introdueix el teu correu i t&apos;enviarem un enllaç per crear una nova contrasenya.
            </p>
            <p className="text-center mb-5 text-[10px] font-bold" style={{ color: 'var(--gold)' }}>
              ⚠️ Revisa la carpeta de Correu Brossa (Spam) si triga a arribar.
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={resetEmail} onChange={setResetEmail} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Repetir Correu</label>
                <GlassInput type="email" placeholder="Repeteix el correu" value={resetRepeat} onChange={setResetRepeat} />
              </div>
            </div>
            {error && <ErrorBox msg={error} />}
            {resetMsg && (
              <div className="px-4 py-3 rounded-xl text-center mb-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '11px', fontWeight: 700 }}>
                {resetMsg}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <PrimaryBtn onClick={handleResetPassword} disabled={loading}>
                {loading ? '⌛ Enviant correu...' : '📧 Enviar Correu'}
              </PrimaryBtn>
              <SecondaryBtn onClick={() => { setPanel('login'); clearError(); setResetMsg(''); }}>
                ← Tornar a Iniciar Sessió
              </SecondaryBtn>
            </div>
          </div>
        )}

        {/* ── SIGNUP PANEL ──────────────────────────── */}
        {panel === 'signup' && (
          <div style={cardStyle} className="animate-slide-up">
            <h2 className="text-xl font-black italic text-center mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-base)' }}>
              ✨ Crear Compte
            </h2>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Nickname (públic)</label>
                <GlassInput type="text" placeholder="El teu nom als rànquings" value={signupNick} onChange={setSignupNick} autoComplete="username" maxLength={20} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Correu Electrònic</label>
                <GlassInput type="email" placeholder="nom@exemple.com" value={signupEmail} onChange={setSignupEmail} autoComplete="email" />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Contrasenya</label>
                <GlassInput type="password" placeholder="Mínim 6 caràcters" value={signupPassword} onChange={setSignupPassword} autoComplete="new-password" />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Repetir Contrasenya</label>
                <GlassInput type="password" placeholder="Repeteix la contrasenya" value={signupRepeat} onChange={setSignupRepeat} autoComplete="new-password" />
              </div>
            </div>
            {error && <ErrorBox msg={error} />}
            <div className="flex flex-col gap-2.5 mt-4">
              <PrimaryBtn onClick={handleSignup} disabled={loading}>
                {loading ? '⌛ Creant compte...' : 'Registrar-se'}
              </PrimaryBtn>
              <SecondaryBtn onClick={() => { setPanel('welcome'); clearError(); }}>
                ← Tornar
              </SecondaryBtn>
            </div>
          </div>
        )}

        {/* ── GUEST PANEL ───────────────────────────── */}
        {panel === 'guest' && (
          <div style={cardStyle} className="animate-slide-up">
            <h2 className="text-xl font-black italic text-center mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-base)' }}>
              👤 Mode Convidat
            </h2>
            <p className="text-center mb-6" style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.6 }}>
              Juga sense registrar-te. Les teves puntuacions no es guardaran als rànquings.
            </p>
            <div className="mb-5">
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>El teu nom per la partida</label>
              <GlassInput type="text" placeholder="Nickname temporal" value={guestNick} onChange={setGuestNick} maxLength={20} />
            </div>
            {error && <ErrorBox msg={error} />}
            <div className="flex flex-col gap-2.5 mt-4">
              <PrimaryBtn onClick={handleGuest} disabled={!guestNick.trim()}>
                Jugar com a Convidat →
              </PrimaryBtn>
              <SecondaryBtn onClick={() => { setPanel('welcome'); clearError(); }}>
                ← Tornar
              </SecondaryBtn>
            </div>
          </div>
        )}

        {/* ── Bottom hint ───────────────────────────── */}
        {panel === 'welcome' && (
          <div className="text-center mt-5">
            <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Ja tens compte? </span>
            <button
              onClick={() => { setPanel('login'); clearError(); }}
              className="text-[11px] font-bold transition-colors"
              style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Inicia sessió →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}