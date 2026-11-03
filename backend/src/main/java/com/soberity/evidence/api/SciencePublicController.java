package com.soberity.evidence.api;

import com.soberity.evidence.application.SciencePublicReader;
import com.soberity.evidence.domain.EvidenceTypes.EvidenceLevel;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;
import tools.jackson.databind.json.JsonMapper;

@RestController
public class SciencePublicController {
    private final SciencePublicReader reader;
    private final JsonMapper json;
    public SciencePublicController(SciencePublicReader reader, JsonMapper json) {
        this.reader = reader;
        this.json = json;
    }

    @GetMapping("/api/v1/science/categories")
    public ResponseEntity<?> categories(@RequestParam(defaultValue="en") String locale, WebRequest request) {
        return cached(reader.categories(locale), request);
    }

    @GetMapping("/api/v1/evidence/claims")
    public ResponseEntity<?> claims(@RequestParam(defaultValue="en") String locale,
            @RequestParam(required=false) String category, @RequestParam(required=false) EvidenceLevel evidenceLevel,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, WebRequest request) {
        return cached(reader.claims(locale, category, evidenceLevel, page, size), request);
    }

    @GetMapping("/api/v1/evidence/claims/{id}")
    public ResponseEntity<?> claim(@PathVariable UUID id, WebRequest request) { return cached(reader.claim(id), request); }

    @GetMapping("/api/v1/evidence/claims/{id}/citations")
    public ResponseEntity<?> citations(@PathVariable UUID id, WebRequest request) { return cached(reader.citations(id), request); }

    @GetMapping("/api/v1/evidence/sources/{id}")
    public ResponseEntity<?> source(@PathVariable UUID id, WebRequest request) { return cached(reader.source(id), request); }

    @GetMapping("/api/v1/science/articles")
    public ResponseEntity<?> articles(@RequestParam(defaultValue="en") String locale,
            @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size, WebRequest request) {
        return cached(reader.articles(locale, category, page, size), request);
    }

    @GetMapping("/api/v1/science/articles/{id}")
    public ResponseEntity<?> article(@PathVariable UUID id, WebRequest request) { return cached(reader.article(id), request); }

    private ResponseEntity<?> cached(Object body, WebRequest request) {
        // Weak representation validator includes exact versions, source metadata and list totals.
        // Revalidate every use so withdrawal is visible immediately; no stale server-side cache.
        try {
            String tag = "W/\"science-v1-" + HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(json.writeValueAsBytes(body))) + "\"";
            boolean unchanged = request.checkNotModified(tag);
            return ResponseEntity.status(unchanged ? 304 : 200)
                    .header("Cache-Control", "public, no-cache").eTag(tag).body(unchanged ? null : body);
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
