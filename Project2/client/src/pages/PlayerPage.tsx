import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { progressApi } from '../api/progress';
import { useAuthStore } from '../stores/authStore';
import type { Section, Episode } from '../types';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PlayerPage() {
  const { courseId, episodeId } = useParams<{ courseId: string; episodeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // 강의 상세 (사이드바용) — CourseDetailPage와 동일 키/데이터 형태로 캐시 공유
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getOne(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });

  // 현재 에피소드
  const { data: episodeData, isLoading, isError } = useQuery({
    queryKey: ['episode', courseId, episodeId],
    queryFn: () => coursesApi.getEpisode(courseId!, episodeId!),
    enabled: !!courseId && !!episodeId,
  });

  // 진도 정보
  const { data: progressData } = useQuery({
    queryKey: ['progress', user?._id, courseId],
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId && !!user,
  });

  const { mutate: completeEpisode, isPending: isCompleting } = useMutation({
    mutationFn: () => progressApi.completeEpisode(courseId!, episodeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', user?._id, courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?._id] });
    },
  });

  const completedIds = progressData?.data?.data?.completedEpisodeIds ?? [];
  const episode = episodeData?.data?.data;
  const isCurrentCompleted = !!episodeId && completedIds.includes(episodeId);

  // 다음 에피소드 찾기
  const allEpisodes: { episode: Episode; section: Section }[] = [];
  course?.sections?.forEach((section) => {
    section.episodes.forEach((ep) => allEpisodes.push({ episode: ep, section }));
  });
  const currentIndex = allEpisodes.findIndex((e) => e.episode._id === episodeId);
  const nextEpisode = allEpisodes[currentIndex + 1] ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-slate-400">불러오는 중...</div>
      </div>
    );
  }

  if (isError || !episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-900">
        <p className="text-red-400">에피소드를 불러올 수 없습니다.</p>
        <Link to={`/courses/${courseId}`} className="text-indigo-400 hover:underline text-sm">
          강의 상세로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className='w-screen h-screen bg-slate-900'>
      <div className="flex h-screen w-5/6 bg-slate-900 overflow-hidden left-1/2 absolute -translate-x-1/2">
        {/* 영상 영역 */}
        <div className="flex-1 flex flex-col min-w-0 max-w-3/4">
          {/* 상단 네비게이션 */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-800/80 backdrop-blur-sm text-white text-sm shrink-0 border-b border-slate-700/50">
            <Link to={`/courses/${courseId}`} className="text-slate-400 hover:text-white transition">
              ← {course?.title ?? '강의'}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="truncate text-slate-200">{episode.title}</span>
          </div>

          {/* YouTube 플레이어 */}
          <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${episode.videoUrl}?enablejsapi=1&rel=0&modestbranding=1`}
              title={episode.title}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* 에피소드 정보 */}
          <div className="px-6 py-5 bg-slate-800 text-white flex-1 overflow-y-auto">
            <p className="text-xs text-slate-400 mb-1">{episode.section.title}</p>
            <h1 className="text-lg font-semibold mb-2">{episode.title}</h1>
            <p className="text-sm text-slate-400">{formatDuration(episode.duration)}</p>

            <div className="flex items-center gap-3 mt-4">
              {isCurrentCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600/20 text-green-400 text-sm rounded-xl font-medium">
                  ✓ 학습 완료
                </span>
              ) : (
                <button
                  onClick={() => completeEpisode()}
                  disabled={isCompleting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl transition font-medium disabled:opacity-50"
                >
                  {isCompleting ? '처리 중...' : '학습 완료'}
                </button>
              )}

              {nextEpisode && (
                <button
                  onClick={() =>
                    navigate(`/courses/${courseId}/episodes/${nextEpisode.episode._id}`)
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition font-medium"
                >
                  다음 강의
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="w-80 bg-slate-800 flex flex-col shrink-0 overflow-hidden border-l border-slate-700/50">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-white font-semibold text-sm">강의 목차</h2>
            {progressData?.data?.data && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>진도율</span>
                  <span className="text-indigo-400 font-medium">{progressData.data.data.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${progressData.data.data.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {course?.sections?.map((section) => (
              <div key={section._id}>
                <div className="px-5 py-2.5 border-b border-slate-700/50 bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-400 tracking-wide">
                    {section.title}
                  </p>
                </div>
                {section.episodes.map((ep) => {
                  const isActive = ep._id === episodeId;
                  const isDone = completedIds.includes(ep._id);
                  return (
                    <button
                      key={ep._id}
                      onClick={() =>
                        navigate(`/courses/${courseId}/episodes/${ep._id}`)
                      }
                      className={`w-full text-left px-5 py-3 border-b border-slate-700/30 flex items-start gap-2.5 transition ${isActive
                          ? 'bg-indigo-600/20 text-white'
                          : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className={`mt-0.5 text-xs shrink-0 ${isDone ? 'text-green-400' : isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {isDone ? '✓' : isActive ? '▶' : '○'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{ep.title}</p>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                          {formatDuration(ep.duration)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
