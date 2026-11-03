-- Roles are provisioned by a trusted operator, never through consumer API.
CREATE TABLE editorial_role (
    firebase_uid varchar(128) NOT NULL CHECK (length(btrim(firebase_uid)) > 0),
    role varchar(16) NOT NULL CHECK (role IN ('AUTHOR','REVIEWER')),
    granted_by varchar(128) NOT NULL CHECK (length(btrim(granted_by)) > 0),
    granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (firebase_uid, role)
);
CREATE TABLE editorial_audit (
    id uuid PRIMARY KEY,
    actor_uid varchar(128) NOT NULL,
    material_type varchar(16) NOT NULL CHECK (material_type IN ('CLAIM','ARTICLE','SOURCE')),
    material_id uuid NOT NULL,
    action varchar(32) NOT NULL,
    reason text NOT NULL CHECK (length(btrim(reason)) > 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX editorial_audit_material ON editorial_audit(material_type, material_id, created_at, id);
CREATE TRIGGER editorial_audit_immutable BEFORE UPDATE OR DELETE ON editorial_audit
    FOR EACH ROW EXECUTE FUNCTION evidence_reject_mutation();
