import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface ResultData {
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  status: 'passed' | 'failed';
  passingScore: number;
}

export default function PublicTestResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem(`test_${slug}_result`);
    if (!data) {
      navigate(`/t/${slug}`);
      return;
    }
    setResult(JSON.parse(data));
  }, [slug]);

  if (!result) return null;

  const passed = result.status === 'passed';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-semibold text-slate-900">SafeTest</span>
        </div>

        <div className="card overflow-hidden">
          {/* Result header */}
          <div
            className={`px-8 py-10 text-center ${passed ? 'bg-success-50' : 'bg-danger-50'}`}
          >
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                passed ? 'bg-success-100' : 'bg-danger-100'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-10 w-10 text-success-600" />
              ) : (
                <XCircle className="h-10 w-10 text-danger-600" />
              )}
            </div>
            <h1 className={`text-2xl font-bold ${passed ? 'text-success-700' : 'text-danger-700'}`}>
              {passed ? 'Тест пройден' : 'Тест не пройден'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {passed ? 'Поздравляем!' : 'Попробуйте ещё раз'}
            </p>
          </div>

          {/* Score */}
          <div className="px-8 py-8">
            <div className="mb-6 text-center">
              <p className="text-5xl font-bold text-slate-900">{result.score}%</p>
              <p className="mt-2 text-sm text-slate-500">
                {result.correctAnswers} из {result.totalQuestions} правильных ответов
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Правильных ответов</span>
                <span className="text-sm font-semibold text-slate-900">
                  {result.correctAnswers} / {result.totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Проходной балл</span>
                <span className="text-sm font-semibold text-slate-900">{result.passingScore}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Ваш результат</span>
                <span
                  className={`text-sm font-semibold ${passed ? 'text-success-600' : 'text-danger-600'}`}
                >
                  {result.score}%
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-primary-50 px-4 py-3 text-center text-sm text-primary-700">
              Результат сохранён и доступен руководителю.
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem(`test_${slug}_user`);
              sessionStorage.removeItem(`test_${slug}_result`);
              navigate(`/t/${slug}`);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </button>
        </div>
      </div>
    </div>
  );
}
