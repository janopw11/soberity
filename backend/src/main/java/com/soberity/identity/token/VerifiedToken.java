package com.soberity.identity.token;

/**
 * Identity extracted from a verified Firebase ID token. Only the Firebase-signed claims are carried here; nothing
 * supplied by the client (roles, UIDs in bodies or headers) is trusted.
 */
public record VerifiedToken(String uid, boolean emailVerified) {
}
