package com.soberity.evidence.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvidenceClaimRepository extends JpaRepository<EvidenceClaim, UUID> {
}
