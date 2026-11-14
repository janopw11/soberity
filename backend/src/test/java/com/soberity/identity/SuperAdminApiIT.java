package com.soberity.identity;

import com.soberity.support.AbstractIntegrationTest;
import com.soberity.identity.token.VerifiedToken;
import com.soberity.events.application.EventAccess;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SuperAdminApiIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired EventAccess events;

    private String user(boolean verified, boolean grant) throws Exception {
        String uid="super-admin-"+UUID.randomUUID();
        when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,verified));
        if(grant) jdbc.update("INSERT INTO application_role(firebase_uid,role,granted_by) VALUES (?,'SUPER_ADMIN','test-operator')",uid);
        return uid;
    }

    @Test void oneGrantProvidesEditorialEventsAndCommunityAccess() throws Exception {
        String uid=user(true,true);
        mvc.perform(get("/api/v1/editorial/me").header("Authorization","Bearer "+uid))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles",org.hamcrest.Matchers.containsInAnyOrder("SUPER_ADMIN","AUTHOR","REVIEWER")));
        for(String path:new String[]{"/api/v1/editorial/materials","/api/v1/admin/events","/api/v1/editorial/discussions"})
            mvc.perform(get(path).header("Authorization","Bearer "+uid)).andExpect(status().isOk());
        assertThat(events.isModerator(new VerifiedToken(uid,true))).isTrue();
    }

    @Test void revocationAppliesOnNextRequestWithoutChangingToken() throws Exception {
        String uid=user(true,true);
        mvc.perform(get("/api/v1/admin/events").header("Authorization","Bearer "+uid)).andExpect(status().isOk());
        jdbc.update("UPDATE application_role SET active=false WHERE firebase_uid=?",uid);
        for(String path:new String[]{"/api/v1/editorial/materials","/api/v1/admin/events","/api/v1/editorial/discussions"})
            mvc.perform(get(path).header("Authorization","Bearer "+uid)).andExpect(status().isForbidden());
    }

    @Test void headersCannotGrantPrivilegesAndUnverifiedAccountsStayBlocked() throws Exception {
        for(String uid:new String[]{user(true,false),user(false,true)})
            for(String path:new String[]{"/api/v1/editorial/materials","/api/v1/admin/events"})
                mvc.perform(get(path).header("Authorization","Bearer "+uid).header("X-Role","SUPER_ADMIN"))
                    .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/events").header("X-Role","SUPER_ADMIN")).andExpect(status().isUnauthorized());
    }

    @Test void accountErasureRemovesGrantAndPreventsRegrantFromRestoringAccess() throws Exception {
        String uid=user(true,true);
        jdbc.update("INSERT INTO deleted_account(firebase_uid,requested_at) VALUES (?,now())",uid);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM application_role WHERE firebase_uid=?",Integer.class,uid)).isZero();
        jdbc.update("INSERT INTO application_role(firebase_uid,role,granted_by) VALUES (?,'SUPER_ADMIN','test-operator')",uid);
        for(String path:new String[]{"/api/v1/editorial/materials","/api/v1/admin/events"})
            mvc.perform(get(path).header("Authorization","Bearer "+uid)).andExpect(status().isForbidden());
    }
}
