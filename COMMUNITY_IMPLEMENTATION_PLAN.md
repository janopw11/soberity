# Community implementation plan

Started: 2026-11-12. Scope: **Community Phases 1–4 explicitly requested by the owner**, tracked as P5-I00A (foundation), P5-I00B (participation) P5-I00C (Circles) and P5-I00D (Science Discussions) in PHASES.md. This five-step feature plan is distinct from the repository's education Phase 1. No completion of the existing Community policy/group iterations is implied.

## Architecture findings

- Consumer: React Native / Expo Router / TypeScript. Authenticated routes live in `apps/consumer/app/(authenticated)`; `AuthStatusContext` and the root protected stack handle Firebase identity, verification and backend session confirmation. Community uses this guard and existing stack headers; no new auth mechanism.
- Navigation: shared `navigation.ts` and `SideMenu.tsx`, with an existing disabled Community item. Enable that item at `/community`; retain Sober Events at `/events`. Hub cards expose all four areas; only Discover Events is enabled. No empty destination routes.
- Backend: Java/Spring modular monolith with PostgreSQL/Flyway. `EventPublicController` and `EventCatalog` provide public paginated discovery, published event details and images. Hub reads `GET /api/v1/events?dateScope=UPCOMING&page=0&size=3`, with existing chronological ordering. UPCOMING intentionally includes ongoing events according to the existing end-time rule; copy explains this. No backend or event rules changed.
- Event model: `DiscoveryEvent` carries cover ID/alt, title, start/end, timezone, city/country, venue and category. Reuse `EventCard` / `EventTicket` for images, local date formatting, location, accessible details links and existing private Going Sober badges. The hub performs no RSVP or interest mutation. Missing images retain existing ticket fallback.
- Science: `scienceApi.ts` exposes versioned Article/Claim/Source and rich Post models. Public reviewed science and editorial workflows already exist; discussions must later reference these records without representing user opinions as verified evidence. No discussion or circle API currently exists.
- Administration: authenticated editorial routes in the consumer app; Events admin API under `/api/v1/admin/events` uses separate permission checks. Organizer/moderation endpoints are currently denied by SecurityConfig. Do not repurpose editorial roles as community moderators without an explicit access policy.
- UI: reuse Ocean theme context, semantic tokens, Screen safe areas/scroll/max width, SettingsIcon, Button, Alert and LoadingState. Shared CommunityCard has focus/hover/pressed states and explicit disabled semantics. CircleCard and DiscussionCard provide reusable unavailable-state presentations, without fabricated records/counts. Grid adapts from one to two/four columns; events use one/two/three. EN/PL supplied.

## Conflicts and boundaries

The original roadmap places full Community after a policy/threat-model iteration. The explicitly requested read-only foundation adds no user-generated content, membership or public identity disclosure, so it does not bypass those future gates. Existing Going Sober remains unchanged despite RSVP being excluded from this scope. My Activities stays unavailable rather than pretending the existing Going Sober list is a complete activity hub. The previous static Home community highlight is outside this hub and remains unchanged.

The menu had an existing TypeScript error in an unreachable Science navigation branch; the fallback is now false, preserving the two actual subsection behaviors. No dependency, schema, authentication or architecture changes.

## Feature phases

| Feature phase           | Scope and dependencies                                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 — Event Participation | Implemented on explicit request: reuse Going Sober, extend private state with real counts, add public aggregate, erasure migration V26, Join/Cancel UI and tests. See backend/EVENT_PARTICIPATION_API.md and P5-I00B for validation. Discovery/map/admin behavior retained. |
| 3 — Sober Circles       | Implemented on explicit request: admin-curated Circles, private memberships, real counts, directory, details and existing Event associations. See backend/CIRCLES_API.md and P5-I00C. Broader UGC/moderation gates remain deferred.                                                                                                                              |
| 4 — Science Discussions | Implemented on explicit request: article-linked topics, opinion/experience comments, one-level replies, reviewer moderation, private participation API and real Hub data. See backend/SCIENCE_DISCUSSIONS_API.md and P5-I00D for checks/limits.                                                                                                                |
| 5 — My Activities       | Private aggregate of authorized event/circle/discussion activity, deletion/export and empty/loading states. Avoid public attendance disclosure.                                                                                                                             |

## Verification

See P5-I00A in PHASES.md for executed checks and platform limitations. Browser tests use synthetic records solely in the existing test fixtures; production UI fetches real Events API data. Native runtime and real backend integration must be distinguished from fixture-based browser coverage.

## Phase 2 implementation findings (2026-11-12)

Existing V25 already provided unique, idempotent per-account participation and private registered-event retrieval. Phase 2 extends that API, rather than introducing EventParticipation alongside it. Found and repaired missing account/event erasure hooks in V26; added account verification/erasure locking and serialization with event deletion. Public participant counts are authorized by this phase; participant identities remain private. The previous Phase 1 note excluding RSVP applies to that phase only.

Frontend changes stay in the existing participation component/API client and EN/PL resources. No Event Details layout, discovery, category, map, location or event administration redesign. Circles, Discussions and the full My Activities dashboard are not started.

## Phase 3 implementation findings (2026-11-13)

The earlier architecture findings describe the Phase 1 baseline. Phase 3 enables the Circles navigation card, replaces its Hub placeholder with real data, and introduces a small JDBC service/controller and Flyway V27. No new UI dependency or authentication system. Existing Events administration grant governs Circle management; public creation, member identities, chat and feeds are excluded. This narrow admin-curated scope does not mark the broader Community policy/UGC roadmap complete.

Circle memberships have composite uniqueness, account-erasure cleanup and transactional concurrency protection. Inactive Circles disappear from public discovery/detail but existing members may still leave through My Circles. Counts remain real indexed database aggregates. Explicit Event ID associations reuse EventCatalog eligibility/upcoming rules and EventCard/details, without copying Events or changing RSVP/map behavior. Shared media upload and private preview are reused; only admin-owned media is selectable.

New routes and implementation: `src/circles/*`, authenticated `circles/index`, `circles/[id]`, `editorial-circles`; existing Events admin links to Circle management. EN/PL and Ocean themes use existing components/tokens. API contracts, persistence, activation and limitations: `backend/CIRCLES_API.md`. Test evidence and pending native/manual acceptance: P5-I00C. No Science Discussions or full My Activities implementation. Phase 4 requires an explicit new instruction.


**Korekta właściciela 2026-11-13:** zakładka Community nie zawiera wydarzeń: usunięto kafel Discover Events, listę Upcoming Community Events i pobieranie Events API. Pozostają trzy kafle społeczności oraz sekcje Circles/Discussions. Sober Events jest osobną pozycją nawigacji. Wcześniejsze opisy czterech kafli i wydarzeń w Hubie dokumentują stan historyczny.


## Phase 4 implementation findings (2026-11-13)

Explicit owner request adds structured article discussions only. `science_article` has immutable reviewed revisions and `editorial_post` has published versions; references reuse these models instead of copying content. Legacy discussions pin the reviewed revision, while editorial posts resolve current published content. Public visibility follows the original article/evidence publication guards. Existing editorial REVIEWER controls topic creation/status and moderation; user identity comes from verified Firebase and the existing profile. Only display names are public; account erasure scrubs comments.

V28 adds topic/comment/audit tables, foreign keys, one-level reply guards, indexes and erasure cleanup. Public directory supports name search, existing science categories, real visible-comment popularity and latest visible activity. Own participation API is available for Phase5, without implementing its dashboard. Plain-text comments distinguish opinions from experiences, with a clear boundary from educational evidence. Existing article details receive a real discussion link/count and keep original sources/design. Hub replaces the discussion placeholder; the owner's removal of Events from Community remains intact.

Administration extends the existing consumer app and profile editorial entries. No new dependency, auth architecture or separate admin application. API and moderation semantics: backend/SCIENCE_DISCUSSIONS_API.md. This narrow Phase4 implementation does not close broader P5 reporting/blocking/appeals/legal launch gates. Phase5 requires explicit instruction.
