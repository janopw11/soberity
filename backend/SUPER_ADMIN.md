# SUPER_ADMIN

`SUPER_ADMIN` is an operator-managed application role stored in PostgreSQL,
associated with a verified Firebase UID. It grants the current AUTHOR and
REVIEWER capabilities (Science, blog, quizzes, weekly content and discussion
moderation), Events administrator capabilities (including Circles), and Events
moderator/organizer authorization. Existing clients receive effective editorial
roles from `/api/v1/editorial/me`; Events access is checked by the server.

It does not bypass verified-email requirements, deleted-account restrictions,
scientific publication rules, independent review, content ownership rules,
private user-data boundaries or disabled/unfinished endpoints. New feature
modules must explicitly integrate `ApplicationRoles` or the existing access
services and include a SUPER_ADMIN authorization test. This is not a blanket
Spring Security permit-all rule.

## Grant and revoke

Apply Flyway V29 through the normal backend startup. Resolve the account by
email using Firebase Admin in the intended project; do not guess a UID or trust
client-supplied role headers. In the intended database, use bound parameters:

```sql
INSERT INTO application_role(firebase_uid, role, granted_by)
VALUES (:verified_uid, 'SUPER_ADMIN', :operator)
ON CONFLICT (firebase_uid, role) DO UPDATE
SET active=true, granted_by=EXCLUDED.granted_by, granted_at=now();

UPDATE application_role SET active=false
WHERE firebase_uid=:verified_uid AND role='SUPER_ADMIN';
```

No account receives the role by default. No public self-service grant endpoint
exists. Revocation takes effect on the next server request, without refreshing
the Firebase token; reload an already-open client panel to refresh its display.
Deleting an account removes its global grants. Existing action audits retain
the actual actor identity; the role does not impersonate other users.

Validation: `SuperAdminApiIT` covers effective roles, cross-module access,
revocation, forged headers, unverified/deleted accounts and erasure.
`EditorialApiIT` also checks that SUPER_ADMIN cannot self-approve scientific
material or publish its own independently approved claim.
