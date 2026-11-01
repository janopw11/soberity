package com.soberity.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.soberity.common.web.CorrelationIdFilter;
import com.soberity.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

class ApiSecurityIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousProtectedRequestReturnsProblemJson401() throws Exception {
        mockMvc.perform(get("/api/v1/test-probe/boom"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/problem+json")))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void healthProbesAreUp() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void openApiDocumentIsAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists());
    }

    @Test
    void responsesDoNotSetCookies() throws Exception {
        MvcResult result = mockMvc.perform(get("/actuator/health/liveness")).andReturn();
        assertThat(result.getResponse().getHeader("Set-Cookie")).isNull();
    }

    @Test
    void echoesValidCorrelationId() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness").header(CorrelationIdFilter.HEADER, "abc-123.XYZ_9"))
                .andExpect(header().string(CorrelationIdFilter.HEADER, "abc-123.XYZ_9"));
    }

    @Test
    void replacesInvalidCorrelationId() throws Exception {
        MvcResult result = mockMvc.perform(get("/actuator/health/liveness")
                        .header(CorrelationIdFilter.HEADER, "bad value with spaces"))
                .andReturn();
        String generated = result.getResponse().getHeader(CorrelationIdFilter.HEADER);
        assertThat(generated).isNotNull().isNotEqualTo("bad value with spaces");
    }

    @Test
    void allowsConfiguredCorsOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/test-probe/validate")
                        .header("Origin", "http://localhost:8081")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"));
    }

    @Test
    void rejectsUnconfiguredCorsOrigin() throws Exception {
        MvcResult result = mockMvc.perform(options("/api/v1/test-probe/validate")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andReturn();
        assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin")).isNull();
    }

    @Test
    @WithMockUser
    void invalidBodyReturnsValidationProblem() throws Exception {
        mockMvc.perform(post("/api/v1/test-probe/validate")
                        .contentType("application/json")
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser
    void unexpectedErrorReturnsGenericProblemWithoutDetails() throws Exception {
        mockMvc.perform(get("/api/v1/test-probe/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred."))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("internal detail"))));
    }

    @Test
    @WithMockUser
    void unknownRouteReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/does-not-exist")).andExpect(status().isNotFound());
    }
}
