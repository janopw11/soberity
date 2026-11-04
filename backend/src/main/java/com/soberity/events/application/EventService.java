package com.soberity.events.application;

import com.soberity.events.domain.EventPolicy;
import com.soberity.events.domain.EventPolicy.*;
import com.soberity.identity.token.VerifiedToken;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static com.soberity.events.application.EventInputs.*;
import static com.soberity.events.application.EventValidation.*;

@Service
@Transactional
public class EventService {
    private final JdbcTemplate jdbc;
    private final EventAccess access;
    private final OrganizerService organizers;
    private final tools.jackson.databind.json.JsonMapper json;
    public EventService(JdbcTemplate jdbc,EventAccess access,OrganizerService organizers,tools.jackson.databind.json.JsonMapper json) { this.jdbc=jdbc;this.access=access;this.organizers=organizers;this.json=json; }
    public UUID venue(VerifiedToken actor,UUID organizerId,VenueInput input) {
        access.member(actor,organizerId);organizers.lock(organizerId);
        if(input==null) throw bad("Venue required.");coordinates(input.latitude(),input.longitude());
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO events_venue(id,organizer_id,name,address,city,region,country_code,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?)",id,organizerId,text(input.name(),200),text(input.address(),500),text(input.city(),150),optional(input.region(),150),country(input.countryCode()),input.latitude(),input.longitude());
        audit(actor,organizerId,null,"VENUE_CREATED");return id;
    }
    public Map<String,Object> venueDetail(VerifiedToken actor,UUID organizerId,UUID id) {
        access.member(actor,organizerId);
        var rows=jdbc.queryForList("SELECT * FROM events_venue WHERE id=? AND organizer_id=?",id,organizerId);
        if(rows.isEmpty()) throw notFound();return rows.getFirst();
    }
    public Map<String,Object> venues(VerifiedToken actor,UUID organizerId,int page) {
        access.member(actor,organizerId);page(page);
        return Map.of("items",jdbc.queryForList("SELECT * FROM events_venue WHERE organizer_id=? ORDER BY name,id LIMIT 50 OFFSET ?",organizerId,(long)page*50),"page",page,"size",50,
            "total",jdbc.queryForObject("SELECT count(*) FROM events_venue WHERE organizer_id=?",Long.class,organizerId));
    }
    public UUID save(VerifiedToken actor,UUID organizerId,UUID id,EventInput input) {
        access.member(actor,organizerId);organizers.lock(organizerId);validate(organizerId,input);
        String document=null;
        if(input.descriptionDocument()!=null && !input.descriptionDocument().isNull()) {
            try {
                var checked=com.soberity.evidence.blog.BlogDocument.check(input.descriptionDocument());
                if(!checked.images().isEmpty() || checked.text().isBlank() || checked.text().length()>30000) throw bad("Event description must contain text without embedded images.");
                document=json.writeValueAsString(checked.document());
                if(document.length()>200000) throw bad("Event description is too large.");
            } catch(IllegalArgumentException e) {throw bad("Invalid rich event description.");}
        }
        int revision=1;Map<String,Object> existing=null;
        if(id==null) {
            id=UUID.randomUUID();
            jdbc.update("INSERT INTO sober_event(id,organizer_id) VALUES (?,?)",id,organizerId);
        } else {
            existing=lock(id);
            if(!organizerId.equals(existing.get("organizer_id"))) throw notFound();
            version(input.expectedVersion(),existing.get("version"));
            if(!Set.of("DRAFT","CHANGES_REQUESTED","IN_REVIEW","APPROVED","PUBLISHED").contains(existing.get("status"))) throw conflict("Event cannot be edited in this state.");
            revision=((Number)existing.get("current_revision")).intValue()+1;
        }
        var controls=input.controls();
        jdbc.update("""
            INSERT INTO events_revision(event_id,organizer_id,revision,author_ref,title,description,locale,track,category_code,
            alcohol_policy,alcohol_rules,alcohol_sold,alcohol_served,alcohol_permitted,alcohol_free_participation,
            beverage_notes,venue_id,starts_at,ends_at,timezone,price_kind,price_minor,currency,accessibility,
            accessibility_notes,availability,entry_rules,external_ticket_url,source_url,source_reference,content_rights_attested,cover_id,description_document,organizer_url)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?::jsonb,?)
            """,id,organizerId,revision,access.ref(actor),text(input.title(),300),text(input.description(),30000),input.locale(),input.track().name(),input.category().name(),
            input.alcoholPolicy().name(),text(input.alcoholRules(),10000),controls==null?null:controls.alcoholSold(),controls==null?null:controls.alcoholServed(),controls==null?null:controls.alcoholPermitted(),controls==null?null:controls.explicitAlcoholFreeParticipation(),
            text(input.beverageNotes(),5000),input.venueId(),Timestamp.from(input.startsAt().toInstant()),Timestamp.from(input.endsAt().toInstant()),input.timezone(),input.priceKind().name(),input.priceMinor(),input.currency(),input.accessibility().name(),
            optional(input.accessibilityNotes(),5000),input.availability()==null?"UNKNOWN":input.availability().name(),text(input.entryRules(),5000),url(input.externalTicketUrl(),false),url(input.sourceUrl(),true),text(input.sourceReference(),10000),Boolean.TRUE.equals(input.contentRightsAttested()),input.coverId(),document,url(input.organizerUrl(),false));
        if(existing!=null) {
            String status=Set.of("PUBLISHED","APPROVED","IN_REVIEW").contains(existing.get("status"))?"IN_REVIEW":"DRAFT";
            jdbc.update("UPDATE sober_event SET current_revision=?,status=?,version=version+1,updated_at=clock_timestamp() WHERE id=?",revision,status,id);
        }
        audit(actor,organizerId,id,existing==null?"EVENT_CREATED":"EVENT_REVISED");return id;
    }
    public Map<String,Object> privateDetail(VerifiedToken actor,UUID id) {
        UUID organizerId=ownedOrganizer(actor,id);organizers.lock(organizerId);
        return detail(id);
    }
    public Map<String,Object> mine(VerifiedToken actor,UUID organizerId,int page) {
        access.member(actor,organizerId);page(page);
        return Map.of("items",jdbc.queryForList("SELECT e.*,r.title,r.starts_at,r.ends_at,r.timezone FROM sober_event e JOIN events_revision r ON r.event_id=e.id AND r.revision=e.current_revision WHERE e.organizer_id=? ORDER BY e.updated_at DESC,e.id LIMIT 50 OFFSET ?",organizerId,(long)page*50),"page",page,"size",50,
            "total",jdbc.queryForObject("SELECT count(*) FROM sober_event WHERE organizer_id=?",Long.class,organizerId));
    }
    public void submit(VerifiedToken actor,UUID id,VersionRequest request) {
        UUID organizerId=ownedOrganizer(actor,id);var organizer=organizers.lock(organizerId);var event=lock(id);
        expected(request,event);transition(event,Status.IN_REVIEW,Actor.ORGANIZER);
        if(!"VERIFIED".equals(organizer.get("verification"))) throw conflict("Verify the organizer before submitting an event.");
        var content=revision(event);
        if(!Boolean.TRUE.equals(content.get("content_rights_attested")) || !instant(content.get("ends_at")).isAfter(Instant.now())) throw bad("Content rights and a current event are required.");
        // Submission only enters the human-review queue; it is not evidence verification.
        update(event,Status.IN_REVIEW);audit(actor,organizerId,id,"EVENT_SUBMITTED");
    }
    public void withdraw(VerifiedToken actor,UUID id,VersionRequest request) {
        UUID organizerId=ownedOrganizer(actor,id);organizers.lock(organizerId);var event=lock(id);
        expected(request,event);transition(event,Status.DRAFT,Actor.ORGANIZER);update(event,Status.DRAFT);audit(actor,organizerId,id,"SUBMISSION_WITHDRAWN");
    }
    public void cancel(VerifiedToken actor,UUID id,VersionRequest request) {
        UUID organizerId=ownedOrganizer(actor,id);organizers.lock(organizerId);var event=lock(id);
        expected(request,event);transition(event,Status.CANCELLED,Actor.ORGANIZER);update(event,Status.CANCELLED);audit(actor,organizerId,id,"EVENT_CANCELLED");
    }
    public Map<String,Object> moderationQueue(VerifiedToken actor,int page) {
        access.moderator(actor);page(page);
        return Map.of("items",jdbc.queryForList("SELECT e.*,r.title,r.starts_at,r.ends_at,r.timezone,o.name AS organizer_name FROM sober_event e JOIN events_revision r ON r.event_id=e.id AND r.revision=e.current_revision JOIN events_organizer o ON o.id=e.organizer_id WHERE e.status IN ('IN_REVIEW','APPROVED','PUBLISHED') ORDER BY e.updated_at,e.id LIMIT 50 OFFSET ?",(long)page*50),"page",page,"size",50,
            "total",jdbc.queryForObject("SELECT count(*) FROM sober_event WHERE status IN ('IN_REVIEW','APPROVED','PUBLISHED')",Long.class));
    }
    public Map<String,Object> moderationDetail(VerifiedToken actor,UUID id) {
        access.moderator(actor);return detail(id);
    }
    public void review(VerifiedToken actor,UUID id,ReviewInput input) {
        access.moderator(actor);UUID organizerId=organizerFor(id);var organizer=organizers.lock(organizerId);var event=lock(id);
        if(input==null || input.decision()==null || !Set.of(Status.APPROVED,Status.CHANGES_REQUESTED,Status.REJECTED).contains(input.decision())) throw bad("Review decision required.");
        if(!"IN_REVIEW".equals(event.get("status"))) throw conflict("Only submitted revisions can be reviewed.");
        version(input.expectedVersion(),event.get("version"));transition(event,input.decision(),Actor.MODERATOR);
        var content=revision(event);access.independent(actor,organizerId,content.get("author_ref").toString());
        var checks=input.checks();
        if(input.decision()==Status.APPROVED) {
            if(checks==null || !checks.complete()) throw bad("Verify source, rights, alcohol controls and beverage ABV before approval.");
            eligible(content,organizer,checks);
        }
        jdbc.update("INSERT INTO events_review(id,event_id,revision,moderator_ref,decision,source_verified,content_rights_verified,alcohol_controls_verified,beverage_abv_verified,notes) VALUES (?,?,?,?,?,?,?,?,?,?)",UUID.randomUUID(),id,event.get("current_revision"),access.ref(actor),input.decision().name(),
            checks!=null && Boolean.TRUE.equals(checks.sourceVerified()),checks!=null && Boolean.TRUE.equals(checks.contentRightsVerified()),checks!=null && Boolean.TRUE.equals(checks.alcoholControlsVerified()),checks!=null && Boolean.TRUE.equals(checks.beverageAbvVerified()),text(input.notes(),10000));
        update(event,input.decision());audit(actor,organizerId,id,"EVENT_"+input.decision().name());
    }
    public void publish(VerifiedToken actor,UUID id,VersionRequest request) {
        access.moderator(actor);UUID organizerId=organizerFor(id);var organizer=organizers.lock(organizerId);var event=lock(id);
        expected(request,event);transition(event,Status.PUBLISHED,Actor.MODERATOR);
        var content=revision(event);access.independent(actor,organizerId,content.get("author_ref").toString());
        var reviews=jdbc.queryForList("SELECT * FROM events_review WHERE event_id=? AND revision=? AND decision='APPROVED'",id,event.get("current_revision"));
        if(reviews.isEmpty()) throw conflict("Current approved revision required.");
        var approved=reviews.getFirst();
        eligible(content,organizer,new Checks((Boolean)approved.get("source_verified"),(Boolean)approved.get("content_rights_verified"),(Boolean)approved.get("alcohol_controls_verified"),(Boolean)approved.get("beverage_abv_verified")));
        jdbc.update("UPDATE sober_event SET status='PUBLISHED',published_at=clock_timestamp(),published_revision=current_revision,version=version+1,updated_at=clock_timestamp() WHERE id=?",id);
        audit(actor,organizerId,id,"EVENT_PUBLISHED");
    }
    public void moderateState(VerifiedToken actor,UUID id,Status target,VersionRequest request) {
        access.moderator(actor);UUID organizerId=organizerFor(id);organizers.lock(organizerId);var event=lock(id);
        expected(request,event);
        if(!Set.of(Status.CANCELLED,Status.ARCHIVED).contains(target)) throw bad("Cancellation or archive required.");
        transition(event,target,Actor.MODERATOR);update(event,target);audit(actor,organizerId,id,"EVENT_"+target.name());
    }
    private void validate(UUID organizerId,EventInput input) {
        if(input==null || input.track()==null || input.category()==null || input.alcoholPolicy()==null || input.accessibility()==null || input.venueId()==null) throw bad("Classification, accessibility and venue required.");
        if(!"en".equals(input.locale()) && !"pl".equals(input.locale())) throw bad("Supported event language required.");
        dates(input.startsAt(),input.endsAt(),input.timezone());price(input.priceKind(),input.priceMinor(),input.currency());
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_category WHERE code=? AND track=?)",Boolean.class,input.category().name(),input.track().name()))) throw bad("Category does not match track.");
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_venue WHERE id=? AND organizer_id=?)",Boolean.class,input.venueId(),organizerId))) throw bad("Venue must belong to the organizer.");
        if(input.coverId()!=null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_media WHERE id=? AND organizer_id=?)",Boolean.class,input.coverId(),organizerId))) throw bad("Cover must belong to the organizer.");
        var controls=input.controls();
        if(input.alcoholPolicy()==AlcoholPolicy.ALCOHOL_FREE && controls!=null && (Boolean.TRUE.equals(controls.alcoholSold()) || Boolean.TRUE.equals(controls.alcoholServed()) || Boolean.TRUE.equals(controls.alcoholPermitted()))) throw bad("Alcohol-free event cannot sell, serve or permit alcohol.");
        if(Set.of(Category.SOBER_PARTY,Category.SOBER_RAVE).contains(input.category()) && input.alcoholPolicy()!=AlcoholPolicy.ALCOHOL_FREE) throw bad("Sober parties and raves must be alcohol-free.");
    }
    private void eligible(Map<String,Object> content,Map<String,Object> organizer,Checks checks) {
        var facts=new EventPolicy.Facts(Track.valueOf(content.get("track").toString()),Category.valueOf(content.get("category_code").toString()),AlcoholPolicy.valueOf(content.get("alcohol_policy").toString()),content.get("alcohol_rules").toString(),
            new AlcoholControls((Boolean)content.get("alcohol_sold"),(Boolean)content.get("alcohol_served"),(Boolean)content.get("alcohol_permitted"),(Boolean)content.get("alcohol_free_participation")),Verification.valueOf(organizer.get("verification").toString()),
            Boolean.TRUE.equals(checks.sourceVerified()),Boolean.TRUE.equals(checks.contentRightsVerified()) && Boolean.TRUE.equals(content.get("content_rights_attested")),instant(content.get("starts_at")),instant(content.get("ends_at")),content.get("timezone").toString());
        if(!checks.complete() || EventPolicy.assess(facts,Instant.now()).eligibility()!=Eligibility.READY_FOR_REVIEW) throw conflict("Event is not eligible for approval/publication.");
    }
    private Map<String,Object> detail(UUID id) {
        var event=lockless(id);
        var result=new LinkedHashMap<>(event);result.put("content",revision(event));
        result.put("reviews",jdbc.queryForList("SELECT revision,decision,source_verified,content_rights_verified,alcohol_controls_verified,beverage_abv_verified,notes,reviewed_at FROM events_review WHERE event_id=? ORDER BY revision DESC",id));
        result.put("audit",jdbc.queryForList("SELECT action,created_at FROM events_audit WHERE event_id=? ORDER BY created_at,id",id));return result;
    }
    private UUID ownedOrganizer(VerifiedToken actor,UUID id) {
        access.verified(actor);
        var rows=jdbc.queryForList("SELECT e.organizer_id FROM sober_event e JOIN events_membership m ON m.organizer_id=e.organizer_id WHERE e.id=? AND m.firebase_uid=?",id,actor.uid());
        if(rows.isEmpty()) throw notFound();return (UUID)rows.getFirst().get("organizer_id");
    }
    private UUID organizerFor(UUID id) { return (UUID)lockless(id).get("organizer_id"); }
    private Map<String,Object> lockless(UUID id) { var rows=jdbc.queryForList("SELECT * FROM sober_event WHERE id=?",id);if(rows.isEmpty())throw notFound();return rows.getFirst(); }
    private Map<String,Object> lock(UUID id) { var rows=jdbc.queryForList("SELECT * FROM sober_event WHERE id=? FOR UPDATE",id);if(rows.isEmpty())throw notFound();return rows.getFirst(); }
    private Map<String,Object> revision(Map<String,Object> event) {
        var content=jdbc.queryForMap("SELECT * FROM events_revision WHERE event_id=? AND revision=?",event.get("id"),event.get("current_revision"));
        if(content.get("description_document")!=null) content.put("description_document",json.readTree(content.get("description_document").toString()));
        return content;
    }
    private void transition(Map<String,Object> event,Status to,Actor actor) { if(!EventPolicy.allowsTransition(Status.valueOf(event.get("status").toString()),to,actor)) throw conflict("Invalid event transition."); }
    private void expected(VersionRequest request,Map<String,Object> event) { if(request==null)throw bad("Expected version required.");version(request.expectedVersion(),event.get("version")); }
    private void update(Map<String,Object> event,Status status) { jdbc.update("UPDATE sober_event SET status=?,version=version+1,updated_at=clock_timestamp() WHERE id=?",status.name(),event.get("id")); }
    private void audit(VerifiedToken actor,UUID organizerId,UUID id,String action) { jdbc.update("INSERT INTO events_audit(id,organizer_id,event_id,actor_ref,action) VALUES (?,?,?,?,?)",UUID.randomUUID(),organizerId,id,access.ref(actor),action); }
    private Instant instant(Object value) { return ((Timestamp)value).toInstant(); }
    private void page(int page) { if(page<0 || page>100000)throw bad("Invalid page."); }
    private ResponseStatusException notFound() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"Event not found."); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT,message); }
}
