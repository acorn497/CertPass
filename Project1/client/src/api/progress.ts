import api from './client';
import type { ApiResponse } from '../types';

interface CourseProgress {
  courseId: string;
  completedEpisodeIds: string[];
  totalCount: number;
  completedCount: number;
  percentage: number;
}

export const progressApi = {
  getCourseProgress: (courseId: string) =>
    api.get<ApiResponse<CourseProgress>>(`/progress/${courseId}`),

  completeEpisode: (courseId: string, episodeId: string) =>
    api.post<ApiResponse<unknown>>('/progress', { courseId, episodeId }),
};
