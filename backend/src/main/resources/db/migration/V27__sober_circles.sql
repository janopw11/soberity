CREATE TABLE community_circle (
 id uuid PRIMARY KEY,
 name varchar(120) NOT NULL CHECK(length(btrim(name))>0),
 slug varchar(100) NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description varchar(4000) NOT NULL CHECK(length(btrim(description))>0),
 category varchar(40) NOT NULL CHECK(category IN ('NIGHTLIFE','FITNESS','COFFEE','WELLBEING','OUTDOORS','ART','GAMES')),
 cover_id uuid REFERENCES events_media(id),
 guidelines varchar(6000) NOT NULL CHECK(length(btrim(guidelines))>0),
 active boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX community_circle_directory ON community_circle(active,category,lower(name),id);
CREATE TABLE community_circle_member (
 circle_id uuid NOT NULL REFERENCES community_circle(id) ON DELETE CASCADE,
 user_ref char(64) NOT NULL CHECK(user_ref ~ '^[0-9a-f]{64}$'),
 joined_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(circle_id,user_ref)
);
CREATE INDEX community_circle_member_user ON community_circle_member(user_ref,circle_id);
CREATE TABLE community_circle_event (
 circle_id uuid NOT NULL REFERENCES community_circle(id) ON DELETE CASCADE,
 event_id uuid NOT NULL REFERENCES sober_event(id) ON DELETE CASCADE,
 PRIMARY KEY(circle_id,event_id)
);
CREATE INDEX community_circle_event_event ON community_circle_event(event_id);
CREATE TABLE community_circle_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 circle_id uuid NOT NULL REFERENCES community_circle(id),
 actor_ref char(64) NOT NULL,
 version integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION community_erase_membership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.firebase_uid,0));
 DELETE FROM community_circle_member WHERE user_ref=encode(sha256(convert_to(NEW.firebase_uid,'UTF8')),'hex');
 RETURN NEW;
END $$;
CREATE TRIGGER community_membership_erasure BEFORE INSERT ON deleted_account
 FOR EACH ROW EXECUTE FUNCTION community_erase_membership();
