package com.soberity.events.application;

import com.soberity.events.domain.EventPolicy.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.OffsetDateTime;
import java.util.UUID;

/** Source/rights confirmations are private administrator attestations, never public event fields. */
public record CuratedEventInput(Integer expectedVersion,UUID countryId,UUID cityId,String venueName,String address,
        Double latitude,Double longitude,String title,String description,String locale,Track track,Category category,
        String organizerUrl,UUID coverId,
        @JsonFormat(without=JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE) OffsetDateTime startsAt,
        @JsonFormat(without=JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE) OffsetDateTime endsAt,String timezone,
        String alcoholRules,AlcoholControls controls,String beverageNotes,Boolean beverageRulesConfirmed,
        String sourceUrl,String sourceReference,Boolean contentRightsAttested,tools.jackson.databind.JsonNode descriptionDocument,
        String street,String buildingNumber,String postalCode,String formattedAddress,String providerPlaceId,String locationPrecision) { }
