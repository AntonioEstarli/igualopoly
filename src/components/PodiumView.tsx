'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import confetti from 'canvas-confetti'; // Importamos la librería
import { getTranslation, Language } from '@/src/lib/translations';

export function PodiumView() {
  const [winners, setWinners] = useState<any[]>([]);
  const [language, setLanguage] = useState<Language>('ES');

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    const fetchWinners = async () => {
      const { data } = await supabase
        .from('rule_proposals')
        .select('*, participants(alias)')
        .order('votes', { ascending: false })
        .limit(3);
      
      if (data && data.length > 0) {
        setWinners(data);
        
        // --- LANZAR CONFETI ---
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // Ráfaga desde la izquierda y derecha
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    };
    fetchWinners();
  }, []);

  return (
    <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in relative z-10">
      <div className="mb-4 inline-block px-4 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 text-xs font-black uppercase tracking-widest animate-pulse">
        {getTranslation('podium.votingClosed', language)}
      </div>

      <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
        📢 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200">{getTranslation('podium.title', language)}</span>
      </h1>

      <div className="space-y-6 mt-12">
        {winners.map((rule, index) => (
          <div
            key={rule.id}
            className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 transform hover:scale-105 ${
              index === 0
                ? 'bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-4xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
              <div className="text-left">
                <p className="font-black text-xs uppercase opacity-40 leading-none">{getTranslation('podium.position', language)} {index + 1}</p>
                <p className="font-bold text-sm text-yellow-500">{rule.votes} {getTranslation('podium.votes', language)}</p>
              </div>
            </div>

            <p className={`font-serif italic leading-snug ${index === 0 ? 'text-3xl font-bold' : 'text-xl opacity-80'}`}>
              "{rule.proposal_text}"
            </p>

            <div className="mt-6 flex justify-center items-center gap-2 opacity-30">
              <div className="h-[1px] w-8 bg-white"></div>
              <p className="text-[10px] uppercase font-black tracking-widest">{getTranslation('podium.author', language)}: {rule.participants?.alias}</p>
              <div className="h-[1px] w-8 bg-white"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}