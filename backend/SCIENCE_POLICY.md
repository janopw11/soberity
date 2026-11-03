# Scientific content and source policy

Scope: P1-I00, scientific model and database integrity. Public APIs are P1-I01;
editorial roles, application workflows and admin UI are P1-I02. There are no
new publication endpoints, automatic importers, actual research seeds or UI
changes in this iteration.

## Source selection and scientific judgement

Find candidate publications through PubMed/PMC, WHO/IARC and publisher sites,
including **[The Lancet](https://www.thelancet.com)** as requested by the owner.
These are discovery/provider labels, not evidence levels or an automatic
approval list. Verify every publication at its original DOI/PMID/URL and check
for corrections, retractions, date and applicability before use. The current
validators check syntax, not whether a paper exists or whether its findings
support a claim.

Distinguish systematic review, meta-analysis, randomized trial, observational
study, guideline, report, preprint, commentary, editorial and other material.
Methodological quality, bias, consistency, population, exposure and outcome
matter; neither a prestigious journal nor study type alone determines certainty.
For the pilot, commentary/editorial/preprint alone cannot be the supporting
evidence required for approval. They may be linked as context or conflicting
views. A reviewer must still assess a source tagged `OTHER`; it is not an
escape from the review requirement.

Every claim revision explicitly records `HIGH`, `MODERATE`, `LOW`, `VERY_LOW`
or `INSUFFICIENT`, plus rationale, limitations and uncertainty. This is a
documented editorial assessment; no automatic or certified GRADE evaluation
is claimed. Descriptive statistics explain data quality rather than implying
causation. Do not convert population estimates into individual diagnoses.

Use association wording for observational associations. A causal inference
requires a written author justification and a separate written causal
assessment explicitly approved by the independent reviewer. A causal claim
cannot carry `INSUFFICIENT` certainty. These structural guards cannot detect
misleading language in free text; scientific review remains mandatory.
When relevant and available, discuss absolute and relative risk, dose, period,
population and intervals, clearly distinguishing what was and was not found.

## Bibliography, access and licenses

`ScientificSource` is an immutable bibliographic snapshot: title, author or
issuing institution, optional organization/journal, publication year and
optional exact date, HTTPS URL, optional canonical DOI/PMID, study type,
provider, license/rights description, optional license URL, access type and
retrieval time. A year does not fabricate an exact day. Source publication
date differs from the date a Soberity claim is published.

Access types are `OPEN_ACCESS`, `ABSTRACT_ONLY`, `SUBSCRIPTION`, `UNKNOWN`.
Store `UNKNOWN` when reuse rights have not been established; this does not
grant permission to reproduce text or illustrations. Prefer original summaries
with citations. Before reproducing publisher content, verify the particular
material's license/permission. Abstract access alone must be acknowledged in
the assessment and may be insufficient for a competent review.

Normalize DOI strings to lowercase bare identifiers (accept `doi:` or
`https://doi.org/` as input); PMID is numeric. Citation URLs must be absolute
HTTPS without embedded credentials. Do not import arbitrary metadata as
published knowledge. No scraper or publisher integration is installed here.

## Identity, versions, language and review

| Record              | Purpose                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `evidence_claim`    | Stable UUID, EN/PL locale and creation date                                                                                           |
| `claim_revision`    | UUID, claim/version, author UID, immutable content/scope, change summary, review deadline, lifecycle status and publication timestamp |
| `scientific_source` | Immutable source metadata; optional `supersedes_source_id` for corrected snapshots                                                    |
| `claim_source`      | Source assessment for one exact revision: `SUPPORTS`, `CHALLENGES`, `CONTEXT`, notes and date                                         |
| `scientific_review` | Independent reviewer, decision, notes, date and explicit causal assessment for one exact revision                                     |

Versions are positive and unique within a claim, never overwritten or reused.
They need not be contiguous; gaps are not scientific events. Each language
has its own claim and review, so translating a publication does not inherit
approval. Translation grouping can be added when the editorial API needs it.
Publisher, source access, certainty and inference type are independent fields.

Create a complete immutable draft snapshot, attach/assess its sources, then
submit it. Source links can be added/deleted only while `DRAFT`; editing a link
uses delete + insert. Submission seals citations. Content edits create the
next revision even while drafting, preserving provenance. UI draft buffering
and detailed author/reviewer RBAC are implemented in P1-I02.

Lifecycle: `DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED`, with archival
also possible before publication. A revision has one immutable review decision.
`REJECTED` or `CHANGES_REQUESTED` requires a corrected new revision with a new
review. Author and reviewer UIDs must differ. Approval is tied to that exact
revision and its frozen citations, never inherited from an older version.
UIDs are audit references without a foreign key to deletable user profiles.
Do not expose editorial UIDs through a future public API.

Approval requires a supporting source, independent approval, and any required
causal assessment. Publication additionally requires a valid publication time,
not in the future or before the review, and a future review deadline. Scheduling
is P1-I05; a future publish time cannot bypass the publication guard.
Only one revision per claim can be `PUBLISHED`; archive the old version and
publish the new one in a single transaction. Archived content retains its
original publication time and cannot be reactivated or rewritten.

Correct a source by inserting a new metadata snapshot with a lineage link.
DOI/PMID are indexed but deliberately not unique across metadata snapshots.
Old citations continue pointing to the source actually reviewed. Withdraw an
incorrect claim by archiving the publication; dependent content filtering and
public API publication rules belong to P1-I01/P1-I06. The clock passing a
review deadline does not automatically archive an existing publication; the
editorial scheduler/review workflow must handle overdue reviews explicitly.

## Database guarantees and trust boundary

Flyway V4 adds tables, foreign keys, checks, a partial unique index and triggers;
it changes no account/profile rows. SQL rejects published inserts, unsupported
transitions, source-free approval, self-review, edits/deletion of revision/review
history, invalid causal approval and conflicting publication versions. Citation
writes and review insertion lock the revision, serializing with submission and
publication. Tests include a concurrent citation deletion versus submission.

These guards assume an ordinary application DB session with triggers enabled.
They do not defend against a database administrator disabling constraints or
falsifying source/reviewer records. Future APIs must derive editorial identity
from authenticated principals and enforce author/reviewer roles; possession
of a different UID string is not proof of reviewer qualifications.

## Verification without Docker

Default integration tests use PostgreSQL 17 Testcontainers. When Docker is
unavailable, an explicit test-only override can point to a fresh native cluster:

```sh
SOBERITY_TEST_JDBC_URL=jdbc:postgresql://127.0.0.1:25439/soberity_test_p1i00 \
SOBERITY_TEST_DB_USER=soberity_test \
  ./mvnw --batch-mode --no-transfer-progress clean verify
```

Run this from `backend`. Provision the isolated database first; the override
only accepts loopback URLs and `soberity_test_` names, without URI query or
credentials. Use `SOBERITY_TEST_DB_PASSWORD` if that test cluster requires it.
Never point tests at an existing app/staging/production database. This changes
only test support; application datasource configuration remains unchanged.

Requirements: product report §3.2 and §24; owner addition of The Lancet.
Implementation decision: local `docs/adr/005-scientific-evidence-and-editorial-policy.md`.
