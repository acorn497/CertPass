import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition ${
        active
          ? 'text-indigo-600'
          : 'text-slate-600 hover:text-indigo-600'
      }`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 오류와 무관하게 클라이언트 로그아웃 진행
    } finally {
      logout();
      queryClient.clear();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition">
          CertPass
        </Link>

        <nav className="flex items-center gap-5">
          <NavLink to="/courses">강의 탐색</NavLink>

          {user ? (
            <>
              <NavLink to="/my-courses">내 강의실</NavLink>
              {(user.role === 'instructor' || user.role === 'admin') && (
                <NavLink to="/instructor">강사</NavLink>
              )}
              {user.role === 'admin' && <NavLink to="/admin">관리자</NavLink>}
              <NavLink to="/mypage">마이페이지</NavLink>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-slate-600 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div className="w-px h-5 bg-slate-200" />
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
