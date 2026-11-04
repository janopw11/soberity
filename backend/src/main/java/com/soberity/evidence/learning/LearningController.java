package com.soberity.evidence.learning;

import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class LearningController {
    private final LearningService service;
    private final LearningAnswerLimiter limiter;
    public LearningController(LearningService service, LearningAnswerLimiter limiter) {this.service=service;this.limiter=limiter;}
    @GetMapping("/api/v1/learning/quizzes")
    public ResponseEntity<LearningService.Page> catalog(@RequestParam(defaultValue="en") String locale,@RequestParam(defaultValue="0") int page,@RequestParam(required=false) String category) {
        return noStore(service.catalog(locale,page,category));
    }
    @GetMapping("/api/v1/learning/quizzes/{id}")
    public ResponseEntity<Map<String,Object>> quiz(@PathVariable UUID id) {return noStore(service.quiz(id));}
    @PostMapping("/api/v1/learning/quizzes/{id}/answers")
    public ResponseEntity<Map<String,Object>> answer(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody LearningService.Answer input,HttpServletRequest request,HttpServletResponse response) {
        if(!limiter.allow(actor==null?"ip:"+request.getRemoteAddr():"uid:"+actor.uid())) {
            response.setHeader("Retry-After","60");
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Please wait before answering again.");
        }
        return noStore(service.answer(actor,id,input));
    }
    @GetMapping("/api/v1/me/learning/quizzes/results")
    public ResponseEntity<List<Map<String,Object>>> results(@AuthenticationPrincipal VerifiedToken actor) {return noStore(service.results(actor));}
    @PostMapping("/api/v1/me/learning/quizzes/{id}/complete")
    public ResponseEntity<Map<String,Object>> complete(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody LearningService.Completion input) {return noStore(service.complete(actor,id,input));}
    @GetMapping("/api/v1/me/learning/quizzes/{id}")
    public ResponseEntity<Map<String,Object>> progress(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return noStore(service.progress(actor,id));}
    @GetMapping("/api/v1/me/learning/flashcards")
    public ResponseEntity<List<UUID>> flashcards(@AuthenticationPrincipal VerifiedToken actor) {return noStore(service.flashcardProgress(actor));}
    public record Card(UUID revisionId) { }
    @PutMapping("/api/v1/me/learning/flashcards/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remember(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Card input) {service.rememberCard(actor,id,input.revisionId());}
    @DeleteMapping("/api/v1/me/learning")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forget(@AuthenticationPrincipal VerifiedToken actor) {service.forget(actor);}
    @GetMapping("/api/v1/editorial/quizzes")
    public ResponseEntity<LearningService.Page> editorial(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) {return noStore(service.editorialList(actor,page));}
    @GetMapping("/api/v1/editorial/quizzes/{id}")
    public ResponseEntity<Map<String,Object>> editorialDetail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return noStore(service.editorialDetail(actor,id));}
    @PostMapping("/api/v1/editorial/quizzes")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody LearningService.Draft input) {return Map.of("id",service.create(actor,input));}
    @PutMapping("/api/v1/editorial/quizzes/{id}/presentation")
    public ResponseEntity<Map<String,Object>> presentation(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody LearningService.Presentation input) {return noStore(service.presentation(actor,id,input));}
    @PostMapping("/api/v1/editorial/quizzes/{id}/decision")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decide(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody LearningService.Decision input) {service.decide(actor,id,input);}
    @ExceptionHandler({IllegalArgumentException.class,NullPointerException.class})
    public ResponseEntity<ProblemDetail> invalid(Exception ex) {return ResponseEntity.badRequest().body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Invalid quiz input."));}
    private <T> ResponseEntity<T> noStore(T value) {return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value);}
}
