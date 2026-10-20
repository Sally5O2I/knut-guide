/**
 * 엑셀 값 → 가이드 데이터로 옮길 때 쓰는 정리 규칙.
 * 원본 내용을 바꾸지 않고, 화면에 보여 주면 안 되거나 의미 없는 것만 걷어 낸다.
 */

const MISSING = new Set(['확인 안 됨', '해당 없음', '없음', '']);

/** "확인 안 됨" · "해당 없음" · 빈칸 → null */
export function valueOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return MISSING.has(s) ? null : s;
}

/** 순위 번호만 적힌 메모 ("캠퍼스 2번", "대학가 5번", "PC방 1번", "11번") — 원래 목록을 모르면 의미가 없다 */
const RANK_ONLY = /^(캠퍼스|대학가|PC방|노래방)?\s*\d+번$/;
/** "3번 (친절하심)" → "친절하심" */
const RANK_WITH_NOTE = /^(캠퍼스|대학가|PC방|노래방)?\s*\d+번\s*\((.+)\)$/;
/** 제출 양식에서 비어 있는 칸 ("추천 이유:", "사진1:"). "장점:" 같은 소제목은 남긴다. */
const EMPTY_FIELD = /^(추천 이유|운영시간|가격대|대표 메뉴\/핵심 정보|사진\d*)\s*[:：]\s*$/;
/** 양식에서 떼어 낼 머리말 */
const DROP_FIELD = /^(분류|사진\d*)\s*[:：]/;
const UNWRAP_FIELD = /^대표 메뉴\/핵심 정보\s*[:：]\s*/;

/**
 * 학생 한 명이 적은 글(셀 안의 한 줄)을 화면용 줄 목록으로 바꾼다.
 * 원본에서 줄바꿈 자리는 " | " 로 이어져 있다.
 */
export function cleanContribution(raw: string): string[] {
  const text = raw.trim();
  if (!text || text === '적은 내용 없음') return [];
  if (RANK_ONLY.test(text)) return [];
  const withNote = text.match(RANK_WITH_NOTE);
  if (withNote) return [withNote[2].trim()];

  const lines: string[] = [];
  for (let part of text.split(/\s*\|\s*/)) {
    part = part.trim();
    if (!part || part === '-') continue;
    if (DROP_FIELD.test(part) || EMPTY_FIELD.test(part)) continue;
    // 정리하면서 붙인 대괄호 메모 ("[원본 지도 링크 3개: …]")는 정리용이라 뺀다.
    part = part.replace(UNWRAP_FIELD, '').replace(/\s*\[원본 [^\]]*\]/g, '').trim();
    if (part) lines.push(part);
  }
  return lines;
}

/**
 * 3_생활꿀팁 · 4_자유 시트의 "비고 (학생들이 적은 내용)" 셀.
 * 학생마다 줄이 바뀌어 있고, 맨 아래 "※ 정리 메모:"는 정리한 사람용이라 뺀다.
 * 같은 학생이 같은 글을 두 번 낸 경우(완전히 같은 글)는 한 번만 남긴다.
 */
export function cleanNotes(cell: unknown): string[][] {
  const text = valueOrNull(cell);
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const chunk of text.split(/\r?\n/)) {
    if (chunk.trim().startsWith('※')) continue;
    const lines = cleanContribution(chunk);
    if (!lines.length) continue;
    const key = lines.join('\n');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lines);
  }
  return out;
}

/** 가격 칸: 숫자만 인정 */
export function priceOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = valueOrNull(v);
  if (!s || !/^\d+$/.test(s)) return null;
  return Number(s);
}

/** 확인한 날: 엑셀이 날짜로 읽으면 YYYY-MM-DD로, 문자열이면 그대로 */
export function dateOrNull(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return valueOrNull(v);
}

/** 시트+이름으로 만드는 짧은 고정 id (FNV-1a) */
export function stableId(prefix: string, name: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${prefix}:${name}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
  return `${prefix}-${(h >>> 0).toString(36)}`;
}
