package com.soberity.community;

import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class CircleController {
    private final Circles circles;
    public CircleController(Circles circles){this.circles=circles;}
    @GetMapping("/api/v1/circles") public Map<String,Object> list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(required=false) String q,@RequestParam(required=false) Circles.Category category,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return circles.list(q,category,page,size,actor,false,false);}
    @GetMapping("/api/v1/circles/{id}") public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return circles.detail(id,actor,false);}
    @GetMapping("/api/v1/circles/{id}/events") public Map<String,Object> events(@PathVariable UUID id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="12") int size){return circles.related(id,page,size);}
    @GetMapping(value="/api/v1/circles/media/{id}",produces=MediaType.IMAGE_JPEG_VALUE) public ResponseEntity<byte[]> image(@PathVariable UUID id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(circles.image(id));}
    @GetMapping("/api/v1/me/circles") public Map<String,Object> mine(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(required=false) String q,@RequestParam(required=false) Circles.Category category,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return circles.list(q,category,page,size,actor,true,false);}
    @GetMapping("/api/v1/me/circles/{id}") public Map<String,Object> state(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return circles.membership(actor,id);}
    @PutMapping("/api/v1/me/circles/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void join(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){circles.join(actor,id);}
    @DeleteMapping("/api/v1/me/circles/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void leave(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){circles.leave(actor,id);}
    @GetMapping("/api/v1/admin/circles") public Map<String,Object> adminList(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return circles.list(null,null,page,size,actor,false,true);}
    @GetMapping("/api/v1/admin/circles/{id}") public Map<String,Object> adminDetail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return circles.detail(id,actor,true);}
    @PostMapping("/api/v1/admin/circles") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody Circles.Input input){UUID id=circles.save(actor,null,input);return circles.detail(id,actor,true);}
    @PutMapping("/api/v1/admin/circles/{id}") public Map<String,Object> edit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Circles.Input input){circles.save(actor,id,input);return circles.detail(id,actor,true);}
}
