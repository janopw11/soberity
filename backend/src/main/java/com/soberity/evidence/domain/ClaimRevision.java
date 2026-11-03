package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.EvidenceLevel;
import com.soberity.evidence.domain.EvidenceTypes.InferenceType;
import com.soberity.evidence.domain.EvidenceTypes.PublicationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claim_revision")
public class ClaimRevision {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "claim_id", nullable = false, updatable = false)
    private UUID claimId;

    @Column(name = "version", nullable = false, updatable = false)
    private int version;

    @Column(name = "author_uid", nullable = false, updatable = false, length = 128)
    private String authorUid;

    @Column(name = "claim_text", nullable = false, updatable = false, columnDefinition = "text")
    private String claimText;

    @Column(name = "summary", nullable = false, updatable = false, columnDefinition = "text")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_level", nullable = false, updatable = false, length = 16)
    private EvidenceLevel evidenceLevel;

    @Column(name = "evidence_rationale", nullable = false, updatable = false, columnDefinition = "text")
    private String evidenceRationale;

    @Column(name = "limitations", nullable = false, updatable = false, columnDefinition = "text")
    private String limitations;

    @Column(name = "uncertainty", nullable = false, updatable = false, columnDefinition = "text")
    private String uncertainty;

    @Column(name = "population", nullable = false, updatable = false, columnDefinition = "text")
    private String population;

    @Column(name = "exposure", nullable = false, updatable = false, columnDefinition = "text")
    private String exposure;

    @Column(name = "outcome", nullable = false, updatable = false, columnDefinition = "text")
    private String outcome;

    @Enumerated(EnumType.STRING)
    @Column(name = "inference_type", nullable = false, updatable = false, length = 16)
    private InferenceType inferenceType;

    @Column(name = "causal_justification", nullable = true, updatable = false, columnDefinition = "text")
    private String causalJustification;

    @Column(name = "change_summary", nullable = false, updatable = false, columnDefinition = "text")
    private String changeSummary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, updatable = true, length = 16)
    private PublicationStatus status;

    @Column(name = "next_review_at", nullable = false, updatable = false)
    private Instant nextReviewAt;

    @Column(name = "published_at", nullable = true, updatable = true)
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ClaimRevision() {
    }

    public ClaimRevision(UUID claimId, int version, String authorUid, ClaimContent content,
            String changeSummary, Instant nextReviewAt) {
        this.id = UUID.randomUUID();
        this.claimId = java.util.Objects.requireNonNull(claimId, "claimId");
        if (version < 1) throw new IllegalArgumentException("Revision version must be positive");
        this.version = version;
        this.authorUid = EvidencePolicy.text(authorUid, "author UID", 128);
        this.createdAt = Instant.now();
        if (nextReviewAt == null || !nextReviewAt.isAfter(createdAt)) throw new IllegalArgumentException("Next review must be in the future");
        this.nextReviewAt = nextReviewAt;
        this.changeSummary = EvidencePolicy.text(changeSummary, "change summary", 10000);
        this.status = PublicationStatus.DRAFT;
        this.claimText = content.claimText();
        this.summary = content.summary();
        this.evidenceLevel = content.evidenceLevel();
        this.evidenceRationale = content.evidenceRationale();
        this.limitations = content.limitations();
        this.uncertainty = content.uncertainty();
        this.population = content.population();
        this.exposure = content.exposure();
        this.outcome = content.outcome();
        this.inferenceType = content.inferenceType();
        this.causalJustification = content.causalJustification();
    }

    public UUID getId() {
        return id;
    }

    public UUID getClaimId() {
        return claimId;
    }

    public int getVersion() {
        return version;
    }

    public String getAuthorUid() {
        return authorUid;
    }

    public String getClaimText() {
        return claimText;
    }

    public String getSummary() {
        return summary;
    }

    public EvidenceLevel getEvidenceLevel() {
        return evidenceLevel;
    }

    public String getEvidenceRationale() {
        return evidenceRationale;
    }

    public String getLimitations() {
        return limitations;
    }

    public String getUncertainty() {
        return uncertainty;
    }

    public String getPopulation() {
        return population;
    }

    public String getExposure() {
        return exposure;
    }

    public String getOutcome() {
        return outcome;
    }

    public InferenceType getInferenceType() {
        return inferenceType;
    }

    public String getCausalJustification() {
        return causalJustification;
    }

    public String getChangeSummary() {
        return changeSummary;
    }

    public PublicationStatus getStatus() {
        return status;
    }

    public Instant getNextReviewAt() {
        return nextReviewAt;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

}
