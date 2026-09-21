import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Test, Question, AnswerOption, TestAttempt } from '@/lib/types';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';

type Tab = 'questions' | 'results';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<(Question & { options: AnswerOption[] })[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('questions');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTest();
  }, [id]);

  const loadTest = async () => {
    setLoading(true);

    const { data: testData } = await supabase.from('tests').select('*').eq('id', id).maybeSingle();
    if (!testData) {
      setLoading(false);
      return;
    }
    setTest(testData);

    const [qRes, aRes] = await Promise.all([
      supabase.from('questions').select('*').eq('test_id', id).order('order', { ascending: true }),
      supabase.from('test_attempts').select('*').eq('test_id', id).order('completed_at', { ascending: false }),
    ]);

    const dbQuestions = (qRes.data ?? []) as Question[];
    const dbAttempts = (aRes.data ?? []) as TestAttempt[];

    const questionsWithOptions: (Question & { options: AnswerOption[] })[] = [];
    for (const q of dbQuestions) {
      const { data: options } = await supabase
        .from('answer_options')
        .select('*')
        .eq('question_id', q.id)
        .order('order', { ascending: true });
      questionsWithOptions.push({ ...q, options: (options ?? []) as AnswerOption[] });
    }

    setQuestions(questionsWithOptions);
    setAttempts(dbAttempts);
    setLoading(false);
  };

  const copyLink = async () => {
    if (!test) return;
    const url = `${window.location.origin}/t/${test.public_slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">Тест не найден</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary-600">
          Вернуться на Dashboard
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к Dashboard
      </Link>

      {/* Header */}
      <div className="card mb-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{test.title}</h1>
              <span className={`badge ${test.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                {test.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
            {test.description && <p className="mb-3 text-sm text-slate-500">{test.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{questions.length} вопросов</span>
              <span>Проходной балл: {test.passing_score}%</span>
              <span>{attempts.length} прохождений</span>
              <span>Создан: {formatDate(test.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={`/tests/${test.id}/edit`} className="btn-secondary text-sm">
              Редактировать
            </Link>
          </div>
        </div>

        {test.status === 'published' && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-0.5 text-xs font-medium text-slate-500">Публичная ссылка на тест</p>
              <p className="truncate text-sm font-medium text-slate-700">
                {window.location.origin}/t/{test.public_slug}
              </p>
            </div>
            <button onClick={copyLink} className="btn-primary shrink-0 text-sm">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Скопировать ссылку
                </>
              )}
            </button>
          </div>
        )}

        {test.status === 'draft' && (
          <div className="mt-4 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
            Тест в черновике. Опубликуйте его, чтобы получить ссылку для сотрудников.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('questions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'questions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Вопросы
        </button>
        <button
          onClick={() => setTab('results')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'results'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Результаты
          {attempts.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {attempts.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'questions' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="card px-6 py-12 text-center text-sm text-slate-500">
              В тесте пока нет вопросов. Отредактируйте тест, чтобы добавить вопросы.
            </div>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} className="card p-6">
                <div className="mb-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-600">
                    {i + 1}
                  </div>
                  <h3 className="pt-0.5 text-sm font-semibold text-slate-900">{q.text}</h3>
                </div>
                <div className="space-y-2 pl-10">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                        opt.is_correct ? 'bg-success-50 text-success-700' : 'text-slate-600'
                      }`}
                    >
                      {opt.is_correct ? (
                        <CheckCircle2 className="h-4 w-4 text-success-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={opt.is_correct ? 'font-medium' : ''}>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'results' && (
        <div>
          {attempts.length === 0 ? (
            <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-slate-900">Этот тест пока никто не проходил</h3>
              <p className="mb-6 max-w-sm text-sm text-slate-500">
                Скопируйте ссылку и отправьте её сотрудникам
              </p>
              {test.status === 'published' && (
                <button onClick={copyLink} className="btn-primary">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Скопировать ссылку
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-medium">Имя</th>
                      <th className="px-4 py-3 font-medium">Фамилия</th>
                      <th className="px-4 py-3 font-medium">Дата</th>
                      <th className="px-4 py-3 font-medium">Результат</th>
                      <th className="px-4 py-3 font-medium">Статус</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{attempt.employee_first_name}</td>
                        <td className="px-4 py-3 text-slate-700">{attempt.employee_last_name}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(attempt.completed_at)}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {attempt.correct_answers}/{attempt.total_questions}
                          </span>
                          <span className="ml-1.5 text-slate-500">({attempt.score}%)</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${attempt.status === 'passed' ? 'badge-passed' : 'badge-failed'}`}>
                            {attempt.status === 'passed' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Failed
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/tests/${test.id}/attempts/${attempt.id}`)}
                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Подробнее
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
