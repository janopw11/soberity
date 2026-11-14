-- Operator-managed only: no public endpoint or default administrator.
CREATE TABLE application_role (
    firebase_uid varchar(128) NOT NULL CHECK (length(btrim(firebase_uid)) > 0),
    role varchar(32) NOT NULL CHECK (role IN ('SUPER_ADMIN')),
    active boolean NOT NULL DEFAULT true,
    granted_by varchar(128) NOT NULL CHECK (length(btrim(granted_by)) > 0),
    granted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (firebase_uid, role)
);

CREATE FUNCTION erase_application_roles() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM application_role WHERE firebase_uid=NEW.firebase_uid;
    RETURN NEW;
END;
$$;
CREATE TRIGGER application_role_account_erasure AFTER INSERT ON deleted_account
    FOR EACH ROW EXECUTE FUNCTION erase_application_roles();
