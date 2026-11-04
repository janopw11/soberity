-- Versioned rich descriptions and an explicit event organizer destination.
ALTER TABLE events_revision ADD COLUMN description_document jsonb;
ALTER TABLE events_revision ADD COLUMN organizer_url varchar(2048)
 CHECK(organizer_url IS NULL OR organizer_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$');
