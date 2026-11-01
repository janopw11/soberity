package com.soberity.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Firebase project that issues the ID tokens this backend accepts. The Auth emulator is selected through the
 * standard {@code FIREBASE_AUTH_EMULATOR_HOST} environment variable, which the Admin SDK reads itself.
 */
@ConfigurationProperties("soberity.firebase")
public record FirebaseProperties(String projectId) {
}
