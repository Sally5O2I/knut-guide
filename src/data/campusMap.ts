/**
 * 캠퍼스 약도 데이터.
 * 교통대 둘레길 안내판을 다시 그린 약도(public/images/trail-map.webp)를 기준으로 좌표를 옮겼다.
 * 실제 축척·위치와 다를 수 있으므로 화면에도 "약도"라고 밝힌다.
 * 좌표계: viewBox 0 0 1120 1200
 */

export interface Building {
  id: string;
  label: string;
  /** 학생 데이터에 적힌 건물 코드 (확실한 것만) */
  code?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 이 건물로 묶을 위치 글 키워드 (위치·이름에 포함되면 이 건물에 핀을 꽂는다) */
  keys: string[];
  shape?: 'ellipse';
}

export const BUILDINGS: Building[] = [
  // 안내판 약도에는 "여성생활관"으로 적혀 있으나, 학생 데이터와 학교 명칭은 "예성생활관"이다.
  { id: 'yeseong', label: '예성생활관', x: 322, y: 87, w: 108, h: 40, keys: ['예성'] },
  { id: 'jungwon', label: '중원생활관', x: 293, y: 172, w: 108, h: 40, keys: ['중원생활관', '중원 6층'] },
  { id: 'humanities', label: '인문사회관', code: 'E14', x: 497, y: 171, w: 130, h: 44, keys: ['인문사회', '인사대', 'E14', '블루포트', 'blue pot'] },
  { id: 'airforce', label: '공군학군단', x: 780, y: 297, w: 84, h: 60, keys: ['학군단'] },
  { id: 'civil', label: '건설환경관', x: 426, y: 345, w: 130, h: 40, keys: ['건설환경관'] },
  { id: 'arch', label: '건축관', x: 463, y: 455, w: 80, h: 36, keys: ['건축관'] },
  { id: 'tank', label: '고가수조', x: 662, y: 474, w: 88, h: 34, keys: ['고가수조'] },
  { id: 'mech', label: '역학시험동', x: 778, y: 535, w: 96, h: 36, keys: ['역학시험동'] },
  { id: 'lab', label: '공동실험실험관', x: 270, y: 480, w: 104, h: 50, keys: ['공동실험'] },
  { id: 'club', label: '동아리관', x: 233, y: 593, w: 86, h: 34, keys: ['동아리관'] },
  { id: 'chem', label: '화학생명관', x: 435, y: 593, w: 96, h: 54, keys: ['화학생명관'] },
  // 학생 데이터상 복지관 = 대학본부 별관(E8-1동): 학생식당 1층, 카페 2층, 교직원식당 3층
  { id: 'welfare', label: '학생복지관', code: 'E8-1', x: 501, y: 668, w: 92, h: 54, keys: ['복지관', '학생식당', '교직원식당', '학식', 'THE HUE'] },
  { id: 'main', label: '대학본부', code: 'E8', x: 666, y: 648, w: 80, h: 58, keys: ['대학본부', 'E8', '보건'] },
  { id: 'biz', label: '경영항공관', code: 'E7', x: 778, y: 625, w: 116, h: 36, keys: ['경영항공관'] },
  { id: 'incub', label: '인터넷창업보육센터', x: 315, y: 753, w: 120, h: 50, keys: ['창업보육'] },
  { id: 'it', label: 'IT관', code: 'W16', x: 221, y: 800, w: 62, h: 34, keys: ['IT관', 'W16'] },
  { id: 'lecture', label: '종합강의동', code: 'W5', x: 492, y: 768, w: 100, h: 56, keys: ['종합강의', 'W5'] },
  { id: 'union', label: '학생회관', code: 'E6', x: 680, y: 748, w: 92, h: 34, keys: ['학생회관', 'E6', '아이디어팩토리', 'IDF', '피트니스'] },
  { id: 'system', label: '시스템관', x: 870, y: 803, w: 90, h: 34, keys: ['시스템관'] },
  { id: 'techno', label: '테크노관', code: 'E5', x: 749, y: 869, w: 160, h: 106, keys: ['테크노관', 'E5'] },
  { id: 'info', label: '중앙정보관', x: 322, y: 862, w: 110, h: 34, keys: ['중앙정보관'] },
  { id: 'grad', label: '대학원동', x: 519, y: 857, w: 96, h: 34, keys: ['대학원'] },
  { id: 'gukwon', label: '국원생활관', x: 842, y: 1005, w: 120, h: 36, keys: ['국원생활관', '국원 5층'] },
  { id: 'field', label: '대운동장', code: 'W19', x: 293, y: 998, w: 148, h: 80, keys: ['대운동장', 'W19'], shape: 'ellipse' },
  { id: 'library', label: '중앙도서관', code: 'W20', x: 411, y: 997, w: 86, h: 54, keys: ['도서관', 'W20', '캐럴', '지스퀘어', 'G-Square', '디지털정보센터'] },
  { id: 'gym', label: '체육관', x: 514, y: 1010, w: 76, h: 34, keys: ['체육관'] },
  { id: 'env', label: '환경관', x: 248, y: 1102, w: 72, h: 34, keys: ['환경관'] },
];

export const GATES = [
  { id: 'back', label: '후문', x: 517, y: 24 },
  { id: 'front', label: '정문', x: 647, y: 1137 },
];

export interface Trail {
  no: number;
  name: string;
  color: string;
  lengthM: number;
  minutes: number;
  meaning: string;
  d: string;
  badge: { x: number; y: number };
}

// 구간 번호·이름·거리·소요시간·의미는 현장 안내판 기준
export const TRAILS: Trail[] = [
  {
    no: 1, name: '국원길', color: '#12a07a', lengthM: 320, minutes: 5,
    meaning: '고구려 시대 충주 지역을 뜻하는 옛말로 지형학적인 의미를 담고 있어요.',
    d: 'M642 818 C 636 880 680 965 755 970 C 820 974 860 930 930 922',
    badge: { x: 712, y: 1011 },
  },
  {
    no: 2, name: '웅비길', color: '#e5484d', lengthM: 670, minutes: 15,
    meaning: '기운차고 용기 있게 나아가자는 뜻으로, 젊은이들의 미래 지향적 행동을 독려하는 길이에요.',
    d: 'M757 420 C 840 450 880 520 920 620 L 1010 900 C 1020 935 975 935 930 922',
    badge: { x: 992, y: 603 },
  },
  {
    no: 3, name: '해찬솔길', color: '#84c225', lengthM: 400, minutes: 7,
    meaning: '햇빛이 가득 비추어 더욱 푸른 소나무 길이라는 뜻이에요.',
    d: 'M670 111 C 690 150 700 190 695 218 C 700 300 710 440 735 440 C 745 440 750 430 757 420',
    badge: { x: 615, y: 358 },
  },
  {
    no: 4, name: '비상길', color: '#7c4dcc', lengthM: 510, minutes: 8,
    meaning: '세계의 중심으로 비상하자는 뜻으로, 글로벌화를 향한 대학의 비전을 담았어요.',
    d: 'M513 115 C 560 90 620 80 670 111 C 740 140 820 170 890 215 C 910 235 900 260 880 290 L 757 420',
    badge: { x: 798, y: 112 },
  },
  {
    no: 5, name: '꽃내음길', color: '#e8579b', lengthM: 320, minutes: 8,
    meaning: '꽃의 냄새란 뜻으로, 아름다운 꽃향기를 느낄 수 있는 길이에요.',
    d: 'M287 272 C 420 255 560 240 695 218',
    badge: { x: 512, y: 289 },
  },
  {
    no: 6, name: '중예길', color: '#e0a21d', lengthM: 310, minutes: 5,
    meaning: '중원과 예성의 줄임말이자 "여러 사람의 뛰어난 재치, 또는 그것을 모은 것"이라는 중의적 의미예요.',
    d: 'M224 416 L 287 272 C 330 210 380 150 430 125 C 460 115 490 115 513 115',
    badge: { x: 167, y: 331 },
  },
  {
    no: 7, name: '가온길', color: '#2f7de1', lengthM: 620, minutes: 9,
    meaning: '가운데의 옛말로, 세상의 제일(第一)의 길이라는 뜻이에요.',
    d: 'M224 416 C 270 410 320 405 328 450 L 338 760 C 345 830 380 870 430 883',
    badge: { x: 265, y: 686 },
  },
  {
    no: 8, name: '온새미로길', color: '#b3203f', lengthM: 850, minutes: 10,
    meaning: '자연 그대로 한결 같은 학우들의 모습을 담은 길이에요.',
    d: 'M224 416 C 180 520 140 640 150 760 C 160 870 220 905 330 900 L 430 883 C 480 875 545 860 555 830 C 560 790 560 760 575 760 C 600 770 620 800 642 818',
    badge: { x: 360, y: 930 },
  },
];

/** 배경 길 (회색) */
export const ROADS = [
  'M647 1137 C 645 1050 640 980 625 900 C 600 800 590 760 560 620 C 540 520 525 360 517 24',
  'M180 1150 C 165 1000 150 850 165 700 C 175 600 210 470 300 300',
  'M300 300 C 360 240 420 160 470 110',
  'M560 620 C 620 600 700 560 760 500',
  'M625 900 C 700 880 820 860 900 840',
  'M400 520 C 430 640 460 720 492 768',
];

/** 언덕·숲 영역 (연녹색) */
export const GREEN_AREAS = [
  'M420 130 C 520 50 760 40 900 120 C 1010 200 990 370 830 430 C 700 470 560 330 420 130 Z',
];
