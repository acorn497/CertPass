import api from './client';
import type { ApiResponse } from '../types';

export const operationsApi = {
  health: () => api.get<ApiResponse<unknown>>('/health'),
  metrics: () => api.get<ApiResponse<unknown>>('/metrics'),
  subscribeEmail: (data: { email: string; topics?: string[] }) =>
    api.post<ApiResponse<unknown>>('/subscriptions/email', data),
  subscribeDiscord: (data: { webhookUrl: string; topics?: string[] }) =>
    api.post<ApiResponse<unknown>>('/subscriptions/discord', data),
  runDigest: () => api.post<ApiResponse<unknown>>('/scheduler/digest/run'),
  runExamDday: () => api.post<ApiResponse<unknown>>('/scheduler/exam-dday/run'),
  runCleanup: () => api.post<ApiResponse<unknown>>('/scheduler/cleanup/run'),
  sendWebhook: (data: { url: string; eventType: string; payload: Record<string, unknown> }) =>
    api.post<ApiResponse<unknown>>('/webhooks/outbound/test', data),
};
