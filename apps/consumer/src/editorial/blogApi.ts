import type { JSONContent } from '@tiptap/core';
import { readBackendApiUrl } from '../auth/config';
import { EditorialError, editorialRequest } from './editorialApi';

export type BlogKind = 'ARTICLE' | 'EDITORIAL';
export type BlogEvidence = { title: string; url: string };
export type BlogCategory = { code: string; label_en: string; label_pl: string };
export type BlogPost = {
  id: string;
  revision_id: string;
  version: number;
  author_uid: string;
  kind: BlogKind;
  title: string;
  document: JSONContent;
  evidence: BlogEvidence[];
  category_code: string;
  cover_id: string | null;
  cover_alt: string | null;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  publication_route: 'AUTHOR' | 'REVIEWED';
  review_notes: string | null;
  history?: { version: number; status: string; created_at: string }[];
  audit?: { action: string; reason: string; created_at: string }[];
};
export type BlogPage = {
  items: BlogPost[];
  page: number;
  size: number;
  total: number;
};
export type BlogImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
};
export const blogRequest = editorialRequest;
export function mediaUrl(id: string) {
  return `${readBackendApiUrl()}/api/v1/science/media/${id}`;
}
export async function uploadBlogImage(
  token: string,
  file: File,
  alt: string,
  purpose: 'COVER' | 'INLINE',
): Promise<BlogImage> {
  const data = new FormData();
  data.append('file', file);
  data.append('alt', alt);
  data.append('purpose', purpose);
  const response = await fetch(
    `${readBackendApiUrl()}/api/v1/editorial/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok) throw new EditorialError(response.status);
  return (await response.json()) as BlogImage;
}
export async function privateImage(token: string, id: string): Promise<string> {
  const response = await fetch(
    `${readBackendApiUrl()}/api/v1/editorial/media/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new EditorialError(response.status);
  return URL.createObjectURL(await response.blob());
}
