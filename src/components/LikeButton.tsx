import { useGuide } from '../state/GuideStore';

/** ❤️ 좋아요 (로그인 없이 기기당 1번, 다시 누르면 취소) */
export function LikeButton({ id, name, size = 'small' }: { id: string; name: string; size?: 'small' | 'large' }) {
  const { likes, myLikes, toggleLike } = useGuide();
  const on = myLikes.has(id);
  const n = likes[id] ?? 0;
  return (
    <button
      type="button"
      className={`like-btn ${size} ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={`${name} 좋아요${on ? ' 취소' : ''}, 지금 ${n}개`}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(id);
      }}
    >
      <span className="heart" aria-hidden="true">{on ? '❤️' : '🤍'}</span>
      <span className="like-n">{size === 'large' ? `좋아요 ${n}` : n}</span>
    </button>
  );
}
