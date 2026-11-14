package com.soberity.events.application;

import static com.soberity.events.application.EventValidation.*;
import com.soberity.events.domain.EventPolicy.*;
import com.soberity.events.locations.LocationNames;
import com.soberity.events.locations.LocationCatalog;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Stage-one public projection. No private source/rights/actor fields or legacy organizer listings. */
@Service
@Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class EventCatalog {
    private final JdbcTemplate jdbc;
    private final EventProperties properties;
    private final LocationCatalog locations;
    public EventCatalog(JdbcTemplate jdbc,EventProperties properties,LocationCatalog locations) {this.jdbc=jdbc;this.properties=properties;this.locations=locations;}
    public record Search(String q,UUID countryId,UUID cityId,Track track,Category category,Instant from,Instant to,String locale,int page,int size) { }
    public enum DateScope { UPCOMING, ANY }
    public record Nearby(Double latitude,Double longitude,String locale,Integer page,Integer size) {
        @Override public String toString(){return "Nearby[location redacted]";}
        @com.fasterxml.jackson.annotation.JsonAnySetter
        public void unsupported(String name,Object value){throw new IllegalArgumentException("Unsupported nearby field.");}
    }
    static final String FIELDS="""
        e.id,e.status,e.published_at,r.title,r.description,r.description_document,r.locale,r.track,r.category_code,
        r.alcohol_policy,r.alcohol_rules,r.beverage_notes,r.starts_at,r.ends_at,r.timezone,r.organizer_url,
        r.cover_id,m.alt_text AS cover_alt_text,r.price_kind,r.price_minor,r.currency,r.accessibility,
        r.accessibility_notes,r.availability,r.entry_rules,r.external_ticket_url,
        v.name AS venue_name,v.address,c.name AS city,c.label_en AS city_en,c.label_pl AS city_pl,c.region,
        co.iso_code AS country_code,v.country_id,v.city_id,v.coordinate_source,v.latitude,v.longitude
        """;
    static final String JOIN="""
        FROM sober_event e JOIN events_revision r ON r.event_id=e.id AND r.revision=e.published_revision
        JOIN events_venue v ON v.id=r.venue_id JOIN location_city c ON c.id=v.city_id AND c.country_id=v.country_id
        JOIN location_country co ON co.id=v.country_id JOIN events_media m ON m.id=r.cover_id
        """;
    static final String ELIGIBLE="""
        e.curated AND e.status='PUBLISHED' AND e.current_revision=e.published_revision
        AND c.active AND co.active AND c.version=v.city_version
        AND r.alcohol_policy='ALCOHOL_FREE' AND r.alcohol_sold=false AND r.alcohol_served=false AND r.alcohol_permitted=false
        AND r.content_rights_attested AND r.beverage_rules_confirmed AND r.source_checked_at IS NOT NULL
        AND coalesce(r.ends_at,r.starts_at)>clock_timestamp()-interval '12 months'
        """;
    public Map<String,Object> search(Search input) {
        return search(input,List.of());
    }
    public Map<String,Object> search(Search input,List<Category> categories) {
        return search(input,categories,DateScope.UPCOMING);
    }
    public Map<String,Object> search(Search input,List<Category> categories,DateScope dateScope) {
        pagination(input.page(),input.size());locale(input.locale());
        if(input.from()!=null && input.to()!=null&&!input.to().isAfter(input.from()))throw bad("Search end must follow start.");
        Instant from=input.from(),now=Instant.now();
        if(dateScope!=DateScope.ANY && (from==null || from.isBefore(now)))from=now;
        var args=new ArrayList<Object>();var where=new StringBuilder(ELIGIBLE);
        if(dateScope!=DateScope.ANY && input.to()!=null && !input.to().isAfter(now))
            return Map.of("items",List.of(),"total",0L,"page",input.page(),"size",input.size());
        if(from!=null) {
            where.append(" AND (r.ends_at>? OR (r.ends_at IS NULL AND r.starts_at>=?))");
            args.add(Timestamp.from(from));args.add(Timestamp.from(from));
        }
        add(where,args,"r.starts_at<?",input.to()==null?null:Timestamp.from(input.to()));
        add(where,args,"v.country_id=?",input.countryId());add(where,args,"v.city_id=?",input.cityId());
        if(input.cityId()!=null && input.countryId()==null)throw bad("City filter requires its country.");
        if(input.countryId()!=null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM location_country WHERE id=? AND active)",Boolean.class,input.countryId())))throw bad("Active country required.");
        if(input.cityId()!=null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM location_city WHERE id=? AND country_id=? AND active)",Boolean.class,input.cityId(),input.countryId())))throw bad("City must belong to country.");
        add(where,args,"r.track=?",input.track()==null?null:input.track().name());
        var selected=new LinkedHashSet<Category>(categories);
        selected.remove(null);
        if(input.category()!=null)selected.add(input.category());
        if(!selected.isEmpty()) {
            where.append(" AND r.category_code IN (").append(String.join(",",Collections.nCopies(selected.size(),"?"))).append(")");
            selected.forEach(category->args.add(category.name()));
        }
        add(where,args,"r.locale=?",input.locale());
        String q=optional(input.q(),200);if(q!=null)add(where,args,"lower(r.title) LIKE ? ESCAPE '!'","%"+q.toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");
        return page("SELECT "+FIELDS+JOIN+" WHERE "+where,args,"r.starts_at,e.id",input.page(),input.size());
    }
    public Map<String,Object> nearby(Nearby input) {
        if(input==null || input.latitude()==null || input.longitude()==null)throw bad("Coordinates required in the request body.");
        coordinates(input.latitude(),input.longitude());locale(input.locale());
        int page=input.page()==null?0:input.page(),size=input.size()==null?20:input.size();pagination(page,size);
        var args=new ArrayList<Object>(List.of(input.latitude(),input.latitude(),input.longitude(),Timestamp.from(Instant.now())));
        String distance="2*6371.0088*asin(sqrt(least(1.0,greatest(0.0,power(sin(radians(v.latitude-?)/2),2)+cos(radians(?))*cos(radians(v.latitude))*power(sin(radians(v.longitude-?)/2),2)))))";
        String query="SELECT "+FIELDS+","+distance+" AS distance_km "+JOIN+" WHERE "+ELIGIBLE+" AND coalesce(r.ends_at,r.starts_at)>?";
        if(input.locale()!=null){query+=" AND r.locale=?";args.add(input.locale());}
        args.add(properties.nearbyRadiusKm());
        var result=new LinkedHashMap<>(page("SELECT * FROM ("+query+") candidates WHERE distance_km<=?+1e-7",args,"distance_km,starts_at,id",page,size));
        result.put("radiusKm",properties.nearbyRadiusKm());
        result.put("location",locations.nearbyPlace(input.latitude(),input.longitude()));return result;
    }
    /** Published upcoming/ongoing projections for explicit circle associations; no event copies. */
    public Map<String,Object> related(List<UUID> ids,int page,int size) {
        pagination(page,size);
        if(ids.isEmpty())return Map.of("items",List.of(),"page",page,"size",size,"total",0);
        var args=new ArrayList<Object>(ids);
        return page("SELECT "+FIELDS+JOIN+" WHERE "+ELIGIBLE+" AND coalesce(r.ends_at,r.starts_at)>clock_timestamp() AND e.id IN ("+
            String.join(",",Collections.nCopies(ids.size(),"?"))+")",args,"r.starts_at,e.id",page,size);
    }
    public Map<String,Object> detail(UUID id) {
        var rows=jdbc.queryForList("SELECT "+FIELDS+JOIN+" WHERE e.id=? AND "+ELIGIBLE,id);
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Event unavailable.");
        var result=new LinkedHashMap<>(rows.getFirst());
        if(result.get("description_document")!=null)
            result.put("description_document",tools.jackson.databind.json.JsonMapper.builder().build().readTree(result.get("description_document").toString()));
        return result;
    }
    public List<Map<String,Object>> categories(){return jdbc.queryForList("SELECT code,track,label_en,label_pl FROM events_category ORDER BY track,code");}
    public boolean publicMedia(UUID id){return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 "+JOIN+" WHERE r.cover_id=? AND "+ELIGIBLE+")",Boolean.class,id));}
    private Map<String,Object> page(String query,List<Object> args,String order,int page,int size) {
        long total=jdbc.queryForObject("SELECT count(*) FROM ("+query+") counted",Long.class,args.toArray());
        var paged=new ArrayList<>(args);paged.add(size);paged.add((long)page*size);
        return Map.of("items",jdbc.queryForList(query+" ORDER BY "+order+" LIMIT ? OFFSET ?",paged.toArray()),"total",total,"page",page,"size",size);
    }
    private void locale(String locale){if(locale!=null&&!Set.of("en","pl").contains(locale))throw bad("Supported language required.");}
    private void pagination(int page,int size){if(page<0||page>100000||size<1||size>100)throw bad("Invalid pagination.");}
    private static void add(StringBuilder where,List<Object> args,String expression,Object value){if(value!=null){where.append(" AND ").append(expression);args.add(value);}}
}
