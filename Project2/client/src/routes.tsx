import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { PlayerPage } from './pages/PlayerPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { MyPage } from './pages/MyPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* 플레이어는 Layout 없이 전체화면 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/courses/:courseId/episodes/:episodeId" element={<PlayerPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />

        {/* 인증 필요 페이지 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
