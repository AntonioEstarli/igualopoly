'use client';
import { useState, useEffect, useRef } from 'react';
import { getTranslation, Language } from '@/src/lib/translations';

interface Participant {
  id: string;
  alias: string;
  money: number;
  color?: string;
  emoji?: string;
}

interface CapitalRaceProps {
  players: Participant[];
  systemProfiles: Participant[];
  maxCapital?: number;
  language?: Language;
}

interface Particle {
  id: number;
  emoji: string;
  laneIdx: number;
  positionPercent: number;
  type: 'advance' | 'retreat';
  txEnd: number;
  ty: number;
  rot: number;
  delay: number;
  bottomOffset: number;
}

const TOTAL_LANES = 10;
const PLAYER_LANES = 5;
const ADVANCE_EMOJIS = ['🎉', '✨', '⭐', '🎊', '💫', '🌟'];
const RETREAT_EMOJIS = ['💸', '💵', '🪙', '💰', '💸', '💵'];

let particleId = 0;

export function CapitalRace({ players, systemProfiles, maxCapital = 20, language = 'ES' }: CapitalRaceProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevMoney = useRef<Map<string, number>>(new Map());
  const initialized = useRef(false);

  useEffect(() => {
    const all = [
      ...players.map((p, i) => ({ p, laneIdx: i % PLAYER_LANES })),
      ...systemProfiles.map((p, i) => ({ p, laneIdx: PLAYER_LANES + i })),
    ];

    if (!initialized.current) {
      all.forEach(({ p }) => prevMoney.current.set(p.id, p.money));
      initialized.current = true;
      return;
    }

    const newParticles: Particle[] = [];

    all.forEach(({ p, laneIdx }) => {
      const prev = prevMoney.current.get(p.id);
      prevMoney.current.set(p.id, p.money);
      if (prev === undefined || p.money === prev) return;

      const type = p.money > prev ? 'advance' : 'retreat';
      const emojis = type === 'advance' ? ADVANCE_EMOJIS : RETREAT_EMOJIS;
      const pos = Math.max(0, Math.min((p.money / maxCapital) * 90, 95));

      for (let k = 0; k < 6; k++) {
        newParticles.push({
          id: particleId++,
          emoji: emojis[k],
          laneIdx,
          positionPercent: pos,
          type,
          txEnd: (Math.random() - 0.5) * 44,
          ty: type === 'advance' ? -(42 + Math.random() * 28) : (22 + Math.random() * 28),
          rot: (Math.random() - 0.5) * 70,
          delay: k * 0.07,
          bottomOffset: type === 'advance' ? 30 : -20,
        });
      }
    });

    if (!newParticles.length) return;

    setParticles(prev => [...prev, ...newParticles]);
    const ids = new Set(newParticles.map(p => p.id));
    setTimeout(() => setParticles(prev => prev.filter(p => !ids.has(p.id))), 2200);
  }, [players, systemProfiles, maxCapital]);

  return (
    <div className="flex flex-col h-full bg-slate-100 p-4 rounded-2xl shadow-xl border border-slate-300 min-w-[380px]">
      <style>{`
        @keyframes particle-up {
          0%   { opacity: 1; transform: translate(0, 0) scale(1.4); }
          100% { opacity: 0; transform: translate(var(--tx-end), var(--ty)) scale(0.5) rotate(var(--rot)); }
        }
        @keyframes particle-down {
          0%   { opacity: 1; transform: translate(0, 0) scale(1.4); }
          60%  { opacity: 0.9; }
          100% { opacity: 0; transform: translate(var(--tx-end), var(--ty)) scale(0.5) rotate(var(--rot)); }
        }
      `}</style>

      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">
        {getTranslation('game.stadiumTitle', language)}
      </h3>

      {/* PISTA DE ATLETISMO */}
      <div className="flex-1 flex relative bg-orange-700 rounded-sm p-1 border-x-4 border-white shadow-inner overflow-hidden">

        {/* LÍNEAS DE CALLE (Pintura blanca de pista) */}
        <div className="absolute inset-1 flex pointer-events-none">
          {Array.from({ length: TOTAL_LANES }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 ${i > 0 ? 'border-l border-white/40' : ''}`}
            />
          ))}
        </div>

        {/* MARCAS DE DISTANCIA (Meta y Salida) */}
        {/* Meta con patrón a cuadros */}
        <div
          className="absolute inset-x-0 h-3 z-10 shadow-lg"
          style={{
            bottom: '90%',
            backgroundImage: `
              linear-gradient(45deg, white 25%, transparent 25%),
              linear-gradient(-45deg, white 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, white 75%),
              linear-gradient(-45deg, transparent 75%, white 75%)
            `,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
          }}
        >
          <span className="absolute -bottom-5 right-2 text-[8px] font-black text-white/80 uppercase">Finish (20€)</span>
        </div>

        {/* Líneas intermedias de progreso */}
        <div className="absolute inset-x-0 h-px bg-white/30 z-10" style={{ bottom: '67.5%' }}>
          <span className="absolute -right-1 -top-2 text-[7px] font-bold text-white/60">15€</span>
        </div>
        <div className="absolute inset-x-0 h-px bg-white/30 z-10" style={{ bottom: '45%' }}>
          <span className="absolute -right-1 -top-2 text-[7px] font-bold text-white/60">10€</span>
        </div>
        <div className="absolute inset-x-0 h-px bg-white/30 z-10" style={{ bottom: '22.5%' }}>
          <span className="absolute -right-1 -top-2 text-[7px] font-bold text-white/60">5€</span>
        </div>

        <div className="absolute inset-x-0 bottom-10 h-1 bg-white/40 z-10" />

        {/* RENDERIZADO DE CARRILES (10 calles) */}
        {Array.from({ length: TOTAL_LANES }).map((_, laneIdx) => {
          let participant: Participant | null = null;
          let isSystem = false;

          if (laneIdx < PLAYER_LANES) {
            // Carriles 0-4: Jugadores (reparto entre 5 carriles)
            participant = players.filter((_, i) => i % PLAYER_LANES === laneIdx)[0] || null;
          } else {
            // Carriles 5-9: Perfiles de sistema
            participant = systemProfiles[laneIdx - PLAYER_LANES] || null;
            isSystem = true;
          }

          // Posicionamiento: 0€ está en la línea de salida (bottom 40px aprox)
          const positionPercent = participant
            ? Math.max(0, Math.min((participant.money / maxCapital) * 90, 95))
            : 0;

          return (
            <div key={laneIdx} className="flex-1 relative flex justify-center">
              {/* NÚMERO DE CALLE EN EL SUELO */}
              <div className="absolute bottom-2 text-white/30 font-black text-xl italic select-none">
                {laneIdx + 1}
              </div>

              {/* ATLETA */}
              {participant && (
                <div
                  className="absolute transition-all duration-[2000ms] ease-in-out z-20 flex flex-col items-center"
                  style={{
                    bottom: `calc(${positionPercent}% + 10px)`,
                    transform: 'translateY(50%)'
                  }}
                >
                  {/* Alias flotante */}
                  <div className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200 mb-1">
                    <p className="text-[7px] font-black text-slate-800 uppercase whitespace-nowrap leading-none">
                      {participant.alias.split(' ')[0]}
                    </p>
                  </div>

                  {/* Avatar/Ficha */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-base shadow-lg border-2 transition-transform hover:scale-110 overflow-hidden ${
                      isSystem ? 'border-slate-800 bg-slate-200' : ''
                    }`}
                    style={{
                      backgroundColor: isSystem ? '#cbd5e1' : (participant.color || '#3b82f6'),
                      borderColor: isSystem ? '#1e293b' : (participant.color || '#3b82f6'),
                    }}
                  >
                    {isSystem ? (
                      <img src={`/images/${participant.emoji || 'bot1'}.png`} className="w-full h-full object-contain" alt="bot" />
                    ) : (
                      participant.emoji?.startsWith('avatar-')
                        ? <img src={`/images/${participant.emoji}.png`} className="w-full h-full object-contain" alt="avatar" />
                        : (participant.emoji || '👤')
                    )}
                  </div>

                  {/* Marcador de dinero individual */}
                  <div className="mt-1 bg-black/60 text-white text-[8px] px-1 rounded-full font-mono">
                    {participant.money}€
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* PARTÍCULAS DE ANIMACIÓN */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute z-30 pointer-events-none select-none text-sm leading-none"
            style={{
              left: `calc(${(particle.laneIdx + 0.5) * (100 / TOTAL_LANES)}%)`,
              bottom: `calc(${particle.positionPercent}% + ${particle.bottomOffset}px)`,
              transform: 'translateX(-50%)',
              '--tx-end': `${particle.txEnd}px`,
              '--ty': `${particle.ty}px`,
              '--rot': `${particle.rot}deg`,
              animation: `${particle.type === 'advance' ? 'particle-up' : 'particle-down'} 1.5s ${particle.delay}s ease-out forwards`,
            } as React.CSSProperties}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
