'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import { getTranslation, Language } from '@/src/lib/translations';

const TIPOS = ['OPORTUNIDAD', 'COSTE INVISIBLE', 'SISTEMA', 'PRIVILEGIO'] as const;
type Tipo = typeof TIPOS[number];

const TIPO_CONFIG: Record<Tipo, { color: string; bg: string; border: string; activeBorder: string; dot: string }> = {
  'OPORTUNIDAD':    { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  activeBorder: 'border-green-500',  dot: 'bg-green-500'  },
  'COSTE INVISIBLE':{ color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', activeBorder: 'border-orange-500', dot: 'bg-orange-500' },
  'SISTEMA':        { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   activeBorder: 'border-blue-500',   dot: 'bg-blue-500'   },
  'PRIVILEGIO':     { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', activeBorder: 'border-purple-500', dot: 'bg-purple-500' },
};

const MAX_VOTES = 3;

export function VotingView({ minisalaId, participantId, isLeader = false }: { minisalaId: string, participantId: string, isLeader?: boolean }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [language, setLanguage] = useState<Language>('ES');
  const [activeTipo, setActiveTipo] = useState<Tipo>('OPORTUNIDAD');

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) setLanguage(storedLang);
  }, []);

  useEffect(() => {
    if (minisalaId) fetchProposals();
  }, [minisalaId]);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from('rule_proposals')
      .select('*, participants(alias), cards:card_id(name_es, tipo), rooms:minisala_id(name)');
    if (error) console.error("Error cargando propuestas:", error);
    setProposals(data || []);
  };

  const proposalsByTipo = proposals.filter(p => p.cards?.tipo === activeTipo);
  const votesInTipo = proposalsByTipo.filter(p => userVotes.includes(p.id)).length;
  const config = TIPO_CONFIG[activeTipo];

  const handleVote = async (proposalId: any) => {
    const proposalIdNum = Number(proposalId);
    const hasVoted = userVotes.includes(proposalId);

    if (hasVoted) {
      const { error } = await supabase.rpc('decrement_vote', { row_id: proposalIdNum });
      if (!error) setUserVotes(prev => prev.filter(id => id !== proposalId));
      else console.error("Error decrement:", error);
    } else {
      if (votesInTipo >= MAX_VOTES) return;
      const { error } = await supabase.rpc('increment_vote', { row_id: proposalIdNum });
      if (!error) setUserVotes(prev => [...prev, proposalId]);
      else console.error("Error increment:", error);
    }
  };

  const currentIndex = TIPOS.indexOf(activeTipo);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-200">

      {/* Tabs de tipo */}
      <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
        {TIPOS.map(tipo => {
          const tc = TIPO_CONFIG[tipo];
          const isActive = tipo === activeTipo;
          const votesForTipo = proposals
            .filter(p => p.cards?.tipo === tipo && userVotes.includes(p.id))
            .length;
          return (
            <button
              key={tipo}
              onClick={() => setActiveTipo(tipo)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all leading-tight ${
                isActive
                  ? `${tc.bg} ${tc.color} ${tc.activeBorder} shadow-sm`
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
              }`}
            >
              {tipo}
              {votesForTipo > 0 && (
                <span className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-black ${isActive ? tc.dot : 'bg-slate-400'}`}>
                  {votesForTipo}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cabecera */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">
          {getTranslation('voting.title', language)}
        </h2>
        <p className="text-slate-500 text-sm">
          {isLeader
            ? getTranslation('voting.subtitle', language)
            : getTranslation('voting.subtitleObserver', language)}
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {[...Array(MAX_VOTES)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < votesInTipo ? config.dot : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {/* Propuestas */}
      <div className="space-y-4 min-h-[120px]">
        {proposalsByTipo.length === 0 ? (
          <p className="text-center text-slate-400 italic py-10">No hay propuestas de tipo {activeTipo}.</p>
        ) : (
          proposalsByTipo.map((p) => {
            const isSelected = userVotes.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => isLeader && handleVote(p.id)}
                disabled={!isLeader}
                className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-50 shadow-inner scale-[0.98]'
                    : isLeader
                      ? 'border-slate-100 bg-white hover:border-slate-300 shadow-sm'
                      : 'border-slate-100 bg-white cursor-default'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-red-500 border-red-500' : 'border-slate-200'
                  }`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className={`font-medium text-left ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>
                    "{p.proposal_text}"
                  </p>
                </div>
                <span className="text-xl ml-3 flex-shrink-0">{isSelected ? '❤️' : '🔥'}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Navegación anterior / siguiente */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setActiveTipo(TIPOS[currentIndex - 1])}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Anterior
        </button>

        <span className="text-xs text-slate-400 font-bold">
          {currentIndex + 1} / {TIPOS.length}
        </span>

        <button
          onClick={() => setActiveTipo(TIPOS[currentIndex + 1])}
          disabled={currentIndex === TIPOS.length - 1}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Siguiente →
        </button>
      </div>

    </div>
  );
}
