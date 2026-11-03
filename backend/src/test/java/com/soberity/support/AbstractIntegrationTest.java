package com.soberity.support;

import com.soberity.identity.token.TokenVerifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * One PostgreSQL container shared by all integration tests in the JVM. It is started once and not stopped per class,
 * because Spring caches application contexts that keep pointing at its port.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    private static final String LOCAL_URL = System.getenv("SOBERITY_TEST_JDBC_URL");
    static final PostgreSQLContainer POSTGRES;

    /** Replaces Firebase verification so tests never call Google; token behavior is stubbed per test. */
    @MockitoBean
    protected TokenVerifier tokenVerifier;

    static {
        if (LOCAL_URL == null) {
            POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
            POSTGRES.start();
        } else {
            // Explicit fallback for an isolated native PostgreSQL when Docker is
            // unavailable. Never accept remote hosts, arbitrary DB names or URL credentials.
            if (!LOCAL_URL.matches("jdbc:postgresql://127\\.0\\.0\\.1:[0-9]+/soberity_test_[a-z0-9_]+")) {
                throw new IllegalArgumentException("Use a loopback soberity_test_ database for integration tests");
            }
            POSTGRES = null;
        }
    }

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry properties) {
        // Ensure tests that exercise migration into another schema cannot leak
        // that session setting into a later pooled application connection.
        properties.add("spring.datasource.hikari.schema", () -> "public");
        properties.add("spring.datasource.url", () -> POSTGRES == null ? LOCAL_URL : POSTGRES.getJdbcUrl());
        properties.add("spring.datasource.username", () -> POSTGRES == null
                ? System.getenv().getOrDefault("SOBERITY_TEST_DB_USER", "soberity_test") : POSTGRES.getUsername());
        properties.add("spring.datasource.password", () -> POSTGRES == null
                ? System.getenv().getOrDefault("SOBERITY_TEST_DB_PASSWORD", "") : POSTGRES.getPassword());
    }
}
