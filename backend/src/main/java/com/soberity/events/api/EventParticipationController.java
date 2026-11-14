package com.soberity.events.api;

import com.soberity.events.application.EventInterests;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Public aggregate only. Private state and mutations stay under the existing /me API. */
@RestController
public class EventParticipationController {
    private final EventInterests interests;

    public EventParticipationController(EventInterests interests) {
        this.interests = interests;
    }

    @GetMapping("/api/v1/events/{eventId}/participation")
    public ResponseEntity<Map<String, Object>> summary(@PathVariable UUID eventId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(interests.summary(eventId));
    }
}
