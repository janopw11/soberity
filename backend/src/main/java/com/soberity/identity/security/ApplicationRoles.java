package com.soberity.identity.security;

import com.soberity.identity.token.VerifiedToken;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Global privileges come only from operator-managed database grants, never client claims. */
@Component
public class ApplicationRoles {
    private final JdbcTemplate jdbc;

    public ApplicationRoles(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean isSuperAdmin(VerifiedToken actor) {
        if (actor == null || !actor.emailVerified()) return false;
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM application_role r
                  WHERE r.firebase_uid=? AND r.role='SUPER_ADMIN' AND r.active
                  AND NOT EXISTS(SELECT 1 FROM deleted_account d WHERE d.firebase_uid=r.firebase_uid))
                """, Boolean.class, actor.uid()));
    }
}
