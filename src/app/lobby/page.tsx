'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTranslation, Language } from '@/src/lib/translations';

export default function Lobby() {
  const [nombre, setNombre] = useState('');
  const [idioma, setIdioma] = useState<Language>('ES');
  const router = useRouter();

  const handleJoin = () => {
    if (nombre.length >= 2) {
      // Guardamos temporalmente en sessionStorage o enviamos a Supabase
      sessionStorage.setItem('participante_nombre', nombre);
      sessionStorage.setItem('idioma', idioma);

      // Avanzar a la creación de personaje (Fase B)
      router.push('/character-creation');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
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
    </div>
  );
}
