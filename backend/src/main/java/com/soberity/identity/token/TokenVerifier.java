package com.soberity.identity.token;

/**
 * Verifies Firebase ID tokens. Implementations throw {@link InvalidTokenException} for any token that cannot be
 * trusted (bad signature, wrong project, expired, malformed).
 */
public interface TokenVerifier {

    VerifiedToken verify(String idToken) throws InvalidTokenException;
}
