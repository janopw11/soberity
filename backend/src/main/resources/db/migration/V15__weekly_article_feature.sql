-- Weekly Science Drop becomes a curated reference to an existing article.
-- Prior discovery issues and their audit records remain untouched.
CREATE TABLE weekly_article_feature (
 id uuid PRIMARY KEY,
 post_id uuid NOT NULL REFERENCES editorial_post(id),
 locale varchar(2) NOT NULL CHECK(locale IN ('en','pl')),
 starts_at timestamptz NOT NULL,
 week_start date NOT NULL,
 selected_by varchar(128) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 cancelled_at timestamptz,
 CHECK(cancelled_at IS NULL OR cancelled_at>=created_at)
);
CREATE UNIQUE INDEX weekly_article_slot ON weekly_article_feature(locale,week_start) WHERE cancelled_at IS NULL;
CREATE INDEX weekly_article_current ON weekly_article_feature(locale,starts_at DESC) WHERE cancelled_at IS NULL;
CREATE TABLE weekly_article_audit (
 id uuid PRIMARY KEY,
 feature_id uuid NOT NULL REFERENCES weekly_article_feature(id),
 actor_uid varchar(128) NOT NULL,
 action varchar(16) NOT NULL CHECK(action IN ('SELECTED','CANCELLED','REPLACED')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER weekly_article_audit_immutable BEFORE UPDATE OR DELETE ON weekly_article_audit
 FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE FUNCTION weekly_article_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  RAISE EXCEPTION 'Cancel a selection instead of deleting its history' USING ERRCODE='23514';
 END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.cancelled_at IS NOT NULL THEN
   RAISE EXCEPTION 'New selection must be active' USING ERRCODE='23514';
  END IF;
  NEW.week_start:=date_trunc('week',NEW.starts_at AT TIME ZONE 'UTC')::date;
  PERFORM id FROM editorial_post_version WHERE post_id=NEW.post_id AND status='PUBLISHED' AND kind='ARTICLE' FOR SHARE;
  IF NOT FOUND THEN
   RAISE EXCEPTION 'Choose an existing published article' USING ERRCODE='23514';
  END IF;
 ELSIF OLD.cancelled_at IS NOT NULL OR NEW.cancelled_at IS NULL OR NEW.cancelled_at>clock_timestamp()
    OR (to_jsonb(NEW)-'cancelled_at') IS DISTINCT FROM (to_jsonb(OLD)-'cancelled_at') THEN
  RAISE EXCEPTION 'Selections are immutable except for cancellation' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER weekly_article_feature_guard BEFORE INSERT OR UPDATE OR DELETE ON weekly_article_feature
 FOR EACH ROW EXECUTE FUNCTION weekly_article_guard();
