import { readBackendApiUrl } from '../auth/config';
import type { Page } from '../science/scienceApi';
export class DiscussionError extends Error {
  constructor(readonly status: number) {
    super('Discussion request failed');
  }
}
export async function discussionRequest<T>(
  path: string,
  token?: string | null,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${readBackendApiUrl()}/api/v1${path}`, {
      method,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new DiscussionError(response.status);
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  } finally {
    clearTimeout(timeout);
  }
}

export type Discussion = {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'HIDDEN';
  version: number;
  article_type: 'ARTICLE' | 'POST';
  article_id: string;
  article_title: string;
  category_code: string;
  comment_count: number;
  latest_activity: string;
  can_moderate?: boolean;
};
export type Comment = {
  id: string;
  parent_id: string | null;
  content: string;
  kind: 'OPINION' | 'EXPERIENCE';
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED' | 'REMOVED';
  author_name: string | null;
  own: boolean;
  created_at: string;
  reply_count: number;
};
export type DiscussionPage = Page<Discussion>;
export type CommentPage = Page<Comment>;
export function articleHref(item: Discussion) {
  return item.article_type === 'POST'
    ? (`/science/post/${item.article_id}` as const)
    : (`/science/article/${item.article_id}` as const);
}
