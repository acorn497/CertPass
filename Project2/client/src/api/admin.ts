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
};
