package com.soberity.evidence.learning;

import com.soberity.evidence.application.SciencePublicReader;
import com.soberity.evidence.editorial.EditorialService;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** Quiz authors may publish directly or request review; public DTOs never expose the answer key. */
@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class LearningService {
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    private final EditorialService editorial;
    private final SciencePublicReader science;
    public LearningService(JdbcTemplate jdbc, JsonMapper json, EditorialService editorial, SciencePublicReader science) {
        this.jdbc=jdbc; this.json=json; this.editorial=editorial; this.science=science;
    }
    public record Option(UUID id, String label, boolean correct) { }
    public record Source(String title, String url) { }
    public record Question(UUID id, String type, String prompt, List<Option> options, String explanation,
                           UUID claimId, UUID revisionId, List<Source> sources) { }
    public record Definition(List<Question> questions) { }
    public record Draft(String locale, String title, List<Question> questions, String action, String categoryCode, UUID coverId) {
        public Draft(String locale,String title,List<Question> questions,String action) {this(locale,title,questions,action,"alco-facts",null);}
    }
    public record Presentation(String categoryCode,UUID coverId,Integer expectedVersion) { }
    public record Answer(UUID questionId, List<UUID> selectedOptionIds, boolean saveProgress) { }
    public record Completion(String attemptId, List<Answer> answers) { }
    public record Decision(String action, String notes) { }
    public record Page(List<Map<String,Object>> items, int page, int size, long total) { }
    private static final String LIVE = " q.status='PUBLISHED' AND jsonb_array_length(q.definition->'questions')>0 "
        + "AND NOT EXISTS (SELECT 1 FROM learning_quiz_evidence e JOIN claim_revision r ON r.id=e.revision_id "
        + "WHERE e.quiz_id=q.id AND (r.status<>'PUBLISHED' OR NOT EXISTS (SELECT 1 FROM scientific_review sr WHERE sr.revision_id=r.id AND sr.decision='APPROVED'))) ";

    public Page catalog(String locale,int page) {return catalog(locale,page,null);}
    public Page catalog(String locale,int page,String category) {
        locale(locale); page(page);
        if(category!=null) category(category);
        String where=LIVE+" AND q.locale=?";
        var args=new ArrayList<Object>();args.add(locale);
        if(category!=null){where+=" AND q.category_code=?";args.add(category);}
        long total=jdbc.queryForObject("SELECT count(*) FROM learning_quiz q WHERE "+where,Long.class,args.toArray());
        args.add((long)page*20);
        var rows=jdbc.queryForList("SELECT q.id,q.title,q.locale,q.version,q.publication_route,q.published_at,q.category_code,q.cover_id,(SELECT alt_text FROM editorial_media m WHERE m.id=q.cover_id) AS cover_alt,jsonb_array_length(q.definition->'questions') AS question_count FROM learning_quiz q WHERE "+where+" ORDER BY q.published_at DESC,q.id LIMIT 20 OFFSET ?",args.toArray());
        return new Page(rows,page,20,total);
    }
    public Map<String,Object> quiz(UUID id) {
        var row=live(id);
        Definition definition=definition(row);
        var result=new LinkedHashMap<String,Object>();
        for(String key:List.of("id","title","locale","version","publication_route","published_at","category_code","cover_id")) result.put(key,row.get(key));
        result.put("questions",definition.questions().stream().map(q -> Map.of(
            "id",q.id(),"type",q.type(),"prompt",q.prompt(),
            "options",q.options().stream().map(o -> Map.of("id",o.id(),"label",o.label())).toList())).toList());
        return result;
    }
    public Map<String,Object> answer(VerifiedToken actor, UUID id, Answer input) {
        if(input==null || input.questionId()==null || input.selectedOptionIds()==null || input.selectedOptionIds().size()>6) throw bad();
        // Account-scoped lock also serializes concurrent answers and account erasure.
        if(input.saveProgress()) progressActor(actor);
        var row=live(id);
        Question question=definition(row).questions().stream().filter(q -> q.id().equals(input.questionId())).findFirst().orElseThrow(LearningService::bad);
        var selected=new HashSet<>(input.selectedOptionIds());
        if(selected.isEmpty() || selected.size()!=input.selectedOptionIds().size() || selected.contains(null)
            || !question.options().stream().map(Option::id).toList().containsAll(selected)
            || (!question.type().equals("MULTIPLE_CHOICE") && selected.size()!=1)) throw bad();
        var result=grade(question,selected);
        if(input.saveProgress()) {
            jdbc.update("INSERT INTO learning_progress(firebase_uid,quiz_id) VALUES (?,?) ON CONFLICT DO NOTHING",actor.uid(),id);
            jdbc.update("UPDATE learning_progress SET answers=jsonb_set(answers,ARRAY[?]::text[],?::jsonb,true),updated_at=clock_timestamp() WHERE firebase_uid=? AND quiz_id=?",
                question.id().toString(),json.writeValueAsString(input.selectedOptionIds()),actor.uid(),id);
        }
        result.put("saved",input.saveProgress());
        return result;
    }
    private Map<String,Object> grade(Question question, Set<UUID> selected) {
        var correct=question.options().stream().filter(Option::correct).map(Option::id).toList();
        var result=new LinkedHashMap<String,Object>();
        result.put("question_id",question.id()); result.put("correct",selected.equals(new HashSet<>(correct)));
        result.put("selected_option_ids",selected); result.put("correct_option_ids",correct);
        result.put("sources",question.sources()==null?List.of():question.sources());
        result.put("explanation",question.explanation()); result.put("claim_id",question.claimId()); result.put("revision_id",question.revisionId());
        return result;
    }
    public Map<String,Object> progress(VerifiedToken actor,UUID id) {
        progressActor(actor); var row=live(id);
        var answers=storedAnswers(actor.uid(),id);
        var results=new ArrayList<Map<String,Object>>();
        for(var question:definition(row).questions()) {
            var ids=answers.get(question.id().toString());
            if(ids!=null) results.add(grade(question,new HashSet<>(ids)));
        }
        return Map.of("quiz_id",id,"version",row.get("version"),"answers",results);
    }
    public Map<String,Object> complete(VerifiedToken actor,UUID id,Completion input) {
        progressActor(actor);
        if(input==null || input.attemptId()==null || !input.attemptId().matches("[a-zA-Z0-9-]{8,100}") || input.answers()==null) throw bad();
        var row=live(id);
        var questions=definition(row).questions();
        if(input.answers().size()!=questions.size()) throw bad();
        var submitted=new HashMap<UUID,Answer>();
        for(var answer:input.answers()) {
            if(answer==null || answer.questionId()==null || submitted.put(answer.questionId(),answer)!=null) throw bad();
        }
        int correct=0;
        for(var question:questions) {
            var answer=submitted.get(question.id());
            if(answer==null || answer.selectedOptionIds()==null || answer.selectedOptionIds().size()>6) throw bad();
            var selected=new HashSet<>(answer.selectedOptionIds());
            if(selected.isEmpty() || selected.contains(null) || selected.size()!=answer.selectedOptionIds().size()
                || !question.options().stream().map(Option::id).toList().containsAll(selected)
                || (!question.type().equals("MULTIPLE_CHOICE") && selected.size()!=1)) throw bad();
            if(Boolean.TRUE.equals(grade(question,selected).get("correct"))) correct++;
        }
        int inserted=jdbc.update("INSERT INTO learning_quiz_result(firebase_uid,quiz_id,attempt_id,version,correct_count,question_count) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING",
            actor.uid(),id,input.attemptId(),row.get("version"),correct,questions.size());
        var result=jdbc.queryForMap("SELECT quiz_id,attempt_id,version,correct_count,question_count,round(100.0*correct_count/question_count)::int AS percentage,completed_at FROM learning_quiz_result WHERE firebase_uid=? AND quiz_id=? AND attempt_id=?",actor.uid(),id,input.attemptId());
        if(((Number)result.get("correct_count")).intValue()!=correct || ((Number)result.get("question_count")).intValue()!=questions.size())
            throw error(HttpStatus.CONFLICT,"This completed attempt cannot be changed.");
        // Retakes begin with fresh optional progress; the completed summary remains available.
        if(inserted>0) jdbc.update("DELETE FROM learning_progress WHERE firebase_uid=? AND quiz_id=?",actor.uid(),id);
        return result;
    }
    public List<Map<String,Object>> results(VerifiedToken actor) {
        progressActor(actor);
        return jdbc.queryForList("SELECT DISTINCT ON (r.quiz_id) r.quiz_id,r.attempt_id,r.version,r.correct_count,r.question_count,round(100.0*r.correct_count/r.question_count)::int AS percentage,r.completed_at FROM learning_quiz_result r JOIN learning_quiz q ON q.id=r.quiz_id AND q.version=r.version WHERE r.firebase_uid=? AND "+LIVE+" ORDER BY r.quiz_id,r.completed_at DESC,r.attempt_id DESC",actor.uid());
    }
    public void forget(VerifiedToken actor) {
        progressActor(actor);
        jdbc.update("DELETE FROM learning_progress WHERE firebase_uid=?",actor.uid());
        jdbc.update("DELETE FROM learning_flashcard_progress WHERE firebase_uid=?",actor.uid());
        jdbc.update("DELETE FROM learning_quiz_result WHERE firebase_uid=?",actor.uid());
    }
    public List<UUID> flashcardProgress(VerifiedToken actor) {
        progressActor(actor);
        return jdbc.queryForList("SELECT p.revision_id FROM learning_flashcard_progress p JOIN claim_revision r ON r.id=p.revision_id WHERE p.firebase_uid=? AND r.status='PUBLISHED'",UUID.class,actor.uid());
    }
    public void rememberCard(VerifiedToken actor,UUID claimId,UUID revisionId) {
        progressActor(actor);
        var claim=science.claim(claimId);
        if(!Objects.equals(claim.get("revision_id"),revisionId)) throw error(HttpStatus.CONFLICT,"Evidence changed. Reload the card.");
        jdbc.update("INSERT INTO learning_flashcard_progress(firebase_uid,revision_id) VALUES (?,?) ON CONFLICT(firebase_uid,revision_id) DO UPDATE SET reviewed_at=clock_timestamp()",actor.uid(),revisionId);
    }
    public Page editorialList(VerifiedToken actor,int page) {
        reader(actor); page(page);
        long total=jdbc.queryForObject("SELECT count(*) FROM learning_quiz",Long.class);
        return new Page(jdbc.queryForList("SELECT id,title,locale,status,author_uid,reviewer_uid,review_notes,created_at,version,publication_route,category_code,cover_id,presentation_version FROM learning_quiz ORDER BY created_at DESC,id LIMIT 20 OFFSET ?",(long)page*20),page,20,total);
    }
    public Map<String,Object> editorialDetail(VerifiedToken actor,UUID id) {
        reader(actor); var row=one("SELECT * FROM learning_quiz WHERE id=?",id);
        row.put("definition",definition(row));
        row.put("audit",jdbc.queryForList("SELECT action,notes,created_at FROM learning_quiz_audit WHERE quiz_id=? ORDER BY created_at,id",id));
        return row;
    }
    public UUID create(VerifiedToken actor,Draft input) {
        require(actor,"AUTHOR");
        if(input==null || input.questions()==null || input.questions().isEmpty() || input.questions().size()>30) throw bad();
        String action=input.action()==null?"REVIEW":input.action();
        if(!Set.of("REVIEW","PUBLISH").contains(action)) throw bad();
        locale(input.locale()); String title=text(input.title(),300);
        var questionIds=new HashSet<UUID>(); var optionIds=new HashSet<UUID>();
        for(var q:input.questions()) {
            if(q==null || q.id()==null || !questionIds.add(q.id())) throw bad();
            if(!Set.of("TRUE_FALSE","SINGLE_CHOICE","MULTIPLE_CHOICE").contains(q.type())) throw bad();
            text(q.prompt(),2000); text(q.explanation(),6000);
            if(q.options()==null || q.options().size()<2 || q.options().size()>6) throw bad();
            int count=0;
            var labels=new HashSet<String>();
            for(var option:q.options()) {
                if(option==null || option.id()==null || !optionIds.add(option.id())) throw bad();
                if(!labels.add(text(option.label(),500).toLowerCase(Locale.ROOT))) throw bad();
                if(option.correct()) count++;
            }
            if(count==0 || count==q.options().size() || (!q.type().equals("MULTIPLE_CHOICE") && count!=1)
                || (q.type().equals("TRUE_FALSE") && (q.options().size()!=2 || !q.options().getFirst().label().equals(input.locale().equals("pl")?"Prawda":"True") || !q.options().getLast().label().equals(input.locale().equals("pl")?"Fałsz":"False")))) throw bad();
            sources(q.sources());
            if(q.claimId()!=null || q.revisionId()!=null) {
                if(q.claimId()==null || q.revisionId()==null) throw bad();
                var evidence=science.claim(q.claimId());
                if(!Objects.equals(evidence.get("revision_id"),q.revisionId()) || !Objects.equals(evidence.get("locale"),input.locale())) throw error(HttpStatus.CONFLICT,"Select a current published evidence revision in the quiz language.");
            } else if(q.sources()==null || q.sources().isEmpty()) {
                throw error(HttpStatus.BAD_REQUEST,"Every answer explanation requires a research source.");
            }
        }
        String category=input.categoryCode()==null?"alco-facts":input.categoryCode();category(category);checkCover(actor,input.coverId());
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO learning_quiz(id,locale,title,definition,author_uid,status,category_code,cover_id) VALUES (?,?,?,?::jsonb,?,'IN_REVIEW',?,?)",id,input.locale(),title,json.writeValueAsString(new Definition(input.questions())),actor.uid(),category,input.coverId());
        input.questions().stream().map(Question::revisionId).filter(Objects::nonNull).distinct().forEach(revision -> jdbc.update("INSERT INTO learning_quiz_evidence(quiz_id,revision_id) VALUES (?,?)",id,revision));
        audit(actor,id,action.equals("PUBLISH")?"CREATED":"SUBMITTED",action.equals("PUBLISH")?"Created for author publication":"Submitted for independent review");
        if(action.equals("PUBLISH")) decide(actor,id,new Decision("AUTHOR_PUBLISH","Published directly by author"));
        return id;
    }
    public Map<String,Object> presentation(VerifiedToken actor,UUID id,Presentation input) {
        require(actor,"AUTHOR");
        var row=one("SELECT * FROM learning_quiz WHERE id=? FOR UPDATE",id);
        if(!actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Only the quiz author can edit its presentation.");
        if("ARCHIVED".equals(row.get("status"))) throw error(HttpStatus.CONFLICT,"Archived quizzes cannot be edited.");
        if(input==null || input.expectedVersion()==null || input.expectedVersion().intValue()!=((Number)row.get("presentation_version")).intValue()) throw error(HttpStatus.CONFLICT,"Quiz presentation changed. Reload before saving.");
        category(input.categoryCode());checkCover(actor,input.coverId());
        jdbc.update("UPDATE learning_quiz SET category_code=?,cover_id=?,presentation_version=presentation_version+1 WHERE id=?",input.categoryCode(),input.coverId(),id);
        audit(actor,id,"PRESENTATION","Updated category or background image");
        return editorialDetail(actor,id);
    }
    private static void category(String value) {
        if(value==null || !Set.of("brain","relationships","alco-facts","sport").contains(value)) throw bad();
    }
    private void checkCover(VerifiedToken actor,UUID coverId) {
        if(coverId!=null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM editorial_media WHERE id=? AND owner_uid=? AND purpose='COVER')",Boolean.class,coverId,actor.uid())))
            throw error(HttpStatus.BAD_REQUEST,"Upload your own background image first.");
    }
    public void decide(VerifiedToken actor,UUID id,Decision input) {
        if(input==null) throw bad();
        var row=one("SELECT * FROM learning_quiz WHERE id=? FOR UPDATE",id);
        String notes=text(input.notes(),4000);
        if("PUBLISH".equals(input.action()) || "AUTHOR_PUBLISH".equals(input.action())) {
            boolean direct="AUTHOR_PUBLISH".equals(input.action());
            if(direct) {
                require(actor,"AUTHOR");
                if(!actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Only the quiz author can publish directly.");
            } else {
                require(actor,"REVIEWER");
                if(actor.uid().equals(row.get("author_uid"))) throw error(HttpStatus.FORBIDDEN,"Independent reviewer required.");
            }
            if(!"IN_REVIEW".equals(row.get("status"))) throw error(HttpStatus.CONFLICT,"Quiz is no longer in review.");
            // Lock every dependency against concurrent withdrawal while publishing.
            for(UUID revision:jdbc.queryForList("SELECT revision_id FROM learning_quiz_evidence WHERE quiz_id=? ORDER BY revision_id",UUID.class,id)) {
                var claim=one("SELECT status FROM claim_revision WHERE id=? FOR SHARE",revision);
                if(!"PUBLISHED".equals(claim.get("status"))) throw error(HttpStatus.CONFLICT,"Evidence has been withdrawn.");
            }
            jdbc.update("UPDATE learning_quiz SET status='PUBLISHED',publication_route=?,reviewer_uid=?,review_notes=?,published_at=clock_timestamp() WHERE id=?",direct?"AUTHOR":"REVIEWED",direct?null:actor.uid(),notes,id);
        } else if("ARCHIVE".equals(input.action())) {
            var roles=editorial.roles(actor);
            if(!roles.contains("REVIEWER") && !(roles.contains("AUTHOR") && actor.uid().equals(row.get("author_uid")))) throw error(HttpStatus.FORBIDDEN,"Editorial permission required.");
            if("ARCHIVED".equals(row.get("status"))) throw error(HttpStatus.CONFLICT,"Already archived.");
            jdbc.update("UPDATE learning_quiz SET status='ARCHIVED',review_notes=? WHERE id=?",notes,id);
        } else throw bad();
        audit(actor,id,input.action(),notes);
    }
    private static void sources(List<Source> sources) {
        if(sources==null) return; // Older questions use a pinned EvidenceClaim.
        if(sources.size()>10) throw bad();
        var urls=new HashSet<String>();
        for(var source:sources) {
            if(source==null) throw bad();
            text(source.title(),500);
            URI uri=URI.create(text(source.url(),2000));
            if(!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null
                || !urls.add(uri.toString())) throw error(HttpStatus.BAD_REQUEST,"Provide distinct HTTPS research source links.");
        }
    }
    private Map<String,List<UUID>> storedAnswers(String uid,UUID quizId) {
        var rows=jdbc.queryForList("SELECT a.key,a.value::text AS selected FROM learning_progress p CROSS JOIN LATERAL jsonb_each(p.answers) a WHERE p.firebase_uid=? AND p.quiz_id=?",uid,quizId);
        var result=new HashMap<String,List<UUID>>();
        for(var row:rows) result.put(row.get("key").toString(),Arrays.asList(json.readValue(row.get("selected").toString(),UUID[].class)));
        return result;
    }
    private Definition definition(Map<String,Object> row) { return json.readValue(row.get("definition").toString(),Definition.class); }
    private Map<String,Object> live(UUID id) {return one("SELECT q.* FROM learning_quiz q WHERE "+LIVE+" AND q.id=?",id);}
    private Map<String,Object> one(String sql,UUID id) {
        var rows=jdbc.queryForList(sql,id);
        if(rows.isEmpty()) throw error(HttpStatus.NOT_FOUND,"Learning content unavailable.");
        return new LinkedHashMap<>(rows.getFirst());
    }
    private void progressActor(VerifiedToken actor) {
        if(actor==null || !actor.emailVerified()) throw error(HttpStatus.FORBIDDEN,"Verified identity required.");
        jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",actor.uid());
        editorial.roles(actor); // Also checks account deletion, without requiring an editorial grant.
    }
    private void require(VerifiedToken actor,String role) {if(!editorial.roles(actor).contains(role)) throw error(HttpStatus.FORBIDDEN,"Editorial permission required.");}
    private void reader(VerifiedToken actor) {if(editorial.roles(actor).isEmpty()) throw error(HttpStatus.FORBIDDEN,"Editorial permission required.");}
    private void audit(VerifiedToken actor,UUID id,String action,String notes) {jdbc.update("INSERT INTO learning_quiz_audit(id,quiz_id,actor_uid,action,notes) VALUES (?,?,?,?,?)",UUID.randomUUID(),id,actor.uid(),action,notes);}
    private static void locale(String value) {if(!"en".equals(value) && !"pl".equals(value)) throw bad();}
    private static void page(int value) {if(value<0 || value>1000000) throw bad();}
    private static String text(String value,int max) {if(value==null || value.isBlank() || value.length()>max) throw bad();return value.strip();}
    private static ResponseStatusException bad() {return error(HttpStatus.BAD_REQUEST,"Invalid quiz, options or answer.");}
    private static ResponseStatusException error(HttpStatus status,String text) {return new ResponseStatusException(status,text);}
}
