import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })));
const PlayerPage = lazy(() => import('./pages/PlayerPage').then((m) => ({ default: m.PlayerPage })));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage })));
const MyPage = lazy(() => import('./pages/MyPage').then((m) => ({ default: m.MyPage })));
const InstructorPage = lazy(() => import('./pages/InstructorPage').then((m) => ({ default: m.InstructorPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ExamPage = lazy(() => import('./pages/ExamPage').then((m) => ({ default: m.ExamPage })));
const OperationsPage = lazy(() => import('./pages/OperationsPage').then((m) => ({ default: m.OperationsPage })));

function RouteLoader() {
  return <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-slate-500">화면을 불러오는 중...</div>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* 플레이어는 Layout 없이 전체화면 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/courses/:courseId/episodes/:episodeId" element={<PlayerPage />} />
          <Route path="/exams/:examId" element={<ExamPage />} />
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

          <Route element={<ProtectedRoute roles={['instructor', 'admin']} />}>
            <Route path="/instructor" element={<InstructorPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/ops" element={<OperationsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
