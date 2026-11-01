package com.soberity.support;

import com.soberity.identity.token.TokenVerifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
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

    @ServiceConnection
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    /** Replaces Firebase verification so tests never call Google; token behavior is stubbed per test. */
    @MockitoBean
    protected TokenVerifier tokenVerifier;

    static {
        POSTGRES.start();
    }
}
