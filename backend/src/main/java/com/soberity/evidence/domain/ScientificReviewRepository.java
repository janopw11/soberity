package com.soberity.evidence.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScientificReviewRepository extends JpaRepository<ScientificReview, UUID> {
    java.util.Optional<ScientificReview> findByRevisionId(UUID revisionId);
}
