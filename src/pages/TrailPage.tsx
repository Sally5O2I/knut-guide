import { useState } from 'react';
import { CampusMap } from '../components/CampusMap';
import { Reveal } from '../components/Reveal';
import { TRAILS } from '../data/campusMap';

const BASE = import.meta.env.BASE_URL;

export function TrailPage() {
  const [active, setActive] = useState<number | null>(null);
  const total = TRAILS.reduce((s, t) => s + t.lengthM, 0);
  const minutes = TRAILS.reduce((s, t) => s + t.minutes, 0);
  const toggle = (no: number) => setActive((a) => (a === no ? null : no));
  const sel = TRAILS.find((t) => t.no === active);

  return (
    <div className="container">
      <h1 className="page-title">🚶 교통대 둘레길</h1>
      <p className="page-desc">
        캠퍼스를 도는 8개 구간, 모두 합쳐 약 {(total / 1000).toFixed(2)}km · {minutes}분. 구간을 누르면 지도에서 강조돼요.
      </p>

      <div className="map-wrap narrow">
        <div className="map-hint">← 좌우로 밀어서 전체 코스를 볼 수 있어요 →</div>
        <div className="map-scroll">
          <CampusMap showTrails activeTrail={active} onTrail={toggle} label="교통대 둘레길 8개 구간 약도" />
        </div>
        <div className="map-legend">
          {sel ? (
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>
              {sel.no}. {sel.name} · {sel.lengthM}m · 약 {sel.minutes}분
            </span>
          ) : (
            <span>번호나 선을 눌러 구간을 골라 보세요.</span>
          )}
          <span>현장 안내판을 바탕으로 다시 그린 약도 · 실제 축척·위치와 다를 수 있어요.</span>
        </div>
      </div>

      <Reveal className="section">
        <div className="section-head">
          <h2>구간별 안내</h2>
          {active !== null && (
            <button type="button" className="btn small" onClick={() => setActive(null)}>
              전체 보기
            </button>
          )}
        </div>
        <div className="trail-cards">
          {TRAILS.map((t) => (
            <button
              key={t.no}
              type="button"
              className={`card trail-card ${active === t.no ? 'on' : ''}`}
              style={{ borderTopColor: t.color }}
              onClick={() => toggle(t.no)}
              aria-pressed={active === t.no}
            >
              <div className="tc-name">
                <span className="tc-no" style={{ background: t.color }}>
                  {t.no}
                </span>
                {t.name}
              </div>
              <div className="tc-meta">
                {t.lengthM}m · 소요시간 {t.minutes}분
              </div>
              <div className="tc-mean">{t.meaning}</div>
            </button>
          ))}
        </div>
      </Reveal>

      <details className="raw section">
        <summary>원본 둘레길 안내도 이미지 보기</summary>
        <img src={`${BASE}images/trail-map.webp`} alt="교통대 둘레길 안내도 원본" loading="lazy" />
      </details>
    </div>
  );
}
