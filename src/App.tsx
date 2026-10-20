import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BusPage } from './pages/BusPage';
import { HomePage } from './pages/HomePage';
import { ListPage } from './pages/ListPage';
import { ManagerPage } from './pages/ManagerPage';
import { MapPage } from './pages/MapPage';
import { SearchPage } from './pages/SearchPage';
import { SubmitPage } from './pages/SubmitPage';
import { TrailPage } from './pages/TrailPage';
import { GuideProvider } from './state/GuideStore';

/** 분류를 바꾸면 필터·검색어를 새로 시작한다 */
function ListRoute() {
  const { sheet } = useParams();
  return <ListPage key={sheet} />;
}

// GitHub Pages는 서버 라우팅이 없어서 주소 # 뒤로 화면을 나눈다 (새로고침·공유해도 404가 안 남)
export function App() {
  return (
    <GuideProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="list/:sheet" element={<ListRoute />} />
            <Route path="map" element={<MapPage />} />
            <Route path="bus" element={<BusPage />} />
            <Route path="trail" element={<TrailPage />} />
            <Route path="submit" element={<SubmitPage />} />
            <Route path="manager" element={<ManagerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </GuideProvider>
  );
}
