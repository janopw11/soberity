package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.AccessType;
import com.soberity.evidence.domain.EvidenceTypes.SourceProvider;
import com.soberity.evidence.domain.EvidenceTypes.StudyType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "scientific_source")
@Immutable
public class ScientificSource {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "supersedes_source_id", nullable = true, updatable = false)
    private UUID supersedesSourceId;

    @Column(name = "title", nullable = false, updatable = false, length = 1000)
    private String title;

    @Column(name = "authors", nullable = false, updatable = false, columnDefinition = "text")
    private String authors;

    @Column(name = "organization", nullable = true, updatable = false, length = 300)
    private String organization;

    @Column(name = "journal", nullable = true, updatable = false, length = 300)
    private String journal;

    @Column(name = "publication_year", nullable = false, updatable = false)
    private int publicationYear;

    @Column(name = "publication_date", nullable = true, updatable = false)
    private LocalDate publicationDate;

    @Column(name = "url", nullable = false, updatable = false, length = 2048)
    private String url;

    @Column(name = "doi", nullable = true, updatable = false, length = 512)
    private String doi;

    @Column(name = "pmid", nullable = true, updatable = false, length = 16)
    private String pmid;

    @Enumerated(EnumType.STRING)
    @Column(name = "study_type", nullable = false, updatable = false, length = 32)
    private StudyType studyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, updatable = false, length = 32)
    private SourceProvider provider;

    @Column(name = "license", nullable = false, updatable = false, length = 200)
    private String license;

    @Column(name = "license_url", nullable = true, updatable = false, length = 2048)
    private String licenseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, updatable = false, length = 32)
    private AccessType accessType;

    @Column(name = "retrieved_at", nullable = false, updatable = false)
    private Instant retrievedAt;

    protected ScientificSource() {
    }

    public ScientificSource(SourceMetadata metadata) {
        this.id = UUID.randomUUID();
        this.retrievedAt = Instant.now();
        this.supersedesSourceId = metadata.supersedesSourceId();
        this.title = metadata.title();
        this.authors = metadata.authors();
        this.organization = metadata.organization();
        this.journal = metadata.journal();
        this.publicationYear = metadata.publicationYear();
        this.publicationDate = metadata.publicationDate();
        this.url = metadata.url();
        this.doi = metadata.doi();
        this.pmid = metadata.pmid();
        this.studyType = metadata.studyType();
        this.provider = metadata.provider();
        this.license = metadata.license();
        this.licenseUrl = metadata.licenseUrl();
        this.accessType = metadata.accessType();
    }

    public UUID getId() {
        return id;
    }

    public UUID getSupersedesSourceId() {
        return supersedesSourceId;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthors() {
        return authors;
    }

    public String getOrganization() {
        return organization;
    }

    public String getJournal() {
        return journal;
    }

    public int getPublicationYear() {
        return publicationYear;
    }

    public LocalDate getPublicationDate() {
        return publicationDate;
    }

    public String getUrl() {
        return url;
    }

    public String getDoi() {
        return doi;
    }

    public String getPmid() {
        return pmid;
    }

    public StudyType getStudyType() {
        return studyType;
    }

    public SourceProvider getProvider() {
        return provider;
    }

    public String getLicense() {
        return license;
    }

    public String getLicenseUrl() {
        return licenseUrl;
    }

    public AccessType getAccessType() {
        return accessType;
    }

    public Instant getRetrievedAt() {
        return retrievedAt;
    }

}
