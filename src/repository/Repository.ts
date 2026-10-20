/**
 * 데이터 접근 인터페이스.
 * 화면은 이 인터페이스만 알고, 실제 저장소(localStorage / Supabase)는 모른다.
 *
 * 기본 가이드 데이터(src/data/guide.json)는 코드에 들어 있고,
 * 저장소에는 "재학생 제보"와 "매니저가 승인해 덮어쓴 항목"만 있다.
 */
import type { EditableFields, GuideItem, Submission, SubmissionStatus } from '../domain/types';

export interface NewSubmission {
  kind: 'edit' | 'new';
  targetId: string | null;
  payload: EditableFields;
  message: string;
}

export interface Repository {
  /** local: 이 브라우저에만 저장 / supabase: 서버에 저장, 모든 학생에게 반영 */
  readonly mode: 'local' | 'supabase';

  /** 승인되어 공개된 항목 (기존 항목을 덮어쓰거나 새로 추가) */
  listPublished(): Promise<GuideItem[]>;

  /** 누구나: 수정·신규 제보 보내기 (바로 반영되지 않고 승인 대기) */
  submit(sub: NewSubmission): Promise<void>;

  // 매니저
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isManager(): Promise<boolean>;
  listSubmissions(status: SubmissionStatus): Promise<Submission[]>;
  /** 승인이면 item을 공개 목록에 반영, 반려면 item은 null */
  review(submissionId: string, approve: boolean, item: GuideItem | null): Promise<void>;

  // 좋아요 (로그인 없이 기기당 1번)
  /** 항목 id → 좋아요 수 */
  listLikeCounts(): Promise<Record<string, number>>;
  /** 이 기기에서 누르기(true)·취소(false) */
  setLike(itemId: string, deviceId: string, liked: boolean): Promise<void>;

  /** 데이터가 바뀌면 호출. 반환값은 구독 해제 함수 */
  subscribe(listener: () => void): () => void;
}
