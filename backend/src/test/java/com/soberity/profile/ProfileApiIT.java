package com.soberity.profile;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.soberity.identity.token.VerifiedToken;
import com.soberity.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class ProfileApiIT extends AbstractIntegrationTest {

    private static final String ME = "/api/v1/me";

    @Autowired
    private MockMvc mockMvc;

    /** Registers a verified Firebase user with a unique token; each test uses fresh UIDs. */
    private String verifiedUser(String uid) throws Exception {
        String token = "token-" + uid;
        when(tokenVerifier.verify(token)).thenReturn(new VerifiedToken(uid, true));
        return "Bearer " + token;
    }

    private static String newUid() {
        return "uid-" + UUID.randomUUID();
    }

    private static MockHttpServletRequestBuilder withAuth(MockHttpServletRequestBuilder builder, String bearer) {
        return builder.header("Authorization", bearer);
    }

    @Test
    void anonymousRequestsAreRejected() throws Exception {
        mockMvc.perform(get(ME)).andExpect(status().isUnauthorized());
        mockMvc.perform(patch(ME).contentType("application/json").content("{\"city\":\"Kraków\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unverifiedUserCannotUseProfile() throws Exception {
        String uid = newUid();
        when(tokenVerifier.verify("unverified-" + uid)).thenReturn(new VerifiedToken(uid, false));
        mockMvc.perform(withAuth(post(ME), "Bearer unverified-" + uid)
                        .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void provisionCreatesProfileWithGuestChoiceAndKeepsExistingPreference() throws Exception {
        String bearer = verifiedUser(newUid());

        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json")
                        .content("{\"initialLocale\":\"pl\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locale").value("pl"))
                .andExpect(jsonPath("$.interests").isEmpty());

        // A later provisioning with another guest choice must not override the stored account preference.
        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json")
                        .content("{\"initialLocale\":\"en\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locale").value("pl"));
    }

    @Test
    void getReturnsNotFoundBeforeProvisioning() throws Exception {
        mockMvc.perform(withAuth(get(ME), verifiedUser(newUid())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void patchUpdatesAllowedFieldsAndPersistsAcrossReads() throws Exception {
        String bearer = verifiedUser(newUid());
        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json").content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json").content("""
                        {"displayName":"  Anna  ","city":"Gdańsk","interests":["science","sport","science"],"locale":"en"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Anna"))
                .andExpect(jsonPath("$.city").value("Gdańsk"))
                .andExpect(jsonPath("$.interests.length()").value(2))
                .andExpect(jsonPath("$.locale").value("en"));

        // Simulates signing in again: the profile is read back from PostgreSQL.
        mockMvc.perform(withAuth(get(ME), bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Anna"))
                .andExpect(jsonPath("$.locale").value("en"));
    }

    @Test
    void blankDisplayNameClearsTheValue() throws Exception {
        String bearer = verifiedUser(newUid());
        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json").content("{\"initialLocale\":\"en\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json")
                        .content("{\"displayName\":\"Anna\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json")
                        .content("{\"displayName\":\"   \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").doesNotExist());
    }

    @Test
    void ownerCannotBeChangedFromTheBody() throws Exception {
        String ownerUid = newUid();
        String attackerUid = newUid();
        String owner = verifiedUser(ownerUid);
        String attacker = verifiedUser(attackerUid);
        mockMvc.perform(withAuth(post(ME), owner).contentType("application/json").content("{\"initialLocale\":\"pl\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(withAuth(post(ME), attacker).contentType("application/json").content("{}"))
                .andExpect(status().isOk());

        // Fields outside the contract (uid, role) are ignored and never applied to another account.
        mockMvc.perform(withAuth(patch(ME), attacker).contentType("application/json").content(
                        "{\"uid\":\"" + ownerUid + "\",\"role\":\"ADMIN\",\"city\":\"Poznań\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Poznań"));

        mockMvc.perform(withAuth(get(ME), owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locale").value("pl"))
                .andExpect(jsonPath("$.city").doesNotExist());
    }

    @Test
    void usersOnlySeeTheirOwnProfile() throws Exception {
        String alice = verifiedUser(newUid());
        String bob = verifiedUser(newUid());
        mockMvc.perform(withAuth(post(ME), alice).contentType("application/json").content("{}"))
                .andExpect(status().isOk());
        mockMvc.perform(withAuth(patch(ME), alice).contentType("application/json")
                        .content("{\"displayName\":\"Alice\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(withAuth(post(ME), bob).contentType("application/json").content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").doesNotExist());
    }

    @Test
    void invalidValuesAreRejectedWithBadRequest() throws Exception {
        String bearer = verifiedUser(newUid());
        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json").content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json").content("{\"locale\":\"de\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json")
                        .content("{\"interests\":[\"gaming\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(withAuth(patch(ME), bearer).contentType("application/json")
                        .content("{\"displayName\":\"" + "x".repeat(51) + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(withAuth(post(ME), bearer).contentType("application/json")
                        .content("{\"initialLocale\":\"fr\"}"))
                .andExpect(status().isBadRequest());
    }
}
