-- P2-I01: real event data only enters through authenticated organizer/moderation APIs.
CREATE TABLE events_category (
 code varchar(32) PRIMARY KEY,
 track varchar(24) NOT NULL CHECK(track IN ('SOBER_NIGHTLIFE','SOBER_LIFESTYLE')),
 label_en varchar(100) NOT NULL, label_pl varchar(100) NOT NULL,
 UNIQUE(code,track)
);
INSERT INTO events_category VALUES
 ('SOBER_PARTY','SOBER_NIGHTLIFE','Sober party','Impreza bez alkoholu'),
 ('SOBER_RAVE','SOBER_NIGHTLIFE','Sober rave','Rave bez alkoholu'),
 ('DANCE','SOBER_NIGHTLIFE','Dance','Taniec'),
 ('LIVE_MUSIC','SOBER_NIGHTLIFE','Live music','Muzyka na żywo'),
 ('COFFEE_MEETUP','SOBER_LIFESTYLE','Coffee meetup','Spotkanie przy kawie'),
 ('SPORT','SOBER_LIFESTYLE','Sport','Sport'),
 ('OUTDOORS','SOBER_LIFESTYLE','Outdoors','Plener'),
 ('WORKSHOP','SOBER_LIFESTYLE','Workshop','Warsztaty'),
 ('CULTURE','SOBER_LIFESTYLE','Culture','Kultura'),
 ('OTHER','SOBER_LIFESTYLE','Other','Inne');
CREATE TABLE events_moderator (
 firebase_uid varchar(128) PRIMARY KEY,
 active boolean NOT NULL DEFAULT true,
 granted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE events_organizer (
 id uuid PRIMARY KEY,
 name varchar(200) NOT NULL CHECK(length(btrim(name))>0),
 description text NOT NULL CHECK(length(btrim(description))>0),
 website varchar(2048) NOT NULL CHECK(website ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
 contact_email varchar(254),
 contact_actor_ref char(64) NOT NULL,
 created_by_ref char(64) NOT NULL,
 verification_reference text,
 verification varchar(16) NOT NULL DEFAULT 'UNVERIFIED' CHECK(verification IN ('UNVERIFIED','IN_REVIEW','VERIFIED','REJECTED','SUSPENDED')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE events_membership (
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 firebase_uid varchar(128) NOT NULL,
 actor_ref char(64) NOT NULL,
 role varchar(16) NOT NULL CHECK(role IN ('OWNER','MANAGER')),
 PRIMARY KEY(organizer_id,firebase_uid)
);
CREATE INDEX events_member_uid ON events_membership(firebase_uid);
CREATE TABLE events_organizer_review (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 target_version integer NOT NULL,
 moderator_ref char(64) NOT NULL,
 decision varchar(16) NOT NULL CHECK(decision IN ('VERIFIED','REJECTED','SUSPENDED')),
 notes text NOT NULL CHECK(length(btrim(notes))>0),
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(organizer_id,target_version)
);
CREATE TRIGGER events_organizer_review_immutable BEFORE UPDATE OR DELETE ON events_organizer_review
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TABLE events_venue (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 name varchar(200) NOT NULL, address varchar(500) NOT NULL,
 city varchar(150) NOT NULL, region varchar(150), country_code char(2) NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
 latitude double precision, longitude double precision,
 CHECK((latitude IS NULL AND longitude IS NULL) OR
       (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
 UNIQUE(id,organizer_id)
);
CREATE INDEX events_venue_city ON events_venue(lower(city),country_code);
CREATE TRIGGER events_venue_immutable BEFORE UPDATE OR DELETE ON events_venue
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TABLE events_media (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 alt_text varchar(500) NOT NULL CHECK(length(btrim(alt_text))>0),
 width integer NOT NULL CHECK(width>0), height integer NOT NULL CHECK(height>0),
 data bytea NOT NULL CHECK(octet_length(data) BETWEEN 1 AND 5242880),
 uploaded_by_ref char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(id,organizer_id)
);
CREATE TRIGGER events_media_immutable BEFORE UPDATE OR DELETE ON events_media
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TABLE sober_event (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 status varchar(24) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','REJECTED','CANCELLED','ARCHIVED')),
 current_revision integer NOT NULL DEFAULT 1 CHECK(current_revision>0),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 published_at timestamptz,
 published_revision integer,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(id,organizer_id)
);
CREATE INDEX events_organizer_status ON sober_event(organizer_id,status);
CREATE TABLE events_revision (
 event_id uuid NOT NULL,
 organizer_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0),
 author_ref char(64) NOT NULL,
 title varchar(300) NOT NULL CHECK(length(btrim(title))>0),
 description text NOT NULL CHECK(length(btrim(description))>0),
 locale varchar(2) NOT NULL CHECK(locale IN ('en','pl')),
 track varchar(24) NOT NULL,
 category_code varchar(32) NOT NULL,
 alcohol_policy varchar(24) NOT NULL CHECK(alcohol_policy IN ('ALCOHOL_FREE','SOBER_FRIENDLY')),
 alcohol_rules text NOT NULL CHECK(length(btrim(alcohol_rules))>0),
 alcohol_sold boolean, alcohol_served boolean, alcohol_permitted boolean, alcohol_free_participation boolean,
 beverage_notes text NOT NULL,
 venue_id uuid NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 timezone varchar(100) NOT NULL,
 price_kind varchar(16) NOT NULL CHECK(price_kind IN ('FREE','PAID','UNKNOWN')),
 price_minor bigint, currency char(3),
 accessibility varchar(24) NOT NULL CHECK(accessibility IN ('UNKNOWN','ACCESSIBLE','PARTIAL','NOT_ACCESSIBLE')),
 accessibility_notes text,
 availability varchar(16) NOT NULL DEFAULT 'UNKNOWN' CHECK(availability IN ('UNKNOWN','AVAILABLE','SOLD_OUT')),
 entry_rules text NOT NULL,
 external_ticket_url varchar(2048) CHECK(external_ticket_url IS NULL OR external_ticket_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
 source_url varchar(2048) NOT NULL CHECK(source_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
 source_reference text NOT NULL,
 content_rights_attested boolean NOT NULL DEFAULT false,
 cover_id uuid,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(event_id,revision),
 FOREIGN KEY(event_id,organizer_id) REFERENCES sober_event(id,organizer_id),
 FOREIGN KEY(venue_id,organizer_id) REFERENCES events_venue(id,organizer_id),
 FOREIGN KEY(cover_id,organizer_id) REFERENCES events_media(id,organizer_id),
 FOREIGN KEY(category_code,track) REFERENCES events_category(code,track),
 CHECK((price_kind='FREE' AND price_minor IS NOT NULL AND price_minor=0 AND currency IS NULL) OR
       (price_kind='PAID' AND price_minor IS NOT NULL AND price_minor>0 AND currency IS NOT NULL AND currency ~ '^[A-Z]{3}$') OR
       (price_kind='UNKNOWN' AND price_minor IS NULL AND currency IS NULL)),
 CHECK(alcohol_policy<>'ALCOHOL_FREE' OR
       (alcohol_sold IS NOT TRUE AND alcohol_served IS NOT TRUE AND alcohol_permitted IS NOT TRUE)),
 CHECK(category_code NOT IN ('SOBER_PARTY','SOBER_RAVE') OR alcohol_policy='ALCOHOL_FREE')
);
ALTER TABLE sober_event ADD CONSTRAINT event_current_revision_fk FOREIGN KEY(id,current_revision)
 REFERENCES events_revision(event_id,revision) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE sober_event ADD CONSTRAINT event_published_revision_fk FOREIGN KEY(id,published_revision)
 REFERENCES events_revision(event_id,revision) DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION events_guard_timezone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone) THEN
  RAISE EXCEPTION 'IANA timezone required' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_timezone_guard BEFORE INSERT ON events_revision FOR EACH ROW EXECUTE FUNCTION events_guard_timezone();
CREATE INDEX events_revision_dates ON events_revision(starts_at,ends_at);
CREATE INDEX events_revision_classification ON events_revision(category_code,alcohol_policy,locale);
CREATE TRIGGER events_revision_immutable BEFORE UPDATE OR DELETE ON events_revision
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TABLE events_review (
 id uuid PRIMARY KEY,
 event_id uuid NOT NULL, revision integer NOT NULL,
 moderator_ref char(64) NOT NULL,
 decision varchar(24) NOT NULL CHECK(decision IN ('APPROVED','CHANGES_REQUESTED','REJECTED')),
 source_verified boolean NOT NULL,
 content_rights_verified boolean NOT NULL,
 alcohol_controls_verified boolean NOT NULL,
 beverage_abv_verified boolean NOT NULL,
 notes text NOT NULL CHECK(length(btrim(notes))>0),
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(event_id,revision) REFERENCES events_revision(event_id,revision),
 UNIQUE(event_id,revision),
 CHECK(decision<>'APPROVED' OR (source_verified AND content_rights_verified AND alcohol_controls_verified AND beverage_abv_verified))
);
CREATE TRIGGER events_review_immutable BEFORE UPDATE OR DELETE ON events_review
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TABLE events_audit (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES events_organizer(id),
 event_id uuid REFERENCES sober_event(id),
 actor_ref char(64),
 action varchar(40) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER events_audit_immutable BEFORE UPDATE OR DELETE ON events_audit
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
-- Schema only: inquiry submission/dispatch is P2-I04, not a fake working contact form.
CREATE TABLE events_contact_inquiry (
 id uuid PRIMARY KEY,
 event_id uuid NOT NULL REFERENCES sober_event(id),
 sender_uid varchar(128),
 body text CHECK(body IS NULL OR length(body) BETWEEN 1 AND 10000),
 reply_email varchar(254),
 status varchar(16) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REPLIED','CLOSED','SPAM')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), closed_at timestamptz
);
CREATE INDEX events_inquiry_sender ON events_contact_inquiry(sender_uid);

CREATE FUNCTION events_guard_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE event_row sober_event%ROWTYPE; content_row events_revision%ROWTYPE;
BEGIN
 SELECT * INTO event_row FROM sober_event WHERE id=NEW.event_id FOR UPDATE;
 SELECT * INTO content_row FROM events_revision WHERE event_id=NEW.event_id AND revision=NEW.revision;
 IF event_row.status<>'IN_REVIEW' OR event_row.current_revision<>NEW.revision
    OR content_row.author_ref=NEW.moderator_ref
    OR EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=event_row.organizer_id AND actor_ref=NEW.moderator_ref)
    OR NEW.reviewed_at>clock_timestamp() THEN
  RAISE EXCEPTION 'Independent review of the current submitted revision required' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_review_guard BEFORE INSERT ON events_review FOR EACH ROW EXECUTE FUNCTION events_guard_review();

CREATE FUNCTION events_guard_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE content_row events_revision%ROWTYPE;
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'DRAFT' OR NEW.current_revision<>1 OR NEW.version<>1 OR NEW.published_at IS NOT NULL OR NEW.published_revision IS NOT NULL THEN
   RAISE EXCEPTION 'Events must start as unpublished drafts' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 IF NEW.status<>OLD.status AND NOT (
  (OLD.status='DRAFT' AND NEW.status IN ('IN_REVIEW','ARCHIVED')) OR
  (OLD.status='CHANGES_REQUESTED' AND NEW.status IN ('DRAFT','IN_REVIEW','ARCHIVED')) OR
  (OLD.status='IN_REVIEW' AND NEW.status IN ('DRAFT','CHANGES_REQUESTED','APPROVED','REJECTED','CANCELLED')) OR
  (OLD.status='APPROVED' AND NEW.status IN ('IN_REVIEW','PUBLISHED','CHANGES_REQUESTED','CANCELLED')) OR
  (OLD.status='PUBLISHED' AND NEW.status IN ('IN_REVIEW','CANCELLED','ARCHIVED')) OR
  (OLD.status IN ('CANCELLED','REJECTED') AND NEW.status='ARCHIVED')) THEN
  RAISE EXCEPTION 'Invalid event transition' USING ERRCODE='23514';
 END IF;
 IF NEW.status<>'PUBLISHED' AND (NEW.published_revision IS DISTINCT FROM OLD.published_revision OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
  RAISE EXCEPTION 'Published snapshot is immutable outside publication' USING ERRCODE='23514';
 END IF;
 IF NEW.id<>OLD.id OR NEW.organizer_id<>OLD.organizer_id OR NEW.created_at<>OLD.created_at OR NEW.version<>OLD.version+1 THEN
  RAISE EXCEPTION 'Event identity is immutable and versions must advance' USING ERRCODE='23514';
 END IF;
 IF NEW.current_revision<>OLD.current_revision AND
    (NEW.current_revision<>OLD.current_revision+1 OR NEW.status NOT IN ('DRAFT','IN_REVIEW')) THEN
  RAISE EXCEPTION 'Content edits invalidate approval and require a new revision' USING ERRCODE='23514';
 END IF;
 IF NEW.status IN ('APPROVED','PUBLISHED') THEN
  SELECT * INTO content_row FROM events_revision WHERE event_id=NEW.id AND revision=NEW.current_revision;
  IF NOT EXISTS(SELECT 1 FROM events_review WHERE event_id=NEW.id AND revision=NEW.current_revision AND decision='APPROVED')
     OR NOT EXISTS(SELECT 1 FROM events_organizer WHERE id=NEW.organizer_id AND verification='VERIFIED')
     OR content_row.ends_at<=clock_timestamp()
     OR (content_row.alcohol_policy='ALCOHOL_FREE' AND
       (content_row.alcohol_sold IS DISTINCT FROM false OR content_row.alcohol_served IS DISTINCT FROM false OR content_row.alcohol_permitted IS DISTINCT FROM false))
     OR (content_row.alcohol_policy='SOBER_FRIENDLY' AND content_row.alcohol_free_participation IS DISTINCT FROM true) THEN
   RAISE EXCEPTION 'Current approved content and verified organizer required' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NEW.status='PUBLISHED' AND (OLD.status<>'APPROVED' OR NEW.current_revision<>OLD.current_revision OR NEW.published_at IS NULL OR NEW.published_revision IS DISTINCT FROM NEW.current_revision) THEN
  RAISE EXCEPTION 'Publish only the approved revision' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_state_guard BEFORE INSERT OR UPDATE ON sober_event FOR EACH ROW EXECUTE FUNCTION events_guard_state();

CREATE FUNCTION events_erase_account() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE membership_row record;
BEGIN
 FOR membership_row IN SELECT organizer_id,actor_ref FROM events_membership WHERE firebase_uid=NEW.firebase_uid ORDER BY organizer_id LOOP
  PERFORM id FROM events_organizer WHERE id=membership_row.organizer_id FOR UPDATE;
  DELETE FROM events_membership WHERE organizer_id=membership_row.organizer_id AND firebase_uid=NEW.firebase_uid;
  UPDATE events_organizer SET contact_email=NULL,verification_reference=NULL,updated_at=clock_timestamp()
    WHERE id=membership_row.organizer_id AND contact_actor_ref=membership_row.actor_ref;
  IF NOT EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=membership_row.organizer_id) THEN
   UPDATE events_organizer SET verification='SUSPENDED',version=version+1,updated_at=clock_timestamp() WHERE id=membership_row.organizer_id;
  END IF;
 END LOOP;
 DELETE FROM events_moderator WHERE firebase_uid=NEW.firebase_uid;
 UPDATE events_contact_inquiry SET sender_uid=NULL,body=NULL,reply_email=NULL,status='CLOSED',closed_at=clock_timestamp() WHERE sender_uid=NEW.firebase_uid;
 RETURN NEW;
END $$;
CREATE TRIGGER events_account_erasure AFTER INSERT ON deleted_account FOR EACH ROW EXECUTE FUNCTION events_erase_account();

CREATE FUNCTION events_guard_organizer_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE organizer_row events_organizer%ROWTYPE;
BEGIN
 SELECT * INTO organizer_row FROM events_organizer WHERE id=NEW.organizer_id FOR UPDATE;
 IF NEW.target_version<>organizer_row.version
    OR NEW.moderator_ref=organizer_row.created_by_ref
    OR EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=NEW.organizer_id AND actor_ref=NEW.moderator_ref)
    OR NEW.reviewed_at>clock_timestamp()
    OR (NEW.decision IN ('VERIFIED','REJECTED') AND organizer_row.verification<>'IN_REVIEW')
    OR (NEW.decision='SUSPENDED' AND organizer_row.verification<>'VERIFIED') THEN
  RAISE EXCEPTION 'Independent current organizer review required' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_organizer_review_guard BEFORE INSERT ON events_organizer_review FOR EACH ROW EXECUTE FUNCTION events_guard_organizer_review();
CREATE FUNCTION events_guard_organizer_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.verification<>'UNVERIFIED' OR NEW.version<>1 THEN
   RAISE EXCEPTION 'Organizer must start unverified' USING ERRCODE='23514';
  END IF;
 ELSIF NEW.verification IS DISTINCT FROM OLD.verification THEN
  IF NEW.version<>OLD.version+1 THEN
   RAISE EXCEPTION 'Verification must advance the organizer version' USING ERRCODE='23514';
  END IF;
  IF NEW.verification IN ('VERIFIED','REJECTED') AND NOT EXISTS(
   SELECT 1 FROM events_organizer_review WHERE organizer_id=NEW.id AND target_version=OLD.version AND decision=NEW.verification) THEN
   RAISE EXCEPTION 'Independent organizer review required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_organizer_verification_guard BEFORE INSERT OR UPDATE ON events_organizer FOR EACH ROW EXECUTE FUNCTION events_guard_organizer_verification();
