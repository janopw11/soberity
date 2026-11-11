-- Private, user-scoped "going" intent for a published event. Stores only the hashed user reference,
-- the event id and the declaration time; removed when the user withdraws, deletes the account or the event is removed.
CREATE TABLE events_interest (
 event_id uuid NOT NULL REFERENCES sober_event(id) ON DELETE CASCADE,
 user_ref char(64) NOT NULL CHECK(user_ref ~ '^[0-9a-f]{64}$'),
 declared_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(event_id,user_ref)
);
CREATE INDEX events_interest_user ON events_interest(user_ref,declared_at);
