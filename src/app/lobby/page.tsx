'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { getTranslation, Language } from '@/src/lib/translations';
import { normalizeRecoveryCode } from '@/src/lib/recoveryCode';

export default function Lobby() {
  const [nombre, setNombre] = useState('');
  const [idioma, setIdioma] = useState<Language>('ES');
  const [savedSession, setSavedSession] = useState<{ alias: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
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

  const handleRecoverByCode = async () => {
    const normalized = normalizeRecoveryCode(recoveryCode);

    if (normalized.length !== 6) {
      setRecoveryError(true);
      return;
    }

    const { data, error } = await supabase
      .from('participants')
      .select('id, alias, minisala_id, variables')
      .eq('recovery_code', normalized)
      .single();

    if (error || !data) {
      setRecoveryError(true);
      return;
    }

    // Recuperar sesión exitosamente
    localStorage.setItem('participant_id', data.id);
    localStorage.setItem('minisala_id', data.minisala_id);
    localStorage.setItem('vars', JSON.stringify(data.variables));
    localStorage.setItem('idioma', idioma);
    router.push('/game');
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

          {!showRecoveryInput ? (
            <>
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
                className="w-full bg-blue-600 text-white py-2 rounded font-bold disabled:bg-gray-400 mb-3"
              >
                {getTranslation('lobby.enterButton', idioma)}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>

              <button
                onClick={() => setShowRecoveryInput(true)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
              >
                🔑 {getTranslation('lobby.haveRecoveryCode', idioma)}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {getTranslation('lobby.enterRecoveryCode', idioma)}
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => {
                    setRecoveryCode(e.target.value.toUpperCase());
                    setRecoveryError(false);
                  }}
                  className={`w-full border-2 p-3 rounded font-mono text-lg tracking-wider text-center ${
                    recoveryError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="ABC-123"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getTranslation('lobby.codeHelper', idioma)}
                </p>
                {recoveryError && (
                  <p className="text-xs text-red-600 mt-2 font-bold">
                    ⚠️ {getTranslation('lobby.invalidCode', idioma)}
                  </p>
                )}
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
                onClick={handleRecoverByCode}
                disabled={recoveryCode.length < 6}
                className="w-full bg-green-600 text-white py-3 rounded font-bold disabled:bg-gray-400 mb-3"
              >
                {getTranslation('lobby.recoverButton', idioma)}
              </button>

              <button
                onClick={() => {
                  setShowRecoveryInput(false);
                  setRecoveryCode('');
                  setRecoveryError(false);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300 transition-colors"
              >
                ← Volver
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
