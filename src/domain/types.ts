/** 엑셀 시트 4개 = 가이드의 4개 분류 */
export type SheetKey = 'food' | 'hidden' | 'tips' | 'free';

export const SHEETS: { key: SheetKey; label: string; xlsx: string; emoji: string; desc: string }[] = [
  { key: 'food', label: '맛집', xlsx: '1_맛집', emoji: '🍚', desc: '재학생이 추천한 학교 앞·충주 맛집과 카페' },
  { key: 'hidden', label: '숨은장소', xlsx: '2_숨은장소', emoji: '🌿', desc: '공강 때 쉬기 좋은 곳, 산책로, 공부 자리' },
  { key: 'tips', label: '생활꿀팁', xlsx: '3_생활꿀팁', emoji: '💡', desc: '교통·학사·시설 이용까지 학교생활 꿀팁' },
  { key: 'free', label: '자유', xlsx: '4_자유', emoji: '🗂️', desc: '장학금, 자취, 주말 이동 등 그 밖의 정보' },
];

export const sheetOf = (key: SheetKey) => SHEETS.find((s) => s.key === key)!;

/** 장소가 어디쯤인지: 캠퍼스 안 / 학교 앞 대학로 일대 / 그 밖의 충주 */
export type Zone = 'campus' | 'daehakro' | 'city';

export const ZONE_LABEL: Record<Zone, string> = {
  campus: '캠퍼스 안',
  daehakro: '대학로 일대',
  city: '충주 시내·근교',
};

/**
 * 가이드 항목 하나 = 엑셀의 한 행.
 * "확인 안 됨" / "해당 없음"은 모두 null로 바꿔 두고, 화면에서는 값이 있는 칸만 보여 준다.
 */
export interface GuideItem {
  /** 시트+이름으로 만든 고정 id. 엑셀을 다시 정렬해도 바뀌지 않아 승인된 수정이 계속 이어진다. */
  id: string;
  sheet: SheetKey;
  name: string;
  kind: '장소' | '정보';
  location: string | null;
  mapUrl: string | null;
  verifiedAt: string | null;
  recommendCount: number;
  /** 'O' | 'X' 만 저장 (확인 안 됨·해당 없음은 null) */
  solo: 'O' | 'X' | null;
  price: number | null;
  priceBasis: string | null;
  /** 학생들이 적은 내용. 바깥 배열 = 학생 한 명, 안쪽 배열 = 줄 */
  notes: string[][];
  /** 운영 중단 제보가 승인된 곳 */
  closed?: boolean;
  /** 매니저 승인으로 바뀐 날 (ISO) */
  updatedAt?: string;
  /** 재학생 제보로 새로 등록된 항목 */
  community?: boolean;
}

/** 제보 폼에서 고칠 수 있는 칸 */
export type EditableFields = Pick<
  GuideItem,
  'name' | 'kind' | 'location' | 'mapUrl' | 'solo' | 'price' | 'priceBasis' | 'closed'
> & { sheet: SheetKey; noteText: string };

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  /** edit: 기존 항목 수정 / new: 새 장소·정보 등록 */
  kind: 'edit' | 'new';
  targetId: string | null;
  payload: EditableFields;
  /** 매니저에게 남기는 말 (무엇이 왜 바뀌었는지) */
  message: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt: string | null;
}
