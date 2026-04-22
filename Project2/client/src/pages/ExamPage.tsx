import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { examsApi } from '../api/exams';

export function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<unknown>(null);
  const { data: questions } = useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: () => examsApi.getQuestions(examId!).then((r) => r.data.data),
    enabled: !!examId,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      examsApi.submit(
        examId!,
        Object.entries(answers).map(([questionId, selected]) => ({
          questionId,
          selected,
        })),
      ),
    onSuccess: (res) => setResult(res.data.data),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">모의고사</h1>
      <div className="space-y-5">
        {questions?.map((question) => (
          <div key={question._id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="font-semibold text-slate-900">{question.order}. {question.content}</p>
            <div className="mt-4 grid gap-2">
              {question.options.map((option, index) => (
                <label key={option} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <input type="radio" name={question._id} checked={answers[question._id] === index} onChange={() => setAnswers({ ...answers, [question._id]: index })} />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">제출</button>
      {result ? (
        <pre className="mt-6 overflow-auto rounded-2xl bg-slate-900 p-5 text-sm text-white">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}
