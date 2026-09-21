import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Test, TestAttempt } from '@/lib/types';
import {
  ClipboardList,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

interface TestWithStats extends Test {
  question_count: number;
  attempt_count: number;
  passed_count: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTests: 0,
    totalAttempts: 0,
    passed: 0,
    failed: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: testData } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!testData) {
      setLoading(false);
      return;
    }

    const testIds = testData.map((t) => t.id);

    const [questionsRes, attemptsRes] = await Promise.all([
      supabase.from('questions').select('test_id'),
      supabase.from('test_attempts').select('test_id, status'),
    ]);

    const questionCounts = new Map<string, number>();
    (questionsRes.data ?? []).forEach((q) => {
      questionCounts.set(q.test_id, (questionCounts.get(q.test_id) ?? 0) + 1);
    });

    const allAttempts = (attemptsRes.data ?? []) as Pick<TestAttempt, 'test_id' | 'status'>[];
    const attemptCounts = new Map<string, number>();
    const passedCounts = new Map<string, number>();
    allAttempts.forEach((a) => {
      attemptCounts.set(a.test_id, (attemptCounts.get(a.test_id) ?? 0) + 1);
      if (a.status === 'passed') passedCounts.set(a.test_id, (passedCounts.get(a.test_id) ?? 0) + 1);
    });

    const testsWithStats: TestWithStats[] = testData.map((t) => ({
      ...t,
      question_count: questionCounts.get(t.id) ?? 0,
      attempt_count: attemptCounts.get(t.id) ?? 0,
      passed_count: passedCounts.get(t.id) ?? 0,
    }));

    setTests(testsWithStats);
    setStats({
      totalTests: testData.length,
      totalAttempts: allAttempts.length,
      passed: allAttempts.filter((a) => a.status === 'passed').length,
      failed: allAttempts.filter((a) => a.status === 'failed').length,
    });
    setLoading(false);
  };

  const copyLink = async (e: React.MouseEvent, slug: string, testId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/t/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(testId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statCards = [
    {
      label: 'Всего тестов',
      value: stats.totalTests,
      icon: ClipboardList,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      label: 'Всего прохождений',
      value: stats.totalAttempts,
      icon: Users,
      color: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Успешно прошли',
      value: stats.passed,
      icon: CheckCircle2,
      color: 'bg-success-50 text-success-600',
    },
    {
      label: 'Не прошли',
      value: stats.failed,
      icon: XCircle,
      color: 'bg-danger-50 text-danger-600',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Обзор тестов и результатов проверки знаний сотрудников</p>
        </div>
        <button onClick={() => navigate('/tests/new')} className="btn-primary">
          <Plus className="h-4 w-4" />
          Создать тест
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Мои тесты</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        </div>
      ) : tests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-slate-900">У вас пока нет тестов</h3>
          <p className="mb-6 max-w-sm text-sm text-slate-500">
            Создайте первый тест по технике безопасности и отправьте его сотрудникам
          </p>
          <button onClick={() => navigate('/tests/new')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Создать первый тест
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <Link
              key={test.id}
              to={`/tests/${test.id}`}
              className="card group flex items-center gap-4 p-5 transition-all hover:shadow-md hover:border-primary-200"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{test.title}</h3>
                  <span className={`badge ${test.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                    {test.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{test.question_count} вопросов</span>
                  <span>Проходной балл: {test.passing_score}%</span>
                  <span>{test.attempt_count} прохождений</span>
                  {test.attempt_count > 0 && (
                    <span className="text-success-600">
                      {Math.round((test.passed_count / test.attempt_count) * 100)}% успешно
                    </span>
                  )}
                  <span>{formatDate(test.created_at)}</span>
                </div>
              </div>

              {test.status === 'published' && (
                <button
                  onClick={(e) => copyLink(e, test.public_slug, test.id)}
                  className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:flex"
                >
                  {copiedId === test.id ? (
                    <>
                      <Check className="h-4 w-4 text-success-600" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Копировать ссылку
                    </>
                  )}
                </button>
              )}

              <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
