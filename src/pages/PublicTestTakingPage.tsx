import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { PublicTest, PublicQuestion } from '@/lib/types';
import { ShieldCheck, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';

export default function PublicTestTakingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<PublicTest | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTest();
  }, [slug]);

  const loadTest = async () => {
    const userData = sessionStorage.getItem(`test_${slug}_user`);
    if (!userData) {
      navigate(`/t/${slug}`);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_test_for_public', { p_slug: slug });

    if (error || !data) {
      setLoading(false);
      return;
    }

    setTestData(data);
    setQuestions(data.questions ?? []);
    setLoading(false);
  };

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const userData = JSON.parse(sessionStorage.getItem(`test_${slug}_user`) ?? '{}');

    const answersArray = questions.map((q) => ({
      question_id: q.id,
      selected_answer_id: answers[q.id],
    }));

    const { data, error } = await supabase.rpc('submit_test', {
      p_test_id: testData!.test.id,
      p_first_name: userData.firstName,
      p_last_name: userData.lastName,
      p_answers: answersArray,
    });

    if (error || !data) {
      setError('Ошибка при отправке теста. Попробуйте ещё раз.');
      setSubmitting(false);
      return;
    }

    sessionStorage.setItem(
      `test_${slug}_result`,
      JSON.stringify({
        attemptId: data.id,
        score: data.score,
        correctAnswers: data.correct_answers,
        totalQuestions: data.total_questions,
        status: data.status,
        passingScore: testData!.test.passing_score,
      })
    );

    navigate(`/t/${slug}/result`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm text-slate-500">Тест недоступен</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const selectedOption = answers[currentQuestion.id];
  const isLast = currentIdx === questions.length - 1;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 truncate">{testData.test.title}</span>
            </div>
            <span className="text-sm font-medium text-slate-500">
              {currentIdx + 1} из {questions.length}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="flex flex-1 flex-col px-4 py-6">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <div className="mb-2 text-sm font-medium text-primary-600">
            Вопрос {currentIdx + 1}
          </div>
          <h1 className="mb-6 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            {currentQuestion.text}
          </h1>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(currentQuestion.id, option.id)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className={`text-base ${isSelected ? 'font-medium text-primary-900' : 'text-slate-700'}`}>
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-auto w-full max-w-2xl mt-4">
            <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>
          </div>
        )}

        {/* Navigation */}
        <div className="mx-auto w-full max-w-2xl pt-6">
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
              Назад
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedOption || submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Завершить тест
                    <Check className="h-5 w-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!selectedOption}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
