package com.soberity.events.api;

import com.soberity.events.application.EventInterests;
import com.soberity.identity.token.VerifiedToken;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in user's own RSVP. Private state and mutations remain under /me; counts have a separate public endpoint. */
@RestController
@RequestMapping("/api/v1/me/event-interests")
public class EventInterestController {
    private final EventInterests interests;

    public EventInterestController(EventInterests interests) {
        this.interests = interests;
    }

    @GetMapping
    public Map<String, Object> mine(@AuthenticationPrincipal VerifiedToken actor,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return interests.mine(actor, page, size);
    }

    @GetMapping("/{eventId}")
    public Map<String, Object> state(@AuthenticationPrincipal VerifiedToken actor, @PathVariable UUID eventId) {
        return interests.state(actor, eventId);
    }

    @PutMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void declare(@AuthenticationPrincipal VerifiedToken actor, @PathVariable UUID eventId) {
        interests.declare(actor, eventId);
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal VerifiedToken actor, @PathVariable UUID eventId) {
        interests.withdraw(actor, eventId);
    }
}
