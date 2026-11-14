package com.soberity.community;

import com.soberity.events.application.EventAccess;
import com.soberity.events.application.EventCatalog;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class Circles {
    public enum Category { NIGHTLIFE, FITNESS, COFFEE, WELLBEING, OUTDOORS, ART, GAMES }
    public record Input(String name,String slug,String description,Category category,UUID coverId,String guidelines,
                        Boolean active,Integer expectedVersion,List<UUID> eventIds) { }
    private final JdbcTemplate jdbc;
    private final EventAccess access;
    private final EventCatalog events;
    public Circles(JdbcTemplate jdbc,EventAccess access,EventCatalog events) { this.jdbc=jdbc;this.access=access;this.events=events; }
    private static final String FIELDS="c.id,c.name,c.slug,c.description,c.category,c.cover_id,c.guidelines,c.active,c.version,c.created_at,c.updated_at,"+
        "(SELECT count(*) FROM community_circle_member m WHERE m.circle_id=c.id) AS member_count,"+
        "(SELECT alt_text FROM events_media WHERE id=c.cover_id) AS cover_alt";
    private static ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"Circle unavailable."); }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private static String text(String value,int max) { if(value==null || value.isBlank() || value.trim().length()>max)throw bad("Invalid circle text.");return value.trim(); }
    public Map<String,Object> list(String q,Category category,int page,int size,VerifiedToken actor,boolean mine,boolean admin) {
        if(page<0||page>100000||size<1||size>100)throw bad("Invalid pagination.");
        String ref="";
        if(admin)access.admin(actor);
        if(actor!=null){access.verified(actor);ref=access.ref(actor);}
        var args=new ArrayList<Object>();args.add(ref);
        String where=" WHERE "+(admin||mine?"true":"c.active");
        if(mine){where+=" AND EXISTS(SELECT 1 FROM community_circle_member m WHERE m.circle_id=c.id AND m.user_ref=?)";args.add(ref);}
        if(q!=null&&!q.isBlank()){if(q.length()>120)throw bad("Search too long.");where+=" AND lower(c.name) LIKE ? ESCAPE '!'";args.add("%"+q.trim().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");}
        if(category!=null){where+=" AND c.category=?";args.add(category.name());}
        String projection="SELECT "+FIELDS+",EXISTS(SELECT 1 FROM community_circle_member m WHERE m.circle_id=c.id AND m.user_ref=?) AS joined FROM community_circle c";
        var countArgs=new ArrayList<>(args);countArgs.removeFirst();
        long total=jdbc.queryForObject("SELECT count(*) FROM community_circle c"+where,Long.class,countArgs.toArray());
        args.add(size);args.add((long)page*size);
        return Map.of("items",jdbc.queryForList(projection+where+" ORDER BY lower(c.name),c.id LIMIT ? OFFSET ?",args.toArray()),"total",total,"page",page,"size",size);
    }
    public Map<String,Object> detail(UUID id,VerifiedToken actor,boolean admin) {
        if(admin)access.admin(actor);
        var rows=jdbc.queryForList("SELECT "+FIELDS+" FROM community_circle c WHERE c.id=?"+(admin?"":" AND c.active"),id);
        if(rows.isEmpty())throw missing();
        var result=new LinkedHashMap<>(rows.getFirst());
        if(actor!=null)access.verified(actor);
        result.put("joined",actor!=null && Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM community_circle_member WHERE circle_id=? AND user_ref=?)",Boolean.class,id,access.ref(actor))));
        if(admin)result.put("event_ids",jdbc.queryForList("SELECT event_id FROM community_circle_event WHERE circle_id=? ORDER BY event_id",UUID.class,id));
        return result;
    }
    public Map<String,Object> membership(VerifiedToken actor,UUID id) {
        access.verified(actor);
        var rows=jdbc.queryForList("SELECT c.active,EXISTS(SELECT 1 FROM community_circle_member m WHERE m.circle_id=c.id AND m.user_ref=?) AS joined,"+
            "(SELECT count(*) FROM community_circle_member m WHERE m.circle_id=c.id) AS member_count FROM community_circle c WHERE c.id=?",access.ref(actor),id);
        if(rows.isEmpty())throw missing();
        var row=rows.getFirst();
        if(!Boolean.TRUE.equals(row.get("active"))&&!Boolean.TRUE.equals(row.get("joined")))throw missing();
        return row;
    }
    public void join(VerifiedToken actor,UUID id) {
        access.verified(actor);
        var rows=jdbc.queryForList("SELECT active FROM community_circle WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty()||!Boolean.TRUE.equals(rows.getFirst().get("active")))throw missing();
        jdbc.update("INSERT INTO community_circle_member(circle_id,user_ref) VALUES (?,?) ON CONFLICT DO NOTHING",id,access.ref(actor));
    }
    public void leave(VerifiedToken actor,UUID id) {
        access.verified(actor);
        jdbc.update("DELETE FROM community_circle_member WHERE circle_id=? AND user_ref=?",id,access.ref(actor));
    }
    public UUID save(VerifiedToken actor,UUID id,Input input) {
        access.admin(actor);
        String name=text(input.name(),120),slug=text(input.slug(),100),description=text(input.description(),4000),guidelines=text(input.guidelines(),6000);
        if(!slug.matches("[a-z0-9]+(-[a-z0-9]+)*")||input.category()==null||input.active()==null)throw bad("Invalid circle fields.");
        if(input.eventIds()==null||input.eventIds().size()>200||input.eventIds().contains(null))throw bad("At most 200 event references required.");
        var eventIds=new LinkedHashSet<>(input.eventIds());
        for(UUID eventId:eventIds)if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM sober_event WHERE id=? AND status<>'DELETED')",Boolean.class,eventId)))throw bad("Unknown event reference.");
        if(input.coverId()!=null&&!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_media WHERE id=? AND organizer_id IS NULL)",Boolean.class,input.coverId())))throw bad("Unknown cover.");
        boolean create=id==null;int version=1;
        if(create)id=UUID.randomUUID();
        else {
            var rows=jdbc.queryForList("SELECT version FROM community_circle WHERE id=? FOR UPDATE",id);
            if(rows.isEmpty())throw missing();
            if(!Objects.equals(rows.getFirst().get("version"),input.expectedVersion()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Circle changed. Reload before editing.");
            version=((Number)rows.getFirst().get("version")).intValue()+1;
        }
        try {
            if(create)jdbc.update("INSERT INTO community_circle(id,name,slug,description,category,cover_id,guidelines,active) VALUES (?,?,?,?,?,?,?,?)",id,name,slug,description,input.category().name(),input.coverId(),guidelines,input.active());
            else jdbc.update("UPDATE community_circle SET name=?,slug=?,description=?,category=?,cover_id=?,guidelines=?,active=?,version=?,updated_at=clock_timestamp() WHERE id=?",name,slug,description,input.category().name(),input.coverId(),guidelines,input.active(),version,id);
        } catch(DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Slug already exists.");}
        jdbc.update("DELETE FROM community_circle_event WHERE circle_id=?",id);
        for(UUID eventId:eventIds)jdbc.update("INSERT INTO community_circle_event(circle_id,event_id) VALUES (?,?)",id,eventId);
        jdbc.update("INSERT INTO community_circle_audit(circle_id,actor_ref,version) VALUES (?,?,?)",id,access.ref(actor),version);
        return id;
    }
    public Map<String,Object> related(UUID id,int page,int size) {
        detail(id,null,false);
        var ids=jdbc.queryForList("SELECT event_id FROM community_circle_event WHERE circle_id=?",UUID.class,id);
        return events.related(ids,page,size);
    }
    public byte[] image(UUID id) {
        var rows=jdbc.queryForList("SELECT data FROM events_media WHERE id=? AND EXISTS(SELECT 1 FROM community_circle WHERE cover_id=? AND active)",id,id);
        if(rows.isEmpty())throw missing();return (byte[])rows.getFirst().get("data");
    }
}
