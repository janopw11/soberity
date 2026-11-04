# Sober Events — P2-I00 foundation

Implementation: `src/main/java/com/soberity/events/domain/EventPolicy.java`.
Product policy: `../docs/policies/EVENTS_POLICY.md`.
Acceptance scenarios (not executed): `../docs/policies/EVENTS_POLICY_SCENARIOS.md`.
Priority decision: `../docs/adr/010-events-before-myth-battle.md`.

The pure domain class defines Nightlife/Lifestyle categories, alcohol policy,
organizer verification, moderation states/actors and assessment reason codes.
Missing controls use nullable Booleans: no evidence is not treated as no alcohol.
Assessment returns READY_FOR_REVIEW / NEEDS_INFORMATION / INELIGIBLE, never an
automatically approved event. Status transition checks are necessary but not
sufficient for authorization: later APIs must enforce verified identity,
organizer membership, independent review, version and publication gates.

`listedByDefault` is only the stored-state/classification/verification predicate;
it is not a complete public event query (date/end, approved revision and current
source checks also apply). Strict alcohol-free is default; sober-friendly must
be separately and explicitly requested.

No migration, endpoint, UI or ingestion is added in P2-I00. No event/organizer is
seeded or approved. Existing `/events` placeholder and Home preview continue to
be placeholders, not a working catalog. No backend restart/build/tests or extra
verification were performed. Next implementation: P2-I01 only on instruction.
