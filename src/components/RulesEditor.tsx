'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

export default function RulesEditor() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase.from('cards').select('*').order('id');
    setCards(data || []);
  };

  const updateImpactValue = async (cardId: number, level: string, newValue: number) => {
    const card = cards.find(c => c.id === cardId);
    const updatedValues = { ...card.impact_values, [level]: newValue };

    const { error } = await supabase
      .from('cards')
      .update({ impact_values: updatedValues })
      .eq('id', cardId);

    if (!error) fetchCards();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border mt-8">
      <h2 className="text-xl font-bold mb-4">Motor de Reglas (Configuración de Impacto)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Carta / Situación</th>
              <th className="p-2 border">Variable</th>
              <th className="p-2 border">ALTO</th>
              <th className="p-2 border">MEDIO</th>
              <th className="p-2 border">BAJO</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="p-2 border text-sm font-medium">{card.name_es}</td>
                <td className="p-2 border text-xs text-blue-600 font-bold uppercase">{card.impact_variable}</td>
                {['ALTO', 'MEDIO', 'BAJO'].map((nivel) => (
                  <td key={nivel} className="p-2 border">
                    <input 
                      type="number"
                      value={card.impact_values[nivel]}
                      onChange={(e) => updateImpactValue(card.id, nivel, parseInt(e.target.value))}
                      className="w-16 border rounded p-1 text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}