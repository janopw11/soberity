CREATE TABLE deleted_account (
    firebase_uid varchar(128) PRIMARY KEY,
    requested_at timestamptz NOT NULL,
    CONSTRAINT ck_deleted_account_firebase_uid_not_blank CHECK (length(btrim(firebase_uid)) > 0)
);
