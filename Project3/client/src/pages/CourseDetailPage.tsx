import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../api/courses';
import { enrollmentsApi } from '../api/enrollments';
import { reviewsApi } from '../api/reviews';
import { qnaApi } from '../api/qna';
import { examsApi } from '../api/exams';
import { paymentsApi, requestTossPayment } from '../api/payments';
import { useAuthStore } from '../stores/authStore';

const levelLabel: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewForm, setEditReviewForm] = useState({
    rating: 5,
    content: '',
  });
  const [qnaForm, setQnaForm] = useState({ title: '', content: '' });
  const [commentForms, setCommentForms] = useState<Record<string, string>>({});
  const confirmingOrderId = useRef<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getOne(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ['enrollment', user?._id, courseId],
    queryFn: () => enrollmentsApi.checkEnrollment(courseId!).then((r) => r.data.data),
    enabled: !!courseId && !!user,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => reviewsApi.getByCourse(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const { data: qnaData } = useQuery({
    queryKey: ['qna', user?._id, courseId],
    queryFn: () => qnaApi.getByCourse(courseId!).then((r) => r.data.data),
    enabled: !!courseId && !!user && (enrollmentData?.isEnrolled || user.role !== 'student'),
  });

  const { data: exams } = useQuery({
    queryKey: ['exams', user?._id, courseId],
    queryFn: () => examsApi.getByCourse(courseId!).then((r) => r.data.data),
    enabled: !!courseId && !!user && (enrollmentData?.isEnrolled || user.role !== 'student'),
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', user?._id, courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?._id] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => paymentsApi.checkout(courseId!),
    onSuccess: async (response) => {
      const checkout = response.data.data;
      if (checkout.status === 'paid') {
        queryClient.invalidateQueries({ queryKey: ['enrollment', user?._id, courseId] });
        queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?._id] });
        return;
      }

      const checkoutUrl = checkout.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      try {
        await requestTossPayment(checkout);
      } catch (error) {
        alert(error instanceof Error ? error.message : '결제창을 여는 중 오류가 발생했습니다');
      }
    },
    onError: () => {
      alert('결제 요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (data: { paymentKey: string; orderId: string; amount: number }) =>
      paymentsApi.confirm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', user?._id, courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?._id] });
      navigate(`/courses/${courseId}`, { replace: true });
    },
  });

  useEffect(() => {
    if (!courseId || !user) return;

    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amountParam = params.get('amount');
    const amount = amountParam ? Number(amountParam) : NaN;

    if (!paymentKey || !orderId || !Number.isFinite(amount)) return;
    if (confirmingOrderId.current === orderId) return;

    confirmingOrderId.current = orderId;
    confirmMutation.mutate({ paymentKey, orderId, amount });
  }, [courseId, user, confirmMutation]);

  const reviewMutation = useMutation({
    mutationFn: () => reviewsApi.create(courseId!, reviewForm),
    onSuccess: () => {
      setReviewForm({ rating: 5, content: '' });
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      rating,
      content,
    }: {
      reviewId: string;
      rating: number;
      content: string;
    }) => reviewsApi.update(courseId!, reviewId, { rating, content }),
    onSuccess: () => {
      setEditingReviewId(null);
      setEditReviewForm({ rating: 5, content: '' });
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const qnaMutation = useMutation({
    mutationFn: () => qnaApi.create(courseId!, qnaForm),
    onSuccess: () => {
      setQnaForm({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['qna', user?._id, courseId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      qnaApi.addComment(postId, { content }),
    onSuccess: (_res, variables) => {
      setCommentForms((prev) => ({ ...prev, [variables.postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['qna', user?._id, courseId] });
    },
  });

  const isEnrolled = enrollmentData?.isEnrolled ?? false;
  const myReview = reviewsData?.reviews.find(
    (review) => review.user?._id === user?._id,
  );
  const otherReviews = reviewsData?.reviews.filter(
    (review) => review.user?._id !== user?._id,
  ) ?? [];

  const totalEpisodes = course?.sections.reduce(
    (acc, s) => acc + s.episodes.length,
    0,
  ) ?? 0;

  const handleEnroll = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if ((course?.price ?? 0) > 0) {
      checkoutMutation.mutate();
      return;
    }
    enrollMutation.mutate();
  };

  const handleReview = (e: FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate();
  };

  const startEditReview = (review: {
    _id: string;
    rating: number;
    content: string;
  }) => {
    setEditingReviewId(review._id);
    setEditReviewForm({ rating: review.rating, content: review.content });
  };

  const handleUpdateReview = (e: FormEvent, reviewId: string) => {
    e.preventDefault();
    updateReviewMutation.mutate({ reviewId, ...editReviewForm });
  };

  const handleQna = (e: FormEvent) => {
    e.preventDefault();
    qnaMutation.mutate();
  };

  const handleComment = (e: FormEvent, postId: string) => {
    e.preventDefault();
    const content = commentForms[postId]?.trim();
    if (!content) return;
    commentMutation.mutate({ postId, content });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        불러오는 중...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        강의를 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 강의 정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <div className="aspect-video bg-slate-100 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
              {course.category?.name}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
              {levelLabel[course.level] ?? course.level}
            </span>
            <span className="text-xs text-slate-400">{course.examName}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h1>
          <p className="text-slate-600 mb-5 leading-relaxed">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
            <span>강사: <span className="text-slate-700 font-medium">{course.instructor}</span></span>
            <span className="w-px h-4 bg-slate-200" />
            <span>{totalEpisodes}개 에피소드</span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="text-amber-600">★ {(course.avgRating ?? 0).toFixed(1)} ({course.reviewCount ?? 0})</span>
          </div>

          {isEnrolled ? (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-medium">
              수강 중
            </span>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending || checkoutMutation.isPending}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              {enrollMutation.isPending || checkoutMutation.isPending
                ? '처리 중...'
                : (course.price ?? 0) > 0
                  ? `${course.price.toLocaleString()}원 결제`
                  : '수강 신청'}
            </button>
          )}
        </div>
      </div>

      {/* 커리큘럼 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-5">커리큘럼</h2>
        <div className="space-y-5">
          {course.sections.map((section) => (
            <div key={section._id}>
              <h3 className="font-semibold text-slate-800 mb-2 text-sm">{section.title}</h3>
              <ul className="space-y-1">
                {section.episodes.map((episode) => (
                  <li key={episode._id}>
                    {isEnrolled ? (
                      <Link
                        to={`/courses/${courseId}/episodes/${episode._id}`}
                        className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-indigo-50 text-sm group transition"
                      >
                        <span className="text-slate-700 group-hover:text-indigo-600 transition">
                          {episode.title}
                        </span>
                        <span className="text-slate-400 text-xs">{formatDuration(episode.duration)}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between py-2.5 px-4 rounded-xl text-sm">
                        <span className="text-slate-400">{episode.title}</span>
                        <span className="text-slate-300 text-xs">{formatDuration(episode.duration)}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">리뷰</h2>
          {isEnrolled && myReview ? (
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="mb-3 text-xs font-semibold text-indigo-600">내 리뷰</p>
              {editingReviewId === myReview._id ? (
                <form
                  onSubmit={(e) => handleUpdateReview(e, myReview._id)}
                  className="space-y-3"
                >
                  <select
                    value={editReviewForm.rating}
                    onChange={(e) =>
                      setEditReviewForm({
                        ...editReviewForm,
                        rating: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}점
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={editReviewForm.content}
                    onChange={(e) =>
                      setEditReviewForm({
                        ...editReviewForm,
                        content: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateReviewMutation.isPending}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReviewId(null)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-800">
                      {myReview.user?.name ?? '사용자'}
                    </span>
                    <span className="text-amber-600">★ {myReview.rating}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{myReview.content}</p>
                  <button
                    type="button"
                    onClick={() => startEditReview(myReview)}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                </>
              )}
            </div>
          ) : isEnrolled ? (
            <form onSubmit={handleReview} className="mb-5 space-y-3">
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating}점</option>
                ))}
              </select>
              <textarea
                value={reviewForm.content}
                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                placeholder="수강 후기를 남겨주세요"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">리뷰 작성</button>
            </form>
          ) : null}
          <div className="space-y-3">
            {otherReviews.map((review) => (
              <div key={review._id} className="border-t border-slate-100 pt-3">
                {editingReviewId === review._id ? (
                  <form
                    onSubmit={(e) => handleUpdateReview(e, review._id)}
                    className="space-y-3"
                  >
                    <select
                      value={editReviewForm.rating}
                      onChange={(e) =>
                        setEditReviewForm({
                          ...editReviewForm,
                          rating: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}점
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editReviewForm.content}
                      onChange={(e) =>
                        setEditReviewForm({
                          ...editReviewForm,
                          content: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateReviewMutation.isPending}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingReviewId(null)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{review.user?.name ?? '사용자'}</span>
                      <span className="text-amber-600">★ {review.rating}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{review.content}</p>
                    {user?._id === review.user?._id && (
                      <button
                        type="button"
                        onClick={() => startEditReview(review)}
                        className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        수정
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Q&A</h2>
          {isEnrolled && (
            <form onSubmit={handleQna} className="mb-5 space-y-3">
              <input
                value={qnaForm.title}
                onChange={(e) => setQnaForm({ ...qnaForm, title: e.target.value })}
                placeholder="질문 제목"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={qnaForm.content}
                onChange={(e) => setQnaForm({ ...qnaForm, content: e.target.value })}
                placeholder="질문 내용"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">질문 등록</button>
            </form>
          )}
          <div className="space-y-3">
            {qnaData?.posts.map((post) => (
              <div key={post._id} className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{post.title}</p>
                  {post.isResolved && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">답변 완료</span>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{post.content}</p>
                {post.comments?.length ? (
                  <div className="mt-3 space-y-2">
                    {post.comments.map((comment) => (
                      <div
                        key={comment._id}
                        className={`rounded-xl px-3 py-2 text-sm ${
                          comment.isInstructor
                            ? 'bg-indigo-50 text-indigo-900'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                          <span>{comment.user?.name ?? '사용자'}</span>
                          {comment.isInstructor && (
                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-white">
                              강사 답변
                            </span>
                          )}
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {user && (isEnrolled || user.role !== 'student') && (
                  <form
                    onSubmit={(e) => handleComment(e, post._id)}
                    className="mt-3 flex gap-2"
                  >
                    <input
                      value={commentForms[post._id] ?? ''}
                      onChange={(e) =>
                        setCommentForms((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      placeholder={
                        user.role === 'instructor' || user.role === 'admin'
                          ? '답변을 입력하세요'
                          : '댓글을 입력하세요'
                      }
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={commentMutation.isPending}
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {user.role === 'instructor' || user.role === 'admin' ? '답변' : '댓글'}
                    </button>
                  </form>
                )}
              </div>
            ))}
            {!user && <p className="text-sm text-slate-400">로그인 후 Q&A를 확인할 수 있습니다.</p>}
          </div>
        </section>
      </div>

      {isEnrolled && (
        <section className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">모의고사</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {exams?.map((exam) => (
              <Link key={exam._id} to={`/exams/${exam._id}`} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
                <p className="font-semibold text-slate-900">{exam.title}</p>
                <p className="mt-1 text-sm text-slate-500">{exam.questionCount ?? 0}문항 · {exam.timeLimit ?? '무제한'}분</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
