# Editorial workflow (P1-I02)

The private web workspace is `/editorial` in the existing Expo application.
After signing in, editors can also open it from Account. The consumer's eight
main navigation entries remain unchanged. The workspace uses the existing
EN/PL translations and theme tokens. Native platforms show a web-only message;
this iteration does not introduce a native admin application.

## Identity and role provisioning

Firebase continues to establish identity and verified email. The backend uses
only the verified token's UID; request bodies, headers and UI state cannot
supply the acting author or reviewer. `editorial_role` holds explicit AUTHOR
and REVIEWER grants. No user has a role by default, and there is **no role
assignment API**. A trusted operator grants/revokes roles in the intended
(non-production unless separately approved) database, after checking identity
and qualifications. The backend checks current grants on each operation.
Deleted application accounts cannot use editorial grants.

Example SQL with psql variables supplied by the operator:

```sql
INSERT INTO editorial_role(firebase_uid, role, granted_by)
VALUES (:'editor_uid', 'AUTHOR', :'operator_reference');
-- Grant REVIEWER separately to the independent person who performs review.
-- To revoke a grant:
DELETE FROM editorial_role
WHERE firebase_uid = :'editor_uid' AND role = 'AUTHOR';
```

`granted_at` and `granted_by` record the provenance of current grants. There is
no automatic promotion from USER, profile fields, organizer role or ADMIN
headers. A reviewer should have appropriate subject expertise; the software
cannot establish qualifications. An operator who needs both roles receives
two grants, but still cannot approve or publish their own material. A reviewer
may withdraw any material, including their own, for prompt correction.

## Contract

All routes below are under `/api/v1/editorial`, require Firebase verified email,
and retain private no-store caching. Anonymous callers receive 401; ordinary
or unverified users receive 403 for material access. `GET /me` returns
`{uid,roles}` (empty roles for ordinary verified users) for access discovery.
There are no changes to public science/evidence write permissions.

| Method / path                                        | Permission and behavior                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /me`                                            | Own verified identity and editorial roles                                                      |
| `GET /materials?type=CLAIM&status=DRAFT&page=0`      | Either editorial role; 50 versions per page, newest first, type CLAIM/ARTICLE, optional status |
| `GET /materials/{type}/{revisionId}`                 | Either role; full material, evidence, citations, review, version history and audit             |
| `POST /sources`                                      | AUTHOR; immutable bibliographic snapshot using P1-I00 SourceMetadata fields                    |
| `POST /claims`                                       | AUTHOR; new claim and draft revision                                                           |
| `POST /claims/{revisionId}/revisions`                | Original AUTHOR; new immutable version with copied citations and no inherited review           |
| `POST /articles`                                     | AUTHOR; new article draft tied to exact claim revision                                         |
| `POST /articles/{revisionId}/revisions`              | Original AUTHOR; new article version with independent review required                          |
| `POST /claims/{revisionId}/citations`                | Original AUTHOR, DRAFT only; `{sourceId,relation,notes}`                                       |
| `DELETE /claims/{revisionId}/citations/{citationId}` | Original AUTHOR, DRAFT only; `{reason}` body                                                   |
| `POST /materials/{type}/{revisionId}/submit`         | Original AUTHOR, DRAFT only; `{reason}`                                                        |
| `POST /materials/{type}/{revisionId}/review`         | Independent REVIEWER, IN_REVIEW only; decision object below                                    |
| `POST /materials/{type}/{revisionId}/publish`        | Independent REVIEWER, APPROVED only; `{reason}`                                                |
| `POST /materials/{type}/{revisionId}/archive`        | REVIEWER; `{reason}`, hides/withdraws any non-archived version                                 |

Creation returns `{id}` (revision/source UUID); transitions return 204.
Lists return `{items,page,size,total}`. Detail and list content fields follow
the existing snake_case SQL projections. Mutation request records use camelCase.
Invalid input is 400, missing material 404, stale transitions or scientific DB
policy conflicts 409. Internal database exception messages are not returned.

Claim draft body: `locale` (en/pl), `category` (existing category code),
`content` (ClaimContent fields below), `changeSummary`, `nextReviewAt` (future
ISO UTC timestamp). A revised claim preserves its language; translations are
separate claims and undergo their own review. Category assignments form a
stable claim taxonomy; revising with another category adds that category.

ClaimContent: `claimText`, `summary`, `evidenceLevel`, `evidenceRationale`,
`limitations`, `uncertainty`, `population`, `exposure`, `outcome`, `inferenceType`,
optional `causalJustification`. Uses the existing scientific vocabulary and
validation policy. Each version records the acting author UID server-side.

Article draft: `revisionId` (exact claim revision), `category`, `title`,
`summary`, `body` (plain text), `changeSummary`, `nextReviewAt`.
The complete article needs its own review; claim approval alone does not
approve free-form article text. No partial PATCH/PUT overwrite endpoint exists.

Review: `{decision,notes,causalityApproved,causalAssessment}`. Decisions:
APPROVED, CHANGES_REQUESTED, REJECTED. A causal claim needs an explicit approved
causal assessment as enforced by V4. For non-causal claims the causal fields
can be false/null. Rejected/change-requested versions are archived, preserving
the decision/reason; the author must create a corrected new version.

## Publication, history and concurrency

Lifecycle: DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED. A submitted
claim requires substantive supporting evidence (not only commentary, editorial
or preprint). Citations seal at submission. Article submission additionally
requires its exact claim revision to be PUBLISHED. Publication requires a valid
review and future review deadline, retaining existing V4/V5 database guards.

The panel displays text, evidence rationale, limitations/uncertainty, scope,
source metadata, rights/access, assessments and review notes. Approval requires
notes and a visible acknowledgement of full-material review. Causal approval
has a separate explanation. Publication and withdrawal have confirmation dialogs
and reasons. API checks remain authoritative; UI acknowledgement does not prove
that the reviewer has actually checked the science.

Every successful creation, citation change, submission, review, publication,
replacement and withdrawal records actor, exact revision, action, reason and
UTC timestamp in append-only `editorial_audit`. Detailed material history shows
all versions and their events. Rejected operations roll back without a success
event. Review audit references, like existing scientific reviews, persist when
a personal profile is deleted; role access is denied for deletion markers.

Version allocation and state changes use transaction/row locks. Claim stable
identities serialize revision numbering; article numbering uses a transaction
advisory lock on stable identity. Publication replacements use that identity
lock and atomically archive the old revision, publish the approved replacement,
and append both audit events. A failed replacement leaves the old publication
intact. SQL content/review immutability guards remain enabled.

Withdrawing/replacing a claim hides articles tied to that exact revision in
public P1-I01 APIs immediately on their next read/revalidation; an article
cannot silently adopt a corrected evidence revision. Source URLs/DOIs are syntax
validated, never fetched by this API. Scientific existence, interpretation and
reuse rights still require human verification. No research content, service
credentials or default role grants are seeded by Flyway V6.

## Local verification

The ordinary Maven suite includes `EditorialApiIT` and retains PostgreSQL
Testcontainers by default. For an isolated native database, use the restricted
`SOBERITY_TEST_JDBC_URL` override described in SCIENCE_POLICY.

The full browser suite uses **real** local Firebase Auth emulator, backend and
PostgreSQL (no mocked editorial APIs). Start the demo-soberity Auth emulator on
127.0.0.1:9099. Create an isolated `soberity_test_…` database on loopback:25439;
start the backend with local profile, that datasource, Firebase demo project,
`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, port 8092 and CORS origins
`http://localhost:8091,http://127.0.0.1:8091`. Never use app/production data.

From `apps/consumer`, with psql on PATH (or SOBERITY_TEST_PSQL pointing to it):

```sh
SOBERITY_EDITORIAL_TEST_DB=soberity_test_p1i02_web \
  pnpm exec playwright test -c playwright.editorial.config.ts
```

The dedicated test configuration starts Expo on 8091 with only demo Firebase
configuration and backend 8092. Tests create synthetic verified emulator users,
grant test roles directly with psql in that explicit test database, and exercise
UI author/reviewer transitions on desktop and mobile web, EN/PL, dark/light,
keyboard/ARIA, publication/withdrawal, ordinary-user guards, articles and new
versions. The test fixture rejects database names outside `soberity_test_*`;
its psql connection is fixed to loopback:25439. Stop the owned local services
after the run; fixtures are retained in the isolated database only.
