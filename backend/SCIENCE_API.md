# Science public API (P1-I01)

All routes below are anonymous **GET** routes. A valid Firebase identity,
including an unverified email, has the same public visibility. Rejected Bearer
tokens retain anonymous access to public reads; they grant no identity or write
access, matching the existing Firebase filter. Private profile/auth APIs retain
their existing authorization. All science/evidence writes and unmatched routes
are denied (401 anonymous, 403 authenticated), including publication attempts.
These public routes expose no editorial mutations or client-supplied role overrides.
The private editorial workflow and roles are documented in [EDITORIAL_API.md](EDITORIAL_API.md); public writes remain denied.

| Route                                    | Response / filters                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `/api/v1/science/categories?locale=en`   | Array of `{code,label}`; six initial category labels, EN/PL                   |
| `/api/v1/evidence/claims`                | Page; `locale`, `category`, `evidenceLevel`, `page`, `size`                   |
| `/api/v1/evidence/claims/{id}`           | Current published claim revision                                              |
| `/api/v1/evidence/claims/{id}/citations` | Array of bibliography fields plus `relation`, `notes` for that exact revision |
| `/api/v1/evidence/sources/{id}`          | Bibliography, only when cited by at least one published revision              |
| `/api/v1/science/articles`               | Page; `locale`, `category`, `page`, `size`                                    |
| `/api/v1/science/articles/{id}`          | Current published version of a stable article UUID                            |

The catalog is a small bounded library with offset pagination, not the future
Discover feed. Pages have `{items,page,size,total}`. Defaults: `locale=en`,
`page=0`, `size=20`; supported locales `en`/`pl`, sizes 1–100, pages 0–1000000.
Ordering: publication timestamp descending, then stable UUID ascending.
Unknown syntactically valid categories return an empty page. Category codes
use lowercase letters/digits/hyphens, starting with a letter, maximum 40.
`evidenceLevel` uses the existing HIGH/MODERATE/LOW/VERY_LOW/INSUFFICIENT enum.
Invalid parameters/UUIDs return 400 Problem Details; absent or non-public
resources both return 404. A status/version parameter never grants draft access.

Public projection field names use snake_case for content fields. The page
wrapper uses the four names above. Dates serialize in ISO 8601 UTC.

Claims include `id`, `locale`, `revision_id`, `version`, `claim_text`, `summary`,
`evidence_level`, `evidence_rationale`, `limitations`, `uncertainty`, `population`,
`exposure`, `outcome`, `inference_type`, `causal_justification`, `published_at`,
`next_review_at`, `reviewed_at`. Author/reviewer UIDs and private review notes
are excluded. Source-assessment citation `notes` are public explanations.

Sources include `id`, `title`, `authors`, `organization`, `journal`,
`publication_year`, `publication_date`, `url`, `doi`, `pmid`, `study_type`,
`provider`, `license`, `license_url`, `access_type`, `retrieved_at`. DOI is the
canonical bare identifier, not a resolver URL. URL/DOI syntax is validated by
the existing domain constructors and PostgreSQL constraints. This does not
verify that a publication exists or supports its associated claim. There is
no public source ingestion or outbound URL fetch.

Articles include `id` (stable article UUID), `article_revision_id`, `version`,
`locale`, `title`, `summary`, `body`, `category_code`, `claim_id`, `revision_id`,
`claim_version`, `published_at`, `reviewed_at`, `next_review_at`. Body is plain
text, not trusted HTML. Open the linked claim and its citations for the full
evidence card. One article version summarizes one exact evidence revision;
review covers the whole article. Multi-claim content can be added with a
reviewed link model when needed. No publisher full texts or research seeds
are included.

## Publication and withdrawal

Only PUBLISHED revisions are returned, not the latest draft or approval.
Article versions start DRAFT, then IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED.
Archival is also allowed before publication. Approval needs an independent
article reviewer, review notes/date, and an exact published evidence revision.
Content is immutable; corrections create a new version with a new review.
Publication requires valid dates and a future review deadline. One published
version per stable article is allowed. These DB guards supplement, rather than
replace, future editorial RBAC. Direct database administrators remain trusted.

An article is public only while both it and its exact evidence revision are
PUBLISHED. Replacing/archiving that revision immediately hides the old article;
it does not silently inherit approval of the replacement claim. Orphaned or
only-draft source snapshots are hidden. An overdue review remains visible
with its review deadline, per P1-I00 policy; automatic withdrawal is not added.

## Cache contract

200/304 responses carry `Cache-Control: public, no-cache` and a weak SHA-256
ETag prefixed `science-v1-`, computed from the serialized public projection.
Clients can store a response but must revalidate with `If-None-Match` before
reuse. A matching current representation gives 304 with no body. Changes in
version, category, locale, citations, page totals or withdrawal change the
validator. A withdrawn detail returns 404 even with its old validator or `*`.
Errors retain Spring Security's no-store default. There is no process-local
cache with stale publication status. Database reads for pages and citations
share a read-only REPEATABLE_READ snapshot. CORS allows `If-None-Match` and
exposes `ETag` only to the existing configured origins.
