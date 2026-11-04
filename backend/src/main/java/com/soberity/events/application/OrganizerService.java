package com.soberity.events.application;

import com.soberity.identity.token.VerifiedToken;
import com.soberity.events.domain.EventPolicy.Verification;
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
public class OrganizerService {
    private final JdbcTemplate jdbc;
    private final EventAccess access;
    public OrganizerService(JdbcTemplate jdbc,EventAccess access) { this.jdbc=jdbc;this.access=access; }
    public UUID create(VerifiedToken actor,OrganizerInput input) {
        access.verified(actor); if(input==null) throw bad("Organizer required.");
        UUID id=UUID.randomUUID();String ref=access.ref(actor);
        jdbc.update("INSERT INTO events_organizer(id,name,description,website,contact_email,contact_actor_ref,created_by_ref) VALUES (?,?,?,?,?,?,?)",id,text(input.name(),200),text(input.description(),10000),url(input.website(),true),email(input.contactEmail()),ref,ref);
        jdbc.update("INSERT INTO events_membership(organizer_id,firebase_uid,actor_ref,role) VALUES (?,?,?,'OWNER')",id,actor.uid(),ref);
        audit(actor,id,"ORGANIZER_CREATED");return id;
    }
    public Map<String,Object> mine(VerifiedToken actor,int page) {
        access.verified(actor);if(page<0 || page>100000) throw bad("Invalid page.");
        return Map.of("items",jdbc.queryForList("SELECT o.*,m.role FROM events_organizer o JOIN events_membership m ON m.organizer_id=o.id WHERE m.firebase_uid=? ORDER BY o.created_at DESC,o.id LIMIT 50 OFFSET ?",actor.uid(),(long)page*50),"page",page,"size",50,
            "total",jdbc.queryForObject("SELECT count(*) FROM events_membership WHERE firebase_uid=?",Long.class,actor.uid()));
    }
    public Map<String,Object> privateDetail(VerifiedToken actor,UUID id) {
        access.member(actor,id);return row(id);
    }
    public void submit(VerifiedToken actor,UUID id,VerificationRequest input) {
        access.member(actor,id);var organizer=lock(id);
        if(input==null) throw bad("Verification request required.");version(input.expectedVersion(),organizer.get("version"));
        if(!Set.of("UNVERIFIED","REJECTED","SUSPENDED").contains(organizer.get("verification"))) throw conflict("Organizer cannot enter verification from its current state.");
        // Suspension cannot be bypassed by an organizer's own resubmission.
        if("SUSPENDED".equals(organizer.get("verification"))) throw conflict("A moderator must reopen suspended verification.");
        jdbc.update("UPDATE events_organizer SET verification='IN_REVIEW',verification_reference=?,version=version+1,updated_at=clock_timestamp() WHERE id=?",text(input.evidenceReference(),10000),id);
        audit(actor,id,"ORGANIZER_SUBMITTED");
    }
    public Map<String,Object> queue(VerifiedToken actor,int page) {
        access.moderator(actor);if(page<0 || page>100000) throw bad("Invalid page.");
        return Map.of("items",jdbc.queryForList("SELECT * FROM events_organizer WHERE verification IN ('IN_REVIEW','VERIFIED','SUSPENDED') ORDER BY updated_at,id LIMIT 50 OFFSET ?",(long)page*50),"page",page,"size",50,"total",jdbc.queryForObject("SELECT count(*) FROM events_organizer WHERE verification IN ('IN_REVIEW','VERIFIED','SUSPENDED')",Long.class));
    }
    public void decide(VerifiedToken actor,UUID id,VerificationDecision input) {
        access.moderator(actor);var organizer=lock(id);access.independent(actor,id,organizer.get("created_by_ref").toString());
        if(input==null || input.decision()==null) throw bad("Verification decision required.");version(input.expectedVersion(),organizer.get("version"));
        String current=organizer.get("verification").toString();
        boolean allowed=switch(input.decision()) {
            case VERIFIED, REJECTED -> current.equals("IN_REVIEW");
            case SUSPENDED -> current.equals("VERIFIED");
            case IN_REVIEW -> current.equals("SUSPENDED");
            default -> false;
        };
        if(!allowed) throw conflict("Invalid verification transition.");
        String notes=text(input.notes(),10000);
        if(input.decision()==Verification.VERIFIED && (!Boolean.TRUE.equals(input.authorityConfirmed()) || organizer.get("contact_email")==null || organizer.get("verification_reference")==null)) throw bad("Confirm organizer authority and reachable contact before verification.");
        if(input.decision()!=Verification.IN_REVIEW) jdbc.update("INSERT INTO events_organizer_review(id,organizer_id,target_version,moderator_ref,decision,notes) VALUES (?,?,?,?,?,?)",UUID.randomUUID(),id,organizer.get("version"),access.ref(actor),input.decision().name(),notes);
        jdbc.update("UPDATE events_organizer SET verification=?,version=version+1,updated_at=clock_timestamp() WHERE id=?",input.decision().name(),id);
        audit(actor,id,"ORGANIZER_"+input.decision().name());
    }
    @Transactional(readOnly=true)
    public Map<String,Object> publicDetail(UUID id) {
        var rows=jdbc.queryForList("SELECT id,name,description,website,verification FROM events_organizer WHERE id=? AND verification='VERIFIED' AND EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=?)",id,id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Organizer unavailable.");return rows.getFirst();
    }
    public Map<String,Object> lock(UUID id) {
        var rows=jdbc.queryForList("SELECT * FROM events_organizer WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Organizer not found.");return rows.getFirst();
    }
    private Map<String,Object> row(UUID id) { return jdbc.queryForMap("SELECT * FROM events_organizer WHERE id=?",id); }
    private void audit(VerifiedToken actor,UUID id,String action) { jdbc.update("INSERT INTO events_audit(id,organizer_id,actor_ref,action) VALUES (?,?,?,?)",UUID.randomUUID(),id,access.ref(actor),action); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT,message); }
}
