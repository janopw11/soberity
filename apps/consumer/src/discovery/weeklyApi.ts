import type { DocumentNode, Claim } from '../science/scienceApi';

export type WeeklyIssue = {
  publication_route: 'AUTHOR' | 'REVIEWED'; content_mode: 'EVIDENCE' | 'NEWS'; document?: DocumentNode;
  id: string; slug: string; locale: string; title: string; teaser: string;
  opening_question: string; takeaway: string; established: string; not_established: string;
  population: string; method: string; research_kind: 'NEW' | 'REVISITED';
  publish_at: string; publication_zone: string; published_at: string; reviewed_at: string | null;
  next_review_at: string; evidence_reviewed_at: string | null; claim_id: string | null; revision_id: string | null; evidence_level: Claim['evidence_level'];
  evidence_rationale: string; limitations: string; uncertainty: string;
  sources?: { title: string; url: string; authors?: string; publication_year?: number; study_type?: string; relation?: string; doi?: string | null }[];
};
export type WeeklyCurrent = { issue: WeeklyIssue | null; fallback: boolean };
