package com.soberity.evidence;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.support.AbstractIntegrationTest;
import com.soberity.identity.token.VerifiedToken;
import com.soberity.evidence.domain.*;
import com.soberity.evidence.domain.EvidenceTypes.*;
import com.soberity.evidence.editorial.EditorialService.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

class EditorialApiIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;

    private String user(String... roles) throws Exception {
        String uid="editor-"+UUID.randomUUID();
        when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,true));
        for (String role:roles) jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,?,'test-operator')",uid,role);
        return uid;
    }
    private ClaimDraft draft() { return new ClaimDraft("en","sleep",new ClaimContent("Synthetic claim","Synthetic summary",EvidenceLevel.LOW,"Fixture rationale","Fixture limitations","Fixture uncertainty","Fixture population","Fixture exposure","Fixture outcome",InferenceType.ASSOCIATION,null),"Initial fixture",Instant.now().plus(90,ChronoUnit.DAYS)); }
    private UUID create(String actor) throws Exception { return id(send(actor,"/claims",draft())); }
    private String send(String actor,String path,Object body) throws Exception {
        return mvc.perform(post("/api/v1/editorial"+path).header("Authorization","Bearer "+actor).contentType("application/json").content(json.writeValueAsString(body)))
                .andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString();
    }
    private UUID id(String response) { return UUID.fromString(json.readTree(response).get("id").asText()); }
    private String material(UUID id,String action) { return "/materials/CLAIM/"+id+"/"+action; }
    private UUID cite(String author,UUID claim) throws Exception {
        UUID source=id(send(author,"/sources",new SourceMetadata("Synthetic publication","Fixture authors",null,null,2025,null,"https://example.test/synthetic","DOI:10.1234/"+UUID.randomUUID(),null,StudyType.REPORT,SourceProvider.OTHER,"UNKNOWN",null,AccessType.ABSTRACT_ONLY,null)));
        send(author,"/claims/"+claim+"/citations",new Citation(source,SourceRelation.SUPPORTS,"Fixture assessment"));return source;
    }
    private void ready(String author,String reviewer,UUID claim) throws Exception {
        cite(author,claim);send(author,material(claim,"submit"),new Reason("Ready for independent review"));
        send(reviewer,material(claim,"review"),new Decision(ReviewDecision.APPROVED,"Synthetic independent review",false,null));
    }

    @Test void rolesArePrivateAndNeverInferredFromClientHeadersOrBody() throws Exception {
        mvc.perform(get("/api/v1/editorial/materials")).andExpect(status().isUnauthorized());
        String ordinary=user();
        mvc.perform(get("/api/v1/editorial/materials").header("Authorization","Bearer "+ordinary).header("X-Role","REVIEWER")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/editorial/claims").header("Authorization","Bearer "+ordinary).contentType("application/json").content(json.writeValueAsString(draft())))
                .andExpect(status().isForbidden());
        String unverified="unverified-"+UUID.randomUUID();when(tokenVerifier.verify(unverified)).thenReturn(new VerifiedToken(unverified,false));
        jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,'AUTHOR','test')",unverified);
        mvc.perform(get("/api/v1/editorial/me").header("Authorization","Bearer "+unverified)).andExpect(status().isForbidden());
    }
    @Test void lifecycleIncludesIndependentReviewAuditAndWithdrawal() throws Exception {
        String author=user("AUTHOR"), reviewer=user("REVIEWER");UUID id=create(author);
        ready(author,reviewer,id);send(reviewer,material(id,"publish"),new Reason("Reviewed for publication"));
        UUID stable=jdbc.queryForObject("SELECT claim_id FROM claim_revision WHERE id=?",UUID.class,id);
        mvc.perform(get("/api/v1/evidence/claims/"+stable)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/editorial/materials/CLAIM/"+id).header("Authorization","Bearer "+reviewer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.audit.length()").value(5)).andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store")));
        send(reviewer,material(id,"archive"),new Reason("Synthetic withdrawal reason"));
        mvc.perform(get("/api/v1/evidence/claims/"+stable)).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT reason FROM editorial_audit WHERE material_id=? AND action='ARCHIVED'",String.class,id)).isEqualTo("Synthetic withdrawal reason");
        assertThatThrownBy(()->jdbc.update("DELETE FROM editorial_audit WHERE material_id=?",id)).isInstanceOf(DataAccessException.class);
    }
    @Test void superAdminCannotSelfApproveOrPublish() throws Exception {
        String author=user();
        jdbc.update("INSERT INTO application_role(firebase_uid,role,granted_by) VALUES (?,'SUPER_ADMIN','test')",author);
        assertNoSelfApproval(author);
    }
    @Test void evenDualRoleAuthorCannotSelfApproveOrPublish() throws Exception {
        assertNoSelfApproval(user("AUTHOR","REVIEWER"));
    }
    private void assertNoSelfApproval(String author) throws Exception {
        UUID id=create(author);cite(author,id);send(author,material(id,"submit"),new Reason("Submit"));
        mvc.perform(post("/api/v1/editorial"+material(id,"review")).header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(new Decision(ReviewDecision.APPROVED,"Self approval",false,null))))
                .andExpect(status().isForbidden());
        String reviewer=user("REVIEWER");send(reviewer,material(id,"review"),new Decision(ReviewDecision.APPROVED,"Independent approval",false,null));
        mvc.perform(post("/api/v1/editorial"+material(id,"publish")).header("Authorization","Bearer "+author).contentType("application/json").content("{\"reason\":\"Self publication\"}"))
                .andExpect(status().isForbidden());
    }
    @Test void authorsCannotPublishAndReviewersCannotWriteDrafts() throws Exception {
        String author=user("AUTHOR"), other=user("AUTHOR"), reviewer=user("REVIEWER");UUID id=create(author);
        mvc.perform(post("/api/v1/editorial"+material(id,"submit")).header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"Submit\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/editorial/claims").header("Authorization","Bearer "+reviewer).contentType("application/json").content(json.writeValueAsString(draft())))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/editorial"+material(id,"publish")).header("Authorization","Bearer "+author).contentType("application/json").content("{\"reason\":\"Publish\"}"))
                .andExpect(status().isForbidden());
    }
    @Test void sourceFreeSubmissionInvalidMetadataAndEditsAreRejectedWithoutPartialAudit() throws Exception {
        String author=user("AUTHOR");UUID id=create(author);
        mvc.perform(post("/api/v1/editorial"+material(id,"submit")).header("Authorization","Bearer "+author).contentType("application/json").content("{\"reason\":\"Submit\"}"))
                .andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM editorial_audit WHERE material_id=?",Long.class,id)).isEqualTo(1);
        mvc.perform(patch("/api/v1/editorial/claims/"+id).header("Authorization","Bearer "+author).contentType("application/json").content("{\"claimText\":\"Overwrite\"}"))
                .andExpect(status().isNotFound());
        String invalid="{\"title\":\"Fixture\",\"authors\":\"Authors\",\"publicationYear\":2025,\"url\":\"http://example.test\",\"doi\":\"invalid\",\"studyType\":\"REPORT\",\"provider\":\"OTHER\",\"license\":\"UNKNOWN\",\"accessType\":\"UNKNOWN\"}";
        mvc.perform(post("/api/v1/editorial/sources").header("Authorization","Bearer "+author).contentType("application/json").content(invalid)).andExpect(status().isBadRequest());
    }
    @Test void revisionsRequireNewReviewAndReplacePublicationAtomically() throws Exception {
        String author=user("AUTHOR"), reviewer=user("REVIEWER");UUID old=create(author);ready(author,reviewer,old);send(reviewer,material(old,"publish"),new Reason("First publication"));
        UUID next=id(send(author,"/claims/"+old+"/revisions",draft()));
        assertThat(jdbc.queryForObject("SELECT version FROM claim_revision WHERE id=?",Integer.class,next)).isEqualTo(2);
        mvc.perform(post("/api/v1/editorial"+material(next,"publish")).header("Authorization","Bearer "+reviewer).contentType("application/json").content("{\"reason\":\"Bypass\"}"))
                .andExpect(status().isConflict());
        send(author,material(next,"submit"),new Reason("Correction review"));send(reviewer,material(next,"review"),new Decision(ReviewDecision.APPROVED,"Correction approved",false,null));
        // A failed reason validation rolls back archival and publication together.
        mvc.perform(post("/api/v1/editorial"+material(next,"publish")).header("Authorization","Bearer "+reviewer).contentType("application/json").content("{\"reason\":\"\"}"))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT status FROM claim_revision WHERE id=?",String.class,old)).isEqualTo("PUBLISHED");
        send(reviewer,material(next,"publish"),new Reason("Approved correction"));
        assertThat(jdbc.queryForObject("SELECT status FROM claim_revision WHERE id=?",String.class,old)).isEqualTo("ARCHIVED");
        assertThat(jdbc.queryForObject("SELECT status FROM claim_revision WHERE id=?",String.class,next)).isEqualTo("PUBLISHED");
    }
    @Test void rejectedRevisionIsArchivedAndCannotBeResubmitted() throws Exception {
        String author=user("AUTHOR"), reviewer=user("REVIEWER");UUID id=create(author);cite(author,id);send(author,material(id,"submit"),new Reason("Submit"));
        send(reviewer,material(id,"review"),new Decision(ReviewDecision.CHANGES_REQUESTED,"Clarify limitations",false,null));
        mvc.perform(post("/api/v1/editorial"+material(id,"submit")).header("Authorization","Bearer "+author).contentType("application/json").content("{\"reason\":\"Retry\"}"))
                .andExpect(status().isConflict());
        UUID next=id(send(author,"/claims/"+id+"/revisions",draft()));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM scientific_review WHERE revision_id=?",Long.class,next)).isZero();
    }
    @Test void articleGetsItsOwnIndependentReviewAndHidesWhenEvidenceIsWithdrawn() throws Exception {
        String author=user("AUTHOR"), reviewer=user("REVIEWER");UUID claim=create(author);ready(author,reviewer,claim);send(reviewer,material(claim,"publish"),new Reason("Evidence approved"));
        UUID article=id(send(author,"/articles",new ArticleDraft(claim,"sleep","Synthetic title","Synthetic summary","Synthetic body","First article",Instant.now().plus(90,ChronoUnit.DAYS))));
        String path="/materials/ARTICLE/"+article;
        send(author,path+"/submit",new Reason("Full article submitted"));send(reviewer,path+"/review",new Decision(ReviewDecision.APPROVED,"Full article assessed",false,null));send(reviewer,path+"/publish",new Reason("Article approved"));
        UUID stable=jdbc.queryForObject("SELECT article_id FROM science_article WHERE id=?",UUID.class,article);
        mvc.perform(get("/api/v1/science/articles/"+stable)).andExpect(status().isOk());
        send(reviewer,material(claim,"archive"),new Reason("Evidence withdrawn"));
        mvc.perform(get("/api/v1/science/articles/"+stable)).andExpect(status().isNotFound());
    }
    @Test void revokedAndDeletedEditorsLoseAccessImmediately() throws Exception {
        String author=user("AUTHOR");UUID id=create(author);
        jdbc.update("DELETE FROM editorial_role WHERE firebase_uid=?",author);
        mvc.perform(get("/api/v1/editorial/materials/CLAIM/"+id).header("Authorization","Bearer "+author)).andExpect(status().isForbidden());
        String deleted=user("REVIEWER");jdbc.update("INSERT INTO deleted_account(firebase_uid,requested_at) VALUES (?,clock_timestamp())",deleted);
        mvc.perform(get("/api/v1/editorial/me").header("Authorization","Bearer "+deleted)).andExpect(status().isForbidden());
    }
}
