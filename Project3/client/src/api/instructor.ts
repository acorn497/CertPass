import api from './client';
import type { ApiResponse, Course, Episode, QnaPost, Section } from '../types';

export const instructorApi = {
  courses: () => api.get<ApiResponse<Course[]>>('/instructor/courses'),
  createCourse: (data: {
    title: string;
    description: string;
    categoryId: string;
    examName: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    price?: number;
    thumbnail?: string | null;
  }) => api.post<ApiResponse<Course>>('/courses', data),
  updateCourse: (
    courseId: string,
    data: Partial<{
      title: string;
      description: string;
      categoryId: string;
      examName: string;
      level: 'beginner' | 'intermediate' | 'advanced';
      price: number;
      thumbnail: string | null;
    }>,
  ) => api.patch<ApiResponse<Course>>(`/courses/${courseId}`, data),
  resubmitCourse: (courseId: string) =>
    api.post<ApiResponse<Course>>(`/courses/${courseId}/resubmit`, {}),
  stats: (courseId: string) =>
    api.get<ApiResponse<unknown>>(`/instructor/courses/${courseId}/stats`),
  unansweredQna: () =>
    api.get<ApiResponse<Array<QnaPost & { course?: Pick<Course, '_id' | 'title'>; commentCount: number }>>>(
      '/instructor/qna/unanswered',
    ),
  createSection: (courseId: string, data: { title: string; order: number }) =>
    api.post<ApiResponse<Section>>(`/courses/${courseId}/sections`, data),
  updateSection: (courseId: string, sectionId: string, data: { title?: string; order?: number }) =>
    api.patch<ApiResponse<Section>>(`/courses/${courseId}/sections/${sectionId}`, data),
  removeSection: (courseId: string, sectionId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/courses/${courseId}/sections/${sectionId}`),
  createEpisode: (
    courseId: string,
    sectionId: string,
    data: { title: string; videoUrl: string; duration: number; order: number },
  ) => api.post<ApiResponse<Episode>>(`/courses/${courseId}/sections/${sectionId}/episodes`, data),
  updateEpisode: (
    courseId: string,
    sectionId: string,
    episodeId: string,
    data: Partial<{ title: string; videoUrl: string; duration: number; order: number }>,
  ) =>
    api.patch<ApiResponse<Episode>>(
      `/courses/${courseId}/sections/${sectionId}/episodes/${episodeId}`,
      data,
    ),
  removeEpisode: (courseId: string, sectionId: string, episodeId: string) =>
    api.delete<ApiResponse<{ message: string }>>(
      `/courses/${courseId}/sections/${sectionId}/episodes/${episodeId}`,
    ),
};
