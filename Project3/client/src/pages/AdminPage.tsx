import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { instructorApplicationsApi } from '../api/instructorApplications';
import { useAuthStore } from '../stores/authStore';

const formatAccount = (
  account?: { name?: string; email?: string } | null,
  fallback = '사용자',
) => (account?.email ? `${account.name ?? ''}(${account.email})` : fallback);

export function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?._id);
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
    queryFn: () => adminApi.courses().then((r) => r.data.data),
  });
  const { data: moderation } = useQuery({
    queryKey: ['admin-moderation'],
    queryFn: () => adminApi.moderation().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const { data: applications } = useQuery({
    queryKey: ['admin-instructor-applications'],
    queryFn: () => instructorApplicationsApi.list('pending').then((r) => r.data.data),
  });

  const applicationMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      action === 'approve'
        ? instructorApplicationsApi.approve(id)
        : instructorApplicationsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: 'approved' | 'rejected' }) =>
      adminApi.approveCourse(courseId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (variables.status === 'approved') {
        navigate(`/courses/${variables.courseId}`);
      }
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => adminApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
  const deleteQnaMutation = useMutation({
    mutationFn: (postId: string) => adminApi.deleteQnaPost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moderation'] }),
  });
  const deleteQnaCommentMutation = useMutation({
    mutationFn: (commentId: string) => adminApi.deleteQnaComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moderation'] }),
  });
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => adminApi.deleteReview(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moderation'] }),
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
                <select disabled={user._id === currentUserId} title={user._id === currentUserId ? '본인 역할은 변경할 수 없습니다' : undefined} className="rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed" value={user.role} onChange={(e) => roleMutation.mutate({ userId: user._id, role: e.target.value })}>
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
                <p className="text-xs text-slate-400">
                  {formatAccount(course.instructorAccount, course.instructor)} · {course.examName} · {(course.price ?? 0).toLocaleString()}원
                </p>
                <div className="mt-3 flex gap-2">
                  <Link to={`/courses/${course._id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">이동</Link>
                  <button onClick={() => statusMutation.mutate({ courseId: course._id, status: 'approved' })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">승인</button>
                  <button onClick={() => statusMutation.mutate({ courseId: course._id, status: 'rejected' })} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">반려</button>
                  <button onClick={() => { if (window.confirm('이 강의를 삭제할까요? 수강·리뷰·Q&A·진도 데이터가 함께 삭제됩니다.')) deleteCourseMutation.mutate(course._id); }} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">
            강사 신청 {applications?.length ? `(${applications.length})` : ''}
          </h2>
          <div className="space-y-3">
            {applications?.length ? (
              applications.map((app) => (
                <div key={app._id} className="border-b border-slate-100 pb-3">
                  <p className="text-sm font-medium text-slate-800">{formatAccount(app.user)}</p>
                  <p className="mt-1 text-sm text-slate-600">{app.motivation}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => applicationMutation.mutate({ id: app._id, action: 'approve' })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">승인</button>
                    <button onClick={() => { if (window.confirm('이 신청을 거절할까요?')) applicationMutation.mutate({ id: app._id, action: 'reject' }); }} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">거절</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">대기 중인 강사 신청이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Q&A 관리</h2>
          <div className="space-y-3">
            {moderation?.qnaPosts.map((post) => (
              <div key={post._id} className="border-b border-slate-100 pb-3">
                <p className="text-sm font-medium text-slate-800">{post.title}</p>
                <p className="text-xs text-slate-400">{post.course?.title ?? '강의'} · {formatAccount(post.user)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.content}</p>
                <button onClick={() => { if (window.confirm('이 질문을 삭제할까요? 달린 댓글도 함께 삭제됩니다.')) deleteQnaMutation.mutate(post._id); }} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">삭제</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">리뷰 관리</h2>
          <div className="space-y-3">
            {moderation?.reviews.map((review) => (
              <div key={review._id} className="border-b border-slate-100 pb-3">
                <p className="text-sm font-medium text-slate-800">★ {review.rating} · {review.course?.title ?? '강의'}</p>
                <p className="text-xs text-slate-400">{formatAccount(review.user)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{review.content}</p>
                <button onClick={() => { if (window.confirm('이 리뷰를 삭제할까요?')) deleteReviewMutation.mutate(review._id); }} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">삭제</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Q&A 댓글 관리</h2>
          <div className="space-y-3">
            {moderation?.qnaComments.length ? (
              moderation.qnaComments.map((comment) => (
                <div key={comment._id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      {comment.post?.title ?? '질문'} · {formatAccount(comment.user)}
                      {comment.isInstructor ? ' · 강사' : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{comment.content}</p>
                  </div>
                  <button onClick={() => { if (window.confirm('이 댓글을 삭제할까요?')) deleteQnaCommentMutation.mutate(comment._id); }} className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">삭제</button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">관리할 댓글이 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
