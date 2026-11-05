# Sober Events — stage-one policy

Version 2.0 · 2026-11-05 · P2-I00

This is the versioned policy for the owner's stage-one scope approved in
PHASES.md on 2026-11-05. It supersedes the 2026-11-04 requirement for organizer
accounts and independent review **for this stage**. The product report remains
the broader roadmap. No real event is approved by this document.

## 1. Sober qualification and taxonomy — T01

Track and type are independent of alcohol policy. An event name, venue, photograph
or the availability of soft drinks does not establish alcohol-free operation.

| Track | Types (EN / PL) |
|---|---|
| SOBER_NIGHTLIFE | SOBER_PARTY: Sober party / Impreza bez alkoholu; SOBER_RAVE: Sober rave / Rave bez alkoholu; DANCE: Dance / Taniec; LIVE_MUSIC: Live music / Muzyka na żywo |
| SOBER_LIFESTYLE | COFFEE_MEETUP: Coffee meetup / Spotkanie przy kawie; SPORT: Sport / Sport; OUTDOORS: Outdoors / Plener; WORKSHOP: Workshop / Warsztaty; CULTURE: Culture / Kultura; OTHER: Other / Inne |

Stage one lists only ALCOHOL_FREE events: no alcohol sale, service or permitted
BYOB/consumption throughout the event area and duration. Require explicit written
rules and current authoritative confirmation. Missing controls are unknown,
never false. Contradictory evidence makes an event ineligible until resolved.
Administrators must clarify beverage rules, including stated ABV: only confirmed
0.0% offerings qualify for this stage; unknown or nonzero ABV is not silently
accepted as “100% alcohol-free”. Avoid an absolute percentage badge: use
“Alcohol-free event / Wydarzenie bez alkoholu” with its operating rules. This
classification describes those rules, not laboratory certification, attendee
behavior or a health/safety guarantee.

SOBER_FRIENDLY means alcohol may be present and deliberately supported alcohol-free
participation is documented. Retain the legacy vocabulary, but friendly listings
and opt-in are deferred in stage one; they cannot fill empty nearby results or
be labelled sober party/rave. Do not infer nightlife from a lifestyle category.
Unknown types need curator classification, not a client-created enum.

`CuratedEventPolicy.assess` evaluates the same content rules as the legacy
`EventPolicy`, without requiring or inventing a VERIFIED organizer account.
Its ELIGIBLE result means content evidence is sufficient, not permission to
publish. Incomplete source/rights/rules/dates/timezone or unconfirmed beverages
require information; conflicts, invalid dates and friendly events are ineligible.
Full required-field validation and authorization are separate API gates.

## 2. Admin lifecycle, trust and visibility — T04

Only a server-authorized ADMIN can create, publish, withdraw or delete entries.
An ordinary user, ORGANIZER or MODERATOR role alone grants no stage-one write
permission. Roles come from trusted server-side grants, never payload fields.
Do not require the admin to create an organizer account or obtain a second
reviewer's approval. Organizer self-service/verification (T02), public profiles,
contact forms and the independent moderation portal are deferred.

| State | Admin action | Result / visibility |
|---|---|---|
| No record | Create draft | DRAFT, private |
| DRAFT | Publish complete, qualified entry | PUBLISHED, public |
| PUBLISHED | Withdraw for corrections | DRAFT, immediately private |
| DRAFT or PUBLISHED | Delete selected event with confirmation | DELETED, terminal and unavailable publicly |
| DELETED | Republish/restore | Denied; a new event requires fresh checks |

Required before publication: name, selected countryId/cityId, description,
organizer HTTPS page, uploaded/validated picture with accessible alternative
text, event type/track, start date/time with IANA zone, explicit sober rules,
source/rights evidence and beverage clarification. Exact venue/address and an
end time are optional. When an end is supplied it must be after the start;
otherwise validate the start alone and never invent an end. The curated
assessment accepts an absent end and rejects an already-started event for new
publication. The legacy organizer assessment still requires a bounded interval;
P2-I01 must adapt its input/schema contract to permit the optional end.
UTC instants and IANA zone are stored together. Ambiguous/nonexistent local times
must be resolved/validated with an explicit valid offset before conversion.

Only complete, currently qualified PUBLISHED entries are discoverable. Nearby
Home shows startsAt >= now, excluding events already started, cancelled or deleted.
The normal catalog defaults to upcoming events; explicit past date filters and
Joined may include nondeleted past entries within retention. Detail pages may
show honest past/cancellation notices, never offer Join on unavailable/past events.

Publication and its evidence version must be atomic and auditable. Audits contain
action, event ID, admin reference, timestamp and minimal reason, not private
correspondence or user location. Editing published facts first withdraws the
entry until revalidated; P2-I01 must handle versions/concurrent deletion.
Deletion immediately removes discovery/detail/Home/media access and Joined
relations; old links return a consistent 404 or 410 without revealing drafts.
Invalidation includes API/client caches. A minimal nonpublic tombstone/audit may
remain; no active public snapshot survives deletion.

The pure lifecycle table is not an ACL implementation. Existing organizer APIs,
V17/V18 and their moderation guards remain NOT VERIFIED and must be adapted in
P2-I01/P2-I04; they must not provide a bypass of admin-only publication/deletion.
The legacy `EventPolicy.assess`, `allowsTransition` and `listedByDefault` retain
their organizer-review meaning. Do not switch off guards on those endpoints to
make the new domain policy appear integrated.

## 3. Source rights, privacy and retention — T03

An admin checks an authoritative event/organizer page or controlled confirmation
for the actual date, city and sober operating rules. Record source URL/type,
checked time, checking admin, permission/license reference for each description
and image, plus beverage clarification. Recheck before publication. A link alone
does not grant copying rights: write an original description or obtain permission;
use licensed/admin-owned media with attribution as required. Do not scrape or
copy flyers automatically. Public attribution is separate from private evidence.
No health, abstinence or identity-document collection is required.

External URLs must be HTTPS, without credentials or unsafe schemes; validate
without fetching user-supplied URLs. Do not infer price, availability or
accessibility. Stage one provides the organizer-page link and an internal Join
intent, not checkout, reservations, tickets, calendar delivery or organizer alerts.
Demonstration/Preview Home tickets must never be imported as real catalog supply.

Location consent is separate from city browsing. Provide opt-in/revocation in
settings outside the hidden Home section. Ask OS/browser permission only after
an explicit user action; app opt-in never overrides OS denial/revocation. Store
at most a local consent preference/version, never the coordinates. Refresh actual
permission on return to foreground; no background polling or location history.
Use one foreground position per explicit request/consented Home visit. While
permission is unknown, show no nearby section and do not request nearby data.
On denial/revocation/sign-out clear in-memory position, results and pending
requests; late responses cannot re-show stale tickets. A shared device/account
switch must not inherit the previous account's opt-in or private results.

Position is used only in volatile memory for the current search. Never persist it
in profile/storage, analytics, access logs, tracing, crash payloads or shared
caches. Future nearby requests must keep coordinates out of URLs and disable
body logging/tracing (including proxy/APM layers); use a no-store request/response
contract. Do not send user coordinates or search text to GeoNames or a geocoder.
A city centroid is sufficient for event distance when no venue point exists.

Join/Leave requires authentication and operates only on the caller's user–event
relation; unique pair, idempotent retries, no public participants or counts,
no organizer export/notification. Keep only userId, eventId and joinedAt. Joined
search applies the caller filter before pagination and cannot leak through a
public event DTO/cache. No location consent is needed. UI must explain:
“Only saved in Soberity — no reservation or ticket” /
“Tylko informacja w Soberity — bez rezerwacji ani biletu”.

| Data | Purpose limit / disposal required in later persistence work |
|---|---|
| Inactive drafts and unneeded uploaded media | Delete after 90 days of inactivity; no orphan media retained indefinitely. |
| Published past event | Stop upcoming visibility at start, keep minimal past details up to 12 months after end (start if no end), then remove public details and Join relations. Admin deletion takes effect immediately. |
| Private source/rights confirmation | Keep while listing is active, then up to 180 days after deletion/archival; redact private contact/correspondence at expiry. |
| Admin audit/tombstone | Minimal nonpublic decision and references for 24 months after action, then delete/anonymize. Do not retain full event content/media via audit. |
| Device position | Current search/visit memory only; clear on revoke, sign-out, screen disposal or completion of its purpose; no durable copy. |
| Joined | Until Leave, account/event deletion or event's 12-month retention expiry, whichever comes first. Delete immediately in live storage, no residual attendance audit. |
| Backups | Follow existing infrastructure expiry; replay deletion/tombstones after restore before serving data. Do not promise immediate removal from immutable backups. |

Exceptional holds need a recorded reason, limited scope, reviewer and expiry;
never apply a blanket hold to user positions or all Joined records. These are
product retention limits, not a claim of legal certification. No cleanup job,
consent adapter, database erasure or backup operation is delivered in P2-I00.

## 4. Nearby policy and Home states — T05

Default radius: **100 km**, inclusive. Deployment configuration for P2-I01:
`SOBERITY_EVENTS_NEARBY_RADIUS_KM`, finite value from **1 to 500 km**, default 100;
invalid values must fail configuration validation, not silently change distance.
P2-I00 supplies the constant/validator; P2-I01 now wires this Spring configuration (see EVENTS_API.md).
API and UI must share the effective radius; include it in query results/UI copy.
No automatic radius expansion, remote fallback or friendly-event substitution.

Measure approximate great-circle distance from the user's WGS84 point to the
admin-confirmed venue point, otherwise the selected city's WGS84 centroid. Keep
that provenance with the event point; partial/invalid venue points must fail
validation, not silently produce a centroid fallback. No automatic geocoding.
The policy's spherical Haversine uses mean radius 6371.0088 km; database distance
implementation in P2-I01 must agree within an explicitly tested numerical
tolerance at the inclusive boundary. Filter by the unrounded distance; round
only for display. This is approximate straight-line distance, never travel time.
City fallback copy: “Approximate distance to city / Przybliżona odległość do miasta”.

Order before pagination: distance ascending, then start instant ascending,
then event ID for deterministic ties. Changing locale must not change order.
Only current qualified sober upcoming events may enter this query.

| Consent / position / request | Home behavior (EN / PL) |
|---|---|
| Unknown, denied or revoked consent | Entire nearby section hidden; no permission prompt/query automatically triggered. Catalog/search remains available. |
| Consent granted, position unavailable/timeout/OS revoked | If OS permission revoked, hide section and clear opt-in; otherwise “Location unavailable / Lokalizacja niedostępna”, retry and catalog link. Never claim no events. |
| Consent and position, request pending | Loading state, no fabricated tickets. |
| Request failed | Error/retry and catalog link, not an empty-supply message. |
| Valid empty search inside radius | “No events nearby — check out the event base” / “Brak wydarzeń w pobliżu — sprawdź bazę wydarzeń”, with an active Sober Events link. |
| Valid nonempty search | Real upcoming events in current ticket style, ordered nearest first; ticket opens details. |

`CuratedEventPolicy` encodes these state distinctions, radius validation,
distance/boundary rules and ordering. Actual permission handling, query execution
and ticket rendering belong to P2-I01/P2-I02, not this policy iteration.

## 5. Global country/city source — T06

**Selected source: GeoNames downloadable gazetteer, hosted in Soberity's backend.**
Official sources checked 2026-11-05: [export and terms](https://www.geonames.org/export/),
[dump schema and CC BY 4.0 license](https://download.geonames.org/export/dump/readme.txt),
[coverage](https://www.geonames.org/about.html),
[feature codes](https://www.geonames.org/export/codes.html).
The supplier offers a global extract with multilingual names, administrative
codes and WGS84 points; completeness/accuracy is not guaranteed. Product choice:
use a local snapshot, so interactive lookup has no external API dependency.
Do not represent worldwide coverage as a guarantee that every settlement exists.

Import contract for P2-I01 (no download/import performed in P2-I00):

- `allCountries.zip`, `countryInfo.txt`, `alternateNamesV2.zip`,
  `admin1CodesASCII.txt`, `admin2Codes.txt`, `timeZones.txt` from the official
  HTTPS dump directory. Full worldwide populated places, not just cities with
  events or a population-limited `cities15000` extract.
- City picker means inhabited city/town/village. Allow active class-P codes
  PPL, PPLA, PPLA2–PPLA5, PPLC, PPLCD, PPLF, PPLG, PPLL, PPLR and STLMT.
  Exclude historic/abandoned/destroyed settlements, grouped places and city
  sections (PPLCH/PPLH/PPLQ/PPLW/PPLS/PPLX); venue/address handles finer detail.
  Reject/quarantine unknown codes, missing primary country or invalid points;
  never invent a country from an alternate-country field. Keep coverage counts
  and quarantine reasons to detect regional omissions before enabling a snapshot.
- Stable internal countryId/cityId, unique source GeoNames ID and country ISO-2
  metadata. Names are labels, not keys. Do not regenerate IDs on refresh or
  reuse deleted IDs. Region codes are metadata, not stable entity IDs.
- Search country names/ISO codes, city original/ASCII names and valid aliases.
  Use alternate-name language/preferred flags for EN/PL labels, source name as
  fallback when a localized name is missing. Normalize case/diacritics for search
  (including Polish ł), preserve original display text. Historical aliases may
  aid search but never become the current label. Exclude URL/postal-code aliases.
- Separate searchable country and city fields; cities constrained by selected
  countryId. Changing country clears the old city. Selection requires an active
  ID; typed text never becomes a new city record. Display city + admin1 region,
  add admin2 and source ID when needed to disambiguate identical names.
- Retain WGS84 city coordinates and IANA timezone metadata, with timezone checked
  against the Java runtime. Event timezone must be explicitly confirmed; do not
  guess it from the device timezone. Exact venue point is optional.
- Admin-only controlled HTTPS snapshot refresh at least monthly, with download
  timestamp, source modification dates, file SHA-256 computed locally, importer
  version and license/attribution manifest. Stage/validate before atomic promotion;
  preserve last known-good snapshot if import fails. Roll back data versions
  without changing IDs. No per-search calls to the supplier.
- Removed/merged/country-moved records: keep identity tombstones for references,
  stop offering inactive records, require admin resolution for affected events.
  Do not auto-map ambiguous or renamed legacy strings; leave unresolved events
  private until a curator selects a real record. Names alone never establish
  equivalence; recheck pending/public affected event facts during refresh.

Attribution required in location picker/help and data documentation:
“Location data: GeoNames, CC BY 4.0; filtered and normalized by Soberity” /
“Dane lokalizacji: GeoNames, CC BY 4.0; filtrowanie i normalizacja: Soberity”,
linking [GeoNames](https://www.geonames.org/) and
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Keep source notices
with distributed snapshots and describe modifications. No data files or new
provider credentials are added here.

## 6. Verification and implementation boundary

Executable policy scenarios and documented design walkthroughs:
[EVENTS_POLICY_SCENARIOS.md](EVENTS_POLICY_SCENARIOS.md).
Domain implementation: `events/domain/{EventPolicy,CuratedEventPolicy}.java`.
Tests: `src/test/java/com/soberity/events/EventPolicyTest.java`.

P2-I00 defines and verifies policy, not the later location database/importer,
admin ACL/API, permission runtime, Joined persistence or Home UI. P2-I01 now implements and verifies the backend contract, dictionary importer,
admin API and public search: see EVENTS_API.md and EVENTS_API_RESULTS.md.
Consumer adapters/UI, real snapshot activation and Joined remain later work.
P0-I13 remote/staging gate remains open under ADR-010's local-work exception.
The new instruction to implement P2-I00 includes its required verification;
historical “no tests” notes describe 2026-11-04, not this execution.
