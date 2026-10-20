import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useGuide } from '../state/GuideStore';
import { Icon } from './Icon';
import { ItemModal } from './ItemModal';
import { Weather } from './Weather';

const LOGO = `${import.meta.env.BASE_URL}images/knut-logo.png`;

/** 어느 화면에서든 ?item=<id> 를 붙이면 상세 창이 열린다 (주소를 공유해도 같은 창이 열림) */
export function useOpenItem() {
  const [params, setParams] = useSearchParams();
  return (id: string) => {
    const next = new URLSearchParams(params);
    next.set('item', id);
    setParams(next);
  };
}

export function Layout() {
  const { repo, isManager } = useGuide();
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const itemId = params.get('item');

  // 페이지가 바뀌면 맨 위로
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  const closeItem = () => {
    const next = new URLSearchParams(params);
    next.delete('item');
    setParams(next);
  };

  const nav = [
    { to: '/list/food', label: '맛집' },
    { to: '/list/hidden', label: '숨은장소' },
    { to: '/list/tips', label: '생활꿀팁' },
    { to: '/list/free', label: '자유' },
    { to: '/map', label: '지도' },
    { to: '/bus', label: '버스' },
    { to: '/trail', label: '둘레길' },
    { to: '/submit', label: '정보 신규 등록' },
  ];

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" aria-label="교통대 꿀팁 가이드 홈">
            <img className="brand-logo" src={LOGO} alt="국립한국교통대학교" />
            <span className="brand-title">꿀팁 가이드</span>
          </Link>
          <div className="topbar-spacer" />
          <nav className="topnav" aria-label="주요 메뉴">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Weather />
        </div>
      </header>

      <main key={pathname} className="page-enter">
        <Outlet />
      </main>

      <footer className="foot">
        <div className="container">
          <p style={{ margin: '0 0 6px' }}>
            한국교통대학교 충주캠퍼스 재학생 21명이 추천한 내용을 모아 만든 가이드예요. 영업시간·가격·시간표는 바뀔 수 있으니 방문 전 한 번 더 확인해 주세요.
          </p>
          <p style={{ margin: 0, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://www.ut.ac.kr/cyber/" target="_blank" rel="noopener noreferrer">
              공식 캠퍼스 지도
            </a>
            <a href="https://www.ut.ac.kr" target="_blank" rel="noopener noreferrer">
              학교 홈페이지
            </a>
            <Link to="/manager">{isManager ? '매니저 화면' : '매니저 로그인'}</Link>
            {repo.mode === 'local' && <span>· 로컬 모드 (제보는 이 브라우저에만 저장)</span>}
          </p>
        </div>
      </footer>

      <nav className="tabbar" aria-label="아래 메뉴">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="home" />홈
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive || pathname.startsWith('/list') ? 'active' : '')}>
          <Icon name="search" />찾기
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive || pathname === '/trail' ? 'active' : '')}>
          <Icon name="map" />지도
        </NavLink>
        <NavLink to="/bus" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="bus" />버스
        </NavLink>
        <NavLink to="/submit" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="plus" />등록
        </NavLink>
      </nav>

      {itemId && <ItemModal id={itemId} onClose={closeItem} />}
    </>
  );
}
