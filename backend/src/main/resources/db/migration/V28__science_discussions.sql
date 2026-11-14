CREATE TABLE science_discussion (
 id uuid PRIMARY KEY,
 title varchar(200) NOT NULL CHECK(length(btrim(title))>0),
 article_revision_id uuid REFERENCES science_article(id),
 post_id uuid REFERENCES editorial_post(id),
 status varchar(16) NOT NULL CHECK(status IN ('OPEN','CLOSED','HIDDEN')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(num_nonnulls(article_revision_id,post_id)=1)
);
CREATE UNIQUE INDEX science_discussion_article ON science_discussion(article_revision_id) WHERE article_revision_id IS NOT NULL;
CREATE UNIQUE INDEX science_discussion_post ON science_discussion(post_id) WHERE post_id IS NOT NULL;
CREATE TABLE discussion_comment (
 id uuid PRIMARY KEY,
 discussion_id uuid NOT NULL REFERENCES science_discussion(id),
 author_ref char(64) CHECK(author_ref ~ '^[0-9a-f]{64}$'),
 profile_id uuid REFERENCES user_profile(id) ON DELETE SET NULL,
 parent_id uuid,
 content varchar(4000) NOT NULL,
 kind varchar(16) NOT NULL CHECK(kind IN ('OPINION','EXPERIENCE')),
 status varchar(16) NOT NULL DEFAULT 'VISIBLE' CHECK(status IN ('VISIBLE','HIDDEN','REMOVED','DELETED')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(id,discussion_id),
 FOREIGN KEY(parent_id,discussion_id) REFERENCES discussion_comment(id,discussion_id),
 CHECK(status<>'VISIBLE' OR length(btrim(content))>0)
);
CREATE INDEX discussion_comment_thread ON discussion_comment(discussion_id,parent_id,created_at,id);
CREATE INDEX discussion_comment_visible ON discussion_comment(discussion_id,created_at DESC) WHERE status='VISIBLE';
CREATE INDEX discussion_comment_author ON discussion_comment(author_ref,created_at DESC);
CREATE TABLE discussion_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 discussion_id uuid NOT NULL REFERENCES science_discussion(id),
 comment_id uuid REFERENCES discussion_comment(id),
 actor_ref char(64) NOT NULL,
 action varchar(20) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION discussion_parent_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.parent_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM discussion_comment WHERE id=NEW.parent_id AND discussion_id=NEW.discussion_id AND parent_id IS NULL) THEN
  RAISE EXCEPTION 'Replies limited to one level in same discussion' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER discussion_parent_check BEFORE INSERT OR UPDATE OF parent_id,discussion_id ON discussion_comment FOR EACH ROW EXECUTE FUNCTION discussion_parent_guard();
CREATE FUNCTION discussion_erase_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.firebase_uid,0));
 UPDATE discussion_comment SET content='',author_ref=NULL,profile_id=NULL,status='DELETED',updated_at=clock_timestamp()
 WHERE author_ref=encode(sha256(convert_to(NEW.firebase_uid,'UTF8')),'hex');
 RETURN NEW;
END $$;
CREATE TRIGGER discussion_account_erasure BEFORE INSERT ON deleted_account FOR EACH ROW EXECUTE FUNCTION discussion_erase_account();
