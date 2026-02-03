'use client';
import { useState } from 'react';

// Componente para renderizar los puntos de cada cara del dado
function DiceFace({ value }: { value: number }) {
  const dotPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  const getPosition = (pos: string) => {
    const positions: Record<string, string> = {
      'top-left': 'top-1 left-1',
      'top-right': 'top-1 right-1',
      'middle-left': 'top-1/2 -translate-y-1/2 left-1',
      'middle-right': 'top-1/2 -translate-y-1/2 right-1',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'bottom-left': 'bottom-1 left-1',
      'bottom-right': 'bottom-1 right-1',
    };
    return positions[pos] || '';
  };

  return (
    <div
      className="absolute inset-0 bg-white rounded-lg border-2 border-slate-300 shadow-inner"
      style={{ backfaceVisibility: 'hidden' }}
    >
      {dotPositions[value]?.map((pos, idx) => (
        <div
          key={idx}
          className={`absolute w-2.5 h-2.5 bg-slate-800 rounded-full ${getPosition(pos)}`}
        />
      ))}
    </div>
  );
}

interface DiceProps {
  onRollComplete: (val: number) => void;
  getNextValue?: () => Promise<number | null>;
}

export default function Dice({ onRollComplete, getNextValue }: DiceProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Mapeo de rotaciones para mostrar cada cara
  // Cara 2 está en rotateY(90deg), así que para mostrarla rotamos Y negativo
  // Cara 5 está en rotateY(-90deg), así que para mostrarla rotamos Y positivo
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 180, y: 0 },
  };

  const rollDice = async () => {
    setIsRolling(true);

    // Obtener el valor (forzado de la DB o aleatorio)
    let value = Math.floor(Math.random() * 6) + 1;
    if (getNextValue) {
      const forcedValue = await getNextValue();
      if (forcedValue !== null && forcedValue >= 1 && forcedValue <= 6) {
        value = forcedValue;
      }
    }

    // Capturamos el valor final en una constante para el closure
    const finalValue = value;

    // Rotación aleatoria durante el lanzamiento
    const spins = 3 + Math.floor(Math.random() * 2); // 3-4 vueltas
    const randomX = spins * 360 + Math.random() * 360;
    const randomY = spins * 360 + Math.random() * 360;

    // Usar requestAnimationFrame para asegurar que la transición se aplique correctamente
    // (especialmente en el primer lanzamiento)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation({ x: randomX, y: randomY });
      });
    });

    // Después de la animación, mostrar el resultado
    setTimeout(() => {
      const finalRotation = faceRotations[finalValue];

      // Añadir vueltas completas para que la transición sea suave
      setRotation({
        x: Math.round(randomX / 360) * 360 + finalRotation.x,
        y: Math.round(randomY / 360) * 360 + finalRotation.y,
      });

      setDiceValue(finalValue);
      setIsRolling(false);
      onRollComplete(finalValue);
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Contenedor con perspectiva */}
      <div className="relative" style={{ perspective: '300px' }}>
        {/* Dado 3D */}
        <div
          className="relative w-16 h-16 transition-transform duration-[1800ms] ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {/* Núcleo sólido para tapar huecos entre caras */}
          <div
            className="absolute inset-0 bg-white rounded-lg"
            style={{
              transform: 'translateZ(0px) scale(0.95)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 bg-white" style={{ transform: 'translateZ(30px)' }} />
            <div className="absolute inset-0 bg-white" style={{ transform: 'translateZ(-30px)' }} />
            <div className="absolute inset-0 bg-white" style={{ transform: 'rotateY(90deg) translateZ(30px)' }} />
            <div className="absolute inset-0 bg-white" style={{ transform: 'rotateY(-90deg) translateZ(30px)' }} />
            <div className="absolute inset-0 bg-white" style={{ transform: 'rotateX(90deg) translateZ(30px)' }} />
            <div className="absolute inset-0 bg-white" style={{ transform: 'rotateX(-90deg) translateZ(30px)' }} />
          </div>
          {/* Cara 1 - Frente */}
          <div className="absolute inset-0" style={{ transform: 'translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={1} />
          </div>
          {/* Cara 6 - Atrás */}
          <div className="absolute inset-0" style={{ transform: 'rotateY(180deg) translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={6} />
          </div>
          {/* Cara 2 - Derecha */}
          <div className="absolute inset-0" style={{ transform: 'rotateY(90deg) translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={2} />
          </div>
          {/* Cara 5 - Izquierda */}
          <div className="absolute inset-0" style={{ transform: 'rotateY(-90deg) translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={5} />
          </div>
          {/* Cara 3 - Arriba */}
          <div className="absolute inset-0" style={{ transform: 'rotateX(90deg) translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={3} />
          </div>
          {/* Cara 4 - Abajo */}
          <div className="absolute inset-0" style={{ transform: 'rotateX(-90deg) translateZ(32px)', backfaceVisibility: 'hidden' }}>
            <DiceFace value={4} />
          </div>
        </div>
      </div>

      {/* Botón de lanzar */}
      <button
        onClick={rollDice}
        disabled={isRolling}
        className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-wider shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-105 transition-all disabled:bg-slate-400 disabled:shadow-none disabled:scale-100"
      >
        {isRolling ? 'Lanzando...' : 'Lanzar Dado'}
      </button>
    </div>
  );
}
