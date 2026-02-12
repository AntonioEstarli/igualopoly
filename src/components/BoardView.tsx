// src/components/BoardView.tsx
import { boardPositions } from '@/src/lib/boardPositions';

export function BoardView({ currentStep }: { currentStep: number }) {
  // Obtenemos la posición de la ficha común según la carta actual (0 a 10)
  const pos = boardPositions[currentStep] || boardPositions[0];

  return (
    <div 
      className="relative w-full aspect-square border-8 border-slate-800 rounded-lg overflow-hidden shadow-2xl"
      style={{ 
        backgroundImage: "url('/images/board.jpg')", 
        backgroundSize: 'cover',
        backgroundPosition: 'center' 
      }}
    >
      {/* FICHA ÚNICA DE LA MINISALA */}
      <div
          className="absolute w-[5%] h-[9%] bg-red-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out flex items-center justify-center z-10"
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Un pequeño brillo para que parezca una pieza física */}
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/20 to-white/30" />
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