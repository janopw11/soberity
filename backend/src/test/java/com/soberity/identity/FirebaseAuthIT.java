package com.soberity.identity;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.soberity.identity.token.InvalidTokenException;
import com.soberity.identity.token.VerifiedToken;
import com.soberity.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class FirebaseAuthIT extends AbstractIntegrationTest {

    private static final String ME = "/api/v1/identity/me";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void missingAuthorizationReturns401() throws Exception {
        mockMvc.perform(get(ME))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void nonBearerSchemeReturns401() throws Exception {
        mockMvc.perform(get(ME).header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectedTokenReturns401() throws Exception {
        when(tokenVerifier.verify(anyString())).thenThrow(new InvalidTokenException("bad", null));
        mockMvc.perform(get(ME).header("Authorization", "Bearer forged-or-expired"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void unverifiedUserReturns403WithVerificationDetail() throws Exception {
        when(tokenVerifier.verify("unverified-token")).thenReturn(new VerifiedToken("uid-1", false));
        mockMvc.perform(get(ME).header("Authorization", "Bearer unverified-token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Email verification is required."));
    }

    @Test
    void verifiedUserReceivesOwnIdentity() throws Exception {
        when(tokenVerifier.verify("verified-token")).thenReturn(new VerifiedToken("uid-2", true));
        mockMvc.perform(get(ME).header("Authorization", "Bearer verified-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uid").value("uid-2"))
                .andExpect(jsonPath("$.emailVerified").value(true));
    }

    @Test
    void clientSuppliedRoleHeadersDoNotGrantAccess() throws Exception {
        when(tokenVerifier.verify("unverified-token-2")).thenReturn(new VerifiedToken("uid-3", false));
        mockMvc.perform(get(ME)
                        .header("Authorization", "Bearer unverified-token-2")
                        .header("X-Role", "ROLE_USER")
                        .header("X-User-Id", "uid-admin"))
                .andExpect(status().isForbidden());
    }
}
