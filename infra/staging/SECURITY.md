# Phase 0 security review — 2026-11-03

Scope: current identity/profile API, client Auth adapter and sensitive account
operations, CI permissions/artifacts, staging edge, credentials, backup and
recovery. This review is not a penetration test or production acceptance.
The owner confirmed P0-I12 manual cross-platform checks; P0-I13 still needs
actual CI, EAS, staging and restore-drill evidence.

| Area                   | Reviewed control / evidence                                                                                                                                                      | Acceptance limit                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity               | Firebase Admin verifies ID tokens; filter clears rejected authentication; backend requires verified email role for `/api/v1/**`                                                  | Current integration rerun blocked by Docker read-only; real staging token verification pending                                                                            |
| Ownership / validation | ProfileController derives UID from principal, not client input; bounded profile DTOs; ProfileService keys operations by UID; tests cover account isolation                       | Web fixture does not establish real backend ACL                                                                                                                           |
| Sensitive operations   | Client reauthenticates before password change/deletion; deletion stops if backend fails; pending deletion is resumable                                                           | Backend DELETE itself checks owner authorization, not recent `auth_time`; token revocation/recent-auth policy needs a separate hardening decision before broader exposure |
| Sessions / CSRF        | Stateless Bearer API, no application cookies, explicit CORS origins; CSRF disabled for that model                                                                                | Any future cookie/BFF flow must revisit CSRF and SameSite rules                                                                                                           |
| Error/log privacy      | Problem JSON omits internal errors; ECS logs; bounded correlation IDs; no edge access log or smoke response-body output                                                          | Review external telemetry retention/redaction before enabling an exporter                                                                                                 |
| CI                     | Read-only permissions, no pull_request_target, no deploy credentials, checkout credentials not persisted, pinned action commits, frozen install, history Gitleaks with redaction | Hosted workflow has not run for these changes; traces contain only demo test data and expire in 3 days                                                                    |
| Credential packaging   | Ignore checks cover env/ADC/signing/backup/local tool paths; backend Docker context excludes credentials; staging uses mounted files outside checkout                            | Configure least-privilege staging ADC and inspect EAS/archive/image artifacts before upload                                                                               |
| Network / HTTPS        | Only edge ports 80/443; API/DB private; single exact CORS origin; ACME config; HSTS, nosniff, no-referrer, frame denial                                                          | Public DNS/ACME and real HTTPS certificate not verified; local Caddy test uses a private test CA                                                                          |
| CSP                    | Edge restricts frame ancestors, objects and base URI without breaking Expo inline runtime                                                                                        | This is a partial CSP, not a strict script/style allowlist or a claim of complete XSS protection                                                                          |
| Management             | Only health probes pass through edge; OpenAPI disabled in staging; readiness includes database health                                                                            | Configure and verify uptime/alert delivery on the actual host                                                                                                             |
| Recovery               | Daily dump timer; mode 0600; partial dumps removed; isolated restore target only; no automatic database deletion                                                                 | Shell behavior tested with synthetic Docker; real PostgreSQL restore, encryption/offsite upload, RPO/RTO still unverified                                                 |

Remaining release work: provision the non-production environment; rerun full
Maven verify after Docker repair; obtain hosted CI run and EAS preview build IDs;
test real Firebase email/action links, native networking and API authorization;
measure restore and confirm offsite recovery; finish P0-I03A V02/V03 and obtain
the owner's explicit Phase 0 gate/next-phase acceptance. Do not infer that the
P0-I12 acceptance repaired the agent's Docker or closed P0-I03A.

Rate limiting/abuse controls, stricter CSP, dependency/container vulnerability
triage, token revocation/recent-auth policy and external alerting need validation
before wider/public access. No account credentials, production operations,
cloud builds, deployment, payments or store submission were performed here.

Secret evidence: `gitleaks git . --redact --no-banner --log-opts="--all"`, plus
`pnpm check:secrets`. A clean scan is not proof that runtime logs or external
accounts contain no secrets. Do not print scan findings without redaction.
