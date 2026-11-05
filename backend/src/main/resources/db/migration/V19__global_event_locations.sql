-- Source data is imported explicitly; migrations never fetch or fabricate cities.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE TABLE location_snapshot (
 id uuid PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source varchar(80) NOT NULL DEFAULT 'GeoNames', license varchar(80) NOT NULL DEFAULT 'CC BY 4.0',
 manifest jsonb NOT NULL, country_count bigint NOT NULL, city_count bigint NOT NULL,
 quarantined_count bigint NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX location_one_active_snapshot ON location_snapshot(active) WHERE active;
CREATE TABLE location_country (
 id uuid PRIMARY KEY, geoname_id bigint NOT NULL UNIQUE CHECK(geoname_id>0),
 iso_code varchar(2) NOT NULL UNIQUE CHECK(iso_code ~ '^[A-Z]{2}$'),
 name text NOT NULL, label_en text NOT NULL, label_pl text NOT NULL, search_text text NOT NULL,
 active boolean NOT NULL DEFAULT true, snapshot_id uuid NOT NULL REFERENCES location_snapshot(id)
);
CREATE INDEX location_country_search ON location_country USING gin(search_text public.gin_trgm_ops);
CREATE TABLE location_city (
 id uuid PRIMARY KEY, geoname_id bigint NOT NULL UNIQUE CHECK(geoname_id>0),
 country_id uuid NOT NULL REFERENCES location_country(id), name text NOT NULL,
 label_en text NOT NULL,label_pl text NOT NULL,search_text text NOT NULL,
 region text, district text, latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),timezone varchar(100) NOT NULL,
 source_modified date NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 active boolean NOT NULL DEFAULT true,snapshot_id uuid NOT NULL REFERENCES location_snapshot(id),
 UNIQUE(id,country_id)
);
CREATE INDEX location_city_country ON location_city(country_id,active,name,id);
CREATE INDEX location_city_search ON location_city USING gin(search_text public.gin_trgm_ops);
CREATE TABLE location_quarantine (
 snapshot_id uuid NOT NULL REFERENCES location_snapshot(id), reason varchar(80) NOT NULL,
 record_count bigint NOT NULL CHECK(record_count>0), PRIMARY KEY(snapshot_id,reason)
);
