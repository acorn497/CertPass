import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '../api/instructor';
import { coursesApi } from '../api/courses';

type EpisodeDraft = { title: string; videoUrl: string; duration: string };
const emptyEpisodeDraft: EpisodeDraft = { title: '', videoUrl: '', duration: '' };

export function InstructorPage() {
  const queryClient = useQueryClient();
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});
  const [sectionTitleDrafts, setSectionTitleDrafts] = useState<Record<string, string>>({});
  const [episodeDrafts, setEpisodeDrafts] = useState<Record<string, EpisodeDraft>>({});
  const [episodeEditDrafts, setEpisodeEditDrafts] = useState<Record<string, EpisodeDraft>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    examName: '',
    level: 'beginner' as const,
    price: '0',
    thumbnail: '',
  });

  const refreshCourses = () => queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => instructorApi.courses().then((r) => r.data.data),
  });
  const { data: unanswered } = useQuery({
    queryKey: ['instructor-unanswered-qna'],
    queryFn: () => instructorApi.unansweredQna().then((r) => r.data.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => coursesApi.getCategories().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      instructorApi.createCourse({
        ...form,
        price: Number(form.price),
        thumbnail: form.thumbnail || null,
      }),
    onSuccess: () => {
      setForm({
        title: '',
        description: '',
        categoryId: '',
        examName: '',
        level: 'beginner',
        price: '0',
        thumbnail: '',
      });
      refreshCourses();
    },
  });

  const sectionMutation = useMutation({
    mutationFn: ({ courseId, title }: { courseId: string; title: string }) =>
      instructorApi.createSection(courseId, { title, order: Date.now() }),
    onSuccess: (_res, variables) => {
      setSectionDrafts((current) => ({ ...current, [variables.courseId]: '' }));
      refreshCourses();
    },
  });
  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, price }: { courseId: string; price: number }) =>
      instructorApi.updateCourse(courseId, { price }),
    onSuccess: refreshCourses,
  });
  const resubmitMutation = useMutation({
    mutationFn: (courseId: string) => instructorApi.resubmitCourse(courseId),
    onSuccess: refreshCourses,
  });
  const updateSectionMutation = useMutation({
    mutationFn: ({ courseId, sectionId, title }: { courseId: string; sectionId: string; title: string }) =>
      instructorApi.updateSection(courseId, sectionId, { title }),
    onSuccess: refreshCourses,
  });
  const removeSectionMutation = useMutation({
    mutationFn: ({ courseId, sectionId }: { courseId: string; sectionId: string }) =>
      instructorApi.removeSection(courseId, sectionId),
    onSuccess: refreshCourses,
  });
  const createEpisodeMutation = useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      draft,
    }: {
      courseId: string;
      sectionId: string;
      draft: EpisodeDraft;
    }) =>
      instructorApi.createEpisode(courseId, sectionId, {
        title: draft.title,
        videoUrl: draft.videoUrl,
        duration: Number(draft.duration),
        order: Date.now(),
      }),
    onSuccess: (_res, variables) => {
      setEpisodeDrafts((current) => ({ ...current, [variables.sectionId]: emptyEpisodeDraft }));
      refreshCourses();
    },
  });
  const updateEpisodeMutation = useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      episodeId,
      draft,
    }: {
      courseId: string;
      sectionId: string;
      episodeId: string;
      draft: EpisodeDraft;
    }) =>
      instructorApi.updateEpisode(courseId, sectionId, episodeId, {
        title: draft.title,
        videoUrl: draft.videoUrl,
        duration: Number(draft.duration),
      }),
    onSuccess: refreshCourses,
  });
  const removeEpisodeMutation = useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      episodeId,
    }: {
      courseId: string;
      sectionId: string;
      episodeId: string;
    }) => instructorApi.removeEpisode(courseId, sectionId, episodeId),
    onSuccess: refreshCourses,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">강사 대시보드</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">강의 등록</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="시험명" value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} />
          <select className="rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">카테고리 선택</option>
            {categories?.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as typeof form.level })}>
            <option value="beginner">입문</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
          <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="가격" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="썸네일 URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={createMutation.isPending || !form.categoryId}>
          {createMutation.isPending ? '등록 중...' : '승인 요청'}
        </button>
      </form>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">응답 대기 Q&A</h2>
        <div className="space-y-3">
          {unanswered?.length ? unanswered.map((post) => (
            <div key={post._id} className="border-b border-slate-100 pb-3">
              <p className="text-sm font-medium text-slate-900">{post.title}</p>
              <p className="mt-1 text-xs text-slate-500">{post.course?.title ?? '강의'} · 댓글 {post.commentCount}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.content}</p>
            </div>
          )) : <p className="text-sm text-slate-500">답변 대기 중인 질문이 없습니다.</p>}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        {courses?.map((course) => (
          <div key={course._id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{course.title}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  course.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : course.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}
              >
                {course.status === 'approved'
                  ? '승인됨'
                  : course.status === 'rejected'
                    ? '반려됨'
                    : '승인 대기'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{course.examName}</p>

            {course.status === 'rejected' && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                <p className="text-xs text-rose-700">
                  관리자에게 반려된 강의입니다. 내용을 수정한 뒤 다시 신청할 수 있어요.
                </p>
                <button
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={resubmitMutation.isPending}
                  onClick={() => resubmitMutation.mutate(course._id)}
                >
                  {resubmitMutation.isPending ? '신청 중...' : '다시 신청'}
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>수강생 {course.enrollmentCount ?? 0}</span>
              <span>★ {(course.avgRating ?? 0).toFixed(1)}</span>
              <span>리뷰 {course.reviewCount ?? 0}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <input className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" type="number" min="0" value={priceDrafts[course._id] ?? String(course.price ?? 0)} onChange={(e) => setPriceDrafts({ ...priceDrafts, [course._id]: e.target.value })} />
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => updateCourseMutation.mutate({ courseId: course._id, price: Number(priceDrafts[course._id] ?? course.price ?? 0) })}>가격 저장</button>
            </div>

            <div className="mt-4 flex gap-2">
              <input className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="새 섹션 제목" value={sectionDrafts[course._id] ?? ''} onChange={(e) => setSectionDrafts({ ...sectionDrafts, [course._id]: e.target.value })} />
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={!sectionDrafts[course._id] || sectionMutation.isPending} onClick={() => sectionMutation.mutate({ courseId: course._id, title: sectionDrafts[course._id] })}>섹션 추가</button>
            </div>

            <div className="mt-4 space-y-4">
              {course.sections?.map((section) => {
                const sectionDraft = episodeDrafts[section._id] ?? emptyEpisodeDraft;
                return (
                  <div key={section._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex gap-2">
                      <input className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" value={sectionTitleDrafts[section._id] ?? section.title} onChange={(e) => setSectionTitleDrafts({ ...sectionTitleDrafts, [section._id]: e.target.value })} />
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => updateSectionMutation.mutate({ courseId: course._id, sectionId: section._id, title: sectionTitleDrafts[section._id] ?? section.title })}>저장</button>
                      <button className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => removeSectionMutation.mutate({ courseId: course._id, sectionId: section._id })}>삭제</button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {section.episodes.map((episode) => {
                        const editDraft = episodeEditDrafts[episode._id] ?? { title: episode.title, videoUrl: episode.videoUrl, duration: String(episode.duration) };
                        return (
                          <div key={episode._id} className="grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[1fr_1fr_88px_auto_auto]">
                            <input className="rounded-md border border-slate-200 px-2 py-1 text-xs" value={editDraft.title} onChange={(e) => setEpisodeEditDrafts({ ...episodeEditDrafts, [episode._id]: { ...editDraft, title: e.target.value } })} />
                            <input className="rounded-md border border-slate-200 px-2 py-1 text-xs" value={editDraft.videoUrl} onChange={(e) => setEpisodeEditDrafts({ ...episodeEditDrafts, [episode._id]: { ...editDraft, videoUrl: e.target.value } })} />
                            <input className="rounded-md border border-slate-200 px-2 py-1 text-xs" type="number" min="0" value={editDraft.duration} onChange={(e) => setEpisodeEditDrafts({ ...episodeEditDrafts, [episode._id]: { ...editDraft, duration: e.target.value } })} />
                            <button className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold" onClick={() => updateEpisodeMutation.mutate({ courseId: course._id, sectionId: section._id, episodeId: episode._id, draft: editDraft })}>저장</button>
                            <button className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => removeEpisodeMutation.mutate({ courseId: course._id, sectionId: section._id, episodeId: episode._id })}>삭제</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_88px_auto]">
                      <input className="rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="에피소드 제목" value={sectionDraft.title} onChange={(e) => setEpisodeDrafts({ ...episodeDrafts, [section._id]: { ...sectionDraft, title: e.target.value } })} />
                      <input className="rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="YouTube ID 또는 URL" value={sectionDraft.videoUrl} onChange={(e) => setEpisodeDrafts({ ...episodeDrafts, [section._id]: { ...sectionDraft, videoUrl: e.target.value } })} />
                      <input className="rounded-lg border border-slate-200 px-3 py-2 text-xs" type="number" min="0" placeholder="초" value={sectionDraft.duration} onChange={(e) => setEpisodeDrafts({ ...episodeDrafts, [section._id]: { ...sectionDraft, duration: e.target.value } })} />
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={!sectionDraft.title || !sectionDraft.videoUrl || !sectionDraft.duration} onClick={() => createEpisodeMutation.mutate({ courseId: course._id, sectionId: section._id, draft: sectionDraft })}>에피소드 추가</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
