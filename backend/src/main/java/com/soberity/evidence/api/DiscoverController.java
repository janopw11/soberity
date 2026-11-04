package com.soberity.evidence.api;

import com.soberity.evidence.application.DiscoverReader;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class DiscoverController {
    private final DiscoverReader reader;
    public DiscoverController(DiscoverReader reader) {this.reader=reader;}
    @GetMapping("/api/v1/science/feed")
    public ResponseEntity<DiscoverReader.Page> feed(@RequestParam(defaultValue="en") String locale,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(reader.feed(locale,page,size));
    }
}
