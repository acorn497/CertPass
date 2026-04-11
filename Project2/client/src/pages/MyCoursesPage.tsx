import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '../api/enrollments';

export function MyCoursesPage() {
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMyEnrollments().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-slate-400">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">내 강의실</h1>
        <p className="text-slate-500 text-sm">수강 중인 강의를 확인하세요</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 mb-4">수강 중인 강의가 없어요.</p>
          <Link
            to="/courses"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm font-medium"
          >
            강의 둘러보기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enrollments.map(({ enrollment, course, progress }) => {
            const firstEpisodeId = progress.lastWatchedEpisodeId;

            return (
              <div
                key={enrollment._id}
                className="flex gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                {/* 썸네일 */}
                <div className="w-36 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{course.examName}</p>
                    <h2 className="font-semibold text-slate-900 truncate">{course.title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{course.instructor}</p>
                  </div>

                  {/* 진도 바 */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>
                        {progress.completedCount}/{progress.totalCount}강 완료
                      </span>
                      <span className="font-medium text-indigo-600">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 이어보기 버튼 */}
                <div className="flex items-center shrink-0 pl-2">
                  {firstEpisodeId ? (
                    <Link
                      to={`/courses/${course._id}/episodes/${firstEpisodeId}`}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition whitespace-nowrap font-medium shadow-sm"
                    >
                      이어보기
                    </Link>
                  ) : (
                    <Link
                      to={`/courses/${course._id}`}
                      className="px-4 py-2 border border-indigo-600 text-indigo-600 text-sm rounded-xl hover:bg-indigo-50 transition whitespace-nowrap font-medium"
                    >
                      시작하기
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
