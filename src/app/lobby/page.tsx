'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { getTranslation, Language } from '@/src/lib/translations';

export default function Lobby() {
  const [nombre, setNombre] = useState('');
  const [idioma, setIdioma] = useState<Language>('ES');
  const [savedSession, setSavedSession] = useState<{ alias: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const savedId = localStorage.getItem('participant_id');
      if (!savedId) {
        setCheckingSession(false);
        return;
      }
      const { data } = await supabase
        .from('participants')
        .select('alias')
        .eq('id', savedId)
        .single();

      if (data) {
        setSavedSession({ alias: data.alias });
      } else {
        // Participante ya no existe en BD (fue borrado): limpiar localStorage
        localStorage.removeItem('participant_id');
        localStorage.removeItem('minisala_id');
        localStorage.removeItem('vars');
        localStorage.removeItem('participante_nombre');
      }
      setCheckingSession(false);
    };
    check();
  }, []);

  const handleContinue = () => {
    localStorage.setItem('idioma', idioma);
    router.push('/game');
  };

  const handleStartFresh = async () => {
    const savedId = localStorage.getItem('participant_id');
    if (savedId) {
      await supabase.from('participants').delete().eq('id', savedId);
    }
    localStorage.removeItem('participant_id');
    localStorage.removeItem('minisala_id');
    localStorage.removeItem('vars');
    localStorage.removeItem('participante_nombre');
    localStorage.removeItem('is_final_simulation');
    setSavedSession(null);
  };

  const handleJoin = () => {
    if (nombre.length >= 2) {
      localStorage.setItem('participante_nombre', nombre);
      localStorage.setItem('idioma', idioma);
      router.push('/character-creation');
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {savedSession ? (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-center text-green-600">
            {getTranslation('lobby.recoveryTitle', idioma)}
          </h1>
          <p className="text-center text-gray-700 mb-1">
            <span className="font-semibold">{savedSession.alias}</span>
          </p>
          <p className="text-center text-gray-500 text-sm mb-6">
            {getTranslation('lobby.recoveryMessage', idioma)}
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              {getTranslation('lobby.languageLabel', idioma)}
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value as Language)}
              className="w-full border p-2 rounded"
            >
              <option value="ES">Español</option>
              <option value="EN">English</option>
              <option value="CAT">Català</option>
            </select>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-green-600 text-white py-2 rounded font-bold mb-3"
          >
            {getTranslation('lobby.continueButton', idioma)}
          </button>
          <button
            onClick={handleStartFresh}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded font-bold"
          >
            {getTranslation('lobby.newGameButton', idioma)}
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-auto max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-red-600">
            {getTranslation('lobby.title', idioma)}
          </h1>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {getTranslation('lobby.nameLabel', idioma)}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder={getTranslation('lobby.namePlaceholder', idioma)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              {getTranslation('lobby.languageLabel', idioma)}
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value as Language)}
              className="w-full border p-2 rounded"
            >
              <option value="ES">Español</option>
              <option value="EN">English</option>
              <option value="CAT">Català</option>
            </select>
          </div>

          <button
            onClick={handleJoin}
            disabled={nombre.length < 2}
            className="w-full bg-blue-600 text-white py-2 rounded font-bold disabled:bg-gray-400"
          >
            {getTranslation('lobby.enterButton', idioma)}
          </button>
        </div>
      )}
    </div>
  );
}
