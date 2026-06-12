import api from './client';
import type { ApiResponse, Course, Pagination, User } from '../types';

export const adminApi = {
  stats: () =>
    api.get<
      ApiResponse<{
        totalUsers: number;
        totalCourses: number;
        pendingCourses: number;
        todayEnrollments: number;
      }>
    >('/admin/stats'),
  users: () =>
    api.get<ApiResponse<{ users: User[]; pagination: Pagination }>>('/users'),
  updateRole: (userId: string, role: string) =>
    api.patch<ApiResponse<Pick<User, '_id' | 'role'>>>(`/users/${userId}/role`, {
      role,
    }),
  approveCourse: (courseId: string, status: 'approved' | 'rejected' | 'pending') =>
    api.patch<ApiResponse<Course>>(`/courses/${courseId}/status`, { status }),
  courses: () => api.get<ApiResponse<Course[]>>('/admin/courses'),
  moderation: () =>
    api.get<
      ApiResponse<{
        qnaPosts: Array<{
          _id: string;
          title: string;
          content: string;
          user?: Pick<User, '_id' | 'email' | 'name'>;
          course?: Pick<Course, '_id' | 'title'>;
        }>;
        qnaComments: Array<{
          _id: string;
          content: string;
          isInstructor?: boolean;
          user?: Pick<User, '_id' | 'email' | 'name'>;
          post?: { _id: string; title: string };
        }>;
        reviews: Array<{
          _id: string;
          rating: number;
          content: string;
          user?: Pick<User, '_id' | 'email' | 'name'>;
          course?: Pick<Course, '_id' | 'title'>;
        }>;
      }>
    >('/admin/moderation'),
  deleteCourse: (courseId: string) => api.delete<ApiResponse<{ message: string }>>(`/admin/courses/${courseId}`),
  deleteQnaPost: (postId: string) => api.delete<ApiResponse<{ message: string }>>(`/admin/qna/${postId}`),
  deleteQnaComment: (commentId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/admin/qna/comments/${commentId}`),
  deleteReview: (reviewId: string) => api.delete<ApiResponse<{ message: string }>>(`/admin/reviews/${reviewId}`),
};
