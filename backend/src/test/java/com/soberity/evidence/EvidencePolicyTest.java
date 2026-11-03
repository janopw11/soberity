package com.soberity.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.soberity.evidence.domain.*;
import com.soberity.evidence.domain.EvidenceTypes.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EvidencePolicyTest {
    @Test
    void normalizesCitationIdentifiersWithoutClaimingTheyExist() {
        assertThat(EvidencePolicy.canonicalDoi(" https://doi.org/10.1234/SYNTHETIC "))
                .isEqualTo("10.1234/synthetic");
        assertThat(EvidencePolicy.canonicalDoi("doi: 10.1234/SYNTHETIC"))
                .isEqualTo("10.1234/synthetic");
        assertThat(EvidencePolicy.pmid(" 12345 ")).isEqualTo("12345");
        assertThatThrownBy(() -> EvidencePolicy.canonicalDoi("not a DOI")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EvidencePolicy.pmid("12/34")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNonHttpsAndCredentialBearingSourceUrlsWithoutEchoingCredentials() {
        for (String url : new String[] {"http://example.test/source", "javascript:alert(1)",
                "https://user:private-value@example.test/source", "https:///missing-host"}) {
            assertThatThrownBy(() -> EvidencePolicy.httpsUrl(url)).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageNotContaining("private-value");
        }
    }

    @Test
    void causalWordingRequiresExplicitJustificationAndCannotHaveInsufficientEvidence() {
        assertThatThrownBy(() -> content(InferenceType.CAUSAL, EvidenceLevel.LOW, null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> content(InferenceType.CAUSAL, EvidenceLevel.INSUFFICIENT, "Synthetic assessment"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(content(InferenceType.ASSOCIATION, EvidenceLevel.LOW, null).inferenceType())
                .isEqualTo(InferenceType.ASSOCIATION);
    }

    @Test
    void revisionsStartAsDraftsAndCarryScopeUncertaintyAndReviewDeadline() {
        EvidenceClaim claim = new EvidenceClaim("pl");
        ClaimRevision revision = new ClaimRevision(claim.getId(), 1, "author", content(
                InferenceType.ASSOCIATION, EvidenceLevel.LOW, null), "Initial synthetic fixture",
                Instant.now().plus(30, ChronoUnit.DAYS));
        assertThat(revision.getStatus()).isEqualTo(PublicationStatus.DRAFT);
        assertThat(revision.getPublishedAt()).isNull();
        assertThat(revision.getUncertainty()).isNotBlank();
        assertThatThrownBy(() -> new EvidenceClaim("de")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new ClaimRevision(UUID.randomUUID(), 0, "author", content(
                InferenceType.ASSOCIATION, EvidenceLevel.LOW, null), "Change", Instant.EPOCH))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void causalApprovalRequiresWrittenAssessment() {
        assertThatThrownBy(() -> new ScientificReview(UUID.randomUUID(), "reviewer", ReviewDecision.APPROVED,
                "Synthetic review", true, null)).isInstanceOf(IllegalArgumentException.class);
    }

    private ClaimContent content(InferenceType inference, EvidenceLevel level, String causal) {
        return new ClaimContent("Synthetic claim; not medical content", "Fixture summary", level,
                "Synthetic methodological assessment", "Fixture limitations", "Uncertainty is not quantified",
                "Synthetic population", "Synthetic exposure", "Synthetic outcome", inference, causal);
    }
}
