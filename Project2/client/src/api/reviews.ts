import api from './client';
import type { ApiResponse, Pagination, Review } from '../types';

export const reviewsApi = {
  getByCourse: (courseId: string) =>
    api.get<
      ApiResponse<{
        reviews: Review[];
        avgRating: number;
        reviewCount: number;
        pagination: Pagination;
      }>
    >(`/courses/${courseId}/reviews`),
  create: (courseId: string, data: { rating: number; content: string }) =>
    api.post<ApiResponse<Review>>(`/courses/${courseId}/reviews`, data),
  update: (
    courseId: string,
    reviewId: string,
    data: { rating?: number; content?: string },
  ) => api.patch<ApiResponse<Review>>(`/courses/${courseId}/reviews/${reviewId}`, data),
  remove: (courseId: string, reviewId: string) =>
    api.delete<ApiResponse<{ message: string }>>(
      `/courses/${courseId}/reviews/${reviewId}`,
    ),
};
