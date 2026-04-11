import api from './client';
import type { ApiResponse, User } from '../types';

export const usersApi = {
  getMe: () =>
    api.get<ApiResponse<User>>('/users/me'),

  updateProfile: (name: string) =>
    api.patch<ApiResponse<Pick<User, '_id' | 'email' | 'name'>>>('/users/me', { name }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<ApiResponse<{ message: string }>>('/users/me/password', {
      currentPassword,
      newPassword,
    }),
};
