package com.soberity.events.domain;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/** P2-I00 policy vocabulary; no API, persistence or automatic moderation approval. */
public final class EventPolicy {
    private EventPolicy() { }
    public enum Track { SOBER_NIGHTLIFE, SOBER_LIFESTYLE }
    public enum AlcoholPolicy { ALCOHOL_FREE, SOBER_FRIENDLY }
    public enum Category {
        SOBER_PARTY, SOBER_RAVE, DANCE, LIVE_MUSIC,
        COFFEE_MEETUP, SPORT, OUTDOORS, WORKSHOP, CULTURE, OTHER
    }
    public enum Verification { UNVERIFIED, IN_REVIEW, VERIFIED, REJECTED, SUSPENDED }
    public enum Status { DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED, PUBLISHED, REJECTED, CANCELLED, ARCHIVED }
    public enum Actor { ORGANIZER, MODERATOR }
    public enum Eligibility { READY_FOR_REVIEW, NEEDS_INFORMATION, INELIGIBLE }
    public enum Reason {
        MISSING_CLASSIFICATION, CATEGORY_TRACK_MISMATCH, ORGANIZER_NOT_VERIFIED, ORGANIZER_SUSPENDED,
        ORGANIZER_REJECTED, MISSING_SOURCE, MISSING_CONTENT_PERMISSION, MISSING_ALCOHOL_RULES,
        ALCOHOL_FREE_CONFLICT, SOBER_CATEGORY_REQUIRES_ALCOHOL_FREE, MISSING_ALCOHOL_CONTROLS, SOBER_FRIENDLY_NOT_DEMONSTRATED,
        MISSING_DATES, INVALID_DATES, EVENT_ALREADY_ENDED, INVALID_TIMEZONE
    }
    /** Controls are tri-state: absent evidence is not interpreted as no alcohol. */
    public record AlcoholControls(Boolean alcoholSold, Boolean alcoholServed, Boolean alcoholPermitted,
                                  Boolean explicitAlcoholFreeParticipation) { }
    /** Verification and provenance fields must be supplied by trusted moderation, not accepted as proof from clients. */
    public record Facts(Track track,Category category,AlcoholPolicy alcoholPolicy,String alcoholRules,
                        AlcoholControls alcoholControls,Verification organizerVerification,
                        boolean sourceTraceable,boolean contentPermissionConfirmed,
                        Instant startsAt,Instant endsAt,String timezone) { }
    /** Content evidence is independent of the deferred organizer-account verification workflow. */
    public record ContentFacts(Track track,Category category,AlcoholPolicy alcoholPolicy,String alcoholRules,
                               AlcoholControls alcoholControls,boolean sourceTraceable,
                               boolean contentPermissionConfirmed,Instant startsAt,Instant endsAt,String timezone) { }
    public record Assessment(Eligibility eligibility,List<Reason> reasons) {
        public Assessment { reasons=List.copyOf(reasons); }
    }
    private static final Set<Category> NIGHTLIFE=Set.of(Category.SOBER_PARTY,Category.SOBER_RAVE,Category.DANCE,Category.LIVE_MUSIC);

    public static Assessment assess(Facts facts,Instant now) {
        Objects.requireNonNull(facts,"Event facts required");
        var content=assessContent(new ContentFacts(facts.track(),facts.category(),facts.alcoholPolicy(),
            facts.alcoholRules(),facts.alcoholControls(),facts.sourceTraceable(),facts.contentPermissionConfirmed(),
            facts.startsAt(),facts.endsAt(),facts.timezone()),now,false);
        var reasons=new ArrayList<>(content.reasons());
        boolean ineligible=content.eligibility()==Eligibility.INELIGIBLE;
        if(facts.organizerVerification()==Verification.SUSPENDED) { reasons.add(Reason.ORGANIZER_SUSPENDED); ineligible=true; }
        else if(facts.organizerVerification()==Verification.REJECTED) { reasons.add(Reason.ORGANIZER_REJECTED); ineligible=true; }
        else if(facts.organizerVerification()!=Verification.VERIFIED) reasons.add(Reason.ORGANIZER_NOT_VERIFIED);
        return assessment(reasons,ineligible);
    }

    static Assessment assessContent(ContentFacts facts,Instant now,boolean endOptional) {
        Objects.requireNonNull(facts,"Event facts required"); Objects.requireNonNull(now,"Current instant required");
        var reasons=new ArrayList<Reason>(); boolean ineligible=false;
        if(facts.track()==null || facts.category()==null || facts.alcoholPolicy()==null) reasons.add(Reason.MISSING_CLASSIFICATION);
        if(facts.track()!=null && facts.category()!=null &&
            (facts.track()==Track.SOBER_NIGHTLIFE)!=NIGHTLIFE.contains(facts.category())) {
            reasons.add(Reason.CATEGORY_TRACK_MISMATCH); ineligible=true;
        }
        if(!facts.sourceTraceable()) reasons.add(Reason.MISSING_SOURCE);
        if(!facts.contentPermissionConfirmed()) reasons.add(Reason.MISSING_CONTENT_PERMISSION);
        if(facts.alcoholRules()==null || facts.alcoholRules().isBlank()) reasons.add(Reason.MISSING_ALCOHOL_RULES);
        if((facts.category()==Category.SOBER_PARTY || facts.category()==Category.SOBER_RAVE) && facts.alcoholPolicy()==AlcoholPolicy.SOBER_FRIENDLY) {
            reasons.add(Reason.SOBER_CATEGORY_REQUIRES_ALCOHOL_FREE); ineligible=true;
        }
        var controls=facts.alcoholControls();
        if(controls==null || controls.alcoholSold()==null || controls.alcoholServed()==null || controls.alcoholPermitted()==null) {
            reasons.add(Reason.MISSING_ALCOHOL_CONTROLS);
        }
        if(facts.alcoholPolicy()==AlcoholPolicy.ALCOHOL_FREE && controls!=null &&
            (Boolean.TRUE.equals(controls.alcoholSold()) || Boolean.TRUE.equals(controls.alcoholServed()) || Boolean.TRUE.equals(controls.alcoholPermitted()))) {
            reasons.add(Reason.ALCOHOL_FREE_CONFLICT); ineligible=true;
        }
        if(facts.alcoholPolicy()==AlcoholPolicy.SOBER_FRIENDLY &&
            (controls==null || !Boolean.TRUE.equals(controls.explicitAlcoholFreeParticipation())))
            reasons.add(Reason.SOBER_FRIENDLY_NOT_DEMONSTRATED);
        if(facts.startsAt()==null || (!endOptional && facts.endsAt()==null)) reasons.add(Reason.MISSING_DATES);
        else if(facts.endsAt()!=null && !facts.endsAt().isAfter(facts.startsAt())) { reasons.add(Reason.INVALID_DATES); ineligible=true; }
        else if(facts.endsAt()!=null && !facts.endsAt().isAfter(now)) { reasons.add(Reason.EVENT_ALREADY_ENDED); ineligible=true; }
        try {
            ZoneId.of(Objects.requireNonNullElse(facts.timezone(),""));
            if(!ZoneId.getAvailableZoneIds().contains(facts.timezone())) reasons.add(Reason.INVALID_TIMEZONE);
        }
        catch(DateTimeException e) { reasons.add(Reason.INVALID_TIMEZONE); }
        return assessment(reasons,ineligible);
    }
    private static Assessment assessment(List<Reason> reasons,boolean ineligible) {
        return new Assessment(ineligible?Eligibility.INELIGIBLE:reasons.isEmpty()?Eligibility.READY_FOR_REVIEW:Eligibility.NEEDS_INFORMATION,reasons);
    }
    /** Transition permission is necessary, never sufficient: ownership, review and version guards belong to the API. */
    public static boolean allowsTransition(Status from,Status to,Actor actor) {
        if(from==null || to==null || actor==null || from==to) return false;
        if(actor==Actor.ORGANIZER) return switch(from) {
            case DRAFT, CHANGES_REQUESTED -> to==Status.IN_REVIEW || to==Status.ARCHIVED;
            case IN_REVIEW -> to==Status.DRAFT || to==Status.CANCELLED;
            case APPROVED -> to==Status.CANCELLED;
            case PUBLISHED -> to==Status.IN_REVIEW || to==Status.CANCELLED;
            default -> false;
        };
        return switch(from) {
            case IN_REVIEW -> to==Status.CHANGES_REQUESTED || to==Status.APPROVED || to==Status.REJECTED;
            case APPROVED -> to==Status.PUBLISHED || to==Status.CHANGES_REQUESTED || to==Status.CANCELLED;
            case PUBLISHED -> to==Status.IN_REVIEW || to==Status.CANCELLED || to==Status.ARCHIVED;
            case CANCELLED, REJECTED -> to==Status.ARCHIVED;
            default -> false;
        };
    }
    /** Friendly events must be explicitly requested; no alcohol-free inference from a category or venue name. */
    public static boolean listedByDefault(Status status,AlcoholPolicy alcoholPolicy,Verification verification) {
        return status==Status.PUBLISHED && alcoholPolicy==AlcoholPolicy.ALCOHOL_FREE && verification==Verification.VERIFIED;
    }
}
