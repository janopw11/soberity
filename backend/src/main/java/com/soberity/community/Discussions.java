package com.soberity.community;

import com.soberity.events.application.EventAccess;
import com.soberity.evidence.editorial.EditorialService;
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
public class Discussions {
    private final JdbcTemplate jdbc;
    private final EventAccess identity;
    private final EditorialService editorial;
    public Discussions(JdbcTemplate jdbc,EventAccess identity,EditorialService editorial){this.jdbc=jdbc;this.identity=identity;this.editorial=editorial;}
    public record Topic(String title,String articleType,UUID articleId,String status,Integer expectedVersion) { }
    public record Comment(String content,String kind,UUID parentId) { }
    public record Moderation(String status) { }
    private static ResponseStatusException error(HttpStatus status,String message){return new ResponseStatusException(status,message);}
    private static ResponseStatusException missing(){return error(HttpStatus.NOT_FOUND,"Discussion unavailable.");}
    private static String text(String value,int limit){
        if(value==null || value.isBlank() || value.strip().length()>limit || value.codePoints().anyMatch(c -> Character.isISOControl(c)&&c!='\n'&&c!='\t'))throw error(HttpStatus.BAD_REQUEST,"Invalid text.");
        return value.strip();
    }
    private void page(int page,int size){if(page<0||page>100000||size<1||size>100)throw error(HttpStatus.BAD_REQUEST,"Invalid pagination.");}
    public boolean moderator(VerifiedToken actor){if(actor==null)return false;identity.verified(actor);return editorial.roles(actor).contains("REVIEWER");}
    public void admin(VerifiedToken actor){if(!moderator(actor))throw error(HttpStatus.FORBIDDEN,"Editorial reviewer required.");}
    // Resolve the current published content; no article body, sources or author identities are copied.
    private static final String CONTENT="""
      SELECT 'ARTICLE' AS article_type,a.article_id AS article_id,a.id AS revision_id,a.title AS article_title,a.category_code
      FROM science_article a JOIN claim_revision r ON r.id=a.revision_id WHERE a.status='PUBLISHED' AND r.status='PUBLISHED'
      UNION ALL
      SELECT 'POST',p.id,NULL::uuid,v.title,v.category_code FROM editorial_post p JOIN editorial_post_version v ON v.post_id=p.id WHERE v.status='PUBLISHED'
      """;
    private static final String ADMIN_CONTENT="SELECT 'ARTICLE' AS article_type,a.article_id,a.id AS revision_id,a.title AS article_title,a.category_code FROM science_article a UNION ALL SELECT 'POST',p.post_id,NULL::uuid,p.title,p.category_code FROM (SELECT DISTINCT ON(post_id) * FROM editorial_post_version ORDER BY post_id,version DESC) p";
    private static String from(boolean admin){return " FROM science_discussion d JOIN ("+(admin?ADMIN_CONTENT:CONTENT)+") a ON (a.article_type='POST' AND a.article_id=d.post_id) OR (a.article_type='ARTICLE' AND a.revision_id=d.article_revision_id)";}
    private static final String FIELDS="d.id,d.title,d.status,d.version,d.created_at,d.updated_at,a.article_type,a.article_id,a.article_title,a.category_code,"+
      "(SELECT count(*) FROM discussion_comment c WHERE c.discussion_id=d.id AND c.status='VISIBLE') AS comment_count,"+
      "coalesce((SELECT max(c.created_at) FROM discussion_comment c WHERE c.discussion_id=d.id AND c.status='VISIBLE'),d.created_at) AS latest_activity";
    public Map<String,Object> list(VerifiedToken actor,String q,String category,String sort,String articleType,UUID articleId,int page,int size,boolean mine,boolean admin){
        page(page,size);if(admin)admin(actor);if(mine)identity.verified(actor);
        if(!Set.of("RECENT","POPULAR").contains(sort))throw error(HttpStatus.BAD_REQUEST,"Invalid sort.");
        var args=new ArrayList<Object>();String where=admin?" WHERE true":" WHERE d.status<>'HIDDEN'";
        if(q!=null&&!q.isBlank()){where+=" AND strpos(lower(d.title),lower(?))>0";args.add(text(q,200));}
        if(category!=null&&!category.isBlank()){if(!category.matches("[a-z][a-z0-9-]{0,39}"))throw error(HttpStatus.BAD_REQUEST,"Invalid category.");where+=" AND a.category_code=?";args.add(category);}
        if(articleType!=null){if(!Set.of("ARTICLE","POST").contains(articleType))throw error(HttpStatus.BAD_REQUEST,"Invalid article type.");where+=" AND a.article_type=?";args.add(articleType);}
        if(articleId!=null){where+=" AND a.article_id=?";args.add(articleId);}
        if(mine){where+=" AND EXISTS(SELECT 1 FROM discussion_comment c WHERE c.discussion_id=d.id AND c.author_ref=? AND c.status='VISIBLE')";args.add(identity.ref(actor));}
        long total=jdbc.queryForObject("SELECT count(*)"+from(admin)+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        return Map.of("items",jdbc.queryForList("SELECT "+FIELDS+from(admin)+where+" ORDER BY "+(sort.equals("POPULAR")?"comment_count DESC,":"")+"latest_activity DESC,d.id LIMIT ? OFFSET ?",args.toArray()),"total",total,"page",page,"size",size);
    }
    public Map<String,Object> detail(UUID id,VerifiedToken actor,boolean admin){
        if(admin)admin(actor);
        var rows=jdbc.queryForList("SELECT "+FIELDS+from(admin)+" WHERE d.id=?"+(admin?"":" AND d.status<>'HIDDEN'"),id);
        if(rows.isEmpty())throw missing();var row=new LinkedHashMap<>(rows.getFirst());row.put("can_moderate",moderator(actor));return row;
    }
    public UUID save(VerifiedToken actor,UUID id,Topic input){
        admin(actor);String title=text(input.title(),200);
        if(input.status()==null||!Set.of("OPEN","CLOSED","HIDDEN").contains(input.status())||input.articleType()==null||!Set.of("ARTICLE","POST").contains(input.articleType())||input.articleId()==null)throw error(HttpStatus.BAD_REQUEST,"Invalid discussion.");
        var article=id==null
            ? jdbc.queryForList("SELECT * FROM ("+CONTENT+") a WHERE article_type=? AND article_id=?",input.articleType(),input.articleId())
            : jdbc.queryForList("SELECT a.*"+from(true)+" WHERE d.id=? AND a.article_type=? AND a.article_id=?",id,input.articleType(),input.articleId());
        if(article.isEmpty())throw error(HttpStatus.BAD_REQUEST,"Published article required.");
        UUID revision=(UUID)article.getFirst().get("revision_id");UUID post=input.articleType().equals("POST")?input.articleId():null;
        boolean create=id==null;if(create)id=UUID.randomUUID();
        try{
            if(create)jdbc.update("INSERT INTO science_discussion(id,title,article_revision_id,post_id,status) VALUES (?,?,?,?,?)",id,title,revision,post,input.status());
            else {
                var existing=jdbc.queryForList("SELECT * FROM science_discussion WHERE id=? FOR UPDATE",id);if(existing.isEmpty())throw missing();var row=existing.getFirst();
                if(!Objects.equals(row.get("version"),input.expectedVersion()))throw error(HttpStatus.CONFLICT,"Discussion changed; reload.");
                if(!Objects.equals(row.get("article_revision_id"),revision)||!Objects.equals(row.get("post_id"),post))throw error(HttpStatus.BAD_REQUEST,"Article relationship cannot be changed.");
                jdbc.update("UPDATE science_discussion SET title=?,status=?,version=version+1,updated_at=clock_timestamp() WHERE id=?",title,input.status(),id);
            }
        }catch(DuplicateKeyException e){throw error(HttpStatus.CONFLICT,"An article discussion already exists.");}
        audit(actor,id,null,create?"CREATE":"UPDATE");return id;
    }
    public Map<String,Object> comments(UUID id,VerifiedToken actor,UUID parent,int page,int size,boolean admin){
        page(page,size);detail(id,actor,admin);String ref=actor==null?"":identity.ref(actor);
        String where=" WHERE c.discussion_id=? AND "+(parent==null?"c.parent_id IS NULL":"c.parent_id=?");var args=new ArrayList<Object>();args.add(id);if(parent!=null)args.add(parent);
        long total=jdbc.queryForObject("SELECT count(*) FROM discussion_comment c"+where,Long.class,args.toArray());
        var selectArgs=new ArrayList<Object>();selectArgs.add(ref);selectArgs.addAll(args);selectArgs.add(size);selectArgs.add((long)page*size);
        String content=admin?"c.content":"CASE WHEN c.status='VISIBLE' THEN c.content ELSE '' END";
        String fields="c.id,c.parent_id,c.kind,c.status,c.created_at,c.updated_at,"+content+" AS content,"+
          "CASE WHEN c.status='VISIBLE' THEN p.display_name ELSE NULL END AS author_name,"+
          "coalesce(c.author_ref=?,false) AS own,(SELECT count(*) FROM discussion_comment r WHERE r.parent_id=c.id) AS reply_count";
        return Map.of("items",jdbc.queryForList("SELECT "+fields+" FROM discussion_comment c LEFT JOIN user_profile p ON p.id=c.profile_id"+where+" ORDER BY c.created_at,c.id LIMIT ? OFFSET ?",selectArgs.toArray()),"total",total,"page",page,"size",size);
    }
    public UUID add(VerifiedToken actor,UUID id,Comment input){
        identity.verified(actor);String content=text(input.content(),4000);
        if(input.kind()==null||!Set.of("OPINION","EXPERIENCE").contains(input.kind()))throw error(HttpStatus.BAD_REQUEST,"Comment kind required.");
        jdbc.queryForList("SELECT id FROM science_discussion WHERE id=? FOR UPDATE",id);
        if(!detail(id,null,false).get("status").equals("OPEN"))throw error(HttpStatus.CONFLICT,"Discussion closed.");
        var profiles=jdbc.queryForList("SELECT id FROM user_profile WHERE firebase_uid=?",UUID.class,actor.uid());if(profiles.isEmpty())throw error(HttpStatus.CONFLICT,"Profile required.");
        if(input.parentId()!=null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM discussion_comment WHERE id=? AND discussion_id=? AND parent_id IS NULL AND status='VISIBLE')",Boolean.class,input.parentId(),id)))throw error(HttpStatus.BAD_REQUEST,"Reply requires a visible top-level comment.");
        if(jdbc.queryForObject("SELECT count(*) FROM discussion_comment WHERE author_ref=? AND created_at>clock_timestamp()-interval '1 minute'",Long.class,identity.ref(actor))>=20)throw error(HttpStatus.TOO_MANY_REQUESTS,"Please wait before commenting again.");
        UUID comment=UUID.randomUUID();jdbc.update("INSERT INTO discussion_comment(id,discussion_id,author_ref,profile_id,parent_id,content,kind) VALUES (?,?,?,?,?,?,?)",comment,id,identity.ref(actor),profiles.getFirst(),input.parentId(),content,input.kind());
        return comment;
    }
    public void delete(VerifiedToken actor,UUID id){
        identity.verified(actor);var rows=jdbc.queryForList("SELECT author_ref,status FROM discussion_comment WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty()||!Objects.equals(rows.getFirst().get("author_ref"),identity.ref(actor)))throw missing();
        jdbc.update("UPDATE discussion_comment SET content='',profile_id=NULL,status='DELETED',updated_at=clock_timestamp() WHERE id=?",id);
    }
    public void moderate(VerifiedToken actor,UUID id,Moderation input){
        admin(actor);if(input.status()==null||!Set.of("HIDDEN","VISIBLE","REMOVED").contains(input.status()))throw error(HttpStatus.BAD_REQUEST,"Invalid moderation state.");
        var rows=jdbc.queryForList("SELECT discussion_id,status FROM discussion_comment WHERE id=? FOR UPDATE",id);if(rows.isEmpty())throw missing();var row=rows.getFirst();
        if(Set.of("DELETED","REMOVED").contains(row.get("status")))throw error(HttpStatus.CONFLICT,"Removed comments cannot be restored.");
        jdbc.update("UPDATE discussion_comment SET status=?,content=CASE WHEN ?='REMOVED' THEN '' ELSE content END,profile_id=CASE WHEN ?='REMOVED' THEN NULL ELSE profile_id END,updated_at=clock_timestamp() WHERE id=?",input.status(),input.status(),input.status(),id);
        audit(actor,(UUID)row.get("discussion_id"),id,input.status());
    }
    private void audit(VerifiedToken actor,UUID discussion,UUID comment,String action){jdbc.update("INSERT INTO discussion_audit(discussion_id,comment_id,actor_ref,action) VALUES (?,?,?,?)",discussion,comment,identity.ref(actor),action);}
}
