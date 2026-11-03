-- Owner decision: quiz authors may publish directly or request independent review.
ALTER TABLE learning_quiz ADD COLUMN publication_route varchar(16) NOT NULL DEFAULT 'REVIEWED'
 CHECK(publication_route IN ('AUTHOR','REVIEWED'));
ALTER TABLE learning_quiz DROP CONSTRAINT learning_quiz_check;
ALTER TABLE learning_quiz ADD CONSTRAINT learning_quiz_publication_check CHECK (
 status<>'PUBLISHED' OR (
  published_at IS NOT NULL AND (
   (publication_route='AUTHOR' AND reviewer_uid IS NULL) OR
   (publication_route='REVIEWED' AND reviewer_uid IS NOT NULL AND reviewer_uid<>author_uid)
  )
 )
);
CREATE OR REPLACE FUNCTION learning_quiz_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW.locale,NEW.title,NEW.definition,NEW.version,NEW.author_uid,NEW.created_at)
    IS DISTINCT FROM (OLD.id,OLD.locale,OLD.title,OLD.definition,OLD.version,OLD.author_uid,OLD.created_at) THEN
  RAISE EXCEPTION 'Quiz content is immutable; submit a new quiz';
 END IF;
 IF OLD.status='ARCHIVED' AND NEW.status<>OLD.status THEN
  RAISE EXCEPTION 'Archived quiz cannot be republished';
 END IF;
 IF OLD.status='PUBLISHED' AND (NEW.publication_route,NEW.reviewer_uid,NEW.published_at)
    IS DISTINCT FROM (OLD.publication_route,OLD.reviewer_uid,OLD.published_at) THEN
  RAISE EXCEPTION 'Publication provenance is immutable';
 END IF;
 RETURN NEW;
END $$;
