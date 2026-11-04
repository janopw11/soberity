# Backend

Backend to Spring Boot 4.1.2 na Java 21 (jar `soberity-backend`) z modułami
`common`, `identity` i `profile`, PostgreSQL 17, migracjami Flyway i OpenAPI
(springdoc 3.2.0). Zaimplementowano P0-I04: szkielet API bez logiki domenowej.

Endpointy (P0-I04):

- `GET /actuator/health/liveness` i `/actuator/health/readiness` — publiczne.
- `GET /v3/api-docs` oraz Swagger UI — publiczne poza profilem `production`.
- `/api/v1/me` — wymaga zweryfikowanego e-maila; `POST` tworzy lub zwraca profil
  (P0-I09), `GET` i `PATCH` czytają/zmieniają profil właściciela tokena. Pola:
  `displayName` (do 50 znaków), `city` (do 100), `interests`
  (`science`, `sport`, `events`, `community`), `locale` (`en`/`pl`). Nieznane
  pola w body są ignorowane, a niepoprawne wartości dają 400.
- `/api/v1/**` — wymaga uwierzytelnienia; bez tokena zwraca 401 w formacie
  `application/problem+json`. Weryfikacja Firebase ID tokenów to P0-I05.

Uruchomienie testów (wymaga Dockera dla Testcontainers):

```bash
./mvnw --batch-mode verify
```

Uruchomienie lokalnego stosu (PostgreSQL + backend) — patrz
[`infra/compose/README.md`](../infra/compose/README.md).

Profile: `local` (wymaga `SOBERITY_DB_PASSWORD`), `test` (datasource z
Testcontainers), `staging` i `production` (wszystkie wartości ze zmiennych
środowiskowych; w `production` wyłączone OpenAPI). Zmienne opisuje
[`.env.example`](./.env.example). Obraz budowany jest z
[`Dockerfile`](./Dockerfile) i nie zawiera plików `.env` ani sekretów.

`./mvnw` wymaga JDK 21 oraz curl lub wget i unzip przy pierwszym pobraniu.
Maven pobierany jest z Maven Central, z weryfikacją SHA-256 dystrybucji.
Na Windows dostępny jest `mvnw.cmd`; nie został przetestowany na Windows.

## Science public API

P1-I01 routes, response fields, publication visibility and ETag contract are documented in [SCIENCE_API.md](SCIENCE_API.md).

## Editorial workflow

See [EDITORIAL_API.md](EDITORIAL_API.md) for private endpoints, operator-managed AUTHOR/REVIEWER grants, audit history and the `/editorial` web workspace.

## Blog workspace update

The active web editor and direct/optional-review publication API are documented in [BLOG_EDITORIAL_API.md](BLOG_EDITORIAL_API.md). Start the current local JAR and migrations from the repository root with `node scripts/start-local-backend.mjs`.

P1-I04 adds reviewed quizzes and opt-in educational progress in migration V8.
See [LEARNING_API.md](LEARNING_API.md) for contracts, publication rules,
account erasure and client entry points. This implementation has not been
compiled, tested, started or migrated in this session at the owner's request.

Discover uses `GET /api/v1/science/feed?locale=en&page=0` for one timeline of
published blog posts, reviewed articles and evidence cards (20/page, newest
publication first). It reuses the existing public projections within a repeatable
read transaction, preserving withdrawal rules. Existing catalogs remain.

### Weekly Science Drop — P1-I05

Implementation and local activation instructions: [WEEKLY_SCIENCE_API.md](WEEKLY_SCIENCE_API.md).
V12 adds independently reviewed scheduled issues and immutable editorial audit.
The in-process scheduler publishes due eligible issues; public reads recheck
publication time, expiry and pinned evidence. No seeded content, notifications
or XP. P1-I05 implementation has not been compiled, migrated or tested in its
implementation session, as requested by the owner.

Article preview (V16): POST/PUT editorial posts accept optional `previewContent`
(plain text, max280 characters; blank/null clears it). Private/public post
projections return `preview_content`. Stored per immutable article revision,
so draft changes do not leak into the published preview. Weekly feature and
Discover use the same published post projection. Existing articles remain NULL
until the author writes a preview. No health claims or summaries are generated.

V16 local activation: package with tests skipped BUILD SUCCESS, Flyway applied
V16, API started on8090. Log `/private/tmp/soberity-article-preview-backend-start.log`.
No additional tests or API/UI verification performed.

### Sober Events — P2-I00 foundation

The owner parked Myth Battle and started local Events policy work. See
[EVENTS_POLICY.md](EVENTS_POLICY.md) for taxonomy, preliminary domain policy,
moderation/verification boundaries and acceptance scenarios. No Events API,
migration or real catalog is introduced yet. P2-I00 remains NOT VERIFIED;
tests/builds and extra verification were omitted at the owner’s request.

### Sober Events — P2-I01 data and APIs

[EVENTS_API.md](EVENTS_API.md) documents pending migration V17, organizer/member
ACL, independent moderation, UTC/IANA dates, public search and bounded media.
This supersedes the P2-I00 foundation-only scope above. No Events UI or inquiry
sending is included. Implementation is NOT VERIFIED: no build, tests, migration
execution, API checks or restart performed at the owner's request.

P2-I02 adds shared web/native `/events` discovery and the region/sort query
parameters. See [EVENT_DISCOVERY.md](EVENT_DISCOVERY.md) for scope, location
privacy/native manual-coordinate fallback and the unexecuted acceptance handoff.
No test/build, V17 activation or restart performed in this iteration.
