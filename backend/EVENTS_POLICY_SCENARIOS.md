# P2-I00 — stage-one policy acceptance

Date: 2026-11-05. Environment: local macOS arm64, Amazon Corretto Java 21.0.4,
Maven wrapper 3.9.16. All test event data are synthetic and never inserted into
the catalog. Policy: [EVENTS_POLICY.md](EVENTS_POLICY.md), version 2.0.

## V01 — executable qualification scenarios

JUnit: `src/test/java/com/soberity/events/EventPolicyTest.java`.
The following are domain results, not API/UI/production results.

| ID | Scenario | Expected result / test method |
|---|---|---|
| Q01 | Complete strict rave with source/rights/beverage confirmation; no organizer account | ELIGIBLE; `adminCanQualifySoberRaveWithoutInventingOrganizerVerification` |
| Q02 | Coffee meetup vs rave under lifestyle | Meetup eligible, rave mismatch ineligible; `coffeeMeetupKeepsItsLifestyleClassification` |
| Q03 | Sale, service or BYOB; other controls may be unknown | Each conflict is INELIGIBLE; `alcoholSaleServiceOrByobEachExcludeStrictEventEvenWithOtherUnknownControls` |
| Q04 | Service unknown, absent controls or blank rules | NEEDS_INFORMATION with explicit reasons; `missingControlsOrRulesNeverMeanAlcoholFree` |
| Q05 | Only friendly concert/rave supply | INELIGIBLE for stage one, no substitution; `friendlyEventsCannotFillStageOneSoberSupply` |
| Q06 | Missing alcohol classification | NEEDS_INFORMATION, no strict default; `absenceOfClassificationIsNotAValidDefault` |
| Q07 | Untraceable flyer, missing image rights or unclarified ABV | Cannot qualify; `sourceRightsAndBeverageClarificationAreIndependentPublicationGates` |
| Q08 | End <= start, ended event, missing start; valid cross-midnight event | Reject invalid/ended, request missing date; accept valid interval; `invalidMissingOrEndedDatesCannotQualifyButCrossMidnightCan` |
| Q09 | Admin supplies future start without end; tries past start | Accept no end, reject past publication; legacy still requires end; `adminNeedsNoInventedEndTimeButCannotPublishAnAlreadyStartedEvent` |
| Q10 | Missing/invalid zone or fixed UTC offset instead of IANA zone | NEEDS_INFORMATION; `invalidTimezoneIsNotReplacedByServerTimezone` |
| Q11 | Existing organizer workflow gets unverified/rejected/suspended identity | Legacy verification guards preserved, organizer direct publication denied; `legacyOrganizerAssessmentStillRequiresVerification` |

## V02 — executable lifecycle and nearby-state scenarios

| ID | Scenario | Expected result / test method |
|---|---|---|
| D01 | USER, ORGANIZER or MODERATOR attempts publication/deletion; ADMIN does it | Only ADMIN allowed; deleted terminal, no same-state action; `onlyAdminHasStageOneTransitionsAndDeletedIsTerminal` |
| D02 | Draft/deleted/friendly/already-started item enters nearby feed | Excluded; exact start instant allowed; `nearbyDiscoveryExcludesDraftsDeletedFriendlyAndAlreadyStartedEvents` |
| D03 | Denied/revoked consent but stale point/results still exist | HIDDEN regardless of query state; `noConsentHidesHomeEvenWhenStalePositionOrResultsExist` |
| D04 | Consent but timeout/no point; query error; empty radius; real results | Distinct LOCATION_UNAVAILABLE/ERROR/EMPTY/RESULTS/loading; `missingPositionIsNotAnEmptySearchAndFailuresAreNotNoEvents` |
| D05 | 100 km default; event at 100 vs 100.001 km; invalid configuration | Boundary inclusive, outside excluded, NaN/infinity/out-of-range rejected; `radiusHasInclusiveBoundaryAndNeverExpandsForSupply` |
| D06 | Same point, 1° equator, date line, poles, antipodes and invalid coordinates | Finite approximate distances and safe validation; `geodesicDistanceHandlesDateLinePolesAndAntipodesWithoutNan` |
| D07 | Nearer event has later date; distance/time ties | Distance then time then stable ID; `nearestOrderUsesDistanceThenTimeThenStableIdBeforePagination` |

## V02 — design walkthrough (2026-11-05)

These rows were checked against policy sections 2–5 and the Phase 2 first-stage
requirements. **PASS here means consistent and specified policy, not implemented
consent, storage, import, API, UI or deletion behavior.** Future implementation
checks are explicit so that this review cannot be mistaken for runtime acceptance.

| ID | Walkthrough and policy result | Review result | Runtime verification owner |
|---|---|---|---|
| W01 | No opt-in/denial/revocation: hide Home section, settings opt-in outside it; manually selected country/city still works. OS revocation clears consent, position, pending requests and results, late responses discarded. | PASS, §3–4; D03–D04 cover pure state choices | P2-I02 on web/iOS/Android |
| W02 | Permission granted, timeout/no position differs from empty supply. Both have catalog link; empty supply never receives distant/friendly fallback. | PASS, §4; D04–D05 cover state/boundary | P2-I01/P2-I02 |
| W03 | User A joins twice, signs out, user B filters Joined, A leaves | Only A's unique private relation, idempotent join/leave; no organizer notification, no reservation/ticket; clear private client data on account switch. PASS, §3 | P2-I05 ACL/concurrency/E2E |
| W04 | Admin deletes an event with current Join relations and a previously opened Home ticket | Remove public event/media and Joined, invalidate caches, old detail 404/410, minimal nonpublic audit only; no state restoration. PASS, §2–3; D01–D02 cover domain state | P2-I01/P2-I04/P2-I05 |
| W05 | Coordinates pass through API/proxy/error reporting; account changes or opt-in is revoked | No URL coordinates, body tracing or durable telemetry; memory only, no supplier calls, no shared cache. Clear on sign-out/revocation/disposal. PASS, §3 | P2-I01/P2-I02 logging/APM and client checks |
| W06 | Withdrawal/account deletion, event expiry, backup restore, exceptional hold | Earliest Joined disposal wins; live deletion immediate, source evidence 180 days, minimized audit 24 months; restore reapplies deletions. No blanket hold. PASS, §3; no cleanup execution claimed | P2-I01/P2-I05/P2-I06 |
| W07 | Search Austria, Poland, Brazil, Japan, Kenya, Australia, then ambiguous city names/EN–PL aliases | Global source chosen independently of supply; country-scoped city ID selection, original labels and region/ID disambiguation, no typed-string persistence. PASS, §5; these are acceptance examples, not imported dataset queries | P2-I01/P2-I02/P2-I04 |
| W08 | City missing/merged, duplicate name, invalid country/coordinates, failed monthly refresh | Quarantine invalid records, preserve IDs/tombstones, require curator resolution, keep last good snapshot and source manifest. PASS, §5 | P2-I01 importer/migration tests |
| W09 | Admin copies a social flyer or description; supplier names lack Polish labels | Require traceable rights/original text; separate private proof/public credit. GeoNames CC BY 4.0 credit and modifications in UI/docs; source-name fallback is honest. PASS, §3/§5; official source/schema/license links checked | P2-I01/P2-I04/P2-I06 |
| W10 | Date falls in a repeated/nonexistent DST hour; event spans midnight; optional end missing | Explicit valid offset + IANA zone, compare instants, no guessed end. PASS, §2; Q08–Q10 test pure instant/zone rules, not local-time parsing | P2-I01/P2-I02 timezone tests |

## Execution evidence and limits

Run from `backend`:

```sh
./mvnw --batch-mode test
```

Final run: **PASS — 31 tests, 0 failures/errors/skips**, including **18 Events
policy tests** and 3 architecture rules. Exit code 0; BUILD SUCCESS, 2026-11-05
10:13:53 Europe/Vienna. Surefire XML/text reports: `target/surefire-reports/`;
local log: `/tmp/soberity-p2-i00-tests.log`. Q01–Q11 and D01–D07 passed in that
run; W01–W10 passed the documented design walkthrough. This Maven phase
compiles all main/test sources and runs unit/architecture tests; `*IT` database
integration tests are not executed. No migration, application restart, dataset
import, real location request, API call or web/iOS/Android runtime is part of this
policy iteration. Later iterations retain their own mandatory acceptance gates.
