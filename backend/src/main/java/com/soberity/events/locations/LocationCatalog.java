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
        if(countryId==null) throw bad("Select a country first.");
        if(!existsCountry(countryId)) throw bad("Active country required.");
        return page("location_city", "id,geoname_id,country_id,name,label_en,label_pl,label_"+locale+" AS label,region,district,latitude,longitude,timezone,version",
                "active AND country_id=? AND search_text LIKE ? ESCAPE '!'",new ArrayList<>(List.of(countryId,LocationNames.like(q))),
                "label_"+locale+",region NULLS LAST,district NULLS LAST,id",page,size);
    }
    public boolean existsCountry(UUID id) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM location_country WHERE id=? AND active)",Boolean.class,id));
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
