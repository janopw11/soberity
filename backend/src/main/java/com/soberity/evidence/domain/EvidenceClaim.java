package com.soberity.evidence.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "evidence_claim")
@Immutable
public class EvidenceClaim {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "locale", nullable = false, updatable = false, length = 8)
    private String locale;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EvidenceClaim() {
    }

    public EvidenceClaim(String locale) {
        if (!"en".equals(locale) && !"pl".equals(locale)) throw new IllegalArgumentException("Unsupported claim locale");
        this.id = UUID.randomUUID();
        this.locale = locale;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getLocale() {
        return locale;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

}
