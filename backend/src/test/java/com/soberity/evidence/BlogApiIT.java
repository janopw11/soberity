package com.soberity.evidence;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.support.AbstractIntegrationTest;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class BlogApiIT extends AbstractIntegrationTest {
    static { System.setProperty("java.awt.headless","true"); }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    private String user(String... roles) throws Exception {
        String uid="blog-"+UUID.randomUUID();when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,true));
        for(String role:roles)jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,?,'test')",uid,role);
        return uid;
    }
    private Map<String,Object> draft(String action) {
        return new LinkedHashMap<>(Map.of("kind","ARTICLE","title","Synthetic blog article","categoryCode","sleep","action",action,
            "document",Map.of("type","doc","content",List.of(Map.of("type","paragraph","attrs",Map.of("textAlign","justify"),"content",List.of(Map.of("type","text","text","Synthetic article text","marks",List.of(Map.of("type","bold"))))))),
            "evidence",List.of(Map.of("title","Synthetic source","url","https://example.test/source"))));
    }
    private JsonNode create(String author,Map<String,Object> body) throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(body)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    @Test void discoverSearchFiltersBeforePaginationAndSearchesOnlyPublishedTitles() throws Exception {
        String author=user("AUTHOR"), prefix="Search-"+UUID.randomUUID();
        for(int i=0;i<3;i++) {
            var body=draft("PUBLISH");body.put("title",prefix+" MiXeD title "+i);create(author,body);
        }
        var hidden=draft("DRAFT");hidden.put("title",prefix+" MiXeD hidden");create(author,hidden);
        var bodyOnly=draft("PUBLISH");bodyOnly.put("title","Body-only fixture");
        bodyOnly.put("document",Map.of("type","doc","content",List.of(Map.of("type","paragraph","content",List.of(Map.of("type","text","text",prefix+" MiXeD"))))));
        create(author,bodyOnly);
        for(int page=0;page<3;page++) {
            mvc.perform(get("/api/v1/science/feed").param("q","  "+prefix.toLowerCase()+" mixed  ")
                    .param("category","sleep").param("size","1").param("page",""+page))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.page").value(page))
                .andExpect(jsonPath("$.items[0].type").value("POST"));
        }
        mvc.perform(get("/api/v1/science/feed").param("q",prefix).param("category","unknown-category"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/science/feed").param("q",prefix).param("category","sleep").param("size","1").param("page","3"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.items.length()").value(0));
        var literal=draft("PUBLISH");literal.put("title",prefix+" 100%_literal");create(author,literal);
        mvc.perform(get("/api/v1/science/feed").param("q",prefix+" 100%_literal"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/science/feed").param("q","' OR 1=1 --"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/science/feed").param("q","x".repeat(201))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/science/feed").param("category","' OR 1=1")).andExpect(status().isBadRequest());
    }
    @Test void authorCanPublishDirectlyAndPublicProjectionDoesNotClaimReview() throws Exception {
        String author=user("AUTHOR");var post=create(author,draft("PUBLISH"));String id=post.get("id").asText();
        mvc.perform(get("/api/v1/science/posts/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"))
            .andExpect(jsonPath("$.publication_route").value("AUTHOR")).andExpect(jsonPath("$.author_uid").doesNotExist())
            .andExpect(jsonPath("$.document.content[0].attrs.textAlign").value("justify"));
        mvc.perform(get("/api/v1/editorial/posts/"+id).header("Authorization","Bearer "+author)).andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store")));
    }
    @Test void draftEditPreservesLiveVersionAndRejectsStaleWrites() throws Exception {
        String author=user("AUTHOR");var first=create(author,draft("PUBLISH"));String id=first.get("id").asText();
        var next=draft("DRAFT");next.put("expectedVersion",1);next.put("title","Corrected draft");
        mvc.perform(put("/api/v1/editorial/posts/"+id).header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(next))).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(2));
        mvc.perform(get("/api/v1/science/posts/"+id)).andExpect(jsonPath("$.title").value("Synthetic blog article"));
        mvc.perform(put("/api/v1/editorial/posts/"+id).header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(next))).andExpect(status().isConflict());
        next.put("expectedVersion",2);next.put("action","PUBLISH");
        mvc.perform(put("/api/v1/editorial/posts/"+id).header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(next))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/science/posts/"+id)).andExpect(jsonPath("$.version").value(3));
    }
    @Test void reviewRequiresDifferentReviewerAndExactCurrentVersion() throws Exception {
        String author=user("AUTHOR","REVIEWER"),reviewer=user("REVIEWER");var p=create(author,draft("REVIEW"));String id=p.get("id").asText();
        String decision="{\"version\":1,\"decision\":\"PUBLISH\",\"notes\":\"Independent assessment\"}";
        mvc.perform(post("/api/v1/editorial/posts/"+id+"/decision").header("Authorization","Bearer "+author).contentType("application/json").content(decision)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/editorial/posts/"+id+"/decision").header("Authorization","Bearer "+reviewer).contentType("application/json").content(decision.replace("\"version\":1","\"version\":2"))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/editorial/posts/"+id+"/decision").header("Authorization","Bearer "+reviewer).contentType("application/json").content(decision)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/science/posts/"+id)).andExpect(jsonPath("$.publication_route").value("REVIEWED"));
        String rejected=create(author,draft("REVIEW")).get("id").asText();
        mvc.perform(post("/api/v1/editorial/posts/"+rejected+"/decision").header("Authorization","Bearer "+reviewer).contentType("application/json").content("{\"version\":1,\"decision\":\"CHANGES_REQUESTED\",\"notes\":\"Clarify the evidence\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.review_notes").value("Clarify the evidence"));
    }
    @Test void unprivilegedOtherAuthorsAndMissingEvidenceCannotPublish() throws Exception {
        String plain=user(),author=user("AUTHOR"),other=user("AUTHOR");
        mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+plain).contentType("application/json").content(json.writeValueAsString(draft("PUBLISH")))).andExpect(status().isForbidden());
        var invalid=draft("PUBLISH");invalid.put("evidence",List.of());
        mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
        String id=create(author,draft("DRAFT")).get("id").asText();var edit=draft("PUBLISH");edit.put("expectedVersion",1);
        mvc.perform(put("/api/v1/editorial/posts/"+id).header("Authorization","Bearer "+other).contentType("application/json").content(json.writeValueAsString(edit))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/science/posts/"+id)).andExpect(status().isNotFound());
    }
    @Test void rejectsScriptsUnsafeLinksAndArbitraryImageUrls() throws Exception {
        String author=user("AUTHOR");
        for(Object node:List.of(Map.of("type","script"),Map.of("type","image","attrs",Map.of("src","https://example.test/tracker.png","alt","Tracker")),Map.of("type","text","text","Unsafe","marks",List.of(Map.of("type","link","attrs",Map.of("href","javascript:alert(1)")))))) {
            var d=draft("DRAFT");d.put("document",Map.of("type","doc","content",List.of(node)));
            mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(d))).andExpect(status().isBadRequest());
        }
    }
    @Test void imagesAreNormalizedPrivateUntilPublishedAndHiddenOnWithdrawal() throws Exception {
        String author=user("AUTHOR");var image=new BufferedImage(300,300,BufferedImage.TYPE_INT_RGB);var bytes=new ByteArrayOutputStream();ImageIO.write(image,"png",bytes);
        var uploaded=json.readTree(mvc.perform(multipart("/api/v1/editorial/media").file(new MockMultipartFile("file","fixture.png","image/png",bytes.toByteArray())).param("purpose","COVER").param("alt","Synthetic cover").header("Authorization","Bearer "+author))
            .andExpect(status().isOk()).andExpect(jsonPath("$.width").value(1600)).andExpect(jsonPath("$.height").value(900)).andReturn().getResponse().getContentAsString());
        String media=uploaded.get("id").asText();
        mvc.perform(get("/api/v1/science/media/"+media)).andExpect(status().isNotFound());
        var body=draft("PUBLISH");body.put("coverId",media);String id=create(author,body).get("id").asText();
        mvc.perform(get("/api/v1/science/media/"+media)).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));
        mvc.perform(post("/api/v1/editorial/posts/"+id+"/archive").header("Authorization","Bearer "+author).contentType("application/json").content("{\"version\":1}")).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/science/media/"+media)).andExpect(status().isNotFound());
    }
    @Test void categoryCreationAndImageOwnershipAreAuthorOnly() throws Exception {
        String author=user("AUTHOR"),reviewer=user("REVIEWER");
        mvc.perform(post("/api/v1/editorial/categories").header("Authorization","Bearer "+author).contentType("application/json").content("{\"name\":\"Nowa kategoria\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.label_pl").value("Nowa kategoria"));
        mvc.perform(post("/api/v1/editorial/categories").header("Authorization","Bearer "+reviewer).contentType("application/json").content("{\"name\":\"No access\"}")).andExpect(status().isForbidden());
        var d=draft("DRAFT");d.put("coverId",UUID.randomUUID());
        mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+author).contentType("application/json").content(json.writeValueAsString(d))).andExpect(status().isBadRequest());
    }
}
