package com.soberity.discovery;

import com.soberity.identity.token.VerifiedToken;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class WeeklyScienceController {
    private final WeeklyScienceService service;
    private final WeeklyArticleService features;
    public WeeklyScienceController(WeeklyScienceService service,WeeklyArticleService features) { this.service=service; this.features=features; }
    @GetMapping("/api/v1/discover/weekly/current")
    public ResponseEntity<Map<String,Object>> current(@RequestParam(defaultValue="en") String locale) { return noStore(features.current(locale)); }
    @GetMapping("/api/v1/discover/weekly/{slug}")
    public ResponseEntity<Map<String,Object>> detail(@PathVariable String slug,@RequestParam(defaultValue="en") String locale) { return noStore(service.detail(locale,slug)); }
    @GetMapping("/api/v1/editorial/weekly")
    public ResponseEntity<Map<String,Object>> list(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) { return noStore(service.list(actor,page)); }
    @PostMapping("/api/v1/editorial/weekly")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,UUID> create(@AuthenticationPrincipal VerifiedToken actor,@RequestBody WeeklyScienceService.Draft draft) { throw retired(); }
    @PostMapping("/api/v1/editorial/weekly/news")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,UUID> createNews(@AuthenticationPrincipal VerifiedToken actor,@RequestBody WeeklyScienceService.NewsDraft draft) { throw retired(); }
    @PutMapping("/api/v1/editorial/weekly/news/{id}")
    public Map<String,UUID> saveNews(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody WeeklyScienceService.NewsDraft draft) { throw retired(); }
    @PostMapping("/api/v1/editorial/weekly/{id}/decision")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decide(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id,@RequestBody WeeklyScienceService.Decision input) { throw retired(); }
    @GetMapping("/api/v1/editorial/weekly/features")
    public ResponseEntity<Map<String,Object>> features(@AuthenticationPrincipal VerifiedToken actor,@RequestParam(defaultValue="0") int page) { return noStore(features.list(actor,page)); }
    @PostMapping("/api/v1/editorial/weekly/features")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,UUID> select(@AuthenticationPrincipal VerifiedToken actor,@RequestBody WeeklyArticleService.Selection input) { return Map.of("id",features.select(actor,input)); }
    @DeleteMapping("/api/v1/editorial/weekly/features/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal VerifiedToken actor,@PathVariable UUID id) { features.cancel(actor,id); }
    private org.springframework.web.server.ResponseStatusException retired() {
        return new org.springframework.web.server.ResponseStatusException(HttpStatus.GONE,"Create articles in the article editor, then select the article of the week.");
    }
    private ResponseEntity<Map<String,Object>> noStore(Map<String,Object> body) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body); }
}
