# P1-I04 — learning API

Current owner decisions (2026-11-03): authors can publish quizzes directly or
request independent review. Each new question has an explanation and one or
more titled HTTPS research sources. A published EvidenceClaim is not required.
This supersedes the initial quiz requirement; structured EvidenceClaims,
flashcards and RAG retain their scientific review rules (ADR-007).

## Authoring

- `GET /api/v1/editorial/quizzes?page=0`: editorial catalog, 20/page.
- `GET /api/v1/editorial/quizzes/{id}`: complete definition and immutable audit.
- `POST /api/v1/editorial/quizzes`: AUTHOR, body:

```json
{
  "locale": "pl",
  "title": "Quiz title",
  "action": "PUBLISH",
  "questions": [{
    "id": "<UUID>",
    "type": "TRUE_FALSE",
    "prompt": "Question text",
    "explanation": "Explanation including context and limitations",
    "options": [
      { "id": "<UUID>", "label": "Prawda", "correct": true },
      { "id": "<UUID>", "label": "Fałsz", "correct": false }
    ],
    "sources": [{ "title": "Study title", "url": "https://doi.org/..." }]
  }]
}
```

`PUBLISH` publishes atomically as AUTHOR. `REVIEW` (default) submits to IN_REVIEW.
A quiz contains 1–30 questions, each with 2–6 distinct options and a nonempty
explanation. Supported types: TRUE_FALSE (two canonical language-specific labels),
SINGLE_CHOICE (exactly one correct), MULTIPLE_CHOICE (one or more correct).
At least one option must be incorrect. An unknown/depends option can be authored.
Each new standalone question requires 1–10 distinct HTTPS links, with titles,
without URL credentials. The API validates link structure, not the scientific
merit of a paper; the author/reviewer is responsible for source quality and
faithful explanations. Plain text is never rendered as raw HTML.

`POST /api/v1/editorial/quizzes/{id}/decision` accepts `{action,notes}`:
AUTHOR_PUBLISH is only for the quiz's own AUTHOR while IN_REVIEW; PUBLISH is
for an independent REVIEWER; ARCHIVE is for its author or a reviewer.
Reasons are recorded. Immutable content and publication provenance AUTHOR vs
REVIEWED are enforced in V8/V9; corrections require a new quiz.
No published quiz is labeled independently reviewed solely because it has links.

## Public quiz flow

- `GET /api/v1/learning/quizzes?locale=en&page=0`: catalog, 20/page.
- `GET /api/v1/learning/quizzes/{id}`: prompts/options; no answer keys,
  explanations or explanation sources before answering.
- `POST /api/v1/learning/quizzes/{id}/answers`:
  `{questionId,selectedOptionIds,saveProgress:false}`. Returns correctness,
  correct/selected IDs, explanation and `sources:[{title,url}]` for that question.

The UI shows sources immediately below the explanation after any answer,
including an incorrect one. Archived quizzes disappear from the public catalog.
Existing quizzes with pinned `claimId`/`revisionId` continue to work; their
question source list may be empty, so their existing Evidence card is shown.
Replacing/withdrawing pinned evidence still hides the dependent legacy quiz.
New source-only quizzes have no such dependency. Flashcards continue to use
published, independently reviewed EvidenceClaims in the selected locale.

Only the server scores answers. A multi-option answer must match the exact set.
Unknown/duplicate options are rejected. Responses are no-store. Anonymous
answers are not persisted. The answer endpoint has a bounded per-process token
bucket (30 burst, refill 1/s; 10,000 ephemeral UID/connection-address buckets).
429 includes Retry-After. No XP, streaks, timers or penalties are introduced.

## Optional account progress

Saving starts disabled; the user opts in to load progress and save subsequent
answers/reviewed cards. No learning data in localStorage or AsyncStorage.
Private client state remounts when the account changes. Earlier unsaved answers
are not silently uploaded when enabling saving mid-quiz.

- `GET /api/v1/me/learning/quizzes/{id}`: latest answered questions only, with
  explanation and sources; never reveals unanswered questions' answer keys.
- `GET /api/v1/me/learning/flashcards`: reviewed published revision IDs.
- `PUT /api/v1/me/learning/flashcards/{claimId}`: `{revisionId}`.
- `DELETE /api/v1/me/learning`: erase all educational progress for this identity.

Saved quiz progress requires `saveProgress:true` and verified Firebase identity.
Quiz ID and immutable version identify the content; latest responses are saved,
not a longitudinal attempt ledger. Records contain educational selections and
server timestamps, with no health/consumption fields. Per-account transaction
locks serialize saves and erasure; the existing account-deletion transaction
erases progress using the V8 trigger and prevents concurrent recreation.
Editorial definitions and audit are retained separately.

## Runtime and verification

`/science/learn`, `/science/flashcards`, `/science/quiz/{id}` are shared RN UI.
The web editor `/editorial-quizzes` is linked from Account and the article
library. Loading/empty/error/retry, EN/PL, keyboard focus and both token themes
are implemented. Pilot content/Myth Battle remain P1-I06, cadence P1-I05.

V8/V9 were applied locally. Source links use the existing immutable definition
JSON and need no additional migration. The latest backend was packaged with
-DskipTests and started successfully on 8090. No quizzes were published by the
agent. No tests ran; API/UI behavior and native runtime remain NOT VERIFIED.
