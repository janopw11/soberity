-- Reviewed, immutable quiz content pinned to exact published evidence revisions.
CREATE TABLE learning_quiz (
 id uuid PRIMARY KEY,
 locale varchar(2) NOT NULL CHECK(locale IN ('en','pl')),
 title varchar(300) NOT NULL CHECK(length(btrim(title))>0),
 definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object'),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 author_uid varchar(128) NOT NULL,
 status varchar(16) NOT NULL CHECK(status IN ('IN_REVIEW','PUBLISHED','ARCHIVED')),
 reviewer_uid varchar(128), review_notes varchar(4000),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 published_at timestamptz,
 CHECK(status<>'PUBLISHED' OR (reviewer_uid IS NOT NULL AND reviewer_uid<>author_uid AND published_at IS NOT NULL))
);
CREATE TABLE learning_quiz_evidence (
 quiz_id uuid NOT NULL REFERENCES learning_quiz(id),
 revision_id uuid NOT NULL REFERENCES claim_revision(id),
 PRIMARY KEY(quiz_id,revision_id)
);
CREATE TABLE learning_quiz_audit (
 id uuid PRIMARY KEY, quiz_id uuid NOT NULL REFERENCES learning_quiz(id),
 actor_uid varchar(128) NOT NULL, action varchar(16) NOT NULL,
 notes varchar(4000) NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE learning_progress (
 firebase_uid varchar(128) NOT NULL,
 quiz_id uuid NOT NULL REFERENCES learning_quiz(id),
 answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(answers)='object'),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(firebase_uid,quiz_id)
);
CREATE TABLE learning_flashcard_progress (
 firebase_uid varchar(128) NOT NULL,
 revision_id uuid NOT NULL REFERENCES claim_revision(id),
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(firebase_uid,revision_id)
);
CREATE INDEX learning_quiz_catalog ON learning_quiz(locale,created_at DESC) WHERE status='PUBLISHED';
CREATE FUNCTION learning_quiz_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW.locale,NEW.title,NEW.definition,NEW.version,NEW.author_uid,NEW.created_at)
    IS DISTINCT FROM (OLD.id,OLD.locale,OLD.title,OLD.definition,OLD.version,OLD.author_uid,OLD.created_at) THEN
  RAISE EXCEPTION 'Quiz content is immutable; submit a new quiz for review';
 END IF;
 IF OLD.status='ARCHIVED' AND NEW.status<>OLD.status THEN
  RAISE EXCEPTION 'Archived quiz cannot be republished';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER learning_quiz_immutable BEFORE UPDATE ON learning_quiz FOR EACH ROW EXECUTE FUNCTION learning_quiz_immutable();
-- Erase private learning records during the existing account deletion transaction.
CREATE FUNCTION erase_learning_progress() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.firebase_uid,0));
 DELETE FROM learning_progress WHERE firebase_uid=NEW.firebase_uid;
 DELETE FROM learning_flashcard_progress WHERE firebase_uid=NEW.firebase_uid;
 RETURN NEW;
END $$;
CREATE TRIGGER erase_learning_progress BEFORE INSERT ON deleted_account FOR EACH ROW EXECUTE FUNCTION erase_learning_progress();

CREATE TRIGGER learning_quiz_audit_immutable BEFORE UPDATE OR DELETE ON learning_quiz_audit
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
