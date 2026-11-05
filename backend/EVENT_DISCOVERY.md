# P2-I02 — Event discovery, first-stage contract

Updated 2026-11-05. This supersedes the unverified 2026-11-04 handoff. Backend prerequisites P2-I00/P2-I01 are complete; UI verification and limitations are recorded in [EVENT_DISCOVERY_RESULTS.md](EVENT_DISCOVERY_RESULTS.md).

## Catalog

`/events` uses the shared Expo screen on web/iOS/Android. Two searchable record pickers use the global GeoNames dictionary through `/api/v1/locations/countries` and `/cities`: localized labels, country-scoped cities, region/district/source ID disambiguation, pagination and attribution. Selecting another country clears the city. Typed search text never substitutes for a selected database ID. Empty or unavailable dictionaries show honest empty/error states; no bundled mock cities.

Apply combines event name, category, country/city IDs and inclusive calendar-day dates. The final day becomes the next local midnight, preserving 23/25-hour DST days. Invalid/reversed dates are rejected. Clear resets filters and pagination. Public results use the backend's fixed soonest-first ordering, 12 per page; no unsupported sort/price/region query parameters. UI language localizes dictionary labels and dates without filtering out events in other languages. Requests have deadlines, cancellation and stale-response guards. Loading, empty and network failure are separate states.

Cards retain existing Ocean tokens, sober party/rave categories, real covers or neutral fallback, event timezone and detail links. Optional end date and missing organizer/price are supported. Joined belongs to P2-I05; the broader detail/organizer experience remains P2-I03.

## Nearby Home tickets and consent

Preferences → Events near you provides an explicit opt-in and an immediate off action. Consent is held only in memory for the current trusted sign-in session. Reload, sign-out and account switch reset it. Merely visiting Home never requests permission. Without consent the complete nearby section is absent, while the catalog remains available.

Native adapters use `expo-location` foreground permission and one balanced-accuracy fix; no background permission, service, watch or tracking is requested. Web asks permission through one explicit geolocation call; the resulting point is discarded. Home then obtains a fresh point only after checking the browser permission is already granted. Browsers without the Permissions API conservatively show unavailable rather than prompting automatically on Home. System permission changes and foreground return recheck authorization. Turning the feature off or leaving Home cancels requests and ignores late callbacks; backgrounding clears results.

A point exists only as a local variable and the JSON body of `POST /api/v1/events/nearby` (page 0, size 3, no-store). It never enters URLs, profile/storage, query keys, analytics or logs. The backend controls radius and distance ordering; the UI displays its radius, defaults neither to distant events nor demo tickets. City-centroid distances are explicitly approximate. Empty supply shows “No events nearby — check out the event base” / “Brak wydarzeń w pobliżu — sprawdź bazę wydarzeń” with a catalog link. Position failure and API failure have separate messages and retries.

Tickets preserve the approved image and right stub layout, real date/time and timezone, category and city, full-card navigation, keyboard focus and the first-ticket 1500 ms animation with reduced-motion handling. Expo Router requires a flattened static style for its Slot child; press state is maintained explicitly. Existing Dialog also handles Escape from focused web content.

## Local verification

```sh
pnpm --filter @soberity/consumer typecheck
pnpm --filter @soberity/consumer test:unit --runInBand --watchman=false src/events/EventLocationContext.test.tsx src/events/eventFilters.test.ts src/events/location.test.ts src/preferences/themes.test.ts
pnpm --filter @soberity/consumer exec playwright test --config playwright.events.config.ts
pnpm --filter @soberity/consumer build
pnpm --filter @soberity/consumer export:native
```

Playwright mocks the public backend and Firebase REST boundary explicitly; its fixtures are never imported by product code. Native acceptance uses the separate loopback-only `apps/consumer/tests/fixtures/events-server.mjs`, a synthetic Firebase Auth emulator account and a native Metro instance configured for these loopback services. `POST /__fixture/mode` accepts results/empty/error; `GET` exposes only mode/request count, never coordinates. Test authentication is not production authorization. Backend ACL, dictionary search/import, distance calculations and real database ordering are covered separately by P2-I01 integration tests.

The application database and global GeoNames dump were not changed in this iteration. Before real use, follow [LOCATIONS_IMPORT.md](LOCATIONS_IMPORT.md), publish admin events, and rebuild native clients after adding `expo-location`. No deployment, production writes or full P2-I03/P2-I04/P2-I05 acceptance is implied.
