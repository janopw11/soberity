package com.soberity.events.api;

import com.soberity.events.application.*;
import com.soberity.events.application.EventInputs.*;
import com.soberity.events.domain.EventPolicy.*;
import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class EventPublicController {
    private final EventCatalog catalog;
    private final OrganizerService organizers;
    private final EventMedia media;
    private final EventCalendar calendar;
    public EventPublicController(EventCatalog catalog,OrganizerService organizers,EventMedia media,EventCalendar calendar) {this.catalog=catalog;this.organizers=organizers;this.media=media;this.calendar=calendar;}
    @GetMapping("/events")
    public Map<String,Object> search(@RequestParam(required=false) String q,@RequestParam(required=false) String city,
        @RequestParam(required=false) String country,@RequestParam(required=false) String region,
        @RequestParam(defaultValue="START_ASC") EventCatalog.Sort sort,@RequestParam(required=false) Track track,@RequestParam(required=false) Category category,
        @RequestParam(required=false) AlcoholPolicy alcoholPolicy,@RequestParam(required=false) PriceKind priceKind,
        @RequestParam(required=false) String currency,@RequestParam(required=false) Long maxPriceMinor,
        @RequestParam(required=false) Accessibility accessibility,@RequestParam(required=false) Availability availability,
        @RequestParam(required=false) Instant from,@RequestParam(required=false) Instant to,@RequestParam(required=false) String locale,
        @RequestParam(required=false) Double latitude,@RequestParam(required=false) Double longitude,@RequestParam(required=false) Double radiusKm,
        @RequestParam(defaultValue="0") Integer page,@RequestParam(defaultValue="20") Integer size) {
        return catalog.search(new EventCatalog.Search(q,city,country,region,sort,track,category,alcoholPolicy,priceKind,currency,maxPriceMinor,accessibility,availability,from,to,locale,latitude,longitude,radiusKm,page,size));
    }
    @GetMapping(value="/events/{id}/calendar.ics",produces="text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> calendar(@PathVariable UUID id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"soberity-"+id+".ics\"")
            .header("X-Content-Type-Options","nosniff").body(calendar.export(id));
    }
    @GetMapping("/events/categories") public List<Map<String,Object>> categories() {return catalog.categories();}
    @GetMapping("/events/{id}") public Map<String,Object> detail(@PathVariable UUID id) {return catalog.detail(id);}
    @GetMapping("/organizers/{id}") public Map<String,Object> organizer(@PathVariable UUID id) {return organizers.publicDetail(id);}
    @GetMapping(value="/events/media/{id}",produces=MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> image(@PathVariable UUID id) {return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(media.publicImage(id));}
}
