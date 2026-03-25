import api from './client';
import type { ApiResponse, EnrollmentWithProgress } from '../types';

export const enrollmentsApi = {
  enroll: (courseId: string) =>
    api.post<ApiResponse<unknown>>('/enrollments', { courseId }),

  checkEnrollment: (courseId: string) =>
    api.get<ApiResponse<{ isEnrolled: boolean; enrolledAt: string | null }>>(
      `/enrollments/me/${courseId}`,
    ),

  getMyEnrollments: () =>
    api.get<ApiResponse<EnrollmentWithProgress[]>>('/enrollments/me'),
};
