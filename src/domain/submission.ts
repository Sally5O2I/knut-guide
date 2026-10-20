/**
 * 제보(수정·신규) 검증과, 승인 시 실제 항목으로 바꾸는 규칙.
 */
import { stableId } from './clean';
import type { EditableFields, GuideItem, SheetKey } from './types';

export const LIMITS = { name: 60, location: 120, priceBasis: 60, noteText: 1000, message: 500 } as const;

/** 지도 링크는 네이버·카카오 지도만 받는다 (낯선 링크로 학생을 보내지 않도록) */
const MAP_HOSTS = ['naver.me', 'map.naver.com', 'm.map.naver.com', 'kko.to', 'map.kakao.com', 'place.map.kakao.com', 'kakaomap.com'];

export function isAllowedMapUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && MAP_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export function emptyFields(sheet: SheetKey = 'tips'): EditableFields {
  return { sheet, name: '', kind: '장소', location: null, mapUrl: null, solo: null, price: null, priceBasis: null, closed: false, noteText: '' };
}

export function fieldsFromItem(item: GuideItem): EditableFields {
  return {
    sheet: item.sheet,
    name: item.name,
    kind: item.kind,
    location: item.location,
    mapUrl: item.mapUrl,
    solo: item.solo,
    price: item.price,
    priceBasis: item.priceBasis,
    closed: !!item.closed,
    noteText: '',
  };
}

/** 문제가 있으면 칸 이름 → 안내 문구 */
export function validate(f: EditableFields, message: string, kind: 'edit' | 'new'): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim()) e.name = '이름을 적어 주세요.';
  else if (f.name.length > LIMITS.name) e.name = `이름은 ${LIMITS.name}자까지예요.`;
  if (f.location && f.location.length > LIMITS.location) e.location = `위치는 ${LIMITS.location}자까지예요.`;
  if (f.mapUrl && !isAllowedMapUrl(f.mapUrl)) e.mapUrl = '네이버 지도나 카카오맵의 https 링크만 넣을 수 있어요.';
  if (f.price !== null && (!Number.isInteger(f.price) || f.price < 0 || f.price > 1_000_000)) e.price = '가격은 0~1,000,000 사이 숫자로 적어 주세요.';
  if (f.priceBasis && f.priceBasis.length > LIMITS.priceBasis) e.priceBasis = `가격 기준은 ${LIMITS.priceBasis}자까지예요.`;
  if (f.noteText.length > LIMITS.noteText) e.noteText = `내용은 ${LIMITS.noteText}자까지예요.`;
  if (message.length > LIMITS.message) e.message = `남기는 말은 ${LIMITS.message}자까지예요.`;
  if (kind === 'new' && !f.noteText.trim() && !f.location?.trim()) e.noteText = '위치나 내용 중 하나는 적어 주세요.';
  if (kind === 'edit' && !message.trim() && !f.noteText.trim()) e.message = '무엇이 바뀌었는지 한 줄 남겨 주세요.';
  return e;
}

const clean = (s: string | null) => (s && s.trim() ? s.trim() : null);

/**
 * 승인할 때 만들어지는 최종 항목.
 * - edit: 기존 항목에 바뀐 칸을 덮어쓰고, 새로 적은 내용은 학생 글 맨 앞에 붙인다.
 * - new : 새 항목 (id는 제보 id 기준으로 고정)
 */
export function applyFields(f: EditableFields, base: GuideItem | null, submissionId: string, now = new Date()): GuideItem {
  const note = f.noteText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const today = now.toISOString().slice(0, 10);
  const fields = {
    sheet: f.sheet,
    name: f.name.trim(),
    kind: f.kind,
    location: clean(f.location),
    mapUrl: clean(f.mapUrl),
    solo: f.solo,
    price: f.price,
    priceBasis: clean(f.priceBasis),
    closed: !!f.closed,
  };
  if (base) {
    return {
      ...base,
      ...fields,
      notes: note.length ? [note, ...base.notes] : base.notes,
      verifiedAt: today,
      updatedAt: now.toISOString(),
    };
  }
  return {
    id: stableId('c', submissionId),
    ...fields,
    verifiedAt: today,
    recommendCount: 1,
    notes: note.length ? [note] : [],
    updatedAt: now.toISOString(),
    community: true,
  };
}

/** 매니저 화면용: 바뀐 칸 목록 */
export function diffFields(before: EditableFields, after: EditableFields): { label: string; from: string; to: string }[] {
  const labels: [keyof EditableFields, string][] = [
    ['sheet', '분류'],
    ['name', '이름'],
    ['kind', '유형'],
    ['location', '위치'],
    ['mapUrl', '지도 링크'],
    ['solo', '혼밥'],
    ['price', '가격(원)'],
    ['priceBasis', '가격 기준'],
    ['closed', '운영 중단'],
  ];
  const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : v === true ? '예' : v === false ? '아니오' : String(v));
  return labels
    .filter(([k]) => show(before[k]) !== show(after[k]))
    .map(([k, label]) => ({ label, from: show(before[k]), to: show(after[k]) }));
}
