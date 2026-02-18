import { PodiumView } from '@/src/components/PodiumView';
import { Language } from '@/src/lib/translations';

const VALID_LANGUAGES: Language[] = ['ES', 'EN', 'CAT'];

export default async function PodiumPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;

  const language = VALID_LANGUAGES.includes(lang as Language)
    ? (lang as Language)
    : 'ES';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
      <PodiumView initialLanguage={language} />
    </div>
  );
}
