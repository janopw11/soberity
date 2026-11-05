package com.soberity.events.domain;

import java.time.Instant;
import java.util.Comparator;
import java.util.Objects;
import java.util.UUID;

/** Stage-one policy only. These pure rules do not grant roles or publish/persist events. */
public final class CuratedEventPolicy {
    public static final double DEFAULT_NEARBY_RADIUS_KM = 100;
    public static final double MAX_NEARBY_RADIUS_KM = 500;
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private CuratedEventPolicy() { }

    public enum Role { USER, ORGANIZER, MODERATOR, ADMIN }
    public enum State { DRAFT, PUBLISHED, DELETED }
    public enum Readiness { ELIGIBLE, NEEDS_INFORMATION, INELIGIBLE }
    public enum SearchState { LOADING, FAILED, EMPTY, RESULTS }
    public enum HomeState { HIDDEN, LOCATION_UNAVAILABLE, LOADING, ERROR, EMPTY, RESULTS }

    public record Qualification(Readiness readiness, EventPolicy.Assessment content,
                                boolean beverageRulesConfirmed) { }

    /** No invented VERIFIED organizer. ELIGIBLE still requires admin authorization and valid entry fields. */
    public static Qualification assess(EventPolicy.ContentFacts facts, boolean beverageRulesConfirmed, Instant now) {
        var content = EventPolicy.assessContent(facts, now, true);
        Readiness readiness;
        if (content.eligibility() == EventPolicy.Eligibility.INELIGIBLE
                || (facts.alcoholPolicy() != null && facts.alcoholPolicy() != EventPolicy.AlcoholPolicy.ALCOHOL_FREE)
                || (facts.startsAt() != null && facts.startsAt().isBefore(now))) {
            readiness = Readiness.INELIGIBLE;
        } else if (content.eligibility() == EventPolicy.Eligibility.NEEDS_INFORMATION || !beverageRulesConfirmed) {
            readiness = Readiness.NEEDS_INFORMATION;
        } else {
            readiness = Readiness.ELIGIBLE;
        }
        return new Qualification(readiness, content, beverageRulesConfirmed);
    }

    /** Role must be resolved on the server; full entry validation/audit/transactions belong to P2-I01. */
    public static boolean allowsTransition(State from, State to, Role role) {
        if (from == null || to == null || role != Role.ADMIN || from == to) return false;
        return switch (from) {
            case DRAFT -> to == State.PUBLISHED || to == State.DELETED;
            case PUBLISHED -> to == State.DRAFT || to == State.DELETED;
            case DELETED -> false;
        };
    }

    /** Necessary discovery conditions, in addition to current qualified content and complete fields. */
    public static boolean upcoming(State state, EventPolicy.AlcoholPolicy policy, Instant startsAt, Instant now) {
        Objects.requireNonNull(now, "Current instant required");
        return state == State.PUBLISHED && policy == EventPolicy.AlcoholPolicy.ALCOHOL_FREE
                && startsAt != null && !startsAt.isBefore(now);
    }

    public static HomeState homeState(boolean consent, boolean positionAvailable, SearchState search) {
        if (!consent) return HomeState.HIDDEN;
        if (!positionAvailable) return HomeState.LOCATION_UNAVAILABLE;
        return switch (Objects.requireNonNull(search, "Search state required")) {
            case LOADING -> HomeState.LOADING;
            case FAILED -> HomeState.ERROR;
            case EMPTY -> HomeState.EMPTY;
            case RESULTS -> HomeState.RESULTS;
        };
    }

    /** Deployment configuration, not a client-controlled unbounded fallback radius. */
    public static double radiusKm(double value) {
        if (!Double.isFinite(value) || value < 1 || value > MAX_NEARBY_RADIUS_KM) {
            throw new IllegalArgumentException("Nearby radius must be between 1 and 500 km.");
        }
        return value;
    }

    public static boolean withinRadius(double distanceKm, double radiusKm) {
        radiusKm(radiusKm);
        return Double.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= radiusKm;
    }

    /** WGS84 coordinates, spherical great-circle approximation; never travel distance/time. */
    public static double distanceKm(double latitude, double longitude, double eventLatitude, double eventLongitude) {
        coordinates(latitude, longitude);
        coordinates(eventLatitude, eventLongitude);
        double dLat = Math.toRadians(eventLatitude - latitude);
        double dLon = Math.toRadians(eventLongitude - longitude);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(latitude)) * Math.cos(Math.toRadians(eventLatitude))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.clamp(a, 0, 1)));
    }

    private static void coordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
                || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Invalid coordinates.");
        }
    }

    /** Tie-break ID keeps pagination deterministic. Apply this order before pagination in the future API. */
    public record NearbyOrder(UUID eventId, double distanceKm, Instant startsAt) {
        public NearbyOrder {
            Objects.requireNonNull(eventId, "Event ID required");
            Objects.requireNonNull(startsAt, "Start instant required");
            if (!Double.isFinite(distanceKm) || distanceKm < 0) throw new IllegalArgumentException("Invalid distance.");
        }
    }

    public static final Comparator<NearbyOrder> NEAREST_FIRST = Comparator.comparingDouble(NearbyOrder::distanceKm)
            .thenComparing(NearbyOrder::startsAt).thenComparing(NearbyOrder::eventId);
}
