import { readBackendApiUrl } from '../auth/config';

export type QuizSummary = { id: string; title: string; locale: string; version: number; publication_route: 'AUTHOR' | 'REVIEWED'; question_count: number };
export type QuizSource = { title: string; url: string };
export type QuizQuestion = {
  id: string; type: 'TRUE_FALSE' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'; prompt: string;
  options: { id: string; label: string }[];
};
export type Quiz = Omit<QuizSummary, 'question_count'> & { questions: QuizQuestion[] };
export type AnswerResult = {
  question_id: string; correct: boolean; selected_option_ids: string[];
  correct_option_ids: string[]; explanation: string; sources?: QuizSource[]; claim_id: string | null; revision_id: string | null; saved?: boolean;
};
export type QuizProgress = { quiz_id: string; version: number; answers: AnswerResult[] };
export class LearningError extends Error {
  constructor(readonly status: number) { super('Learning request failed'); }
}
export async function learningRequest<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; token?: string; body?: unknown; signal?: AbortSignal;
} = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 20000);
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  try {
    const response = await fetch(`${readBackendApiUrl()}${path}`, {
      method: options.method ?? 'GET', signal: controller.signal, cache: 'no-store',
      headers: { ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    if (!response.ok) throw new LearningError(response.status);
    return response.status === 204 ? undefined as T : await response.json() as T;
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
}
