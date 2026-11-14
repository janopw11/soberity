# Science Discussions — Community Phase 4

Implemented scope: article-linked topics, one-level replies, own deletion and editorial moderation. Tracked as **P5-I00D**. No social feed, unrestricted topic creation, chat or My Activities dashboard.

## Domain and persistence

Flyway `V28__science_discussions.sql` introduces:

- `science_discussion`: title (1–200 characters), one existing article reference, OPEN/CLOSED/HIDDEN state, version and timestamps.
- `discussion_comment`: discussion, private hashed author reference, existing profile reference, optional parent, plain text (1–4000 characters), OPINION/EXPERIENCE classification, visibility and timestamps.
- `discussion_audit`: actor hash, action, topic/comment reference and timestamp; no copied comment text or identity payloads.

Two existing article formats are supported. Legacy `science_article` discussions reference the exact reviewed article revision; their public visibility also requires its claim revision to remain published. New editorial publications reference `editorial_post` and resolve its currently published version. Neither body nor evidence/sources are copied. One discussion per legacy article revision or editorial post is enforced by partial unique indexes. A topic's article relationship cannot be reassigned. Legacy revision replacement requires a new explicitly curated discussion rather than silently attaching old comments to changed scientific context.

Membership-like public author listings do not exist. Comment projections expose only the current profile display name (or localized fallback), timestamps, text/classification/status and a caller-specific `own` boolean. They never expose profile UUIDs, Firebase UIDs, emails or author hashes. The composer explicitly explains public display-name/text visibility. Profile removal severs its FK; account erasure additionally scrubs text and author references into DELETED tombstones under the existing account advisory lock.

Composite parent/discussion foreign keys and a database trigger enforce same-topic, one-level replies. Indexed thread/author/visible-comment queries support pagination, counts and activity. Top-level comments and each root's replies are paginated separately; hidden/deleted roots remain tombstones so replies are not orphaned. Visible comment counts include replies and exclude hidden/deleted/removed text. Latest activity is the newest visible comment timestamp, falling back to topic creation. Popularity is visible comment count, not a fabricated score.

## Permissions and moderation policy for v1

- Public: read non-hidden topics only when the linked article is publicly available. OPEN permits verified-account commenting; CLOSED permits reading only; HIDDEN is unavailable publicly.
- Commenting: existing verified Firebase identity and application profile required. Account identity is derived from the token, never request fields. Per-account transactions and topic row locking serialize comments against account erasure and topic closure. A database-backed limit permits at most20 submissions per account/minute.
- Ownership: only the author can delete their own comment, including after topic closure/hiding. Repeated own deletion returns204. Deletion clears text/profile reference, preserves thread structure and cannot be undone through moderation.
- Administration: existing **editorial REVIEWER** role, checked by the backend on every operation. AUTHOR-only or Events admin grants do not confer scientific discussion moderation. Existing profile administration links to `/editorial-discussions` for reviewers; this is part of the same app.
- Moderators may hide (text retained only for reviewer inspection), restore hidden comments, or permanently remove text. Removed/deleted comments cannot be restored. Topic edits use `expectedVersion`; stale saves return409. Administration can inspect/moderate comments even after the source article is archived.
- Render comments as plain React Native Text. No HTML renderer, markdown execution or automatic external-link handling. Reject blank, oversized and forbidden-control-character text.
- Comments are explicitly labelled personal opinions/experiences and are not scientific verification or medical advice. The original article retains its existing publication/review label and sources.

This is the requested basic moderation scope. Full reporting, blocking, appeals and broader Community policy/legal launch gates remain separate roadmap items; this implementation does not mark them complete or authorize public deployment.

## REST API

Prefix `/api/v1`. Paginated responses use `{items,total,page,size}`. Page is zero-based (0–100000), size1–100. Error responses use existing conventions:401 authentication,403 permission,404 unavailable/foreign comment,400 validation,409 stale edit/closed topic/duplicate discussion,429 comment rate limit.

| Method/path | Purpose |
| --- | --- |
| GET `/discussions` | Public directory. `q` literal case-insensitive title search; `category` existing science category; `sort=RECENT\|POPULAR`; optional `articleType=ARTICLE\|POST`, `articleId`, page/size |
| GET `/discussions/{id}` | Topic, linked article metadata, count/activity and caller's `can_moderate` |
| GET `/discussions/{id}/comments` | Top-level comments, or replies with `parentId`; page/size |
| POST `/me/discussions/{id}/comments` | Add comment/reply; `{content,kind,parentId?}`;201 `{id}` |
| DELETE `/me/discussion-comments/{id}` | Delete own comment;204 |
| GET `/me/discussions` | Paginated publicly available topics in which the caller has visible comments |
| GET/POST `/editorial/discussions` | Reviewer directory / controlled creation |
| GET/PUT `/editorial/discussions/{id}` | Reviewer detail / edit |
| GET `/editorial/discussions/{id}/comments` | Reviewer comment projection, including hidden text; optional parentId and pagination |
| PUT `/editorial/discussion-comments/{id}` | `{status:HIDDEN\|VISIBLE\|REMOVED}`;204 |

Topic input: `{title,articleType,articleId,status,expectedVersion?}`. Creation requires a published article; edit preserves the original relationship. Response fields follow existing SQL snake_case conventions. Read responses inherit no-store security headers.

## Client integration

Public routes `/discussions` and `/discussions/[id]`; existing authenticated administration route `/editorial-discussions`. Directory uses existing PublicationCard list styling, ReadingCard/Text, Screen, Button, TextField, EditorialSelect and Ocean tokens. Existing EN/PL translations, date localization and desktop/mobile layouts are retained.

ArticleScreen adds a small action for a real linked discussion with its real visible count. Details navigate back to the original article route; existing article content, source links and review information are preserved. Hub shows real recent discussions and enables its discussion card. **Community remains without Events cards/list**, per the owner's latest correction. My Activities remains unavailable.

Comments have loading/error/empty states, deletion confirmation, one-level reply controls and paginated replies. Mutations guard duplicate taps and account changes; uncertain outcomes require refreshing server state before another write. No success state is inferred after an uncertain save.

## Validation and activation

Actual test counts and platform evidence are recorded in P5-I00D in PHASES.md. API tests use real Spring Security, Flyway and an isolated PostgreSQL; browser fixtures separately exercise UI and never seed application data. Existing Blog/Science public API and Events/Circles/RSVP regression suites are included.

No application database migration/restart, production deployment or role grant is performed. Start the updated development backend through the existing RUN.md workflow so Flyway applies pending V26–V28. A reviewer then selects an existing published article to create the first discussion. No fake topics/comments are inserted by migrations.

Native exports prove compilation only. Authenticated iOS/Android runtime, VoiceOver/TalkBack and live Firebase-to-API end-to-end acceptance must be recorded separately. Check public reading, sign-in, add/reply/delete, counts after reload, original article navigation, both languages/themes and large text. Existing map-preview regression from Phase2 remains outside this change.
