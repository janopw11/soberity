/** Layout fixtures only: these are proposed topics, not published research. */
export const previewArticles = [
  { id: 'sleep', date: '2026-11-02', kind: 'research', minutes: 5 },
  { id: 'evidence', date: '2026-11-01', kind: 'article', minutes: 4 },
  { id: 'habits', date: '2026-10-30', kind: 'article', minutes: 6 },
  { id: 'headlines', date: '2026-10-28', kind: 'research', minutes: 3 },
] as const;
export type PreviewArticleId = (typeof previewArticles)[number]['id'];
