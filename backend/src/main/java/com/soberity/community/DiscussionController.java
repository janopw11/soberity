package com.soberity.community;

import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class DiscussionController {
    private final Discussions service;
    public DiscussionController(Discussions service){this.service=service;}
    @GetMapping("/api/v1/discussions") public Map<String,Object> list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(required=false) String q,@RequestParam(required=false) String category,@RequestParam(defaultValue="RECENT") String sort,@RequestParam(required=false) String articleType,@RequestParam(required=false) UUID articleId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.list(actor,q,category,sort,articleType,articleId,page,size,false,false);}
    @GetMapping("/api/v1/me/discussions") public Map<String,Object> mine(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.list(actor,null,null,"RECENT",null,null,page,size,true,false);}
    @GetMapping("/api/v1/editorial/discussions") public Map<String,Object> adminList(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.list(actor,null,null,"RECENT",null,null,page,size,false,true);}
    @GetMapping("/api/v1/discussions/{id}") public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return service.detail(id,actor,false);}
    @GetMapping("/api/v1/editorial/discussions/{id}") public Map<String,Object> adminDetail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return service.detail(id,actor,true);}
    @GetMapping("/api/v1/discussions/{id}/comments") public Map<String,Object> comments(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam(required=false) UUID parentId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.comments(id,actor,parentId,page,size,false);}
    @GetMapping("/api/v1/editorial/discussions/{id}/comments") public Map<String,Object> adminComments(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam(required=false) UUID parentId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.comments(id,actor,parentId,page,size,true);}
    @PostMapping("/api/v1/me/discussions/{id}/comments") @ResponseStatus(HttpStatus.CREATED) public Map<String,UUID> add(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Discussions.Comment input){return Map.of("id",service.add(actor,id,input));}
    @DeleteMapping("/api/v1/me/discussion-comments/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){service.delete(actor,id);}
    @PostMapping("/api/v1/editorial/discussions") @ResponseStatus(HttpStatus.CREATED) public Map<String,UUID> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody Discussions.Topic input){return Map.of("id",service.save(actor,null,input));}
    @PutMapping("/api/v1/editorial/discussions/{id}") public Map<String,UUID> edit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Discussions.Topic input){return Map.of("id",service.save(actor,id,input));}
    @PutMapping("/api/v1/editorial/discussion-comments/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void moderate(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Discussions.Moderation input){service.moderate(actor,id,input);}
}
