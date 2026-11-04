package com.soberity.events.application;

import com.soberity.events.domain.EventPolicy.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static com.soberity.events.application.EventInputs.*;
import static com.soberity.events.application.EventValidation.*;

/** Explicit public projection: contact, evidence, author identifiers and review notes stay private. */
@Service
@Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class EventCatalog {
    private final JdbcTemplate jdbc;
    private final tools.jackson.databind.json.JsonMapper json;
    public EventCatalog(JdbcTemplate jdbc,tools.jackson.databind.json.JsonMapper json) { this.jdbc=jdbc;this.json=json; }
    public enum Sort { START_ASC, START_DESC, PRICE_ASC }
    public record Search(String q,String city,String country,String region,Sort sort,Track track,Category category,AlcoholPolicy alcoholPolicy,
        PriceKind priceKind,String currency,Long maxPriceMinor,Accessibility accessibility,Availability availability,
        Instant from,Instant to,String locale,Double latitude,Double longitude,Double radiusKm,Integer page,Integer size) { }
    private static final String FIELDS="""
        e.id,e.status,e.published_at,o.id AS organizer_id,o.name AS organizer_name,
        r.title,r.description,r.locale,r.track,r.category_code,r.alcohol_policy,r.alcohol_rules,
        r.organizer_url,r.beverage_notes,r.starts_at,r.ends_at,r.timezone,r.price_kind,r.price_minor,r.currency,
        r.accessibility,r.accessibility_notes,r.availability,r.entry_rules,r.external_ticket_url,r.cover_id,
        v.name AS venue_name,v.address,v.city,v.region,v.country_code,v.latitude,v.longitude,
        m.alt_text AS cover_alt_text
        """;
    private static final String JOIN="""
        FROM sober_event e JOIN events_organizer o ON o.id=e.organizer_id
        JOIN events_revision r ON r.event_id=e.id AND r.revision=e.published_revision
        JOIN events_review review ON review.event_id=r.event_id AND review.revision=r.revision
        JOIN events_venue v ON v.id=r.venue_id
        LEFT JOIN events_media m ON m.id=r.cover_id
        """;
    private static final String ELIGIBLE="""
        o.verification='VERIFIED' AND EXISTS(SELECT 1 FROM events_membership WHERE organizer_id=o.id)
        AND review.decision='APPROVED' AND review.source_verified AND review.content_rights_verified
        AND review.alcohol_controls_verified AND review.beverage_abv_verified AND r.content_rights_attested
        AND ((r.alcohol_policy='ALCOHOL_FREE' AND r.alcohol_sold=false AND r.alcohol_served=false AND r.alcohol_permitted=false)
          OR (r.alcohol_policy='SOBER_FRIENDLY' AND r.alcohol_free_participation=true))
        """;
    public Map<String,Object> search(Search input) {
        int page=input.page()==null?0:input.page(),size=input.size()==null?20:input.size();
        if(page<0 || page>100000 || size<1 || size>100) throw bad("Invalid pagination.");
        Instant from=input.from()==null?Instant.now():input.from();
        if(input.to()!=null && !input.to().isAfter(from)) throw bad("Search end must follow start.");
        var args=new ArrayList<Object>();var where=new StringBuilder(ELIGIBLE+" AND e.status='PUBLISHED' AND e.current_revision=e.published_revision AND r.ends_at>clock_timestamp() AND r.starts_at>=?");args.add(Timestamp.from(from));
        add(where,args,"r.starts_at<?",input.to()==null?null:Timestamp.from(input.to()));
        add(where,args,"r.alcohol_policy=?",input.alcoholPolicy()==null?"ALCOHOL_FREE":input.alcoholPolicy().name());
        add(where,args,"r.track=?",input.track()==null?null:input.track().name());
        add(where,args,"r.category_code=?",input.category()==null?null:input.category().name());
        add(where,args,"lower(v.city)=lower(?)",optional(input.city(),150));
        add(where,args,"lower(v.region)=lower(?)",optional(input.region(),150));
        add(where,args,"v.country_code=?",input.country()==null?null:country(input.country()));
        add(where,args,"r.price_kind=?",input.priceKind()==null?null:input.priceKind().name());
        add(where,args,"r.accessibility=?",input.accessibility()==null?null:input.accessibility().name());
        add(where,args,"r.availability=?",input.availability()==null?null:input.availability().name());
        if(input.locale()!=null && !Set.of("en","pl").contains(input.locale())) throw bad("Supported language required.");
        add(where,args,"r.locale=?",input.locale());
        if(input.currency()!=null) {
            try { if(!input.currency().matches("[A-Z]{3}"))throw new IllegalArgumentException();Currency.getInstance(input.currency()); }
            catch(IllegalArgumentException e) {throw bad("ISO currency required.");}
            add(where,args,"r.currency=?",input.currency());
        }
        if(input.maxPriceMinor()!=null) {
            if(input.maxPriceMinor()<0 || input.currency()==null) throw bad("Maximum price requires currency and non-negative minor units.");
            add(where,args,"r.price_minor<=?",input.maxPriceMinor());
        }
        String q=optional(input.q(),200);if(q!=null)add(where,args,"strpos(lower(r.title),lower(?))>0",q);
        if(input.latitude()!=null || input.longitude()!=null || input.radiusKm()!=null) {
            coordinates(input.latitude(),input.longitude());
            if(input.latitude()==null || input.radiusKm()==null || !Double.isFinite(input.radiusKm()) || input.radiusKm()<0.1 || input.radiusKm()>250) throw bad("Latitude, longitude and radius 0.1–250 km required together.");
            where.append(" AND v.latitude IS NOT NULL AND (6371.0088 * acos(least(1.0,greatest(-1.0,sin(radians(?))*sin(radians(v.latitude))+cos(radians(?))*cos(radians(v.latitude))*cos(radians(v.longitude-?))))))<=?");
            args.add(input.latitude());args.add(input.latitude());args.add(input.longitude());args.add(input.radiusKm());
        }
        Sort sort=input.sort()==null?Sort.START_ASC:input.sort();
        if(sort==Sort.PRICE_ASC && input.currency()==null) throw bad("Price sorting requires a single currency.");
        String order=switch(sort) {
            case START_ASC -> "r.starts_at ASC,e.id";
            case START_DESC -> "r.starts_at DESC,e.id";
            case PRICE_ASC -> "r.price_minor ASC NULLS LAST,r.starts_at ASC,e.id";
        };
        long total=jdbc.queryForObject("SELECT count(*) "+JOIN+" WHERE "+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        var items=jdbc.queryForList("SELECT "+FIELDS+JOIN+" WHERE "+where+" ORDER BY "+order+" LIMIT ? OFFSET ?",args.toArray());
        return Map.of("items",items,"page",page,"size",size,"total",total);
    }
    public Map<String,Object> detail(UUID id) {
        var rows=jdbc.queryForList("SELECT "+FIELDS+",r.description_document "+JOIN+" WHERE e.id=? AND "+detailGate(),id);
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Event unavailable.");
        var result=rows.getFirst();if(result.get("description_document")!=null)result.put("description_document",json.readTree(result.get("description_document").toString()));return result;
    }
    public List<Map<String,Object>> categories() { return jdbc.queryForList("SELECT code,track,label_en,label_pl FROM events_category ORDER BY track,code"); }
    public boolean publicMedia(UUID id) { return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 "+JOIN+" WHERE r.cover_id=? AND "+detailGate()+")",Boolean.class,id)); }
    private static String detailGate() {
        return ELIGIBLE+" AND ((e.status='PUBLISHED' AND e.current_revision=e.published_revision) OR (e.status='CANCELLED' AND e.published_at IS NOT NULL)) AND r.ends_at>clock_timestamp()-interval '12 months'";
    }
    private static void add(StringBuilder where,List<Object> args,String expression,Object value) { if(value!=null) {where.append(" AND ").append(expression);args.add(value);} }
}
