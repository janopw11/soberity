package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.ReviewDecision;
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
@Table(name = "scientific_review")
@Immutable
public class ScientificReview {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "revision_id", nullable = false, updatable = false)
    private UUID revisionId;

    @Column(name = "reviewer_uid", nullable = false, updatable = false, length = 128)
    private String reviewerUid;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, updatable = false, length = 32)
    private ReviewDecision decision;

    @Column(name = "notes", nullable = false, updatable = false, columnDefinition = "text")
    private String notes;

    @Column(name = "causality_approved", nullable = false, updatable = false)
    private boolean causalityApproved;

    @Column(name = "causal_assessment", nullable = true, updatable = false, columnDefinition = "text")
    private String causalAssessment;

    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private Instant reviewedAt;

    protected ScientificReview() {
    }

    public ScientificReview(UUID revisionId, String reviewerUid, ReviewDecision decision, String notes,
            boolean causalityApproved, String causalAssessment) {
        this.id = UUID.randomUUID();
        this.revisionId = java.util.Objects.requireNonNull(revisionId, "revisionId");
        this.reviewerUid = EvidencePolicy.text(reviewerUid, "reviewer UID", 128);
        this.decision = java.util.Objects.requireNonNull(decision, "decision");
        this.notes = EvidencePolicy.text(notes, "review notes", 20000);
        this.causalityApproved = causalityApproved;
        this.causalAssessment = EvidencePolicy.optionalText(causalAssessment, "causal assessment", 20000);
        if (causalityApproved && this.causalAssessment == null) throw new IllegalArgumentException("Causal assessment is required");
        this.reviewedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRevisionId() {
        return revisionId;
    }

    public String getReviewerUid() {
        return reviewerUid;
    }

    public ReviewDecision getDecision() {
        return decision;
    }

    public String getNotes() {
        return notes;
    }

    public boolean getCausalityApproved() {
        return causalityApproved;
    }

    public String getCausalAssessment() {
        return causalAssessment;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

}
