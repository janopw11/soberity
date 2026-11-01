package com.soberity.identity.security;

import com.soberity.identity.token.InvalidTokenException;
import com.soberity.identity.token.TokenVerifier;
import com.soberity.identity.token.VerifiedToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads {@code Authorization: Bearer <Firebase ID token>}. A missing or rejected token leaves the request
 * unauthenticated, so the entry point answers 401 for protected endpoints.
 */
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final TokenVerifier verifier;

    public FirebaseAuthenticationFilter(TokenVerifier verifier) {
        this.verifier = verifier;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length()).strip();
            if (!token.isEmpty()) {
                authenticate(token);
            }
        }
        chain.doFilter(request, response);
    }

    private void authenticate(String token) {
        try {
            VerifiedToken verified = verifier.verify(token);
            SecurityContextHolder.getContext().setAuthentication(new FirebaseAuthenticationToken(verified));
        } catch (InvalidTokenException ex) {
            SecurityContextHolder.clearContext();
        }
    }
}
