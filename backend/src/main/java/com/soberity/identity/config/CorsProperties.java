package com.soberity.identity.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Browser origins allowed to call the API (configured per environment, never defaulted to wildcard).
 */
@ConfigurationProperties("soberity.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
