package com.soberity.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.soberity.events.domain.CuratedEventPolicy;
import com.soberity.events.domain.CuratedEventPolicy.*;
import com.soberity.events.domain.EventPolicy;
import com.soberity.events.domain.EventPolicy.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventPolicyTest {
    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    @Test
    void adminCanQualifySoberRaveWithoutInventingOrganizerVerification() {
        var result = qualify(new Fixture());
        assertThat(result.readiness()).isEqualTo(Readiness.ELIGIBLE);
        assertThat(result.content().reasons()).isEmpty();
    }

    @Test
    void coffeeMeetupKeepsItsLifestyleClassification() {
        var f = new Fixture();
        f.track = Track.SOBER_LIFESTYLE;
        f.category = Category.COFFEE_MEETUP;
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.ELIGIBLE);
        f.category = Category.SOBER_RAVE;
        assertThat(qualify(f).content().reasons()).contains(Reason.CATEGORY_TRACK_MISMATCH);
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.INELIGIBLE);
    }

    @Test
    void alcoholSaleServiceOrByobEachExcludeStrictEventEvenWithOtherUnknownControls() {
        for (var controls : List.of(new AlcoholControls(true, null, null, null),
                new AlcoholControls(false, true, false, null), new AlcoholControls(false, false, true, null))) {
            var f = new Fixture();
            f.controls = controls;
            var result = qualify(f);
            assertThat(result.readiness()).isEqualTo(Readiness.INELIGIBLE);
            assertThat(result.content().reasons()).contains(Reason.ALCOHOL_FREE_CONFLICT);
        }
    }

    @Test
    void missingControlsOrRulesNeverMeanAlcoholFree() {
        var f = new Fixture();
        f.controls = new AlcoholControls(false, null, false, null);
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.NEEDS_INFORMATION);
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_ALCOHOL_CONTROLS);
        f.controls = null;
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.NEEDS_INFORMATION);
        f = new Fixture();
        f.rules = " ";
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_ALCOHOL_RULES);
    }

    @Test
    void friendlyEventsCannotFillStageOneSoberSupply() {
        var f = new Fixture();
        f.category = Category.LIVE_MUSIC;
        f.policy = AlcoholPolicy.SOBER_FRIENDLY;
        f.controls = new AlcoholControls(true, true, true, true);
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.INELIGIBLE);
        f.category = Category.SOBER_RAVE;
        assertThat(qualify(f).content().reasons()).contains(Reason.SOBER_CATEGORY_REQUIRES_ALCOHOL_FREE);
    }

    @Test
    void absenceOfClassificationIsNotAValidDefault() {
        var f = new Fixture();
        f.policy = null;
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.NEEDS_INFORMATION);
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_CLASSIFICATION);
    }

    @Test
    void sourceRightsAndBeverageClarificationAreIndependentPublicationGates() {
        var f = new Fixture();
        f.source = false;
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_SOURCE);
        f = new Fixture();
        f.permission = false;
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_CONTENT_PERMISSION);
        assertThat(CuratedEventPolicy.assess(new Fixture().content(), false, NOW).readiness())
                .isEqualTo(Readiness.NEEDS_INFORMATION);
    }

    @Test
    void invalidMissingOrEndedDatesCannotQualifyButCrossMidnightCan() {
        var f = new Fixture(); // 23:00 to 02:00 event-local time, across midnight
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.ELIGIBLE);
        f.end = f.start;
        assertThat(qualify(f).content().reasons()).contains(Reason.INVALID_DATES);
        f.start = NOW.minusSeconds(7200);
        f.end = NOW;
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.INELIGIBLE);
        assertThat(qualify(f).content().reasons()).contains(Reason.EVENT_ALREADY_ENDED);
        f.start = null;
        assertThat(qualify(f).content().reasons()).contains(Reason.MISSING_DATES);
    }

    @Test
    void adminNeedsNoInventedEndTimeButCannotPublishAnAlreadyStartedEvent() {
        var f = new Fixture();
        f.end = null;
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.ELIGIBLE);
        assertThat(EventPolicy.assess(f.legacy(Verification.VERIFIED), NOW).reasons()).contains(Reason.MISSING_DATES);
        f.start = NOW.minusSeconds(1);
        assertThat(qualify(f).readiness()).isEqualTo(Readiness.INELIGIBLE);
    }

    @Test
    void invalidTimezoneIsNotReplacedByServerTimezone() {
        var f = new Fixture();
        for (String zone : new String[] {"", "invalid/timezone", "+01:00", "GMT+01:00"}) {
            f.zone = zone;
            assertThat(qualify(f).readiness()).isEqualTo(Readiness.NEEDS_INFORMATION);
            assertThat(qualify(f).content().reasons()).contains(Reason.INVALID_TIMEZONE);
        }
        f.zone = null;
        assertThat(qualify(f).content().reasons()).contains(Reason.INVALID_TIMEZONE);
    }

    @Test
    void legacyOrganizerAssessmentStillRequiresVerification() {
        var f = new Fixture();
        for (var verification : Verification.values()) {
            var result = EventPolicy.assess(f.legacy(verification), NOW);
            assertThat(result.eligibility()).isEqualTo(switch (verification) {
                case VERIFIED -> Eligibility.READY_FOR_REVIEW;
                case SUSPENDED, REJECTED -> Eligibility.INELIGIBLE;
                default -> Eligibility.NEEDS_INFORMATION;
            });
        }
        assertThat(EventPolicy.allowsTransition(Status.DRAFT, Status.PUBLISHED, Actor.ORGANIZER)).isFalse();
        assertThat(EventPolicy.allowsTransition(Status.IN_REVIEW, Status.APPROVED, Actor.MODERATOR)).isTrue();
        assertThat(EventPolicy.listedByDefault(Status.PUBLISHED, AlcoholPolicy.ALCOHOL_FREE, Verification.UNVERIFIED)).isFalse();
        assertThat(EventPolicy.listedByDefault(Status.PUBLISHED, AlcoholPolicy.SOBER_FRIENDLY, Verification.VERIFIED)).isFalse();
    }

    @Test
    void onlyAdminHasStageOneTransitionsAndDeletedIsTerminal() {
        for (var role : Role.values()) {
            assertThat(CuratedEventPolicy.allowsTransition(State.DRAFT, State.PUBLISHED, role)).isEqualTo(role == Role.ADMIN);
            assertThat(CuratedEventPolicy.allowsTransition(State.PUBLISHED, State.DELETED, role)).isEqualTo(role == Role.ADMIN);
        }
        assertThat(CuratedEventPolicy.allowsTransition(State.DRAFT, State.DELETED, Role.ADMIN)).isTrue();
        assertThat(CuratedEventPolicy.allowsTransition(State.PUBLISHED, State.DRAFT, Role.ADMIN)).isTrue();
        for (var target : State.values()) {
            assertThat(CuratedEventPolicy.allowsTransition(State.DELETED, target, Role.ADMIN)).isFalse();
            assertThat(CuratedEventPolicy.allowsTransition(target, target, Role.ADMIN)).isFalse();
        }
        assertThat(CuratedEventPolicy.allowsTransition(null, State.PUBLISHED, Role.ADMIN)).isFalse();
        assertThat(CuratedEventPolicy.allowsTransition(State.DRAFT, State.PUBLISHED, null)).isFalse();
    }

    @Test
    void nearbyDiscoveryExcludesDraftsDeletedFriendlyAndAlreadyStartedEvents() {
        assertThat(CuratedEventPolicy.upcoming(State.PUBLISHED, AlcoholPolicy.ALCOHOL_FREE, NOW, NOW)).isTrue();
        assertThat(CuratedEventPolicy.upcoming(State.PUBLISHED, AlcoholPolicy.ALCOHOL_FREE, NOW.minusSeconds(1), NOW)).isFalse();
        assertThat(CuratedEventPolicy.upcoming(State.PUBLISHED, AlcoholPolicy.ALCOHOL_FREE, null, NOW)).isFalse();
        assertThat(CuratedEventPolicy.upcoming(State.DRAFT, AlcoholPolicy.ALCOHOL_FREE, NOW, NOW)).isFalse();
        assertThat(CuratedEventPolicy.upcoming(State.DELETED, AlcoholPolicy.ALCOHOL_FREE, NOW, NOW)).isFalse();
        assertThat(CuratedEventPolicy.upcoming(State.PUBLISHED, AlcoholPolicy.SOBER_FRIENDLY, NOW, NOW)).isFalse();
    }

    @Test
    void noConsentHidesHomeEvenWhenStalePositionOrResultsExist() {
        for (var search : SearchState.values()) {
            assertThat(CuratedEventPolicy.homeState(false, true, search)).isEqualTo(HomeState.HIDDEN);
            assertThat(CuratedEventPolicy.homeState(false, false, search)).isEqualTo(HomeState.HIDDEN);
        }
    }

    @Test
    void missingPositionIsNotAnEmptySearchAndFailuresAreNotNoEvents() {
        assertThat(CuratedEventPolicy.homeState(true, false, SearchState.EMPTY)).isEqualTo(HomeState.LOCATION_UNAVAILABLE);
        assertThat(CuratedEventPolicy.homeState(true, true, SearchState.FAILED)).isEqualTo(HomeState.ERROR);
        assertThat(CuratedEventPolicy.homeState(true, true, SearchState.LOADING)).isEqualTo(HomeState.LOADING);
        assertThat(CuratedEventPolicy.homeState(true, true, SearchState.EMPTY)).isEqualTo(HomeState.EMPTY);
        assertThat(CuratedEventPolicy.homeState(true, true, SearchState.RESULTS)).isEqualTo(HomeState.RESULTS);
    }

    @Test
    void radiusHasInclusiveBoundaryAndNeverExpandsForSupply() {
        double radius = CuratedEventPolicy.DEFAULT_NEARBY_RADIUS_KM;
        assertThat(radius).isEqualTo(100);
        assertThat(CuratedEventPolicy.withinRadius(0, radius)).isTrue();
        assertThat(CuratedEventPolicy.withinRadius(100, radius)).isTrue();
        assertThat(CuratedEventPolicy.withinRadius(100.001, radius)).isFalse();
        assertThat(CuratedEventPolicy.withinRadius(-1, radius)).isFalse();
        assertThat(CuratedEventPolicy.withinRadius(Double.NaN, radius)).isFalse();
        assertThat(CuratedEventPolicy.withinRadius(Double.POSITIVE_INFINITY, radius)).isFalse();
        assertThat(CuratedEventPolicy.radiusKm(1)).isEqualTo(1);
        assertThat(CuratedEventPolicy.radiusKm(500)).isEqualTo(500);
        for (double invalid : new double[] {0, -1, 500.001, Double.NaN, Double.POSITIVE_INFINITY}) {
            assertThatThrownBy(() -> CuratedEventPolicy.withinRadius(10, invalid)).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void geodesicDistanceHandlesDateLinePolesAndAntipodesWithoutNan() {
        assertThat(CuratedEventPolicy.distanceKm(0, 0, 0, 0)).isZero();
        assertThat(CuratedEventPolicy.distanceKm(0, 0, 0, 1)).isBetween(111.19, 111.20);
        assertThat(CuratedEventPolicy.distanceKm(0, 179.9, 0, -179.9)).isBetween(22.23, 22.25);
        assertThat(CuratedEventPolicy.distanceKm(90, 0, 90, 180)).isLessThan(0.000001);
        assertThat(CuratedEventPolicy.distanceKm(0, 0, 0, 180)).isBetween(20015.1, 20015.2);
        assertThatThrownBy(() -> CuratedEventPolicy.distanceKm(91, 0, 0, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuratedEventPolicy.distanceKm(0, 0, 0, 181)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CuratedEventPolicy.distanceKm(Double.NaN, 0, 0, 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void nearestOrderUsesDistanceThenTimeThenStableIdBeforePagination() {
        var firstId = new UUID(0, 1);
        var secondId = new UUID(0, 2);
        var nearer = new NearbyOrder(secondId, 10, NOW.plusSeconds(7200));
        var earlier = new NearbyOrder(secondId, 20, NOW);
        var laterFirstId = new NearbyOrder(firstId, 20, NOW.plusSeconds(3600));
        var laterSecondId = new NearbyOrder(secondId, 20, NOW.plusSeconds(3600));
        assertThat(List.of(laterSecondId, earlier, nearer, laterFirstId).stream()
                .sorted(CuratedEventPolicy.NEAREST_FIRST).toList())
                .containsExactly(nearer, earlier, laterFirstId, laterSecondId);
        assertThatThrownBy(() -> new NearbyOrder(firstId, Double.NaN, NOW)).isInstanceOf(IllegalArgumentException.class);
    }

    private Qualification qualify(Fixture f) {
        return CuratedEventPolicy.assess(f.content(), true, NOW);
    }

    private static class Fixture {
        Track track = Track.SOBER_NIGHTLIFE;
        Category category = Category.SOBER_RAVE;
        AlcoholPolicy policy = AlcoholPolicy.ALCOHOL_FREE;
        String rules = "Synthetic fixture: no alcohol sale, service or BYOB; 0.0% beverages only.";
        AlcoholControls controls = new AlcoholControls(false, false, false, null);
        boolean source = true;
        boolean permission = true;
        Instant start = Instant.parse("2026-11-06T22:00:00Z");
        Instant end = Instant.parse("2026-11-07T01:00:00Z");
        String zone = "Europe/Vienna";

        ContentFacts content() {
            return new ContentFacts(track, category, policy, rules, controls, source, permission, start, end, zone);
        }

        Facts legacy(Verification verification) {
            return new Facts(track, category, policy, rules, controls, verification, source, permission, start, end, zone);
        }
    }
}
