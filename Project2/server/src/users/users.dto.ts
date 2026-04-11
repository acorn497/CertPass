import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
