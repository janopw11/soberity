package com.soberity.events.api;

import com.soberity.events.application.*;
import com.soberity.events.application.EventInputs.*;
import com.soberity.events.domain.EventPolicy.Status;
import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/moderation")
public class EventModerationController {
    private final OrganizerService organizers;
    private final EventService events;
    private final EventMedia media;
    public EventModerationController(OrganizerService organizers,EventService events,EventMedia media) {this.organizers=organizers;this.events=events;this.media=media;}
    @GetMapping(value="/events/media/{id}",produces=org.springframework.http.MediaType.IMAGE_JPEG_VALUE)
    public org.springframework.http.ResponseEntity<byte[]> image(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return org.springframework.http.ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(media.moderationImage(actor,id));}
    @GetMapping("/organizers") public Map<String,Object> organizers(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) {return organizers.queue(actor,page);}
    @PostMapping("/organizers/{id}/decision") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decide(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VerificationDecision input) {organizers.decide(actor,id,input);}
    @GetMapping("/events") public Map<String,Object> events(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) {return events.moderationQueue(actor,page);}
    @GetMapping("/events/{id}") public Map<String,Object> detail(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) {return events.moderationDetail(actor,id);}
    @PostMapping("/events/{id}/review") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void review(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody ReviewInput input) {events.review(actor,id,input);}
    @PostMapping("/events/{id}/publish") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.publish(actor,id,input);}
    @PostMapping("/events/{id}/cancel") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.moderateState(actor,id,Status.CANCELLED,input);}
    @PostMapping("/events/{id}/archive") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody VersionRequest input) {events.moderateState(actor,id,Status.ARCHIVED,input);}
}
