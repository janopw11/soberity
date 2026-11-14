# Event participation — Community Phase 2

The existing Going Sober relation is the v1 Going / Not Going RSVP. No duplicate entity/table is introduced. Participation is informational, not a booking, ticket, organizer notification or permission to attend. Participant identities are private; only an aggregate is exposed.

## Storage and consistency

`events_interest` (V25) stores `event_id`, `user_ref` (SHA-256 of the verified Firebase UID), and `declared_at`. Its composite primary key prevents duplicate registrations; its event FK cascades on physical deletion. The existing hashed identity reference is retained instead of adding a second profile relationship. The user index supports the private list.

PUT uses `ON CONFLICT DO NOTHING`, preserving the first declaration timestamp. DELETE physically removes the relation; no cancellation history is retained. Rejoining creates a fresh timestamp. Counts use `count(*)` on active relations, not a mutable counter. Authenticated state and count come from one SQL snapshot.

Private operations verify the account and use the existing account-erasure advisory lock. Joining also locks the event row used by admin publication/deletion, then checks eligibility and end time. Concurrent identical requests are harmless. Competing join/cancel requests are serialized for the same account; the final committed operation wins.

V26 adds erasure triggers for account deletion and event DELETED/CANCELLED states, plus repair of obsolete V25 rows for those accounts/events. It does not change event discovery, publication, categories or location rules. Account erasure and new registrations use the same lock, preventing resurrection with a stale token. Test migrations run only on isolated PostgreSQL, not the local application database.

## Endpoints

| Method / path                                   | Authorization                  | Response                                                                                                          |
| ----------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/events/{eventId}/participation`    | Public                         | `200 {participant_count, can_join}`; no participant list or identities                                            |
| `GET /api/v1/me/event-interests/{eventId}`      | Verified authenticated account | `200 {declared, participant_count, can_join}`; existing `declared` field preserved                                |
| `PUT /api/v1/me/event-interests/{eventId}`      | Verified authenticated account | `204`, idempotent Going                                                                                           |
| `DELETE /api/v1/me/event-interests/{eventId}`   | Verified authenticated account | `204`, idempotent Not Going, including already removed/unavailable events                                         |
| `GET /api/v1/me/event-interests?page=0&size=20` | Verified authenticated account | Existing `{items,page,size,total}` with caller's eligible upcoming/ongoing event projections, chronological order |

No endpoint accepts another user's identity. Query/body identifiers cannot override the token owner. UUIDs and pagination are validated. Missing auth is 401; unverified/deleted accounts are 403; malformed UUID/pagination is 400. Joining hidden/deleted/draft/ended/nonexistent events returns 404. Public summary and private state follow the existing event-detail visibility rules; visible ended events have `can_join=false`, and an existing RSVP can still be withdrawn. Responses use existing Problem Details and no-store cache policy.

The private list is ready for Phase 5, with its existing upcoming/ongoing scope. A historical activity feed and complete My Activities dashboard are explicitly out of scope.

## Consumer behavior

The existing EventGoingButton stays below Tickets. It loads state on focus, displays the real count, offers Join Event or Cancel RSVP, and preserves Going Sober confirmation. Guests read only the public count and navigate to sign-in. Reads and writes have bounded network timeouts; after each write, state/count are fetched again. A failed or uncertain write hides mutation controls until an explicit refresh reconciles the server state. Late responses from another account/event or a blurred screen are discarded; rapid repeated taps are blocked.

EN/PL, Ocean themes, shared Button/Alert/LoadingState, live announcements and the existing responsive action width are retained. Community Hub links and event discovery/map code are unchanged.

## Validation / activation

Commands and results are recorded under P5-I00B in PHASES.md. The integration suite uses real isolated PostgreSQL with mocked Firebase token verification; browser tests use isolated API fixtures. No production migration/deployment is performed.

To activate in local development after review, restart the existing backend using `node scripts/start-local-backend.mjs` (see RUN.md); Flyway applies V26. Native runtime/screen-reader checks remain distinct from successful Expo native exports.

Executed verification (2026-11-12, reviewed 2026-11-13): backend 39 unit/architecture +24 integration PASS; frontend 41 PASS; browser RSVP12 + Hub10 PASS after one artifact-collision rerun. Web/native exports, typecheck and changed-file lint PASS. Existing map browser coverage fails at the colocated-event preview assertion in all four variants; production map code unchanged. Native runtime/manual accessibility and application DB activation remain unverified.
