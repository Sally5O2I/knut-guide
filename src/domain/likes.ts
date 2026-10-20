/**
 * 좋아요 (로그인 없이 기기당 1번).
 * - 기기 id: 처음 방문 때 만든 임의 값 (개인정보 아님). 브라우저 기록을 지우면 새 기기로 본다.
 * - 화면 숫자는 "참고용" 인기 신호이고, 엑셀의 "재학생 추천 수"와는 따로 보여 준다.
 */

export type LikeCounts = Record<string, number>;

/** 누르기/취소를 화면에 먼저 반영할 때 쓰는 계산 (서버 응답 전) */
export function toggleLocal(counts: LikeCounts, mine: Set<string>, id: string): { counts: LikeCounts; mine: Set<string>; liked: boolean } {
  const nextMine = new Set(mine);
  const liked = !mine.has(id);
  if (liked) nextMine.add(id);
  else nextMine.delete(id);
  const n = Math.max(0, (counts[id] ?? 0) + (liked ? 1 : -1));
  return { counts: { ...counts, [id]: n }, mine: nextMine, liked };
}

const DEVICE_KEY = 'knut-guide:device';
const MINE_KEY = 'knut-guide:my-likes';

/** 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 이번 방문 동안만 쓰는 id */
let sessionDevice: string | null = null;

export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    sessionDevice ??= crypto.randomUUID();
    return sessionDevice;
  }
}

export function readMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function writeMine(mine: Set<string>) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify([...mine]));
  } catch {
    /* 저장 못 해도 이번 방문 동안은 화면에 반영된다 */
  }
}
