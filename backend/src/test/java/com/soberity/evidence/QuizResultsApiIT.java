package com.soberity.evidence;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.support.AbstractIntegrationTest;
import com.soberity.identity.token.VerifiedToken;
import com.soberity.evidence.learning.LearningService;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;
class QuizResultsApiIT extends AbstractIntegrationTest {
 @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired JsonMapper json; @Autowired LearningService service;
 record Fixture(UUID id,List<LearningService.Question> questions) { }
 String user(boolean verified) throws Exception {String uid="result-"+UUID.randomUUID();when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,verified));return uid;}
 Fixture fixture() throws Exception {
  String author=user(true);jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,'AUTHOR','test')",author);
  var qs=new ArrayList<LearningService.Question>();
  for(int i=0;i<5;i++)qs.add(new LearningService.Question(UUID.randomUUID(),"TRUE_FALSE","Fixture question "+i,List.of(new LearningService.Option(UUID.randomUUID(),"True",true),new LearningService.Option(UUID.randomUUID(),"False",false)),"Fixture explanation",null,null,List.of(new LearningService.Source("Fixture source","https://example.test/research"))));
  return new Fixture(service.create(new VerifiedToken(author,true),new LearningService.Draft("en","Fixture quiz",qs,"PUBLISH")),qs);
 }
 LearningService.Completion input(Fixture f,int correct,String attempt) {
  var answers=new ArrayList<LearningService.Answer>();for(int i=0;i<5;i++)answers.add(new LearningService.Answer(f.questions.get(i).id(),List.of(f.questions.get(i).options().get(i<correct?0:1).id()),false));return new LearningService.Completion(attempt,answers);
 }
 String complete(String uid,Fixture f,int correct,String attempt) throws Exception {
  return mvc.perform(post("/api/v1/me/learning/quizzes/"+f.id+"/complete").header("Authorization","Bearer "+uid).contentType("application/json").content(json.writeValueAsString(input(f,correct,attempt)))).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.percentage").value(correct*20)).andReturn().getResponse().getContentAsString();
 }
 @Test void serverScoresRetakesLatestResultAndIdempotence() throws Exception {
  var f=fixture();String uid=user(true),first=complete(uid,f,1,"first-attempt");assertThat(complete(uid,f,1,"first-attempt")).isEqualTo(first);
  complete(uid,f,4,"second-attempt");
  // A delayed retry must not erase the optional answers of an active retake.
  jdbc.update("INSERT INTO learning_progress(firebase_uid,quiz_id) VALUES (?,?)",uid,f.id);
  complete(uid,f,1,"first-attempt");
  mvc.perform(get("/api/v1/me/learning/quizzes/results").header("Authorization","Bearer "+uid)).andExpect(status().isOk()).andExpect(jsonPath("$[0].percentage").value(80)).andExpect(jsonPath("$[0].version").value(1)).andExpect(jsonPath("$[0].firebase_uid").doesNotExist());
  assertThat(jdbc.queryForObject("SELECT count(*) FROM learning_quiz_result WHERE firebase_uid=?",Integer.class,uid)).isEqualTo(2);
  assertThat(jdbc.queryForObject("SELECT count(*) FROM learning_progress WHERE firebase_uid=?",Integer.class,uid)).isEqualTo(1);
 }
 @Test void resultsArePrivateAndRequireVerifiedIdentity() throws Exception {
  var f=fixture();String owner=user(true),other=user(true),unverified=user(false);complete(owner,f,5,"owner-attempt");
  mvc.perform(get("/api/v1/me/learning/quizzes/results")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/v1/me/learning/quizzes/results").header("Authorization","Bearer "+unverified)).andExpect(status().isForbidden());
  mvc.perform(get("/api/v1/me/learning/quizzes/results").header("Authorization","Bearer "+other)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
  mvc.perform(post("/api/v1/me/learning/quizzes/"+f.id+"/complete").contentType("application/json").content(json.writeValueAsString(input(f,0,"guest-attempt")))).andExpect(status().isUnauthorized());
 }
 @Test void rejectsIncompleteAnswersAndChangesToCompletedScore() throws Exception {
  var f=fixture();String uid=user(true);var answers=input(f,0,"fixture-attempt").answers();
  var duplicateQuestion=new ArrayList<>(answers);duplicateQuestion.set(1,answers.getFirst());
  var unknownQuestion=new ArrayList<>(answers);unknownQuestion.set(0,new LearningService.Answer(UUID.randomUUID(),answers.getFirst().selectedOptionIds(),false));
  var unknownOption=new ArrayList<>(answers);unknownOption.set(0,new LearningService.Answer(answers.getFirst().questionId(),List.of(UUID.randomUUID()),false));
  var duplicateOption=new ArrayList<>(answers);duplicateOption.set(0,new LearningService.Answer(answers.getFirst().questionId(),List.of(answers.getFirst().selectedOptionIds().getFirst(),answers.getFirst().selectedOptionIds().getFirst()),false));
  for(var invalid:List.of(answers.subList(0,4),duplicateQuestion,unknownQuestion,unknownOption,duplicateOption))
   mvc.perform(post("/api/v1/me/learning/quizzes/"+f.id+"/complete").header("Authorization","Bearer "+uid).contentType("application/json").content(json.writeValueAsString(new LearningService.Completion("invalid-attempt",invalid)))).andExpect(status().isBadRequest());
  complete(uid,f,0,"checked-attempt");
  mvc.perform(post("/api/v1/me/learning/quizzes/"+f.id+"/complete").header("Authorization","Bearer "+uid).contentType("application/json").content(json.writeValueAsString(input(f,5,"checked-attempt")))).andExpect(status().isConflict());
 }
 @Test void forgetAndAccountDeletionEraseResultsAndPreventRecreation() throws Exception {
  var f=fixture();String uid=user(true);complete(uid,f,2,"forget-attempt");mvc.perform(delete("/api/v1/me/learning").header("Authorization","Bearer "+uid)).andExpect(status().isNoContent());
  assertThat(jdbc.queryForObject("SELECT count(*) FROM learning_quiz_result WHERE firebase_uid=?",Integer.class,uid)).isZero();
  complete(uid,f,3,"delete-attempt");jdbc.update("INSERT INTO deleted_account(firebase_uid,requested_at) VALUES (?,clock_timestamp())",uid);
  assertThat(jdbc.queryForObject("SELECT count(*) FROM learning_quiz_result WHERE firebase_uid=?",Integer.class,uid)).isZero();
  mvc.perform(post("/api/v1/me/learning/quizzes/"+f.id+"/complete").header("Authorization","Bearer "+uid).contentType("application/json").content(json.writeValueAsString(input(f,5,"after-deletion")))).andExpect(status().isForbidden());
 }
 @Test void categoriesAndBackgroundsCanBeEditedWithoutChangingQuestionsOrResults() throws Exception {
  var f=fixture();String owner=jdbc.queryForObject("SELECT author_uid FROM learning_quiz WHERE id=?",String.class,f.id);
  String other=user(true);jdbc.update("INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES (?,'AUTHOR','test')",other);
  var image=new java.awt.image.BufferedImage(300,300,java.awt.image.BufferedImage.TYPE_INT_RGB);
  var bytes=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",bytes);
  var upload=mvc.perform(multipart("/api/v1/editorial/media").file(new org.springframework.mock.web.MockMultipartFile("file","background.png","image/png",bytes.toByteArray()))
    .param("purpose","COVER").param("alt","Synthetic background").header("Authorization","Bearer "+owner))
    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
  UUID cover=UUID.fromString(json.readTree(upload).get("id").asText());
  mvc.perform(get("/api/v1/science/media/"+cover)).andExpect(status().isNotFound());
  complete(owner,f,5,"before-presentation");
  String url="/api/v1/editorial/quizzes/"+f.id+"/presentation";
  var update=new LearningService.Presentation("brain",cover,1);
  mvc.perform(put(url).header("Authorization","Bearer "+other).contentType("application/json").content(json.writeValueAsString(update))).andExpect(status().isForbidden());
  mvc.perform(put(url).header("Authorization","Bearer "+owner).contentType("application/json").content(json.writeValueAsString(update)))
   .andExpect(status().isOk()).andExpect(jsonPath("$.category_code").value("brain")).andExpect(jsonPath("$.cover_id").value(cover.toString()))
   .andExpect(jsonPath("$.presentation_version").value(2)).andExpect(jsonPath("$.version").value(1));
  mvc.perform(get("/api/v1/science/media/"+cover)).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));
  mvc.perform(get("/api/v1/learning/quizzes").param("category","brain")).andExpect(status().isOk())
    .andExpect(jsonPath("$.items[*].category_code",org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("brain"))));
  mvc.perform(get("/api/v1/learning/quizzes").param("category","invalid")).andExpect(status().isBadRequest());
  mvc.perform(put(url).header("Authorization","Bearer "+owner).contentType("application/json").content(json.writeValueAsString(update))).andExpect(status().isConflict());
  mvc.perform(get("/api/v1/me/learning/quizzes/results").header("Authorization","Bearer "+owner)).andExpect(status().isOk()).andExpect(jsonPath("$[0].percentage").value(100));
  mvc.perform(put(url).header("Authorization","Bearer "+owner).contentType("application/json").content(json.writeValueAsString(new LearningService.Presentation("sport",null,2)))).andExpect(status().isOk());
  mvc.perform(get("/api/v1/science/media/"+cover)).andExpect(status().isNotFound());
  mvc.perform(put(url).header("Authorization","Bearer "+other).contentType("application/json").content(json.writeValueAsString(new LearningService.Presentation("sport",cover,3)))).andExpect(status().isForbidden());
 }
 @Test void rejectsForeignAndInlineCoversAndKeepsUnpublishedQuizImagesPrivate() throws Exception {
  var f=fixture();String owner=jdbc.queryForObject("SELECT author_uid FROM learning_quiz WHERE id=?",String.class,f.id);
  UUID foreign=UUID.randomUUID(),inline=UUID.randomUUID();
  jdbc.update("INSERT INTO editorial_media(id,owner_uid,purpose,alt_text,width,height,data) VALUES (?,'another-user','COVER','Fixture',1,1,?)",foreign,new byte[]{1});
  jdbc.update("INSERT INTO editorial_media(id,owner_uid,purpose,alt_text,width,height,data) VALUES (?,?,'INLINE','Fixture',1,1,?)",inline,owner,new byte[]{1});
  for(UUID cover:List.of(foreign,inline))mvc.perform(put("/api/v1/editorial/quizzes/"+f.id+"/presentation").header("Authorization","Bearer "+owner).contentType("application/json").content(json.writeValueAsString(new LearningService.Presentation("brain",cover,1)))).andExpect(status().isBadRequest());
  UUID draftCover=UUID.randomUUID();jdbc.update("INSERT INTO editorial_media(id,owner_uid,purpose,alt_text,width,height,data) VALUES (?,?,'COVER','Fixture',1,1,?)",draftCover,owner,new byte[]{1});
  UUID draft=service.create(new VerifiedToken(owner,true),new LearningService.Draft("en","Draft background",f.questions,"REVIEW","relationships",draftCover));
  mvc.perform(get("/api/v1/science/media/"+draftCover)).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/learning/quizzes/"+draft)).andExpect(status().isNotFound());
 }

}
