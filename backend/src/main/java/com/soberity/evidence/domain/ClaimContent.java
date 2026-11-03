package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.EvidenceLevel;
import com.soberity.evidence.domain.EvidenceTypes.InferenceType;
import java.util.Objects;

/** Every language/version carries its own explanation, scope, uncertainty and limitations. */
public record ClaimContent(String claimText, String summary, EvidenceLevel evidenceLevel,
        String evidenceRationale, String limitations, String uncertainty, String population,
        String exposure, String outcome, InferenceType inferenceType, String causalJustification) {
    public ClaimContent {
        claimText = EvidencePolicy.text(claimText, "claim", 10_000);
        summary = EvidencePolicy.text(summary, "summary", 10_000);
        evidenceRationale = EvidencePolicy.text(evidenceRationale, "evidence rationale", 20_000);
        limitations = EvidencePolicy.text(limitations, "limitations", 20_000);
        uncertainty = EvidencePolicy.text(uncertainty, "uncertainty", 20_000);
        population = EvidencePolicy.text(population, "population", 10_000);
        exposure = EvidencePolicy.text(exposure, "exposure", 10_000);
        outcome = EvidencePolicy.text(outcome, "outcome", 10_000);
        Objects.requireNonNull(evidenceLevel, "evidenceLevel");
        Objects.requireNonNull(inferenceType, "inferenceType");
        causalJustification = EvidencePolicy.optionalText(causalJustification, "causal justification", 20_000);
        if (inferenceType == InferenceType.CAUSAL &&
                (causalJustification == null || evidenceLevel == EvidenceLevel.INSUFFICIENT)) {
            throw new IllegalArgumentException("Causal claims require justification and sufficient evidence");
        }
    }
}
