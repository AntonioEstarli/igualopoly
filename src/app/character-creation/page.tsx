'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { getTranslation, Language } from '@/src/lib/translations';

const VARIABLES = ['tiempo', 'visibilidad', 'red', 'margen_error', 'responsabilidades'] as const;

const NIVELES = ['ALTO', 'MEDIO', 'BAJO'] as const;

export default function CharacterCreation() {
  const [alias, setAlias] = useState('');
  const [rooms, setRooms] = useState<any[]>([]); // Estado para las salas de la DB
  const [minisalaId, setMinisalaId] = useState(''); // Empezamos vacío
  const [vars, setVars] = useState<Record<string, string>>({
    tiempo: 'MEDIO', visibilidad: 'MEDIO', red: 'MEDIO', margen_error: 'MEDIO', responsabilidades: 'MEDIO'
  });
  // color y avatar
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [selectedEmoji, setSelectedEmoji] = useState('avatar-hombre-1');
  const [avatarGender, setAvatarGender] = useState<'hombre' | 'mujer'>('hombre');
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];

  const router = useRouter();

  // Obtener idioma desde sessionStorage
  const [language, setLanguage] = useState<Language>('ES');

  useEffect(() => {
    const storedLang = sessionStorage.getItem('idioma') as Language;
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  // 1. Cargar las salas reales de Supabase al montar el componente
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .order('id', { ascending: true });

      if (data && data.length > 0) {
        setRooms(data);
        setMinisalaId(data[0].id); // Seleccionamos la primera por defecto
      }
    };
    fetchRooms();
  }, []);

  const handleSave = async () => {
    const nombre = sessionStorage.getItem('participante_nombre');

    // Guardamos la sala seleccionada en sessionStorage para el juego
    sessionStorage.setItem('minisala_id', minisalaId);
    // Guardamos las variables para los cálculos de impacto
    sessionStorage.setItem('vars', JSON.stringify(vars));
    
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        name: nombre,
        alias: alias || nombre, // Si no hay alias, usamos el nombre
        skin_id: parseInt(selectedEmoji.split('-')[2]) || 1,
        variables: vars, // Guardamos el objeto JSON de variables
        money: 0,
        minisala_id: minisalaId,
        current_phase: 'playing', // Aseguramos que empieza en fase juego
        color: selectedColor,
        emoji: selectedEmoji
      }]).select();

    if (data && data[0]) {
      // Guardamos el ID real de la base de datos
      sessionStorage.setItem('participant_id', data[0].id);
      router.push('/game');
    }

    if (error) {
      console.error("Error al crear personaje:", error.message);
      alert("Hubo un error al guardar tu personaje.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen shadow-lg">
      <h2 className="text-xl font-bold mb-4">{getTranslation('characterCreation.title', language)}</h2>

      {/* Selección de Alias y Skin */}
      <div className="mb-6 border-b pb-4">
        <label className="block mb-2 font-semibold">{getTranslation('characterCreation.publicAlias', language)}</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          onChange={(e) => setAlias(e.target.value)}
          placeholder={getTranslation('characterCreation.aliasPlaceholder', language)}
        />
        <p className="text-xs text-gray-500 mt-1">{getTranslation('characterCreation.aliasHelper', language)}</p>
      </div>

      {/* Avatar y color */}
      <div className="mb-8 p-4 bg-slate-50 rounded-2xl border">
        <label className="block mb-4 font-bold text-slate-700 text-sm uppercase">{getTranslation('characterCreation.customizeAvatar', language)}</label>

        {/* Toggle género */}
        <div className="flex gap-2 mb-4">
          {(['hombre', 'mujer'] as const).map(g => (
            <button
              key={g}
              onClick={() => { setAvatarGender(g); setSelectedEmoji(`avatar-${g}-1`); }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${avatarGender === g ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 border'}`}
            >
              {g === 'hombre' ? getTranslation('characterCreation.genderMale', language) : getTranslation('characterCreation.genderFemale', language)}
            </button>
          ))}
        </div>

        {/* Grid de 10 avatares (2 filas × 5) */}
        <div className="grid grid-cols-5 gap-2 mb-5">
          {[1, 2, 3, 4, 5, 10, 11, 12, 13, 14].map(n => {
            const id = `avatar-${avatarGender}-${n}`;
            return (
              <button
                key={id}
                onClick={() => setSelectedEmoji(id)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedEmoji === id ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-50'}`}
              >
                <img src={`/images/${id}.png`} className="w-full h-full object-contain" alt={id} />
              </button>
            );
          })}
        </div>

        {/* Selector de color de anillo */}
        <div className="flex flex-wrap gap-3">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Configuración de las 5 Variables */}
      <div className="space-y-4 mb-8">
        {VARIABLES.map((v) => (
          <div key={v} className="flex flex-col">
            <label className="text-sm font-medium mb-2">{getTranslation(`characterCreation.variableLabels.${v}`, language)}</label>
            <div className="flex gap-2">
              {NIVELES.map((nivel) => (
                <button
                  key={nivel}
                  onClick={() => setVars({...vars, [v]: nivel})}
                  className={`flex-1 py-2 rounded border ${vars[v] === nivel ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}
                >
                  {getTranslation(`characterCreation.levels.${nivel}`, language)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <label className="block mb-2 font-semibold">{getTranslation('characterCreation.chooseRoom', language)}</label>
        <select
          className="w-full bg-white border-2 border-blue-200 p-3 rounded-xl font-bold text-blue-900 outline-none focus:border-blue-400"
          value={minisalaId}
          onChange={(e) => setMinisalaId(e.target.value)}
        >
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name || room.id.replace('_', ' ').toUpperCase()}
              </option>
            ))
          ) : (
            <option disabled>{getTranslation('characterCreation.loadingRooms', language)}</option>
          )}
        </select>
        <p className="text-xs text-gray-500 mt-1">{getTranslation('characterCreation.roomHelper', language)}</p>
      </div>

      <button
        onClick={handleSave}
        disabled={!minisalaId}
        className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-wider transition-all shadow-lg ${
          minisalaId
            ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-green-200'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {getTranslation('characterCreation.readyToPlay', language)}
      </button>
    </div>
  );
}