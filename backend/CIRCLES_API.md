# Sober Circles — Community Phase 3

Implemented 2026-11-13, tracked as P5-I00C. No chat, social feed, public creation, or Science Discussions.

## Persistence and access

Flyway `V27__sober_circles.sql` adds `community_circle`, `community_circle_member`, `community_circle_event`, and `community_circle_audit`. The existing JDBC/transaction conventions are retained; there is no parallel Event entity. Unique slugs, composite membership/association primary keys, foreign keys, category checks, and reverse lookup indexes enforce integrity. Membership uses the existing hashed Firebase identity; public responses never expose member identities. Account erasure removes memberships under the existing account lock. Joining locks the Circle row and uses `ON CONFLICT DO NOTHING`, including concurrent requests.

Circles contain name, slug, description, category, optional cover, guidelines, active flag, version and timestamps. Categories are classifications, not seeded Circle records. Public lists include active Circles only; existing members can still see and leave their inactive Circles through `/me/circles`. Inactive details/media/related events are unavailable publicly and joining is rejected. Reactivation retains previous memberships. Counts query the indexed membership relation and are returned with each paginated list; no member-list endpoint exists.

Administration reuses **Events admin** (`events_admin` via `EventAccess.admin`) in the existing consumer web administration. Every write checks the backend grant. Edits require `expectedVersion`; stale edits and duplicate slugs return 409. Text limits: name120, slug100, description4000, guidelines6000; up to200 distinct existing non-deleted Event references. Content is plain text.

## API

All paths below start with `/api/v1`. List responses contain `items`, `total`, `page`, `size`; page starts at0, size1–100. Public reads may include the authenticated caller's `joined` status; membership mutations require verified authentication. Authentication/authorization errors follow existing API conventions (401/403); validation400; unavailable404.

| Method/path | Purpose |
| --- | --- |
| GET `/circles?q=&category=&page=&size=` | Active directory; case-insensitive name search and category filter |
| GET `/circles/{id}` | Active Circle detail, member_count, joined |
| GET `/circles/{id}/events?page=&size=` | Related eligible upcoming/ongoing Events |
| GET `/circles/media/{id}` | Cover only while referenced by an active Circle |
| GET `/me/circles?q=&category=&page=&size=` | Caller’s Circles, including inactive memberships |
| GET `/me/circles/{id}` | Caller’s membership, active flag and count |
| PUT `/me/circles/{id}` | Idempotent join, 204 |
| DELETE `/me/circles/{id}` | Idempotent leave, 204; caller only |
| GET/POST `/admin/circles` | Admin list / create (201) |
| GET/PUT `/admin/circles/{id}` | Admin detail / versioned edit |

Admin input fields: `name`, `slug`, `description`, `category`, `coverId`, `guidelines`, `active`, `expectedVersion`, `eventIds`. Response fields follow existing SQL snake_case conventions. Categories: NIGHTLIFE, FITNESS, COFFEE, WELLBEING, OUTDOORS, ART, GAMES.

## Existing Events integration

Explicit many-to-many associations reference existing Event IDs. `EventCatalog.related` applies existing published/eligible visibility and upcoming end-time semantics, with chronological pagination. Draft/deleted/ended Events do not leak into public Circle results. Event records, discovery filters, map coordinates/navigation and RSVP are reused. Circle pages render the existing EventCard and open the existing Event Details route.

Covers reuse existing admin Events media upload, JPEG normalization, alt text and private preview. Admins may upload a cover or select one from an associated curated Event. Organizer-owned private media cannot be attached. The new public media endpoint only serves covers of active Circles.

## Client and validation

Routes: `/circles`, `/circles/[id]`, `/editorial-circles` (existing web admin workspace). Hub previews real API data. Shared Ocean tokens, Screen, Button, Alert, LoadingState, EditorialSelect, SettingsIcon, EventCard and authentication are reused. EN/PL, responsive layouts, filter pagination, loading/empty/retry and unknown-write recovery are included. Account changes discard stale membership responses.

Backend validation: Maven verify, 39 unit/architecture and29 CuratedEventsApiIT integration tests passed against isolated PostgreSQL, including concurrent/duplicate join, leave, ownership, deletion, filters, admin ACL/versioning, inactive behavior, media and event relationships. Client:35 selected unit tests passed. Browser fixtures verify desktop/mobile-web, EN/PL and both themes; results and final static/build checks are recorded in PHASES.md. Fixture browser coverage and real API integration tests are separate evidence, not a live Firebase end-to-end deployment.

## Activation and remaining acceptance

No application database migration or backend restart was performed. Start the updated backend against the intended development database using the existing workflow; Flyway must apply pending V26 and V27 before using this UI. No fake Circles are seeded: an Events administrator must create and activate records in Manage Sober Circles.

Native iOS/Android exports are compilation checks only; authenticated native runtime and VoiceOver/TalkBack remain NOT VERIFIED. After local activation, verify directory/search, join/reopen/leave, related Event navigation, large text and screen reader in EN/PL and both themes on each native platform. Android emulator was unavailable in the prior acceptance pass. Existing colocated-event map preview browser failures remain open; map production code was not changed. Administration remains web-only, matching the existing Events administration pattern.
