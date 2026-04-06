import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { progressApi } from '../api/progress';
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
  const progressMarked = useRef(false);

  // 강의 상세 (사이드바용)
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getOne(courseId!),
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
    queryKey: ['progress', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId,
  });

  const { mutate: completeEpisode } = useMutation({
    mutationFn: () => progressApi.completeEpisode(courseId!, episodeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
    },
  });

  const completedIds = progressData?.data?.data?.completedEpisodeIds ?? [];
  const course = courseData?.data?.data;
  const episode = episodeData?.data?.data;

  // 에피소드 이동 시 진도 마킹 초기화
  useEffect(() => {
    progressMarked.current = false;
  }, [episodeId]);

  // YouTube iframe onMessage로 90% 이상 시청 감지 (postMessage 방식)
  useEffect(() => {
    if (!episode || progressMarked.current) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onStateChange' && data.info === 0) {
          // 영상 종료 시 완료 처리
          if (!progressMarked.current) {
            progressMarked.current = true;
            completeEpisode();
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [episode, completeEpisode]);

  // 다음 에피소드 찾기
  const allEpisodes: { episode: Episode; section: Section }[] = [];
  course?.sections?.forEach((section) => {
    section.episodes.forEach((ep) => allEpisodes.push({ episode: ep, section }));
  });
  const currentIndex = allEpisodes.findIndex((e) => e.episode._id === episodeId);
  const nextEpisode = allEpisodes[currentIndex + 1] ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (isError || !episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">에피소드를 불러올 수 없습니다.</p>
        <Link to={`/courses/${courseId}`} className="text-blue-600 underline">
          강의 상세로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* 영상 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 네비게이션 */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white text-sm shrink-0">
          <Link to={`/courses/${courseId}`} className="text-gray-400 hover:text-white transition-colors">
            ← {course?.title ?? '강의'}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="truncate">{episode.title}</span>
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
        <div className="px-6 py-4 bg-gray-800 text-white flex-1 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-1">{episode.section.title}</p>
          <h1 className="text-lg font-semibold mb-2">{episode.title}</h1>
          <p className="text-sm text-gray-400">{formatDuration(episode.duration)}</p>

          {nextEpisode && (
            <button
              onClick={() =>
                navigate(`/courses/${courseId}/episodes/${nextEpisode.episode._id}`)
              }
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              다음 강의 →
            </button>
          )}

          {completedIds.includes(episodeId!) && (
            <span className="ml-3 text-green-400 text-sm">✓ 완료</span>
          )}
        </div>
      </div>

      {/* 사이드바 */}
      <div className="w-80 bg-gray-800 flex flex-col shrink-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">강의 목차</h2>
          {progressData?.data?.data && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>진도율</span>
                <span>{progressData.data.data.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressData.data.data.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {course?.sections?.map((section) => (
            <div key={section._id}>
              <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
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
                    className={`w-full text-left px-4 py-3 border-b border-gray-700 flex items-start gap-2 transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="mt-0.5 text-xs shrink-0">
                      {isDone ? '✓' : isActive ? '▶' : '○'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{ep.title}</p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
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
  );
}
