/**
 * 지도 화면: 캠퍼스 약도 → 대학로 거리 약도를 한 페이지에서 스크롤로 이어 본다.
 * ?b=<건물id> 또는 ?lot=<대학로 12> 로 들어오면 그 위치를 골라 둔 채로 연다.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CampusMap } from '../components/CampusMap';
import { Icon } from '../components/Icon';
import { useOpenItem } from '../components/Layout';
import { Reveal } from '../components/Reveal';
import { StreetMap, groupLots } from '../components/StreetMap';
import { BUILDINGS } from '../data/campusMap';
import { buildingOf, streetOf, zoneOf } from '../domain/places';
import { SHEETS, sheetOf, type GuideItem, type SheetKey } from '../domain/types';
import { useGuide } from '../state/GuideStore';

/** 폰에서 넓은 약도를 처음 열 때 가운데(대학본부·종합강의동 쪽)부터 보이게 */
const centerOnMount = (el: HTMLDivElement | null) => {
  if (el && el.scrollWidth > el.clientWidth && el.dataset.centered !== '1') {
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.dataset.centered = '1';
  }
};

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function PlaceRows({ items }: { items: GuideItem[] }) {
  const open = useOpenItem();
  if (!items.length) return <p className="muted">표시할 곳이 없어요.</p>;
  return (
    <div className="place-list">
      {items.map((i) => (
        <button key={i.id} type="button" className="place-row" onClick={() => open(i.id)}>
          <span className="chip">{sheetOf(i.sheet).label}</span>
          <span className="grow">
            <span style={{ display: 'block', textDecoration: i.closed ? 'line-through' : undefined }}>{i.name}</span>
            {i.location && <span className="pr-sub">{i.location}</span>}
          </span>
          {i.recommendCount > 1 && <span className="rec">👍 {i.recommendCount}</span>}
        </button>
      ))}
    </div>
  );
}

export function MapPage() {
  const { items } = useGuide();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<SheetKey | 'all'>('all');
  const [building, setBuilding] = useState<string | null>(params.get('b'));
  const [lot, setLot] = useState<string | null>(params.get('lot'));
  const [trails, setTrails] = useState(false);

  // 다른 화면에서 "가이드 지도에서 보기"로 들어왔을 때 해당 위치로 스크롤
  const pb = params.get('b');
  const pl = params.get('lot');
  useEffect(() => {
    if (pb) setBuilding(pb);
    if (pl) setLot(pl);
    const target = pl ? 'street' : pb ? 'campus' : null;
    if (!target) return;
    const t = setTimeout(() => scrollToId(target), 150);
    return () => clearTimeout(t);
  }, [pb, pl]);

  const visible = useMemo(() => items.filter((i) => i.kind === '장소' && (filter === 'all' || i.sheet === filter)), [items, filter]);

  const campus = useMemo(() => visible.filter((i) => zoneOf(i) === 'campus'), [visible]);
  const daehakro = useMemo(() => visible.filter((i) => zoneOf(i) === 'daehakro'), [visible]);
  const city = useMemo(() => visible.filter((i) => zoneOf(i) === 'city'), [visible]);

  const byBuilding = useMemo(() => {
    const m: Record<string, GuideItem[]> = {};
    for (const i of campus) {
      const b = buildingOf(i);
      if (b) (m[b.id] ??= []).push(i);
    }
    return m;
  }, [campus]);
  const counts = Object.fromEntries(Object.entries(byBuilding).map(([k, v]) => [k, v.length]));
  const campusUnpinned = campus.filter((i) => !buildingOf(i));

  const lots = useMemo(() => groupLots(daehakro), [daehakro]);
  const lotItems = useMemo(() => {
    if (!lot) return [];
    return daehakro.filter((i) => {
      const st = streetOf(i.location);
      return st && `${st.street} ${st.no}` === lot;
    });
  }, [daehakro, lot]);
  const streetUnpinned = daehakro.filter((i) => !streetOf(i.location));

  const selB = BUILDINGS.find((b) => b.id === building) ?? null;

  return (
    <div className="container">
      <h1 className="page-title">🗺️ 캠퍼스 · 대학로 지도</h1>
      <p className="page-desc">건물이나 번지를 누르면 그곳의 장소가 보여요. 아래로 내리면 대학로로 이어져요.</p>

      <div className="map-tools">
        <div className="tabs" role="group" aria-label="분류 거르기">
          <button type="button" className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            전체
          </button>
          {SHEETS.map((s) => (
            <button key={s.key} type="button" className={`tab ${filter === s.key ? 'active' : ''}`} onClick={() => setFilter(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="map-tools">
        {/* HashRouter라 #앵커 대신 직접 스크롤한다 */}
        <button type="button" className="btn small" onClick={() => scrollToId('campus')}>캠퍼스 ({campus.length})</button>
        <button type="button" className="btn small" onClick={() => scrollToId('street')}>대학로 ({daehakro.length})</button>
        <button type="button" className="btn small" onClick={() => scrollToId('city')}>충주 시내·근교 ({city.length})</button>
        <a className="btn small ghost" href="https://www.ut.ac.kr/cyber/" target="_blank" rel="noopener noreferrer">
          <Icon name="external" />
          공식 캠퍼스 지도
        </a>
      </div>

      {/* ───── 캠퍼스 ───── */}
      <section id="campus" className="section" style={{ scrollMarginTop: 76 }}>
        <div className="section-head">
          <h2>🏫 캠퍼스 안</h2>
          <label className="check" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={trails} onChange={(e) => setTrails(e.target.checked)} />
            둘레길 함께 보기
          </label>
        </div>
        <div className="map-split">
          <div className="map-wrap">
            <div className="map-hint">← 좌우로 밀어서 캠퍼스 전체를 볼 수 있어요 →</div>
            <div className="map-scroll" ref={centerOnMount}>
              <CampusMap counts={counts} selected={building} onSelect={(id) => setBuilding(id === building ? null : id)} showTrails={trails} />
            </div>
            <div className="map-legend">
              <span>● 숫자 = 그 건물에 있는 추천 장소 수</span>
              <span>둘레길 안내판을 바탕으로 다시 그린 약도라 실제 축척·위치와 다를 수 있어요.</span>
            </div>
          </div>
          <div className="map-side">
            <div className="card" style={{ padding: 16 }}>
              {selB ? (
                <>
                  <h3 style={{ margin: '0 0 10px' }}>
                    {selB.label} {selB.code && <span className="chip">{selB.code}</span>}
                  </h3>
                  <PlaceRows items={byBuilding[selB.id] ?? []} />
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 6px' }}>건물을 눌러 보세요</h3>
                  <p className="muted" style={{ margin: '0 0 12px' }}>
                    지도에 핀이 있는 건물 {Object.keys(byBuilding).length}곳 · 장소 {campus.length - campusUnpinned.length}곳
                  </p>
                  <div className="bld-chips">
                    {BUILDINGS.filter((b) => counts[b.id])
                      .sort((a, b) => counts[b.id] - counts[a.id])
                      .map((b) => (
                        <button key={b.id} type="button" className="bld-chip" onClick={() => setBuilding(b.id)}>
                          {b.label} <b>{counts[b.id]}</b>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {campusUnpinned.length > 0 && (
          <details className="raw" style={{ marginTop: 12 }}>
            <summary>약도에 없는 건물·위치가 애매한 캠퍼스 장소 {campusUnpinned.length}곳</summary>
            <PlaceRows items={campusUnpinned} />
          </details>
        )}
      </section>

      {/* ───── 대학로 ───── */}
      <Reveal>
        <section id="street" className="section" style={{ scrollMarginTop: 76 }}>
          <div className="section-head">
            <h2>🍜 학교 앞 대학로</h2>
          </div>
          <p className="muted" style={{ marginTop: -6 }}>
            도로명 번지 순서로 그린 약도예요. 홀수 번지는 왼쪽, 짝수 번지는 오른쪽에 두었어요. (실제 간격과 다를 수 있어요)
          </p>
          <div className="map-split">
            <div className="map-wrap">
              <StreetMap items={daehakro} selected={lot} onSelect={(k) => setLot(k === lot ? null : k)} />
            </div>
            <div className="map-side">
              <div className="card" style={{ padding: 16 }}>
                {lot ? (
                  <>
                    <h3 style={{ margin: '0 0 10px' }}>{lot}</h3>
                    <PlaceRows items={lotItems} />
                  </>
                ) : (
                  <>
                    <h3 style={{ margin: '0 0 6px' }}>번지를 눌러 보세요</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      대학로 {lots.main.length}개 번지 · 골목 {[...lots.alleys.values()].reduce((s, l) => s + l.length, 0)}개 번지
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          {streetUnpinned.length > 0 && (
            <details className="raw" style={{ marginTop: 12 }}>
              <summary>번지가 없는 대학로 일대 장소 {streetUnpinned.length}곳</summary>
              <PlaceRows items={streetUnpinned} />
            </details>
          )}
        </section>
      </Reveal>

      {/* ───── 시내·근교 ───── */}
      <Reveal>
        <section id="city" className="section" style={{ scrollMarginTop: 76 }}>
          <div className="section-head">
            <h2>🏙️ 충주 시내·근교</h2>
          </div>
          <p className="muted" style={{ marginTop: -6 }}>
            학교 밖이라 약도에는 없어요. 눌러서 지도 앱 링크로 찾아가세요.
          </p>
          <PlaceRows items={city} />
        </section>
      </Reveal>
    </div>
  );
}
