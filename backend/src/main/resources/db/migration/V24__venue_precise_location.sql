-- Precise venue location fields. Additive only: venues stay append-only and legacy rows keep NULL precision,
-- so they never publish a map marker until a precise location is saved.
ALTER TABLE events_venue ADD COLUMN street varchar(200);
ALTER TABLE events_venue ADD COLUMN building_number varchar(40);
ALTER TABLE events_venue ADD COLUMN postal_code varchar(20);
ALTER TABLE events_venue ADD COLUMN formatted_address varchar(500);
ALTER TABLE events_venue ADD COLUMN provider_place_id varchar(200);
ALTER TABLE events_venue ADD COLUMN location_precision varchar(8) CHECK(location_precision IN ('ADDRESS','VENUE','CITY'));
ALTER TABLE events_venue ADD CONSTRAINT events_venue_marker_requires_point CHECK(
 location_precision IS NULL OR location_precision='CITY' OR (latitude IS NOT NULL AND longitude IS NOT NULL));
CREATE INDEX events_venue_map_points ON events_venue(latitude,longitude)
 WHERE location_precision IN ('ADDRESS','VENUE') AND latitude IS NOT NULL;
