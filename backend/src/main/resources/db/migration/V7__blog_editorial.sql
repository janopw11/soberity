-- Owner decision 2026-11-03: blog-style author publishing, optional independent review.
-- Existing scientific evidence/reviews and legacy articles remain unchanged.
ALTER TABLE editorial_audit DROP CONSTRAINT editorial_audit_material_type_check;
ALTER TABLE editorial_audit ADD CHECK(material_type IN ('CLAIM','ARTICLE','SOURCE','POST','CATEGORY','MEDIA'));
CREATE TABLE editorial_media (
 id uuid PRIMARY KEY, owner_uid varchar(128) NOT NULL,
 purpose varchar(16) NOT NULL CHECK(purpose IN ('COVER','INLINE')),
 alt_text varchar(500) NOT NULL CHECK(length(btrim(alt_text))>0),
 width integer NOT NULL CHECK(width>0), height integer NOT NULL CHECK(height>0),
 data bytea NOT NULL CHECK(octet_length(data)<=5242880),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE editorial_post (
 id uuid PRIMARY KEY, author_uid varchar(128) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE editorial_post_version (
 id uuid PRIMARY KEY, post_id uuid NOT NULL REFERENCES editorial_post(id),
 version integer NOT NULL CHECK(version>0),
 kind varchar(16) NOT NULL CHECK(kind IN ('ARTICLE','EDITORIAL')),
 title varchar(500) NOT NULL CHECK(length(btrim(title))>0),
 document jsonb NOT NULL CHECK(document->>'type'='doc'),
 evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='array'),
 category_code varchar(40) NOT NULL REFERENCES science_category(code),
 cover_id uuid REFERENCES editorial_media(id),
 status varchar(16) NOT NULL CHECK(status IN ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED')),
 reviewed_by varchar(128), review_notes text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), published_at timestamptz,
 UNIQUE(post_id,version),
 CHECK(status<>'PUBLISHED' OR (published_at IS NOT NULL AND jsonb_array_length(evidence)>0))
);
CREATE UNIQUE INDEX editorial_post_one_published ON editorial_post_version(post_id) WHERE status='PUBLISHED';
CREATE INDEX editorial_post_latest ON editorial_post_version(post_id,version DESC);
CREATE TABLE editorial_post_media (
 version_id uuid NOT NULL REFERENCES editorial_post_version(id),
 media_id uuid NOT NULL REFERENCES editorial_media(id), PRIMARY KEY(version_id,media_id)
);
CREATE FUNCTION blog_guard_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Publication history is immutable' USING ERRCODE='23514'; END IF;
 IF (to_jsonb(NEW)-ARRAY['status','published_at','reviewed_by','review_notes']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['status','published_at','reviewed_by','review_notes']) THEN
  RAISE EXCEPTION 'Content edits require a new version' USING ERRCODE='23514';
 END IF;
 IF NOT ((OLD.status='DRAFT' AND NEW.status IN ('PUBLISHED','IN_REVIEW','ARCHIVED')) OR
         (OLD.status='IN_REVIEW' AND NEW.status IN ('PUBLISHED','ARCHIVED')) OR
         (OLD.status='PUBLISHED' AND NEW.status='ARCHIVED')) THEN
  RAISE EXCEPTION 'Invalid blog publication transition' USING ERRCODE='23514';
 END IF;
 IF OLD.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
  RAISE EXCEPTION 'Preserve publication date' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER editorial_post_version_guard BEFORE UPDATE OR DELETE ON editorial_post_version
 FOR EACH ROW EXECUTE FUNCTION blog_guard_version();
CREATE TRIGGER editorial_media_immutable BEFORE UPDATE OR DELETE ON editorial_media
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
