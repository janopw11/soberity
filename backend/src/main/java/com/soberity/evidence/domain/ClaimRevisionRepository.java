package com.soberity.evidence.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRevisionRepository extends JpaRepository<ClaimRevision, UUID> {
    java.util.Optional<ClaimRevision> findByClaimIdAndVersion(UUID claimId, int version);
    java.util.List<ClaimRevision> findByClaimIdOrderByVersionAsc(UUID claimId);
}
