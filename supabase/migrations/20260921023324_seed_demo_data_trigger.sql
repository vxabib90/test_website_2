/*
# Demo Data Seed Trigger

1. Purpose
   When a new manager signs up, automatically create a demo test with
   10 safety questions, 4 answer options each (one correct), and 3
   sample test attempts so the dashboard looks populated immediately.

2. New Objects
   - seed_demo_data_for_user(uuid) — SECURITY DEFINER, inserts demo data.
   - on_user_created_trigger() — trigger function, calls seed_demo_data_for_user.
   - on_user_created trigger — fires AFTER INSERT on auth.users.
*/

CREATE OR REPLACE FUNCTION seed_demo_data_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id uuid;
  v_q_ids uuid[] := ARRAY[]::uuid[];
  v_q_id uuid;
  v_correct_ids uuid[];
  v_wrong_ids uuid[];
  v_att1 uuid;
  v_att2 uuid;
  v_att3 uuid;
  i integer;
BEGIN
  -- Create the demo test
  INSERT INTO tests (owner_id, title, description, passing_score, status, public_slug)
  VALUES (p_user_id, 'Общая техника безопасности', 'Базовый тест по общим правилам техники безопасности на производстве.', 80, 'published', 'demo_safety_' || substr(replace(p_user_id::text, '-', ''), 1, 16))
  RETURNING id INTO v_test_id;

  -- Q1
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Что необходимо сделать перед началом работы на новом оборудовании?', 1) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Пройти инструктаж по технике безопасности', true, 1), (v_q_id, 'Просто начать работу', false, 2), (v_q_id, 'Подождать указаний от коллег', false, 3), (v_q_id, 'Начать работу с напарником', false, 4);

  -- Q2
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Какое средство индивидуальной защиты обязательно при работе на высоте?', 2) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Страховочная привязь', true, 1), (v_q_id, 'Защитные очки', false, 2), (v_q_id, 'Перчатки', false, 3), (v_q_id, 'Беруши', false, 4);

  -- Q3
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Что нужно сделать при обнаружении пожара на рабочем месте?', 3) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Сообщить руководству и эвакуироваться', true, 1), (v_q_id, 'Попытаться потушить огонь самостоятельно', false, 2), (v_q_id, 'Продолжить работу', false, 3), (v_q_id, 'Ждать приказа', false, 4);

  -- Q4
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Как часто проводится повторный инструктаж по технике безопасности?', 4) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Не реже одного раза в 6 месяцев', true, 1), (v_q_id, 'Один раз в 2 года', false, 2), (v_q_id, 'Только при приёме на работу', false, 3), (v_q_id, 'Раз в 5 лет', false, 4);

  -- Q5
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Что обозначает красный цвет в сигнальной разметке?', 5) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Непосредственную опасность и запрет', true, 1), (v_q_id, 'Предупреждение', false, 2), (v_q_id, 'Безопасность', false, 3), (v_q_id, 'Информацию', false, 4);

  -- Q6
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Можно ли работать с электроинструментом во влажных помещениях?', 6) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Нет, это запрещено', true, 1), (v_q_id, 'Да, без ограничений', false, 2), (v_q_id, 'Да, если инструмент новый', false, 3), (v_q_id, 'Да, в перчатках', false, 4);

  -- Q7
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Что должно быть на рабочем месте для оказания первой помощи?', 7) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Аптечка первой помощи', true, 1), (v_q_id, 'Бутылка воды', false, 2), (v_q_id, 'Мобильный телефон', false, 3), (v_q_id, 'Записная книжка', false, 4);

  -- Q8
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Как правильно переносить тяжести весом более 50 кг?', 8) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'С использованием специальных приспособлений', true, 1), (v_q_id, 'В одиночку, с прямой спиной', false, 2), (v_q_id, 'С напарником без приспособлений', false, 3), (v_q_id, 'Как удобнее', false, 4);

  -- Q9
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Что делать при травме на рабочем месте?', 9) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Обратиться к руководителю и зафиксировать травму', true, 1), (v_q_id, 'Продолжить работу', false, 2), (v_q_id, 'Лечиться самостоятельно дома', false, 3), (v_q_id, 'Не сообщать никому', false, 4);

  -- Q10
  INSERT INTO questions (test_id, text, "order") VALUES (v_test_id, 'Кто несёт ответственность за соблюдение техники безопасности на рабочем месте?', 10) RETURNING id INTO v_q_id; v_q_ids := v_q_ids || v_q_id;
  INSERT INTO answer_options (question_id, text, is_correct, "order") VALUES (v_q_id, 'Каждый работник и работодатель', true, 1), (v_q_id, 'Только работодатель', false, 2), (v_q_id, 'Только служба охраны труда', false, 3), (v_q_id, 'Только руководитель', false, 4);

  -- Get correct and wrong answer IDs for attempts
  SELECT array_agg(id ORDER BY question_id, "order") INTO v_correct_ids FROM answer_options WHERE question_id = ANY(v_q_ids) AND is_correct = true;
  SELECT array_agg(id ORDER BY question_id, "order") INTO v_wrong_ids FROM answer_options WHERE question_id = ANY(v_q_ids) AND is_correct = false;

  -- Attempt 1: Иван Петров — 90% — Passed
  INSERT INTO test_attempts (test_id, employee_first_name, employee_last_name, score, correct_answers, total_questions, status, completed_at)
  VALUES (v_test_id, 'Иван', 'Петров', 90, 9, 10, 'passed', now() - interval '2 days')
  RETURNING id INTO v_att1;

  -- Attempt 2: Алексей Смирнов — 70% — Failed
  INSERT INTO test_attempts (test_id, employee_first_name, employee_last_name, score, correct_answers, total_questions, status, completed_at)
  VALUES (v_test_id, 'Алексей', 'Смирнов', 70, 7, 10, 'failed', now() - interval '1 day')
  RETURNING id INTO v_att2;

  -- Attempt 3: Сергей Иванов — 100% — Passed
  INSERT INTO test_attempts (test_id, employee_first_name, employee_last_name, score, correct_answers, total_questions, status, completed_at)
  VALUES (v_test_id, 'Сергей', 'Иванов', 100, 10, 10, 'passed', now() - interval '3 hours')
  RETURNING id INTO v_att3;

  -- Ivan: 9 correct (Q1-Q9), Q10 wrong
  FOR i IN 1..9 LOOP
    INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
    VALUES (v_att1, v_q_ids[i], v_correct_ids[i], true);
  END LOOP;
  INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
  VALUES (v_att1, v_q_ids[10], v_wrong_ids[10], false);

  -- Alexey: 7 correct (Q1-Q7), Q8-Q10 wrong
  FOR i IN 1..7 LOOP
    INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
    VALUES (v_att2, v_q_ids[i], v_correct_ids[i], true);
  END LOOP;
  FOR i IN 8..10 LOOP
    INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
    VALUES (v_att2, v_q_ids[i], v_wrong_ids[i], false);
  END LOOP;

  -- Sergey: 10 correct
  FOR i IN 1..10 LOOP
    INSERT INTO attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
    VALUES (v_att3, v_q_ids[i], v_correct_ids[i], true);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_demo_data_for_user TO anon, authenticated;

-- Trigger function
CREATE OR REPLACE FUNCTION on_user_created_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_demo_data_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION on_user_created_trigger();