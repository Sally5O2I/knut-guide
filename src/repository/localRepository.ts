/**
 * 1단계 저장소: localStorage.
 * Supabase 설정이 없을 때 쓴다. 제보·승인이 이 브라우저에서만 보이므로 시연·테스트용이다.
 * 매니저 로그인도 비밀번호 없이 켜진다 (다른 사람에게 영향이 없으므로).
 */
import type { GuideItem, Submission } from '../domain/types';
import type { NewSubmission, Repository } from './Repository';

const KEY = {
  subs: 'knut-guide:submissions',
  published: 'knut-guide:published',
  manager: 'knut-guide:local-manager',
  likes: 'knut-guide:local-likes',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('브라우저 저장 공간을 쓸 수 없어요. (사생활 보호 모드인지 확인해 주세요)');
  }
}

export function createLocalRepository(): Repository {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('knut-guide:')) emit();
  });

  return {
    mode: 'local',

    async listPublished() {
      return Object.values(read<Record<string, GuideItem>>(KEY.published, {}));
    },

    async submit(sub: NewSubmission) {
      const subs = read<Submission[]>(KEY.subs, []);
      subs.push({
        ...sub,
        id: crypto.randomUUID(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });
      write(KEY.subs, subs);
      emit();
    },

    async signIn() {
      write(KEY.manager, true);
      emit();
    },

    async signOut() {
      localStorage.removeItem(KEY.manager);
      emit();
    },

    async isManager() {
      return read<boolean>(KEY.manager, false);
    },

    async listSubmissions(status) {
      return read<Submission[]>(KEY.subs, [])
        .filter((s) => s.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async review(id, approve, item) {
      const subs = read<Submission[]>(KEY.subs, []);
      const sub = subs.find((s) => s.id === id);
      if (!sub || sub.status !== 'pending') throw new Error('이미 처리된 제보예요.');
      sub.status = approve ? 'approved' : 'rejected';
      sub.reviewedAt = new Date().toISOString();
      if (approve && item) {
        const published = read<Record<string, GuideItem>>(KEY.published, {});
        published[item.id] = item;
        write(KEY.published, published);
      }
      write(KEY.subs, subs);
      emit();
    },

    // local 모드: 이 브라우저에서 누른 것만 센다
    async listLikeCounts() {
      const counts: Record<string, number> = {};
      for (const id of read<string[]>(KEY.likes, [])) counts[id] = 1;
      return counts;
    },

    async setLike(itemId, _deviceId, liked) {
      const set = new Set(read<string[]>(KEY.likes, []));
      if (liked) set.add(itemId);
      else set.delete(itemId);
      write(KEY.likes, [...set]);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
