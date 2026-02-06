'use client';

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
}

export function CapitalRace({ players, systemProfiles, maxCapital = 20 }: CapitalRaceProps) {
  const TOTAL_LANES = 10;
  const PLAYER_LANES = 5;

  return (
    <div className="flex flex-col h-full bg-slate-100 p-4 rounded-2xl shadow-xl border border-slate-300 min-w-[380px]">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">
        Stadium: Carrera de Capital
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
                  className="absolute transition-all duration-1000 ease-in-out z-20 flex flex-col items-center"
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-base shadow-lg border-2 transition-transform hover:scale-110 ${
                      isSystem ? 'border-slate-800 bg-slate-200' : 'border-white'
                    }`}
                    style={{
                      backgroundColor: isSystem ? '#cbd5e1' : (participant.color || '#3b82f6'),
                    }}
                  >
                    {isSystem ? '🤖' : (participant.emoji || '👤')}
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
      </div>
    </div>
  );
}