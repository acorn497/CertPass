import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        CertPass
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        자격증 시험 준비, 무료 온라인 강의로 시작하세요
      </p>
      <Link
        to="/courses"
        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
      >
        강의 둘러보기
      </Link>
    </div>
  );
}
