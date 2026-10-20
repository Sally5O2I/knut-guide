/**
 * 캠퍼스 약도 (SVG). 지도 화면과 둘레길 화면이 같이 쓴다.
 * - counts: 건물별 항목 수 → 핀 숫자
 * - showTrails: 둘레길 8구간 표시
 */
import { BUILDINGS, GATES, GREEN_AREAS, ROADS, TRAILS } from '../data/campusMap';

interface Props {
  counts?: Record<string, number>;
  selected?: string | null;
  onSelect?: (buildingId: string) => void;
  showTrails?: boolean;
  activeTrail?: number | null;
  onTrail?: (no: number) => void;
  label?: string;
}

export function CampusMap({ counts = {}, selected, onSelect, showTrails = false, activeTrail = null, onTrail, label = '한국교통대학교 충주캠퍼스 약도' }: Props) {
  return (
    <svg className="map-svg" viewBox="0 0 1120 1200" role="img" aria-label={label}>
      <rect x="0" y="0" width="1120" height="1200" fill="var(--map-bg)" />
      {GREEN_AREAS.map((d, i) => (
        <path key={i} className="green" d={d} />
      ))}
      {ROADS.map((d, i) => (
        <path key={i} className="road" d={d} />
      ))}

      {showTrails &&
        TRAILS.map((t) => (
          <path
            key={t.no}
            className={`trail ${activeTrail === null ? '' : activeTrail === t.no ? 'hi' : 'dim'}`}
            d={t.d}
            stroke={t.color}
            onClick={() => onTrail?.(t.no)}
            style={{ cursor: onTrail ? 'pointer' : undefined }}
          />
        ))}

      {BUILDINGS.map((b) => {
        const n = counts[b.id] ?? 0;
        const cls = `bld ${n ? 'has' : ''} ${selected === b.id ? 'sel' : ''}`;
        const words = b.label.length > 6 ? [b.label.slice(0, Math.ceil(b.label.length / 2)), b.label.slice(Math.ceil(b.label.length / 2))] : [b.label];
        return (
          <g
            key={b.id}
            className={cls}
            onClick={() => onSelect?.(b.id)}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={`${b.label}${n ? `, 항목 ${n}개` : ''}`}
            onKeyDown={(e) => {
              if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(b.id);
              }
            }}
          >
            {b.shape === 'ellipse' ? (
              <ellipse cx={b.x} cy={b.y} rx={b.w / 2} ry={b.h / 2} />
            ) : (
              <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx={8} />
            )}
            {words.map((w, i) => (
              <text key={i} x={b.x} y={b.y + 6 + (i - (words.length - 1) / 2) * 19} textAnchor="middle">
                {w}
              </text>
            ))}
            {b.code && (
              <text className="code" x={b.x} y={b.y + b.h / 2 + 16} textAnchor="middle">
                {b.code}
              </text>
            )}
            {n > 0 && (
              <g className="pin" transform={`translate(${b.x + b.w / 2 - 4}, ${b.y - b.h / 2 + 2})`}>
                <circle r={15} />
                <text textAnchor="middle" y={5}>
                  {n}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {showTrails &&
        TRAILS.map((t) => (
          <g key={t.no} className="tbadge" transform={`translate(${t.badge.x}, ${t.badge.y})`} onClick={() => onTrail?.(t.no)} style={{ cursor: onTrail ? 'pointer' : undefined }}>
            <circle r={17} stroke={t.color} />
            <text textAnchor="middle" y={6} fill={t.color}>
              {t.no}
            </text>
          </g>
        ))}

      {GATES.map((g) => (
        <g key={g.id} className="gate" transform={`translate(${g.x}, ${g.y})`}>
          <rect x={-34} y={-17} width={68} height={34} rx={17} />
          <text textAnchor="middle" y={6}>
            {g.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
