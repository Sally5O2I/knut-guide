/**
 * 매니저 화면: 재학생 제보를 보고 승인/반려한다.
 * 승인하면 그 항목이 공개 목록(published)에 반영되어 모든 학생에게 보인다.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { applyFields, diffFields, fieldsFromItem } from '../domain/submission';
import { sheetOf, type Submission, type SubmissionStatus } from '../domain/types';
import { useGuide } from '../state/GuideStore';

function Login() {
  const { repo, refresh } = useGuide();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await repo.signIn(email.trim(), password);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (repo.mode === 'local') {
    return (
      <div className="card" style={{ padding: 18 }}>
        <p style={{ marginTop: 0 }}>
          지금은 <b>로컬 모드</b>예요. 제보와 승인이 이 브라우저에만 저장되므로 비밀번호 없이 매니저 화면을 열 수 있어요.
          실제 배포에서는 Supabase를 연결해 매니저 계정으로만 들어오게 돼요. (README 참고)
        </p>
        <button type="button" className="btn primary" onClick={() => repo.signIn('', '').then(refresh)}>
          로컬 매니저 모드 켜기
        </button>
      </div>
    );
  }

  return (
    <form className="card form" style={{ padding: 18 }} onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="m-email">이메일</label>
        <input id="m-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="m-pw">비밀번호</label>
        <input id="m-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <div className="notice">{error}</div>}
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? '확인 중…' : '매니저 로그인'}
      </button>
    </form>
  );
}

function ReviewCard({ sub, onDone }: { sub: Submission; onDone: () => void }) {
  const { repo, byId } = useGuide();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = sub.targetId ? byId.get(sub.targetId) ?? null : null;
  const diff = base ? diffFields(fieldsFromItem(base), sub.payload) : [];
  const p = sub.payload;

  async function act(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const item = approve ? applyFields(p, base, sub.id) : null;
      await repo.review(sub.id, approve, item);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card review">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className={`chip ${sub.kind === 'new' ? 'ok' : 'brand'}`}>{sub.kind === 'new' ? '신규 등록' : '정보 수정'}</span>
        <span className="chip">{sheetOf(p.sheet).label}</span>
        <span className="muted">{new Date(sub.createdAt).toLocaleString('ko-KR')}</span>
      </div>
      <h3 style={{ margin: 0 }}>{sub.kind === 'edit' ? base?.name ?? '(삭제된 항목)' : p.name}</h3>
      {sub.message && <div className="notice info">💬 {sub.message}</div>}

      {sub.kind === 'edit' && sub.targetId && !base && <div className="notice">수정 대상 항목을 찾을 수 없어요. 반려해 주세요.</div>}

      {sub.kind === 'edit' && base && (
        <table className="diff">
          <tbody>
            {diff.length ? (
              diff.map((d) => (
                <tr key={d.label}>
                  <th>{d.label}</th>
                  <td>
                    <span className="from">{d.from}</span> → <span className="to">{d.to}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="muted">칸 변경 없음 (내용 추가만)</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {sub.kind === 'new' && (
        <table className="diff">
          <tbody>
            {([
              ['유형', p.kind],
              ['위치', p.location],
              ['지도', p.mapUrl],
              ['가격', p.price !== null ? `${p.price}원 ${p.priceBasis ?? ''}` : null],
              ['혼밥', p.solo],
            ] as const)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {p.noteText.trim() && (
        <div className="note" style={{ whiteSpace: 'pre-wrap' }}>
          <div className="who">{sub.kind === 'edit' ? '추가할 내용' : '내용'}</div>
          {p.noteText}
        </div>
      )}

      {error && <div className="notice">{error}</div>}
      {sub.status === 'pending' ? (
        <div className="sheet-actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn" disabled={busy} onClick={() => act(false)}>
            반려
          </button>
          <button type="button" className="btn primary" disabled={busy || (sub.kind === 'edit' && !base)} onClick={() => act(true)}>
            승인
          </button>
        </div>
      ) : (
        <span className="muted">
          {sub.status === 'approved' ? '승인됨' : '반려됨'} · {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString('ko-KR') : ''}
        </span>
      )}
    </article>
  );
}

export function ManagerPage() {
  const { repo, isManager, refresh } = useGuide();
  const [status, setStatus] = useState<SubmissionStatus>('pending');
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isManager) return;
    try {
      setSubs(await repo.listSubmissions(status));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [repo, isManager, status]);

  useEffect(() => {
    load();
    return repo.subscribe(() => {
      load();
    });
  }, [repo, load]);

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 className="page-title">🛡️ 매니저</h1>
      <p className="page-desc">재학생이 보낸 수정·신규 제보를 확인하고 승인하면 가이드에 바로 반영돼요.</p>

      {!isManager ? (
        <Login />
      ) : (
        <>
          <div className="filters" style={{ marginTop: 0 }}>
            <div className="seg" role="group" aria-label="상태">
              {([
                ['pending', '대기'],
                ['approved', '승인'],
                ['rejected', '반려'],
              ] as const).map(([k, label]) => (
                <button key={k} type="button" className={status === k ? 'on' : ''} aria-pressed={status === k} onClick={() => setStatus(k)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="btn small ghost" style={{ marginLeft: 'auto' }} onClick={() => repo.signOut().then(refresh)}>
              로그아웃
            </button>
          </div>
          {error && <div className="notice">{error}</div>}
          {subs === null ? (
            <p className="muted">불러오는 중…</p>
          ) : subs.length === 0 ? (
            <div className="empty">{status === 'pending' ? '처리할 제보가 없어요. 🎉' : '아직 없어요.'}</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {subs.map((s) => (
                <ReviewCard key={s.id} sub={s} onDone={() => { load(); refresh(); }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
