-- Additive indexes for literal case-insensitive substring names and structured location filters.
-- pg_trgm is installed by V19. Public eligibility, ordering and existing data are unchanged.
CREATE INDEX events_revision_title_search ON events_revision USING gin (lower(title) public.gin_trgm_ops);
CREATE INDEX events_venue_location ON events_venue(country_id,city_id);
