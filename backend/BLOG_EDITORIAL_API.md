# Blog editor — P1-I02 owner follow-up, 2026-11-03

The active `/editorial` workspace is now a blog-style authoring tool. The owner
approved direct AUTHOR publication and optional independent review. This
replaces mandatory review for new blog articles; it does not change the
scientific-claim review policy or mark directly published text as verified.
Legacy structured evidence and article APIs remain available and unchanged;
the prior private UI is `/editorial-evidence`.

## Workflow

Create draft → title, formatted text, sources in footer, category, optional
article image and inline images. No language field or evidence-grading fields
are required in this article form. Dates come from the server. Automatic
translation is deferred; the original text is stored and displayed as entered.

AUTHOR choices:

- Save draft: private new version; a previously published version remains live.
- Publish: direct publication after confirmation; route is `AUTHOR`.
- Send for review: private queue; a different REVIEWER may approve/publish or
  request changes. Independently published route is `REVIEWED`.

Editing always creates a new immutable content version. Optimistic version
checks and stable-post transaction locks prevent lost writes and stale review.
Publish replaces the old live version atomically. Archive withdraws active
versions and removes their media from public access if no other live version
references the same assets. Audit records remain append-only. Roles and UID
checks use the existing operator-managed grants; there is no self-promotion.

## Private API

All paths are under `/api/v1/editorial`; verified Firebase email is required.
`AUTHOR` can create/edit their own posts and categories and upload images.
Either editorial role can read private posts and media. An independent
`REVIEWER` can decide a submitted post. Ordinary users are denied.

| Method/path                                   | Body / result                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| GET `/posts?kind=ARTICLE&status=DRAFT&page=0` | Optional kind/status, latest version of each post, 30 items/page                             |
| GET `/posts/{id}`                             | Latest post, version history and audit                                                       |
| POST `/posts`                                 | New post from draft body; returns full post                                                  |
| PUT `/posts/{id}`                             | New content version; requires `expectedVersion`                                              |
| POST `/posts/{id}/decision`                   | `{version,decision,notes}`; PUBLISH or CHANGES_REQUESTED, exact current IN_REVIEW version    |
| POST `/posts/{id}/archive`                    | `{version}`; author or reviewer, optimistic check                                            |
| GET `/categories`                             | Existing `{code,label_en,label_pl}` records                                                  |
| POST `/categories`                            | `{name}`; creates a stable code and original-language label                                  |
| POST `/media`                                 | Multipart `file`, `purpose` COVER/INLINE, `alt`; returns image ID, dimensions and stable URL |
| GET `/media/{id}`                             | Private JPEG, authenticated access, no-store                                                 |

Draft body:

```text
expectedVersion: integer or null for first creation
kind: ARTICLE | EDITORIAL
title: nonempty, max 500 chars
document: Tiptap JSON doc, max 100000 text chars / 10000 nodes / depth 20
evidence: [{title, url}] (max 50, HTTPS only)
categoryCode: existing category code
coverId: owned COVER asset UUID or null
action: DRAFT | PUBLISH | REVIEW
```

Nonempty text and title are required to save. At least one valid source is
required before publishing or review. No author/reviewer identity, timestamps,
status override or claim-certainty value is accepted from the client.

Document nodes: doc, paragraph, heading (1–3), lists/items, blockquote, hardBreak,
horizontalRule, text and uploaded image. Marks: bold, italic, underline, strike,
code, HTTPS link. Text alignment: left, center, right, justify. Unknown nodes,
unsafe link schemes and remote/data/blob image URLs are rejected; unrecognized
attributes are dropped. Persisted images use `/api/v1/science/media/{uuid}`
and must be owned, uploaded INLINE assets with alt text. Client blob URLs are
only previews and are converted to stable IDs before saving.

## Public API and media

GET `/api/v1/science/posts` and `/api/v1/science/posts/{id}` expose only the
currently PUBLISHED version, with its document, evidence, category, cover ID/
alt text, version, dates and `publication_route` AUTHOR/REVIEWED. Private UIDs
and review notes are omitted. This is separate from the reviewed claim corpus.
Consumer Science/Home reading screens are not connected in this follow-up.

GET `/api/v1/science/media/{id}` returns normalized JPEG only if referenced by
an active published version. Otherwise 404, including unpublished uploads.
Public image URLs are relative to the API origin. Revalidate public reads;
private responses remain no-store.

PNG/JPEG input only, ≤5 MB, ≤20 megapixels and bounded dimensions. Server
re-encodes to JPEG, strips metadata, crops covers centrally to exactly
1600×900 and scales inline media into 1600×1600 preserving aspect. Alt text is
required. No SVG, arbitrary HTML, external image fetching or embedded scripts.
Binary assets are stored in PostgreSQL for now; include them in database
backups. Unused private uploads are retained; cleanup/storage quotas are future
operations work, not an automatic claim made by this editor.

## Local startup and verification

After dependency or backend changes, restart the local API with:

```sh
node scripts/start-local-backend.mjs
```

Run from repository root. The helper reads local configuration, obtains the
local container credential in memory, builds without running integration tests,
and restarts only an identified Soberity JAR in this checkout. It refuses a
non-loopback database/API or a port held by another application. Flyway applies
V7 on startup. No credentials are written to source or passed as CLI arguments.

UI tests: `pnpm exec playwright test -c playwright.blog.config.ts` from client.
They simulate Firebase/API responses and check the actual Tiptap UI, not real
DB authorization. Optional BLOG_PREVIEW_URL reuses a running preview. The
new real-DB suite is BlogApiIT; its execution was deferred at owner request.
