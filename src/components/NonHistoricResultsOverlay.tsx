'use client';
import { useEffect, useState, useRef } from 'react';

interface NonHistoricResultsOverlayProps {
  gameMode: string;
  locationName: string;       // Nom de la ubicació (país, comarca, barri...)
  locationTitle?: string;     // Nom de l'estadi o monument (si n'hi ha)
  extraInfo?: string;         // Dada extra: pista de joc, particularitat del lloc, etc.
  distanceError: number;      // km
  totalScore: number;
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

function StatRow({
  label, value, unit, color, visible, animDuration = 800,
}: {
  label: string; value: number; unit: string; color: string;
  visible: boolean; animDuration?: number;
}) {
  const count = useCountUp(value, animDuration, visible);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <span style={{ color: '#9CA3AF', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color, fontWeight: 900, fontSize: '20px' }}>
        {count.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>{unit}</span>
      </span>
    </div>
  );
}

const MODE_CONFIG: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  world:    { icon: '🌍', label: 'País',   color: '#10B981', bgColor: 'rgba(16,185,129,0.12)' },
  estadis:  { icon: '⚽', label: 'País',   color: '#3B82F6', bgColor: 'rgba(59,130,246,0.12)' },
  cultural: { icon: '🏛️', label: 'País',  color: '#A78BFA', bgColor: 'rgba(167,139,250,0.12)' },
  catalunya:{ icon: '🏡', label: 'Poble', color: '#EF4444', bgColor: 'rgba(239,68,68,0.12)'   },
  pixapins: { icon: '🗺️', label: 'Zona',  color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)' },
};

export default function NonHistoricResultsOverlay({
  gameMode,
  locationName,
  locationTitle,
  extraInfo,
  distanceError,
  totalScore,
  onDone,
}: NonHistoricResultsOverlayProps) {
  // Seqüència: distancia → lloc → info extra → puntuació → botó
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),   // distancia
      setTimeout(() => setStage(2), 1200),  // lloc (país/poble/barri)
      setTimeout(() => setStage(3), 2100),  // info extra / nom estadi
      setTimeout(() => setStage(4), 3000),  // puntuació total
      setTimeout(() => setStage(5), 3800),  // botó
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const cfg = MODE_CONFIG[gameMode] || MODE_CONFIG.world;

  const scoreColor =
    totalScore >= 4500 ? '#10B981' :
    totalScore >= 3000 ? '#FBBF24' :
    totalScore >= 1500 ? '#F97316' : '#EF4444';

  // Formatem la distància de manera llegible
  const distDisplay = distanceError < 1
    ? `${Math.round(distanceError * 1000)}`
    : `${Math.round(distanceError).toLocaleString()}`;
  const distUnit = distanceError < 1 ? 'm' : 'km';

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
        {/* 1. Distància */}
        <StatRow
          label="Error de distància"
          value={parseInt(distDisplay.replace(/\./g, '').replace(/,/g, ''))}
          unit={distUnit}
          color="#F97316"
          visible={stage >= 1}
          animDuration={900}
        />

        {/* 2. Lloc (país / comarca / barri) */}
        <div
          style={{
            opacity: stage >= 2 ? 1 : 0,
            transform: stage >= 2 ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <div style={{ color: '#6B7280', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {cfg.label}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: cfg.bgColor,
              border: `1px solid ${cfg.color}40`,
              borderRadius: '14px',
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: '22px' }}>{cfg.icon}</span>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '20px', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              {locationName || '—'}
            </span>
          </div>
        </div>

        {/* 3. Info extra: nom de l'estadi/monument, pista del mode, o dada del país */}
        {(locationTitle || extraInfo) && (
          <div
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            {/* Nom de l'estadi o monument (mode Estadis / Cultural) */}
            {locationTitle && (
              <div style={{ marginBottom: extraInfo ? '8px' : 0 }}>
                <div style={{ color: '#6B7280', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {gameMode === 'estadis' ? 'Nom de l\'estadi' : gameMode === 'cultural' ? 'Nom del monument' : 'Lloc exacte'}
                </div>
                <div
                  style={{
                    background: `${cfg.color}12`,
                    border: `1px solid ${cfg.color}30`,
                    borderRadius: '12px',
                    padding: '8px 14px',
                  }}
                >
                  <span style={{ color: cfg.color, fontWeight: 900, fontSize: '15px', fontStyle: 'italic', textTransform: 'uppercase' }}>
                    {locationTitle}
                  </span>
                </div>
              </div>
            )}
            {/* Dada extra del mode (pista, país, particularitat...) */}
            {extraInfo && (
              <div>
                <div style={{ color: '#6B7280', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  💡 Curiositat
                </div>
                <p style={{
                  color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {extraInfo}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Puntuació total */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            marginTop: '8px'
          }}
        >
          <div
            style={{
              flex: 1,
              background: `${scoreColor}18`,
              border: `1px solid ${scoreColor}40`,
              borderRadius: '14px',
              padding: '10px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Puntuació total</div>
            <div style={{ color: scoreColor, fontWeight: 900, fontSize: '24px' }}>+{totalScore.toLocaleString()}</div>
          </div>
        </div>

        {/* 5. Botó Continuar */}
        <div
          style={{
            opacity: stage >= 5 ? 1 : 0,
            transform: stage >= 5 ? 'translateY(0)' : 'translateY(8px)',
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
