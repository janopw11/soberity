ALTER TABLE user_profile
    ADD COLUMN display_name varchar(50),
    ADD COLUMN city         varchar(100),
    ADD COLUMN interests    varchar(32)[] NOT NULL DEFAULT '{}',
    ADD CONSTRAINT ck_user_profile_display_name CHECK (display_name IS NULL OR length(btrim(display_name)) > 0),
    ADD CONSTRAINT ck_user_profile_interests CHECK (interests <@ ARRAY['science', 'sport', 'events', 'community']::varchar[]);
