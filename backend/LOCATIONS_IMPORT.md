# GeoNames operator import and refresh

## Owner-approved local subset — 2026-11-05

For the local application database only, the owner explicitly replaced the slow
first global import with two countries (PL/AT) and six selected cities: Wrocław,
Warszawa, Koszalin, Szczecin, Vienna/Wiedeń and Graz. These are actual source
records extracted from the previously downloaded `allCountries.zip` and
`countryInfo.txt`, not fabricated city fixtures. UUIDs follow the existing
GeoNames identity scheme; EN/PL labels, source aliases, coordinates, regions,
timezones and source modification dates are retained/normalized.

The active snapshot records `scope=owner-selected-local-subset`,
`globalCoverage=false`, country_count=2 and city_count=6, with the existing
download provenance and CC BY 4.0. This is an explicit local exception to the
global coverage policy below, not a change to the CLI's global minimums or a
claim of complete country/city coverage. The previous global import was no
longer active and the dictionary was empty when this subset was inserted.

A later full import can reuse the deterministic IDs. Before retrying it,
address the slow alias normalization stage: staging tables are created without
an index on `id`, yet the current implementation updates search text per row
using `WHERE id=?`. Indexing this lookup and batching writes remain outstanding;
no importer code was changed in this session.

The same local session added one explicitly fictional, published preview event:
`Vienna Sober Rave`, ID `0c931e23-9c40-4826-94ca-90231af10b1d`,
2026-11-06 19:00 Europe/Vienna. Its English description and entry
rules clearly mark it as test data; the venue display label was changed to
`Vienna City Centre` on owner request using a new immutable revision; the existing Vienna preview photograph is
illustrative and no real venue, tickets or organizer are asserted. This entry
must not be treated as verified real-world event supply.

Both writes committed successfully. No tests, UI/API checks, migrations or
application restarts were performed.

The P2-I00 policy selects the [GeoNames global dump](https://download.geonames.org/export/dump/readme.txt)
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). P2-I01 implements
the importer and lookup APIs. Catalog lookups never call an external provider.
The only external request is the optional Geoapify reverse geocoding of the
consented, current position described below. Full worldwide data are intentionally not embedded in Git or
loaded by Flyway/application startup.

## Current location address (Geoapify reverse geocoding)

With consent on Sober Events, the app resolves the nearest street address with
the public Geoapify key (`EXPO_PUBLIC_GEOAPIFY_API_KEY`, origin-restricted). Only
the position rounded to three decimals (about 100 m) leaves the device. The exact
coordinates are not saved, and no location history is kept. Without the key the
display falls back to the nearest catalog city from the backend, then to
"Location unavailable". The nearby event search itself uses the device position
and never calls Geoapify. Consent text (EN/PL) states this disclosure.

## Run on the intended database

1. Apply V19/V20 through the normal migration process on the intended target.
   PostgreSQL needs `pg_trgm` available, with migration permissions to install the
   trusted extension in `public`. Existing V17/V18 data remain preserved.
2. Download the fixed official source files to a directory outside Git. The full
   global files are large; allow disk space for archives, staging tables, indexes
   and the import transaction.

   ```sh
   python3 scripts/download-geonames.py /private/tmp/soberity-geonames
   ```

   Files: `allCountries.zip`, `alternateNamesV2.zip`, `countryInfo.txt`,
   `admin1CodesASCII.txt`, `admin2Codes.txt`, `timeZones.txt`, plus generated
   `download-manifest.json` (source URLs, UTC retrieval times, SHA-256) and
   `ATTRIBUTION.txt`. Each download writes a temporary file before replacement.
   A partial/mixed snapshot cannot be imported against an old manifest.
3. Build `backend/target/soberity-backend.jar`. Provide `SOBERITY_DB_URL` (JDBC
   PostgreSQL URL), `SOBERITY_DB_USER` and `SOBERITY_DB_PASSWORD` through the
   operator's secure environment. Do not put passwords in command arguments,
   connection URLs, shell history or Git.
4. Launch the offline main class; it creates no HTTP server, scheduler or Firebase
   client and applies no application migrations:

   ```sh
   java -Dloader.main=com.soberity.events.locations.GeoNamesImportCli \
     -cp backend/target/soberity-backend.jar \
     org.springframework.boot.loader.launch.PropertiesLauncher \
     /private/tmp/soberity-geonames
   ```

   `--help` instead of the directory verifies launcher/usage without touching a DB.
   Run the same command monthly against a newly downloaded complete snapshot.
   Scheduling/production operation is an operator responsibility, not an enabled
   job in this iteration.
5. Inspect the promoted snapshot in `GET /api/v1/locations/metadata` and the database
   `location_snapshot.manifest` / `location_quarantine` counts. Review location
   changes affecting public entries; update/reconfirm those events explicitly.

## Import behavior

- Streaming UTF-8/ZIP parsing and batches of 1000 city/alias rows, using transaction-
  local staging tables. No archive extraction or arbitrary URL fetch is accepted.
  Only current inhabited city/town/village codes from P2-I00 qualify. Invalid
  coordinates, primary country, timezone and malformed records are quarantined
  as reason/count, without dumping source records into logs.
- Country/city UUIDs are derived deterministically from namespaced GeoNames IDs;
  unique source IDs are retained on refresh. Source names are labels, never
  identity keys. ISO-2 metadata comes from countryInfo rather than a handpicked
  list of supported event cities.
- Search includes original/ASCII/transliterated aliases and EN/PL names. Current
  preferred localized labels fall back to original names. Historical aliases
  remain searchable but cannot become current labels; URL aliases are excluded.
  Administrative region/district labels distinguish duplicate city names.
- Coordinates are WGS84 and timezones must exist in the current JVM and source
  timezone table. Missing-country/unknown-zone/invalid-point records do not become
  selectable fallback strings. Source modification dates and all input hashes,
  file/retrieval times, attribution/license/modification description and importer
  version are kept with the snapshot.
- The CLI requires **>=200 countries and >=1,000,000 cities**. An unexpected
  >20% global country/city count drop aborts promotion. Inspect source changes;
  do not replace the global source with a `cities15000`/single-country subset.
  Small validation thresholds exist solely for explicit integration fixtures,
  not a CLI option or remotely callable endpoint.
- One transaction and exclusive advisory lock promote the snapshot atomically;
  event authoring/publication uses its shared counterpart. Public repeatable-read
  queries see one consistent snapshot. Any parse/hash/coverage/DB failure rolls
  back to the prior active state. Transaction temp tables disappear on rollback.
- Identical refreshes preserve entity versions. Material name/region/point/zone/
  country changes advance the city version; published event venues retain their
  confirmed version and become ineligible until reconfirmed. Removed source IDs
  become inactive identity tombstones. Reactivation preserves ID; no dangling
  references, silent ID reuse or guessed legacy string mapping.
- Retained snapshots record manifests/counts; they do not duplicate full old city
  datasets. Operational rollback means importing the retained prior source files,
  which preserves IDs and conservatively requires reconfirmation after material
  changes. Save archives/manifests under the operator's data retention policy.

## Administrator grant

Provision an Events administrator only through an operator-controlled database
session for the intended verified Firebase UID:

```sql
INSERT INTO events_admin(firebase_uid) VALUES ('<verified-firebase-uid>')
ON CONFLICT (firebase_uid) DO UPDATE SET active=true;
```

No grants are seeded or self-assigned. `UPDATE events_admin SET active=false ...`
revokes future requests; account erasure removes its grant automatically. Old
organizer/moderator grants are independent and cannot publish/delete through the
new API. Source data import itself requires database operator credentials, not
an HTTP endpoint that accepts filesystem paths.

## Validation boundary

The importer is tested on a **synthetic source-shaped global sample**, including
countries on six continents, Unicode/EN/PL aliases, duplicate names, excluded and
invalid records, repeat import, material change, retirement/reactivation and
failure rollback. No full worldwide snapshot was downloaded or loaded into the
application DB during P2-I01. That remains an explicit setup step before using
real catalog data. The source does not guarantee every settlement is present;
missing/ambiguous records require curator resolution rather than a typed-string
bypass. Acceptance results: [EVENTS_API_RESULTS.md](EVENTS_API_RESULTS.md).
