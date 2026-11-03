package com.soberity.evidence.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScientificSourceRepository extends JpaRepository<ScientificSource, UUID> {
    java.util.List<ScientificSource> findByDoi(String doi);
}
