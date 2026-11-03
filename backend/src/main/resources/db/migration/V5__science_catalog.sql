-- No research/health content seeds: category labels only.
CREATE TABLE science_category (
    code varchar(40) PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9-]*$'),
    label_en varchar(100) NOT NULL,
    label_pl varchar(100) NOT NULL
);
INSERT INTO science_category VALUES
 ('sleep','Alcohol and sleep','Alkohol i sen'), ('brain','Brain','Mózg'),
 ('cancer','Cancer','Nowotwory'), ('sport','Sport','Sport'),
 ('relationships','Relationships','Relacje'), ('public-health','Public health','Zdrowie publiczne');

CREATE TABLE science_claim_category (
    claim_id uuid REFERENCES evidence_claim(id),
    category_code varchar(40) REFERENCES science_category(code),
    PRIMARY KEY (claim_id, category_code)
);

-- One immutable article version presents one exact reviewed evidence revision.
-- A changed body needs a new version and independent article review.
CREATE TABLE science_article (
    id uuid PRIMARY KEY,
    article_id uuid NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    revision_id uuid NOT NULL REFERENCES claim_revision(id),
    category_code varchar(40) NOT NULL REFERENCES science_category(code),
    title varchar(500) NOT NULL CHECK (length(btrim(title)) > 0),
    summary text NOT NULL CHECK (length(btrim(summary)) > 0),
    body text NOT NULL CHECK (length(btrim(body)) > 0),
    author_uid varchar(128) NOT NULL CHECK (length(btrim(author_uid)) > 0),
    reviewer_uid varchar(128),
    review_notes text,
    reviewed_at timestamptz,
    next_review_at timestamptz NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    published_at timestamptz,
    CHECK (next_review_at > created_at),
    UNIQUE (article_id, version)
);
CREATE UNIQUE INDEX science_article_one_published ON science_article(article_id) WHERE status='PUBLISHED';
CREATE INDEX science_article_catalog ON science_article(category_code, published_at DESC, article_id) WHERE status='PUBLISHED';
CREATE INDEX science_article_revision ON science_article(revision_id);
CREATE INDEX claim_revision_public_feed ON claim_revision(published_at DESC, claim_id) WHERE status='PUBLISHED';

CREATE FUNCTION science_guard_article() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'DRAFT' OR NEW.published_at IS NOT NULL OR NEW.reviewer_uid IS NOT NULL
           OR NEW.reviewed_at IS NOT NULL OR NEW.review_notes IS NOT NULL THEN
            RAISE EXCEPTION 'Articles start as unreviewed drafts' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
    END IF;
    IF (to_jsonb(NEW) - ARRAY['status','published_at','reviewer_uid','reviewed_at','review_notes']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status','published_at','reviewer_uid','reviewed_at','review_notes']) THEN
        RAISE EXCEPTION 'Article content is immutable; create a new version' USING ERRCODE='23514';
    END IF;
    IF NOT ((OLD.status='DRAFT' AND NEW.status IN ('IN_REVIEW','ARCHIVED')) OR
            (OLD.status='IN_REVIEW' AND NEW.status IN ('APPROVED','ARCHIVED')) OR
            (OLD.status='APPROVED' AND NEW.status IN ('PUBLISHED','ARCHIVED')) OR
            (OLD.status='PUBLISHED' AND NEW.status='ARCHIVED')) THEN
        RAISE EXCEPTION 'Invalid article transition' USING ERRCODE='23514';
    END IF;
    IF NOT (OLD.status='IN_REVIEW' AND NEW.status='APPROVED') AND
       ROW(NEW.reviewer_uid,NEW.reviewed_at,NEW.review_notes) IS DISTINCT FROM
       ROW(OLD.reviewer_uid,OLD.reviewed_at,OLD.review_notes) THEN
        RAISE EXCEPTION 'Review is sealed at approval' USING ERRCODE='23514';
    END IF;
    IF NEW.status IN ('APPROVED','PUBLISHED') THEN
        IF NEW.reviewer_uid IS NULL OR length(btrim(NEW.reviewer_uid))=0 OR NEW.reviewer_uid=NEW.author_uid
           OR NEW.reviewed_at IS NULL OR NEW.reviewed_at < NEW.created_at OR NEW.reviewed_at > clock_timestamp()
           OR coalesce(length(btrim(NEW.review_notes)),0)=0 THEN
            RAISE EXCEPTION 'Independent article review required' USING ERRCODE='23514';
        END IF;
        PERFORM 1 FROM claim_revision WHERE id=NEW.revision_id AND status='PUBLISHED' FOR SHARE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Article requires exact published evidence revision' USING ERRCODE='23514';
        END IF;
    END IF;
    IF NEW.status='PUBLISHED' THEN
        IF NEW.published_at IS NULL OR NEW.published_at < NEW.reviewed_at OR NEW.published_at > clock_timestamp()
           OR NEW.next_review_at <= clock_timestamp() THEN
            RAISE EXCEPTION 'Invalid article publication dates' USING ERRCODE='23514';
        END IF;
    ELSIF NEW.published_at IS DISTINCT FROM OLD.published_at THEN
        RAISE EXCEPTION 'Publication timestamp must be preserved' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER science_article_guard BEFORE INSERT OR UPDATE ON science_article
    FOR EACH ROW EXECUTE FUNCTION science_guard_article();
CREATE TRIGGER science_article_no_delete BEFORE DELETE ON science_article
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
