import api from './client';
import type { ApiResponse, Course, CourseDetail, Category, Pagination, EpisodeDetail } from '../types';

export const coursesApi = {
  getAll: (params: { page?: number; limit?: number; category?: string; level?: string }) =>
    api.get<ApiResponse<{ courses: Course[]; pagination: Pagination }>>('/courses', { params }),

  getOne: (courseId: string) =>
    api.get<ApiResponse<CourseDetail>>(`/courses/${courseId}`),

  getEpisode: (courseId: string, episodeId: string) =>
    api.get<ApiResponse<EpisodeDetail>>(`/courses/${courseId}/episodes/${episodeId}`),

  getCategories: () =>
    api.get<ApiResponse<Category[]>>('/categories'),
};
