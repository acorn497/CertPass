import { Link } from 'react-router-dom';

const HERO_BG =
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&h=1080&fit=crop&auto=format&q=80';

export function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/65 to-slate-900/80"
        aria-hidden
      />
      <div className="relative z-10 max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
          자격증 합격,
          <br />
          <span className="text-indigo-300">서트패스</span>로 시작하세요
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-200/95">
          정보처리기사, 토익, 공인중개사 등 인기 자격증 강의를
          <br className="hidden sm:block" />
          언제 어디서든 수강할 수 있습니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500"
          >
            강의 둘러보기
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-7 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/15"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
