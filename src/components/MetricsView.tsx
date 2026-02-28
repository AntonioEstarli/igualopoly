'use client';
import { useEffect, useState } from 'react';
import { getTranslation, Language } from '@/src/lib/translations';
import confetti from 'canvas-confetti';
import { supabase } from '@/src/lib/supabaseClient';

interface Participant {
  id: string;
  alias: string;
  money: number;
  color?: string;
  emoji?: string;
}

interface MetricsViewProps {
  players: Participant[];
  systemProfiles: Participant[];
  isFinalSimulation?: boolean;
  minisalaId?: string;
}

export function MetricsView({ players, systemProfiles, isFinalSimulation = false, minisalaId }: MetricsViewProps) {
  const [language, setLanguage] = useState<Language>('ES');
  const [proposalCount, setProposalCount] = useState(0);

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  // Obtener el número de propuestas
  useEffect(() => {
    const fetchProposalCount = async () => {
      if (!minisalaId) return;
      const { count, error } = await supabase
        .from('rule_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('minisala_id', minisalaId);

      if (!error && count !== null) {
        setProposalCount(count);
      }
    };

    fetchProposalCount();
  }, [minisalaId]);

  useEffect(() => {
    // Lanzar confeti al mostrar las métricas
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

  // Combinar todos los participantes
  const allParticipants = [
    ...players,
    ...systemProfiles
  ];

  // Calcular métricas
  const moneyValues = allParticipants.map(p => p.money).sort((a, b) => b - a);
  const maxMoney = moneyValues[0] || 0;
  const minMoney = moneyValues[moneyValues.length - 1] || 0;
  const brecha = maxMoney - minMoney;

  // Ratio de concentración: ganador acumula X veces más que el último
  const ratio = minMoney === 0 ? maxMoney : maxMoney / minMoney;

  // Determinar nivel de concentración (ALTO si ratio > 2, MEDIO si ratio > 1.5, BAJO si ratio <= 1.5)
  const concentracionLevel = ratio > 2 ? 'ALTO' : ratio > 1.5 ? 'MEDIO' : 'BAJO';

  // Ratio de motivación del equipo (inverso de la concentración)
  const motivacionLevel = isFinalSimulation
    ? 'ALTO'
    : (ratio > 2 ? 'BAJO' : ratio > 1.5 ? 'MEDIO' : 'ALTO');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200">
              {isFinalSimulation
                ? getTranslation('metrics.titleFinal', language)
                : getTranslation('metrics.title', language)}
            </span>
          </h1>
          <p className="text-slate-200 text-sm uppercase tracking-widest">
            {isFinalSimulation
              ? getTranslation('metrics.subtitleFinal', language)
              : getTranslation('metrics.subtitle', language)}
          </p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Brecha */}
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
            <div className="text-center">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                {getTranslation('metrics.brecha', language)}
              </div>
              <div className={`text-6xl font-black mb-2 ${
                isFinalSimulation ? 'text-green-400' : 'text-red-400'
              }`}>
                {brecha}€
              </div>
              <div className="text-slate-400 text-sm">
                {getTranslation('metrics.brechaDesc', language)}
              </div>
            </div>
          </div>

          {/* Ratio de concentración */}
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
            <div className="text-center">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                {getTranslation('metrics.concentracion', language)}
              </div>
              <div className={`text-4xl font-black mb-4 px-6 py-3 rounded-2xl inline-block ${
                concentracionLevel === 'ALTO'
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                  : concentracionLevel === 'MEDIO'
                  ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                  : 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
              }`}>
                {getTranslation(`metrics.level.${concentracionLevel}`, language)}
              </div>
              <div className="text-slate-400 text-sm">
                {getTranslation('metrics.concentracionDesc', language)}
              </div>
            </div>
          </div>

          {/* Ratio ganador vs último */}
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
            <div className="text-center">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                {getTranslation('metrics.ratioGanador', language)}
              </div>
              <div className={`text-6xl font-black mb-2 ${
                isFinalSimulation ? 'text-green-400' : 'text-orange-400'
              }`}>
                {ratio.toFixed(1)}x
              </div>
              <div className="text-slate-400 text-sm">
                {getTranslation('metrics.ratioGanadorDesc', language)}
              </div>
            </div>
          </div>

          {/* Motivación del equipo */}
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
            <div className="text-center">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                {getTranslation('metrics.motivacion', language)}
              </div>
              <div className={`text-4xl font-black mb-4 px-6 py-3 rounded-2xl inline-block ${
                motivacionLevel === 'ALTO'
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                  : motivacionLevel === 'MEDIO'
                  ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                  : 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
              }`}>
                {getTranslation(`metrics.level.${motivacionLevel}`, language)}
              </div>
              <div className="text-slate-400 text-sm">
                {getTranslation('metrics.motivacionDesc', language)}
              </div>
            </div>
          </div>

        </div>

        {/* Ideas propuestas (solo en la primera visualización) */}
        {!isFinalSimulation && (
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
            <div className="text-center">
              <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-4">
                {getTranslation('metrics.propuestas', language)}
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-6xl">💡</div>
                <div className="text-6xl font-black text-blue-400">
                  {proposalCount}
                </div>
              </div>
              <div className="text-slate-400 text-sm mt-4">
                {getTranslation('metrics.propuestasDesc', language)}
              </div>
            </div>
          </div>
        )}

        {/* Comparativa visual (opcional) */}
        <div className="bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden shadow-2xl p-8">
          <div className="text-slate-300 text-xs uppercase tracking-widest font-black mb-6 text-center">
            {getTranslation('metrics.distribucion', language)}
          </div>
          <div className="space-y-4">
            {allParticipants
              .sort((a, b) => b.money - a.money)
              .slice(0, 10) // Mostrar solo los top 10
              .map((participant, idx) => {
                const percentage = maxMoney > 0 ? (participant.money / maxMoney) * 100 : 0;
                const isPlayer = players.some(p => p.id === participant.id);
                return (
                  <div key={participant.id} className="flex items-center gap-4">
                    <div className="w-8 text-slate-400 text-sm font-bold text-right">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-700/50 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isPlayer ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-slate-500 to-slate-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-4">
                          <span className="text-white text-xs font-bold truncate">
                            {participant.alias}
                          </span>
                          <span className="text-white text-xs font-black">
                            {participant.money}€
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
}
