import api from './client';
import type { ApiResponse, Course } from '../types';

export const instructorApi = {
  courses: () => api.get<ApiResponse<Course[]>>('/instructor/courses'),
  createCourse: (data: {
    title: string;
    description: string;
    categoryId: string;
    examName: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    thumbnail?: string | null;
  }) => api.post<ApiResponse<Course>>('/courses', data),
  stats: (courseId: string) =>
    api.get<ApiResponse<unknown>>(`/instructor/courses/${courseId}/stats`),
};
