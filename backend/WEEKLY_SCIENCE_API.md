# P1-I05 — Weekly Science Drop (implementation, NOT VERIFIED)

Implemented 2026-11-04. No tests, compilation, migration execution or runtime
verification were performed in this iteration, at the owner's request.

## Local activation

Restart an updated local backend so Flyway applies V12. The existing helper is
`node scripts/start-local-backend.mjs` (builds with tests skipped, starts local API).
Do not package over the JAR used by a running backend without restarting that
process: the earlier local process experienced class-loading failures after
its executable archive changed. No backend restart was performed for P1-I05.
Reload Expo web after these source changes. No real Science Drops are seeded.

## Public API

- `GET /api/v1/discover/weekly/current?locale=en|pl` returns
  `{issue: <public issue or null>, fallback: boolean}`. Missing content is HTTP 200
  with `issue:null`. This differs from a network/API error.
- `GET /api/v1/discover/weekly/{slug}?locale=en|pl` returns the issue and its
  source metadata (title, URL, authors, publication year, study type, DOI, relation).
  Draft, unapproved, scheduled, future, archived, overdue, replaced/withdrawn
  evidence and unknown issues all return the same HTTP 404.

Public projections contain no editorial account IDs, private notes or audit data.
Both responses use `Cache-Control: no-store`; source withdrawal must take effect
on the next read. Language fallback is not implicit: each locale is curated
and independently reviewed. Missing PL must not silently display EN as PL.

Public fields: `id, slug, locale, title, teaser, opening_question, takeaway,
established, not_established, population, method, research_kind, publish_at,
publication_zone, published_at, reviewed_at, next_review_at, revision_id,
claim_id, evidence_level, evidence_rationale, limitations, uncertainty,
evidence_reviewed_at`. Detail also contains `sources`.

## Editorial API and workflow

All endpoints require verified Firebase identity, a nondeleted account and the
existing AUTHOR/REVIEWER roles. Private APIs share the current security boundary.

- `GET /api/v1/editorial/weekly?page=0` — paginated full issue records for editorial
  members (50/page), roles and current actor UID. Includes `claim_id` for review.
- `POST /api/v1/editorial/weekly` — AUTHOR creates a DRAFT. Returns `{id}` (201).
- `POST /api/v1/editorial/weekly/{id}/decision` — `{action,notes}` (204).

Create body (all fields required):

```json
{
  "slug": "an-editorial-url-name",
  "locale": "en",
  "title": "<reviewable editorial title>",
  "teaser": "<short introduction>",
  "openingQuestion": "<reflection question>",
  "takeaway": "<key finding>",
  "established": "<what was established>",
  "notEstablished": "<what was not established>",
  "population": "<population and scope>",
  "method": "<study methodology>",
  "researchKind": "REVISITED",
  "revisionId": "<published reviewed claim revision UUID>",
  "publishAt": "2026-11-09T08:00:00Z",
  "publicationZone": "Europe/Vienna",
  "nextReviewAt": "2027-05-09T08:00:00Z"
}
```

`researchKind` is NEW or REVISITED; editorial responsibility includes honest
classification. `publishAt` must be future, `nextReviewAt` later than publication;
pinned claim must be published, reviewed, sourced, in the same locale and valid
at publication. Dates are instants with offsets; no server-default time zone.
The editor requires an explicit ISO offset or Z to avoid ambiguous DST times.
The IANA publication zone is retained for human display.

- SUBMIT: owning AUTHOR, DRAFT → IN_REVIEW.
- APPROVE: independent REVIEWER, IN_REVIEW → SCHEDULED, with review notes and
  server review timestamp. Same author cannot approve. Approval after the
  planned publication time is rejected; prepare a new future schedule.
- ARCHIVE: owning AUTHOR or REVIEWER, any nonarchived issue → ARCHIVED.

Content and schedule are immutable; to correct/reject an issue, archive it and
create another draft with a fresh slug and review. No direct-author publication.
This is intentionally stricter than the blog/quiz publication paths.
DB triggers enforce transitions, review independence, immutability, evidence
eligibility, server publication dates and an append-only editorial audit.
Conflict responses do not disclose SQL or raw submitted data.

## Cadence, scheduling and fallback

One SCHEDULED/PUBLISHED issue per locale and ISO week (Monday 00:00 to the next
Monday, UTC), enforced by a partial unique index. The schedule stores the exact
instant separately from the chosen IANA zone. UTC defines the slot consistently
at year/week boundaries and through DST; the editor explains this convention.
Archiving frees a week slot. No notification or XP side effects in this iteration.

Scheduler polls every 60 seconds after an initial 10-second delay. Optional
properties: `soberity.discovery.poll-ms`, `soberity.discovery.initial-delay-ms`.
It publishes due approved issues only; transaction advisory lock and row locks
prevent duplicate publication across instances. Evidence rows are locked with
publication so withdrawal cannot race a successful eligibility check. Audit and
publication commit together. Scheduler errors roll back and Spring retries on
its next scheduled invocation; no draft can be published by the scheduler.
Downtime is caught up on the next poll, subject to current review validity.
Expired/withdrawn issues are skipped and remain editorially visible to archive.

The current API chooses the latest eligible publication in the selected locale.
If it belongs to an earlier UTC ISO week, the UI explicitly labels it archived
and still within its review period. No eligible issue shows an honest empty
state. Future drafts are never used as a fallback. Reader revalidates visibility
on every request, so an old deep link cannot bypass withdrawal.

## Manual acceptance — not executed

1. AUTHOR creates a future issue with all fields and valid evidence; draft not
   publicly visible. Invalid dates, invalid zone, wrong-locale, unsourced,
   expired or unreviewed evidence must be rejected.
2. Author submits; same author with REVIEWER cannot approve. A different reviewer
   sees the full text and pinned evidence and approves with notes.
3. Before due time, current/detail must not expose the issue. After due time and
   scheduler poll, it becomes visible once, with review/publication dates.
4. Schedule two issues in the same locale/UTC week: second approval conflicts;
   the other locale is independent. Check Sunday/Monday and year boundaries,
   equivalent offset instants, Europe/Vienna DST transitions, invalid time input.
5. Stop/restart around due time: eligible issue catches up, no duplicate audit.
   Two app instances must not publish the same issue twice.
6. Withdraw/replace the pinned claim or expire either review date: public current
   and detail hide it immediately; scheduler cannot publish it. Verify old deep
   links, no-store headers and absent private metadata.
7. No issue this week: last still-valid publication has archive label; no eligible
   issue: empty state; API failure: retry state, not misleading empty content.
8. Web/iOS/Android EN/PL light/dark: card and reader, long text/large font,
   keyboard/VoiceOver/TalkBack, reveal findings, evidence, source links and retry.
   Web editor: form, dates, independent review, queue pagination and archiving.

These are acceptance instructions, not recorded test passes. P1-I05-V01 and
all task checkboxes remain open pending actual verification/owner acceptance.

## Local activation recorded 2026-11-04

At the owner’s explicit request, the local restart helper completed packaging
with tests skipped (BUILD SUCCESS). Flyway applied V12 successfully and the
application started on port 8090. Log: `/private/tmp/soberity-weekly-backend-start.log`.
No additional tests, API requests or UI verification were run. The original
implementation-session limitations above remain historical; manual acceptance
of the feature is still pending.

## Owner-requested short-news editor — 2026-11-04 (V13)

This supersedes the mandatory EvidenceClaim selection for **new** Science Drops.
The owner requested the same simple creation flow as an article, with scheduled
date/time. Existing EVIDENCE issues remain supported and keep withdrawal checks.

New `content_mode=NEWS` uses the same canonical, validated Tiptap document format
as articles and direct HTTPS sources. It does not fabricate a confidence level,
population or reviewed EvidenceClaim. The story itself must explain evidence
and limitations; an independent reviewer approves before scheduling.

- POST `/api/v1/editorial/weekly/news` creates an editable NEWS draft.
- PUT `/api/v1/editorial/weekly/news/{id}` updates an owning author's DRAFT.
- Body: `{locale,title,document,sources:[{title,url}],publishAt,publicationZone}`.
- Empty title becomes a localized draft title. Empty document and no sources
  are allowed for drafts. Entered source rows must still be valid HTTPS links.
- Slug is generated, teaser derived from plain document text, and next review
  set to six months after publication. No manual slug/review-date/claim fields.
- Submit requires nonempty body and sources, plus a future publication time;
  approval still requires a different REVIEWER. The UTC weekly slot, scheduler,
  no-store projection, expiry, audit and archive behavior remain intact.
- The browser provides a normal local date/time picker, labels its IANA zone,
  sends an explicit UTC instant, and rejects nonexistent DST wall-clock times.
- Inline images are not supported in short-news documents; script/HTML/unsafe
  links and unsupported nodes are rejected by the shared BlogDocument validator.
- Review freezes content and schedule. Draft PUT is serialized by a row lock;
  attempted updates after submission return conflict. Existing records are not
  rewritten. V12 remains immutable; V13 upgrades it.

Manual acceptance (not run): save empty/partial draft, reload/edit it, add body
and sources, submit to independent review, check self-review denial and week
conflicts, verify publication timing/expiry and old evidence-backed issues.
Check datetime picker/offsets/DST, EN/PL, dark/light, keyboard and error recovery.

V13 activation: the local helper completed packaging with tests skipped
(BUILD SUCCESS), Flyway applied V13 and the backend started on 8090. Log:
`/private/tmp/soberity-weekly-news-backend-start.log`. No API/UI acceptance
checks or tests were run; the owner must confirm saving/editing/review manually.

## Owner amendment — Publish / Schedule (V14, 2026-11-04)

New NEWS drafts support author actions through the existing decision endpoint:
`{action:"PUBLISH"|"SCHEDULE",notes:"..."}`. Only the owning AUTHOR may act, from
DRAFT or IN_REVIEW. PUBLISH immediately uses server/database time, recomputes
the UTC week and six-month review deadline. SCHEDULE retains the stored future
publication date. Both require content and research sources; week conflicts
return 409. Content is frozen on scheduling/publication.

`publication_route` is AUTHOR or REVIEWED in public/private projections.
AUTHOR records have null reviewer and review timestamp and are explicitly
labelled as author publications in the reader/card. The optional SUBMIT/APPROVE
flow still records independent review. This supersedes earlier mandatory-review
statements for NEWS only; pinned EVIDENCE issues remain review-gated.

No user news is published by installing V14. Manual acceptance remains open:
publish immediately despite a future picker date; schedule and confirm invisibility
before due time; reject past schedules, missing sources, nonowner actions and
week conflicts; check honest AUTHOR/REVIEWED metadata and old EVIDENCE behavior.

V14 activated locally: package with tests skipped completed BUILD SUCCESS,
Flyway applied V14, backend started on 8090. Log:
`/private/tmp/soberity-weekly-publication-backend-start.log`. No news was
published and no additional tests/API/UI verification were run.

## Superseding model — Article of the week (V15, 2026-11-04)

The owner discontinued Science Drop as a separate content type. **Weekly Science
Drop** remains the public section name and now highlights an existing ARTICLE.
ADR-009 is the current decision; older sections above are history.

- GET `/api/v1/discover/weekly/current?locale=en|pl` now returns
  `{article: <existing public post projection or null>, fallback: boolean,
  starts_at?: timestamp}`. It links to `/science/post/{id}`, not a separate reader.
- GET `/api/v1/editorial/weekly/features?page=0`: active selections, 50/page.
- POST same path: `{postId,locale,startsAt:null}` features now; an explicit future
  offset-aware instant schedules only the **feature**, not article publication.
- DELETE `/api/v1/editorial/weekly/features/{id}` cancels selection, not the article.
- Existing AUTHOR/REVIEWER roles are required for curation; removed/unverified
  identities remain blocked by the existing editorial access boundary.

V15 references only editorial_post IDs. Content is read from the published
article; drafts and withdrawn posts never become public through the selection.
No copied document/source/image data or second editor. Locale is manually curated
because current blog articles do not expose an editorial language attribute.
The UI explains that selection does not translate content.

One active selection per locale/ISO week in UTC. Selecting another article
replaces that week's previous pick atomically, with transaction advisory/row
locks and append-only audit. A future replacement removes the old same-week
pick when saved; until activation, the latest eligible earlier-week selection
is the fallback. The UI explains replacement. Future choices are not exposed
in the public response. No choice has `article:null`; API failures remain errors.

A cancelled feature does not remove an article from Articles. Withdrawing an
article hides it from Weekly Science Drop on the next no-store public read.
If a newer article revision is only a draft, the currently published version is
used. No scheduler is needed for time-based feature visibility. The legacy
Science Drop scheduler is retired (unannotated compatibility class).

Existing V12–V14 records/audits remain intact. Their write endpoints return 410;
private GET `/api/v1/editorial/weekly` and public legacy slug reads remain for
history. The new panel offers a read-only archive, including old drafts. No old
issue is automatically converted, published or selected as an article.

Manual acceptance, not run: select published ARTICLE now; follow the original
article reader; schedule future and check before/after, offsets/DST/week boundary;
replace/cancel a selection; withdraw/update article; check unpublished revisions,
ACL and removed accounts; verify old content archive and 410 legacy writes;
EN/PL, light/dark, native card/reader, web selection panel and keyboard.

V15 activated locally: package with tests skipped completed BUILD SUCCESS,
Flyway applied V15 and the backend started on 8090. Log:
`/private/tmp/soberity-weekly-article-backend-start.log`. No article was selected
by the agent. No tests or additional API/UI verification were performed.
