'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import confetti from 'canvas-confetti';
import { getTranslation, Language } from '@/src/lib/translations';

const TIPOS = ['OPORTUNIDAD', 'COSTE INVISIBLE', 'SISTEMA', 'PRIVILEGIO'] as const;
type Tipo = typeof TIPOS[number];

const TIPO_CONFIG: Record<Tipo, { color: string; border: string; glow: string; badge: string }> = {
  'OPORTUNIDAD':    { color: 'text-green-400',  border: 'border-green-500',  glow: 'shadow-[0_0_30px_rgba(34,197,94,0.2)]',   badge: 'bg-green-500/20 border-green-500/50 text-green-400'   },
  'COSTE INVISIBLE':{ color: 'text-orange-400', border: 'border-orange-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.2)]',  badge: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  'SISTEMA':        { color: 'text-blue-400',   border: 'border-blue-500',   glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',  badge: 'bg-blue-500/20 border-blue-500/50 text-blue-400'       },
  'PRIVILEGIO':     { color: 'text-purple-400', border: 'border-purple-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',  badge: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
};

export function PodiumView({ initialLanguage }: { initialLanguage?: Language } = {}) {
  const [allProposals, setAllProposals] = useState<any[]>([]);
  const [language, setLanguage] = useState<Language>(initialLanguage ?? 'ES');
  const [activeTipo, setActiveTipo] = useState<Tipo>('OPORTUNIDAD');

  useEffect(() => {
    if (initialLanguage) return;
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) setLanguage(storedLang);
  }, [initialLanguage]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('rule_proposals')
        .select('*, participants(alias), cards:card_id(name_es, tipo)')
        .order('votes', { ascending: false });

      if (data && data.length > 0) {
        setAllProposals(data);

        // Confetti al cargar
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    };
    fetchAll();
  }, []);

  const currentIndex = TIPOS.indexOf(activeTipo);
  const winners = allProposals.filter(p => p.cards?.tipo === activeTipo).slice(0, 3);
  const config = TIPO_CONFIG[activeTipo];

  return (
    <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in relative z-10">

      <div className="mb-4 inline-block px-4 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 text-xs font-black uppercase tracking-widest animate-pulse">
        {getTranslation('podium.votingClosed', language)}
      </div>

      <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
        📢 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200">
          {getTranslation('podium.title', language)}
        </span>
      </h1>

      {/* Tabs de tipo */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIPOS.map(tipo => {
          const tc = TIPO_CONFIG[tipo];
          const isActive = tipo === activeTipo;
          return (
            <button
              key={tipo}
              onClick={() => setActiveTipo(tipo)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all leading-tight ${
                isActive
                  ? `${tc.badge} shadow-sm`
                  : 'bg-white/5 text-white/60 border-white/20 hover:border-white/30 hover:text-white/80'
              }`}
            >
              {tipo}
            </button>
          );
        })}
      </div>

      {/* Propuestas ganadoras */}
      <div className="space-y-6 mt-4">
        {winners.length === 0 ? (
          <p className="text-white/60 italic py-10">No hay propuestas de tipo {activeTipo}.</p>
        ) : (
          winners.map((rule, index) => (
            <div
              key={rule.id}
              className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 transform hover:scale-105 ${
                index === 0
                  ? `bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]`
                  : `bg-white/5 ${config.border}/30`
              }`}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-4xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                <div className="text-left">
                  <p className="font-black text-xs uppercase opacity-60 leading-none">
                    {getTranslation('podium.position', language)} {index + 1}
                  </p>
                  <p className={`font-bold text-sm ${index === 0 ? 'text-yellow-500' : config.color}`}>
                    {rule.votes} {getTranslation('podium.votes', language)}
                  </p>
                </div>
              </div>

              <p className={`font-serif italic leading-snug ${index === 0 ? 'text-3xl font-bold' : 'text-xl opacity-90'}`}>
                "{rule.proposal_text}"
              </p>

              <div className="mt-6 flex justify-center items-center gap-2 opacity-50">
                <div className="h-[1px] w-8 bg-white"></div>
                <p className="text-[10px] uppercase font-black tracking-widest">
                  {getTranslation('podium.author', language)}: {rule.participants?.alias}
                </p>
                <div className="h-[1px] w-8 bg-white"></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navegación */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setActiveTipo(TIPOS[currentIndex - 1])}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm bg-white/10 text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          ← Anterior
        </button>

        <span className="text-xs text-white/50 font-bold">
          {currentIndex + 1} / {TIPOS.length}
        </span>

        <button
          onClick={() => setActiveTipo(TIPOS[currentIndex + 1])}
          disabled={currentIndex === TIPOS.length - 1}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm bg-white/10 text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Siguiente →
        </button>
      </div>

    </div>
  );
}
