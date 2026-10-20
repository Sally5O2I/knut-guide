import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ItemCard } from '../components/ItemCard';
import { SearchBar } from '../components/SearchBar';
import { search } from '../domain/search';
import { SHEETS } from '../domain/types';
import { useGuide } from '../state/GuideStore';

const SUGGEST = ['부리또', '999', '프린트', '장학금', '도서관', '혼밥', '셔틀', '와이파이', '헬스장', '수강신청'];

export function SearchPage() {
  const { index, items } = useGuide();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const results = useMemo(() => search(index, q), [index, q]);

  const setQ = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set('q', v);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <div className="container">
      <h1 className="page-title">찾기</h1>
      <p className="page-desc">{items.length}개 정보에서 이름·위치·내용을 함께 찾아요. 초성(ㅂㄹㄸ)도 돼요.</p>
      <SearchBar value={q} onChange={setQ} autoFocus />

      {!q && (
        <>
          <div className="section">
            <div className="section-head">
              <h2>이런 걸 많이 찾아요</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGEST.map((s) => (
                <button key={s} type="button" className="tab" onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="section">
            <div className="section-head">
              <h2>분류별로 보기</h2>
            </div>
            <div className="item-grid">
              {SHEETS.map((s) => (
                <Link key={s.key} to={`/list/${s.key}`} className="item-card" style={{ textDecoration: 'none' }}>
                  <div className="ic-top">
                    <h3>
                      {s.emoji} {s.label}
                    </h3>
                    <span className="muted">{items.filter((i) => i.sheet === s.key).length}개</span>
                  </div>
                  <div className="ic-snippet">{s.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {q && (
        <div className="section">
          <p className="muted" aria-live="polite">
            "{q}" 검색 결과 {results.length}개
          </p>
          {results.length ? (
            <div className="item-grid">
              {results.slice(0, 120).map((i) => (
                <ItemCard key={i.id} item={i} showSheet />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>찾는 정보가 아직 없어요.</p>
              <Link to="/submit" className="btn primary">
                알고 있다면 등록해 주세요
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
