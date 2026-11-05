-- Bound approximate current-place lookup to nearby latitude/longitude candidates.
CREATE INDEX location_city_coordinates ON location_city(latitude,longitude) WHERE active;
