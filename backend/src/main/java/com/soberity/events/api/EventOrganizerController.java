package com.soberity.events.api;

import com.soberity.events.application.*;
import com.soberity.events.application.EventInputs.*;
import com.soberity.identity.token.VerifiedToken;
import java.io.IOException;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/organizer")
public class EventOrganizerController {
    private final OrganizerService organizers;
    private final EventService events;
    private final EventMedia media;
    public EventOrganizerController(OrganizerService organizers,EventService events,EventMedia media) {this.organizers=organizers;this.events=events;this.media=media;}
    @PostMapping("/organizations") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody OrganizerInput input) {return organizers.privateDetail(actor,organizers.create(actor,input));}
    @GetMapping("/organizations") public Map<String,Object> mine(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) {return organizers.mine(actor,page);}
    @GetMapping("/organizations/{id}") public Map<String,Object> organization(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return organizers.privateDetail(actor,id);}
    @PostMapping("/organizations/{id}/submit") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submitOrganization(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VerificationRequest input) {organizers.submit(actor,id,input);}
    @PostMapping("/organizations/{id}/venues") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,UUID> venue(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VenueInput input) {return Map.of("id",events.venue(actor,id,input));}
    @GetMapping("/organizations/{id}/venues/{venueId}")
    public Map<String,Object> venueDetail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@PathVariable UUID venueId) {return events.venueDetail(actor,id,venueId);}
    @GetMapping("/organizations/{id}/venues") public Map<String,Object> venues(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam(defaultValue="0") int page) {return events.venues(actor,id,page);}
    @PostMapping(value="/organizations/{id}/media",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public Map<String,UUID> upload(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam MultipartFile file,@RequestParam String altText) throws IOException {
        if(file.getSize()>5L*1024*1024)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Image limit is 5 MB.");
        return Map.of("id",media.upload(actor,id,file.getBytes(),altText));
    }
    @GetMapping(value="/organizations/{id}/media/{mediaId}",produces=MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> image(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@PathVariable UUID mediaId) {return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(media.privateImage(actor,id,mediaId));}
    @PostMapping("/organizations/{id}/events") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createEvent(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody EventInput input) {return events.privateDetail(actor,events.save(actor,id,null,input));}
    @PutMapping("/organizations/{id}/events/{eventId}")
    public Map<String,Object> edit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@PathVariable UUID eventId,@RequestBody EventInput input) {events.save(actor,id,eventId,input);return events.privateDetail(actor,eventId);}
    @GetMapping("/organizations/{id}/events") public Map<String,Object> events(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestParam(defaultValue="0") int page) {return events.mine(actor,id,page);}
    @GetMapping("/events/{id}") public Map<String,Object> event(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return events.privateDetail(actor,id);}
    @PostMapping("/events/{id}/submit") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.submit(actor,id,input);}
    @PostMapping("/events/{id}/withdraw") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.withdraw(actor,id,input);}
    @PostMapping("/events/{id}/cancel") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.cancel(actor,id,input);}
}
