/**
 * 제보 폼 — 두 가지 경우에 같이 쓴다.
 *  edit: 상세 창의 "정보추가" → 기존 항목의 바뀐 정보 (예: 부리또인 가격 변경)
 *  new : "정보 신규 등록" → 새 장소·새 정보 (예: 학교 카페 운영 중단 소식)
 * 제출해도 바로 반영되지 않고 매니저 승인 대기열로 간다.
 */
import { useState, type FormEvent } from 'react';
import { emptyFields, fieldsFromItem, LIMITS, validate } from '../domain/submission';
import { SHEETS, type EditableFields, type GuideItem, type SheetKey } from '../domain/types';
import { useGuide } from '../state/GuideStore';

interface Props {
  kind: 'edit' | 'new';
  base?: GuideItem;
  defaultSheet?: SheetKey;
  onCancel?: () => void;
  onDone?: () => void;
}

export function SubmissionForm({ kind, base, defaultSheet, onCancel, onDone }: Props) {
  const { repo } = useGuide();
  const [f, setF] = useState<EditableFields>(() => (base ? fieldsFromItem(base) : emptyFields(defaultSheet)));
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const set = <K extends keyof EditableFields>(k: K, v: EditableFields[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const showPrice = f.sheet === 'food' || f.sheet === 'hidden';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (honeypot) return; // 자동 등록 봇
    const errs = validate(f, message, kind);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFailure(null);
    try {
      await repo.submit({
        kind,
        targetId: base?.id ?? null,
        payload: { ...f, price: showPrice ? f.price : null, priceBasis: showPrice ? f.priceBasis : null, solo: showPrice ? f.solo : null },
        message: message.trim(),
      });
      setDone(true);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : '보내지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="success">
        <div className="big" aria-hidden="true">📮</div>
        <h3 style={{ margin: '8px 0 4px' }}>제보가 접수됐어요</h3>
        <p className="muted" style={{ fontSize: 15 }}>
          매니저가 확인하고 승인하면 가이드에 반영돼요. 고마워요!
          {repo.mode === 'local' && <><br />(로컬 모드: 이 브라우저의 매니저 화면에서 승인할 수 있어요)</>}
        </p>
        <button type="button" className="btn primary" onClick={onDone} style={{ marginTop: 12 }}>
          확인
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="notice info">
        <span aria-hidden="true">🔒</span>
        <span>이름·학번·연락처 같은 개인정보는 적지 마세요. 보낸 내용은 매니저 확인 후 공개돼요.</span>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="sf-sheet">분류</label>
          <select id="sf-sheet" value={f.sheet} onChange={(e) => set('sheet', e.target.value as SheetKey)}>
            {SHEETS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="label">유형</span>
          <div className="seg" role="group" aria-label="유형">
            {(['장소', '정보'] as const).map((k) => (
              <button key={k} type="button" className={f.kind === k ? 'on' : ''} aria-pressed={f.kind === k} onClick={() => set('kind', k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="sf-name">이름 {kind === 'new' && <span className="hint">예) 카페플로르 복지관점 운영 중단</span>}</label>
        <input id="sf-name" type="text" value={f.name} maxLength={LIMITS.name} onChange={(e) => set('name', e.target.value)} />
        {errors.name && <span className="err">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="sf-loc">위치 <span className="hint">주소나 건물·층 (예: 종합강의동 W5 1층)</span></label>
        <input id="sf-loc" type="text" value={f.location ?? ''} maxLength={LIMITS.location} onChange={(e) => set('location', e.target.value || null)} />
        {errors.location && <span className="err">{errors.location}</span>}
      </div>

      <div className="field">
        <label htmlFor="sf-map">지도 링크 <span className="hint">네이버 지도·카카오맵 공유 링크</span></label>
        <input id="sf-map" type="url" inputMode="url" placeholder="https://naver.me/…" value={f.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value.trim() || null)} />
        {errors.mapUrl && <span className="err">{errors.mapUrl}</span>}
      </div>

      {showPrice && (
        <>
          <div className="row2">
            <div className="field">
              <label htmlFor="sf-price">가격(원) <span className="hint">대표 메뉴 1인</span></label>
              <input
                id="sf-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={f.price ?? ''}
                onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))}
              />
              {errors.price && <span className="err">{errors.price}</span>}
            </div>
            <div className="field">
              <label htmlFor="sf-basis">가격 기준</label>
              <input id="sf-basis" type="text" placeholder="예) 부리또 단품" value={f.priceBasis ?? ''} maxLength={LIMITS.priceBasis} onChange={(e) => set('priceBasis', e.target.value || null)} />
              {errors.priceBasis && <span className="err">{errors.priceBasis}</span>}
            </div>
          </div>
          <div className="field">
            <span className="label">혼밥</span>
            <div className="seg" role="group" aria-label="혼밥">
              {([['O', '혼밥 가능'], ['X', '혼밥 어려움'], [null, '모름']] as const).map(([v, label]) => (
                <button key={label} type="button" className={f.solo === v ? 'on' : ''} aria-pressed={f.solo === v} onClick={() => set('solo', v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="sf-note">
          {kind === 'edit' ? '추가하거나 바로잡을 내용' : '내용'}{' '}
          <span className="hint">줄을 바꾸면 줄 단위로 보여요</span>
        </label>
        <textarea id="sf-note" value={f.noteText} maxLength={LIMITS.noteText} onChange={(e) => set('noteText', e.target.value)} />
        {errors.noteText && <span className="err">{errors.noteText}</span>}
      </div>

      {kind === 'edit' && (
        <label className="check">
          <input type="checkbox" checked={!!f.closed} onChange={(e) => set('closed', e.target.checked)} />
          문을 닫았거나 운영을 멈췄어요
        </label>
      )}

      <div className="field">
        <label htmlFor="sf-msg">매니저에게 남길 말 <span className="hint">무엇이 왜 바뀌었는지, 언제 확인했는지</span></label>
        <input id="sf-msg" type="text" value={message} maxLength={LIMITS.message} placeholder="예) 10/20에 가 보니 부리또 단품이 4,500원으로 올랐어요" onChange={(e) => setMessage(e.target.value)} />
        {errors.message && <span className="err">{errors.message}</span>}
      </div>

      {/* 봇 차단용 숨은 칸 — 사람은 보지 못한다 */}
      <div className="hp" aria-hidden="true">
        <label>
          홈페이지
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      {failure && <div className="notice">{failure}</div>}

      <div className="sheet-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? '보내는 중…' : kind === 'edit' ? '수정' : '제출'}
        </button>
      </div>
    </form>
  );
}
