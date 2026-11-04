package com.soberity.discovery;

import com.soberity.evidence.blog.BlogService;
import com.soberity.evidence.editorial.EditorialService;
import com.soberity.identity.token.VerifiedToken;
import java.sql.Timestamp;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class WeeklyArticleService {
    private final JdbcTemplate jdbc;
    private final EditorialService editorial;
    private final BlogService articles;
    public WeeklyArticleService(JdbcTemplate jdbc,EditorialService editorial,BlogService articles) {
        this.jdbc=jdbc;this.editorial=editorial;this.articles=articles;
    }
    public record Selection(UUID postId,String locale,Instant startsAt) { }
    @Transactional(readOnly=true)
    public Map<String,Object> current(String locale) {
        locale(locale);
        var rows=jdbc.queryForList("""
            SELECT f.post_id,f.starts_at,f.week_start FROM weekly_article_feature f
            WHERE f.locale=? AND f.cancelled_at IS NULL AND f.starts_at<=CURRENT_TIMESTAMP
            AND EXISTS(SELECT 1 FROM editorial_post_version v WHERE v.post_id=f.post_id AND v.status='PUBLISHED' AND v.kind='ARTICLE')
            ORDER BY f.starts_at DESC,f.created_at DESC,f.id LIMIT 1
            """,locale);
        var result=new LinkedHashMap<String,Object>();
        result.put("article",null);result.put("fallback",false);
        if(!rows.isEmpty()) {
            var row=rows.getFirst();
            try { result.put("article",articles.publishedDetail((UUID)row.get("post_id"))); }
            catch(ResponseStatusException e) { if(e.getStatusCode().value()==404) return result; throw e; }
            result.put("starts_at",row.get("starts_at"));
            result.put("fallback",!((java.sql.Date)row.get("week_start")).toLocalDate()
                .equals(LocalDate.now(ZoneOffset.UTC).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))));
        }
        return result;
    }
    @Transactional(readOnly=true)
    public Map<String,Object> list(VerifiedToken actor,int page) {
        access(actor);
        if(page<0 || page>100000) throw error(HttpStatus.BAD_REQUEST,"Invalid page.");
        return Map.of("items",jdbc.queryForList("""
            SELECT f.id,f.post_id,f.locale,f.starts_at,f.cancelled_at,
              coalesce(v.title,(SELECT title FROM editorial_post_version WHERE post_id=f.post_id ORDER BY version DESC LIMIT 1)) AS title,
              (v.id IS NOT NULL) AS available
            FROM weekly_article_feature f
            LEFT JOIN editorial_post_version v ON v.post_id=f.post_id AND v.status='PUBLISHED' AND v.kind='ARTICLE'
            WHERE f.cancelled_at IS NULL ORDER BY f.starts_at DESC,f.id LIMIT 50 OFFSET ?
            """,(long)page*50),"page",page,"size",50,
            "total",jdbc.queryForObject("SELECT count(*) FROM weekly_article_feature WHERE cancelled_at IS NULL",Long.class));
    }
    public UUID select(VerifiedToken actor,Selection input) {
        access(actor);
        if(input==null || input.postId()==null) throw error(HttpStatus.BAD_REQUEST,"Choose an article.");
        locale(input.locale());
        Instant starts=input.startsAt()==null?Instant.now():input.startsAt();
        if(input.startsAt()!=null && !starts.isAfter(Instant.now())) throw error(HttpStatus.BAD_REQUEST,"Choose a future start time or select now.");
        var week=starts.atZone(ZoneOffset.UTC).toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))","weekly-article:"+input.locale()+":"+week);
        var article=jdbc.queryForList("SELECT id FROM editorial_post_version WHERE post_id=? AND status='PUBLISHED' AND kind='ARTICLE' FOR SHARE",input.postId());
        if(article.isEmpty()) throw error(HttpStatus.BAD_REQUEST,"Article must be published first.");
        var old=jdbc.queryForList("SELECT id FROM weekly_article_feature WHERE locale=? AND week_start=? AND cancelled_at IS NULL FOR UPDATE",input.locale(),java.sql.Date.valueOf(week));
        for(var row:old) {
            UUID oldId=(UUID)row.get("id");
            jdbc.update("UPDATE weekly_article_feature SET cancelled_at=clock_timestamp() WHERE id=?",oldId);
            audit(oldId,actor.uid(),"REPLACED");
        }
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO weekly_article_feature(id,post_id,locale,starts_at,week_start,selected_by) VALUES (?,?,?,?,?,?)",id,input.postId(),input.locale(),Timestamp.from(starts),java.sql.Date.valueOf(week),actor.uid());
        audit(id,actor.uid(),"SELECTED");return id;
    }
    public void cancel(VerifiedToken actor,UUID id) {
        access(actor);
        if(jdbc.update("UPDATE weekly_article_feature SET cancelled_at=clock_timestamp() WHERE id=? AND cancelled_at IS NULL",id)!=1)
            throw error(HttpStatus.NOT_FOUND,"Active selection not found.");
        audit(id,actor.uid(),"CANCELLED");
    }
    private void access(VerifiedToken actor) {
        var roles=editorial.roles(actor);
        if(!roles.contains("AUTHOR") && !roles.contains("REVIEWER")) throw error(HttpStatus.FORBIDDEN,"Editorial role required.");
    }
    private void audit(UUID id,String uid,String action) { jdbc.update("INSERT INTO weekly_article_audit(id,feature_id,actor_uid,action) VALUES (?,?,?,?)",UUID.randomUUID(),id,uid,action); }
    private void locale(String value) { if(!"en".equals(value) && !"pl".equals(value)) throw error(HttpStatus.BAD_REQUEST,"Unsupported locale."); }
    private ResponseStatusException error(HttpStatus status,String detail) { return new ResponseStatusException(status,detail); }
}
