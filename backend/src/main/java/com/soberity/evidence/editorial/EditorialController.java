package com.soberity.evidence.editorial;

import com.soberity.evidence.domain.SourceMetadata;
import com.soberity.evidence.editorial.EditorialService.*;
import com.soberity.identity.token.VerifiedToken;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Separate private namespace; public science endpoints remain read-only. */
@RestController
@RequestMapping("/api/v1/editorial")
public class EditorialController {
    private final EditorialService service;
    public EditorialController(EditorialService service) { this.service=service; }

    @GetMapping("/me")
    public Map<String,Object> me(@AuthenticationPrincipal VerifiedToken actor) {
        return Map.of("uid",actor.uid(),"roles",service.roles(actor));
    }
    @GetMapping("/materials")
    public Page list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="CLAIM") String type,
            @RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page) {
        return service.list(actor,type,status,page);
    }
    @GetMapping("/materials/{type}/{id}")
    public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable String type,@PathVariable UUID id) {
        return service.detail(actor,type,id);
    }
    @PostMapping("/sources")
    public Map<String,UUID> source(@AuthenticationPrincipal VerifiedToken actor,@RequestBody SourceMetadata input) {
        return Map.of("id",service.source(actor,input));
    }
    @PostMapping("/claims")
    public Map<String,UUID> claim(@AuthenticationPrincipal VerifiedToken actor,@RequestBody ClaimDraft input) {
        return Map.of("id",service.draftClaim(actor,null,input));
    }
    @PostMapping("/claims/{id}/revisions")
    public Map<String,UUID> reviseClaim(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody ClaimDraft input) {
        return Map.of("id",service.draftClaim(actor,id,input));
    }
    @PostMapping("/articles")
    public Map<String,UUID> article(@AuthenticationPrincipal VerifiedToken actor,@RequestBody ArticleDraft input) {
        return Map.of("id",service.draftArticle(actor,null,input));
    }
    @PostMapping("/articles/{id}/revisions")
    public Map<String,UUID> reviseArticle(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody ArticleDraft input) {
        return Map.of("id",service.draftArticle(actor,id,input));
    }
    @PostMapping("/claims/{id}/citations")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void citation(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Citation input) {
        service.citation(actor,id,input);
    }
    @DeleteMapping("/claims/{id}/citations/{citation}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@PathVariable UUID citation,@RequestBody Reason input) {
        service.removeCitation(actor,id,citation,input.reason());
    }
    @PostMapping("/materials/{type}/{id}/submit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable String type,@PathVariable UUID id,@RequestBody Reason input) {
        service.submit(actor,type,id,input.reason());
    }
    @PostMapping("/materials/{type}/{id}/review")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void review(@AuthenticationPrincipal VerifiedToken actor,@PathVariable String type,@PathVariable UUID id,@RequestBody Decision input) {
        service.review(actor,type,id,input);
    }
    @PostMapping("/materials/{type}/{id}/publish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@AuthenticationPrincipal VerifiedToken actor,@PathVariable String type,@PathVariable UUID id,@RequestBody Reason input) {
        service.publish(actor,type,id,input.reason());
    }
    @PostMapping("/materials/{type}/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal VerifiedToken actor,@PathVariable String type,@PathVariable UUID id,@RequestBody Reason input) {
        service.archive(actor,type,id,input.reason());
    }
    @ExceptionHandler({IllegalArgumentException.class,NullPointerException.class})
    ResponseEntity<ProblemDetail> invalid(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Invalid or incomplete editorial input."));
    }
    @ExceptionHandler({DataIntegrityViolationException.class,CannotAcquireLockException.class})
    ResponseEntity<ProblemDetail> conflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "The operation conflicts with the current version or scientific publication policy. Reload and check sources, independent review and dates."));
    }
}
