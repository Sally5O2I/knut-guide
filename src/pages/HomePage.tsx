import { Link } from 'react-router-dom';
import { BUS_700, BUS_999, nextDepartures, runsOn } from '../data/bus';
import { ItemCard } from '../components/ItemCard';
import { Reveal } from '../components/Reveal';
import { SearchBar } from '../components/SearchBar';
import { SHEETS, type GuideItem, type SheetKey } from '../domain/types';
import { useNow } from '../hooks';
import { useGuide } from '../state/GuideStore';

const byPopularity = (a: GuideItem, b: GuideItem) =>
  b.recommendCount - a.recommendCount || b.notes.flat().length - a.notes.flat().length || a.name.localeCompare(b.name, 'ko');

function top(items: GuideItem[], sheet: SheetKey, n: number) {
  return items.filter((i) => i.sheet === sheet && !i.closed).sort(byPopularity).slice(0, n);
}

function NextBusMini({ route, color, label, col }: { route: string; color: string; label: string; col: number }) {
  const now = useNow();
  const tt = route === '999' ? BUS_999 : BUS_700;
  const next = nextDepartures(tt, col, now, 2);
  return (
    <Link to="/bus" className="card bus-mini">
      <span className="route-badge" style={{ background: color }}>
        {route}
      </span>
      <span className="next">
        <span className="muted" style={{ display: 'block' }}>{label}</span>
        {!runsOn(now) ? (
          '주말에는 운행하지 않아요'
        ) : next.length ? (
          <>
            다음 <b>{next[0].time}</b> ({next[0].minutesLeft === 0 ? '곧 출발' : `${next[0].minutesLeft}분 뒤`})
            {next[1] && <span className="muted"> · 그다음 {next[1].time}</span>}
          </>
        ) : (
          '오늘 운행이 끝났어요'
        )}
      </span>
    </Link>
  );
}

export function HomePage() {
  const { items, likes } = useGuide();
  const popular = items
    .filter((i) => (likes[i.id] ?? 0) > 0 && !i.closed)
    .sort((a, b) => (likes[b.id] ?? 0) - (likes[a.id] ?? 0))
    .slice(0, 6);
  const count = (k: SheetKey) => items.filter((i) => i.sheet === k).length;
  const places = items.filter((i) => i.kind === '장소').length;
  const recs = items.reduce((s, i) => s + i.recommendCount, 0);
  const recent = items.filter((i) => i.updatedAt).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 3);

  const quick = [
    ...SHEETS.map((s) => ({ to: `/list/${s.key}`, emoji: s.emoji, label: s.label, sub: `${count(s.key)}개` })),
    { to: '/map', emoji: '🗺️', label: '지도', sub: '캠퍼스·대학로' },
    { to: '/bus', emoji: '🚌', label: '버스', sub: '999 · 700' },
    { to: '/trail', emoji: '🚶', label: '둘레길', sub: '8개 구간' },
    { to: '/submit', emoji: '✍️', label: '정보 등록', sub: '제보하기' },
  ];

  return (
    <>
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">국립한국교통대학교 충주캠퍼스</div>
          <h1>
            선배들이 직접 모은
            <br />
            학교생활 꿀팁 가이드
          </h1>
          <p>맛집부터 숨은 공부 자리, 버스 시간, 장학금 챙기는 법까지.</p>
          <div className="hero-stats">
            <span>
              <b>{items.length}</b>개 정보
            </span>
            <span>
              <b>{places}</b>곳 장소
            </span>
            <span>
              재학생 추천 <b>{recs}</b>회
            </span>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="hero-search">
          <SearchBar />
        </div>

        <Reveal className="section">
          <div className="quick-grid">
            {quick.map((q) => (
              <Link key={q.to} to={q.to} className="quick">
                <span className="q-emoji" aria-hidden="true">{q.emoji}</span>
                {q.label}
                <span className="q-count">{q.sub}</span>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal className="section">
          <div className="section-head">
            <h2>🚌 지금 학교에서 타는 버스</h2>
            <Link to="/bus">전체 시간표</Link>
          </div>
          <div className="bus-strip">
            <NextBusMini route="999" color={BUS_999.color} label="교통대 출발 → 충주역·터미널" col={3} />
            <NextBusMini route="700" color={BUS_700.color} label="교통대 출발 → 호암지구·메가박스" col={0} />
          </div>
        </Reveal>

        {popular.length > 0 && (
          <Reveal className="section">
            <div className="section-head">
              <h2>❤️ 요즘 인기</h2>
              <span className="muted">학생들이 누른 좋아요 순</span>
            </div>
            <div className="item-grid">
              {popular.map((i) => (
                <ItemCard key={i.id} item={i} showSheet />
              ))}
            </div>
          </Reveal>
        )}

        {recent.length > 0 && (
          <Reveal className="section">
            <div className="section-head">
              <h2>🆕 최근 업데이트</h2>
            </div>
            <div className="item-grid">
              {recent.map((i) => (
                <ItemCard key={i.id} item={i} showSheet />
              ))}
            </div>
          </Reveal>
        )}

        <Reveal className="section">
          <div className="section-head">
            <h2>🍚 추천 많은 맛집</h2>
            <Link to="/list/food">전체 보기</Link>
          </div>
          <div className="item-grid">
            {top(items, 'food', 6).map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </Reveal>

        <Reveal className="section">
          <div className="section-head">
            <h2>💡 꼭 알아 둘 생활꿀팁</h2>
            <Link to="/list/tips">전체 보기</Link>
          </div>
          <div className="item-grid">
            {top(items, 'tips', 6).map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </Reveal>

        <Reveal className="section">
          <div className="section-head">
            <h2>🌿 공강 때 가 볼 숨은장소</h2>
            <Link to="/list/hidden">전체 보기</Link>
          </div>
          <div className="item-grid">
            {top(items, 'hidden', 6).map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </Reveal>

        <Reveal className="section">
          <div className="section-head">
            <h2>🗂️ 장학금·자취·학사</h2>
            <Link to="/list/free">전체 보기</Link>
          </div>
          <div className="item-grid">
            {top(items, 'free', 6).map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </Reveal>

        <Reveal className="section">
          <div className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>알고 있는 꿀팁이 있나요?</h2>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                가격이 바뀌었거나 새로 생긴 곳, 문을 닫은 곳을 알려 주세요. 매니저 확인 후 모두에게 반영돼요.
              </p>
            </div>
            <Link to="/submit" className="btn primary">
              정보 신규 등록
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
