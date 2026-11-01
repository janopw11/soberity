CREATE TABLE user_profile (
    id           uuid         PRIMARY KEY,
    firebase_uid varchar(128) NOT NULL,
    locale       varchar(8),
    created_at   timestamptz  NOT NULL,
    updated_at   timestamptz  NOT NULL,
    CONSTRAINT ck_user_profile_firebase_uid_not_blank CHECK (length(btrim(firebase_uid)) > 0),
    CONSTRAINT ck_user_profile_locale CHECK (locale IS NULL OR locale IN ('en', 'pl'))
);

CREATE UNIQUE INDEX ux_user_profile_firebase_uid ON user_profile (firebase_uid);
