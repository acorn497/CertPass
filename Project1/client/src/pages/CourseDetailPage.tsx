import { useParams, useNavigate } from 'react-router-dom';
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        강의를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 강의 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="aspect-video bg-gray-100 max-h-80 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {course.category?.name}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {levelLabel[course.level] ?? course.level}
            </span>
            <span className="text-xs text-gray-400">{course.examName}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>강사: {course.instructor}</span>
            <span>{totalEpisodes}개 에피소드</span>
          </div>

          {isEnrolled ? (
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              수강 중
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {enrollMutation.isPending ? '신청 중...' : '무료 수강 신청'}
            </button>
          )}
        </div>
      </div>

      {/* 커리큘럼 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">커리큘럼</h2>
        <div className="space-y-4">
          {course.sections.map((section) => (
            <div key={section._id}>
              <h3 className="font-semibold text-gray-800 mb-2">{section.title}</h3>
              <ul className="space-y-1 ml-4">
                {section.episodes.map((episode) => (
                  <li
                    key={episode._id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <span className="text-gray-700">{episode.title}</span>
                    <span className="text-gray-400 text-xs">
                      {formatDuration(episode.duration)}
                    </span>
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
