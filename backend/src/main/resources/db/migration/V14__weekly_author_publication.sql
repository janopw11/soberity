-- Explicit author publication for short weekly news, matching articles.
ALTER TABLE discovery_issue ADD COLUMN publication_route varchar(16) NOT NULL DEFAULT 'REVIEWED'
 CHECK(publication_route IN ('AUTHOR','REVIEWED'));
DO $$
DECLARE entry record;
BEGIN
 FOR entry IN SELECT conname FROM pg_constraint WHERE conrelid='discovery_issue'::regclass
  AND contype='c' AND pg_get_constraintdef(oid) LIKE '%status%'
  AND pg_get_constraintdef(oid) LIKE '%reviewer_uid%'
 LOOP EXECUTE format('ALTER TABLE discovery_issue DROP CONSTRAINT %I',entry.conname); END LOOP;
END $$;
ALTER TABLE discovery_issue ADD CONSTRAINT discovery_publication_provenance CHECK(
 status NOT IN ('SCHEDULED','PUBLISHED') OR
 (publication_route='AUTHOR' AND content_mode='NEWS' AND reviewer_uid IS NULL AND reviewed_at IS NULL AND review_notes IS NULL) OR
 (publication_route='REVIEWED' AND reviewer_uid IS NOT NULL AND reviewed_at IS NOT NULL AND length(btrim(review_notes))>0)
);
CREATE OR REPLACE FUNCTION discovery_guard_issue() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  RAISE EXCEPTION 'Archive an issue instead of deleting it' USING ERRCODE='23514';
 END IF;
 IF TG_OP='INSERT' OR (OLD.status='DRAFT' AND NEW.status='DRAFT') THEN
  IF NEW.status<>'DRAFT' OR NEW.reviewer_uid IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.published_at IS NOT NULL THEN
   RAISE EXCEPTION 'Issues must start as unreviewed drafts' USING ERRCODE='23514';
  END IF;
  IF NEW.publication_route<>'REVIEWED' THEN
   RAISE EXCEPTION 'Draft has no author publication yet' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' AND (NEW.id,NEW.author_uid,NEW.slug,NEW.created_at,NEW.content_mode) IS DISTINCT FROM (OLD.id,OLD.author_uid,OLD.slug,OLD.created_at,OLD.content_mode) THEN
   RAISE EXCEPTION 'Draft identity is immutable' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.publication_zone) THEN
   RAISE EXCEPTION 'Unknown publication timezone' USING ERRCODE='23514';
  END IF;
  NEW.publication_week := date_trunc('week',NEW.publish_at AT TIME ZONE 'UTC')::date;
  RETURN NEW;
 END IF;
 IF NEW.content_mode='NEWS' AND NEW.publication_route='AUTHOR' AND OLD.status IN ('DRAFT','IN_REVIEW') AND NEW.status='PUBLISHED' THEN
  IF (to_jsonb(NEW)-ARRAY['status','publication_route','publish_at','publication_week','next_review_at','published_at']) IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['status','publication_route','publish_at','publication_week','next_review_at','published_at'])
     OR NEW.publish_at IS DISTINCT FROM NEW.published_at OR NEW.publish_at<OLD.created_at THEN
   RAISE EXCEPTION 'Only publication timing may change for immediate publication' USING ERRCODE='23514';
  END IF;
  NEW.publication_week := date_trunc('week',NEW.publish_at AT TIME ZONE 'UTC')::date;
 ELSIF (to_jsonb(NEW)-ARRAY['status','publication_route','reviewer_uid','reviewed_at','review_notes','published_at']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['status','publication_route','reviewer_uid','reviewed_at','review_notes','published_at']) THEN
  RAISE EXCEPTION 'Reviewed content is immutable; create a new issue' USING ERRCODE='23514';
 END IF;
 IF NOT ((OLD.status='DRAFT' AND NEW.status IN ('IN_REVIEW','ARCHIVED')) OR
         (OLD.status='IN_REVIEW' AND NEW.status IN ('SCHEDULED','ARCHIVED')) OR
         (OLD.status='SCHEDULED' AND NEW.status IN ('PUBLISHED','ARCHIVED')) OR
         (OLD.status='PUBLISHED' AND NEW.status='ARCHIVED') OR
         (NEW.content_mode='NEWS' AND NEW.publication_route='AUTHOR' AND OLD.status IN ('DRAFT','IN_REVIEW') AND NEW.status IN ('SCHEDULED','PUBLISHED'))) THEN
  RAISE EXCEPTION 'Invalid issue transition' USING ERRCODE='23514';
 END IF;
 IF NEW.publication_route IS DISTINCT FROM OLD.publication_route AND NOT
    (NEW.content_mode='NEWS' AND OLD.status IN ('DRAFT','IN_REVIEW') AND NEW.status IN ('SCHEDULED','PUBLISHED')) THEN
  RAISE EXCEPTION 'Publication provenance is immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.publication_route='AUTHOR' AND (NEW.content_mode<>'NEWS' OR NEW.reviewer_uid IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.review_notes IS NOT NULL) THEN
  RAISE EXCEPTION 'Author publication cannot claim independent review' USING ERRCODE='23514';
 END IF;
 IF NEW.status='SCHEDULED' THEN
  IF NEW.publish_at<=clock_timestamp() OR (NEW.publication_route='REVIEWED' AND (NEW.reviewed_at IS NULL OR NEW.reviewed_at>clock_timestamp() OR NEW.reviewed_at<NEW.created_at)) THEN
   RAISE EXCEPTION 'Review must precede a future publication' USING ERRCODE='23514';
  END IF;
 ELSIF (NEW.reviewer_uid,NEW.reviewed_at,NEW.review_notes) IS DISTINCT FROM (OLD.reviewer_uid,OLD.reviewed_at,OLD.review_notes) THEN
  RAISE EXCEPTION 'Review is immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.content_mode='NEWS' AND NEW.status IN ('IN_REVIEW','SCHEDULED','PUBLISHED') THEN
  IF jsonb_array_length(NEW.sources)<1 OR jsonb_array_length(NEW.sources)>50
     OR NOT jsonb_path_exists(NEW.document,'$.** ? (@.type == "text" && @.text != "")')
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.sources) s
       WHERE coalesce(length(btrim(s->>'title')),0)=0 OR coalesce(s->>'url','') !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$') THEN
   RAISE EXCEPTION 'News needs content and HTTPS research sources before review' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NEW.content_mode='EVIDENCE' AND NEW.status IN ('SCHEDULED','PUBLISHED') THEN
  PERFORM id FROM claim_revision WHERE id=NEW.revision_id FOR SHARE;
  IF NOT EXISTS (
   SELECT 1 FROM claim_revision r JOIN scientific_review sr ON sr.revision_id=r.id
    JOIN evidence_claim c ON c.id=r.claim_id
    WHERE r.id=NEW.revision_id AND r.status='PUBLISHED' AND sr.decision='APPROVED'
      AND c.locale=NEW.locale AND r.next_review_at>clock_timestamp()
      AND EXISTS(SELECT 1 FROM claim_source cs WHERE cs.revision_id=r.id)
  ) THEN
   RAISE EXCEPTION 'Current published reviewed evidence with sources is required' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NEW.status='PUBLISHED' AND (NEW.publish_at>clock_timestamp() OR NEW.next_review_at<=clock_timestamp() OR NEW.published_at IS NULL OR NEW.published_at<NEW.publish_at OR NEW.published_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'Issue is not due or its review has expired' USING ERRCODE='23514';
 END IF;
 IF NEW.status<>'PUBLISHED' AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
  RAISE EXCEPTION 'Publication timestamp is server controlled' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
