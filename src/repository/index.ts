import { createLocalRepository } from './localRepository';
import { createSupabaseRepository } from './supabaseRepository';
import type { Repository } from './Repository';

/** .env.local 에 Supabase 값이 있으면 서버 모드, 없으면 이 브라우저에만 저장하는 local 모드 */
export function createRepository(): Repository {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && key && !url.includes('xxxx')) return createSupabaseRepository(url, key);
  return createLocalRepository();
}

export type { Repository } from './Repository';
