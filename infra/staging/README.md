# Staging — deployment preparation

This is a **configuration, not a running deployment**. No host, domain, staging
Firebase project or EAS project existed when P0-I13 was implemented. The owner
must supply them and authorize deployment. Nothing here publishes to stores or
changes production. P0-I13 and the Phase 0 gate require remote verification.

## Topology and prerequisites

One Linux VPS runs Docker Compose: Caddy → Spring Boot → PostgreSQL 17.
Only Caddy publishes ports 80/443. The same HTTPS origin serves the static Expo
web export and `/api/*`; this also handles Firebase action routes. The backend
can reach Google to validate real staging Firebase tokens. No emulator is
included. PostgreSQL and backend ports are private to the Compose network.

Before deployment:

1. Supply a staging-only DNS hostname and point its A/AAAA records to the VPS.
   Open inbound TCP 80/443 for ACME/HTTPS, restrict SSH, and check the provider's
   firewall. Use a separate Firebase project, not the production project.
2. Install Docker with Compose v2 and Node 24.14+ (24 LTS) for the monitoring
   script. Check out reviewed code under `/opt/soberity`. Configure required
   CI checks (`frontend`, `backend`, `secrets`) and protect the `staging` GitHub
   Environment. Workflows do not deploy or create environments automatically.
3. Create a password file and Firebase ADC service-account file **outside the
   checkout**, with access only for operations and the containers that need
   them. Compose file-backed secrets must be readable by the backend's
   non-root UID; verify the mount's permissions without printing its contents.
   Keep the parent directory private. Do not put file contents in `.env`.
4. Copy `.env.example` to a git-ignored `.env` and fill in every value. For
   systemd use `/etc/soberity/staging.env`; compose commands then need
   `--env-file /etc/soberity/staging.env`. The checked-in template has no
   working defaults, hostnames, credentials or image references.

## Prepare reviewed artifacts locally

Use a clean checkout at the reviewed commit. Install with
`pnpm install --frozen-lockfile`, run `pnpm check`, `pnpm test:infra`, Jest,
Playwright and `backend/./mvnw --batch-mode verify`. Do not claim CI green
until the workflow has actually run on GitHub for that commit.

Build the backend with an immutable commit tag:

```sh
docker build -t soberity-backend:COMMIT_SHA backend
```

Transfer the image via the owner's chosen registry or `docker save/load`.
Set `BACKEND_IMAGE` to that reviewed tag or digest. Compose never builds from
unreviewed server files. Base images currently use explicit version tags;
resolve and retain digests in the release record for reproducible deployment.

Build the web export with only the **staging** public configuration:

```sh
EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=https://STAGING_HOST \
  pnpm --filter @soberity/consumer build
```

Before exporting, run `node scripts/check-client-env.mjs --required` with the same build environment. It fails on missing configuration, HTTP/loopback API, a demo Firebase project or an Auth emulator. It validates configuration shape, not the existence of a remote project.

Also provide the four `EXPO_PUBLIC_FIREBASE_*` values from the **staging**
Firebase web app in the build environment. Leave
`EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` unset. Set continue URLs to an
authorized staging URL. These variables are compiled into JS; changing a
container environment later does not change the exported app. Do not deploy a
guest-only export with missing Firebase configuration. Copy `apps/consumer/dist`
to a versioned directory on the VPS and set `WEB_DIST_PATH` to it. Keep the
previous export/image pair for rollback. Check the artifact contains no `.env`,
service-account files, logs or local agent state.

Firebase Console: authorize the staging domain and configure the actual
verification action URL `/verify-email` and reset action URL `/reset-password`
in their respective templates. Public HTTPS action links are not a substitute
for configured iOS Universal Links / Android App Links: validate native email
handoff on the chosen preview builds. Expo Go is not a signed preview build.

## Validate, deploy after approval, and verify

```sh
docker compose --env-file infra/staging/.env -f infra/staging/compose.yml config --quiet
docker compose --env-file infra/staging/.env -f infra/staging/compose.yml up -d
docker compose --env-file infra/staging/.env -f infra/staging/compose.yml ps
pnpm check:staging https://STAGING_HOST
```

Do not print `docker compose config` with real env: it may resolve operational
values. `config --quiet` validates without printing them. The smoke command is
read-only: four HTML routes, HTTPS headers, liveness/readiness, absent/invalid
token 401, allowed/denied CORS and private-path 404. It never consumes action
codes or creates/deletes accounts. Use only the staging hostname.

Then manually test signup → real email → verification/refresh → session
restore → profile edit → password reset/change → logout and account deletion
using an expendable **staging test account**. Test web and EAS previews on both
native platforms, keyboard, screen readers, EN/PL and both themes. Record the
CI run, image digest, export commit, EAS build IDs, URL, OS/devices and results
in `docs/testing/P0-I13-results.md` and PHASES.md. Do not close P0-I03A from a
bundle export alone; its own native and accessibility checks remain required.

## Monitoring

Spring already emits ECS JSON logs and safe correlation IDs. Caddy has no
access log because reset/verification URLs carry codes; do not add raw URLs,
Authorization headers, passwords or request bodies to logging. Docker log
rotation is capped at 3 × 10 MiB per service. Actuator exposes only health
probes through the edge; Swagger and all other Actuator routes return 404.

Install the example `.service` and `.timer` files under `/etc/systemd/system`
after reviewing `/opt/soberity` and `/usr/bin/node` paths. Set
`STAGING_ORIGIN=https://YOUR_STAGING_HOST` in
`/etc/soberity/staging-monitor.env`. Enable with:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now soberity-monitor.timer soberity-backup.timer
systemctl list-timers 'soberity-*'
journalctl -u soberity-monitor.service -u soberity-backup.service
```

Monitor failures through an owner-managed uptime/alerting service, plus host
disk free space, certificate expiry, container restart count and backup age.
No external alert recipient was configured or contacted by this iteration.
The manual `Staging smoke` GitHub workflow can also check an approved HTTPS
origin; it does not deploy. systemd installation/timer execution is NOT VERIFIED
until performed on the actual Linux host.

## Backups, restore drill and rollback

Target **RPO ≤24 hours**, **RTO ≤4 hours**, to be measured on staging before
acceptance. `soberity-backup.timer` runs daily at 03:00 UTC. The backup script
uses `pg_dump --format=custom`, writes an owner-only temporary file and renames
it only on success. It never deletes old backups. Backups include private
profiles: encrypt before offsite transfer; the timer's local dump is not an
encrypted offsite backup. Owner must configure an encrypted offsite destination,
monitor last successful upload and retain 7 daily / 4 weekly copies. Do not
prune the last known-good copy before a successful restore drill.

```sh
STAGING_ENV_FILE=/etc/soberity/staging.env \
  sh infra/staging/backup-db.sh /var/backups/soberity-staging
STAGING_ENV_FILE=/etc/soberity/staging.env \
  sh infra/staging/restore-check.sh /TRUSTED/BACKUP.dump restore_check_YYYYMMDD
```

The restore check creates a **new** `restore_check_` database and fails if it
already exists. It never drops/cleans databases or restores over `soberity`.
Inspect Flyway migration counts and application row counts, then connect a
separate isolated backend to the restored DB for a functional smoke. Record
duration, dump checksum, tested migrations and result. Remove a drill database
only after explicit approval. Restore only trusted dumps.

Before deployment take a backup. Rollback uses the previous reviewed backend
image and web export. Flyway migrations must be backward-compatible; do not
assume rolling back a JAR reverses schema changes. Restoring over the live
staging DB or deleting volumes requires a separate reviewed procedure and
explicit authorization. Never run `down -v` as an ordinary restart.

Sources: [Expo EAS profiles](https://docs.expo.dev/build/eas-json/),
[Expo monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/),
[Caddy routing](https://caddyserver.com/docs/caddyfile/directives/try_files),
[PostgreSQL restore](https://www.postgresql.org/docs/17/app-pgrestore.html).
