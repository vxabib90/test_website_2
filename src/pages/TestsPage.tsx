import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Test } from '@/lib/types';
import { Plus, FileText, Copy, Check, ChevronRight, Pencil } from 'lucide-react';

interface TestWithStats extends Test {
  question_count: number;
  attempt_count: number;
  passed_count: number;
}

export default function TestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { data: testData } = await supabase.from('tests').select('*').order('created_at', { ascending: false });

    if (!testData) {
      setLoading(false);
      return;
    }

    const testIds = testData.map((t) => t.id);
    const [questionsRes, attemptsRes] = await Promise.all([
      supabase.from('questions').select('test_id'),
      supabase.from('test_attempts').select('test_id, status'),
    ]);

    const qCounts = new Map<string, number>();
    (questionsRes.data ?? []).forEach((q) => qCounts.set(q.test_id, (qCounts.get(q.test_id) ?? 0) + 1));

    const aCounts = new Map<string, number>();
    const pCounts = new Map<string, number>();
    (attemptsRes.data ?? []).forEach((a) => {
      aCounts.set(a.test_id, (aCounts.get(a.test_id) ?? 0) + 1);
      if (a.status === 'passed') pCounts.set(a.test_id, (pCounts.get(a.test_id) ?? 0) + 1);
    });

    setTests(
      testData.map((t) => ({
        ...t,
        question_count: qCounts.get(t.id) ?? 0,
        attempt_count: aCounts.get(t.id) ?? 0,
        passed_count: pCounts.get(t.id) ?? 0,
      }))
    );
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Тесты</h1>
          <p className="mt-1 text-sm text-slate-500">Управление тестами по технике безопасности</p>
        </div>
        <button onClick={() => navigate('/tests/new')} className="btn-primary">
          <Plus className="h-4 w-4" />
          Создать тест
        </button>
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
            <div key={test.id} className="card group p-5">
              <div className="flex items-center gap-4">
                <Link to={`/tests/${test.id}`} className="min-w-0 flex-1">
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
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/tests/${test.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Редактировать</span>
                  </Link>
                  {test.status === 'published' && (
                    <button
                      onClick={(e) => copyLink(e, test.public_slug, test.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      {copiedId === test.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="hidden sm:inline">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Копировать ссылку</span>
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    to={`/tests/${test.id}`}
                    className="flex items-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
