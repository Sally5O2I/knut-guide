/**
 * 위치 글을 보고 "어디쯤인지" 판단한다. (캠퍼스 건물 / 대학로 번지 / 그 밖)
 * 엑셀에 좌표가 없어서 위치 글의 키워드로만 판단하고, 애매하면 핀을 꽂지 않는다.
 * 재학생 제보로 새로 들어온 항목도 같은 규칙으로 지도에 올라간다.
 */
import { BUILDINGS, type Building } from '../data/campusMap';
import type { GuideItem, Zone } from './types';

/** 학생 데이터에 나오지만 약도에 없는 건물 — 엉뚱한 건물에 핀이 꽂히지 않게 먼저 걸러 낸다 */
const NOT_ON_MAP = ['휴스퀘어', '국제청년협력센터', '스마트ICT', '스마트 ICT', '대원생활관', '대원 2층', '노천극장', '미래융합', '소담스퀘어', 'E3동', 'E2동'];

const CAMPUS_HINT =
  /대학로\s?50(?!\d)|충주캠퍼스|교통대학교|교내|캠퍼스 내|정문 옆|둘레길|회차지|스마트\s?ICT|휴스퀘어|국제청년협력센터|생활관|노천극장|미래융합|[EW]\d{1,2}동/;
/** 학생식당·교직원식당·복지관 카페는 모두 대학본부 별관(E8-1) = 학생복지관에 있다 */
const WELFARE = /학생식당|교직원식당|THE HUE|복지관|E8-1|대학본부\s?별관/;
const DAEHAKRO_HINT = /대학가|자취방|국원대교|명보약국|대학로쪽|대학로 시내/;
const STREET = /(대학로|대학촌1길|용두제방길|모단길|요도천변길)\s?(\d+)(?:-(\d+))?/;

function hasKey(text: string, key: string): boolean {
  if (/^[EW]\d+$/.test(key)) return new RegExp(`(^|[^0-9A-Za-z])${key}([^0-9]|$)`).test(text);
  return text.includes(key);
}

export function buildingOf(item: Pick<GuideItem, 'name' | 'location'>): Building | null {
  if (WELFARE.test(item.location ?? '') || WELFARE.test(item.name)) return BUILDINGS.find((b) => b.id === 'welfare')!;
  // 위치 칸을 먼저 보고, 위치로 못 정하면 이름으로 본다.
  for (const text of [item.location ?? '', item.name]) {
    if (!text) continue;
    if (NOT_ON_MAP.some((k) => text.includes(k))) return null;
    const b = BUILDINGS.find((bd) => bd.keys.some((k) => hasKey(text, k)));
    if (b) return b;
  }
  return null;
}

export interface StreetAddress {
  street: string;
  no: number;
  sub: number | null;
  label: string;
}

export function streetOf(location: string | null): StreetAddress | null {
  if (!location || !location.includes('대소원면')) return null;
  const m = location.match(STREET);
  if (!m) return null;
  const no = Number(m[2]);
  if (m[1] === '대학로' && no === 50) return null; // 대학로 50 = 캠퍼스
  const sub = m[3] ? Number(m[3]) : null;
  return { street: m[1], no, sub, label: `${m[1]} ${no}${sub ? `-${sub}` : ''}` };
}

/** 장소의 권역. 위치를 알 수 없는 "정보" 항목은 null */
export function zoneOf(item: Pick<GuideItem, 'name' | 'location' | 'kind'>): Zone | null {
  const loc = item.location ?? '';
  if (streetOf(item.location)) return 'daehakro';
  if (CAMPUS_HINT.test(loc) || buildingOf(item)) return 'campus';
  if (DAEHAKRO_HINT.test(loc)) return 'daehakro';
  // 위치가 주소가 아닌 짧은 설명이면 이름으로 캠퍼스 여부를 본다 (예: "생활관 독서실")
  if (CAMPUS_HINT.test(item.name) && !loc.includes('충주시')) return 'campus';
  return loc ? 'city' : null;
}
