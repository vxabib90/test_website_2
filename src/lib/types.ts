export type TestStatus = 'draft' | 'published';
export type AttemptStatus = 'passed' | 'failed';

export interface Test {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  status: TestStatus;
  public_slug: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  text: string;
  order: number;
  created_at: string;
}

export interface AnswerOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order: number;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  employee_first_name: string;
  employee_last_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  status: AttemptStatus;
  completed_at: string;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_id: string | null;
  is_correct: boolean;
  created_at: string;
}

export interface TestWithCounts extends Test {
  question_count?: number;
  attempt_count?: number;
  passed_count?: number;
}

export interface PublicQuestion {
  id: string;
  text: string;
  order: number;
  options: { id: string; text: string; order: number }[];
}

export interface PublicTest {
  test: {
    id: string;
    title: string;
    description: string | null;
    passing_score: number;
    question_count: number;
  };
  questions: PublicQuestion[];
}
