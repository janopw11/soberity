package com.soberity.evidence.domain;

import com.soberity.evidence.domain.EvidenceTypes.AccessType;
import com.soberity.evidence.domain.EvidenceTypes.SourceProvider;
import com.soberity.evidence.domain.EvidenceTypes.StudyType;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/** Bibliographic snapshot, not a copy of a publisher's full text or a scientific endorsement. */
public record SourceMetadata(String title, String authors, String organization, String journal,
        int publicationYear, LocalDate publicationDate, String url, String doi, String pmid,
        StudyType studyType, SourceProvider provider, String license, String licenseUrl,
        AccessType accessType, UUID supersedesSourceId) {
    public SourceMetadata {
        title = EvidencePolicy.text(title, "source title", 1000);
        authors = EvidencePolicy.text(authors, "authors or issuing institution", 10_000);
        organization = EvidencePolicy.optionalText(organization, "organization", 300);
        journal = EvidencePolicy.optionalText(journal, "journal", 300);
        if (publicationYear < 1800 || publicationYear > 2100 ||
                (publicationDate != null && publicationDate.getYear() != publicationYear)) {
            throw new IllegalArgumentException("Inconsistent source publication year/date");
        }
        url = EvidencePolicy.httpsUrl(url);
        doi = EvidencePolicy.canonicalDoi(doi);
        pmid = EvidencePolicy.pmid(pmid);
        Objects.requireNonNull(studyType, "studyType");
        Objects.requireNonNull(provider, "provider");
        Objects.requireNonNull(accessType, "accessType");
        license = EvidencePolicy.text(license, "license (use UNKNOWN if not established)", 200);
        if (licenseUrl != null) licenseUrl = EvidencePolicy.httpsUrl(licenseUrl);
    }
}
