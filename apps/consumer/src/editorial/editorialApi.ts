import { readBackendApiUrl } from '../auth/config';

export type MaterialType = 'CLAIM' | 'ARTICLE';
export type MaterialStatus =
  'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type Material = {
  id: string;
  material_id: string;
  version: number;
  title: string;
  type: MaterialType;
  status: MaterialStatus;
  locale: string;
  author_uid: string;
};
export type Evidence = {
  claim_text: string;
  summary: string;
  evidence_level: string;
  evidence_rationale: string;
  limitations: string;
  uncertainty: string;
  population: string;
  exposure: string;
  outcome: string;
  inference_type: string;
  causal_justification: string | null;
  locale: string;
  next_review_at: string;
};
export type Source = {
  id: string;
  citation_id: string;
  title: string;
  authors: string;
  organization: string | null;
  journal: string | null;
  publication_year: number;
  publication_date: string | null;
  url: string;
  doi: string | null;
  pmid: string | null;
  study_type: string;
  provider: string;
  license: string;
  license_url: string | null;
  access_type: string;
  relation: string;
  notes: string;
};
export type Detail = Material & {
  claim_id?: string;
  article_id?: string;
  revision_id?: string;
  claim_text?: string;
  summary: string;
  body?: string;
  category_code?: string;
  next_review_at: string;
  reviewer_uid?: string;
  review_notes?: string;
  evidence: Evidence;
  citations: Source[];
  review: {
    reviewer_uid: string;
    decision: string;
    notes: string;
    causal_assessment: string | null;
  }[];
  versions: { id: string; version: number; status: MaterialStatus }[];
  audit: {
    action: string;
    reason: string;
    actor_uid: string;
    created_at: string;
  }[];
};
export type EditorialPage = {
  items: Material[];
  page: number;
  size: number;
  total: number;
};
export type Membership = { uid: string; roles: string[] };
export class EditorialError extends Error {
  constructor(readonly status: number) {
    super(`Editorial request failed (${status}).`);
  }
}
export async function editorialRequest<T>(
  token: string,
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `${readBackendApiUrl()}/api/v1/editorial${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? null : JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new EditorialError(response.status);
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  } finally {
    clearTimeout(timer);
  }
}
