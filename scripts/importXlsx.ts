/**
 * 정규화 엑셀 → src/data/guide.json
 *   npm run import-data                 (기본: data/정규화.xlsx)
 *   npm run import-data -- 다른파일.xlsx
 * 엑셀을 고친 뒤 이 명령만 다시 돌리면 사이트 데이터가 바뀐다.
 * 열은 위치가 아니라 머리글 이름으로 찾으므로 열 순서가 바뀌어도 괜찮다.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import readXlsxFile from 'read-excel-file/node';
import { cleanNotes, dateOrNull, priceOrNull, stableId, valueOrNull } from '../src/domain/clean';
import { SHEETS, type GuideItem } from '../src/domain/types';

const input = resolve(process.argv[2] ?? 'data/정규화.xlsx');
const output = resolve('src/data/guide.json');

const PREFIX = { food: 'f', hidden: 'h', tips: 't', free: 'x' } as const;

async function main() {
  const items: GuideItem[] = [];
  const ids = new Set<string>();
  const report: string[] = [];

  for (const sheet of SHEETS) {
    const rows = (await readXlsxFile(input, { sheet: sheet.xlsx })) as unknown[][];
    const header = rows[0].map((h) => String(h ?? '').trim());
    const col = (name: string) => {
      const i = header.findIndex((h) => h === name || h.startsWith(name));
      return i;
    };
    const c = {
      name: col('이름'),
      location: col('위치'),
      map: col('지도'),
      date: col('확인한 날'),
      count: col('추천 수'),
      kind: col('유형'),
      solo: col('혼밥'),
      price: col('가격(원)'),
      priceBasis: col('가격 기준'),
      notes: col('비고'),
    };
    // 1_맛집 · 2_숨은장소의 비고는 정리 메모(분류 차이·병합 사유)라 화면에 싣지 않는다.
    const notesAreStudentText = sheet.key === 'tips' || sheet.key === 'free';

    let count = 0;
    for (const row of rows.slice(1)) {
      const name = valueOrNull(row[c.name]);
      if (!name) continue;
      let id = stableId(PREFIX[sheet.key], name);
      while (ids.has(id)) id += '_';
      ids.add(id);

      const solo = c.solo >= 0 ? valueOrNull(row[c.solo]) : null;
      items.push({
        id,
        sheet: sheet.key,
        name,
        kind: valueOrNull(row[c.kind]) === '정보' ? '정보' : '장소',
        location: valueOrNull(row[c.location]),
        mapUrl: valueOrNull(row[c.map]),
        verifiedAt: dateOrNull(row[c.date]),
        recommendCount: Number(row[c.count]) || 1,
        solo: solo === 'O' || solo === 'X' ? solo : null,
        price: c.price >= 0 ? priceOrNull(row[c.price]) : null,
        priceBasis: c.priceBasis >= 0 ? valueOrNull(row[c.priceBasis]) : null,
        notes: notesAreStudentText && c.notes >= 0 ? cleanNotes(row[c.notes]) : [],
      });
      count++;
    }
    report.push(`${sheet.xlsx}: ${count}행`);
  }

  writeFileSync(output, JSON.stringify(items, null, 1) + '\n', 'utf8');
  console.log(`${input}\n→ ${output}\n${report.join('\n')}\n합계 ${items.length}행`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
