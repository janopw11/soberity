export const categories = [
  'sleep',
  'brain',
  'cancer',
  'sport',
  'relationships',
  'public-health',
];
export const levels = ['HIGH', 'MODERATE', 'LOW', 'VERY_LOW', 'INSUFFICIENT'];
export const studies = [
  'SYSTEMATIC_REVIEW',
  'META_ANALYSIS',
  'RANDOMIZED_TRIAL',
  'OBSERVATIONAL',
  'GUIDELINE',
  'REPORT',
  'PREPRINT',
  'COMMENTARY',
  'EDITORIAL',
  'OTHER',
];
export const providers = [
  'PUBMED',
  'PMC',
  'WHO',
  'IARC',
  'THE_LANCET',
  'PUBLISHER',
  'OTHER',
];
export const accesses = [
  'OPEN_ACCESS',
  'ABSTRACT_ONLY',
  'SUBSCRIPTION',
  'UNKNOWN',
];
export const claimFields = [
  'claimText',
  'summary',
  'evidenceRationale',
  'limitations',
  'uncertainty',
  'population',
  'exposure',
  'outcome',
  'causalJustification',
];
export const sourceFields = [
  'title',
  'authors',
  'organization',
  'journal',
  'publicationYear',
  'publicationDate',
  'url',
  'doi',
  'pmid',
  'license',
  'licenseUrl',
];
export type FormValues = Record<string, string>;
export function initialForm(): FormValues {
  return {
    locale: 'en',
    category: 'sleep',
    evidenceLevel: 'LOW',
    inferenceType: 'ASSOCIATION',
    studyType: 'REPORT',
    provider: 'OTHER',
    license: 'UNKNOWN',
    accessType: 'UNKNOWN',
    relation: 'SUPPORTS',
    nextReviewAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  };
}
export function claimPayload(f: FormValues) {
  return {
    locale: f.locale,
    category: f.category,
    changeSummary: f.changeSummary,
    nextReviewAt: f.nextReviewAt,
    content: Object.fromEntries(
      [...claimFields, 'evidenceLevel', 'inferenceType'].map((k) => [
        k,
        k === 'causalJustification' ? f[k] || null : f[k],
      ]),
    ),
  };
}
export function articlePayload(f: FormValues) {
  return {
    revisionId: f.revisionId,
    category: f.category,
    title: f.title,
    summary: f.summary,
    body: f.body,
    changeSummary: f.changeSummary,
    nextReviewAt: f.nextReviewAt,
  };
}
export function sourcePayload(f: FormValues) {
  return Object.fromEntries(
    [...sourceFields, 'studyType', 'provider', 'accessType'].map((k) => [
      k,
      k === 'publicationYear' ? Number(f[k]) : f[k] || null,
    ]),
  );
}
