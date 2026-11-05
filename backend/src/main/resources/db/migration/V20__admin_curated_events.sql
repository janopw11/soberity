-- Preserve the organizer catalog, but require explicit resolution before public reuse.
CREATE TABLE events_admin (
 firebase_uid varchar(128) PRIMARY KEY, active boolean NOT NULL DEFAULT true,
 granted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE sober_event ADD COLUMN curated boolean NOT NULL DEFAULT false;
ALTER TABLE sober_event ALTER COLUMN organizer_id DROP NOT NULL;
ALTER TABLE sober_event DROP CONSTRAINT sober_event_status_check;
ALTER TABLE sober_event ADD CHECK(status IN ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','REJECTED','CANCELLED','ARCHIVED','DELETED'));
ALTER TABLE sober_event ADD CHECK((curated AND organizer_id IS NULL) OR (NOT curated AND organizer_id IS NOT NULL));
ALTER TABLE events_venue ALTER COLUMN organizer_id DROP NOT NULL;
ALTER TABLE events_venue ADD COLUMN country_id uuid REFERENCES location_country(id);
ALTER TABLE events_venue ADD COLUMN city_id uuid;
ALTER TABLE events_venue ADD COLUMN city_version integer;
ALTER TABLE events_venue ADD COLUMN coordinate_source varchar(8) CHECK(coordinate_source IN ('CITY','VENUE'));
ALTER TABLE events_venue ADD FOREIGN KEY(city_id) REFERENCES location_city(id);
ALTER TABLE events_venue ADD CHECK(organizer_id IS NOT NULL OR
 (country_id IS NOT NULL AND city_id IS NOT NULL AND city_version IS NOT NULL AND coordinate_source IS NOT NULL
 AND latitude IS NOT NULL AND longitude IS NOT NULL));
ALTER TABLE events_media ALTER COLUMN organizer_id DROP NOT NULL;
ALTER TABLE events_revision ALTER COLUMN organizer_id DROP NOT NULL;
ALTER TABLE events_revision ALTER COLUMN ends_at DROP NOT NULL;
ALTER TABLE events_revision ADD COLUMN source_checked_at timestamptz;
ALTER TABLE events_revision ADD COLUMN beverage_rules_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE events_audit ALTER COLUMN organizer_id DROP NOT NULL;
-- Keep the previous trigger function and its behavior for preserved legacy records.
ALTER FUNCTION events_guard_state() RENAME TO events_guard_legacy_state;
DROP TRIGGER events_state_guard ON sober_event;
CREATE TRIGGER events_legacy_state_guard BEFORE INSERT OR UPDATE ON sober_event
 FOR EACH ROW WHEN (NOT NEW.curated) EXECUTE FUNCTION events_guard_legacy_state();
CREATE FUNCTION events_guard_curated_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r events_revision%ROWTYPE; v events_venue%ROWTYPE;
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'DRAFT' OR NEW.current_revision<>1 OR NEW.version<>1 OR NEW.published_at IS NOT NULL OR NEW.published_revision IS NOT NULL THEN
   RAISE EXCEPTION 'Curated events start as drafts' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 IF NEW.curated IS DISTINCT FROM OLD.curated OR NEW.id<>OLD.id OR NEW.created_at<>OLD.created_at
  OR NEW.organizer_id IS DISTINCT FROM OLD.organizer_id OR NEW.version<>OLD.version+1 THEN
  RAISE EXCEPTION 'Immutable identity and advancing version required' USING ERRCODE='23514';
 END IF;
 IF OLD.status='DELETED' OR NEW.status NOT IN ('DRAFT','PUBLISHED','DELETED')
  OR (NEW.status<>OLD.status AND NOT (
   (OLD.status='DRAFT' AND NEW.status IN ('PUBLISHED','DELETED')) OR
   (OLD.status='PUBLISHED' AND NEW.status IN ('DRAFT','DELETED')))) THEN
  RAISE EXCEPTION 'Invalid curated transition' USING ERRCODE='23514';
 END IF;
 IF NEW.current_revision<>OLD.current_revision AND (NEW.current_revision<>OLD.current_revision+1 OR NEW.status<>'DRAFT') THEN
  RAISE EXCEPTION 'Editing withdraws publication' USING ERRCODE='23514';
 END IF;
 IF NEW.status='PUBLISHED' THEN
  SELECT * INTO r FROM events_revision WHERE event_id=NEW.id AND revision=NEW.current_revision;
  SELECT * INTO v FROM events_venue WHERE id=r.venue_id;
  IF r.event_id IS NULL OR r.organizer_id IS NOT NULL OR r.cover_id IS NULL OR r.organizer_url IS NULL
   OR NOT r.content_rights_attested OR NOT r.beverage_rules_confirmed OR r.source_checked_at IS NULL
   OR r.source_checked_at>clock_timestamp() OR r.starts_at<clock_timestamp() OR r.alcohol_policy<>'ALCOHOL_FREE'
   OR r.alcohol_sold IS DISTINCT FROM false OR r.alcohol_served IS DISTINCT FROM false OR r.alcohol_permitted IS DISTINCT FROM false
   OR length(btrim(r.beverage_notes))=0 OR length(btrim(r.source_reference))=0
   OR v.organizer_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM location_city c JOIN location_country country ON country.id=c.country_id
     WHERE c.id=v.city_id AND c.country_id=v.country_id AND c.version=v.city_version AND c.active AND country.active)
   OR NOT EXISTS(SELECT 1 FROM events_media WHERE id=r.cover_id AND organizer_id IS NULL)
   OR NEW.published_revision IS DISTINCT FROM NEW.current_revision OR NEW.published_at IS NULL THEN
   RAISE EXCEPTION 'Complete qualified curated event and active location required' USING ERRCODE='23514';
  END IF;
 ELSIF NEW.published_revision IS DISTINCT FROM OLD.published_revision OR NEW.published_at IS DISTINCT FROM OLD.published_at THEN
  RAISE EXCEPTION 'Published snapshot changes only at publication' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_curated_state_guard BEFORE INSERT OR UPDATE ON sober_event
 FOR EACH ROW WHEN (NEW.curated) EXECUTE FUNCTION events_guard_curated_state();
-- Identity mode cannot be flipped to bypass either lifecycle.
CREATE FUNCTION events_guard_mode() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.curated IS DISTINCT FROM OLD.curated THEN
  RAISE EXCEPTION 'Event mode is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_mode_guard BEFORE UPDATE ON sober_event FOR EACH ROW EXECUTE FUNCTION events_guard_mode();
CREATE FUNCTION events_guard_curated_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM sober_event WHERE id=NEW.event_id AND curated) THEN
  IF NEW.organizer_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM events_venue WHERE id=NEW.venue_id AND organizer_id IS NULL)
   OR (NEW.cover_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM events_media WHERE id=NEW.cover_id AND organizer_id IS NULL)) THEN
   RAISE EXCEPTION 'Curated content cannot reference organizer resources' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_curated_revision_guard BEFORE INSERT ON events_revision FOR EACH ROW EXECUTE FUNCTION events_guard_curated_revision();
CREATE FUNCTION events_erase_admin_grant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 DELETE FROM events_admin WHERE firebase_uid=NEW.firebase_uid;
 RETURN NEW;
END $$;
CREATE TRIGGER events_admin_account_erasure AFTER INSERT ON deleted_account FOR EACH ROW EXECUTE FUNCTION events_erase_admin_grant();
-- Preserved text remains visible to admins for explicit resolution; never auto-match by name.
CREATE VIEW events_legacy_location_resolution AS
 SELECT e.id AS event_id,e.status,v.country_code,v.city,v.region,v.name AS venue_name
 FROM sober_event e JOIN events_revision r ON r.event_id=e.id AND r.revision=e.current_revision
 JOIN events_venue v ON v.id=r.venue_id WHERE NOT e.curated;
