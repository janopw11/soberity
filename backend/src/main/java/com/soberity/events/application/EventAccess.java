package com.soberity.events.application;

import com.soberity.identity.token.VerifiedToken;
import com.soberity.identity.security.ApplicationRoles;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EventAccess {
    private final JdbcTemplate jdbc;
    private final ApplicationRoles applicationRoles;
    public EventAccess(JdbcTemplate jdbc, ApplicationRoles applicationRoles) {
        this.jdbc=jdbc;
        this.applicationRoles=applicationRoles;
    }
    public void verified(VerifiedToken actor) {
        if(actor==null || !actor.emailVerified()) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Verified identity required.");
        // Serialize private actions against the existing account-erasure boundary.
        jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",actor.uid());
        if(Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM deleted_account WHERE firebase_uid=?)",Boolean.class,actor.uid())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Account unavailable.");
    }
    public void admin(VerifiedToken actor) {
        verified(actor);
        if(applicationRoles.isSuperAdmin(actor)) return;
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_admin WHERE firebase_uid=? AND active)",Boolean.class,actor.uid())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Events administrator required.");
    }
    public void member(VerifiedToken actor,UUID organizerId) {
        verified(actor);
        if(applicationRoles.isSuperAdmin(actor)) return;
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=? AND firebase_uid=?)",Boolean.class,organizerId,actor.uid())))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Organizer not found.");
    }
    public boolean isModerator(VerifiedToken actor) {
        verified(actor);
        if(applicationRoles.isSuperAdmin(actor)) return true;
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_moderator WHERE firebase_uid=? AND active)",Boolean.class,actor.uid()));
    }
    public void moderator(VerifiedToken actor) {
        if(!isModerator(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Events moderator required.");
    }
    public void independent(VerifiedToken actor,UUID organizerId,String authorRef) {
        moderator(actor);
        if(ref(actor).equals(authorRef) || Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=? AND firebase_uid=?)",Boolean.class,organizerId,actor.uid())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Independent moderator required.");
    }
    public String ref(VerifiedToken actor) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(actor.uid().getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException e) { throw new IllegalStateException("SHA-256 unavailable",e); }
    }
}
