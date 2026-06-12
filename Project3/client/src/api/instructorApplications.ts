import api from './client';
import type { ApiResponse, InstructorApplication } from '../types';

type Status = InstructorApplication['status'];

export const instructorApplicationsApi = {
  // 일반 회원: 강사 신청
  apply: (motivation: string) =>
    api.post<ApiResponse<InstructorApplication>>('/instructor-applications', {
      motivation,
    }),

  // 일반 회원: 내 신청 상태 (없으면 data: null)
  mine: () =>
    api.get<ApiResponse<InstructorApplication | null>>('/instructor-applications/me'),

  // 관리자: 목록 (상태 필터 선택)
  list: (status?: Status) =>
    api.get<ApiResponse<InstructorApplication[]>>('/instructor-applications', {
      params: status ? { status } : undefined,
    }),

  // 관리자: 승인 / 거절
  approve: (id: string, reviewNote?: string) =>
    api.patch<ApiResponse<InstructorApplication>>(
      `/instructor-applications/${id}/approve`,
      { reviewNote },
    ),

  reject: (id: string, reviewNote?: string) =>
    api.patch<ApiResponse<InstructorApplication>>(
      `/instructor-applications/${id}/reject`,
      { reviewNote },
    ),
};
