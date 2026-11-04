# Sober Events — P2-I01

Implementation prepared 2026-11-04. **NOT VERIFIED**: no compilation, tests,
API calls, backend restart or migration execution, at the owner's request.
Migration V17 is pending. This iteration introduces the backend only; discovery
UI belongs to P2-I02, organizer UI to P2-I03, inquiry sending to P2-I04.
Policy: [EVENTS_POLICY.md](EVENTS_POLICY.md).

## Identity and access

Public GETs need no account. All organizer/moderation endpoints require a
Firebase bearer token with verified email. Membership is checked against the
requested organizer; supplying another organizer/event/media ID does not grant
access. Deleted accounts are denied and private actions serialize with account
erasure. No client-supplied UID or role is accepted.

Events moderators are a separate, trusted server-side allowlist. There is no
HTTP endpoint to grant this role. An administrator may provision an existing
verified account after V17 using a parameterized database command:

```sql
INSERT INTO events_moderator(firebase_uid) VALUES (:trusted_firebase_uid)
ON CONFLICT(firebase_uid) DO UPDATE SET active=true;
```

A moderator cannot verify their own organizer or approve/publish their own event
revision, nor an organizer they currently belong to. Verification is not seller
KYC. The server does not fetch external URLs. Two different verified identities
are needed for the organizer and independent moderator flows.

## Public routes

- `GET /api/v1/events/categories`: codes, tracks and EN/PL labels.
- `GET /api/v1/events`: `{items,page,size,total}`; page defaults0, size20 (1–100).
- `GET /api/v1/events/{id}`: published details, or the last published snapshot
  with CANCELLED status; unavailable records return404. Details/media expire
  from public access12 months after the event ends.
- `GET /api/v1/events/media/{id}`: normalized JPEG only if attached to an eligible
  public event; no-store, rechecks publication/organizer status.
- `GET /api/v1/organizers/{id}`: verified organizer's ID, name, description,
  website and verification state. Never the contact email or evidence reference.

Search parameters: `q` (literal title substring), `city` (case-insensitive exact),
`country` (ISO2), `track`, `category`, `alcoholPolicy`, `priceKind`, `currency`,
`maxPriceMinor`, `accessibility`, `availability`, `from`, `to`, `locale`,
`latitude`, `longitude`, `radiusKm`, `page`, `size`.
Enums are uppercase; locale is `en`/`pl`. Times are ISO UTC instants; the range
is start-inclusive/end-exclusive. Default `from` is now; ended and cancelled
records never appear in search. `maxPriceMinor` requires ISO currency and only
matches known amounts in that currency (free events have no currency). Spatial
search requires all three parameters and a radius0.1–250 km; ungeocoded venues
are excluded, location is not stored. Stable ordering is starts_at then ID;
items and count use a repeatable-read snapshot.

The default policy is **ALCOHOL_FREE**. `alcoholPolicy=SOBER_FRIENDLY` is an
explicit separate search, never a fallback. Both require a verified organizer,
independent approval, source/rights/control/ABV verification and current published
revision. Strict requires explicit false for sale/service/BYOB; friendly requires
explicit alcohol-free participation. Private contact details, sources, notes,
actor identifiers and drafts are never part of the public projection.

## Organizer routes

Prefix `/api/v1/organizer`:

- `POST /organizations`: name, description, HTTPS website, contactEmail;
  returns created private record (201), version1 and UNVERIFIED.
- `GET /organizations?page=0`: own organizations,50/page.
- `GET /organizations/{id}`: member-only details including current version.
- `POST /organizations/{id}/submit`: `{expectedVersion,evidenceReference}`;
  UNVERIFIED/REJECTED to IN_REVIEW. Suspended verification requires moderator
  reopening. Changes return204; reread the resource to obtain the new version.
- `POST /organizations/{id}/venues`: name, address, city, optional region,
  countryCode and optional paired latitude/longitude; returns `{id}` (201).
- `GET /organizations/{id}/venues?page=0`:50/page.
- `POST /organizations/{id}/media`: multipart `file` and `altText`, returns `{id}`.
  JPEG/PNG up to5 MB/20 megapixels; normalized to1600×900 JPEG, metadata stripped.
- `GET /organizations/{id}/media/{mediaId}`: member-only image preview.
- `POST /organizations/{id}/events`: event body, returns private details (201).
- `PUT /organizations/{id}/events/{eventId}`: full new revision with
  expectedVersion, returns private details. Venue/cover must belong to the host.
- `GET /organizations/{id}/events?page=0`:50/page.
- `GET /events/{id}`: own event, current content, review feedback and audit actions.
- `POST /events/{id}/submit`, `/withdraw`, `/cancel`: `{expectedVersion}`,204.

Event body uses dynamic real data; required fields:
`venueId`, `title` (max300), `description` (max30000), `locale`, `track`,
`category`, `alcoholPolicy`, `alcoholRules`, `beverageNotes`, `startsAt`, `endsAt`,
`timezone`, `priceKind`, `accessibility`, `entryRules`, `sourceUrl`,
`sourceReference`. Optional: `coverId`, `externalTicketUrl`, `accessibilityNotes`,
`availability` (UNKNOWN/AVAILABLE/SOLD_OUT; defaultUNKNOWN), `controls`,
`contentRightsAttested`, `priceMinor`, `currency`; editing requires expectedVersion.

`controls` has nullable `alcoholSold`, `alcoholServed`, `alcoholPermitted`,
`explicitAlcoholFreeParticipation`; missing facts are unknown, not false.
Source URL/reference and content rights attestation remain private. Approval
requires the attestation and a human verification of all four checks.

Dates must contain an offset and a later end; stored as UTC timestamptz plus
IANA timezone. `Z` is an absolute UTC instant; nonzero offsets must agree with
the named zone at that instant, including DST. Prices use integer minor units:
FREE requires0/null currency, PAID positive amount and ISO currency, UNKNOWN
requires null amount/currency. Accessibility: UNKNOWN/ACCESSIBLE/PARTIAL/
NOT_ACCESSIBLE. Venues/media and content revisions are immutable snapshots;
create replacements and reference them in a new revision when changes are needed.

Edits to published/approved content invalidate approval and move the event to
IN_REVIEW, hiding it until independently reviewed and published again. DRAFT and
CHANGES_REQUESTED can be edited; revisions are append-only. A reviewed revision
cannot be reviewed twice: after changes are requested, edit to a new revision
before resubmitting. Submitted records can be withdrawn to DRAFT. An event that
was published then edited and cancelled exposes only its last published snapshot.

## Moderation routes

Prefix `/api/v1/moderation`:

- `GET /organizers?page=0`: verification queue and verified/suspended hosts,50/page.
- `POST /organizers/{id}/decision`: expectedVersion, decision, notes,
  authorityConfirmed. VERIFIED/REJECTED require IN_REVIEW; verification requires
  confirmed authority, private evidence reference and contact email. SUSPENDED
  is allowed from VERIFIED; IN_REVIEW reopens a suspended host.
- `GET /events?page=0`: IN_REVIEW/APPROVED/PUBLISHED,50/page.
- `GET /events/{id}`: private evidence, current content and review/audit.
- `GET /events/media/{id}`: authenticated moderator image preview.
- `POST /events/{id}/review`: expectedVersion, decision
  (APPROVED/CHANGES_REQUESTED/REJECTED), notes, checks. Only IN_REVIEW is accepted.
  Checks: sourceVerified, contentRightsVerified, alcoholControlsVerified,
  beverageAbvVerified; all must be explicitly true for approval.
- `POST /events/{id}/publish`: expectedVersion; only independently approved,
  current, not-ended content with a currently verified host can publish.
- `POST /events/{id}/cancel`, `/archive`: expectedVersion, guarded state transition.

Mutations return204 unless described otherwise. Missing/inaccessible private
resources404; missing role403; stale expectedVersion409; invalid input400.
Database constraints additionally guard reviews, snapshots and publication.
An organization suspended or left without members immediately disappears from
public reads. Account erasure removes membership/moderator access, clears inquiry
PII and organizer contact/evidence owned by that account, and suspends orphaned
organizations. Immutable audit uses pseudonymous SHA-256 actor references;
retention jobs and inquiry dispatch are not implemented by this iteration.

## Acceptance handoff — NOT EXECUTED

Owner verification should cover V17 on the existing V16 database and a fresh
schema; organizer/member/moderator/anonymous/unverified/deleted-account ACL;
self-review rejection; concurrent stale version writes; draft/media privacy;
edit/review/publish/cancel and suspension visibility; timezone/DST and ambiguous
local times; strict/friendly/unknown controls; date/price/accessibility/geo filters,
page boundaries, invalid links/images and cross-organizer venue/cover IDs;
account erasure and cancellation snapshot behavior. No real events are seeded.

### P2-I02 discovery extension — NOT VERIFIED

Search additionally accepts `region` (case-insensitive exact venue region) and
`sort=START_ASC|START_DESC|PRICE_ASC`, default START_ASC. Sort is applied before
pagination with deterministic ID tie-breakers. PRICE_ASC requires one ISO
currency. Shared web/native discovery, date semantics and owner acceptance are
in [EVENT_DISCOVERY.md](EVENT_DISCOVERY.md). No additional migration beyond V17.

### P2-I03 — public calendar and details

`GET /api/v1/events/{id}/calendar.ics`: public eligible event → escaped/folded
UTF-8 ICS attachment, no-store; cancelled/ended410, unavailable404.
See [EVENT_DETAIL.md](EVENT_DETAIL.md) for app routes, external links, calendar
import limitations and minimum production SEO requirements. NOT VERIFIED;
no migration beyond V17, no build/restart performed.

### Manual event editor — V18 (pending, NOT VERIFIED)

Organizer event input accepts optional `descriptionDocument` (allowlisted Tiptap
JSON, no inline images) and `organizerUrl` (HTTPS). Stored per immutable revision;
public details return `description_document` and `organizer_url`; legacy records
fall back to plain description/organization website. Private owned venue lookup:
`GET /api/v1/organizer/organizations/{id}/venues/{venueId}`. Web entry and scope
are documented in [EVENT_EDITOR.md](EVENT_EDITOR.md). No migration/restart run.
