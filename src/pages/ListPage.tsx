import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ItemCard } from '../components/ItemCard';
import { SearchBar } from '../components/SearchBar';
import { zoneOf } from '../domain/places';
import { search, buildIndex } from '../domain/search';
import { SHEETS, ZONE_LABEL, sheetOf, type GuideItem, type SheetKey, type Zone } from '../domain/types';
import { useGuide } from '../state/GuideStore';

type Sort = 'rec' | 'likes' | 'name' | 'recent' | 'price';

const SORTS: Record<Exclude<Sort, 'likes'>, (a: GuideItem, b: GuideItem) => number> = {
  rec: (a, b) => b.recommendCount - a.recommendCount || a.name.localeCompare(b.name, 'ko'),
  name: (a, b) => a.name.localeCompare(b.name, 'ko'),
  recent: (a, b) => (b.verifiedAt ?? '').localeCompare(a.verifiedAt ?? ''),
  price: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
};

export function ListPage() {
  const { sheet } = useParams();
  const { items, likes } = useGuide();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('rec');
  const [zone, setZone] = useState<Zone | 'all'>('all');
  const [kind, setKind] = useState<'all' | '장소' | '정보'>('all');
  const [soloOnly, setSoloOnly] = useState(false);
  const [priceOnly, setPriceOnly] = useState(false);

  const valid = SHEETS.some((s) => s.key === sheet);
  const key = (valid ? sheet : 'food') as SheetKey;
  const info = sheetOf(key);
  const inSheet = useMemo(() => items.filter((i) => i.sheet === key), [items, key]);
  const index = useMemo(() => buildIndex(inSheet), [inSheet]);
  const isPlaceSheet = key === 'food' || key === 'hidden';

  const shown = useMemo(() => {
    const byLikes = (a: GuideItem, b: GuideItem) => (likes[b.id] ?? 0) - (likes[a.id] ?? 0) || SORTS.rec(a, b);
    let list = q.trim() ? search(index, q) : [...inSheet].sort(sort === 'likes' ? byLikes : SORTS[sort]);
    if (zone !== 'all') list = list.filter((i) => zoneOf(i) === zone);
    if (kind !== 'all') list = list.filter((i) => i.kind === kind);
    if (soloOnly) list = list.filter((i) => i.solo === 'O');
    if (priceOnly) list = list.filter((i) => i.price !== null);
    return list;
  }, [q, index, inSheet, sort, zone, kind, soloOnly, priceOnly, likes]);

  if (!valid) return <Navigate to="/list/food" replace />;

  return (
    <div className="container">
      <h1 className="page-title">
        {info.emoji} {info.label}
      </h1>
      <p className="page-desc">{info.desc}</p>

      <nav className="tabs" aria-label="분류">
        {SHEETS.map((s) => (
          <Link key={s.key} to={`/list/${s.key}`} className={`tab ${s.key === key ? 'active' : ''}`}>
            {s.label} <span style={{ opacity: 0.7, fontWeight: 600 }}>{items.filter((i) => i.sheet === s.key).length}</span>
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: 14 }}>
        <SearchBar value={q} onChange={setQ} placeholder={`${info.label}에서 찾기`} />
      </div>

      <div className="filters">
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="정렬" disabled={!!q.trim()}>
          <option value="rec">재학생 추천 순</option>
          <option value="likes">좋아요 많은 순</option>
          <option value="name">가나다 순</option>
          <option value="recent">최근 확인 순</option>
          {isPlaceSheet && <option value="price">가격 낮은 순</option>}
        </select>
        <select className="select" value={zone} onChange={(e) => setZone(e.target.value as Zone | 'all')} aria-label="위치">
          <option value="all">모든 위치</option>
          {(Object.keys(ZONE_LABEL) as Zone[]).map((z) => (
            <option key={z} value={z}>
              {ZONE_LABEL[z]}
            </option>
          ))}
        </select>
        {!isPlaceSheet && (
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="유형">
            <option value="all">장소+정보</option>
            <option value="장소">장소만</option>
            <option value="정보">정보만</option>
          </select>
        )}
        {key === 'food' && (
          <>
            <label className="check">
              <input type="checkbox" checked={soloOnly} onChange={(e) => setSoloOnly(e.target.checked)} />
              혼밥 OK
            </label>
            <label className="check">
              <input type="checkbox" checked={priceOnly} onChange={(e) => setPriceOnly(e.target.checked)} />
              가격 정보 있음
            </label>
          </>
        )}
        <span className="muted" style={{ marginLeft: 'auto' }}>
          {shown.length}개
        </span>
      </div>

      {shown.length ? (
        <div className="item-grid">
          {shown.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <div className="empty">조건에 맞는 항목이 없어요.</div>
      )}
    </div>
  );
}
