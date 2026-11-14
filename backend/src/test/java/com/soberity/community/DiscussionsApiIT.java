package com.soberity.community;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.support.AbstractIntegrationTest;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class DiscussionsApiIT extends AbstractIntegrationTest {
 @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired JsonMapper json;
 String admin,me,other,article,topic,title;
 @BeforeEach void setup()throws Exception{
  admin=user("AUTHOR","REVIEWER");me=user();other=user();title="Topic-"+UUID.randomUUID();
  var body=Map.of("kind","ARTICLE","title","Synthetic article","categoryCode","sleep","action","PUBLISH","document",Map.of("type","doc","content",List.of(Map.of("type","paragraph","content",List.of(Map.of("type","text","text","Synthetic content"))))),"evidence",List.of(Map.of("title","Fixture source","url","https://example.test/source")));
  article=json.readTree(mvc.perform(post("/api/v1/editorial/posts").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asText();
  topic=json.readTree(mvc.perform(post("/api/v1/editorial/discussions").header("Authorization","Bearer "+admin).contentType("application/json").content(topicBody("OPEN",1))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
 }
 String user(String...roles)throws Exception{String uid="discussion-"+UUID.randomUUID();when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,true));jdbc.update("INSERT INTO user_profile(id,firebase_uid,display_name,created_at,updated_at) VALUES (?,?,'Reader',now(),now())",UUID.randomUUID(),uid);for(String role:roles)jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,?,'test')",uid,role);return uid;}
 String topicBody(String status,int version)throws Exception{return json.writeValueAsString(Map.of("title",title,"articleType","POST","articleId",article,"status",status,"expectedVersion",version));}
 String body(String content,String parent)throws Exception{var map=new LinkedHashMap<String,Object>();map.put("content",content);map.put("kind","OPINION");map.put("parentId",parent);return json.writeValueAsString(map);}
 String add(String who,String parent)throws Exception{return json.readTree(mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+who).contentType("application/json").content(body("Personal opinion <script>alert(1)</script>",parent))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();}
 @Test void readsSearchesFiltersPaginatesAndLinksArticle()throws Exception{
  add(me,null);add(other,null);
  mvc.perform(get("/api/v1/discussions").param("q",title.toLowerCase()).param("category","sleep").param("sort","POPULAR").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].comment_count").value(2)).andExpect(jsonPath("$.items[0].article_id").value(article));
  mvc.perform(get("/api/v1/discussions").param("q",title).param("category","brain")).andExpect(jsonPath("$.total").value(0));
  mvc.perform(get("/api/v1/discussions").param("articleType","POST").param("articleId",article)).andExpect(jsonPath("$.items[0].id").value(topic));
  mvc.perform(get("/api/v1/discussions/"+topic+"/comments").param("size","1").param("page","1")).andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items[0].author_ref").doesNotExist()).andExpect(jsonPath("$.items[0].profile_id").doesNotExist()).andExpect(jsonPath("$.items[0].author_name").value("Reader"));
  mvc.perform(get("/api/v1/science/posts/"+article)).andExpect(status().isOk()).andExpect(jsonPath("$.document").exists());
 }
 @Test void repliesOnlyOneLevelAndSameDiscussion()throws Exception{
  String root=add(me,null),reply=add(other,root);
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body("too deep",reply))).andExpect(status().isBadRequest());
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body("missing parent",UUID.randomUUID().toString()))).andExpect(status().isBadRequest());
  mvc.perform(get("/api/v1/discussions/"+topic+"/comments").param("parentId",root)).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].id").value(reply));
  mvc.perform(delete("/api/v1/me/discussion-comments/"+root).header("Authorization","Bearer "+me)).andExpect(status().isNoContent());
  mvc.perform(get("/api/v1/discussions/"+topic+"/comments")).andExpect(jsonPath("$.items[0].content").value("")).andExpect(jsonPath("$.items[0].reply_count").value(1));
 }
 @Test void ownershipAndParticipationArePrivateAndErasureScrubsContent()throws Exception{
  String id=add(me,null);
  mvc.perform(delete("/api/v1/me/discussion-comments/"+id).header("Authorization","Bearer "+other)).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/me/discussions").header("Authorization","Bearer "+me)).andExpect(jsonPath("$.total").value(1));
  mvc.perform(get("/api/v1/me/discussions").header("Authorization","Bearer "+other)).andExpect(jsonPath("$.total").value(0));
  jdbc.update("INSERT INTO deleted_account(firebase_uid,requested_at) VALUES (?,now())",me);
  assertThat(jdbc.queryForMap("SELECT content,author_ref,profile_id,status FROM discussion_comment WHERE id=?",UUID.fromString(id))).containsEntry("content","").containsEntry("author_ref",null).containsEntry("status","DELETED");
  mvc.perform(get("/api/v1/discussions/"+topic)).andExpect(jsonPath("$.comment_count").value(0));
 }
 @Test void moderationHidesRestoresAndPermanentlyRemoves()throws Exception{
  String id=add(me,null);
  mvc.perform(put("/api/v1/editorial/discussion-comments/"+id).header("Authorization","Bearer "+me).contentType("application/json").content("{\"status\":\"HIDDEN\"}")).andExpect(status().isForbidden());
  for(String state:List.of("HIDDEN","VISIBLE","REMOVED")){
   mvc.perform(put("/api/v1/editorial/discussion-comments/"+id).header("Authorization","Bearer "+admin).contentType("application/json").content("{\"status\":\""+state+"\"}")).andExpect(status().isNoContent());
   mvc.perform(get("/api/v1/discussions/"+topic)).andExpect(jsonPath("$.comment_count").value(state.equals("VISIBLE")?1:0));
   if(state.equals("HIDDEN")){
    mvc.perform(get("/api/v1/discussions/"+topic+"/comments")).andExpect(jsonPath("$.items[0].content").value(""));
    mvc.perform(get("/api/v1/editorial/discussions/"+topic+"/comments").header("Authorization","Bearer "+admin)).andExpect(jsonPath("$.items[0].content").value("Personal opinion <script>alert(1)</script>"));
   }
  }
  mvc.perform(put("/api/v1/editorial/discussion-comments/"+id).header("Authorization","Bearer "+admin).contentType("application/json").content("{\"status\":\"VISIBLE\"}")).andExpect(status().isConflict());
 }
 @Test void topicAuthorizationVisibilityAndVersionConflicts()throws Exception{
  mvc.perform(post("/api/v1/editorial/discussions").header("Authorization","Bearer "+me).contentType("application/json").content(topicBody("OPEN",1))).andExpect(status().isForbidden());
  mvc.perform(post("/api/v1/editorial/discussions").header("Authorization","Bearer "+admin).contentType("application/json").content(topicBody("OPEN",1))).andExpect(status().isConflict());
  mvc.perform(put("/api/v1/editorial/discussions/"+topic).header("Authorization","Bearer "+admin).contentType("application/json").content(topicBody("CLOSED",1))).andExpect(status().isOk());
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body("Closed",null))).andExpect(status().isConflict());
  mvc.perform(put("/api/v1/editorial/discussions/"+topic).header("Authorization","Bearer "+admin).contentType("application/json").content(topicBody("HIDDEN",1))).andExpect(status().isConflict());
  mvc.perform(put("/api/v1/editorial/discussions/"+topic).header("Authorization","Bearer "+admin).contentType("application/json").content(topicBody("HIDDEN",2))).andExpect(status().isOk());
  mvc.perform(get("/api/v1/discussions/"+topic)).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/editorial/discussions/"+topic).header("Authorization","Bearer "+admin)).andExpect(status().isOk());
 }
 @Test void rejectsUnauthenticatedUnverifiedAndInvalidInputs()throws Exception{
  mvc.perform(get("/api/v1/me/discussions")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").contentType("application/json").content(body("hello",null))).andExpect(status().isUnauthorized());
  String unverified="unverified-"+UUID.randomUUID();when(tokenVerifier.verify(unverified)).thenReturn(new VerifiedToken(unverified,false));
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+unverified).contentType("application/json").content(body("hello",null))).andExpect(status().isForbidden());
  for(String content:List.of(" ","x".repeat(4001),"bad\u0000text"))mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body(content,null))).andExpect(status().isBadRequest());
  for(String[] param:new String[][]{{"page","-1"},{"size","0"},{"sort","BAD"},{"q","x".repeat(201)},{"articleType","BAD"},{"category","' OR 1=1"}})mvc.perform(get("/api/v1/discussions").param(param[0],param[1])).andExpect(status().isBadRequest());
 }
 @Test void unpublishedArticleHidesDiscussionButModerationRemainsAvailable()throws Exception{
  add(me,null);
  jdbc.update("UPDATE editorial_post_version SET status='ARCHIVED' WHERE post_id=?",UUID.fromString(article));
  mvc.perform(get("/api/v1/discussions/"+topic)).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/discussions").param("articleId",article)).andExpect(jsonPath("$.total").value(0));
  mvc.perform(get("/api/v1/editorial/discussions/"+topic+"/comments").header("Authorization","Bearer "+admin)).andExpect(status().isOk());
 }

 @Test void legacyArticleLinksExactReviewedRevisionAndHidesWhenEvidenceArchived()throws Exception{
  var fixture=fixture("en","PUBLISHED");UUID legacy=article(fixture,"PUBLISHED");
  String input=json.writeValueAsString(Map.of("title","Legacy discussion","articleType","ARTICLE","articleId",legacy,"status","OPEN"));
  String id=json.readTree(mvc.perform(post("/api/v1/editorial/discussions").header("Authorization","Bearer "+admin).contentType("application/json").content(input)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
  mvc.perform(get("/api/v1/discussions").param("articleType","ARTICLE").param("articleId",legacy.toString())).andExpect(jsonPath("$.items[0].id").value(id));
  mvc.perform(get("/api/v1/science/articles/"+legacy)).andExpect(status().isOk());
  jdbc.update("UPDATE claim_revision SET status='ARCHIVED' WHERE id=?",fixture.revision);
  mvc.perform(get("/api/v1/discussions/"+id)).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/editorial/discussions/"+id).header("Authorization","Bearer "+admin)).andExpect(status().isOk());
 }
 @Test void deleteIsIdempotentCountsAndModerationCannotResurrectDeletedText()throws Exception{
  String id=add(me,null);
  for(int i=0;i<2;i++)mvc.perform(delete("/api/v1/me/discussion-comments/"+id).header("Authorization","Bearer "+me)).andExpect(status().isNoContent());
  mvc.perform(put("/api/v1/editorial/discussion-comments/"+id).header("Authorization","Bearer "+admin).contentType("application/json").content("{\"status\":\"VISIBLE\"}")).andExpect(status().isConflict());
  mvc.perform(get("/api/v1/me/discussions").header("Authorization","Bearer "+me)).andExpect(jsonPath("$.total").value(0));
 }
 @Test void rejectsCrossDiscussionParentInvalidKindAndRateLimits()throws Exception{
  String root=add(me,null);var f=fixture("en","PUBLISHED");UUID legacy=article(f,"PUBLISHED"),otherTopic=UUID.randomUUID();
  jdbc.update("INSERT INTO science_discussion(id,title,article_revision_id,status) SELECT ?,'Other topic',id,'OPEN' FROM science_article WHERE article_id=?",otherTopic,legacy);
  mvc.perform(post("/api/v1/me/discussions/"+otherTopic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body("Wrong thread",root))).andExpect(status().isBadRequest());
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content("{\"content\":\"Hello\",\"kind\":\"VERIFIED_FACT\"}")).andExpect(status().isBadRequest());
  for(int i=1;i<20;i++)add(me,null);
  mvc.perform(post("/api/v1/me/discussions/"+topic+"/comments").header("Authorization","Bearer "+me).contentType("application/json").content(body("Too many",null))).andExpect(status().isTooManyRequests());
 }
 record Fixture(UUID claim,UUID revision,UUID source,String category) { }
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
