import { readBackendApiUrl } from '../auth/config';

export type DocumentNode = {
  type: string; text?: string; attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocumentNode[];
};
export type Page<T> = { items: T[]; page: number; size: number; total: number };
export type Category = { code: string; label: string };
export type Post = {
  id: string; title: string; document: DocumentNode;
  evidence: { title: string; url: string }[]; category_code: string;
  cover_id: string | null; cover_alt: string | null;
  created_at: string; updated_at: string; published_at: string;
  publication_route: 'AUTHOR' | 'REVIEWED'; version: number; kind: string;
};
export type Article = {
  id: string; title: string; summary: string; body: string; locale: string;
  category_code: string; claim_id: string; published_at: string;
  reviewed_at: string; next_review_at: string; version: number;
};
export type Claim = {
  id: string; locale: string; claim_text: string; summary: string;
  evidence_level: string; evidence_rationale: string; limitations: string;
  uncertainty: string; population: string; exposure: string; outcome: string;
  inference_type: string; published_at: string; reviewed_at: string;
  next_review_at: string; version: number;
};
export type Source = {
  id: string; title: string; authors: string; organization: string; journal: string;
  publication_year: number; study_type: string; url: string; doi: string;
  pmid: string; relation: string; notes: string;
};
export class ScienceError extends Error {
  constructor(readonly status: number) { super('Science request failed'); }
}
export async function scienceGet<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${readBackendApiUrl()}${path}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new ScienceError(response.status);
  return response.json() as Promise<T>;
}
export function mediaUri(id: string): string {
  return `${readBackendApiUrl()}/api/v1/science/media/${encodeURIComponent(id)}`;
}
export function documentText(node: DocumentNode): string {
  return node.text ?? (node.content ?? []).map(documentText).join(' ');
}
/** Accept only HTTPS research links; never pass arbitrary URL schemes to Linking. */
export function researchUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}
