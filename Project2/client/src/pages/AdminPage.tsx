import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { instructorApi } from '../api/instructor';

export function AdminPage() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then((r) => r.data.data),
  });
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users().then((r) => r.data.data.users),
  });
  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => instructorApi.courses().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: 'approved' | 'rejected' }) =>
      adminApi.approveCourse(courseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">관리자 대시보드</h1>
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          ['회원', stats?.totalUsers ?? 0],
          ['강의', stats?.totalCourses ?? 0],
          ['승인 대기', stats?.pendingCourses ?? 0],
          ['오늘 수강', stats?.todayEnrollments ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">회원 관리</h2>
          <div className="space-y-3">
            {users?.map((user) => (
              <div key={user._id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <select className="rounded-lg border border-slate-200 px-2 py-1 text-sm" value={user.role} onChange={(e) => roleMutation.mutate({ userId: user._id, role: e.target.value })}>
                  <option value="student">student</option>
                  <option value="instructor">instructor</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">강의 승인</h2>
          <div className="space-y-3">
            {courses?.filter((course) => course.status === 'pending').map((course) => (
              <div key={course._id} className="border-b border-slate-100 pb-3">
                <p className="text-sm font-medium text-slate-800">{course.title}</p>
                <p className="text-xs text-slate-400">{course.instructor} · {course.examName}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => statusMutation.mutate({ courseId: course._id, status: 'approved' })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">승인</button>
                  <button onClick={() => statusMutation.mutate({ courseId: course._id, status: 'rejected' })} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">반려</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
