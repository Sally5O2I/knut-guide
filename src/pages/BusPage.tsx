import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Timetable } from '../components/Timetable';
import { BUS_700, BUS_999, BUS_CONTACTS, nextDepartures, runsOn, type Timetable as TT } from '../data/bus';
import { useNow } from '../hooks';

const BASE = import.meta.env.BASE_URL;

function NextCard({ tt, col, label }: { tt: TT; col: number; label: string }) {
  const now = useNow();
  const next = nextDepartures(tt, col, now, 2);
  return (
    <div className="card next-card">
      <div className="lbl">
        <span className="route-badge" style={{ background: tt.color, height: 22, minWidth: 38, fontSize: 13, display: 'inline-grid', marginRight: 6, verticalAlign: 'middle' }}>
          {tt.route}
        </span>
        {label}
      </div>
      {!runsOn(now) ? (
        <div className="t" style={{ fontSize: 18 }}>주말 미운행</div>
      ) : next.length ? (
        <>
          <div className="t">{next[0].time}</div>
          <div className="left">
            {next[0].minutesLeft === 0 ? '곧 출발' : `${next[0].minutesLeft}분 뒤`}
            {next[1] && <span className="muted"> · 다음 {next[1].time}</span>}
          </div>
        </>
      ) : (
        <div className="t" style={{ fontSize: 18 }}>오늘 운행 끝</div>
      )}
    </div>
  );
}

function Stops({ stops }: { stops: string[] }) {
  return (
    <div className="stops">
      {stops.map((s, i) => (
        <span key={i}>
          {i > 0 && <span className="arrow"> → </span>}
          {s}
        </span>
      ))}
    </div>
  );
}

function RouteSection({ tt, options }: { tt: TT; options: { col: number; label: string }[] }) {
  const now = useNow();
  const [col, setCol] = useState(options[0].col);
  return (
    <section className="section">
      <div className="section-head">
        <h2>
          <span className="route-badge" style={{ background: tt.color, display: 'inline-grid', marginRight: 8, verticalAlign: 'middle' }}>
            {tt.route}
          </span>
          {tt.title}
        </h2>
      </div>
      <div className="card" style={{ padding: 14, marginBottom: 10 }}>
        <Stops stops={tt.stopsDiagram} />
      </div>
      <div className="filters" style={{ marginTop: 0 }}>
        <span className="muted">어디서 타요?</span>
        <div className="seg" role="group" aria-label="타는 곳">
          {options.map((o) => (
            <button key={o.col} type="button" className={o.col === col ? 'on' : ''} aria-pressed={o.col === col} onClick={() => setCol(o.col)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <Timetable tt={tt} focusCol={col} now={now} />
      <ul className="muted" style={{ paddingLeft: 18, margin: '10px 0' }}>
        {tt.notice.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <details className="raw">
        <summary>원본 시간표 이미지 보기</summary>
        <img src={`${BASE}${tt.image}`} alt={`${tt.route}번 버스 원본 시간표`} loading="lazy" />
      </details>
    </section>
  );
}

export function BusPage() {
  const now = useNow();
  return (
    <div className="container">
      <h1 className="page-title">🚌 버스 시간표</h1>
      <p className="page-desc">캠퍼스 안까지 들어오는 999번과 시내를 도는 대학순환 700번. 지금 시각 기준으로 다음 차를 보여 줘요.</p>

      {!runsOn(now) && (
        <div className="notice" style={{ marginBottom: 12 }}>
          <span aria-hidden="true">⚠️</span>
          <span>
            오늘은 주말이라 999번·700번이 다니지 않아요. 신니방면 시내버스(151·152·154·157·159 등)나 111·112번을 이용하세요.{' '}
            <Link to="/search?q=주말">주말 이동 꿀팁</Link>
          </span>
        </div>
      )}

      <div className="next-cards">
        <NextCard tt={BUS_999} col={3} label="교통대 출발" />
        <NextCard tt={BUS_999} col={0} label="터미널 출발" />
        <NextCard tt={BUS_700} col={0} label="교통대 출발" />
        <NextCard tt={BUS_700} col={4} label="터미널 출발" />
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        공휴일·방학에도 운행하지 않아요. 실제 도착은 몇 분씩 다를 수 있으니 실시간 정보도 함께 확인하세요.
      </p>

      <RouteSection
        tt={BUS_999}
        options={[
          { col: 3, label: '교통대' },
          { col: 0, label: '터미널' },
          { col: 1, label: '충주역(학교행)' },
          { col: 4, label: '충주역(터미널행)' },
        ]}
      />

      <Reveal>
        <RouteSection
          tt={BUS_700}
          options={[
            { col: 0, label: '교통대' },
            { col: 3, label: '메가박스' },
            { col: 4, label: '터미널' },
          ]}
        />
      </Reveal>

      <Reveal>
        <section className="section">
          <div className="section-head">
            <h2>📞 실시간 정보·문의</h2>
          </div>
          <div className="place-list">
            {BUS_CONTACTS.map((c) => (
              <a key={c.href} className="place-row" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <span className="grow">{c.label}</span>
              </a>
            ))}
            <Link to="/search?q=버스" className="place-row" style={{ textDecoration: 'none' }}>
              <span className="grow">재학생 버스 꿀팁 모아 보기 (셔틀·시외버스·주말 이동)</span>
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
