'use client';
import { useEffect, useState } from 'react';
import { getTranslation, Language } from '@/src/lib/translations';
import confetti from 'canvas-confetti';

interface Participant {
  id: string;
  alias: string;
  money: number;
  color?: string;
  emoji?: string;
}

interface RankingViewProps {
  players: Participant[];
  systemProfiles: Participant[];
}

export function RankingView({ players, systemProfiles }: RankingViewProps) {
  const [language, setLanguage] = useState<Language>('ES');

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    // Lanzar confeti al mostrar el ranking
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Combinar y ordenar todos los participantes de mayor a menor
  const allParticipants = [
    ...players.map(p => ({ ...p, isSystem: false })),
    ...systemProfiles.map(p => ({ ...p, isSystem: true }))
  ].sort((a, b) => b.money - a.money);

  const getMedalEmoji = (position: number) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `${position + 1}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200">
              {getTranslation('ranking.title', language)}
            </span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest">
            {getTranslation('ranking.subtitle', language)}
          </p>
        </div>

        {/* Ranking Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="bg-white/5 px-6 py-4 border-b border-white/10 grid grid-cols-12 gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
            <div className="col-span-2 text-center">{getTranslation('ranking.position', language)}</div>
            <div className="col-span-7">{getTranslation('ranking.name', language)}</div>
            <div className="col-span-3 text-right">{getTranslation('ranking.capital', language)}</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {allParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition-all hover:bg-white/5 ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                }`}
              >
                {/* Position */}
                <div className="col-span-2 text-center">
                  <span className={`text-2xl ${index < 3 ? '' : 'text-slate-500 text-lg font-bold'}`}>
                    {getMedalEmoji(index)}
                  </span>
                </div>

                {/* Name with Avatar */}
                <div className="col-span-7 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 overflow-hidden ${
                      participant.isSystem ? 'border-slate-600 bg-slate-700' : ''
                    }`}
                    style={{
                      backgroundColor: participant.isSystem ? undefined : (participant.emoji?.startsWith('avatar-') ? 'transparent' : (participant.color || '#3b82f6')),
                      borderColor: participant.isSystem ? undefined : (participant.color || '#3b82f6'),
                    }}
                  >
                    {participant.isSystem ? '🤖' : (
                      participant.emoji?.startsWith('avatar-')
                        ? <img src={`/images/${participant.emoji}.png`} className="w-full h-full object-cover" alt="avatar" />
                        : (participant.emoji || '👤')
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">{participant.alias}</span>
                    {participant.isSystem && (
                      <span className="text-slate-500 text-[10px] uppercase tracking-wider">
                        {getTranslation('ranking.systemProfiles', language)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Capital */}
                <div className="col-span-3 text-right">
                  <span className={`font-black text-lg ${
                    participant.money >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {participant.money >= 0 ? '+' : ''}{participant.money}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-slate-400">{getTranslation('ranking.participants', language)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-[8px]">🤖</div>
            <span className="text-slate-400">{getTranslation('ranking.systemProfiles', language)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
