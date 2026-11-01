package com.soberity.identity.api;

import com.soberity.identity.token.VerifiedToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/identity")
public class IdentityController {

    /** Returns the identity the backend derived from the verified Firebase token. */
    @GetMapping("/me")
    public IdentityResponse me(@AuthenticationPrincipal VerifiedToken token) {
        return new IdentityResponse(token.uid(), token.emailVerified());
    }

    public record IdentityResponse(String uid, boolean emailVerified) {
    }
}
