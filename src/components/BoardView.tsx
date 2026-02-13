'use client';
// src/components/BoardView.tsx
import { useState, useEffect, useRef } from 'react';
import { boardPositions } from '@/src/lib/boardPositions';

export function BoardView({ currentStep }: { currentStep: number }) {
  const pos = boardPositions[currentStep] || boardPositions[0];
  const [isJumping, setIsJumping] = useState(false);
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      setIsJumping(true);
      const timer = setTimeout(() => setIsJumping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div
      className="relative w-full aspect-square border-8 border-slate-800 rounded-lg overflow-hidden shadow-2xl"
      style={{
        backgroundImage: "url('/images/board.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <style>{`
        @keyframes pawnJump {
          0%   { transform: translateY(0);     animation-timing-function: ease-out; }
          50%  { transform: translateY(-40px); animation-timing-function: ease-in; }
          100% { transform: translateY(0); }
        }
        .pawn-jumping {
          animation: pawnJump 1s forwards;
        }
      `}</style>

      {/* FICHA ÚNICA DE LA MINISALA */}
      {/* Capa exterior: transición suave de posición en el tablero */}
      <div
        className="absolute z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '5%',
          aspectRatio: '1 / 1.8',
          transition: 'left 1s ease-in-out, top 1s ease-in-out',
        }}
      >
        {/* Capa interior: arco parabólico (translateY) */}
        <div className={isJumping ? 'pawn-jumping' : ''} style={{ width: '100%', height: '100%' }}>
          <svg viewBox="0 0 40 72" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <radialGradient id="pawnShine" cx="35%" cy="25%" r="55%">
                <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                <stop offset="100%" stopColor="black" stopOpacity="0.25" />
              </radialGradient>
            </defs>
            {/* Base */}
            <ellipse cx="20" cy="64" rx="16" ry="3" fill="#b91c1c" />
            {/* Cuerpo */}
            <path d="M6 64 Q4 48 13 40 Q7 34 12 28 Q16 20 20 20 Q24 20 28 28 Q33 34 27 40 Q36 48 34 64 Z" fill="#ef4444" />
            {/* Cabeza */}
            <circle cx="20" cy="16" r="10" fill="#ef4444" />
            {/* Brillo */}
            <ellipse cx="20" cy="64" rx="16" ry="3" fill="url(#pawnShine)" />
            <path d="M6 64 Q4 48 13 40 Q7 34 12 28 Q16 20 20 20 Q24 20 28 28 Q33 34 27 40 Q36 48 34 64 Z" fill="url(#pawnShine)" />
            <circle cx="20" cy="16" r="10" fill="url(#pawnShine)" />
            {/* Borde blanco */}
            <ellipse cx="20" cy="64" rx="16" ry="3" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
            <circle cx="20" cy="16" r="10" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Logo centrado en el tablero */}
      <img
        src="/images/logo igualopoly.png"
        alt="Igualopoly"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] object-contain pointer-events-none"
      />

      {/* Overlay informativo de la casilla actual */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
        Casilla: {boardPositions[currentStep]?.name || 'SALIDA'}
      </div>
    </div>
  );
}
