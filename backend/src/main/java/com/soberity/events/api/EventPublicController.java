package com.soberity.events.api;

import com.soberity.events.application.*;
import com.soberity.events.domain.EventPolicy.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/events")
public class EventPublicController {
    private final EventCatalog catalog;
    private final EventMedia media;
    public EventPublicController(EventCatalog catalog,EventMedia media){this.catalog=catalog;this.media=media;}
    @GetMapping
    public ResponseEntity<Map<String,Object>> search(@RequestParam(required=false) String q,@RequestParam(required=false) UUID countryId,
            @RequestParam(required=false) UUID cityId,@RequestParam(required=false) Track track,@RequestParam(required=false) List<Category> category,
            @RequestParam(required=false) Instant from,@RequestParam(required=false) Instant to,@RequestParam(required=false) String locale,
            @RequestParam(defaultValue="UPCOMING") EventCatalog.DateScope dateScope,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,HttpServletRequest request) {
        // Reject old/free-text/coordinate filters rather than silently ignore a caller's intent.
        var allowed=Set.of("q","countryId","cityId","track","category","from","to","locale","page","size","dateScope");
        if(!allowed.containsAll(request.getParameterMap().keySet()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported search parameter; use country/city IDs and POST nearby for location.");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(catalog.search(
                new EventCatalog.Search(q,countryId,cityId,track,null,from,to,locale,page,size),category==null?List.of():category,dateScope));
    }
    @PostMapping("/nearby")
    public ResponseEntity<Map<String,Object>> nearby(@RequestBody EventCatalog.Nearby input,HttpServletRequest request) {
        if(!request.getParameterMap().isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nearby query parameters are not accepted.");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(catalog.nearby(input));
    }
    @GetMapping("/categories") public List<Map<String,Object>> categories(){return catalog.categories();}
    @GetMapping("/{id}") public ResponseEntity<Map<String,Object>> detail(@PathVariable UUID id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(catalog.detail(id));}
    @GetMapping(value="/media/{id}",produces=MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> image(@PathVariable UUID id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(media.publicImage(id));}
}
