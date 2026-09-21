/*
# Safety Training Testing Platform — Schema

1. Purpose
   B2B SaaS for online safety knowledge testing. Managers create tests with
   single-choice questions, publish them via a public link, and employees take
   the test without signing up. Results are automatically scored and visible
   to the manager.

2. New Tables
   - tests: test metadata + public slug, owner-scoped
   - questions: one row per question, ordered within a test
   - answer_options: 4 options per question, one marked correct
   - test_attempts: one row per test completion by an employee
   - attempt_answers: one row per answer the employee selected

3. Security
   - tests/questions/answer_options: owner-scoped via auth.uid() = owner_id.
   - test_attempts/attempt_answers: SELECT scoped to test owner.
   - SECURITY DEFINER functions handle public submission and public test fetch.
*/

-- ============ TESTS ============
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 80 CHECK (passing_score >= 0 AND passing_score <= 100),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  public_slug text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tests" ON tests;
CREATE POLICY "select_own_tests" ON tests FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_tests" ON tests;
CREATE POLICY "insert_own_tests" ON tests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_tests" ON tests;
CREATE POLICY "update_own_tests" ON tests FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_tests" ON tests;
CREATE POLICY "delete_own_tests" ON tests FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_published_by_slug" ON tests;
CREATE POLICY "select_published_by_slug" ON tests FOR SELECT
  TO anon, authenticated USING (status = 'published');

-- ============ QUESTIONS ============
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  text text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_questions" ON questions;
CREATE POLICY "select_own_questions" ON questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_questions" ON questions;
CREATE POLICY "insert_own_questions" ON questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_questions" ON questions;
CREATE POLICY "update_own_questions" ON questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_questions" ON questions;
CREATE POLICY "delete_own_questions" ON questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_published_questions" ON questions;
CREATE POLICY "select_published_questions" ON questions FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.status = 'published')
  );

-- ============ ANSWER_OPTIONS ============
CREATE TABLE IF NOT EXISTS answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answers" ON answer_options;
CREATE POLICY "select_own_answers" ON answer_options FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_answers" ON answer_options;
CREATE POLICY "insert_own_answers" ON answer_options FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_answers" ON answer_options;
CREATE POLICY "update_own_answers" ON answer_options FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_answers" ON answer_options;
CREATE POLICY "delete_own_answers" ON answer_options FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_published_answers" ON answer_options;
CREATE POLICY "select_published_answers" ON answer_options FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM questions q JOIN tests t ON t.id = q.test_id
      WHERE q.id = answer_options.question_id AND t.status = 'published')
  );

-- ============ TEST_ATTEMPTS ============
CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  employee_first_name text NOT NULL,
  employee_last_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('passed', 'failed')),
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON test_attempts;
CREATE POLICY "select_own_attempts" ON test_attempts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = test_attempts.test_id AND tests.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_attempts" ON test_attempts;
CREATE POLICY "delete_own_attempts" ON test_attempts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = test_attempts.test_id AND tests.owner_id = auth.uid())
  );

-- ============ ATTEMPT_ANSWERS ============
CREATE TABLE IF NOT EXISTS attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer_id uuid REFERENCES answer_options(id) ON DELETE SET NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempt_answers" ON attempt_answers;
CREATE POLICY "select_own_attempt_answers" ON attempt_answers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM test_attempts ta JOIN tests t ON t.id = ta.test_id
      WHERE ta.id = attempt_answers.attempt_id AND t.owner_id = auth.uid())
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_tests_owner_id ON tests(owner_id);

-- ============ submit_test FUNCTION ============
CREATE OR REPLACE FUNCTION submit_test(
  p_test_id uuid,
  p_first_name text,
  p_last_name text,
  p_answers jsonb
) RETURNS test_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test tests%ROWTYPE;
  v_total integer := 0;
  v_correct integer := 0;
  v_score integer := 0;
  v_status text;
  v_attempt test_attempts%ROWTYPE;
  v_answer jsonb;
  v_question_id uuid;
  v_selected uuid;
  v_is_correct boolean;
BEGIN
  SELECT * INTO v_test FROM tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found';
  END IF;
  IF v_test.status <> 'published' THEN
    RAISE EXCEPTION 'Test is not published';
  END IF;

  SELECT count(*) INTO v_total FROM questions WHERE test_id = p_test_id;
  IF v_total = 0 THEN
    RAISE EXCEPTION 'Test has no questions';
  END IF;

  INSERT INTO test_attempts (test_id, employee_first_name, employee_last_name, total_questions)
  VALUES (p_test_id, p_first_name, p_last_name, v_total)
  RETURNING * INTO v_attempt;

  FOR v_answer IN SELECT jsonb_array_elements(p_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::uuid;
    v_selected := (v_answer->>'selected_answer_id')::uuid;

    SELECT is_correct INTO v_is_correct FROM answer_options WHERE id = v_selected AND question_id = v_question_id;
    IF v_is_correct THEN
      v_correct := v_correct + 1;
    END IF;

    INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
    VALUES (v_attempt.id, v_question_id, v_selected, COALESCE(v_is_correct, false));
  END LOOP;

  v_score := CASE WHEN v_total > 0 THEN round(v_correct * 100.0 / v_total) ELSE 0 END;
  v_status := CASE WHEN v_score >= v_test.passing_score THEN 'passed' ELSE 'failed' END;

  UPDATE test_attempts
  SET correct_answers = v_correct, score = v_score, status = v_status
  WHERE id = v_attempt.id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_test TO anon, authenticated;

-- ============ get_test_for_public FUNCTION ============
CREATE OR REPLACE FUNCTION get_test_for_public(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test jsonb;
  v_questions jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'description', t.description,
    'passing_score', t.passing_score,
    'question_count', (SELECT count(*) FROM questions WHERE test_id = t.id)
  ) INTO v_test
  FROM tests t
  WHERE t.public_slug = p_slug AND t.status = 'published';

  IF v_test IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'order', q."order",
      'options', (
        SELECT jsonb_agg(
          jsonb_build_object('id', ao.id, 'text', ao.text, 'order', ao."order")
          ORDER BY ao."order"
        )
        FROM answer_options ao
        WHERE ao.question_id = q.id
      )
    )
    ORDER BY q."order"
  ) INTO v_questions
  FROM questions q
  WHERE q.test_id = (v_test->>'id')::uuid;

  RETURN jsonb_build_object('test', v_test, 'questions', v_questions);
END;
$$;

GRANT EXECUTE ON FUNCTION get_test_for_public TO anon, authenticated;