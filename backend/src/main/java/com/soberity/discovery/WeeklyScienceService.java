package com.soberity.discovery;

import com.soberity.evidence.editorial.EditorialService;
import com.soberity.evidence.blog.BlogDocument;
import com.soberity.evidence.domain.EvidencePolicy;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.soberity.identity.token.VerifiedToken;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class WeeklyScienceService {
    private final JdbcTemplate jdbc;
    private final EditorialService editorial;
    private final JsonMapper json;
    public WeeklyScienceService(JdbcTemplate jdbc, EditorialService editorial, JsonMapper json) {
        this.jdbc=jdbc; this.editorial=editorial; this.json=json;
    }
    public record Draft(String slug,String locale,String title,String teaser,String openingQuestion,
        String takeaway,String established,String notEstablished,String population,String method,
        String researchKind,UUID revisionId,Instant publishAt,String publicationZone,Instant nextReviewAt) { }
    public record NewsSource(String title,String url) { }
    public record NewsDraft(String locale,String title,JsonNode document,List<NewsSource> sources,Instant publishAt,String publicationZone) { }
    public record Decision(String action,String notes) { }
    private static final String EVIDENCE = """
        (d.content_mode='NEWS' OR (r.status='PUBLISHED' AND sr.decision='APPROVED' AND c.locale=d.locale
        AND r.next_review_at>CURRENT_TIMESTAMP
        AND EXISTS(SELECT 1 FROM claim_source cs WHERE cs.revision_id=r.id)))
        """;
    private static final String FROM = """
         FROM discovery_issue d LEFT JOIN claim_revision r ON r.id=d.revision_id
         LEFT JOIN evidence_claim c ON c.id=r.claim_id
         LEFT JOIN scientific_review sr ON sr.revision_id=r.id
        """;
    private static final String VISIBLE = " d.status='PUBLISHED' AND d.publish_at<=CURRENT_TIMESTAMP AND d.next_review_at>CURRENT_TIMESTAMP AND " + EVIDENCE;
    private static final String PUBLIC = """
        SELECT d.id,d.slug,d.locale,d.title,d.teaser,d.opening_question,d.takeaway,d.content_mode,d.document,d.sources AS news_sources,
        d.established,d.not_established,d.population,d.method,d.research_kind,d.publish_at,
        d.publication_zone,d.published_at,d.reviewed_at,d.publication_route,d.next_review_at,d.revision_id,
        c.id AS claim_id,r.evidence_level,r.evidence_rationale,r.limitations,r.uncertainty,
        sr.reviewed_at AS evidence_reviewed_at
        """;

    @Transactional(readOnly=true)
    public Map<String,Object> current(String locale) {
        locale(locale);
        var items=jdbc.queryForList(PUBLIC+FROM+" WHERE "+VISIBLE+" AND d.locale=? ORDER BY d.publish_at DESC,d.id LIMIT 1",locale);
        var response=new LinkedHashMap<String,Object>();
        items.forEach(this::decode);
        response.put("issue",items.isEmpty()?null:items.getFirst());
        boolean fallback=!items.isEmpty() && !((Timestamp)items.getFirst().get("publish_at")).toInstant()
            .atZone(ZoneOffset.UTC).toLocalDate().with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            .equals(LocalDate.now(ZoneOffset.UTC).with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
        response.put("fallback",fallback);
        return response;
    }
    @Transactional(readOnly=true)
    public Map<String,Object> detail(String locale,String slug) {
        locale(locale);
        var items=jdbc.queryForList(PUBLIC+FROM+" WHERE "+VISIBLE+" AND d.locale=? AND d.slug=?",locale,slug);
        if(items.isEmpty()) throw error(HttpStatus.NOT_FOUND,"Science Drop unavailable.");
        var result=new LinkedHashMap<>(items.getFirst());
        decode(result);
        if (!"NEWS".equals(result.get("content_mode"))) result.put("sources",jdbc.queryForList("""
            SELECT s.title,s.url,s.authors,s.publication_year,s.study_type,s.doi,cs.relation
            FROM claim_source cs JOIN scientific_source s ON s.id=cs.source_id
            WHERE cs.revision_id=? ORDER BY s.id
            """,result.get("revision_id")));
        return result;
    }
    public UUID create(VerifiedToken actor,Draft d) {
        require(actor,"AUTHOR");
        if(d==null) throw error(HttpStatus.BAD_REQUEST,"Missing draft.");
        locale(d.locale());
        if(d.slug()==null || d.slug().length()>120 || !d.slug().matches("[a-z0-9]+(-[a-z0-9]+)*")) throw error(HttpStatus.BAD_REQUEST,"Invalid slug.");
        text(d.title(),500); text(d.teaser(),2000); text(d.openingQuestion(),2000); text(d.takeaway(),5000);
        text(d.established(),20000);text(d.notEstablished(),20000);text(d.population(),5000);text(d.method(),5000);
        if(!Set.of("NEW","REVISITED").contains(Objects.requireNonNullElse(d.researchKind(),""))) throw error(HttpStatus.BAD_REQUEST,"Invalid research kind.");
        if(d.publishAt()==null || !d.publishAt().isAfter(Instant.now()) || d.nextReviewAt()==null || !d.nextReviewAt().isAfter(d.publishAt()))
            throw error(HttpStatus.BAD_REQUEST,"Future publication and subsequent review date required.");
        try { ZoneId.of(Objects.requireNonNullElse(d.publicationZone(),"")); }
        catch(DateTimeException e) { throw error(HttpStatus.BAD_REQUEST,"Invalid timezone."); }
        if(d.revisionId()==null || !Boolean.TRUE.equals(jdbc.queryForObject("""
            SELECT EXISTS(SELECT 1 FROM claim_revision r JOIN evidence_claim c ON c.id=r.claim_id
              JOIN scientific_review sr ON sr.revision_id=r.id
              WHERE r.id=? AND r.status='PUBLISHED' AND c.locale=? AND sr.decision='APPROVED'
              AND r.next_review_at>? AND EXISTS(SELECT 1 FROM claim_source cs WHERE cs.revision_id=r.id))
            """,Boolean.class,d.revisionId(),d.locale(),Timestamp.from(d.publishAt()))))
            throw error(HttpStatus.BAD_REQUEST,"Choose reviewed published evidence valid at publication in the same language.");
        UUID id=UUID.randomUUID();
        try {
            jdbc.update("""
                INSERT INTO discovery_issue(id,slug,locale,title,teaser,opening_question,takeaway,established,
                  not_established,population,method,research_kind,revision_id,author_uid,publish_at,
                  publication_zone,publication_week,next_review_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,id,d.slug(),d.locale(),d.title(),d.teaser(),d.openingQuestion(),d.takeaway(),d.established(),
                d.notEstablished(),d.population(),d.method(),d.researchKind(),d.revisionId(),actor.uid(),
                Timestamp.from(d.publishAt()),d.publicationZone(),java.sql.Date.valueOf(d.publishAt().atZone(ZoneOffset.UTC).toLocalDate()),Timestamp.from(d.nextReviewAt()));
        } catch(DataIntegrityViolationException e) { throw error(HttpStatus.CONFLICT,"Slug already used or draft constraints not met."); }
        audit(id,actor.uid(),"CREATED","Draft created"); return id;
    }
    @Transactional(readOnly=true)
    public Map<String,Object> list(VerifiedToken actor,int page) {
        if(editorial.roles(actor).isEmpty()) throw error(HttpStatus.FORBIDDEN,"Editorial access required.");
        if(page<0 || page>100000) throw error(HttpStatus.BAD_REQUEST,"Invalid page.");
        var items=jdbc.queryForList("SELECT d.*,r.claim_id,d.sources AS news_sources FROM discovery_issue d LEFT JOIN claim_revision r ON r.id=d.revision_id ORDER BY d.created_at DESC,d.id LIMIT 50 OFFSET ?",(long)page*50);
        items.forEach(this::decode);
        return Map.of("items",items,"page",page,"size",50,"total",jdbc.queryForObject("SELECT count(*) FROM discovery_issue",Long.class),"actor_uid",actor.uid(),"roles",editorial.roles(actor));
    }
    public void decide(VerifiedToken actor,UUID id,Decision input) {
        if(input==null) throw error(HttpStatus.BAD_REQUEST,"Missing decision.");
        if(editorial.roles(actor).isEmpty()) throw error(HttpStatus.FORBIDDEN,"Editorial access required.");
        text(input.notes(),20000);
        var rows=jdbc.queryForList("SELECT * FROM discovery_issue WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty()) throw error(HttpStatus.NOT_FOUND,"Issue not found.");
        var row=rows.getFirst(); String state=row.get("status").toString();
        switch(Objects.requireNonNullElse(input.action(),"")) {
            case "SUBMIT" -> {
                require(actor,"AUTHOR"); own(actor,row); state(state,"DRAFT");
                if ("NEWS".equals(row.get("content_mode"))) {
                    var checked=BlogDocument.check(json.readTree(row.get("document").toString()));
                    if(checked.text().isBlank() || json.readTree(row.get("sources").toString()).isEmpty())
                        throw error(HttpStatus.BAD_REQUEST,"Content and research sources are required before review.");
                }
                if(!((Timestamp)row.get("publish_at")).toInstant().isAfter(Instant.now()))
                    throw error(HttpStatus.CONFLICT,"Choose a future publication time before submitting.");
                jdbc.update("UPDATE discovery_issue SET status='IN_REVIEW' WHERE id=?",id);
            }
            case "APPROVE" -> {
                require(actor,"REVIEWER"); state(state,"IN_REVIEW");
                if(actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Independent review required.");
                try { jdbc.update("UPDATE discovery_issue SET status='SCHEDULED',reviewer_uid=?,reviewed_at=clock_timestamp(),review_notes=? WHERE id=?",actor.uid(),input.notes(),id); }
                catch(DataIntegrityViolationException e) { throw error(HttpStatus.CONFLICT,"Week already scheduled, publication is in the past, or evidence is no longer valid."); }
            }
            case "PUBLISH", "SCHEDULE" -> {
                require(actor,"AUTHOR"); own(actor,row);
                if(!"NEWS".equals(row.get("content_mode")) || !Set.of("DRAFT","IN_REVIEW").contains(state))
                    throw error(HttpStatus.CONFLICT,"Only an unpublished news draft may be published by its author.");
                var checked=BlogDocument.check(json.readTree(row.get("document").toString()));
                if(checked.text().isBlank() || json.readTree(row.get("sources").toString()).isEmpty())
                    throw error(HttpStatus.BAD_REQUEST,"Content and research sources are required before publication.");
                try {
                    if(input.action().equals("PUBLISH")) {
                        jdbc.update("""
                            UPDATE discovery_issue SET status='PUBLISHED',publication_route='AUTHOR',
                            publish_at=statement_timestamp(),published_at=statement_timestamp(),
                            next_review_at=statement_timestamp()+interval '6 months' WHERE id=?
                            """,id);
                    } else {
                        if(!((Timestamp)row.get("publish_at")).toInstant().isAfter(Instant.now()))
                            throw error(HttpStatus.BAD_REQUEST,"Choose a future publication time.");
                        jdbc.update("UPDATE discovery_issue SET status='SCHEDULED',publication_route='AUTHOR' WHERE id=?",id);
                    }
                } catch(DataIntegrityViolationException e) {
                    throw error(HttpStatus.CONFLICT,"This language already has a Science Drop in the selected publication week.");
                }
            }
            case "ARCHIVE" -> {
                var roles=editorial.roles(actor);
                if(!roles.contains("REVIEWER")) { require(actor,"AUTHOR"); own(actor,row); }
                if(state.equals("ARCHIVED")) throw error(HttpStatus.CONFLICT,"Already archived.");
                jdbc.update("UPDATE discovery_issue SET status='ARCHIVED' WHERE id=?",id);
            }
            default -> throw error(HttpStatus.BAD_REQUEST,"Unknown action.");
        }
        audit(id,actor.uid(),input.action(),input.notes());
    }
    public void publishDue() {
        // Serialize publishers across application instances; no session-level lock survives the transaction.
        if(!Boolean.TRUE.equals(jdbc.queryForObject("SELECT pg_try_advisory_xact_lock(71305)",Boolean.class))) return;
        var due=jdbc.queryForList("SELECT d.id"+FROM+" WHERE d.status='SCHEDULED' AND d.publish_at<=CURRENT_TIMESTAMP AND d.next_review_at>CURRENT_TIMESTAMP AND "+EVIDENCE+" ORDER BY d.publish_at,d.id LIMIT 100 FOR UPDATE OF d SKIP LOCKED");
        for(var row:due) {
            UUID id=(UUID)row.get("id");
            jdbc.update("UPDATE discovery_issue SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=? AND status='SCHEDULED'",id);
            audit(id,"system:weekly-science","PUBLISHED","Scheduled issue published with its recorded provenance");
        }
    }
    private void decode(Map<String,Object> row) {
        if(row.get("document")!=null) row.put("document",json.readTree(row.get("document").toString()));
        var sources=row.remove("news_sources");
        if("NEWS".equals(row.get("content_mode"))) row.put("sources",json.readTree(sources==null?"[]":sources.toString()));
        else row.remove("sources");
    }
    public UUID saveNews(VerifiedToken actor,UUID id,NewsDraft draft) {
        require(actor,"AUTHOR");
        if(draft==null) throw error(HttpStatus.BAD_REQUEST,"Draft required.");
        locale(draft.locale());
        String title=draft.title()==null || draft.title().isBlank() ? ("pl".equals(draft.locale())?"Nowy news tygodnia":"New weekly news") : draft.title().trim();
        text(title,500);
        BlogDocument.Checked checked;
        try { checked=BlogDocument.check(draft.document()); }
        catch(IllegalArgumentException e) { throw error(HttpStatus.BAD_REQUEST,"Invalid news content."); }
        if(!checked.images().isEmpty()) throw error(HttpStatus.BAD_REQUEST,"Inline images are not supported in short news.");
        var sources=new ArrayList<NewsSource>();
        if(draft.sources()!=null) {
            if(draft.sources().size()>50) throw error(HttpStatus.BAD_REQUEST,"Too many sources.");
            for(var source:draft.sources()) {
                if(source==null) throw error(HttpStatus.BAD_REQUEST,"Invalid source.");
                text(source.title(),1000);
                try { sources.add(new NewsSource(source.title().trim(),EvidencePolicy.httpsUrl(source.url()))); }
                catch(IllegalArgumentException e) { throw error(HttpStatus.BAD_REQUEST,"HTTPS research link required."); }
            }
        }
        Instant publish=draft.publishAt()==null?Instant.now().plus(Duration.ofDays(1)):draft.publishAt();
        String zone=Objects.requireNonNullElse(draft.publicationZone(),"UTC");
        try { ZoneId.of(zone); } catch(DateTimeException e) { throw error(HttpStatus.BAD_REQUEST,"Invalid timezone."); }
        Instant nextReview=publish.atZone(ZoneOffset.UTC).plusMonths(6).toInstant();
        String teaser=checked.text().isBlank()?title:checked.text().substring(0,Math.min(240,checked.text().length()));
        if(json.writeValueAsBytes(checked.document()).length>1000000) throw error(HttpStatus.BAD_REQUEST,"News is too large.");
        if(id==null) {
            id=UUID.randomUUID();
            jdbc.update("""
              INSERT INTO discovery_issue(id,slug,locale,title,teaser,research_kind,author_uid,publish_at,
                publication_zone,publication_week,next_review_at,content_mode,document,sources)
              VALUES (?,?,?,?,?,'REVISITED',?,?,?,?,?,'NEWS',?::jsonb,?::jsonb)
              """,id,"news-"+id,draft.locale(),title,teaser,actor.uid(),Timestamp.from(publish),zone,
              java.sql.Date.valueOf(publish.atZone(ZoneOffset.UTC).toLocalDate()),Timestamp.from(nextReview),json.writeValueAsString(checked.document()),json.writeValueAsString(sources));
            audit(id,actor.uid(),"CREATED","Weekly news draft created");
        } else {
            var rows=jdbc.queryForList("SELECT * FROM discovery_issue WHERE id=? FOR UPDATE",id);
            if(rows.isEmpty()) throw error(HttpStatus.NOT_FOUND,"Issue not found.");
            var row=rows.getFirst(); own(actor,row); state(row.get("status").toString(),"DRAFT");
            if(!"NEWS".equals(row.get("content_mode"))) throw error(HttpStatus.CONFLICT,"Legacy issue cannot be edited as news.");
            jdbc.update("""
              UPDATE discovery_issue SET locale=?,title=?,teaser=?,document=?::jsonb,sources=?::jsonb,
                publish_at=?,publication_zone=?,next_review_at=? WHERE id=?
              """,draft.locale(),title,teaser,json.writeValueAsString(checked.document()),json.writeValueAsString(sources),Timestamp.from(publish),zone,Timestamp.from(nextReview),id);
            audit(id,actor.uid(),"UPDATED","Weekly news draft updated");
        }
        return id;
    }
    private void audit(UUID id,String uid,String action,String notes) {
        jdbc.update("INSERT INTO discovery_audit(id,issue_id,actor_uid,action,notes) VALUES (?,?,?,?,?)",UUID.randomUUID(),id,uid,action,notes);
    }
    private void own(VerifiedToken actor,Map<String,Object> row) { if(!actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Author required."); }
    private void require(VerifiedToken actor,String role) { if(!editorial.roles(actor).contains(role)) throw error(HttpStatus.FORBIDDEN,"Editorial role required."); }
    private void state(String actual,String expected) { if(!actual.equals(expected)) throw error(HttpStatus.CONFLICT,"Invalid issue state."); }
    private void text(String value,int max) { if(value==null || value.isBlank() || value.length()>max) throw error(HttpStatus.BAD_REQUEST,"Missing or oversized field."); }
    private void locale(String value) { if(!"en".equals(value) && !"pl".equals(value)) throw error(HttpStatus.BAD_REQUEST,"Unsupported locale."); }
    private ResponseStatusException error(HttpStatus status,String message) { return new ResponseStatusException(status,message); }
}
