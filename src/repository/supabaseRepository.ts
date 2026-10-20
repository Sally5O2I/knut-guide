/**
 * 2단계 저장소: Supabase.
 * - 테이블·보안 규칙은 supabase/schema.sql
 * - 학생은 로그인 없이 제보만 넣을 수 있고, 읽기·승인은 managers 테이블에 있는 계정만 가능하다.
 * - 승인은 review_submission 함수 하나로 처리해 "상태 변경 + 공개 반영"이 함께 성공하거나 함께 실패한다.
 */
import { createClient } from '@supabase/supabase-js';
import type { GuideItem, Submission, SubmissionStatus } from '../domain/types';
import type { NewSubmission, Repository } from './Repository';

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (/relation .* does not exist|could not find the (table|function)/i.test(message)) {
    return 'Supabase에 테이블이 없어요. supabase/schema.sql을 SQL Editor에서 실행해 주세요.';
  }
  if (/row-level security/i.test(message)) return '권한이 없는 작업이에요.';
  if (/failed to fetch|network/i.test(message)) return '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.';
  if (/rate limit|too_many_likes/i.test(message)) return '잠시 후 다시 시도해 주세요.';
  return message;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(friendly(res.error.message));
  return res.data;
}

type SubmissionRow = {
  id: string;
  kind: 'edit' | 'new';
  target_id: string | null;
  payload: Submission['payload'];
  message: string;
  status: SubmissionStatus;
  created_at: string;
  reviewed_at: string | null;
};

const fromRow = (r: SubmissionRow): Submission => ({
  id: r.id,
  kind: r.kind,
  targetId: r.target_id,
  payload: r.payload,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
});

export function createSupabaseRepository(url: string, key: string): Repository {
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  sb.auth.onAuthStateChange(() => emit());
  // 승인되어 공개 항목이 바뀌면 열려 있는 모든 화면에 바로 반영
  sb.channel('published')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'published_items' }, () => emit())
    .subscribe();

  return {
    mode: 'supabase',

    async listPublished() {
      const rows = check(await sb.from('published_items').select('data'));
      return (rows as { data: GuideItem }[]).map((r) => r.data);
    },

    async submit(sub: NewSubmission) {
      check(
        await sb.from('submissions').insert({
          kind: sub.kind,
          target_id: sub.targetId,
          payload: sub.payload,
          message: sub.message,
        }),
      );
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendly(error.message));
      if (!(await this.isManager())) {
        await sb.auth.signOut();
        throw new Error('매니저로 등록되지 않은 계정이에요.');
      }
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async isManager() {
      const { data: session } = await sb.auth.getSession();
      if (!session.session) return false;
      const res = await sb.rpc('is_manager');
      return !res.error && res.data === true;
    },

    async listSubmissions(status) {
      const rows = check(
        await sb.from('submissions').select('*').eq('status', status).order('created_at', { ascending: false }).limit(200),
      );
      return (rows as SubmissionRow[]).map(fromRow);
    },

    async review(id, approve, item) {
      check(
        await sb.rpc('review_submission', {
          sub_id: id,
          approve,
          item_id: item?.id ?? null,
          item: item ?? null,
        }),
      );
      emit();
    },

    async listLikeCounts() {
      const rows = check(await sb.rpc('like_counts')) as { item_id: string; n: number }[] | null;
      const counts: Record<string, number> = {};
      for (const r of rows ?? []) counts[r.item_id] = Number(r.n);
      return counts;
    },

    async setLike(itemId, deviceId, liked) {
      check(await sb.rpc('set_like', { p_item: itemId, p_device: deviceId, p_like: liked }));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
