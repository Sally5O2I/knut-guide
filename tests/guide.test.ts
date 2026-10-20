import { describe, expect, it } from 'vitest';
import guide from '../src/data/guide.json';
import { BUS_700, BUS_999, nextDepartures } from '../src/data/bus';
import { cleanContribution, cleanNotes, stableId, valueOrNull } from '../src/domain/clean';
import { toggleLocal } from '../src/domain/likes';
import { buildingOf, streetOf, zoneOf } from '../src/domain/places';
import { buildIndex, chosung, search } from '../src/domain/search';
import { applyFields, diffFields, emptyFields, fieldsFromItem, isAllowedMapUrl, validate } from '../src/domain/submission';
import type { GuideItem } from '../src/domain/types';
import { mergeItems } from '../src/state/GuideStore';

const items = guide as GuideItem[];
const find = (name: string) => items.find((i) => i.name === name)!;

describe('엑셀 → 데이터 정리', () => {
  it('엑셀 4개 시트 392행이 모두 들어온다', () => {
    expect(items).toHaveLength(392);
    expect(items.filter((i) => i.sheet === 'food')).toHaveLength(96);
    expect(items.filter((i) => i.sheet === 'hidden')).toHaveLength(93);
    expect(items.filter((i) => i.sheet === 'tips')).toHaveLength(149);
    expect(items.filter((i) => i.sheet === 'free')).toHaveLength(54);
  });

  it('추천 수 합계가 정리규칙·검증 시트(489)와 같다', () => {
    expect(items.reduce((s, i) => s + i.recommendCount, 0)).toBe(489);
  });

  it('id가 모두 다르다', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('id는 시트+이름으로 고정이라 다시 만들어도 같다', () => {
    expect(stableId('f', '리밍 교통대점')).toBe(stableId('f', '리밍 교통대점'));
    expect(stableId('f', '리밍 교통대점')).not.toBe(stableId('h', '리밍 교통대점'));
  });

  it('"확인 안 됨"·"해당 없음"은 null', () => {
    expect(valueOrNull('확인 안 됨')).toBeNull();
    expect(valueOrNull('해당 없음')).toBeNull();
    expect(valueOrNull(' 리밍 ')).toBe('리밍');
  });

  it('순위 번호만 있는 메모와 빈 양식 칸은 버린다', () => {
    expect(cleanContribution('캠퍼스 2번')).toEqual([]);
    expect(cleanContribution('대학가 5번')).toEqual([]);
    expect(cleanContribution('11번')).toEqual([]);
    expect(cleanContribution('3번 (친절하심)')).toEqual(['친절하심']);
    expect(cleanContribution('적은 내용 없음')).toEqual([]);
    expect(cleanContribution('분류: 생활꿀팁 | 추천 이유: | 운영시간: | 대표 메뉴/핵심 정보: 학생증 보여 주면 할증 없음 | 사진1: |')).toEqual([
      '학생증 보여 주면 할증 없음',
    ]);
  });

  it('정리 메모(※)는 빼고, 같은 글이 두 번이면 한 번만', () => {
    expect(cleanNotes('가 | 나\n가 | 나\n다\n※ 정리 메모: 학생별 분류 다름')).toEqual([['가', '나'], ['다']]);
  });

  it('맛집·숨은장소 시트의 비고(정리 메모)는 싣지 않는다', () => {
    expect(find('카페샵오팔').notes).toEqual([]); // 원본 비고에 학생 이름이 있었음
    expect(items.filter((i) => i.sheet === 'food' || i.sheet === 'hidden').every((i) => i.notes.length === 0)).toBe(true);
  });

  it('맛집 값이 엑셀 그대로', () => {
    const r = find('리밍 교통대점');
    expect(r).toMatchObject({ recommendCount: 5, solo: 'O', price: 6000, priceBasis: '짜장면', mapUrl: 'https://naver.me/x0UQ1Bi2' });
  });
});

describe('위치 판단', () => {
  it('대학로 번지', () => {
    expect(streetOf('충북 충주시 대소원면 대학로 19-3 1층')).toMatchObject({ street: '대학로', no: 19, sub: 3 });
    expect(streetOf('충북 충주시 대소원면 대학로 50 중앙도서관')).toBeNull();
    expect(streetOf('충북 충주시 계명대로 24')).toBeNull();
  });

  it('권역', () => {
    expect(zoneOf(find('리밍 교통대점'))).toBe('daehakro');
    expect(zoneOf(find('캐럴실'))).toBe('campus');
    expect(zoneOf(find('호암지'))).toBe('city');
    expect(zoneOf(find('생활관 독서실'))).toBe('campus');
  });

  it('캠퍼스 건물', () => {
    expect(buildingOf(find('캐럴실'))?.id).toBe('library');
    expect(buildingOf(find('교직원식당'))?.id).toBe('welfare');
    expect(buildingOf(find('대학본부 교직원식당'))?.id).toBe('welfare');
    expect(buildingOf(find('보건실에서 무료로 약 받는 법'))?.id).toBe('main');
    // 약도에 없는 건물은 엉뚱한 건물에 꽂지 않는다
    expect(buildingOf(find('고민 상담받는 곳'))).toBeNull();
    expect(buildingOf(find('외국인등록증(ARC) 발급 및 체류 연장하는 법'))).toBeNull();
  });
});

describe('검색', () => {
  const index = buildIndex(items);

  it('이름 검색이 맨 위', () => {
    expect(search(index, '부리또')[0].name).toBe('부리또인 충주교통대점');
  });

  it('띄어쓰기 무시', () => {
    expect(search(index, '부리 또인')[0].name).toBe('부리또인 충주교통대점');
  });

  it('초성', () => {
    expect(chosung('부리또인')).toBe('ㅂㄹㄸㅇ');
    expect(search(index, 'ㅂㄹㄸㅇ').map((i) => i.name)).toContain('부리또인 충주교통대점');
  });

  it('여러 단어는 모두 포함', () => {
    const r = search(index, '도서관 24시간');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => `${i.name}${i.location}${i.notes.flat().join('')}`.replace(/\s/g, '').includes('24시간'))).toBe(true);
  });

  it('혼밥 검색', () => {
    expect(search(index, '혼밥').map((i) => i.name)).toContain('리밍 교통대점');
  });
});

describe('제보와 승인', () => {
  const base = find('부리또인 충주교통대점');

  it('지도 링크는 네이버·카카오 https만', () => {
    expect(isAllowedMapUrl('https://naver.me/abc')).toBe(true);
    expect(isAllowedMapUrl('https://map.kakao.com/x')).toBe(true);
    expect(isAllowedMapUrl('http://naver.me/abc')).toBe(false);
    expect(isAllowedMapUrl('https://evil.example.com')).toBe(false);
    expect(isAllowedMapUrl('javascript:alert(1)')).toBe(false);
  });

  it('검증', () => {
    expect(validate(emptyFields(), '', 'new').name).toBeDefined();
    const f = { ...fieldsFromItem(base), price: 4500 };
    expect(validate(f, '가격 올랐어요', 'edit')).toEqual({});
    expect(validate({ ...f, price: -1 }, 'x', 'edit').price).toBeDefined();
    expect(validate(f, '', 'edit').message).toBeDefined(); // 무엇이 바뀌었는지 없음
  });

  it('수정 승인: 바뀐 칸만 덮어쓰고 새 내용은 맨 앞에', () => {
    const f = { ...fieldsFromItem(base), price: 4500, noteText: '10월부터 4,500원' };
    const out = applyFields(f, base, 'sub-1', new Date('2026-10-20T03:00:00Z'));
    expect(out.id).toBe(base.id);
    expect(out.price).toBe(4500);
    expect(out.recommendCount).toBe(base.recommendCount);
    expect(out.notes[0]).toEqual(['10월부터 4,500원']);
    expect(out.verifiedAt).toBe('2026-10-20');
    expect(diffFields(fieldsFromItem(base), f)).toEqual([{ label: '가격(원)', from: '4000', to: '4500' }]);
  });

  it('신규 승인: 새 id, 재학생 제보 표시', () => {
    const f = { ...emptyFields('tips'), name: '카페플로르 복지관점 운영 중단', kind: '정보' as const, noteText: '공사로 12월까지 휴업' };
    const out = applyFields(f, null, 'sub-2');
    expect(out.community).toBe(true);
    expect(out.id.startsWith('c-')).toBe(true);
    expect(out.notes).toEqual([['공사로 12월까지 휴업']]);
  });

  it('승인된 항목이 기본 데이터를 덮어쓰고, 새 항목은 뒤에 붙는다', () => {
    const edited = { ...base, price: 4500 };
    const fresh = applyFields({ ...emptyFields(), name: '새 가게' }, null, 'sub-3');
    const merged = mergeItems(items, [edited, fresh]);
    expect(merged).toHaveLength(items.length + 1);
    expect(merged.find((i) => i.id === base.id)!.price).toBe(4500);
  });
});

describe('좋아요', () => {
  it('누르면 +1, 다시 누르면 취소', () => {
    const a = toggleLocal({ x: 3 }, new Set(), 'x');
    expect(a).toMatchObject({ liked: true, counts: { x: 4 } });
    expect(a.mine.has('x')).toBe(true);
    const b = toggleLocal(a.counts, a.mine, 'x');
    expect(b).toMatchObject({ liked: false, counts: { x: 3 } });
    expect(b.mine.has('x')).toBe(false);
  });

  it('0 아래로 내려가지 않는다', () => {
    expect(toggleLocal({}, new Set(['y']), 'y').counts.y).toBe(0);
  });
});

describe('버스 시간표', () => {
  it('모든 행이 머리글 칸 수와 같다', () => {
    for (const tt of [BUS_999, BUS_700]) for (const r of tt.rows) expect(r).toHaveLength(tt.headers.length);
  });

  it('평일 다음 차', () => {
    const mon = new Date('2026-10-19T08:40:00+09:00'); // 월요일
    const next = nextDepartures(BUS_999, 3, mon, 2);
    expect(next.map((b) => b.time)).toEqual(['08:42', '09:05']);
    expect(next[0].minutesLeft).toBe(2);
  });

  it('주말에는 없음', () => {
    expect(nextDepartures(BUS_999, 3, new Date('2026-10-18T10:00:00+09:00'))).toEqual([]);
  });

  it('막차 이후 없음', () => {
    expect(nextDepartures(BUS_700, 0, new Date('2026-10-19T20:00:00+09:00'))).toEqual([]);
  });
});
