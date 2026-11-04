CREATE TABLE discovery_issue (
 id uuid PRIMARY KEY,
 slug varchar(120) NOT NULL CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 locale varchar(2) NOT NULL CHECK(locale IN ('en','pl')),
 title varchar(500) NOT NULL CHECK(length(btrim(title))>0),
 teaser text NOT NULL CHECK(length(btrim(teaser))>0),
 opening_question text NOT NULL CHECK(length(btrim(opening_question))>0),
 takeaway text NOT NULL CHECK(length(btrim(takeaway))>0),
 established text NOT NULL CHECK(length(btrim(established))>0),
 not_established text NOT NULL CHECK(length(btrim(not_established))>0),
 population text NOT NULL CHECK(length(btrim(population))>0),
 method text NOT NULL CHECK(length(btrim(method))>0),
 research_kind varchar(16) NOT NULL CHECK(research_kind IN ('NEW','REVISITED')),
 revision_id uuid NOT NULL REFERENCES claim_revision(id),
 author_uid varchar(128) NOT NULL,
 publish_at timestamptz NOT NULL,
 publication_zone varchar(100) NOT NULL,
 publication_week date NOT NULL,
 next_review_at timestamptz NOT NULL CHECK(next_review_at>publish_at),
 status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','SCHEDULED','PUBLISHED','ARCHIVED')),
 reviewer_uid varchar(128),
 reviewed_at timestamptz,
 review_notes text,
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(locale,slug),
 CHECK(reviewer_uid IS NULL OR reviewer_uid<>author_uid),
 CHECK(status NOT IN ('SCHEDULED','PUBLISHED') OR (reviewer_uid IS NOT NULL AND reviewed_at IS NOT NULL AND length(btrim(review_notes))>0)),
 CHECK(status<>'PUBLISHED' OR published_at IS NOT NULL)
);
-- Cadence is one issue per locale per ISO week, consistently evaluated in UTC.
CREATE UNIQUE INDEX discovery_week_slot ON discovery_issue(locale,publication_week) WHERE status IN ('SCHEDULED','PUBLISHED');
CREATE INDEX discovery_due ON discovery_issue(publish_at) WHERE status='SCHEDULED';
CREATE TABLE discovery_audit (
 id uuid PRIMARY KEY,
 issue_id uuid NOT NULL REFERENCES discovery_issue(id),
 actor_uid varchar(128) NOT NULL,
 action varchar(32) NOT NULL,
 notes text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER discovery_audit_immutable BEFORE UPDATE OR DELETE ON discovery_audit
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();

CREATE FUNCTION discovery_guard_issue() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  RAISE EXCEPTION 'Archive an issue instead of deleting it' USING ERRCODE='23514';
 END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'DRAFT' OR NEW.reviewer_uid IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.published_at IS NOT NULL THEN
   RAISE EXCEPTION 'Issues must start as unreviewed drafts' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.publication_zone) THEN
   RAISE EXCEPTION 'Unknown publication timezone' USING ERRCODE='23514';
  END IF;
  NEW.publication_week := date_trunc('week',NEW.publish_at AT TIME ZONE 'UTC')::date;
  RETURN NEW;
 END IF;
 IF (to_jsonb(NEW)-ARRAY['status','reviewer_uid','reviewed_at','review_notes','published_at']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['status','reviewer_uid','reviewed_at','review_notes','published_at']) THEN
  RAISE EXCEPTION 'Create a new issue for editorial corrections' USING ERRCODE='23514';
 END IF;
 IF NOT ((OLD.status='DRAFT' AND NEW.status IN ('IN_REVIEW','ARCHIVED')) OR
         (OLD.status='IN_REVIEW' AND NEW.status IN ('SCHEDULED','ARCHIVED')) OR
         (OLD.status='SCHEDULED' AND NEW.status IN ('PUBLISHED','ARCHIVED')) OR
         (OLD.status='PUBLISHED' AND NEW.status='ARCHIVED')) THEN
  RAISE EXCEPTION 'Invalid issue transition' USING ERRCODE='23514';
 END IF;
 IF NEW.status='SCHEDULED' THEN
  IF NEW.publish_at<=clock_timestamp() OR NEW.reviewed_at IS NULL OR NEW.reviewed_at>clock_timestamp() OR NEW.reviewed_at<NEW.created_at THEN
   RAISE EXCEPTION 'Review must precede a future publication' USING ERRCODE='23514';
  END IF;
 ELSIF (NEW.reviewer_uid,NEW.reviewed_at,NEW.review_notes) IS DISTINCT FROM (OLD.reviewer_uid,OLD.reviewed_at,OLD.review_notes) THEN
  RAISE EXCEPTION 'Review is immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.status IN ('SCHEDULED','PUBLISHED') THEN
  PERFORM id FROM claim_revision WHERE id=NEW.revision_id FOR SHARE;
 END IF;
 IF NEW.status IN ('SCHEDULED','PUBLISHED') AND NOT EXISTS (
  SELECT 1 FROM claim_revision r JOIN scientific_review sr ON sr.revision_id=r.id
   JOIN evidence_claim c ON c.id=r.claim_id
   WHERE r.id=NEW.revision_id AND r.status='PUBLISHED' AND sr.decision='APPROVED'
     AND c.locale=NEW.locale AND r.next_review_at>clock_timestamp()
     AND EXISTS(SELECT 1 FROM claim_source cs WHERE cs.revision_id=r.id)
 ) THEN
  RAISE EXCEPTION 'Current published reviewed evidence with sources is required' USING ERRCODE='23514';
 END IF;
 IF NEW.status='PUBLISHED' AND (NEW.publish_at>clock_timestamp() OR NEW.next_review_at<=clock_timestamp() OR NEW.published_at IS NULL OR NEW.published_at<NEW.publish_at OR NEW.published_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'Issue is not due or its review has expired' USING ERRCODE='23514';
 END IF;
 IF NEW.status<>'PUBLISHED' AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
  RAISE EXCEPTION 'Publication timestamp is server controlled' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER discovery_issue_guard BEFORE INSERT OR UPDATE OR DELETE ON discovery_issue
 FOR EACH ROW EXECUTE FUNCTION discovery_guard_issue();
