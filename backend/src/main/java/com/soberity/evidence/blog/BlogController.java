package com.soberity.evidence.blog;

import com.soberity.identity.token.VerifiedToken;
import java.io.IOException;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class BlogController {
    private final BlogService service;
    public BlogController(BlogService service) {this.service=service;}
    @GetMapping("/api/v1/editorial/posts")
    public BlogService.Page list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(required=false) String kind,@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page) {return service.list(actor,kind,status,page);}
    @GetMapping("/api/v1/editorial/posts/{id}")
    public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return service.detail(actor,id);}
    @PostMapping("/api/v1/editorial/posts")
    public Map<String,Object> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody BlogService.Draft draft) {return service.detail(actor,service.save(actor,null,draft));}
    @PutMapping("/api/v1/editorial/posts/{id}")
    public Map<String,Object> save(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody BlogService.Draft draft) {return service.detail(actor,service.save(actor,id,draft));}
    @PostMapping("/api/v1/editorial/posts/{id}/decision")
    public Map<String,Object> decide(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody BlogService.Decision decision) {service.decide(actor,id,decision);return service.detail(actor,id);}
    public record Version(int version) { }
    @PostMapping("/api/v1/editorial/posts/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody Version version) {service.archive(actor,id,version.version());}
    @GetMapping("/api/v1/editorial/categories")
    public List<Map<String,Object>> categories(@AuthenticationPrincipal VerifiedToken actor) {return service.categories(actor);}
    public record Category(String name) { }
    @PostMapping("/api/v1/editorial/categories")
    public Map<String,Object> category(@AuthenticationPrincipal VerifiedToken actor,@RequestBody Category input) {return service.category(actor,input.name());}
    @PostMapping(value="/api/v1/editorial/media",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String,Object> upload(@AuthenticationPrincipal VerifiedToken actor,@RequestParam MultipartFile file,@RequestParam String purpose,@RequestParam String alt) throws IOException {return service.upload(actor,file.getBytes(),purpose,alt);}
    @GetMapping("/api/v1/editorial/media/{id}")
    public ResponseEntity<byte[]> privateMedia(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noStore()).body(service.media(actor,id,false));}
    @GetMapping("/api/v1/science/media/{id}")
    public ResponseEntity<byte[]> publicMedia(@PathVariable UUID id) {return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noCache()).body(service.media(null,id,true));}
    @GetMapping("/api/v1/science/posts")
    public BlogService.Page published(@RequestParam(required=false) String kind,@RequestParam(defaultValue="0") int page) {return service.published(kind,page);}
    @GetMapping("/api/v1/science/posts/{id}")
    public ResponseEntity<Map<String,Object>> publishedDetail(@PathVariable UUID id) {return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(service.publishedDetail(id));}
    @ExceptionHandler({IllegalArgumentException.class,NullPointerException.class,IOException.class})
    public ResponseEntity<ProblemDetail> invalid(Exception ex) {return ResponseEntity.badRequest().body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Invalid article, source URL, document or image."));}
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> conflict(Exception ex) {return ResponseEntity.status(409).body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"This version conflicts with a newer operation. Reload the article."));}
}
