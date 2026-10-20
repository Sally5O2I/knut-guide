import { sheetOf, type GuideItem } from '../domain/types';
import { Icon } from './Icon';
import { useOpenItem } from './Layout';
import { LikeButton } from './LikeButton';

/** 카드에 보여 줄 한 줄 요약: 학생 글의 첫 줄 */
export function snippetOf(item: GuideItem): string | null {
  const first = item.notes[0]?.find((l) => !/[:：]$/.test(l));
  return first ?? null;
}

/**
 * 카드 전체를 누르면 상세가 열리고, ❤️ 버튼은 따로 눌린다.
 * (버튼 안에 버튼을 넣을 수 없어서 제목 버튼을 카드 전체로 늘리는 방식)
 */
export function ItemCard({ item, showSheet = false }: { item: GuideItem; showSheet?: boolean }) {
  const open = useOpenItem();
  const snippet = snippetOf(item);
  return (
    <article className={`item-card ${item.closed ? 'closed' : ''}`}>
      <div className="ic-top">
        <h3>
          <button type="button" className="ic-open" onClick={() => open(item.id)}>
            {item.name}
          </button>
        </h3>
        <LikeButton id={item.id} name={item.name} />
      </div>
      {item.location && (
        <div className="ic-loc">
          <Icon name="pin" />
          <span>{item.location}</span>
        </div>
      )}
      {snippet && <div className="ic-snippet">{snippet}</div>}
      <div className="ic-chips">
        {showSheet && <span className="chip">{sheetOf(item.sheet).label}</span>}
        {item.recommendCount > 1 && <span className="chip brand">👍 재학생 추천 {item.recommendCount}</span>}
        {item.closed && <span className="chip warn">운영 중단 제보</span>}
        {item.price !== null && <span className="chip">{item.price.toLocaleString()}원~</span>}
        {item.solo === 'O' && <span className="chip brand">혼밥 OK</span>}
        {item.community && <span className="chip ok">재학생 제보</span>}
        {item.kind === '정보' && !showSheet && <span className="chip">정보</span>}
      </div>
    </article>
  );
}
