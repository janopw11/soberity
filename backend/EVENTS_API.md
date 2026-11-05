# Sober Events — P2-I01 stage-one API

Updated 2026-11-05. Policy: [EVENTS_POLICY.md](EVENTS_POLICY.md).
Verification: [EVENTS_API_RESULTS.md](EVENTS_API_RESULTS.md).

The first stage is an **admin-curated catalog** with a local GeoNames dictionary.
V19 adds global locations and snapshot provenance; V20 adapts existing event,
venue, revision/media/audit tables to curated entries without an organizer account.
V17/V18 checksums are unchanged. All prior organizer data are retained, excluded
from public discovery and available to admins for explicit migration decisions.
No guessed name matching, source data, real events or administrator grants are
inserted by migrations.

## Public location dictionary

- `GET /api/v1/locations/countries?q=polska&locale=pl&page=0&size=20`
- `GET /api/v1/locations/cities?countryId={UUID}&q=lodz&locale=pl&page=0&size=20`
- `GET /api/v1/locations/cities?q=vienna&locale=en&page=0&size=10` (global city search)
- `GET /api/v1/locations/metadata`

Country/city responses: `items`, `total`, `page`, `size`, `attribution`.
Items expose stable UUID `id`, `geoname_id`, source `name`, `label_en`, `label_pl`
and effective `label`. Countries also expose `iso_code`; cities `country_id`,
`region`, `district`, `latitude`, `longitude`, IANA `timezone` and source `version`,
plus `country_name`, `country_label_en` and `country_label_pl` for location suggestions.
Keep disambiguating region/district/ID in picker labels for duplicate city names.
The city endpoint accepts an optional active country; omitting it searches all
active cities with active countries. Both support case/diacritic-folded
literal substring search over original names, ASCII/transliterated aliases and
EN/PL alternate names; historic aliases aid search without becoming current
labels. `%`, `_` and `!` are literal search characters, not SQL wildcards.
Trigram indexes support substring lookup; a supplied country constraint applies
before pagination. Locale is `en`/`pl`, default `en`; query max 200 characters,
page 0–100000, size 1–100. City sorting is localized city label, country label,
then region/district/ID.

Only active records are offered. Client submits chosen IDs, never typed city text;
the catalog's single Location field offers country and global city suggestions,
displaying selected cities as city/country. The backend independently checks the
country/city pair. No device position or provider network call is needed to browse.
Metadata reports `available`, active snapshot counts/timestamp, source and license
links. Before the first operator import `available=false` and lists are empty;
no demo cities stand in for a global dataset.

Required user-facing credit is supplied in metadata and list responses:
“Location data: GeoNames, CC BY 4.0; filtered and normalized by Soberity”.
The picker in P2-I02/P2-I04 must expose attribution/source/license links.
Importer and refresh commands: [LOCATIONS_IMPORT.md](LOCATIONS_IMPORT.md).

## Public event catalog

- `GET /api/v1/events`: `q` (literal case-insensitive title substring, max 200),
  `countryId`, `cityId`, `track`, `category`, `from`, `to`, `locale`, `page`, `size`.

`category` accepts one or more enum codes, comma-separated or repeated, for
example `category=SOBER_RAVE,SOBER_PARTY`. Categories combine with OR, and the
selected set combines with the other filters before counting and pagination.
Omitting `category` includes all categories; unknown codes return 400.
- `GET /api/v1/events/categories`: supported category/track labels EN/PL.
- `GET /api/v1/events/{id}`: qualified public entry, otherwise 404.
- `GET /api/v1/events/media/{id}`: normalized JPEG only while referenced by a
  currently eligible public entry; otherwise 404.
- `POST /api/v1/events/nearby`: coordinates **only in JSON body**, never URLs.

Events are PUBLISHED curated entries, current revision, strict ALCOHOL_FREE,
confirmed controls/rights/beverages, active country/city and matching location
version. Organizer verification/review is not required. Source evidence, author
references, admin identity, moderation/internal fields and Joined never appear
in public event DTOs. Friendly supply cannot fill a strict result.

Search defaults to `starts_at >= now`. `from` is inclusive and `to` exclusive,
ISO-8601 instants; `to` must be later than `from`. A past search must supply its
own `from`, and only retained nondeleted listings can appear. Client calendar-day
filters should convert local midnight boundaries (including next-day exclusive
end) with DST awareness in P2-I02. All filters combine before count/pagination;
cityId requires its countryId. Sort is start instant ascending then event ID.
Page/size bounds match locations. Empty results are ordinary 200 responses.

The projection retains common display fields (`id`, `title`, `description`,
`locale`, `track`, `category_code`, `starts_at`, optional `ends_at`, `timezone`,
`alcohol_policy`, `alcohol_rules`, `beverage_notes`, `cover_id`, `cover_alt_text`,
`organizer_url`, `venue_name`, `address`, country/city IDs/names and point provenance).
Optional price/accessibility/availability remain UNKNOWN, never fabricated.
There is no required `organizer_id` or public organizer account. Description is
plain text in this stage's write API; existing rich-editor integration belongs
to P2-I04. `coordinate_source=CITY|VENUE` lets UI describe approximate city-centroid
distance honestly. Event points are public venue/city coordinates, not user data.

Unsupported GET filters are rejected with 400, including old text `city/country`,
`latitude/longitude/radiusKm`, price/region/availability/sort or `joined` filters.
Joined is explicitly deferred to P2-I05, rather than silently ignored.

Nearby example:

```json
{"latitude":48.2082,"longitude":16.3738,"locale":"en","page":0,"size":20}
```

Latitude/longitude must be paired, finite and within geographic bounds. Optional
locale/page/size use normal bounds. Unknown JSON fields (including client radius)
and query parameters are rejected. The effective radius is deployment-controlled
`SOBERITY_EVENTS_NEARBY_RADIUS_KM`, default **100 km**, finite **1–500 km**;
invalid configuration fails startup. Response includes `radiusKm`; each item has
approximate `distance_km`. Haversine uses radius 6371.0088 km. The boundary is
inclusive with a 1e-7 km floating-point tolerance; display rounding never drives
filtering. Sort **distance, start instant, ID**, before pagination. Only upcoming
events qualify. Empty radius stays empty; no automatic expansion or remote/friendly
fallback. Home consent/loading/error/empty/rendering belongs to P2-I02.

Nearby performs read-only queries and never stores a user point. Event search,
detail, media and nearby responses are `Cache-Control: no-store`. No coordinate
URL, provider request or user-location result cache is created. Body DTO string
logging redacts positions; framework body, binding-error, DispatcherServlet and
SQL bind logging are kept at safe levels. Malformed JSON returns a generic error
without echoing values. Keep edge access/body logging and external APM capture
disabled for this route, as in the existing staging Caddy configuration.

## Administrator API

Every route below requires a verified Firebase identity, a live account and an
active server-managed `events_admin` grant. No automatic grant, custom client role
or organizer/moderator membership can substitute for it. Operator grants use
controlled SQL; revoke on account erasure is part of V20. No self-service grant API.

Prefix `/api/v1/admin/events`:

- `POST /media`: multipart `file`, `altText`; 201 `{id}`. JPEG/PNG <=5 MB,
  <=20 megapixels; re-encoded 1600×900 JPEG, original metadata stripped.
- `GET /media/{id}`: administrator-only preview, no-store.
- `POST /`: create complete DRAFT; 201 private detail with `id`, `version=1`.
- `PUT /{id}`: complete replacement revision plus `expectedVersion`; returns
  private detail, increments version and withdraws to DRAFT. Revalidate before
  republishing. No PATCH allowing arbitrary state changes.
- `POST /{id}/publish`: `{expectedVersion}`; 204, increments version. Database
  guard checks current location/version, required fields, attestations, strict
  controls and future start; does not require a second reviewer.
- `DELETE /{id}?expectedVersion=N`: 204, terminal DELETED and minimized audit.
- `GET /{id}`: current private content and audit, including source evidence.
- `GET /?page=0&size=20`: current nondeleted entries, newest update first.
- `GET /legacy?page=0&size=20`: preserved organizer entries and their unresolved
  text locations. No automatic matching/republication. Admin must explicitly
  choose source records and recheck evidence when creating a curated replacement.

Required write fields:

```json
{
  "countryId":"<chosen country UUID>","cityId":"<chosen city UUID>",
  "title":"Event name","description":"Original or licensed description",
  "locale":"en","track":"SOBER_NIGHTLIFE","category":"SOBER_RAVE",
  "organizerUrl":"https://organizer.example/event","coverId":"<uploaded image UUID>",
  "startsAt":"2029-11-06T20:00:00+01:00","timezone":"Europe/Vienna",
  "alcoholRules":"No sale, service or BYOB throughout this event",
  "controls":{"alcoholSold":false,"alcoholServed":false,"alcoholPermitted":false},
  "beverageNotes":"Administrator confirmed 0.0% offerings",
  "beverageRulesConfirmed":true,
  "sourceUrl":"https://organizer.example/event",
  "sourceReference":"Private confirmation and text/image rights reference",
  "contentRightsAttested":true
}
```

Optional: `venueName`, `address`, paired `latitude/longitude`, `endsAt`; edits also
require `expectedVersion`. There is no separate venue/organizer-creation step.
No exact venue coordinates means the selected city's point, marked CITY. A partial
or invalid exact point is rejected, not silently replaced. New entries must be
future, classified sober and have complete rights/source/beverage confirmation;
unverified organizer accounts, price/currency/accessibility forms and a fabricated
end time are not required.

Input dates retain original offsets during JSON parsing. Nonzero offsets must
agree with the named IANA zone, including repeated hours; invalid/missing spring
hours fail. `Z` explicitly supplies a UTC instant. Persist UTC `timestamptz` plus
the IANA zone; optional end must be later than start. Source checked time is
assigned by the server when the authorized admin confirms the current evidence.

A country/city refresh invalidates public visibility when a record is removed,
moved or materially revised. A new admin revision with current selection is
required; do not silently reuse an old city point/version. Publication and edits
serialize against snapshot promotion; event row/version locks reject concurrent
stale writes. Deletion hides all public snapshots and image access immediately;
old event links return 404. An already authorized in-flight read may complete;
subsequent requests cannot serve an active stale snapshot. Minimal tombstone/audit
and private evidence follow policy retention; cleanup jobs are not delivered here.
Joined relations do not exist yet: P2-I05 must connect relation erasure to this
same deletion transaction and verify it there. No Join API/counter is fabricated.

Failures: anonymous 401, unverified/non-admin/deleted account 403, unavailable
public/private IDs 404, stale version or database state conflict 409, invalid
fields/range/image/URL/location 400. Errors use Problem Details without internal
SQL, input secrets or raw location values. Validation never fetches submitted URLs.

## Compatibility and scope

Previous `/api/v1/organizer/**` and `/api/v1/moderation/**` routes are denied,
including for admins; dormant controllers are hidden from OpenAPI. Public
organizer profiles/calendar/checkout routes are outside stage one and not offered.
Their implementation/history remains in source. V17/V18 organizer rows are not
deleted, implicitly verified or converted to curated identity mode.

The consumer's old text filters, organizer-dependent editor/detail flow and native
location adapter need P2-I02–P2-I04 updates to this contract. No frontend/platform
runtime is claimed verified by this backend iteration. Joined persistence/filters
remain P2-I05. No deployment, production migration, real event publication or
full global dataset activation is performed by tests.

### Approximate current location (P2-I02 correction, not runtime verified)

The nearby response adds optional `location` (null if no match): `city_id`,
`label_en`, `label_pl`, `country_label_en`, `country_label_pl`. It describes the
nearest active settlement within 20 km using the local location catalog, not an
address or a confirmed city boundary. The six-city development catalog cannot
label all locations. No external geocoder is called. Coordinates remain in the
existing request body; the extra response contains only public place labels.
V22 adds an active-city coordinate index. The client displays a temporary owner-requested `Vienna, Austria` mock label
when a place label is unavailable (never coordinates), keeps the current position only in session
memory, and clears it when consent is revoked or the location screen scope ends.

### Account location preference — V23

`GET`, `POST` and `PATCH /api/v1/me` return `eventLocationConsent`.
PATCH accepts an optional boolean; omitted/null leaves the preference unchanged.
Existing and new accounts default to false. Ownership comes exclusively from the
verified Firebase token. Only the preference is persisted in `user_profile`;
coordinates and location history remain unsaved. Account deletion removes the
preference with its profile. OS permission remains a separate requirement for
real device location; temporary Vienna mock mode is unchanged.
