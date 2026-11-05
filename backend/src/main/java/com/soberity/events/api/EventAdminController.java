package com.soberity.events.api;

import com.soberity.events.application.*;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/events")
public class EventAdminController {
    private final CuratedEvents events;
    public EventAdminController(CuratedEvents events){this.events=events;}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody CuratedEventInput input){return events.detail(actor,events.save(actor,null,input));}
    @PutMapping("/{id}") public Map<String,Object> edit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody CuratedEventInput input){events.save(actor,id,input);return events.detail(actor,id);}
    @PostMapping("/{id}/publish") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody EventInputs.VersionRequest request){events.publish(actor,id,request.expectedVersion());}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam int expectedVersion){events.delete(actor,id,expectedVersion);}
    @GetMapping("/{id}") public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return events.detail(actor,id);}
    @GetMapping public Map<String,Object> list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return events.list(actor,page,size);}
    @GetMapping("/legacy") public Map<String,Object> legacy(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return events.legacy(actor,page,size);}
    @PostMapping(value="/media",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> media(@AuthenticationPrincipal VerifiedToken actor,@RequestParam MultipartFile file,@RequestParam String altText)throws java.io.IOException {
        if(file.getSize()>5L*1024*1024)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Image exceeds limit.");
        return Map.of("id",events.media(actor,file.getBytes(),altText));
    }
    @GetMapping(value="/media/{id}",produces=MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> image(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(events.media(actor,id));}
}
