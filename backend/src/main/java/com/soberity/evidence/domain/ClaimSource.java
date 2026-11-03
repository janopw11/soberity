package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.SourceRelation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "claim_source")
@Immutable
public class ClaimSource {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "revision_id", nullable = false, updatable = false)
    private UUID revisionId;

    @Column(name = "source_id", nullable = false, updatable = false)
    private UUID sourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation", nullable = false, updatable = false, length = 16)
    private SourceRelation relation;

    @Column(name = "notes", nullable = false, updatable = false, columnDefinition = "text")
    private String notes;

    @Column(name = "assessed_at", nullable = false, updatable = false)
    private Instant assessedAt;

    protected ClaimSource() {
    }

    public ClaimSource(UUID revisionId, UUID sourceId, SourceRelation relation, String notes) {
        this.id = UUID.randomUUID();
        this.revisionId = java.util.Objects.requireNonNull(revisionId, "revisionId");
        this.sourceId = java.util.Objects.requireNonNull(sourceId, "sourceId");
        this.relation = java.util.Objects.requireNonNull(relation, "relation");
        this.notes = EvidencePolicy.text(notes, "source assessment", 20000);
        this.assessedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRevisionId() {
        return revisionId;
    }

    public UUID getSourceId() {
        return sourceId;
    }

    public SourceRelation getRelation() {
        return relation;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getAssessedAt() {
        return assessedAt;
    }

}
