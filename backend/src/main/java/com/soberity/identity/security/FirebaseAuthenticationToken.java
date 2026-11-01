package com.soberity.identity.security;

import com.soberity.identity.token.VerifiedToken;
import java.util.List;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Authentication built from a verified Firebase ID token. The principal is the {@link VerifiedToken}; authorities
 * are derived only from the Firebase-signed {@code email_verified} claim.
 */
public class FirebaseAuthenticationToken extends AbstractAuthenticationToken {

    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_UNVERIFIED = "ROLE_UNVERIFIED";

    private final VerifiedToken principal;

    public FirebaseAuthenticationToken(VerifiedToken principal) {
        super(authoritiesFor(principal));
        this.principal = principal;
        setAuthenticated(true);
    }

    private static List<GrantedAuthority> authoritiesFor(VerifiedToken token) {
        String role = token.emailVerified() ? ROLE_USER : ROLE_UNVERIFIED;
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public VerifiedToken getPrincipal() {
        return principal;
    }
}
