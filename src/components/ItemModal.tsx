/**
 * 장소·정보 상세 창. 오른쪽 위 "정보추가" 버튼을 누르면 같은 창 안에서 수정 제보 폼으로 바뀐다.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildingOf, streetOf, zoneOf } from '../domain/places';
import { sheetOf, ZONE_LABEL, type GuideItem } from '../domain/types';
import { useGuide } from '../state/GuideStore';
import { Icon } from './Icon';
import { LikeButton } from './LikeButton';
import { SubmissionForm } from './SubmissionForm';

const URL_RE = /(https?:\/\/[^\s,)]+)/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer">
            {p.replace(/^https?:\/\/(www\.)?/, '').slice(0, 42)}
            {p.length > 50 ? '…' : ''}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function NoteBlock({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) =>
        /[:：]$/.test(l) && l.length <= 16 ? (
          <p key={i} className="sub">{l.replace(/[:：]$/, '')}</p>
        ) : (
          <p key={i} className={l.startsWith('- ') ? 'li' : ''}>
            <Linkified text={l.startsWith('- ') ? `• ${l.slice(2)}` : l} />
          </p>
        ),
      )}
    </>
  );
}

export function mapLinkFor(item: GuideItem): string | null {
  const b = buildingOf(item);
  if (zoneOf(item) === 'campus' && b) return `/map?b=${b.id}`;
  const st = streetOf(item.location);
  if (st) return `/map?lot=${encodeURIComponent(st.street + ' ' + st.no)}`;
  return null;
}

export function ItemModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { byId, likeError } = useGuide();
  const item = byId.get(id);
  const [editing, setEditing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 열려 있는 동안 뒤 페이지 스크롤을 막고, Esc로 닫는다
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => setEditing(false), [id]);

  const building = item ? buildingOf(item) : null;
  const zone = item ? zoneOf(item) : null;
  const internalMap = item ? mapLinkFor(item) : null;

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item?.name ?? '항목'} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="grab" aria-hidden="true" />
          {editing ? (
            <button type="button" className="icon-btn" onClick={() => setEditing(false)} aria-label="상세로 돌아가기">
              <Icon name="back" />
            </button>
          ) : null}
          <span className="crumb">
            {item ? `${sheetOf(item.sheet).label} · ${item.kind}` : ''}
            {editing ? ' · 정보추가' : ''}
          </span>
          {item && !editing && (
            <button type="button" className="btn small" onClick={() => setEditing(true)}>
              <Icon name="edit" />
              정보추가
            </button>
          )}
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>

        <div className="sheet-body">
          {!item && <p className="empty">항목을 찾을 수 없어요. 삭제되었거나 주소가 잘못됐어요.</p>}

          {item && editing && (
            <>
              <h2 style={{ fontSize: 18 }}>{item.name} 정보 업데이트</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                지금 값이 채워져 있어요. 바뀐 칸만 고치고, 새로 알게 된 내용을 적어 주세요.
              </p>
              <SubmissionForm kind="edit" base={item} onCancel={() => setEditing(false)} onDone={() => setEditing(false)} />
            </>
          )}

          {item && !editing && (
            <>
              <h2>{item.name}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.recommendCount > 0 && (
                  <span className="chip brand">
                    👍 재학생 {item.recommendCount}명 추천
                  </span>
                )}
                {zone && <span className="chip">{ZONE_LABEL[zone]}</span>}
                {item.solo === 'O' && <span className="chip brand">혼밥 OK</span>}
                {item.closed && <span className="chip warn">운영 중단 제보</span>}
                {item.community && <span className="chip ok">재학생 제보로 등록</span>}
              </div>

              <dl className="facts">
                {item.location && (
                  <div className="fact">
                    <dt>위치</dt>
                    <dd>{item.location}</dd>
                  </div>
                )}
                {building && zone === 'campus' && (
                  <div className="fact">
                    <dt>캠퍼스</dt>
                    <dd>
                      {building.label}
                      {building.code ? ` (${building.code})` : ''}
                    </dd>
                  </div>
                )}
                {item.price !== null && (
                  <div className="fact">
                    <dt>가격</dt>
                    <dd>
                      {item.price.toLocaleString()}원{item.priceBasis ? ` · ${item.priceBasis}` : ''}
                    </dd>
                  </div>
                )}
                <div className="fact">
                  <dt>확인한 날</dt>
                  <dd>{item.verifiedAt ?? '기록 없음'}{item.updatedAt ? ' (재학생 제보로 업데이트)' : ''}</dd>
                </div>
              </dl>

              {item.notes.length > 0 ? (
                <div className="notes">
                  {item.notes.map((lines, i) => (
                    <div className="note" key={i}>
                      {item.notes.length > 1 && <div className="who">재학생 {i + 1}</div>}
                      <NoteBlock lines={lines} />
                    </div>
                  ))}
                </div>
              ) : (
                item.kind === '정보' && <p className="muted">아직 자세한 설명이 없어요. 알고 있다면 "정보추가"로 알려 주세요.</p>
              )}

              <div className="sheet-actions">
                <LikeButton id={item.id} name={item.name} size="large" />
                {item.mapUrl && (
                  <a className="btn primary" href={item.mapUrl} target="_blank" rel="noopener noreferrer">
                    <Icon name="external" />
                    지도 앱에서 보기
                  </a>
                )}
                {internalMap && (
                  <Link className="btn" to={internalMap} onClick={onClose}>
                    <Icon name="map" />
                    가이드 지도에서 보기
                  </Link>
                )}
              </div>
              {likeError && <div className="notice" style={{ marginTop: 10 }}>{likeError}</div>}
              <p className="muted" style={{ marginTop: 14 }}>
                좋아요는 로그인 없이 기기당 한 번 누를 수 있고, 다시 누르면 취소돼요. 정보가 달라졌나요? 오른쪽 위 <b>정보추가</b>로 알려 주면 매니저 확인 후 반영돼요.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
