'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import { getTranslation, Language } from '@/src/lib/translations';

export function VotingView({ minisalaId, participantId }: { minisalaId: string, participantId: string }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('ES');
  const MAX_VOTES = 3;

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    if (minisalaId) {
      fetchProposals();
    }
  }, [minisalaId]);

  const fetchProposals = async () => {
    console.log("Cargando propuestas globales para debate...");
    const { data, error } = await supabase
      .from('rule_proposals')
      .select('*, participants(alias), cards:card_id(name_es), rooms:minisala_id(name)');
      //.eq('minisala_id', minisalaId); // Ahora sí usará 'sala_1' o lo que toque
    
    if (error) console.error("Error cargando propuestas globales:", error);

    // Opcional: Ordenar por votos de más a menos
    //const sortedData = (data || []).sort((a, b) => (b.votes || 0) - (a.votes || 0));
    setProposals(data || []);
  };

  const handleVote = async (proposalId: any) => {
    const proposalIdNum = Number(proposalId); // Aseguramos que es un número
    const hasVoted = userVotes.includes(proposalId);

    if (hasVoted) {
      // Decrementar
      const { error } = await supabase.rpc('decrement_vote', { row_id: proposalIdNum });
      if (!error) {
        setUserVotes(prev => prev.filter(id => id !== proposalId));
      } else {
        console.error("Error decrement:", error);
      }
    } else {
      // Incrementar
      if (userVotes.length >= MAX_VOTES) return;

      const { error } = await supabase.rpc('increment_vote', { row_id: proposalIdNum });
      if (!error) {
        setUserVotes(prev => [...prev, proposalId]);
      } else {
        console.error("Error increment:", error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">{getTranslation('voting.title', language)}</h2>
        <p className="text-slate-500 text-sm">{getTranslation('voting.subtitle', language)}</p>
        <div className="mt-2 flex justify-center gap-1">
          {[...Array(MAX_VOTES)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < userVotes.length ? 'bg-red-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
         
        {proposals.map((p) => {
          const isSelected = userVotes.includes(p.id);

          return (
            <button
              key={p.id}
              onClick={() => handleVote(p.id)}
              className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${isSelected
                  ? 'border-red-500 bg-red-50 shadow-inner scale-[0.98]'
                  : 'border-slate-100 bg-white hover:border-slate-300 shadow-sm'
                }`}
            >
              <div className="flex gap-4 items-center">
                {/* Check visual */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-slate-200'
                  }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>

                <div className="text-left">
                  {/* ... etiquetas de Sala y Carta que ya teníamos ... */}
                  <p className={`font-medium ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>
                    "{p.proposal_text}"
                  </p>
                </div>
              </div>

              <span className="text-xl">{isSelected ? '❤️' : '🔥'}</span>
            </button>
          );
        })}

      </div>
    </div>
  );
}