package com.soberity.evidence.domain;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Pattern;

/** Structural checks only: a syntactically valid citation still requires human verification. */
public final class EvidencePolicy {
    private static final Pattern DOI = Pattern.compile("10\\.\\d{4,9}/[^\\s]+", Pattern.CASE_INSENSITIVE);
    private EvidencePolicy() { }

    static String text(String value, String field, int max) {
        if (value == null || value.isBlank() || value.strip().length() > max) {
            throw new IllegalArgumentException("Missing or oversized " + field);
        }
        return value.strip();
    }

    static String optionalText(String value, String field, int max) {
        return value == null ? null : text(value, field, max);
    }

    public static String httpsUrl(String value) {
        String normalized = text(value, "source URL", 2048);
        try {
            URI uri = URI.create(normalized);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
                throw new IllegalArgumentException("Invalid source URL");
            }
            return "https" + uri.toASCIIString().substring(uri.getScheme().length());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Source URL must be absolute HTTPS without credentials");
        }
    }

    public static String canonicalDoi(String value) {
        if (value == null) return null;
        String doi = value.strip().replaceFirst("(?i)^(https://doi\\.org/|doi:\\s*)", "")
                .toLowerCase(Locale.ROOT);
        if (doi.length() > 512 || !DOI.matcher(doi).matches()) {
            throw new IllegalArgumentException("Invalid DOI syntax");
        }
        return doi;
    }

    public static String pmid(String value) {
        if (value == null) return null;
        String normalized = value.strip();
        if (!normalized.matches("[1-9][0-9]{0,15}")) throw new IllegalArgumentException("Invalid PMID syntax");
        return normalized;
    }
}
