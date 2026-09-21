import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, HelpCircle, Target, ArrowRight, AlertCircle } from 'lucide-react';

export default function PublicTestStartPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState<{
    id: string;
    title: string;
    description: string | null;
    passing_score: number;
    question_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTest();
  }, [slug]);

  const loadTest = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_test_for_public', { p_slug: slug });

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setTestInfo(data.test);
    setLoading(false);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Введите имя и фамилию');
      return;
    }

    sessionStorage.setItem(
      `test_${slug}_user`,
      JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() })
    );
    navigate(`/t/${slug}/take`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-danger-50">
            <AlertCircle className="h-7 w-7 text-danger-600" />
          </div>
          <h1 className="mb-2 text-lg font-semibold text-slate-900">Тест не найден</h1>
          <p className="text-sm text-slate-500">
            Возможно, ссылка недействительна или тест ещё не опубликован.
          </p>
        </div>
      </div>
    );
  }

  if (!testInfo) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-semibold text-slate-900">SafeTest</span>
        </div>

        <div className="card p-8">
          <h1 className="mb-2 text-xl font-bold text-slate-900">{testInfo.title}</h1>
          {testInfo.description && <p className="mb-6 text-sm text-slate-600">{testInfo.description}</p>}

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <HelpCircle className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-lg font-bold text-slate-900">{testInfo.question_count}</p>
                <p className="text-xs text-slate-500">вопросов</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <Target className="h-5 w-5 text-success-600" />
              <div>
                <p className="text-lg font-bold text-slate-900">{testInfo.passing_score}%</p>
                <p className="text-xs text-slate-500">проходной балл</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
            Введите свои данные, чтобы начать тест. Ответы отправятся руководителю автоматически.
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>
          )}

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                className="input-field text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Петров"
                className="input-field text-base"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-base">
              Начать тест
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Результат будет автоматически отправлен руководителю
        </p>
      </div>
    </div>
  );
}
