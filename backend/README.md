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
