'use client';
import { useEffect, useState, useRef } from 'react';

interface HistoricResultsOverlayProps {
  title: string;
  year: number;
  description?: string;
  distanceError: number;   // km
  yearError: number;        // anys
  totalScore: number;
  mapScore: number;
  yearScore: number;
  onDone?: () => void;
}

// Anima un número de 0 fins a target en duration ms
function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    startRef.current = null;
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, duration]);

  return value;
}

// Una fila de stat amb animació d'entrada i comptador
function StatRow({
  label,
  value,
  unit,
  color,
  visible,
  animDuration = 800,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  visible: boolean;
  animDuration?: number;
}) {
  const count = useCountUp(value, animDuration, visible);
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-2xl border border-white/10"
      style={{
        background: 'rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <span className="text-gray-400 font-bold text-sm uppercase tracking-widest">{label}</span>
      <span className="font-black text-xl" style={{ color }}>
        {count.toLocaleString()} <span className="text-xs font-bold text-gray-500">{unit}</span>
      </span>
    </div>
  );
}

export default function HistoricResultsOverlay({
  title,
  year,
  description,
  distanceError,
  yearError,
  totalScore,
  mapScore,
  yearScore,
  onDone,
}: HistoricResultsOverlayProps) {
  // Seqüència: distancia → any → puntuació → titol → desc → botons
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),    // distancia
      setTimeout(() => setStage(2), 1400),   // any
      setTimeout(() => setStage(3), 2400),   // puntuació total
      setTimeout(() => setStage(4), 3500),   // titol + any
      setTimeout(() => setStage(5), 4400),   // descripcio
      setTimeout(() => setStage(6), 5200),   // botons
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const yearLabel = year < 0 ? `${Math.abs(year)} a.C.` : `${year} d.C.`;

  // Color de puntuació
  const scoreColor =
    totalScore >= 4500 ? '#10B981' :
    totalScore >= 3000 ? '#FBBF24' :
    totalScore >= 1500 ? '#F97316' : '#EF4444';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {/* Stats: distancia, any, puntuació */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <StatRow
            label="Error de distància"
            value={distanceError}
            unit="km"
            color="#F97316"
            visible={stage >= 1}
            animDuration={900}
          />
          <StatRow
            label="Error d'any"
            value={yearError}
            unit={yearError === 1 ? 'any' : 'anys'}
            color="#A78BFA"
            visible={stage >= 2}
            animDuration={900}
          />
          {/* Desglossament subtil */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Mapa</div>
              <div style={{ color: '#FBBF24', fontWeight: 900, fontSize: '16px' }}>+{mapScore.toLocaleString()}</div>
            </div>
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Any</div>
              <div style={{ color: '#FBBF24', fontWeight: 900, fontSize: '16px' }}>+{yearScore.toLocaleString()}</div>
            </div>
            <div
              style={{
                flex: 2,
                background: `${scoreColor}18`,
                border: `1px solid ${scoreColor}40`,
                borderRadius: '14px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Puntuació total</div>
              <div style={{ color: scoreColor, fontWeight: 900, fontSize: '22px' }}>+{totalScore.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
            opacity: stage >= 4 ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Titol i any de l'event */}
        <div
          style={{
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div style={{ color: '#6B7280', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Esdeveniment Històric
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h2>
            <span
              style={{
                background: 'rgba(167,139,250,0.15)',
                border: '1px solid rgba(167,139,250,0.3)',
                color: '#A78BFA',
                fontSize: '11px',
                fontWeight: 900,
                padding: '2px 10px',
                borderRadius: '999px',
                letterSpacing: '0.05em',
              }}
            >
              {yearLabel}
            </span>
          </div>
        </div>

        {/* Descripció */}
        {description && (
          <p
            style={{
              color: '#9CA3AF',
              fontSize: '13px',
              lineHeight: 1.5,
              margin: 0,
              opacity: stage >= 5 ? 1 : 0,
              transform: stage >= 5 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        )}

        {/* Botó Continuar (gestionat pel pare amb onDone) */}
        <div
          style={{
            opacity: stage >= 6 ? 1 : 0,
            transform: stage >= 6 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {onDone && (
            <button
              onClick={onDone}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FBBF24, #D97706)',
                color: '#000',
                border: 'none',
                borderRadius: '16px',
                padding: '16px',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 4px 30px rgba(251,191,36,0.3)',
              }}
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
