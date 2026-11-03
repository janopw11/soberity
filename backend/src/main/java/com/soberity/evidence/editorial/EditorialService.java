package com.soberity.evidence.editorial;

import com.soberity.evidence.domain.*;
import com.soberity.evidence.domain.EvidenceTypes.*;
import com.soberity.identity.token.VerifiedToken;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Transactional editorial boundary: identities come from Firebase, privileges from trusted DB grants. */
@Service
@Transactional
public class EditorialService {
    private final JdbcTemplate jdbc;
    public EditorialService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record ClaimDraft(String locale, String category, ClaimContent content,
            String changeSummary, Instant nextReviewAt) { }
    public record ArticleDraft(UUID revisionId, String category, String title, String summary,
            String body, String changeSummary, Instant nextReviewAt) { }
    public record Citation(UUID sourceId, SourceRelation relation, String notes) { }
    public record Decision(ReviewDecision decision, String notes, boolean causalityApproved, String causalAssessment) { }
    public record Reason(String reason) { }
    public record Page(List<Map<String,Object>> items, int page, int size, long total) { }

    public Set<String> roles(VerifiedToken actor) {
        if (actor == null || !actor.emailVerified()) throw error(HttpStatus.FORBIDDEN, "Verified identity required.");
        if (Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM deleted_account WHERE firebase_uid=?)",Boolean.class,actor.uid())))
            throw error(HttpStatus.FORBIDDEN,"Account is unavailable.");
        return new LinkedHashSet<>(jdbc.queryForList("SELECT role FROM editorial_role WHERE firebase_uid=? ORDER BY role",String.class,actor.uid()));
    }

    private void require(VerifiedToken actor, String role) {
        if (!roles(actor).contains(role)) throw error(HttpStatus.FORBIDDEN,"Editorial permission required.");
    }
    private void reader(VerifiedToken actor) {
        if (roles(actor).isEmpty()) throw error(HttpStatus.FORBIDDEN,"Editorial permission required.");
    }

    public Page list(VerifiedToken actor, String type, String status, int page) {
        reader(actor); table(type);
        if (page<0 || page>1000000) throw error(HttpStatus.BAD_REQUEST,"Invalid page.");
        if (status!=null) PublicationStatus.valueOf(status);
        String sql=type.equals("CLAIM")
            ? "SELECT 'CLAIM' AS type,r.id,r.claim_id AS material_id,r.version,r.claim_text AS title,r.status,c.locale,r.author_uid,r.created_at FROM claim_revision r JOIN evidence_claim c ON c.id=r.claim_id"
            : "SELECT 'ARTICLE' AS type,a.id,a.article_id AS material_id,a.version,a.title,a.status,c.locale,a.author_uid,a.created_at FROM science_article a JOIN claim_revision r ON r.id=a.revision_id JOIN evidence_claim c ON c.id=r.claim_id";
        List<Object> args=new ArrayList<>();
        if (status!=null) { sql += " WHERE " + (type.equals("CLAIM")?"r":"a") + ".status=?"; args.add(status); }
        long total=jdbc.queryForObject("SELECT count(*) FROM ("+sql+") x",Long.class,args.toArray());
        args.add(50);args.add((long)page*50);
        return new Page(jdbc.queryForList(sql+" ORDER BY created_at DESC,id LIMIT ? OFFSET ?",args.toArray()),page,50,total);
    }

    public Map<String,Object> detail(VerifiedToken actor,String type,UUID id) {
        reader(actor);
        Map<String,Object> row=load(type,id,false);
        var result=new LinkedHashMap<String,Object>(row);
        if (type.equals("CLAIM")) {
            var categories=jdbc.queryForList("SELECT category_code FROM science_claim_category WHERE claim_id=? ORDER BY category_code",String.class,row.get("claim_id"));
            result.put("category_code",categories.isEmpty()?null:categories.getFirst());
        }
        UUID claimRevision=type.equals("CLAIM")?id:(UUID)row.get("revision_id");
        result.put("evidence",jdbc.queryForMap("SELECT r.*,c.locale FROM claim_revision r JOIN evidence_claim c ON c.id=r.claim_id WHERE r.id=?",claimRevision));
        result.put("citations",jdbc.queryForList("SELECT cs.id AS citation_id,cs.relation,cs.notes,s.* FROM claim_source cs JOIN scientific_source s ON s.id=cs.source_id WHERE cs.revision_id=? ORDER BY s.id",claimRevision));
        result.put("review",jdbc.queryForList("SELECT * FROM scientific_review WHERE revision_id=?",claimRevision));
        UUID stable=(UUID)row.get(type.equals("CLAIM")?"claim_id":"article_id");
        result.put("versions",jdbc.queryForList("SELECT id,version,status FROM "+table(type)+" WHERE "+stableColumn(type)+"=? ORDER BY version",stable));
        result.put("audit",jdbc.queryForList("SELECT action,reason,actor_uid,created_at FROM editorial_audit WHERE material_type=? AND material_id IN (SELECT id FROM "+table(type)+" WHERE "+stableColumn(type)+"=?) ORDER BY created_at,id",type,stable));
        return result;
    }

    public UUID source(VerifiedToken actor,SourceMetadata input) {
        require(actor,"AUTHOR");
        ScientificSource s=new ScientificSource(input);
        jdbc.update("""
            INSERT INTO scientific_source(id,title,authors,organization,journal,publication_year,publication_date,url,doi,pmid,
            study_type,provider,license,license_url,access_type,supersedes_source_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,s.getId(),s.getTitle(),s.getAuthors(),s.getOrganization(),s.getJournal(),s.getPublicationYear(),s.getPublicationDate(),s.getUrl(),s.getDoi(),s.getPmid(),s.getStudyType().name(),s.getProvider().name(),s.getLicense(),s.getLicenseUrl(),s.getAccessType().name(),s.getSupersedesSourceId());
        audit(actor,"SOURCE",s.getId(),"CREATED","Bibliographic snapshot created");return s.getId();
    }

    public UUID draftClaim(VerifiedToken actor,UUID previous,ClaimDraft draft) {
        require(actor,"AUTHOR");Objects.requireNonNull(draft.content());
        checkDate(draft.nextReviewAt());text(draft.changeSummary(),10000); category(draft.category());
        UUID claim; int version;
        if (previous==null) {
            EvidenceClaim c=new EvidenceClaim(draft.locale());claim=c.getId();version=1;
            jdbc.update("INSERT INTO evidence_claim(id,locale) VALUES (?,?)",claim,draft.locale());
        } else {
            Map<String,Object> old=load("CLAIM",previous,true);own(actor,old);
            claim=(UUID)old.get("claim_id");
            // Lock stable identity to serialize version allocation across all revisions.
            String locale=jdbc.queryForObject("SELECT locale FROM evidence_claim WHERE id=? FOR UPDATE",String.class,claim);
            if (!locale.equals(draft.locale())) throw error(HttpStatus.BAD_REQUEST,"A translation needs a separate claim.");
            version=jdbc.queryForObject("SELECT coalesce(max(version),0)+1 FROM claim_revision WHERE claim_id=?",Integer.class,claim);
        }
        ClaimRevision r=new ClaimRevision(claim,version,actor.uid(),draft.content(),draft.changeSummary(),draft.nextReviewAt());
        ClaimContent c=draft.content();
        jdbc.update("""
            INSERT INTO claim_revision(id,claim_id,version,author_uid,claim_text,summary,evidence_level,evidence_rationale,
            limitations,uncertainty,population,exposure,outcome,inference_type,causal_justification,change_summary,next_review_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,r.getId(),claim,version,actor.uid(),c.claimText(),c.summary(),c.evidenceLevel().name(),c.evidenceRationale(),c.limitations(),c.uncertainty(),c.population(),c.exposure(),c.outcome(),c.inferenceType().name(),c.causalJustification(),draft.changeSummary(),java.sql.Timestamp.from(draft.nextReviewAt()));
        jdbc.update("INSERT INTO science_claim_category VALUES (?,?) ON CONFLICT DO NOTHING",claim,draft.category());
        if (previous!=null) jdbc.update("INSERT INTO claim_source(id,revision_id,source_id,relation,notes) SELECT gen_random_uuid(),?,source_id,relation,notes FROM claim_source WHERE revision_id=?",r.getId(),previous);
        audit(actor,"CLAIM",r.getId(),previous==null?"CREATED":"REVISED",draft.changeSummary());return r.getId();
    }

    public UUID draftArticle(VerifiedToken actor,UUID previous,ArticleDraft draft) {
        require(actor,"AUTHOR");checkDate(draft.nextReviewAt());category(draft.category());
        text(draft.title(),500);text(draft.summary(),10000);text(draft.body(),100000);text(draft.changeSummary(),10000);
        load("CLAIM",Objects.requireNonNull(draft.revisionId()),false);
        UUID stable=UUID.randomUUID();int version=1;
        if (previous!=null) {
            Map<String,Object> old=load("ARTICLE",previous,true);own(actor,old);stable=(UUID)old.get("article_id");
            // Advisory transaction lock also serializes branches from different article versions.
            jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",stable.toString());
            version=jdbc.queryForObject("SELECT max(version)+1 FROM science_article WHERE article_id=?",Integer.class,stable);
        }
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO science_article(id,article_id,version,revision_id,category_code,title,summary,body,author_uid,next_review_at) VALUES (?,?,?,?,?,?,?,?,?,?)",id,stable,version,draft.revisionId(),draft.category(),draft.title(),draft.summary(),draft.body(),actor.uid(),java.sql.Timestamp.from(draft.nextReviewAt()));
        audit(actor,"ARTICLE",id,previous==null?"CREATED":"REVISED",draft.changeSummary());return id;
    }

    public void citation(VerifiedToken actor,UUID id,Citation input) {
        require(actor,"AUTHOR");var row=load("CLAIM",id,true);own(actor,row);state(row,"DRAFT");
        ClaimSource cs=new ClaimSource(id,input.sourceId(),input.relation(),input.notes());
        jdbc.update("INSERT INTO claim_source(id,revision_id,source_id,relation,notes) VALUES (?,?,?,?,?)",cs.getId(),id,cs.getSourceId(),cs.getRelation().name(),cs.getNotes());
        audit(actor,"CLAIM",id,"CITATION_ADDED",input.notes());
    }
    public void removeCitation(VerifiedToken actor,UUID id,UUID citation,String reason) {
        require(actor,"AUTHOR");var row=load("CLAIM",id,true);own(actor,row);state(row,"DRAFT");text(reason,20000);
        if (jdbc.update("DELETE FROM claim_source WHERE id=? AND revision_id=?",citation,id)!=1) throw error(HttpStatus.NOT_FOUND,"Citation not found.");
        audit(actor,"CLAIM",id,"CITATION_REMOVED",reason);
    }

    public void submit(VerifiedToken actor,String type,UUID id,String reason) {
        require(actor,"AUTHOR");var row=load(type,id,true);own(actor,row);state(row,"DRAFT");
        // Submission, not only approval, requires usable supporting evidence.
        UUID revision=type.equals("CLAIM")?id:(UUID)row.get("revision_id");
        if (!Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM claim_source cs JOIN scientific_source s ON s.id=cs.source_id WHERE cs.revision_id=? AND cs.relation='SUPPORTS' AND s.study_type NOT IN ('COMMENTARY','EDITORIAL','PREPRINT'))",Boolean.class,revision)))
            throw error(HttpStatus.CONFLICT,"Supporting scientific evidence is required.");
        if (type.equals("ARTICLE")) state(load("CLAIM",revision,false),"PUBLISHED");
        updateStatus(type,id,"IN_REVIEW");audit(actor,type,id,"SUBMITTED",reason);
    }

    public void review(VerifiedToken actor,String type,UUID id,Decision decision) {
        require(actor,"REVIEWER");var row=load(type,id,true);state(row,"IN_REVIEW");independent(actor,row);
        Objects.requireNonNull(decision.decision());text(decision.notes(),20000);
        if (type.equals("CLAIM")) {
            ScientificReview r=new ScientificReview(id,actor.uid(),decision.decision(),decision.notes(),decision.causalityApproved(),decision.causalAssessment());
            jdbc.update("INSERT INTO scientific_review(id,revision_id,reviewer_uid,decision,notes,causality_approved,causal_assessment) VALUES (?,?,?,?,?,?,?)",r.getId(),id,actor.uid(),r.getDecision().name(),r.getNotes(),r.getCausalityApproved(),r.getCausalAssessment());
            updateStatus(type,id,decision.decision()==ReviewDecision.APPROVED?"APPROVED":"ARCHIVED");
        } else {
            if (decision.decision()==ReviewDecision.APPROVED)
                jdbc.update("UPDATE science_article SET status='APPROVED',reviewer_uid=?,review_notes=?,reviewed_at=clock_timestamp() WHERE id=?",actor.uid(),decision.notes(),id);
            else updateStatus(type,id,"ARCHIVED");
        }
        audit(actor,type,id,decision.decision().name(),decision.notes());
    }

    public void publish(VerifiedToken actor,String type,UUID id,String reason) {
        require(actor,"REVIEWER");var row=load(type,id,true);state(row,"APPROVED");independent(actor,row);
        Object stable=row.get(stableColumn(type));
        // Serialize replacement publications; keep old archive + new publication atomic.
        jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",stable.toString());
        var previous=jdbc.queryForList("SELECT id FROM "+table(type)+" WHERE "+stableColumn(type)+"=? AND status='PUBLISHED' FOR UPDATE",UUID.class,stable);
        for (UUID old:previous) { updateStatus(type,old,"ARCHIVED");audit(actor,type,old,"SUPERSEDED",reason); }
        jdbc.update("UPDATE "+table(type)+" SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=?",id);
        audit(actor,type,id,"PUBLISHED",reason);
    }
    public void archive(VerifiedToken actor,String type,UUID id,String reason) {
        require(actor,"REVIEWER");var row=load(type,id,true);
        if (row.get("status").equals("ARCHIVED")) throw error(HttpStatus.CONFLICT,"Already archived.");
        updateStatus(type,id,"ARCHIVED");audit(actor,type,id,"ARCHIVED",reason);
    }

    private Map<String,Object> load(String type,UUID id,boolean lock) {
        var rows=jdbc.queryForList("SELECT * FROM "+table(type)+" WHERE id=?"+(lock?" FOR UPDATE":""),id);
        if (rows.isEmpty()) throw error(HttpStatus.NOT_FOUND,"Material not found.");return rows.getFirst();
    }
    private String table(String type) {
        return switch(type) { case "CLAIM" -> "claim_revision";case "ARTICLE" -> "science_article";
            default -> throw error(HttpStatus.BAD_REQUEST,"Unknown material type."); };
    }
    private String stableColumn(String type) { table(type);return type.equals("CLAIM")?"claim_id":"article_id"; }
    private void updateStatus(String type,UUID id,String status) { jdbc.update("UPDATE "+table(type)+" SET status=? WHERE id=?",status,id); }
    private void own(VerifiedToken actor,Map<String,Object> row) {
        if (!actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Only the author can revise or submit this material.");
    }
    private void independent(VerifiedToken actor,Map<String,Object> row) {
        if (actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Independent reviewer required.");
    }
    private void state(Map<String,Object> row,String status) {
        if (!status.equals(row.get("status"))) throw error(HttpStatus.CONFLICT,"Material is not in the required state.");
    }
    private void category(String code) {
        if (code==null || !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM science_category WHERE code=?)",Boolean.class,code))) throw error(HttpStatus.BAD_REQUEST,"Unknown category.");
    }
    private void checkDate(Instant date) { if (date==null || !date.isAfter(Instant.now())) throw error(HttpStatus.BAD_REQUEST,"Future review date required."); }
    private void text(String text,int max) { if (text==null || text.isBlank() || text.length()>max) throw error(HttpStatus.BAD_REQUEST,"Missing or oversized field."); }
    private void audit(VerifiedToken actor,String type,UUID id,String action,String reason) {
        text(reason,20000);jdbc.update("INSERT INTO editorial_audit(id,actor_uid,material_type,material_id,action,reason) VALUES (?,?,?,?,?,?)",UUID.randomUUID(),actor.uid(),type,id,action,reason);
    }
    private ResponseStatusException error(HttpStatus status,String detail) { return new ResponseStatusException(status,detail); }
}
