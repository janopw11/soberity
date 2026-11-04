package com.soberity.events.application;

import com.soberity.evidence.blog.BlogImages;
import com.soberity.identity.token.VerifiedToken;
import java.io.IOException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static com.soberity.events.application.EventValidation.*;

@Service
@Transactional
public class EventMedia {
    private final JdbcTemplate jdbc;
    private final EventAccess access;
    private final OrganizerService organizers;
    private final EventCatalog catalog;
    public EventMedia(JdbcTemplate jdbc,EventAccess access,OrganizerService organizers,EventCatalog catalog) { this.jdbc=jdbc;this.access=access;this.organizers=organizers;this.catalog=catalog; }
    public UUID upload(VerifiedToken actor,UUID organizerId,byte[] bytes,String alt) {
        access.member(actor,organizerId);organizers.lock(organizerId);
        try {
            var image=BlogImages.normalize(bytes,true);UUID id=UUID.randomUUID();
            jdbc.update("INSERT INTO events_media(id,organizer_id,alt_text,width,height,data,uploaded_by_ref) VALUES (?,?,?,?,?,?,?)",id,organizerId,text(alt,500),image.width(),image.height(),image.bytes(),access.ref(actor));
            jdbc.update("INSERT INTO events_audit(id,organizer_id,actor_ref,action) VALUES (?,?,?,'MEDIA_UPLOADED')",UUID.randomUUID(),organizerId,access.ref(actor));return id;
        } catch(IOException | IllegalArgumentException e) { throw bad("Valid JPEG/PNG up to 5 MB and 20 megapixels required."); }
    }
    public byte[] privateImage(VerifiedToken actor,UUID organizerId,UUID id) {
        access.member(actor,organizerId);return bytes(id,organizerId);
    }
    public byte[] moderationImage(VerifiedToken actor,UUID id) {access.moderator(actor);return bytes(id,null);}
    @Transactional(readOnly=true)
    public byte[] publicImage(UUID id) {
        if(!catalog.publicMedia(id))throw missing();return bytes(id,null);
    }
    private byte[] bytes(UUID id,UUID organizerId) {
        var rows=organizerId==null?jdbc.queryForList("SELECT data FROM events_media WHERE id=?",id):jdbc.queryForList("SELECT data FROM events_media WHERE id=? AND organizer_id=?",id,organizerId);
        if(rows.isEmpty())throw missing();return (byte[])rows.getFirst().get("data");
    }
    private ResponseStatusException missing() {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Image unavailable.");}
}
