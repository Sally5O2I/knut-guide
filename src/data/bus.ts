/**
 * 999번(터미널↔교통대 교내)과 700번(대학순환) 시간표.
 * 학교에서 배포한 시간표 이미지(public/images/bus-999.jpg, bus-700.jpg)를 그대로 옮겼다.
 * 시간표가 바뀌면 이 파일과 이미지만 바꾸면 된다.
 * 공통: 주말·공휴일·방학 미운행
 */

/** 한 칸: 시각("08:17") 또는 비어 있음(null). note는 칸 안의 작은 글씨 */
export interface Cell {
  t: string | null;
  note?: string;
}

export interface Timetable {
  route: string;
  title: string;
  color: string;
  stopsDiagram: string[];
  /** 표 머리글, 가운데 구분선 앞까지가 "가는 편" */
  headers: string[];
  splitAt: number;
  rows: Cell[][];
  notice: string[];
  image: string;
}

const c = (t: string | null, note?: string): Cell => ({ t, note });
const direct = (): Cell => ({ t: null, note: '→ 교통대 직행' });

export const BUS_999: Timetable = {
  route: '999',
  title: '한국교통대방면 (터미널 ↔ 교통대)',
  color: '#9b1f6e',
  stopsDiagram: ['차고지', '터미널(롯데마트)', '충주역', '건국대 사거리', '달천', '한국교통대 정문', '한국교통대 회차지'],
  headers: ['터미널', '충주역', '교통대 도착', '교통대 출발', '충주역', '터미널'],
  splitAt: 3,
  rows: [
    [c('08:15', '차고지 08:10'), c('08:17'), c('08:33'), c('08:42'), c('08:58'), c('09:00')],
    [c('08:38', '차고지 08:35'), c('08:40'), c('08:56'), c('09:05'), c('09:21'), c('09:23')],
    [c('09:01'), c('09:03'), c('09:19'), c('09:28'), c('09:44'), c('09:46')],
    [c('09:24'), c('09:26'), c('09:42'), c('09:51'), c('10:07'), c('10:09')],
    [c('09:47'), c('09:49'), c('10:05'), c('10:14'), c('10:30'), c('10:32')],
    [c('10:10'), c('10:12'), c('10:28'), c('10:37'), c('10:53'), c('10:55')],
    [c('10:33'), c('10:35'), c('10:51'), c('11:00'), c('11:16'), c('11:18')],
    [c('10:56'), c('10:58'), c('11:14'), c('11:23'), c('11:39'), c('11:41')],
    [c('11:19'), c('11:21'), c('11:37'), c('11:46'), c('12:02'), c('12:04')],
    [c('11:42'), c('11:44'), c('12:00'), c('12:09'), c('12:25'), c('12:27')],
    [c('12:05'), c('12:07'), c('12:23'), c('12:32'), c('12:48'), c('12:50', '차고지 12:55')],
    [c('12:28'), c('12:30'), c('12:46'), c(null), c(null), c(null)],
    [c(null, '차고지 14:15'), direct(), c(null), c('14:25'), c('14:41'), c('14:43')],
    [c('15:00'), direct(), c(null), c('15:10'), c('15:26'), c('15:28')],
    [c('15:05'), c('15:07'), c('15:23'), c('15:32'), c('15:48'), c('15:50')],
    [c('15:28'), c('15:30'), c('15:46'), c('15:55'), c('16:11'), c('16:13')],
    [c('15:51'), c('15:53'), c('16:09'), c('16:18'), c('16:34'), c('16:36')],
    [c('16:14'), c('16:16'), c('16:32'), c('16:41'), c('16:57'), c('16:59')],
    [c('16:37'), c('16:39'), c('16:55'), c(null), c(null), c(null)],
    [c('17:00'), c('17:02'), c('17:18'), c('17:27'), c('17:43'), c('17:45', '차고지 17:50')],
    [c('18:25', '차고지 18:20'), c('18:27'), c('18:43'), c('18:47'), c('19:03'), c('19:05')],
    [c('19:05'), direct(), c(null), c('20:30'), c('20:46'), c('20:48', '차고지 20:53')],
  ],
  notice: ['주말·공휴일·방학에는 운행하지 않아요.', '교통대 안까지 들어오는 버스예요. 정문·기숙사·인문사회관 앞 정류장에 서요.'],
  image: 'images/bus-999.jpg',
};

export const BUS_700: Timetable = {
  route: '700',
  title: '대학순환 (교통대 → 메가박스 → 터미널 → 교통대)',
  color: '#0b6b3a',
  stopsDiagram: ['교통대', '건국대', '풍경채A', '호암지구(힐데스하임A입구)', '용산신원8차A', '메가박스', '한스타워', '터미널', '충주역', '건국대', '교통대'],
  headers: ['교통대', '건국대', '호암지구', '메가박스', '터미널', '건국대', '교통대'],
  splitAt: 4,
  rows: [
    [c('12:55'), c('13:05'), c('13:14'), c('13:30'), c('13:43'), c(null, '터미널 하차'), c(null)],
    [c('17:00'), c('17:10'), c('17:19'), c('17:35'), c('17:48'), c('17:55'), c('18:05')],
    [c('18:15'), c('18:25'), c('18:34'), c('18:50'), c('19:03'), c('19:10'), c('19:20')],
    [c('19:25'), c('19:35'), c('19:44'), c('20:00'), c('20:13'), c('20:20'), c('20:30')],
  ],
  notice: [
    '주말·공휴일·방학에는 운행하지 않아요.',
    '노선도에 표기된 승강장에서만 타고 내릴 수 있어요.',
    '12:55 차는 터미널에서 운행을 마쳐요.',
  ],
  image: 'images/bus-700.jpg',
};

export const BUS_CONTACTS = [
  { label: '충주시 교통정보센터 (실시간 버스 도착)', href: 'http://its.chungju.go.kr/bis' },
  { label: '삼화버스 043-844-4098', href: 'tel:0438444098' },
  { label: '충주교통 043-845-5176', href: 'tel:0438455176' },
];

export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** 보는 사람의 기기 시간대와 상관없이 한국 시각(KST)으로 요일·분을 계산한다 */
export function kst(d: Date): { day: number; minutes: number } {
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return { day: k.getUTCDay(), minutes: k.getUTCHours() * 60 + k.getUTCMinutes() };
}

/** 주말이면 운행하지 않음 (공휴일·방학은 날짜 목록이 없어 화면 안내로 대신한다) */
export const runsOn = (d: Date) => {
  const { day } = kst(d);
  return day !== 0 && day !== 6;
};

export interface NextBus {
  time: string;
  minutesLeft: number;
}

/** 표의 한 열(정류장)에서 지금 이후 가장 가까운 시각들 */
export function nextDepartures(tt: Timetable, column: number, now: Date, count = 3): NextBus[] {
  if (!runsOn(now)) return [];
  const cur = kst(now).minutes;
  return tt.rows
    .map((r) => r[column]?.t)
    .filter((t): t is string => !!t)
    .map((t) => ({ time: t, minutesLeft: toMinutes(t) - cur }))
    .filter((b) => b.minutesLeft >= 0)
    .slice(0, count);
}
