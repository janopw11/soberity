package com.soberity.events.locations;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
public class LocationCatalog {
    public static final String ATTRIBUTION = "Location data: GeoNames, CC BY 4.0; filtered and normalized by Soberity";
    private final JdbcTemplate jdbc;
    public LocationCatalog(JdbcTemplate jdbc) { this.jdbc=jdbc; }

    public Map<String,Object> countries(String q,String locale,int page,int size) {
        validate(q,locale,page,size);
        String where="active AND search_text LIKE ? ESCAPE '!'";
        return page("location_country", "id,geoname_id,iso_code,name,label_en,label_pl,label_"+locale+" AS label",where,
                new ArrayList<>(List.of(LocationNames.like(q))),"label_"+locale+",id",page,size);
    }
    public Map<String,Object> cities(UUID countryId,String q,String locale,int page,int size) {
        validate(q,locale,page,size);
        if(countryId!=null && !existsCountry(countryId)) throw bad("Active country required.");
        var args=new ArrayList<Object>();
        String where="c.active AND co.active AND c.search_text LIKE ? ESCAPE '!'";
        args.add(LocationNames.like(q));
        if(countryId!=null) { where+=" AND c.country_id=?"; args.add(countryId); }
        return page("location_city c JOIN location_country co ON co.id=c.country_id",
                "c.id,c.geoname_id,c.country_id,c.name,c.label_en,c.label_pl,c.label_"+locale+" AS label,c.region,c.district,c.latitude,c.longitude,c.timezone,c.version,"
                +"co.label_en AS country_label_en,co.label_pl AS country_label_pl,co.name AS country_name",
                where,args,"c.label_"+locale+",co.label_"+locale+",c.region NULLS LAST,c.district NULLS LAST,c.id",page,size);
    }
    public boolean existsCountry(UUID id) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM location_country WHERE id=? AND active)",Boolean.class,id));
    }
    /** A nearby settlement is only an approximate display label, never an inferred street address. */
    public Map<String,Object> nearbyPlace(double latitude,double longitude) {
        double reach=20.0/110.0;
        double edge=Math.min(90.0,Math.abs(latitude)+reach);
        double longitudeReach=edge>=89.9?180.0:Math.min(180.0,20.0/(110.0*Math.cos(Math.toRadians(edge))));
        var rows=jdbc.queryForList("""
            SELECT city_id,country_id,label_en,label_pl,country_label_en,country_label_pl FROM (
              SELECT c.id AS city_id,co.id AS country_id,c.label_en,c.label_pl,co.label_en AS country_label_en,co.label_pl AS country_label_pl,
                2*6371.0088*asin(sqrt(least(1.0,greatest(0.0,
                  power(sin(radians(c.latitude-?)/2),2)+cos(radians(?))*cos(radians(c.latitude))*power(sin(radians(c.longitude-?)/2),2))))) AS distance_km
              FROM location_city c JOIN location_country co ON co.id=c.country_id
              WHERE c.active AND co.active AND c.latitude BETWEEN ? AND ?
                AND (abs(c.longitude-?)<=? OR abs(c.longitude-?)>=360-?)
            ) candidates WHERE distance_km<=20 ORDER BY distance_km,city_id LIMIT 1
            """,latitude,latitude,longitude,latitude-reach,latitude+reach,longitude,longitudeReach,longitude,longitudeReach);
        return rows.isEmpty()?null:rows.getFirst();
    }
    /** Serialize event authoring/publication against a snapshot promotion. Caller must have a write transaction. */
    @Transactional
    public Map<String,Object> selected(UUID countryId,UUID cityId) {
        if(countryId==null || cityId==null) throw bad("Select country and city records.");
        jdbc.queryForList("SELECT pg_advisory_xact_lock_shared(hashtextextended('events_locations',0))");
        var rows=jdbc.queryForList("""
            SELECT c.*,co.iso_code,co.name AS country_name FROM location_city c JOIN location_country co ON co.id=c.country_id
            WHERE c.id=? AND c.country_id=? AND c.active AND co.active
            """,cityId,countryId);
        if(rows.isEmpty()) throw bad("Active city must belong to the selected country.");
        return rows.getFirst();
    }
    public Map<String,Object> metadata() {
        var rows=jdbc.queryForList("SELECT id,imported_at,source,license,country_count,city_count FROM location_snapshot WHERE active");
        return Map.of("available",!rows.isEmpty(),"snapshots",rows,"attribution",ATTRIBUTION,
                "sourceUrl","https://www.geonames.org/","licenseUrl","https://creativecommons.org/licenses/by/4.0/");
    }
    private Map<String,Object> page(String table,String fields,String where,List<Object> args,String order,int page,int size) {
        long count=jdbc.queryForObject("SELECT count(*) FROM "+table+" WHERE "+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        return Map.of("items",jdbc.queryForList("SELECT "+fields+" FROM "+table+" WHERE "+where+" ORDER BY "+order+" LIMIT ? OFFSET ?",args.toArray()),
                "total",count,"page",page,"size",size,"attribution",ATTRIBUTION);
    }
    private void validate(String q,String locale,int page,int size) {
        if(q!=null && q.length()>200) throw bad("Search query too long.");
        if(!Set.of("en","pl").contains(locale) || page<0 || page>100000 || size<1 || size>100) throw bad("Invalid locale or pagination.");
    }
    private ResponseStatusException bad(String message) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
