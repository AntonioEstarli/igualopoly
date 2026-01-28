'use client';
import { useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

export default function ClosurePage() {
  const [compromiso, setCompromiso] = useState('');
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleFinalize = async () => {
    // Guardar el compromiso en la base de datos [cite: 64]
    const { error } = await supabase
      .from('participants')
      .update({ compromiso: compromiso })
      .eq('id', sessionStorage.getItem('participant_id'));

    if (!error) setEnviado(true);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen flex flex-col justify-center">
      <h2 className="text-2xl font-bold mb-4 text-center">Final de la experiencia</h2>
      
      {!enviado ? (
        <div className="space-y-6">
          <p className="text-gray-600 italic text-center">
            "Para avanzar hacia la igualdad, ¿qué comportamiento o regla invisible vas a dejar de reproducir?" [cite: 64]
          </p>
          
          <textarea 
            className="w-full border-2 border-red-200 p-3 rounded-lg h-32"
            placeholder="Escribe aquí tu compromiso concreto..."
            value={compromiso}
            onChange={(e) => setCompromiso(e.target.value)}
          />

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-1">Email (opcional)</label>
            <input 
              type="email" 
              className="w-full border p-2 rounded"
              placeholder="Para recibir tu resumen y compromiso"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            onClick={handleFinalize}
            disabled={!compromiso.trim()}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-300"
          >
            Guardar compromiso y finalizar
          </button>
        </div>
      ) : (
        <div className="text-center animate-bounce">
          <h3 className="text-xl font-bold text-green-600">¡Gracias por participar!</h3>
          <p className="mt-4">Tu compromiso ha sido registrado.</p>
          <button className="mt-8 text-blue-600 underline">Descargar mi resumen en PDF </button>
        </div>
      )}
    </div>
  );
}