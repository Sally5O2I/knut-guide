/**
 * 대학로 거리 약도.
 * 엑셀에 좌표가 없어서 도로명 번지 순서로 그린다: 홀수 번지는 왼쪽, 짝수 번지는 오른쪽.
 * 캠퍼스가 대학로 50이라 번지가 큰 쪽을 캠퍼스 방향(위)으로 둔다. 실제 거리·간격과는 다를 수 있다.
 */
import { streetOf } from '../domain/places';
import type { GuideItem } from '../domain/types';

export interface Lot {
  key: string;
  street: string;
  no: number;
  items: GuideItem[];
}

export function groupLots(items: GuideItem[]): { main: Lot[]; alleys: Map<string, Lot[]> } {
  const lots = new Map<string, Lot>();
  for (const it of items) {
    const st = streetOf(it.location);
    if (!st) continue;
    const key = `${st.street} ${st.no}`;
    if (!lots.has(key)) lots.set(key, { key, street: st.street, no: st.no, items: [] });
    lots.get(key)!.items.push(it);
  }
  const all = [...lots.values()];
  const main = all.filter((l) => l.street === '대학로').sort((a, b) => b.no - a.no);
  const alleys = new Map<string, Lot[]>();
  for (const l of all.filter((x) => x.street !== '대학로').sort((a, b) => a.no - b.no)) {
    if (!alleys.has(l.street)) alleys.set(l.street, []);
    alleys.get(l.street)!.push(l);
  }
  return { main, alleys };
}

function LotButton({ lot, selected, onSelect }: { lot: Lot; selected: boolean; onSelect: (key: string) => void }) {
  const names = lot.items.map((i) => i.name.replace(/\s*(충주)?(한국)?교통대(학교)?점$/, ''));
  return (
    <button type="button" className={`lot-btn ${selected ? 'sel' : ''}`} onClick={() => onSelect(lot.key)} aria-pressed={selected}>
      <span className="lot-no">
        {lot.street} {lot.no} · {lot.items.length}곳
      </span>
      <span className="lot-names">
        {names.slice(0, 3).join(', ')}
        {names.length > 3 ? ` 외 ${names.length - 3}` : ''}
      </span>
    </button>
  );
}

export function StreetMap({ items, selected, onSelect }: { items: GuideItem[]; selected: string | null; onSelect: (key: string) => void }) {
  const { main, alleys } = groupLots(items);
  return (
    <div>
      <div className="street">
        <div className="street-gate">
          <span className="chip brand">▲ 캠퍼스 (대학로 50) 방향</span>
        </div>
        {main.map((lot) => (
          <div key={lot.key} className={`lot ${lot.no % 2 ? 'odd' : 'even'}`}>
            <LotButton lot={lot} selected={selected === lot.key} onSelect={onSelect} />
          </div>
        ))}
        <div className="street-label">대학로</div>
      </div>
      {[...alleys.entries()].map(([street, lots]) => (
        <div key={street} className="alley">
          <h4>골목 · {street}</h4>
          {lots.map((lot) => (
            <LotButton key={lot.key} lot={lot} selected={selected === lot.key} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </div>
  );
}
