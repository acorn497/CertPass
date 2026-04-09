import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { enrollmentsApi } from '../api/enrollments';
import { useAuthStore } from '../stores/authStore';

const levelLabel: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getOne(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ['enrollment', courseId],
    queryFn: () => enrollmentsApi.checkEnrollment(courseId!).then((r) => r.data.data),
    enabled: !!courseId && !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });

  const isEnrolled = enrollmentData?.isEnrolled ?? false;

  const totalEpisodes = course?.sections.reduce(
    (acc, s) => acc + s.episodes.length,
    0,
  ) ?? 0;

  const handleEnroll = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    enrollMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        불러오는 중...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        강의를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 강의 정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <div className="aspect-video bg-slate-100 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
              {course.category?.name}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
              {levelLabel[course.level] ?? course.level}
            </span>
            <span className="text-xs text-slate-400">{course.examName}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h1>
          <p className="text-slate-600 mb-5 leading-relaxed">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
            <span>강사: <span className="text-slate-700 font-medium">{course.instructor}</span></span>
            <span className="w-px h-4 bg-slate-200" />
            <span>{totalEpisodes}개 에피소드</span>
          </div>

          {isEnrolled ? (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-medium">
              수강 중
            </span>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              {enrollMutation.isPending ? '신청 중...' : '수강 신청'}
            </button>
          )}
        </div>
      </div>

      {/* 커리큘럼 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-5">커리큘럼</h2>
        <div className="space-y-5">
          {course.sections.map((section) => (
            <div key={section._id}>
              <h3 className="font-semibold text-slate-800 mb-2 text-sm">{section.title}</h3>
              <ul className="space-y-1">
                {section.episodes.map((episode) => (
                  <li key={episode._id}>
                    {isEnrolled ? (
                      <Link
                        to={`/courses/${courseId}/episodes/${episode._id}`}
                        className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-indigo-50 text-sm group transition"
                      >
                        <span className="text-slate-700 group-hover:text-indigo-600 transition">
                          {episode.title}
                        </span>
                        <span className="text-slate-400 text-xs">{formatDuration(episode.duration)}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between py-2.5 px-4 rounded-xl text-sm">
                        <span className="text-slate-400">{episode.title}</span>
                        <span className="text-slate-300 text-xs">{formatDuration(episode.duration)}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
