import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { CourseCard } from '../components/course/CourseCard';

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => coursesApi.getCategories().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, category],
    queryFn: () =>
      coursesApi
        .getAll({ page, limit: 12, category: category || undefined })
        .then((r) => r.data.data),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">강의 목록</h1>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            category === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {categoriesData?.map((cat) => (
          <button
            key={cat._id}
            onClick={() => { setCategory(cat.slug); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              category === cat.slug
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 강의 그리드 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : data?.courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">등록된 강의가 없습니다</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                이전
              </button>
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded text-sm transition ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
