import { kst, runsOn, toMinutes, type Timetable as TT } from '../data/bus';

/** 시간표 표. focusCol(타는 정류장) 기준으로 지난 차는 흐리게, 다음 차는 강조한다. */
export function Timetable({ tt, focusCol, now }: { tt: TT; focusCol: number; now: Date }) {
  const running = runsOn(now);
  const cur = kst(now).minutes;
  const nextIdx = running ? tt.rows.findIndex((r) => r[focusCol]?.t && toMinutes(r[focusCol].t!) >= cur) : -1;

  return (
    <div className="tt-wrap">
      <table className="tt">
        <thead>
          <tr>
            {tt.headers.map((h, i) => (
              <th key={i} scope="col" className={i === tt.splitAt ? 'split' : ''} style={i === focusCol ? { background: tt.color } : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tt.rows.map((row, ri) => {
            const t = row[focusCol]?.t;
            const past = running && (t ? toMinutes(t) < cur : nextIdx === -1 || ri < nextIdx);
            const cls = ri === nextIdx ? 'next' : past ? 'past' : '';
            return (
              <tr key={ri} className={cls}>
                {row.map((cell, ci) => (
                  <td key={ci} className={`${ci === tt.splitAt ? 'split' : ''} ${!cell.t && cell.note?.startsWith('→') ? 'dir' : ''}`}>
                    {cell.t ?? (cell.note?.startsWith('→') || cell.note === '터미널 하차' ? '' : '·')}
                    {cell.note && <span className="n">{cell.note}</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
