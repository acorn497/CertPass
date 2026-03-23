import api from './client';
import type { ApiResponse, User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
};
