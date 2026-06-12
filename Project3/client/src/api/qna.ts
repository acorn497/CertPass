import api from './client';
import type { ApiResponse, Pagination, QnaPost, QnaComment } from '../types';

export const qnaApi = {
  getByCourse: (courseId: string) =>
    api.get<ApiResponse<{ posts: QnaPost[]; pagination: Pagination }>>(
      `/courses/${courseId}/qna`,
    ),
  create: (courseId: string, data: { title: string; content: string }) =>
    api.post<ApiResponse<QnaPost>>(`/courses/${courseId}/qna`, data),
  getOne: (postId: string) => api.get<ApiResponse<QnaPost>>(`/qna/${postId}`),
  addComment: (postId: string, data: { content: string }) =>
    api.post<ApiResponse<QnaComment>>(`/qna/${postId}/comments`, data),
};
