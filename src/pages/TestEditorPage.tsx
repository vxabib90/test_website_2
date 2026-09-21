import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send,
  GripVertical,
  Check,
  AlertCircle,
} from 'lucide-react';

interface QuestionDraft {
  id?: string;
  text: string;
  options: { id?: string; text: string; is_correct: boolean }[];
  isNew?: boolean;
}

export default function TestEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(80);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setQuestions([
        { text: '', options: ['', '', '', ''].map((t) => ({ text: t, is_correct: false })), isNew: true },
      ]);
      return;
    }
    loadTest();
  }, [id]);

  const loadTest = async () => {
    setLoading(true);
    const { data: test } = await supabase.from('tests').select('*').eq('id', id).maybeSingle();
    if (!test) {
      setError('Тест не найден');
      setLoading(false);
      return;
    }

    setTitle(test.title);
    setDescription(test.description ?? '');
    setPassingScore(test.passing_score);

    const { data: dbQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', id)
      .order('order', { ascending: true });

    if (!dbQuestions || dbQuestions.length === 0) {
      setQuestions([
        { text: '', options: ['', '', '', ''].map((t) => ({ text: t, is_correct: false })), isNew: true },
      ]);
      setLoading(false);
      return;
    }

    const questionsWithOptions: QuestionDraft[] = [];
    for (const q of dbQuestions) {
      const { data: options } = await supabase
        .from('answer_options')
        .select('*')
        .eq('question_id', q.id)
        .order('order', { ascending: true });

      questionsWithOptions.push({
        id: q.id,
        text: q.text,
        options: (options ?? []).map((o) => ({ id: o.id, text: o.text, is_correct: o.is_correct })),
      });
    }

    setQuestions(questionsWithOptions);
    setLoading(false);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''].map(() => ({ text: '', is_correct: false })), isNew: true },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = text;
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
      ...o,
      is_correct: i === oIndex,
    }));
    setQuestions(updated);
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Укажите название теста';
    if (passingScore < 0 || passingScore > 100) return 'Проходной балл должен быть от 0 до 100';
    if (questions.length === 0) return 'Добавьте хотя бы один вопрос';
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) return `Вопрос ${i + 1}: заполните текст вопроса`;
      const hasCorrect = questions[i].options.some((o) => o.is_correct);
      if (!hasCorrect) return `Вопрос ${i + 1}: отметьте правильный ответ`;
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].text.trim())
          return `Вопрос ${i + 1}, вариант ${j + 1}: заполните текст ответа`;
      }
    }
    return null;
  };

  const saveTest = async (publish: boolean) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setPublishTarget(publish);

    try {
      let testId = id;

      if (isEditing && testId) {
        const { error: updateErr } = await supabase
          .from('tests')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            passing_score: passingScore,
            status: publish ? 'published' : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', testId);
        if (updateErr) throw updateErr;

        // Delete existing questions and options, re-insert
        const { data: oldQuestions } = await supabase
          .from('questions')
          .select('id')
          .eq('test_id', testId);
        if (oldQuestions && oldQuestions.length > 0) {
          await supabase.from('answer_options').delete().in(
            'question_id',
            oldQuestions.map((q) => q.id)
          );
          await supabase.from('questions').delete().in(
            'id',
            oldQuestions.map((q) => q.id)
          );
        }
      } else {
        const { data: newTest, error: insertErr } = await supabase
          .from('tests')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            passing_score: passingScore,
            status: publish ? 'published' : 'draft',
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        testId = newTest.id;
      }

      // Insert questions and options
      for (let i = 0; i < questions.length; i++) {
        const { data: newQuestion, error: qErr } = await supabase
          .from('questions')
          .insert({
            test_id: testId,
            text: questions[i].text.trim(),
            order: i,
          })
          .select()
          .single();
        if (qErr) throw qErr;

        const optionsToInsert = questions[i].options.map((o, j) => ({
          question_id: newQuestion.id,
          text: o.text.trim(),
          is_correct: o.is_correct,
          order: j,
        }));

        const { error: oErr } = await supabase.from('answer_options').insert(optionsToInsert);
        if (oErr) throw oErr;
      }

      navigate(`/tests/${testId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={isEditing ? `/tests/${id}` : '/dashboard'}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        {isEditing ? 'Редактирование теста' : 'Создание теста'}
      </h1>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Test settings */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Основные настройки</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Название теста</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Проверка знаний по технике безопасности"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Описание <span className="text-slate-400">(необязательно)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание теста..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="w-48">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Проходной балл (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Вопросы ({questions.length})
        </h2>
      </div>

      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="card p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-600">
                {qIndex + 1}
              </div>
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                placeholder="Текст вопроса"
                className="input-field flex-1 font-medium"
              />
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2.5 pl-10">
              <p className="mb-2 text-xs font-medium text-slate-500">Выберите правильный ответ:</p>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button
                    onClick={() => setCorrectAnswer(qIndex, oIndex)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      option.is_correct
                        ? 'border-success-500 bg-success-500'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {option.is_correct && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Вариант ответа ${oIndex + 1}`}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600"
      >
        <Plus className="h-4 w-4" />
        Добавить вопрос
      </button>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={() => saveTest(false)}
          disabled={saving}
          className="btn-secondary"
        >
          <Save className="h-4 w-4" />
          {saving && !publishTarget ? 'Сохранение...' : 'Сохранить как черновик'}
        </button>
        <button
          onClick={() => saveTest(true)}
          disabled={saving}
          className="btn-primary"
        >
          <Send className="h-4 w-4" />
          {saving && publishTarget ? 'Публикация...' : 'Опубликовать тест'}
        </button>
      </div>
    </div>
  );
}
