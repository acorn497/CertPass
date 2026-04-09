import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-base font-bold text-white mb-2 inline-block">CertPass</span>
            <p className="text-sm">자격증 시험 준비를 위한 온라인 강의 플랫폼</p>
          </div>

          <div className="flex gap-8 text-sm">
            <Link to="/courses" className="hover:text-white transition">강의 탐색</Link>
            <Link to="/my-courses" className="hover:text-white transition">내 강의실</Link>
            <Link to="/mypage" className="hover:text-white transition">마이페이지</Link>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-slate-500 text-center">
          &copy; 2026 CertPass. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
