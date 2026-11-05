# P2-I02 verification — 2026-11-05

The tests use explicit synthetic API/event fixtures and an isolated Auth emulator
account. No demo events or mock dictionary data are imported by the application.
P2-I01 separately verifies real PostgreSQL filters, dictionary imports, ACL and
nearest-first distance ordering; no application DB migration/import was run here.

## Automated client checks

| Check | Result | Evidence |
| --- | --- | --- |
| New event unit suites | 16/16 PASS | `EventLocationContext.test.tsx`, `eventFilters.test.ts`, `location.test.ts`; `/tmp/soberity-p2-i02-unit-events.log` |
| Theme contrast | 2/2 PASS | Existing `src/preferences/themes.test.ts`; `/tmp/soberity-p2-i02-contrast.log` |
| Browser acceptance | 24/24 PASS | `tests/events/discovery.spec.ts`, `playwright.events.config.ts`; `/tmp/soberity-p2-i02-web-final.log` |
| TypeScript | PASS | `/tmp/soberity-p2-i02-types.log` |
| Changed event/UI/fixture source lint | PASS | `/tmp/soberity-p2-i02-lint-events.log` |
| Web and iOS/Android JS exports | PASS | `/tmp/soberity-p2-i02-export-{web,native}.log` |
| Native iOS Debug build with ExpoLocation | BUILD SUCCEEDED | `/tmp/soberity-p2-i02-ios-build.log`; Xcode workspace `SoberityDev`, iOS Simulator |
| Full client unit regression | 95 PASS / 14 FAIL | `/tmp/soberity-p2-i02-unit-final.log`; all 14 failures reproduced at clean HEAD (79 PASS / 14 FAIL), `/tmp/soberity-p2-i02-baseline-unit.log` |
| Repository lint | 4 existing errors | `/tmp/soberity-p2-i02-lint.log`; clean HEAD has 5, `/tmp/soberity-p2-i02-baseline-lint.log` |

Unit coverage includes no automatic permission request, grant/refusal, a late
permission result after turning the feature off, late fix/response cancellation,
account change, foreground permission recheck, distinct empty/location/API failure,
unsupported browser, native disabled services and browser timeout. Filters verify
only supported query keys and inclusive dates, including 23/25-hour DST days under
Europe/Vienna in isolated Node processes.

Browser checks run in Chromium desktop and emulated iPhone viewport, each with
EN/PL and light/dark. They exercise full-text country/city queries and IDs,
country-change reset, name/type/date combinations, page 2, clear, keyboard
Enter/Escape, semantic control labels, responsive width, grant/no-consent/refusal,
revocation, session reset on reload, two distance-ordered tickets and detail link,
empty-radius catalog navigation, network retry, unsupported/timeout, and absence
of coordinates in storage or request URLs. Screenshot artifacts under
`apps/consumer/test-results` were visually reviewed; these are mobile-web tests,
not a substitute for native runtime.

Existing regression failures are unrelated to this iteration: i18n strict key
comparison incorrectly treats Polish plural variants as missing English keys;
AuthStatusContext retry timing; QuizCard color expectations; LearningScreen's
missing mocked `useLocalSearchParams`; QuizScreen interaction expectations. Existing
lint errors: two CommonJS imports in `metro.config.cjs`, unused `t` in
WeeklyScienceScreen and unused `_props` in native EventMetadata. The touched
`safeEventLink` control-character validation was preserved without its previous
lint error. A pre-existing IconHint keyboard-event TypeScript mismatch was fixed
with the browser/native event shape; the rest of its behavior is unchanged.

## Native runtime

Local iPhone 17 Pro simulator (iOS 26.5), newly rebuilt SoberityDev client with
ExpoLocation 58.0.20, and Medium_Phone emulator (Android API 37 arm64), Expo Go SDK58.
Maestro CLI 2.12.1 was downloaded temporarily and SHA-256 verified against the
upstream release checksum. Both clients use Metro on loopback18181, synthetic API
on18180 and local Auth emulator9099. Android uses adb reverse for these ports.
The existing Auth emulator and unrelated accounts were not cleared.

iOS final clean-cache discovery flow PASS: no section before opt-in, explicit
permission, two nearby tickets in API distance order, detail navigation,
country/city selection and catalog, immediate consent revocation and hidden Home.
A separate denial flow PASS, including the localized Polish OS permission text.
Empty-radius flow PASS: exact empty message, no fallback ticket, working link to
the catalog. Logs: `/tmp/soberity-p2-i02-ios-{discovery-final,deny,empty-final}.log`.
Final native ticket and catalog screenshots were visually reviewed. An attempted
forced-unavailable test using `simctl location clear` returned a valid cached fix;
that attempt did not establish a native iOS timeout. Failure branches are covered
by the unit/web checks above; this attempt is not counted as a successful test.

Android: app launch/sign-in, explicit OS/Expo Go permission, refusal and hidden
Home, and the distinct unavailable-location state were observed. The emulator did
not deliver a fresh balanced-accuracy fused fix within the deadline, including
attempts with emulator test providers. Full successful nearby flow, ordering and
complete native catalog/revocation acceptance remain **NOT VERIFIED**. On
2026-11-05 the owner explicitly instructed: “nie testuj android jesli wszystko
inne przeszlo zamknij etap”. Further Android testing was stopped; P2-I02 is closed
with this explicit acceptance exception, without claiming those tests passed.
The synthetic test providers were removed and mock-location permission restored;
only the synthetic Auth emulator account created for this run was deleted.

Earlier development attempts exposed an Expo Router Slot style issue and web
Escape dismissal issue; both were fixed. Final web 24/24 and clean-cache iOS
runtime passed after those fixes. Full regression/lint failures listed above
are reproduced baseline issues, not newly failing event checks.

## Operational limits

No physical-device, signed Android application build, store build, deployment,
VoiceOver/TalkBack session, full global dictionary download or real organizer
content acceptance is claimed. An Android Expo Go test confirms native module/UI
behavior, not a standalone application's manifest. Rebuild development/release
clients to include the new Expo Location dependency and localized foreground-only
iOS usage text. App configuration explicitly disables background location,
foreground services, Always and motion permission additions.

Live dictionary/event availability depends on applying P2-I01's documented setup
and an administrator publishing content. Empty or unavailable data is handled
without a fictional fallback. Joined, full detail first-stage adaptation and admin
UI acceptance remain P2-I05, P2-I03 and P2-I04 respectively.
