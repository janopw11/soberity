package com.soberity.evidence.domain;

/** Controlled scientific vocabulary. Publisher/provider is never an evidence rating. */
public final class EvidenceTypes {
    private EvidenceTypes() { }

    public enum EvidenceLevel { HIGH, MODERATE, LOW, VERY_LOW, INSUFFICIENT }
    public enum StudyType {
        SYSTEMATIC_REVIEW, META_ANALYSIS, RANDOMIZED_TRIAL, OBSERVATIONAL,
        GUIDELINE, REPORT, PREPRINT, COMMENTARY, EDITORIAL, OTHER
    }
    public enum SourceProvider { PUBMED, PMC, WHO, IARC, THE_LANCET, PUBLISHER, OTHER }
    public enum AccessType { OPEN_ACCESS, ABSTRACT_ONLY, SUBSCRIPTION, UNKNOWN }
    public enum InferenceType { ASSOCIATION, CAUSAL, DESCRIPTIVE, INSUFFICIENT }
    public enum PublicationStatus { DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED }
    public enum SourceRelation { SUPPORTS, CHALLENGES, CONTEXT }
    public enum ReviewDecision { APPROVED, CHANGES_REQUESTED, REJECTED }
}
