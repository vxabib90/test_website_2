import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { TestAttempt, AttemptAnswer, Question, AnswerOption } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
} from 'lucide-react';

interface QuestionDetail extends Question {
  options: AnswerOption[];
  selected: AnswerOption | null;
  is_correct: boolean;
}

export default function AttemptDetailPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    setLoading(true);

    const { data: attemptData } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();

    if (!attemptData) {
      setLoading(false);
      return;
    }
    setAttempt(attemptData);

    const { data: testData } = await supabase.from('tests').select('title').eq('id', id).maybeSingle();
    setTestTitle(testData?.title ?? '');

    const { data: answers } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    const { data: dbQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', id)
      .order('order', { ascending: true });

    const questionsDetail: QuestionDetail[] = [];
    for (const q of (dbQuestions ?? []) as Question[]) {
      const { data: options } = await supabase
        .from('answer_options')
        .select('*')
        .eq('question_id', q.id)
        .order('order', { ascending: true });

      const answer = (answers ?? []).find((a) => a.question_id === q.id);
      const selected = (options ?? []).find((o) => o.id === answer?.selected_answer_id) ?? null;

      questionsDetail.push({
        ...q,
        options: (options ?? []) as AnswerOption[],
        selected,
        is_correct: answer?.is_correct ?? false,
      });
    }

    setQuestions(questionsDetail);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-slate-500">Результат не найден</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary-600">
          Вернуться на Dashboard
        </Link>
      </div>
    );
  }

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={`/tests/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к тесту
      </Link>

      {/* Summary */}
      <div className="card mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {attempt.employee_first_name} {attempt.employee_last_name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{testTitle}</p>
          </div>
          <span className={`badge ${attempt.status === 'passed' ? 'badge-passed' : 'badge-failed'} text-sm`}>
            {attempt.status === 'passed' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Passed
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Failed
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5" />
              Имя
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{attempt.employee_first_name}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5" />
              Фамилия
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{attempt.employee_last_name}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              Дата
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(attempt.completed_at)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Результат</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {attempt.correct_answers}/{attempt.total_questions} ({attempt.score}%)
            </p>
          </div>
        </div>
      </div>

      {/* Questions review */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Ответы на вопросы</h2>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-semibold text-primary-600">
                {i + 1}
              </div>
              <h3 className="flex-1 text-sm font-semibold text-slate-900">{q.text}</h3>
              <span
                className={`badge ${q.is_correct ? 'badge-passed' : 'badge-failed'}`}
              >
                {q.is_correct ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Correct
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Incorrect
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2 pl-9">
              {q.options.map((opt) => {
                const isSelected = q.selected?.id === opt.id;
                const isCorrectOpt = opt.is_correct;

                let className = 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ';
                if (isCorrectOpt) {
                  className += 'bg-success-50 text-success-700';
                } else if (isSelected && !isCorrectOpt) {
                  className += 'bg-danger-50 text-danger-700';
                } else {
                  className += 'text-slate-500';
                }

                return (
                  <div key={opt.id} className={className}>
                    {isCorrectOpt ? (
                      <CheckCircle2 className="h-4 w-4 text-success-600" />
                    ) : isSelected ? (
                      <XCircle className="h-4 w-4 text-danger-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                    )}
                    <span className={isCorrectOpt || isSelected ? 'font-medium' : ''}>{opt.text}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs font-medium text-slate-400">Ответ сотрудника</span>
                    )}
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
