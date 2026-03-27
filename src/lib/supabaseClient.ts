import { createClient } from '@supabase/supabase-js';

const REQUIRED_SUPABASE_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const missingEnvVars = REQUIRED_SUPABASE_ENV_VARS.filter((envVar) => {
  const value = process.env[envVar];
  return !value || value.trim().length === 0 || value.startsWith('your_');
});

if (missingEnvVars.length > 0) {
  throw new Error(
    [
      '[Supabase config] Missing required environment variables.',
      `Missing: ${missingEnvVars.join(', ')}`,
      'Create a .env.local file from .env.example and set real values.',
      'Example: cp .env.example .env.local',
    ].join('\n')
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(
    '[Supabase config] NEXT_PUBLIC_SUPABASE_URL must start with "https://".'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
