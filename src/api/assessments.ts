import { api } from './client';
import type { QuestionType } from '@/types/api';

export interface QuestionOptionStudentRead {
  id: string;
  text: string;
  order: number;
  image_url: string | null;
}

export interface QuestionStudentRead {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  order: number;
  image_url: string | null;
  /** Choice-type questions return their options; short_answer leaves it []. */
  options: QuestionOptionStudentRead[];
}

/**
 * Backend `AssessmentStudentRead` (app/schemas/assessments.py).
 *
 * Note: the backend schema is enforced — the older frontend variant had
 * `attempts_allowed`, `attempts_used`, `show_correct_answers` which DON'T
 * exist server-side. Use `max_attempts` and derive `attempts_used` from
 * the history endpoint.
 */
export interface AssessmentStudentRead {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  time_limit_minutes: number | null;
  pass_percent: number;
  max_attempts: number | null;
  is_section_quiz: boolean;
  questions: QuestionStudentRead[];
}

export interface SubmissionAnswerWrite {
  question_id: string;
  selected_option_ids?: string[];
  text?: string;
}

export interface SubmissionAnswerRead {
  question_id: string;
  is_correct: boolean;
  awarded_points: number;
  /** Opaque snapshot of what the learner submitted (shape depends on question type). */
  response: Record<string, unknown> | unknown[] | null;
}

export interface AssessmentSubmissionRead {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  started_at: string | null;
  submitted_at: string | null;
  score_percent: number;
  passed: boolean;
  answers: SubmissionAnswerRead[];
}

/**
 * Snapshot of a learner's progress against a section quiz.
 * Per backend: until `passed` flips to true, the streaming layer and
 * progress endpoints will refuse lessons in later sections.
 */
export interface SectionQuizStatus {
  section_id: string;
  assessment_id: string | null;
  required: boolean;
  passed: boolean;
  attempts: number;
  last_score_percent: number | null;
  best_score_percent: number | null;
  pass_percent: number | null;
  max_attempts: number | null;
}

export const assessmentsApi = {
  detail(id: string) {
    return api.get<AssessmentStudentRead>(`/assessments/${id}`);
  },
  submit(id: string, answers: SubmissionAnswerWrite[]) {
    return api.post<AssessmentSubmissionRead>(`/assessments/${id}/submissions`, {
      json: { answers },
    });
  },
  history(id: string) {
    return api.get<AssessmentSubmissionRead[]>(`/assessments/${id}/submissions/me`);
  },

  /** Returns the section's quiz, or 404 if the section has no quiz attached. */
  sectionQuiz(sectionId: string) {
    return api.get<AssessmentStudentRead>(`/sections/${sectionId}/quiz`);
  },
  /** Cheap status check (no questions in the response) — use to drive lock UI. */
  sectionQuizStatus(sectionId: string) {
    return api.get<SectionQuizStatus>(`/sections/${sectionId}/quiz/status`);
  },
};
