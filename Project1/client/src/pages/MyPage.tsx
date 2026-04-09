import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../api/users';
import { useAuthStore } from '../stores/authStore';

const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: '새 비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function MyPage() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(),
  });
  const user = userData?.data?.data;

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '' },
  });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const { mutate: updateProfile, isPending: profilePending } = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateProfile(data.name),
    onSuccess: (res) => {
      const updated = res.data.data;
      if (user && token) {
        setAuth(token, { ...user, name: updated.name });
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setProfileMsg('프로필이 수정됐습니다.');
      setTimeout(() => setProfileMsg(''), 3000);
    },
    onError: () => setProfileMsg('수정에 실패했습니다.'),
  });

  const { mutate: changePassword, isPending: passwordPending } = useMutation({
    mutationFn: (data: PasswordForm) =>
      usersApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      resetPassword();
      setPasswordMsg('비밀번호가 변경됐습니다.');
      setTimeout(() => setPasswordMsg(''), 3000);
    },
    onError: () => setPasswordMsg('현재 비밀번호가 올바르지 않습니다.'),
  });

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">마이페이지</h1>
        <p className="text-slate-500 text-sm">프로필 정보를 관리하세요</p>
      </div>

      {/* 프로필 수정 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">프로필 수정</h2>

        <div className="mb-4">
          <label className="block text-sm text-slate-500 mb-1">이메일</label>
          <p className="text-slate-800 font-medium">{user?.email}</p>
        </div>

        <form onSubmit={handleProfile((d) => updateProfile(d))} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">이름</label>
            <input {...regProfile('name')} className={inputClass} />
            {profileErrors.name && (
              <p className="text-red-500 text-xs mt-1.5">{profileErrors.name.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={profilePending}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 font-medium shadow-sm"
            >
              {profilePending ? '저장 중...' : '저장'}
            </button>
            {profileMsg && (
              <span className="text-sm text-green-600">{profileMsg}</span>
            )}
          </div>
        </form>
      </section>

      {/* 비밀번호 변경 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">비밀번호 변경</h2>

        <form onSubmit={handlePassword((d) => changePassword(d))} className="flex flex-col gap-4">
          {[
            { id: 'currentPassword', label: '현재 비밀번호', error: passwordErrors.currentPassword },
            { id: 'newPassword', label: '새 비밀번호', error: passwordErrors.newPassword },
            { id: 'confirmPassword', label: '새 비밀번호 확인', error: passwordErrors.confirmPassword },
          ].map(({ id, label, error }) => (
            <div key={id}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type="password"
                {...regPassword(id as keyof PasswordForm)}
                className={inputClass}
              />
              {error && <p className="text-red-500 text-xs mt-1.5">{error.message}</p>}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={passwordPending}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 font-medium shadow-sm"
            >
              {passwordPending ? '변경 중...' : '비밀번호 변경'}
            </button>
            {passwordMsg && (
              <span className={`text-sm ${passwordMsg.includes('실패') || passwordMsg.includes('올바르지') ? 'text-red-500' : 'text-green-600'}`}>
                {passwordMsg}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
