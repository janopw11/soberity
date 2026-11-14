package com.soberity.events.application;

import com.soberity.identity.token.VerifiedToken;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Going / Not Going RSVP per account. Aggregate counts are public, identities remain private: no booking,
 * ticket or organizer notification. Only the hashed account reference is stored.
 */
@Service
@Transactional
public class EventInterests {
    private final JdbcTemplate jdbc;
    private final EventAccess access;

    public EventInterests(JdbcTemplate jdbc, EventAccess access) {
        this.jdbc = jdbc;
        this.access = access;
    }

    /** Idempotent: repeating the declaration keeps the original declaration time. */
    public void declare(VerifiedToken actor, UUID eventId) {
        access.verified(actor);
        // Use the same event-row lock as admin publication/deletion. Recheck eligibility after locking.
        jdbc.queryForList("SELECT id FROM sober_event WHERE id=? FOR UPDATE", eventId);
        Boolean upcoming = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 " + EventCatalog.JOIN + " WHERE e.id=? AND " + EventCatalog.ELIGIBLE
                        + " AND coalesce(r.ends_at,r.starts_at)>clock_timestamp())",
                Boolean.class,
                eventId);
        if (!Boolean.TRUE.equals(upcoming)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event is not available.");
        }
        jdbc.update("INSERT INTO events_interest(event_id,user_ref) VALUES (?,?) ON CONFLICT DO NOTHING",
                eventId, access.ref(actor));
    }

    /** Idempotent: withdrawing a declaration that does not exist changes nothing. */
    public void withdraw(VerifiedToken actor, UUID eventId) {
        access.verified(actor);
        jdbc.update("DELETE FROM events_interest WHERE event_id=? AND user_ref=?", eventId, access.ref(actor));
    }

    public boolean declared(VerifiedToken actor, UUID eventId) {
        access.verified(actor);
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM events_interest WHERE event_id=? AND user_ref=?)",
                Boolean.class,
                eventId,
                access.ref(actor)));
    }

    /** One SQL snapshot for the count, availability and caller's state. No participant identities. */
    public Map<String, Object> state(VerifiedToken actor, UUID eventId) {
        access.verified(actor);
        return summary(eventId, access.ref(actor));
    }

    public Map<String, Object> summary(UUID eventId) {
        var result = new java.util.LinkedHashMap<>(summary(eventId, ""));
        result.remove("declared");
        return result;
    }

    private Map<String, Object> summary(UUID eventId, String userRef) {
        var rows = jdbc.queryForList("""
                SELECT (SELECT count(*) FROM events_interest i WHERE i.event_id=e.id) AS participant_count,
                  EXISTS(SELECT 1 FROM events_interest i WHERE i.event_id=e.id AND i.user_ref=?) AS declared,
                  coalesce(r.ends_at,r.starts_at)>clock_timestamp() AS can_join
                """ + EventCatalog.JOIN + " WHERE e.id=? AND " + EventCatalog.ELIGIBLE, userRef, eventId);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event is not available.");
        return rows.getFirst();
    }

    /** The caller's own upcoming or ongoing, still-eligible declarations, soonest first. */
    public Map<String, Object> mine(VerifiedToken actor, int page, int size) {
        access.verified(actor);
        if (page < 0 || page > 100000 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination.");
        }
        String ref = access.ref(actor);
        String where = " WHERE i.user_ref=? AND " + EventCatalog.ELIGIBLE + " AND coalesce(r.ends_at,r.starts_at)>clock_timestamp()";
        String from = EventCatalog.JOIN + " JOIN events_interest i ON i.event_id=e.id";
        List<Map<String, Object>> items = jdbc.queryForList(
                "SELECT " + EventCatalog.FIELDS + from + where + " ORDER BY r.starts_at,e.id LIMIT ? OFFSET ?",
                ref, size, (long) page * size);
        Long total = jdbc.queryForObject("SELECT count(*) " + from + where, Long.class, ref);
        return Map.of("items", items, "page", page, "size", size, "total", total == null ? 0L : total);
    }
}
