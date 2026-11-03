package com.soberity.evidence.blog;

import com.soberity.evidence.domain.EvidencePolicy;
import com.soberity.evidence.editorial.EditorialService;
import com.soberity.identity.token.VerifiedToken;
import java.io.IOException;
import java.text.Normalizer;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional
public class BlogService {
    private final JdbcTemplate jdbc;
    private final EditorialService access;
    private final JsonMapper json;
    public BlogService(JdbcTemplate jdbc,EditorialService access,JsonMapper json) {this.jdbc=jdbc;this.access=access;this.json=json;}
    public record Evidence(String title,String url) { }
    public record Draft(Integer expectedVersion,String kind,String title,JsonNode document,List<Evidence> evidence,String categoryCode,UUID coverId,String action) { }
    public record Decision(int version,String decision,String notes) { }
    public record Page(List<Map<String,Object>> items,int page,int size,long total) { }
    private static final String PROJECTION="SELECT p.id,p.author_uid,p.created_at,v.id AS revision_id,v.version,v.kind,v.title,v.document,v.evidence,v.category_code,v.cover_id,m.alt_text AS cover_alt,v.status,v.reviewed_by,v.review_notes,v.created_at AS updated_at,v.published_at FROM editorial_post p JOIN editorial_post_version v ON v.post_id=p.id LEFT JOIN editorial_media m ON m.id=v.cover_id ";

    private void role(VerifiedToken actor,String required) {
        if(!access.roles(actor).contains(required))throw error(HttpStatus.FORBIDDEN,"Editorial role required.");
    }
    private void reader(VerifiedToken actor) {
        if(access.roles(actor).isEmpty())throw error(HttpStatus.FORBIDDEN,"Editorial access required.");
    }
    public List<Map<String,Object>> categories(VerifiedToken actor) {
        reader(actor);return jdbc.queryForList("SELECT code,label_en,label_pl FROM science_category ORDER BY label_en");
    }
    public Map<String,Object> category(VerifiedToken actor,String name) {
        role(actor,"AUTHOR");name=text(name,100);
        String slug=Normalizer.normalize(name,Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("^-|-$","");
        if(slug.isEmpty()||!Character.isLetter(slug.charAt(0)))slug="category";
        slug=slug.substring(0,Math.min(slug.length(),28))+"-"+UUID.randomUUID().toString().substring(0,8);
        jdbc.update("INSERT INTO science_category(code,label_en,label_pl) VALUES (?,?,?)",slug,name,name);
        audit(actor,UUID.randomUUID(),"CATEGORY_CREATED",name,"CATEGORY");
        return Map.of("code",slug,"label_en",name,"label_pl",name);
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Page list(VerifiedToken actor,String kind,String status,int page) {
        reader(actor);return listing(kind,status,page,false);
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Page published(String kind,int page) {return listing(kind,"PUBLISHED",page,true);}
    private Page listing(String kind,String status,int page,boolean published) {
        if(page<0||page>1000000)throw error(HttpStatus.BAD_REQUEST,"Invalid page");
        if(kind!=null&&!Set.of("ARTICLE","EDITORIAL").contains(kind))throw error(HttpStatus.BAD_REQUEST,"Invalid kind");
        if(status!=null&&!Set.of("DRAFT","IN_REVIEW","PUBLISHED","ARCHIVED").contains(status))throw error(HttpStatus.BAD_REQUEST,"Invalid status");
        String sql=PROJECTION+"WHERE "+(published?"v.status='PUBLISHED'":"v.version=(SELECT max(v2.version) FROM editorial_post_version v2 WHERE v2.post_id=p.id)");
        List<Object> args=new ArrayList<>();
        if(kind!=null){sql+=" AND v.kind=?";args.add(kind);}
        if(status!=null&&!published){sql+=" AND v.status=?";args.add(status);}
        long total=jdbc.queryForObject("SELECT count(*) FROM ("+sql+") q",Long.class,args.toArray());
        args.add(30);args.add((long)page*30);
        var rows=jdbc.queryForList(sql+" ORDER BY v.created_at DESC,p.id LIMIT ? OFFSET ?",args.toArray());
        rows.forEach(this::decode);
        if(published)rows.forEach(this::publicFields);
        return new Page(rows,page,30,total);
    }
    public Map<String,Object> detail(VerifiedToken actor,UUID id) {
        reader(actor);var row=one(PROJECTION+"WHERE p.id=? ORDER BY v.version DESC LIMIT 1",id);decode(row);
        row.put("history",jdbc.queryForList("SELECT version,status,created_at FROM editorial_post_version WHERE post_id=? ORDER BY version DESC",id));
        row.put("audit",jdbc.queryForList("SELECT action,reason,created_at FROM editorial_audit WHERE material_type='POST' AND material_id IN (SELECT id FROM editorial_post_version WHERE post_id=?) ORDER BY created_at,id",id));
        return row;
    }
    public Map<String,Object> publishedDetail(UUID id) {
        var row=one(PROJECTION+"WHERE p.id=? AND v.status='PUBLISHED'",id);decode(row);publicFields(row);return row;
    }
    public UUID save(VerifiedToken actor,UUID id,Draft draft) {
        role(actor,"AUTHOR");
        String title=text(draft.title(),500);
        if(!Set.of("ARTICLE","EDITORIAL").contains(draft.kind()))throw error(HttpStatus.BAD_REQUEST,"Invalid material type");
        if(!Set.of("DRAFT","PUBLISH","REVIEW").contains(draft.action()))throw error(HttpStatus.BAD_REQUEST,"Invalid action");
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM science_category WHERE code=?)",Boolean.class,draft.categoryCode())))throw error(HttpStatus.BAD_REQUEST,"Category required");
        var checked=BlogDocument.check(draft.document());
        if(checked.text().isBlank())throw error(HttpStatus.BAD_REQUEST,"Article text required");
        if(json.writeValueAsBytes(checked.document()).length>1000000)throw error(HttpStatus.BAD_REQUEST,"Document too large");
        List<Evidence> evidence=new ArrayList<>();
        if(draft.evidence()!=null) {
            if(draft.evidence().size()>50)throw error(HttpStatus.BAD_REQUEST,"Too many sources");
            for(Evidence e:draft.evidence())evidence.add(new Evidence(text(e.title(),1000),EvidencePolicy.httpsUrl(e.url())));
        }
        if(!draft.action().equals("DRAFT")&&evidence.isEmpty())throw error(HttpStatus.BAD_REQUEST,"Sources required before publication or review");
        Set<UUID> images=new HashSet<>(checked.images());
        for(UUID media:images)checkMedia(actor,media,"INLINE");
        if(draft.coverId()!=null) {checkMedia(actor,draft.coverId(),"COVER");images.add(draft.coverId());}
        int version=1;
        if(id==null) {
            id=UUID.randomUUID();jdbc.update("INSERT INTO editorial_post(id,author_uid) VALUES (?,?)",id,actor.uid());
        } else {
            var post=lock(id);own(actor,post);
            int current=jdbc.queryForObject("SELECT max(version) FROM editorial_post_version WHERE post_id=?",Integer.class,id);
            if(draft.expectedVersion()==null||draft.expectedVersion()!=current)throw error(HttpStatus.CONFLICT,"A newer version exists");
            version=current+1;
        }
        UUID revision=UUID.randomUUID();
        jdbc.update("INSERT INTO editorial_post_version(id,post_id,version,kind,title,document,evidence,category_code,cover_id,status) VALUES (?,?,?,?,?,?::jsonb,?::jsonb,?,?,'DRAFT')",revision,id,version,draft.kind(),title,json.writeValueAsString(checked.document()),json.writeValueAsString(evidence),draft.categoryCode(),draft.coverId());
        for(UUID media:images)jdbc.update("INSERT INTO editorial_post_media VALUES (?,?)",revision,media);
        audit(actor,revision,"SAVED","Saved version "+version,"POST");
        // Older unpublished versions leave the queue; published predecessor stays live until replacement.
        for(UUID old:jdbc.queryForList("SELECT id FROM editorial_post_version WHERE post_id=? AND id<>? AND status IN ('DRAFT','IN_REVIEW')",UUID.class,id,revision)) {
            jdbc.update("UPDATE editorial_post_version SET status='ARCHIVED' WHERE id=?",old);
            audit(actor,old,"SUPERSEDED","A new draft version was saved","POST");
        }
        if(draft.action().equals("PUBLISH"))publish(actor,id,revision,false,null);
        if(draft.action().equals("REVIEW")) {
            jdbc.update("UPDATE editorial_post_version SET status='IN_REVIEW' WHERE id=?",revision);
            audit(actor,revision,"SUBMITTED","Sent for independent review","POST");
        }
        return id;
    }
    public void decide(VerifiedToken actor,UUID id,Decision decision) {
        role(actor,"REVIEWER");var post=lock(id);
        if(actor.uid().equals(post.get("author_uid")))throw error(HttpStatus.FORBIDDEN,"Independent reviewer required");
        var revision=one("SELECT * FROM editorial_post_version WHERE post_id=? ORDER BY version DESC LIMIT 1",id);
        if(!"IN_REVIEW".equals(revision.get("status"))||!Objects.equals(revision.get("version"),decision.version()))throw error(HttpStatus.CONFLICT,"Review version changed");
        String notes=text(decision.notes(),20000);UUID rid=(UUID)revision.get("id");
        if("PUBLISH".equals(decision.decision()))publish(actor,id,rid,true,notes);
        else if("CHANGES_REQUESTED".equals(decision.decision())) {
            jdbc.update("UPDATE editorial_post_version SET status='ARCHIVED',reviewed_by=?,review_notes=? WHERE id=?",actor.uid(),notes,rid);
            audit(actor,rid,"CHANGES_REQUESTED",notes,"POST");
        } else throw error(HttpStatus.BAD_REQUEST,"Invalid review decision");
    }
    public void archive(VerifiedToken actor,UUID id,int expectedVersion) {
        reader(actor);var post=lock(id);
        if(!actor.uid().equals(post.get("author_uid")))role(actor,"REVIEWER");
        int current=jdbc.queryForObject("SELECT max(version) FROM editorial_post_version WHERE post_id=?",Integer.class,id);
        if(current!=expectedVersion)throw error(HttpStatus.CONFLICT,"Publication changed");
        var active=jdbc.queryForList("SELECT id FROM editorial_post_version WHERE post_id=? AND status<>'ARCHIVED'",UUID.class,id);
        if(active.isEmpty())throw error(HttpStatus.CONFLICT,"Already archived");
        for(UUID revision:active) {jdbc.update("UPDATE editorial_post_version SET status='ARCHIVED' WHERE id=?",revision);audit(actor,revision,"ARCHIVED","Publication withdrawn","POST");}
    }
    private void publish(VerifiedToken actor,UUID id,UUID revision,boolean reviewed,String notes) {
        for(UUID old:jdbc.queryForList("SELECT id FROM editorial_post_version WHERE post_id=? AND status='PUBLISHED'",UUID.class,id)) {
            jdbc.update("UPDATE editorial_post_version SET status='ARCHIVED' WHERE id=?",old);
            audit(actor,old,"SUPERSEDED","Replaced by a published version","POST");
        }
        jdbc.update("UPDATE editorial_post_version SET status='PUBLISHED',published_at=clock_timestamp(),reviewed_by=?,review_notes=? WHERE id=?",reviewed?actor.uid():null,notes,revision);
        audit(actor,revision,reviewed?"REVIEWED_PUBLISHED":"AUTHOR_PUBLISHED",reviewed?notes:"Published directly by the author","POST");
    }
    public Map<String,Object> upload(VerifiedToken actor,byte[] data,String purpose,String alt) throws IOException {
        role(actor,"AUTHOR");alt=text(alt,500);
        if(!Set.of("COVER","INLINE").contains(purpose))throw error(HttpStatus.BAD_REQUEST,"Invalid image purpose");
        var image=BlogImages.normalize(data,purpose.equals("COVER"));UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO editorial_media(id,owner_uid,purpose,alt_text,width,height,data) VALUES (?,?,?,?,?,?,?)",id,actor.uid(),purpose,alt,image.width(),image.height(),image.bytes());
        audit(actor,id,"UPLOADED","Image uploaded","MEDIA");
        return Map.of("id",id,"url","/api/v1/science/media/"+id,"width",image.width(),"height",image.height(),"alt",alt);
    }
    public byte[] media(VerifiedToken actor,UUID id,boolean publicRead) {
        if(publicRead) {
            if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM editorial_post_media m JOIN editorial_post_version v ON v.id=m.version_id WHERE m.media_id=? AND v.status='PUBLISHED')",Boolean.class,id)))throw error(HttpStatus.NOT_FOUND,"Image not found");
        } else reader(actor);
        return jdbc.query("SELECT data FROM editorial_media WHERE id=?",rs->{if(!rs.next())throw error(HttpStatus.NOT_FOUND,"Image not found");return rs.getBytes(1);},id);
    }
    private void checkMedia(VerifiedToken actor,UUID id,String purpose) {
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM editorial_media WHERE id=? AND owner_uid=? AND purpose=?)",Boolean.class,id,actor.uid(),purpose)))throw error(HttpStatus.BAD_REQUEST,"Upload an owned image of the correct type");
    }
    private Map<String,Object> lock(UUID id) {return one("SELECT * FROM editorial_post WHERE id=? FOR UPDATE",id);}
    private Map<String,Object> one(String sql,UUID id) {
        var rows=jdbc.queryForList(sql,id);if(rows.isEmpty())throw error(HttpStatus.NOT_FOUND,"Article not found");return new LinkedHashMap<>(rows.getFirst());
    }
    private void decode(Map<String,Object> row) {
        row.put("document",json.readTree(row.get("document").toString()));row.put("evidence",json.readTree(row.get("evidence").toString()));
        row.put("publication_route",row.get("reviewed_by")==null?"AUTHOR":"REVIEWED");
    }
    private void publicFields(Map<String,Object> row) {row.remove("author_uid");row.remove("reviewed_by");row.remove("review_notes");}
    private void own(VerifiedToken actor,Map<String,Object> post) {if(!actor.uid().equals(post.get("author_uid")))throw error(HttpStatus.FORBIDDEN,"Only the author can edit");}
    private String text(String value,int max) {if(value==null||value.isBlank()||value.length()>max)throw error(HttpStatus.BAD_REQUEST,"Missing or oversized field");return value.strip();}
    private void audit(VerifiedToken actor,UUID id,String action,String reason,String type) {jdbc.update("INSERT INTO editorial_audit(id,actor_uid,material_type,material_id,action,reason) VALUES (?,?,?,?,?,?)",UUID.randomUUID(),actor.uid(),type,id,action,reason);}
    private ResponseStatusException error(HttpStatus status,String detail) {return new ResponseStatusException(status,detail);}
}
