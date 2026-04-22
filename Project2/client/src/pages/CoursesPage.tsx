import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { CourseCard } from '../components/course/CourseCard';
import { enrollmentsApi } from '../api/enrollments';
import { useAuthStore } from '../stores/authStore';

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => coursesApi.getCategories().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, category, debouncedQ],
    queryFn: () =>
      coursesApi
        .getAll({
          page,
          limit: 12,
          category: category || undefined,
          q: debouncedQ || undefined,
        })
        .then((r) => r.data.data),
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMyEnrollments().then((r) => r.data.data),
    enabled: !!user,
  });

  const enrolledIds = new Set(myEnrollments?.map((item) => item.course._id) ?? []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">강의 탐색</h1>
        <p className="text-slate-500">관심 있는 자격증 강의를 찾아보세요</p>
      </div>

      <div className="mb-8 max-w-xl">
        <label htmlFor="course-search" className="sr-only">
          강의 검색
        </label>
        <input
          id="course-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="강의명, 설명, 강사, 시험명으로 검색"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            category === ''
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 강의 그리드 */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400">불러오는 중...</div>
      ) : data?.courses.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          {debouncedQ ? '검색 결과가 없습니다.' : '등록된 강의가 없습니다.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isEnrolled={enrolledIds.has(course._id)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                이전
              </button>
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
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
