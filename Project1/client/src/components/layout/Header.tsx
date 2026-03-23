import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          CertPass
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/courses" className="text-gray-600 hover:text-gray-900 transition">
            강의 목록
          </Link>

          {user ? (
            <>
              <Link to="/my-courses" className="text-gray-600 hover:text-gray-900 transition">
                내 강의실
              </Link>
              <Link to="/mypage" className="text-gray-600 hover:text-gray-900 transition">
                마이페이지
              </Link>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 transition text-sm"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
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
