'use client';
import { useState } from 'react';

export default function Dice({ onRollComplete }: { onRollComplete: (val: number) => void }) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);

  const rollDice = () => {
    setIsRolling(true);
    // Sonido opcional aquí: new Audio('/sounds/dice.mp3').play();
    
    let iterations = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      iterations++;
      if (iterations > 10) {
        clearInterval(interval);
        setIsRolling(false);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        onRollComplete(finalValue);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`w-20 h-20 bg-white border-4 border-black rounded-xl flex items-center justify-center text-4xl font-black shadow-xl ${isRolling ? 'animate-bounce' : ''}`}>
        {diceValue}
      </div>
      <button 
        onClick={rollDice}
        disabled={isRolling}
        className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 disabled:bg-gray-400"
      >
        {isRolling ? 'Lanzando...' : 'Lanzar Dado 🎲'}
      </button>
    </div>
  );
}