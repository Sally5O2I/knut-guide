/**
 * 앱 전체 상태: 가이드 항목(기본 데이터 + 승인된 제보), 검색 인덱스, 매니저 여부.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import baseItems from '../data/guide.json';
import { deviceId, readMine, toggleLocal, writeMine, type LikeCounts } from '../domain/likes';
import { buildIndex } from '../domain/search';
import type { GuideItem } from '../domain/types';
import { createRepository, type Repository } from '../repository';

const BASE = baseItems as GuideItem[];

/** 승인된 항목이 같은 id의 기본 항목을 덮어쓰고, 새 id면 추가된다 */
export function mergeItems(base: GuideItem[], published: GuideItem[]): GuideItem[] {
  const byId = new Map(published.map((p) => [p.id, p]));
  const merged = base.map((b) => byId.get(b.id) ?? b);
  const baseIds = new Set(base.map((b) => b.id));
  return merged.concat(published.filter((p) => !baseIds.has(p.id)));
}

interface GuideState {
  repo: Repository;
  items: GuideItem[];
  byId: Map<string, GuideItem>;
  index: ReturnType<typeof buildIndex>;
  isManager: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
  /** 항목 id → 좋아요 수 */
  likes: LikeCounts;
  /** 이 기기에서 좋아요를 누른 항목 */
  myLikes: Set<string>;
  toggleLike: (id: string) => Promise<void>;
  likeError: string | null;
}

const Ctx = createContext<GuideState | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => createRepository(), []);
  const [published, setPublished] = useState<GuideItem[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [pub, mgr] = await Promise.all([repo.listPublished(), repo.isManager()]);
      setPublished(pub);
      setIsManager(mgr);
      setLoadError(null);
    } catch (e) {
      // 서버에 못 붙어도 기본 가이드는 그대로 보여 준다.
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [repo]);

  useEffect(() => {
    refresh();
    return repo.subscribe(() => {
      refresh();
    });
  }, [repo, refresh]);

  // ───── 좋아요 ─────
  const [likes, setLikes] = useState<LikeCounts>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(() => readMine());
  const [likeError, setLikeError] = useState<string | null>(null);
  const likeState = useRef({ likes, myLikes });
  likeState.current = { likes, myLikes };
  const pending = useRef(new Set<string>());

  const loadLikes = useCallback(async () => {
    try {
      setLikes(await repo.listLikeCounts());
    } catch {
      /* 좋아요 수를 못 받아도 가이드는 그대로 보인다 */
    }
  }, [repo]);

  useEffect(() => {
    loadLikes();
    // 다른 학생이 누른 것도 반영되도록 1분마다, 그리고 화면으로 돌아올 때 새로 받는다
    const t = setInterval(loadLikes, 60_000);
    const onVisible = () => document.visibilityState === 'visible' && loadLikes();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadLikes]);

  const toggleLike = useCallback(
    async (id: string) => {
      if (pending.current.has(id)) return; // 연타 방지
      pending.current.add(id);
      // 화면에 먼저 반영하고, 서버가 거절하면 되돌린다.
      // ref를 바로 고쳐 두어야 여러 항목을 연달아 눌러도 앞의 것이 덮어써지지 않는다.
      const apply = () => {
        const cur = likeState.current;
        const next = toggleLocal(cur.likes, cur.myLikes, id);
        likeState.current = { likes: next.counts, myLikes: next.mine };
        setLikes(next.counts);
        setMyLikes(next.mine);
        writeMine(next.mine);
        return next.liked;
      };
      const liked = apply();
      setLikeError(null);
      try {
        await repo.setLike(id, deviceId(), liked);
      } catch (e) {
        apply();
        setLikeError(e instanceof Error ? e.message : String(e));
      } finally {
        pending.current.delete(id);
      }
    },
    [repo],
  );

  const value = useMemo<GuideState>(() => {
    const items = mergeItems(BASE, published);
    return {
      repo,
      items,
      byId: new Map(items.map((i) => [i.id, i])),
      index: buildIndex(items),
      isManager,
      loadError,
      refresh,
      likes,
      myLikes,
      toggleLike,
      likeError,
    };
  }, [repo, published, isManager, loadError, refresh, likes, myLikes, toggleLike, likeError]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuide(): GuideState {
  const v = useContext(Ctx);
  if (!v) throw new Error('GuideProvider 밖에서 useGuide를 썼어요.');
  return v;
}
