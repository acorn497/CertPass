import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { operationsApi } from '../api/operations';

export function OperationsPage() {
  const [email, setEmail] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => operationsApi.health().then((r) => r.data.data),
  });
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => operationsApi.metrics().then((r) => r.data.data),
  });

  const emailMutation = useMutation({
    mutationFn: () => operationsApi.subscribeEmail({ email, topics: ['course_updates', 'qna_digest'] }),
  });
  const discordMutation = useMutation({
    mutationFn: () => operationsApi.subscribeDiscord({ webhookUrl: discordUrl, topics: ['qna_digest'] }),
  });
  const webhookMutation = useMutation({
    mutationFn: () =>
      operationsApi.sendWebhook({
        url: webhookUrl,
        eventType: 'p3.test',
        payload: { source: 'operations-page', sentAt: new Date().toISOString() },
      }),
  });
  const digestMutation = useMutation({ mutationFn: () => operationsApi.runDigest() });
  const examDdayMutation = useMutation({ mutationFn: () => operationsApi.runExamDday() });
  const cleanupMutation = useMutation({ mutationFn: () => operationsApi.runCleanup() });

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    emailMutation.mutate();
  };

  const submitDiscord = (event: FormEvent) => {
    event.preventDefault();
    discordMutation.mutate();
  };

  const submitWebhook = (event: FormEvent) => {
    event.preventDefault();
    webhookMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">운영 콘솔</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">상태</h2>
          <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify({ health, metrics }, null, 2)}
          </pre>
        </section>

        <section className="space-y-4">
          <form onSubmit={submitEmail} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">이메일 구독</h2>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">구독</button>
          </form>

          <form onSubmit={submitDiscord} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Discord 웹훅 구독</h2>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://discord.com/api/webhooks/..." value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">연결</button>
          </form>

          <form onSubmit={submitWebhook} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">발신 웹훅 테스트</h2>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://example.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">전송</button>
          </form>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900">배치 실행</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => digestMutation.mutate()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">학습 알림</button>
              <button onClick={() => examDdayMutation.mutate()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">D-day 알림</button>
              <button onClick={() => cleanupMutation.mutate()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">캐시 정리</button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
