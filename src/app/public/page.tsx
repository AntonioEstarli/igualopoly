'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

export default function PublicView() {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    // 1. Cargar participantes iniciales (Jugadores + Sistema)
    const fetchRanking = async () => {
      const { data } = await supabase
        .from('participants')
        .select('alias, money')
        .order('money', { ascending: false });
      setParticipants(data || []);
    };

    fetchRanking();

    // 2. Suscribirse a cambios en tiempo real para actualizar el ranking
    const channel = supabase
      .channel('public_ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participants' }, () => {
        fetchRanking();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-slate-900 min-h-screen text-white p-8 flex flex-col gap-6 aspect-video">
      {/* Encabezado con Tablero Digital */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <h1 className="text-4xl font-black text-red-500">IGUALOPOLY</h1>
        <div className="text-xl font-mono bg-slate-800 px-4 py-2 rounded">
          VISTA PÚBLICA (MODO DEMO)
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* Lado Izquierdo: Tablero Digital */}
              <div
                  className="col-span-7 rounded-2xl border-4 border-slate-700 shadow-2xl relative"
                  style={{
                      backgroundImage: "url('/images/board.jpg')",
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                  }}
              >
                  {/* Aquí podrías renderizar las fichas (skins) encima del tablero */}
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-500 rounded-xl" />
              </div>

        {/* Lado Derecho: Ranking Global (Top 10) */}
        <div className="col-span-5 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-yellow-500">🏆 Ranking de Puntos (Dinero)</h2>
          <div className="space-y-2">
            {participants.map((p, index) => (
              <div 
                key={p.alias} 
                className={`flex justify-between p-4 rounded-lg font-bold ${
                  index < 3 ? 'bg-yellow-600/20 border border-yellow-500' : 'bg-slate-800'
                }`}
              >
                <span>{index + 1}. {p.alias}</span>
                <span className="text-green-400">{p.money} €</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-auto">
            Nota: Los nombres reales están ocultos por privacidad. [cite: 78, 142]
          </p>
        </div>
      </div>
    </div>
  );
}