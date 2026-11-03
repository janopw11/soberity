package com.soberity.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.soberity.evidence.domain.*;
import com.soberity.evidence.domain.EvidenceTypes.*;
import com.soberity.support.AbstractIntegrationTest;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.*;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

/** Real PostgreSQL/Flyway constraints, including direct SQL bypass attempts. No health claims or real papers. */
class ScientificEvidenceIT extends AbstractIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired ScientificSourceRepository sources;
    @Autowired EvidenceClaimRepository claims;
    @Autowired ClaimRevisionRepository revisions;
    @Autowired ClaimSourceRepository links;
    @Autowired ScientificReviewRepository reviews;

    @Test
    void flywayAppliesScientificSchemaAlongsideExistingProfileMigrations() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE success AND version IN ('1','2','3','4')", Integer.class))
                .isEqualTo(4);
    }

    @Test
    void upgradesV3WithExistingProfileWithoutChangingAccountData() throws Exception {
        String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .target("3").load().migrate();
        UUID profile = UUID.randomUUID();
        try (Connection connection = dataSource.getConnection()) {
            connection.setSchema(schema);
            try (var statement = connection.prepareStatement("INSERT INTO user_profile(id,firebase_uid,created_at,updated_at) VALUES (?,'upgrade-fixture',clock_timestamp(),clock_timestamp())")) {
                statement.setObject(1, profile); statement.executeUpdate();
            }
            connection.setSchema("public");
        }
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load().migrate();
        try (Connection connection = dataSource.getConnection()) {
            connection.setSchema(schema);
            try (var statement = connection.prepareStatement("SELECT count(*) FROM user_profile WHERE id=?")) {
                statement.setObject(1, profile);
                try (var result = statement.executeQuery()) { result.next(); assertThat(result.getInt(1)).isEqualTo(1); }
            }
            connection.setSchema("public");
        }
    }

    @Test
    void jpaRoundTripsSourceRevisionCitationsAndIndependentReview() {
        ScientificSource source = sources.saveAndFlush(new ScientificSource(new SourceMetadata(
                "Synthetic fixture, not a publication", "Fixture institution", null, "Synthetic journal", 2025,
                null, "https://example.test/fixture", "10.1234/" + UUID.randomUUID(), null,
                StudyType.OBSERVATIONAL, SourceProvider.THE_LANCET, "UNKNOWN", null, AccessType.ABSTRACT_ONLY, null)));
        EvidenceClaim claim = claims.saveAndFlush(new EvidenceClaim("pl"));
        ClaimRevision revision = revisions.saveAndFlush(new ClaimRevision(claim.getId(), 1, "author",
                new ClaimContent("Synthetic claim", "Synthetic summary", EvidenceLevel.LOW, "Synthetic rationale",
                        "Synthetic limitations", "Synthetic uncertainty", "Fixture population", "Fixture exposure",
                        "Fixture outcome", InferenceType.ASSOCIATION, null), "Initial fixture", Instant.now().plus(90, ChronoUnit.DAYS)));
        links.saveAndFlush(new ClaimSource(revision.getId(), source.getId(), SourceRelation.SUPPORTS, "Synthetic source assessment"));
        submit(revision.getId());
        reviews.saveAndFlush(new ScientificReview(revision.getId(), "independent-reviewer", ReviewDecision.APPROVED,
                "Synthetic independent assessment", false, null));
        approve(revision.getId());
        publish(revision.getId());
        ClaimRevision loaded = revisions.findById(revision.getId()).orElseThrow();
        assertThat(loaded.getStatus()).isEqualTo(PublicationStatus.PUBLISHED);
        assertThat(loaded.getPublishedAt()).isNotNull();
        assertThat(loaded.getLimitations()).isEqualTo("Synthetic limitations");
        assertThat(loaded.getEvidenceLevel()).isEqualTo(EvidenceLevel.LOW);
        assertThat(sources.findById(source.getId()).orElseThrow().getProvider()).isEqualTo(SourceProvider.THE_LANCET);
        assertThat(links.findByRevisionId(revision.getId())).hasSize(1);
        assertThat(reviews.findByRevisionId(revision.getId())).isPresent();
    }

    @Test
    void cannotApproveOrPublishWithoutSourcesEvenWithAnApprovalRecord() {
        UUID revision = draft(); submit(revision); review(revision, "reviewer", "APPROVED", false, null);
        rejects("23514", () -> approve(revision));
        rejects("23514", () -> publish(revision));
    }

    @Test
    void contextAndChallengingCitationsDoNotReplaceSupportingEvidence() {
        for (String relation : new String[] {"CONTEXT", "CHALLENGES"}) {
            UUID revision = draft(); link(revision, source("REPORT"), relation);
            submit(revision); review(revision, "reviewer", "APPROVED", false, null);
            rejects("23514", () -> approve(revision));
        }
    }

    @Test
    void commentaryEditorialAndPreprintAloneCannotSupportPublication() {
        for (String type : new String[] {"COMMENTARY", "EDITORIAL", "PREPRINT"}) {
            UUID revision = draft(); link(revision, source(type), "SUPPORTS");
            submit(revision); review(revision, "reviewer", "APPROVED", false, null);
            rejects("23514", () -> approve(revision));
        }
    }

    @Test
    void cannotApproveWithoutIndependentReviewOrWithRejectedReview() {
        UUID revision = draft(); link(revision, source("REPORT"), "SUPPORTS"); submit(revision);
        rejects("23514", () -> approve(revision));
        rejects("23514", () -> review(revision, "author", "APPROVED", false, null));
        review(revision, "reviewer", "REJECTED", false, null);
        rejects("23514", () -> approve(revision));
    }

    @Test
    void sourcesSealOnSubmissionAndReviewsAreAppendOnly() {
        UUID revision = draft(); UUID source = source("REPORT"); link(revision, source, "SUPPORTS");
        submit(revision); review(revision, "reviewer", "APPROVED", false, null);
        rejects("23514", () -> jdbc.update("DELETE FROM claim_source WHERE revision_id = ?", revision));
        rejects("23514", () -> link(revision, source("REPORT"), "SUPPORTS"));
        rejects("23514", () -> jdbc.update("UPDATE scientific_review SET decision = 'REJECTED' WHERE revision_id = ?", revision));
        rejects("23514", () -> jdbc.update("DELETE FROM scientific_review WHERE revision_id = ?", revision));
    }

    @Test
    void causalLanguageRequiresAuthorAndReviewerJustification() {
        UUID claim = claim();
        UUID missing = draft(claim, 1, "CAUSAL", null);
        link(missing, source("OBSERVATIONAL"), "SUPPORTS"); submit(missing);
        review(missing, "reviewer", "APPROVED", true, "Synthetic triangulation assessment");
        rejects("23514", () -> approve(missing));
        UUID unapproved = draft(claim, 2, "CAUSAL", "Synthetic author justification");
        link(unapproved, source("REPORT"), "SUPPORTS"); submit(unapproved);
        review(unapproved, "reviewer", "APPROVED", false, null);
        rejects("23514", () -> approve(unapproved));
        UUID approved = draft(claim, 3, "CAUSAL", "Synthetic author justification");
        link(approved, source("REPORT"), "SUPPORTS"); submit(approved);
        review(approved, "reviewer", "APPROVED", true, "Synthetic methodological justification");
        approve(approved); publish(approved);
        assertThat(status(approved)).isEqualTo("PUBLISHED");
    }

    @Test
    void immutableRevisionsRequireNewVersionAndNewReview() {
        UUID claim = claim(); UUID first = draft(claim, 1, "ASSOCIATION", null); ready(first); publish(first);
        rejects("23514", () -> jdbc.update("UPDATE claim_revision SET claim_text = 'Edited' WHERE id = ?", first));
        rejects("23514", () -> jdbc.update("DELETE FROM claim_revision WHERE id = ?", first));
        UUID next = draft(claim, 2, "ASSOCIATION", null); link(next, source("REPORT"), "SUPPORTS"); submit(next);
        rejects("23514", () -> approve(next));
        assertThat(revisions.findByClaimIdOrderByVersionAsc(claim)).hasSize(2);
    }

    @Test
    void onlyOnePublishedVersionAndArchivalPreservesPublicationHistory() {
        UUID claim = claim(); UUID first = draft(claim, 1, "ASSOCIATION", null); ready(first); publish(first);
        UUID second = draft(claim, 2, "ASSOCIATION", null); ready(second);
        rejects("23505", () -> publish(second));
        Instant date = revisions.findById(first).orElseThrow().getPublishedAt();
        jdbc.update("UPDATE claim_revision SET status = 'ARCHIVED' WHERE id = ?", first);
        publish(second);
        assertThat(status(first)).isEqualTo("ARCHIVED");
        assertThat(revisions.findById(first).orElseThrow().getPublishedAt()).isEqualTo(date);
        rejects("23514", () -> jdbc.update("UPDATE claim_revision SET status = 'DRAFT' WHERE id = ?", first));
    }

    @Test
    void rejectsFuturePublicationAndExpiredReviewDeadline() {
        UUID revision = draft(); ready(revision);
        rejects("23514", () -> jdbc.update("UPDATE claim_revision SET status='PUBLISHED', published_at=clock_timestamp()+interval '1 day' WHERE id=?", revision));
        UUID expired = UUID.randomUUID();
        insertDraft(expired, claim(), 1, "ASSOCIATION", null, "clock_timestamp()-interval '2 days'", "clock_timestamp()-interval '1 day'");
        ready(expired);
        rejects("23514", () -> publish(expired));
    }

    @Test
    void rejectsDuplicateVersionsAndInvalidSourceMetadata() {
        UUID claim = claim(); draft(claim, 1, "ASSOCIATION", null);
        rejects("23505", () -> draft(claim, 1, "ASSOCIATION", null));
        rejects("23514", () -> jdbc.update("INSERT INTO evidence_claim(id,locale) VALUES (?, 'de')", UUID.randomUUID()));
        for (String url : new String[] {"http://example.test", "https://name:password@example.test"}) {
            rejects("23514", () -> insertSource(UUID.randomUUID(), "REPORT", url));
        }
    }

    @Test
    void sourceCorrectionsCreateLinkedSnapshotsWithoutRewritingOldCitations() {
        UUID original = source("REPORT");
        rejects("23514", () -> jdbc.update("UPDATE scientific_source SET title = 'Changed' WHERE id = ?", original));
        // Use the same DOI for immutable snapshots of the same publication.
        // Lineage is supplied at insertion, never retroactively rewritten.
        UUID snapshot = UUID.randomUUID();
        jdbc.update("INSERT INTO scientific_source SELECT ?, ?, title, authors, organization, journal, publication_year, publication_date, url, doi, pmid, study_type, provider, license, license_url, access_type, retrieved_at FROM scientific_source WHERE id=?",
                snapshot, original, original);
        assertThat(jdbc.queryForObject("SELECT supersedes_source_id FROM scientific_source WHERE id=?", UUID.class, snapshot)).isEqualTo(original);
        String doi = jdbc.queryForObject("SELECT doi FROM scientific_source WHERE id=?", String.class, original);
        assertThat(sources.findByDoi(doi)).hasSize(2);
    }

    @Test
    void directInsertCannotBypassDraftAndPublicationRules() {
        UUID revision = draft();
        rejects("23514", () -> jdbc.update("UPDATE claim_revision SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=?", revision));
        UUID bypass = UUID.randomUUID();
        rejects("23514", () -> jdbc.update("INSERT INTO claim_revision SELECT ?,claim_id,2,author_uid,claim_text,summary,evidence_level,evidence_rationale,limitations,uncertainty,population,exposure,outcome,inference_type,causal_justification,change_summary,'PUBLISHED',next_review_at,clock_timestamp(),created_at FROM claim_revision WHERE id=?", bypass, revision));
    }

    @Test
    void citationDeletionCannotRaceSubmission() throws Exception {
        UUID revision = draft(); link(revision, source("REPORT"), "SUPPORTS");
        try (Connection submission = dataSource.getConnection(); ExecutorService executor = Executors.newSingleThreadExecutor()) {
            submission.setAutoCommit(false);
            try (var statement = submission.prepareStatement("UPDATE claim_revision SET status='IN_REVIEW' WHERE id=?")) {
                statement.setObject(1, revision); assertThat(statement.executeUpdate()).isEqualTo(1);
            }
            CountDownLatch issued = new CountDownLatch(1);
            Future<String> deletion = executor.submit(() -> {
                try (Connection connection = dataSource.getConnection()) {
                    connection.setAutoCommit(false);
                    try (var timeout = connection.createStatement()) { timeout.execute("SET LOCAL lock_timeout='3s'"); }
                    try (var statement = connection.prepareStatement("DELETE FROM claim_source WHERE revision_id=?")) {
                        statement.setObject(1, revision); issued.countDown(); statement.executeUpdate();
                        connection.commit(); return "unexpected-success";
                    } catch (SQLException ex) { connection.rollback(); return ex.getSQLState(); }
                }
            });
            assertThat(issued.await(3, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> deletion.get(150, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
            submission.commit();
            assertThat(deletion.get(4, TimeUnit.SECONDS)).isEqualTo("23514");
            assertThat(links.findByRevisionId(revision)).hasSize(1);
        }
    }

    private UUID claim() {
        UUID id = UUID.randomUUID(); jdbc.update("INSERT INTO evidence_claim(id,locale) VALUES (?, 'en')", id); return id;
    }
    private UUID draft() { return draft(claim(), 1, "ASSOCIATION", null); }
    private UUID draft(UUID claim, int version, String inference, String causal) {
        UUID id = UUID.randomUUID();
        insertDraft(id, claim, version, inference, causal, "clock_timestamp()", "clock_timestamp()+interval '90 days'");
        return id;
    }
    private void insertDraft(UUID id, UUID claim, int version, String inference, String causal, String created, String due) {
        jdbc.update("INSERT INTO claim_revision(id,claim_id,version,author_uid,claim_text,summary,evidence_level,evidence_rationale,limitations,uncertainty,population,exposure,outcome,inference_type,causal_justification,change_summary,created_at,next_review_at) VALUES (?,?,?,'author','Synthetic claim','Synthetic summary','LOW','Fixture rationale','Fixture limitations','Fixture uncertainty','Fixture population','Fixture exposure','Fixture outcome',?,?,'Initial fixture',"+created+","+due+")", id, claim, version, inference, causal);
    }
    private UUID source(String type) { UUID id = UUID.randomUUID(); insertSource(id, type, "https://example.test/synthetic"); return id; }
    private void insertSource(UUID id, String type, String url) {
        jdbc.update("INSERT INTO scientific_source(id,title,authors,publication_year,url,doi,study_type,provider,license,access_type) VALUES (?,'Synthetic fixture, not a publication','Fixture institution',2025,?,?,?,'THE_LANCET','UNKNOWN','ABSTRACT_ONLY')", id, url, "10.1234/" + id, type);
    }
    private void link(UUID revision, UUID source, String relation) {
        jdbc.update("INSERT INTO claim_source(id,revision_id,source_id,relation,notes) VALUES (?,?,?,?,'Synthetic source assessment')", UUID.randomUUID(), revision, source, relation);
    }
    private void submit(UUID revision) { jdbc.update("UPDATE claim_revision SET status='IN_REVIEW' WHERE id=?", revision); }
    private void review(UUID revision, String reviewer, String decision, boolean causal, String assessment) {
        jdbc.update("INSERT INTO scientific_review(id,revision_id,reviewer_uid,decision,notes,causality_approved,causal_assessment) VALUES (?,?,?,?,'Synthetic review',?,?)", UUID.randomUUID(), revision, reviewer, decision, causal, assessment);
    }
    private void approve(UUID revision) { jdbc.update("UPDATE claim_revision SET status='APPROVED' WHERE id=?", revision); }
    private void publish(UUID revision) { jdbc.update("UPDATE claim_revision SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=?", revision); }
    private void ready(UUID revision) { link(revision, source("REPORT"), "SUPPORTS"); submit(revision); review(revision,"reviewer","APPROVED",false,null); approve(revision); }
    private String status(UUID revision) { return jdbc.queryForObject("SELECT status FROM claim_revision WHERE id=?", String.class, revision); }
    private void rejects(String state, Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(DataAccessException.class).satisfies(error -> {
            Throwable cause = error; while (cause.getCause() != null) cause = cause.getCause();
            assertThat(cause).isInstanceOf(SQLException.class);
            assertThat(((SQLException) cause).getSQLState()).isEqualTo(state);
        });
    }
}
