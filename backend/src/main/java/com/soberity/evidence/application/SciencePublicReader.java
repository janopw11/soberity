package com.soberity.evidence.application;

import com.soberity.evidence.domain.EvidenceTypes.EvidenceLevel;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Explicit public projections; never serialize editorial entities or identities. */
@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class SciencePublicReader {
    private final JdbcTemplate jdbc;

    public SciencePublicReader(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final String CLAIM = """
        SELECT c.id, c.locale, r.id AS revision_id, r.version, r.claim_text, r.summary,
          r.evidence_level, r.evidence_rationale, r.limitations, r.uncertainty,
          r.population, r.exposure, r.outcome, r.inference_type, r.causal_justification,
          r.published_at, r.next_review_at, sr.reviewed_at
        FROM evidence_claim c JOIN claim_revision r ON r.claim_id=c.id
        JOIN scientific_review sr ON sr.revision_id=r.id AND sr.decision='APPROVED'
        WHERE r.status='PUBLISHED'
        """;
    private static final String ARTICLE = """
        SELECT a.article_id AS id, a.id AS article_revision_id, a.version, c.locale,
          a.title, a.summary, a.body, a.category_code, c.id AS claim_id,
          r.id AS revision_id, r.version AS claim_version, a.published_at,
          a.reviewed_at, a.next_review_at
        FROM science_article a JOIN claim_revision r ON r.id=a.revision_id
        JOIN evidence_claim c ON c.id=r.claim_id
        WHERE a.status='PUBLISHED' AND r.status='PUBLISHED'
        """;
    private static final String SOURCE_COLUMNS = """
        s.id, s.title, s.authors, s.organization, s.journal, s.publication_year,
        s.publication_date, s.url, s.doi, s.pmid, s.study_type, s.provider,
        s.license, s.license_url, s.access_type, s.retrieved_at
        """;

    public record Page(List<Map<String, Object>> items, int page, int size, long total) { }

    public List<Map<String, Object>> categories(String locale) {
        locale(locale);
        return jdbc.queryForList("SELECT code, label_" + locale + " AS label FROM science_category ORDER BY code");
    }

    public Page claims(String locale, String category, EvidenceLevel level, int page, int size) {
        validate(locale, category, page, size);
        List<Object> args = new ArrayList<>(List.of(locale));
        String sql = CLAIM + " AND c.locale=?";
        if (category != null) {
            sql += " AND EXISTS (SELECT 1 FROM science_claim_category cc WHERE cc.claim_id=c.id AND cc.category_code=?)";
            args.add(category);
        }
        if (level != null) { sql += " AND r.evidence_level=?"; args.add(level.name()); }
        return page(sql, " ORDER BY r.published_at DESC,c.id", args, page, size);
    }

    public Map<String, Object> claim(UUID id) { return one(CLAIM + " AND c.id=?", id); }

    public Page articles(String locale, String category, int page, int size) {
        validate(locale, category, page, size);
        List<Object> args = new ArrayList<>(List.of(locale));
        String sql = ARTICLE + " AND c.locale=?";
        if (category != null) { sql += " AND a.category_code=?"; args.add(category); }
        return page(sql, " ORDER BY a.published_at DESC,a.article_id", args, page, size);
    }

    public Map<String, Object> article(UUID id) { return one(ARTICLE + " AND a.article_id=?", id); }

    public List<Map<String, Object>> citations(UUID id) {
        Map<String, Object> claim = claim(id); // Same 404 for absent or non-public claim.
        return jdbc.queryForList("SELECT " + SOURCE_COLUMNS + " ,cs.relation,cs.notes FROM claim_source cs "
                + "JOIN scientific_source s ON s.id=cs.source_id WHERE cs.revision_id=? ORDER BY s.id",
                claim.get("revision_id"));
    }

    public Map<String, Object> source(UUID id) {
        return one("SELECT " + SOURCE_COLUMNS + " FROM scientific_source s WHERE s.id=? AND EXISTS ("
                + "SELECT 1 FROM claim_source cs JOIN claim_revision r ON r.id=cs.revision_id "
                + "WHERE cs.source_id=s.id AND r.status='PUBLISHED')", id);
    }

    private Page page(String sql, String order, List<Object> args, int page, int size) {
        long total = jdbc.queryForObject("SELECT count(*) FROM (" + sql + ") results", Long.class, args.toArray());
        args.add(size); args.add((long) page * size);
        return new Page(jdbc.queryForList(sql + order + " LIMIT ? OFFSET ?", args.toArray()), page, size, total);
    }

    private Map<String, Object> one(String sql, UUID id) {
        var rows = jdbc.queryForList(sql, id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found.");
        return rows.getFirst();
    }

    private void validate(String locale, String category, int page, int size) {
        locale(locale);
        if (page < 0 || page > 1_000_000 || size < 1 || size > 100 ||
                (category != null && !category.matches("[a-z][a-z0-9-]{0,39}"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid catalog filters or pagination.");
        }
    }

    private void locale(String locale) {
        if (!"en".equals(locale) && !"pl".equals(locale))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supported locales: en, pl.");
    }
}
