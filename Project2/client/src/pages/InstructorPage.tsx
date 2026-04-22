import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '../api/instructor';
import { coursesApi } from '../api/courses';

export function InstructorPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    examName: '',
    level: 'beginner' as const,
    thumbnail: '',
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => instructorApi.courses().then((r) => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => coursesApi.getCategories().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      instructorApi.createCourse({
        ...form,
        thumbnail: form.thumbnail || null,
      }),
    onSuccess: () => {
      setForm({
        title: '',
        description: '',
        categoryId: '',
        examName: '',
        level: 'beginner',
        thumbnail: '',
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
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
            {categories?.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          <select className="rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as typeof form.level })}>
            <option value="beginner">입문</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
          <input className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="썸네일 URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={createMutation.isPending || !form.categoryId}>
          {createMutation.isPending ? '등록 중...' : '승인 요청'}
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {courses?.map((course) => (
          <div key={course._id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{course.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{course.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{course.examName}</p>
            <div className="mt-4 flex gap-4 text-sm text-slate-500">
              <span>수강생 {course.enrollmentCount ?? 0}</span>
              <span>★ {(course.avgRating ?? 0).toFixed(1)}</span>
              <span>리뷰 {course.reviewCount ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
