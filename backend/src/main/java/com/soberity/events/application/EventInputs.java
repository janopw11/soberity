package com.soberity.events.application;

import com.soberity.events.domain.EventPolicy.*;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class EventInputs {
    private EventInputs() { }
    public enum PriceKind { FREE, PAID, UNKNOWN }
    public enum Accessibility { UNKNOWN, ACCESSIBLE, PARTIAL, NOT_ACCESSIBLE }
    public enum Availability { UNKNOWN, AVAILABLE, SOLD_OUT }
    public record OrganizerInput(String name,String description,String website,String contactEmail) { }
    public record VerificationRequest(Integer expectedVersion,String evidenceReference) { }
    public record VerificationDecision(Integer expectedVersion,Verification decision,String notes,Boolean authorityConfirmed) { }
    public record VenueInput(String name,String address,String city,String region,String countryCode,Double latitude,Double longitude,
        String street,String buildingNumber,String postalCode,String formattedAddress,String providerPlaceId,String locationPrecision) { }
    public record EventInput(Integer expectedVersion,UUID venueId,String title,String description,String locale,
        Track track,Category category,AlcoholPolicy alcoholPolicy,String alcoholRules,AlcoholControls controls,
        String beverageNotes,OffsetDateTime startsAt,OffsetDateTime endsAt,String timezone,
        PriceKind priceKind,Long priceMinor,String currency,Accessibility accessibility,String accessibilityNotes,
        Availability availability,String entryRules,String externalTicketUrl,String sourceUrl,String sourceReference,
        Boolean contentRightsAttested,UUID coverId,tools.jackson.databind.JsonNode descriptionDocument,String organizerUrl) { }
    public record VersionRequest(Integer expectedVersion) { }
    public record Checks(Boolean sourceVerified,Boolean contentRightsVerified,Boolean alcoholControlsVerified,Boolean beverageAbvVerified) {
        public boolean complete() { return Boolean.TRUE.equals(sourceVerified) && Boolean.TRUE.equals(contentRightsVerified) && Boolean.TRUE.equals(alcoholControlsVerified) && Boolean.TRUE.equals(beverageAbvVerified); }
    }
    public record ReviewInput(Integer expectedVersion,Status decision,Checks checks,String notes) { }
}
