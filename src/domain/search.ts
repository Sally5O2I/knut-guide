/**
 * 가이드 검색.
 * - 띄어쓰기·대소문자 무시 ("부리또인" = "부리 또인")
 * - 초성 검색 ("ㅂㄹㄸ" → 부리또인)
 * - 여러 단어는 모두 들어 있어야 함 ("도서관 24시간")
 * - 이름에 걸리면 내용에 걸린 것보다 위로
 */
import { sheetOf, type GuideItem } from './types';

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const IS_CHO_ONLY = /^[ㄱ-ㅎ]+$/;

export const normalize = (s: string) => s.toLowerCase().replace(/[\s·,./()\-_~!?'"[\]]+/g, '');

export function chosung(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172) out += CHO[Math.floor(code / 588)];
    else if (/[ㄱ-ㅎ]/.test(ch)) out += ch;
  }
  return out;
}

interface Indexed {
  item: GuideItem;
  name: string;
  nameCho: string;
  body: string;
}

export function buildIndex(items: GuideItem[]): Indexed[] {
  return items.map((item) => ({
    item,
    name: normalize(item.name),
    nameCho: chosung(item.name.replace(/\s/g, '')),
    body: normalize(
      [item.location, item.priceBasis, sheetOf(item.sheet).label, item.kind, item.solo === 'O' ? '혼밥 가능' : '', ...item.notes.flat()]
        .filter(Boolean)
        .join(' '),
    ),
  }));
}

export function search(index: Indexed[], query: string): GuideItem[] {
  const terms = query.trim().split(/\s+/).map(normalize).filter(Boolean);
  if (!terms.length) return [];
  const scored: { item: GuideItem; score: number }[] = [];
  for (const row of index) {
    let score = 0;
    let ok = true;
    for (const t of terms) {
      if (IS_CHO_ONLY.test(t) && t.length >= 2 && row.nameCho.includes(t)) score += 6;
      else if (row.name.includes(t)) score += row.name.startsWith(t) ? 10 : 8;
      else if (row.body.includes(t)) score += 2;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push({ item: row.item, score: score + Math.min(row.item.recommendCount, 5) * 0.3 });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
