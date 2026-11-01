package com.soberity.support;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only endpoints that exercise error mapping without adding product endpoints (those start in P0-I09).
 */
@RestController
@RequestMapping("/api/v1/test-probe")
class TestProbeController {

    record Payload(@NotBlank String name) {
    }

    @PostMapping("/validate")
    String validate(@Valid @RequestBody Payload payload) {
        return "ok";
    }

    @GetMapping("/boom")
    String boom() {
        throw new IllegalStateException("internal detail that must not leak");
    }
}
