-- Evidence is versioned independently of profile/account data. Editorial UIDs
-- are audit references, not foreign keys to deletable application profiles.
CREATE TABLE scientific_source (
    id uuid PRIMARY KEY,
    supersedes_source_id uuid REFERENCES scientific_source(id) CHECK (supersedes_source_id <> id),
    title varchar(1000) NOT NULL CHECK (length(btrim(title)) > 0),
    authors text NOT NULL CHECK (length(btrim(authors)) > 0),
    organization varchar(300),
    journal varchar(300),
    publication_year integer NOT NULL CHECK (publication_year BETWEEN 1800 AND 2100),
    publication_date date,
    url varchar(2048) NOT NULL CHECK (url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    doi varchar(512) CHECK (doi IS NULL OR doi ~ '^10\.[0-9]{4,9}/[^[:space:]]+$'),
    pmid varchar(16) CHECK (pmid IS NULL OR pmid ~ '^[1-9][0-9]*$'),
    study_type varchar(32) NOT NULL CHECK (study_type IN
        ('SYSTEMATIC_REVIEW','META_ANALYSIS','RANDOMIZED_TRIAL','OBSERVATIONAL',
         'GUIDELINE','REPORT','PREPRINT','COMMENTARY','EDITORIAL','OTHER')),
    provider varchar(32) NOT NULL CHECK (provider IN
        ('PUBMED','PMC','WHO','IARC','THE_LANCET','PUBLISHER','OTHER')),
    license varchar(200) NOT NULL CHECK (length(btrim(license)) > 0),
    license_url varchar(2048) CHECK (license_url IS NULL OR license_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    access_type varchar(32) NOT NULL CHECK (access_type IN
        ('OPEN_ACCESS','ABSTRACT_ONLY','SUBSCRIPTION','UNKNOWN')),
    retrieved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_source_date_year CHECK
        (publication_date IS NULL OR extract(year FROM publication_date) = publication_year),
    CONSTRAINT ck_source_doi_canonical CHECK (doi IS NULL OR doi = lower(btrim(doi)))
);

-- DOI/PMID identify a publication; multiple immutable metadata snapshots may
-- share them when correcting a source. supersedes_source_id preserves lineage.
CREATE INDEX ix_scientific_source_doi ON scientific_source(doi) WHERE doi IS NOT NULL;
CREATE INDEX ix_scientific_source_pmid ON scientific_source(pmid) WHERE pmid IS NOT NULL;

CREATE TABLE evidence_claim (
    id uuid PRIMARY KEY,
    locale varchar(8) NOT NULL CHECK (locale IN ('en','pl')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE claim_revision (
    id uuid PRIMARY KEY,
    claim_id uuid NOT NULL REFERENCES evidence_claim(id),
    version integer NOT NULL CHECK (version > 0),
    author_uid varchar(128) NOT NULL CHECK (length(btrim(author_uid)) > 0 AND author_uid = btrim(author_uid)),
    claim_text text NOT NULL CHECK (length(btrim(claim_text)) > 0),
    summary text NOT NULL CHECK (length(btrim(summary)) > 0),
    evidence_level varchar(16) NOT NULL CHECK (evidence_level IN
        ('HIGH','MODERATE','LOW','VERY_LOW','INSUFFICIENT')),
    evidence_rationale text NOT NULL CHECK (length(btrim(evidence_rationale)) > 0),
    limitations text NOT NULL CHECK (length(btrim(limitations)) > 0),
    uncertainty text NOT NULL CHECK (length(btrim(uncertainty)) > 0),
    population text NOT NULL CHECK (length(btrim(population)) > 0),
    exposure text NOT NULL CHECK (length(btrim(exposure)) > 0),
    outcome text NOT NULL CHECK (length(btrim(outcome)) > 0),
    inference_type varchar(16) NOT NULL CHECK (inference_type IN
        ('ASSOCIATION','CAUSAL','DESCRIPTIVE','INSUFFICIENT')),
    causal_justification text,
    change_summary text NOT NULL CHECK (length(btrim(change_summary)) > 0),
    status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN
        ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
    next_review_at timestamptz NOT NULL,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (claim_id, version),
    CONSTRAINT ck_revision_review_date CHECK (next_review_at > created_at),
    CONSTRAINT ck_revision_published_date CHECK
        (status <> 'PUBLISHED' OR published_at IS NOT NULL)
);

CREATE UNIQUE INDEX ux_claim_one_published_revision ON claim_revision(claim_id)
    WHERE status = 'PUBLISHED';
CREATE INDEX ix_revision_status_review ON claim_revision(status, next_review_at);

CREATE TABLE claim_source (
    id uuid PRIMARY KEY,
    revision_id uuid NOT NULL REFERENCES claim_revision(id),
    source_id uuid NOT NULL REFERENCES scientific_source(id),
    relation varchar(16) NOT NULL CHECK (relation IN ('SUPPORTS','CHALLENGES','CONTEXT')),
    notes text NOT NULL CHECK (length(btrim(notes)) > 0),
    assessed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (revision_id, source_id)
);
CREATE INDEX ix_claim_source_source ON claim_source(source_id);

-- A review seals one complete revision. Changes after review get a new version
-- with a new source assessment and independent review, including translations.
CREATE TABLE scientific_review (
    id uuid PRIMARY KEY,
    revision_id uuid NOT NULL UNIQUE REFERENCES claim_revision(id),
    reviewer_uid varchar(128) NOT NULL CHECK (length(btrim(reviewer_uid)) > 0 AND reviewer_uid = btrim(reviewer_uid)),
    decision varchar(32) NOT NULL CHECK (decision IN ('APPROVED','CHANGES_REQUESTED','REJECTED')),
    notes text NOT NULL CHECK (length(btrim(notes)) > 0),
    causality_approved boolean NOT NULL DEFAULT false,
    causal_assessment text,
    reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE FUNCTION evidence_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Evidence audit records are immutable; create a new source or revision'
        USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER scientific_source_immutable BEFORE UPDATE ON scientific_source
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TRIGGER evidence_claim_immutable BEFORE UPDATE ON evidence_claim
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TRIGGER scientific_review_immutable BEFORE UPDATE OR DELETE ON scientific_review
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
CREATE TRIGGER claim_revision_no_delete BEFORE DELETE ON claim_revision
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();

CREATE FUNCTION evidence_guard_source_link() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE revision_status varchar;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Replace source links in a draft rather than modifying audit references'
            USING ERRCODE = '23514';
    END IF;
    -- Serialize citation mutation with publication of the same revision.
    SELECT status INTO revision_status FROM claim_revision
        WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.revision_id ELSE NEW.revision_id END
        FOR UPDATE;
    IF revision_status IS DISTINCT FROM 'DRAFT' THEN
        RAISE EXCEPTION 'Sources can only be changed in a draft revision'
            USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER claim_source_guard BEFORE INSERT OR UPDATE OR DELETE ON claim_source
    FOR EACH ROW EXECUTE FUNCTION evidence_guard_source_link();

CREATE FUNCTION evidence_guard_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE revision claim_revision%ROWTYPE;
BEGIN
    SELECT * INTO revision FROM claim_revision WHERE id = NEW.revision_id FOR UPDATE;
    IF revision.status IS DISTINCT FROM 'IN_REVIEW' OR NEW.reviewer_uid = revision.author_uid
        OR NEW.reviewed_at < revision.created_at OR NEW.reviewed_at > clock_timestamp() THEN
        RAISE EXCEPTION 'Review requires a submitted revision, independent reviewer and valid date'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER scientific_review_guard BEFORE INSERT ON scientific_review
    FOR EACH ROW EXECUTE FUNCTION evidence_guard_review();

CREATE FUNCTION evidence_guard_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE review scientific_review%ROWTYPE;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'DRAFT' OR NEW.published_at IS NOT NULL THEN
            RAISE EXCEPTION 'New revisions must start as unpublished drafts' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;
    IF (to_jsonb(NEW) - ARRAY['status','published_at']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status','published_at']) THEN
        RAISE EXCEPTION 'Revision content is immutable; create the next version' USING ERRCODE = '23514';
    END IF;
    IF OLD.status = 'ARCHIVED' OR
       (OLD.status = 'PUBLISHED' AND NEW.status <> 'ARCHIVED') OR
       (OLD.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
        RAISE EXCEPTION 'Published revisions can only be archived, preserving their publication date'
            USING ERRCODE = '23514';
    END IF;
    IF NOT ((OLD.status = 'DRAFT' AND NEW.status IN ('IN_REVIEW','ARCHIVED')) OR
            (OLD.status = 'IN_REVIEW' AND NEW.status IN ('APPROVED','ARCHIVED')) OR
            (OLD.status = 'APPROVED' AND NEW.status IN ('PUBLISHED','ARCHIVED')) OR
            (OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED')) THEN
        RAISE EXCEPTION 'Invalid evidence revision status transition' USING ERRCODE = '23514';
    END IF;
    IF NEW.status IN ('APPROVED','PUBLISHED') THEN
        SELECT * INTO review FROM scientific_review WHERE revision_id = NEW.id;
        IF review.decision IS DISTINCT FROM 'APPROVED' THEN
            RAISE EXCEPTION 'Independent approval of this exact revision is required' USING ERRCODE = '23514';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM claim_source cs JOIN scientific_source s ON s.id = cs.source_id
            WHERE cs.revision_id = NEW.id AND cs.relation = 'SUPPORTS'
              AND s.study_type NOT IN ('COMMENTARY','EDITORIAL','PREPRINT')
        ) THEN
            RAISE EXCEPTION 'A supporting scientific source is required; commentary alone is insufficient'
                USING ERRCODE = '23514';
        END IF;
        IF NEW.inference_type = 'CAUSAL' AND
            (NEW.evidence_level = 'INSUFFICIENT' OR
             coalesce(length(btrim(NEW.causal_justification)),0) = 0 OR
             NOT review.causality_approved OR
             coalesce(length(btrim(review.causal_assessment)),0) = 0) THEN
            RAISE EXCEPTION 'Causal wording requires justified, independently approved causal assessment'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    IF NEW.status = 'PUBLISHED' THEN
        IF NEW.published_at IS NULL OR NEW.published_at < review.reviewed_at OR
           NEW.published_at > clock_timestamp() OR NEW.next_review_at <= clock_timestamp() THEN
            RAISE EXCEPTION 'Publication requires valid publication and next review dates' USING ERRCODE = '23514';
        END IF;
    ELSIF NEW.published_at IS DISTINCT FROM OLD.published_at THEN
        RAISE EXCEPTION 'Publication date is set only when publishing' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER claim_revision_guard BEFORE INSERT OR UPDATE ON claim_revision
    FOR EACH ROW EXECUTE FUNCTION evidence_guard_revision();
