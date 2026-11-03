package com.soberity.evidence.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimSourceRepository extends JpaRepository<ClaimSource, UUID> {
    java.util.List<ClaimSource> findByRevisionId(UUID revisionId);
}
