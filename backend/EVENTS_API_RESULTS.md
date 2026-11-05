# P2-I01 — verification results

Completed 2026-11-05. Scope: backend only, required first-stage tasks
P2-I01-T01–T07 / V01–V03. [Contract](EVENTS_API.md),
[import setup](LOCATIONS_IMPORT.md), [policy](EVENTS_POLICY.md).

## Environment and commands actually run

- macOS arm64, Amazon Corretto 21.0.4, Maven wrapper 3.9.16.
- Docker socket unavailable in the sandbox. Used a dedicated native PostgreSQL
  **17.11** cluster at `/tmp/soberity-p2-i01-pg`, loopback `127.0.0.1:55439`,
  database `soberity_test_p2_i01`. This is an isolated test database, not the app DB.
  The temporary test server was stopped after verification; its /tmp data remain.
- Initial sandbox-only integration attempt could not attach Mockito's JVM agent;
  PostgreSQL shared memory/socket access was also restricted. Authorized test
  execution outside those sandbox restrictions used the same isolated cluster.
- Full verification:

  ```sh
  SOBERITY_TEST_JDBC_URL=jdbc:postgresql://127.0.0.1:55439/soberity_test_p2_i01 \
    ./backend/mvnw --batch-mode -f backend/pom.xml verify
  ```

  **PASS — 34 unit/architecture + 104 integration tests, zero failures/errors/skips.**
  Exit 0, BUILD SUCCESS, 2026-11-05 10:49:47 Europe/Vienna.
  Local log: `/tmp/soberity-p2-i01-full-tests.log`.
  Machine-readable results: `backend/target/{surefire-reports,failsafe-reports}/`.
  Includes all existing identity/profile/Science tests, not only Events.
- After documentation visibility/CLI-help additions:
  `./backend/mvnw --batch-mode -f backend/pom.xml -DskipTests package` — PASS;
  packaged PropertiesLauncher `GeoNamesImportCli --help` — exit 0, no database
  or HTTP startup. This packaging check is not another test-suite run.
- `python3 scripts/download-geonames.py --help`, Python syntax compilation and
  `git diff --check` — PASS. Full network download is not claimed tested.

## New checks and evidence

| Requirement | Executed evidence | Result |
|---|---|---|
| T01/T02/V01: admin model and authorization | `CuratedEventsApiIT`: verified admin creates/publishes without an organizer account; anonymous/unverified/non-admin/moderator/revoked/deleted actors denied; old organizer/moderation routes denied even to an admin | PASS |
| T03/V01: UTC/IANA and DST | Input retains original offset before validation; spring-forward missing hour rejected; both explicit autumn offsets accepted and UTC storage checked; optional end; invalid timezone/range rejected | PASS |
| T04/V01: required fields, media and links | Required source/rights/beverages/cover/location/type; paired finite coordinates; wrong country/city, unknown cover, unsafe URL, missing controls and mismatched taxonomy rejected; PNG/JPEG normalized and private until publication; invalid SVG rejected | PASS |
| T05/V02: source-shaped worldwide dictionary | `GeoNamesImportIT`: synthetic AT/PL/BR/KE/JP/AU/US records, Polish ł/diacritics, English/Polish/current/historic aliases, original-name fallback, duplicate Springfields with regions, URL alias excluded, attribution, country-scoped lookup | PASS |
| T05/V02: import lifecycle | Stable IDs/versions on identical refresh, material change version increment, retired ID deactivation/reactivation, bad manifest, malformed ZIP and minimum-coverage failure rollback; prior active snapshot retained | PASS |
| V01/V02: migration upgrade | `EventsMigrationIT`: V1–V18 in fresh isolated schema, actual ambiguous text `Springfield` organizer entry, then V19/V20; original description/identity/text preserved, cityId remains unresolved, legacy resolution view available | PASS |
| T06/V01: combined search | Title/type/country/city/date filters before total/pagination, literal `%_` and SQL-like strings, drafts excluded, stable page sizes, invalid ranges and old text/coordinate filters rejected | PASS |
| T06/V03: nearby | Inclusive 100 km vs 100.001 km, distance before date ordering/pagination, empty remote location, no radius override/URL coordinates; events already started excluded while explicit retained past search works | PASS |
| T07/V01: safe deletion/concurrency | Public detail/media/search disappear after deletion; stale version rejected, exactly one winner/audit in concurrent deletes; edited publication withdrawn until republished | PASS |
| T05/T06/V03: current location confirmation | Material city-point refresh hides an existing public event until admin reselects latest record, creates new revision and republishes | PASS |
| V03: location privacy | `EventLocationPrivacyIT`: valid nearby request, malformed body and attempted query URL; captured application output contains neither synthetic coordinates nor malicious raw input, errors do not echo values, responses no-store | PASS |
| Configuration/normalization/privacy helpers | `EventConfigurationTest`: radius bounds/NaN/infinity, Unicode folding/literal wildcards, redacted request DTO logging | 3/3 PASS |

New coverage totals: **3 unit tests + 16 integration tests** (10 curated API,
4 importer, 1 migration upgrade, 1 logging privacy). Existing 18 P2-I00 policy
checks and architecture rules remain green.

## Corrections made from test findings

JSON date normalization initially erased an input offset before DST validation;
explicit format annotations now preserve it. The logging test found Spring's
parameter-binding DEBUG path echoed an invalid numeric string; safe logger
levels, redacted DTO string output and generic malformed-body errors now cover
that path. Both regressions are included in the passing suite. A test fixture
for erased accounts was corrected to supply the existing required timestamp.

## Honest limits and next step

- No live application/staging/production migration, server restart, administrator
  grant, real event publication or full global source-data load occurred. Only
  synthetic records entered the isolated test DB. Real use requires the explicit
  operator import described in LOCATIONS_IMPORT.md; the empty dictionary is
  reported honestly before that import.
- No full-size import performance/coverage benchmark or third-party data accuracy
  certification is claimed. Monthly execution and external proxy/APM settings
  are operational setup, not automatically deployed jobs.
- No consumer changes or web/iOS/Android runtime tests. Current old text filters,
  organizer-based editor and detail lookup need P2-I02–P2-I04 adaptation.
- Joined is P2-I05; no relation persistence/filter or attendance deletion result
  is claimed here. Its future implementation must attach erasure to the same
  event/account deletion boundary. Retention cleanup remains later operational
  work, not a job fabricated by the migration.
- P0-I13's remote/staging gate stays open under ADR-010's local-work exception.
  There is no blocker for P2-I01's backend DoD. Next iteration: **P2-I02**, only
  after a new owner instruction.
