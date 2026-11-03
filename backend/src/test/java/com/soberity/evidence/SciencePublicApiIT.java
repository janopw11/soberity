package com.soberity.evidence;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.soberity.support.AbstractIntegrationTest;
import static org.mockito.Mockito.when;
import com.soberity.identity.token.InvalidTokenException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

/** Synthetic fixtures only; exercises the actual filter chain, SQL projections and Flyway guards. */
class SciencePublicApiIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    record Fixture(UUID claim, UUID revision, UUID source, String category) { }

    @Test
    void anonymousReadsPublishedEvidenceAndCitationsWithoutEditorialIdentities() throws Exception {
        var f = fixture("en", "PUBLISHED");
        mvc.perform(get("/api/v1/evidence/claims/" + f.claim))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.limitations").value("Fixture limitations"))
                .andExpect(jsonPath("$.uncertainty").exists()).andExpect(jsonPath("$.reviewed_at").exists())
                .andExpect(jsonPath("$.author_uid").doesNotExist()).andExpect(jsonPath("$.reviewer_uid").doesNotExist());
        mvc.perform(get("/api/v1/evidence/claims/" + f.claim + "/citations"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].doi").value("10.1234/" + f.source))
                .andExpect(jsonPath("$[0].relation").value("SUPPORTS"));
        mvc.perform(get("/api/v1/evidence/sources/" + f.source))
                .andExpect(status().isOk()).andExpect(jsonPath("$.license").value("UNKNOWN"))
                .andExpect(jsonPath("$.access_type").value("ABSTRACT_ONLY"));
    }

    @Test
    void allNonPublishedStatusesAndOrphanSourcesAreIndistinguishableFromMissing() throws Exception {
        for (String state : new String[]{"DRAFT","IN_REVIEW","APPROVED","ARCHIVED"}) {
            var f = fixture("en", state);
            for (String path : new String[]{"claims/" + f.claim, "claims/" + f.claim + "/citations", "sources/" + f.source})
                mvc.perform(get("/api/v1/evidence/" + path)).andExpect(status().isNotFound())
                        .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")));
        }
        mvc.perform(get("/api/v1/evidence/claims/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void paginatesAndFiltersLocaleCategoryAndCertainty() throws Exception {
        var f = fixture("en", "PUBLISHED");
        var second = fixture("en", "PUBLISHED");
        jdbc.update("INSERT INTO science_claim_category VALUES (?,?)", second.claim, f.category);
        var draft = fixture("en", "DRAFT");
        jdbc.update("INSERT INTO science_claim_category VALUES (?,?)", draft.claim, f.category);
        for (int page=0; page<2; page++) {
            mvc.perform(get("/api/v1/evidence/claims").param("category", f.category).param("size","1").param("page",""+page))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
                    .andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.page").value(page));
        }
        mvc.perform(get("/api/v1/evidence/claims").param("category",f.category).param("page","2").param("size","1"))
                .andExpect(jsonPath("$.items.length()").value(0)).andExpect(jsonPath("$.total").value(2));
        mvc.perform(get("/api/v1/evidence/claims").param("category", f.category).param("locale","pl"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/evidence/claims").param("category", f.category).param("evidenceLevel","HIGH"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/science/categories").param("locale","pl"))
                .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Mózg")));
    }

    @Test
    void rejectsInvalidFiltersPaginationAndIdentifiers() throws Exception {
        for (String[] param : new String[][]{{"locale","de"},{"page","-1"},{"page","2147483648"},
                {"size","101"},{"size","0"},{"category","' OR 1=1"},{"evidenceLevel","CERTAIN"}})
            mvc.perform(get("/api/v1/evidence/claims").param(param[0],param[1])).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/evidence/claims/not-a-uuid")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/science/articles").param("size","-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/science/categories").param("locale","pl-PL")).andExpect(status().isBadRequest());
    }

    @Test
    void revalidatesEtagsAndHidesWithdrawnClaimsSourcesAndDependentArticles() throws Exception {
        var f = fixture("en", "PUBLISHED");
        UUID article = article(f, "PUBLISHED");
        String url = "/api/v1/science/articles?category=" + f.category;
        String tag = mvc.perform(get(url)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control","public, no-cache"))
                .andExpect(jsonPath("$.total").value(1)).andReturn().getResponse().getHeader("ETag");
        mvc.perform(get(url).header("If-None-Match",tag)).andExpect(status().isNotModified()).andExpect(content().string(""));
        String claimTag = mvc.perform(get("/api/v1/evidence/claims/"+f.claim)).andReturn().getResponse().getHeader("ETag");
        jdbc.update("UPDATE claim_revision SET status='ARCHIVED' WHERE id=?",f.revision);
        mvc.perform(get(url).header("If-None-Match",tag)).andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0)).andExpect(header().string("ETag",org.hamcrest.Matchers.not(tag)));
        mvc.perform(get("/api/v1/science/articles/"+article).header("If-None-Match","*")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/evidence/claims/"+f.claim).header("If-None-Match",claimTag)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/evidence/sources/"+f.source)).andExpect(status().isNotFound());
    }

    @Test
    void servesOnlyReviewedPublishedArticlesAndPreservesExactEvidenceReference() throws Exception {
        var f = fixture("pl", "PUBLISHED");
        for (String state : new String[]{"DRAFT","IN_REVIEW","APPROVED","ARCHIVED"}) {
            UUID id = article(f,state);
            mvc.perform(get("/api/v1/science/articles/"+id)).andExpect(status().isNotFound());
        }
        UUID id = article(f,"PUBLISHED");
        mvc.perform(get("/api/v1/science/articles/"+id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.locale").value("pl")).andExpect(jsonPath("$.revision_id").value(f.revision.toString()))
                .andExpect(jsonPath("$.claim_version").value(1)).andExpect(jsonPath("$.body").value("Synthetic article body"))
                .andExpect(jsonPath("$.author_uid").doesNotExist()).andExpect(jsonPath("$.reviewer_uid").doesNotExist());
        mvc.perform(get("/api/v1/science/articles").param("locale","pl").param("category",f.category))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void articleCannotSkipReviewOrPublishAgainstDraftEvidenceOrRewriteContent() {
        var f = fixture("en","PUBLISHED");
        UUID id = article(f,"IN_REVIEW");
        assertThatThrownBy(() -> jdbc.update("UPDATE science_article SET status='APPROVED' WHERE article_id=?",id))
                .isInstanceOf(DataAccessException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE science_article SET status='APPROVED',reviewer_uid='author',review_notes='Fixture',reviewed_at=clock_timestamp() WHERE article_id=?",id))
                .isInstanceOf(DataAccessException.class);
        var draft = fixture("en","DRAFT"); UUID draftArticle=article(draft,"IN_REVIEW");
        assertThatThrownBy(() -> approveArticle(draftArticle)).isInstanceOf(DataAccessException.class);
        UUID published=article(f,"PUBLISHED");
        assertThatThrownBy(() -> jdbc.update("UPDATE science_article SET body='Edited' WHERE article_id=?",published))
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    void databaseRejectsInvalidCitationUrlAndDoi() {
        for (String url : new String[]{"http://example.test","https://user:secret@example.test"})
            assertThatThrownBy(() -> source(UUID.randomUUID(),url,"10.1234/fixture")).isInstanceOf(DataAccessException.class);
        assertThatThrownBy(() -> source(UUID.randomUUID(),"https://example.test","not-a-doi"))
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    void anonymousCannotPublish() throws Exception {
        mvc.perform(post("/api/v1/science/articles")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/evidence/claims/"+UUID.randomUUID()+"/publish")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles={"USER","ADMIN"})
    void authenticatedUsersIncludingForgedAdminCannotWriteOrReadDrafts() throws Exception {
        var f = fixture("en","DRAFT");
        mvc.perform(get("/api/v1/evidence/claims/"+f.claim)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/evidence/claims/"+f.claim+"/publish")).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/science/articles/"+UUID.randomUUID())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/evidence/sources/"+f.source)).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles="UNVERIFIED")
    void publicReadsRemainAccessibleToUnverifiedUsersButWritesDoNot() throws Exception {
        mvc.perform(get("/api/v1/science/categories")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/science/articles")).andExpect(status().isForbidden());
    }

    @Test
    void browserCanRevalidateCrossOrigin() throws Exception {
        mvc.perform(options("/api/v1/science/articles").header("Origin","http://localhost:8081")
                .header("Access-Control-Request-Method","GET").header("Access-Control-Request-Headers","If-None-Match"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Headers","If-None-Match"));
        mvc.perform(get("/api/v1/science/categories").header("Origin","http://localhost:8081"))
                .andExpect(header().string("Access-Control-Expose-Headers",org.hamcrest.Matchers.containsString("ETag")));
    }

    @Test
    void replacingPublishedVersionChangesClaimAndCitationValidators() throws Exception {
        var f = fixture("en","PUBLISHED");
        String claimUrl="/api/v1/evidence/claims/"+f.claim;
        String oldClaimTag=mvc.perform(get(claimUrl)).andReturn().getResponse().getHeader("ETag");
        String oldCitationsTag=mvc.perform(get(claimUrl+"/citations")).andReturn().getResponse().getHeader("ETag");
        UUID next=UUID.randomUUID(), nextSource=UUID.randomUUID();
        jdbc.update("""
            INSERT INTO claim_revision(id,claim_id,version,author_uid,claim_text,summary,evidence_level,
            evidence_rationale,limitations,uncertainty,population,exposure,outcome,inference_type,change_summary,next_review_at)
            SELECT ?,claim_id,2,author_uid,'Corrected synthetic claim',summary,evidence_level,
            evidence_rationale,limitations,uncertainty,population,exposure,outcome,inference_type,'Correction',next_review_at
            FROM claim_revision WHERE id=?
            """,next,f.revision);
        source(nextSource,"https://example.test/correction","10.1234/"+nextSource);
        jdbc.update("INSERT INTO claim_source(id,revision_id,source_id,relation,notes) VALUES (?,?,?,'SUPPORTS','Corrected fixture assessment')",UUID.randomUUID(),next,nextSource);
        jdbc.update("UPDATE claim_revision SET status='IN_REVIEW' WHERE id=?",next);
        jdbc.update("INSERT INTO scientific_review(id,revision_id,reviewer_uid,decision,notes) VALUES (?,?,'reviewer','APPROVED','Correction review')",UUID.randomUUID(),next);
        jdbc.update("UPDATE claim_revision SET status='APPROVED' WHERE id=?",next);
        // A newer approved revision does not replace the current publication.
        mvc.perform(get(claimUrl).header("If-None-Match",oldClaimTag)).andExpect(status().isNotModified());
        jdbc.update("UPDATE claim_revision SET status='ARCHIVED' WHERE id=?",f.revision);
        jdbc.update("UPDATE claim_revision SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=?",next);
        mvc.perform(get(claimUrl).header("If-None-Match",oldClaimTag)).andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2)).andExpect(header().string("ETag",org.hamcrest.Matchers.not(oldClaimTag)));
        mvc.perform(get(claimUrl+"/citations").header("If-None-Match",oldCitationsTag)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(nextSource.toString()));
        mvc.perform(get("/api/v1/evidence/sources/"+f.source)).andExpect(status().isNotFound());
    }

    @Test
    void rejectedBearerHasOnlyAnonymousAccess() throws Exception {
        when(tokenVerifier.verify("invalid-science-token")).thenThrow(new InvalidTokenException("Invalid token", null));
        mvc.perform(get("/api/v1/science/categories").header("Authorization","Bearer invalid-science-token"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/science/articles").header("Authorization","Bearer invalid-science-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/me").header("Authorization","Bearer invalid-science-token"))
                .andExpect(status().isUnauthorized());
    }

    private Fixture fixture(String locale, String state) {
        UUID claim=UUID.randomUUID(), revision=UUID.randomUUID(), source=UUID.randomUUID();
        String category="fixture-"+UUID.randomUUID().toString().replace("-","");
        jdbc.update("INSERT INTO science_category VALUES (?,'Fixture','Fixture')",category);
        jdbc.update("INSERT INTO evidence_claim(id,locale) VALUES (?,?)",claim,locale);
        jdbc.update("INSERT INTO science_claim_category VALUES (?,?)",claim,category);
        source(source,"https://example.test/synthetic","10.1234/"+source);
        jdbc.update("""
            INSERT INTO claim_revision(id,claim_id,version,author_uid,claim_text,summary,evidence_level,
            evidence_rationale,limitations,uncertainty,population,exposure,outcome,inference_type,change_summary,next_review_at)
            VALUES (?,?,1,'author','Synthetic claim','Synthetic summary','LOW','Fixture rationale','Fixture limitations',
            'Fixture uncertainty','Fixture population','Fixture exposure','Fixture outcome','ASSOCIATION','Fixture',clock_timestamp()+interval '90 days')
            """,revision,claim);
        jdbc.update("INSERT INTO claim_source(id,revision_id,source_id,relation,notes) VALUES (?,?,?,'SUPPORTS','Fixture assessment')",UUID.randomUUID(),revision,source);
        if (!state.equals("DRAFT")) jdbc.update("UPDATE claim_revision SET status='IN_REVIEW' WHERE id=?",revision);
        if (state.equals("APPROVED") || state.equals("PUBLISHED") || state.equals("ARCHIVED")) {
            jdbc.update("INSERT INTO scientific_review(id,revision_id,reviewer_uid,decision,notes) VALUES (?,?,'reviewer','APPROVED','Fixture review')",UUID.randomUUID(),revision);
            jdbc.update("UPDATE claim_revision SET status='APPROVED' WHERE id=?",revision);
        }
        if (state.equals("PUBLISHED") || state.equals("ARCHIVED"))
            jdbc.update("UPDATE claim_revision SET status='PUBLISHED',published_at=clock_timestamp() WHERE id=?",revision);
        if (state.equals("ARCHIVED")) jdbc.update("UPDATE claim_revision SET status='ARCHIVED' WHERE id=?",revision);
        return new Fixture(claim,revision,source,category);
    }
    private void source(UUID id,String url,String doi) {
        jdbc.update("INSERT INTO scientific_source(id,title,authors,publication_year,url,doi,study_type,provider,license,access_type) VALUES (?,'Synthetic source','Fixture institution',2025,?,?,'REPORT','OTHER','UNKNOWN','ABSTRACT_ONLY')",id,url,doi);
    }
    private UUID article(Fixture f,String state) {
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO science_article(id,article_id,version,revision_id,category_code,title,summary,body,author_uid,next_review_at) VALUES (?,?,1,?,?,'Synthetic title','Synthetic summary','Synthetic article body','author',clock_timestamp()+interval '90 days')",UUID.randomUUID(),id,f.revision,f.category);
        if (!state.equals("DRAFT")) jdbc.update("UPDATE science_article SET status='IN_REVIEW' WHERE article_id=?",id);
        if (state.equals("APPROVED") || state.equals("PUBLISHED") || state.equals("ARCHIVED")) approveArticle(id);
        if (state.equals("PUBLISHED") || state.equals("ARCHIVED")) jdbc.update("UPDATE science_article SET status='PUBLISHED',published_at=clock_timestamp() WHERE article_id=?",id);
        if (state.equals("ARCHIVED")) jdbc.update("UPDATE science_article SET status='ARCHIVED' WHERE article_id=?",id);
        return id;
    }
    private void approveArticle(UUID id) {
        jdbc.update("UPDATE science_article SET status='APPROVED',reviewer_uid='reviewer',review_notes='Fixture independent review',reviewed_at=clock_timestamp() WHERE article_id=?",id);
    }
}
