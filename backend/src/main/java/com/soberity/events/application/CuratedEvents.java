package com.soberity.events.application;

import static com.soberity.events.application.EventValidation.*;
import com.soberity.events.domain.CuratedEventPolicy;
import com.soberity.events.domain.EventPolicy.*;
import com.soberity.events.locations.LocationCatalog;
import com.soberity.evidence.blog.BlogImages;
import com.soberity.identity.token.VerifiedToken;
import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CuratedEvents {
    private final JdbcTemplate jdbc;
    private final EventAccess access;
    private final LocationCatalog locations;
    public CuratedEvents(JdbcTemplate jdbc,EventAccess access,LocationCatalog locations) {
        this.jdbc=jdbc;this.access=access;this.locations=locations;
    }
    public UUID media(VerifiedToken actor,byte[] bytes,String alt) {
        access.admin(actor);
        try {
            var image=BlogImages.normalize(bytes,true);UUID id=UUID.randomUUID();
            jdbc.update("INSERT INTO events_media(id,alt_text,width,height,data,uploaded_by_ref) VALUES (?,?,?,?,?,?)",id,text(alt,500),image.width(),image.height(),image.bytes(),access.ref(actor));
            return id;
        }catch(IOException|IllegalArgumentException e){throw bad("Valid bounded JPEG/PNG required.");}
    }
    public byte[] media(VerifiedToken actor,UUID id) {
        access.admin(actor);
        var rows=jdbc.queryForList("SELECT data FROM events_media WHERE id=? AND organizer_id IS NULL",id);
        if(rows.isEmpty())throw missing();return (byte[])rows.getFirst().get("data");
    }
    public UUID save(VerifiedToken actor,UUID id,CuratedEventInput input) {
        access.admin(actor);
        if(input==null || input.track()==null || input.category()==null || !Set.of("en","pl").contains(Objects.toString(input.locale(),"")))
            throw bad("Classification and supported language required.");
        curatedDates(input.startsAt(),input.endsAt(),input.timezone());coordinates(input.latitude(),input.longitude());
        String precision=precision(input.locationPrecision(),input.latitude(),input.longitude());
        String title=text(input.title(),300),description=text(input.description(),30000),organizerUrl=url(input.organizerUrl(),true);
        String document=null;
        if(input.descriptionDocument()!=null && !input.descriptionDocument().isNull()) {
            try {
                var checked=com.soberity.evidence.blog.BlogDocument.check(input.descriptionDocument());
                if(!checked.images().isEmpty() || checked.text().isBlank() || checked.text().length()>30000)throw bad("Event description must contain text without embedded images.");
                document=checked.document().toString();
                if(document.length()>200000)throw bad("Event description is too large.");
            }catch(IllegalArgumentException e){throw bad("Invalid rich event description.");}
        }
        String rules=text(input.alcoholRules(),10000),beverages=text(input.beverageNotes(),5000),source=url(input.sourceUrl(),true),reference=text(input.sourceReference(),10000);
        if(!Boolean.TRUE.equals(input.contentRightsAttested()) || !Boolean.TRUE.equals(input.beverageRulesConfirmed()))throw bad("Confirm source/content rights and beverage rules.");
        var facts=new ContentFacts(input.track(),input.category(),AlcoholPolicy.ALCOHOL_FREE,rules,input.controls(),true,true,
                input.startsAt().toInstant(),input.endsAt()==null?null:input.endsAt().toInstant(),input.timezone());
        if(CuratedEventPolicy.assess(facts,true,Instant.now()).readiness()!=CuratedEventPolicy.Readiness.ELIGIBLE)throw bad("Qualified upcoming alcohol-free event required.");
        var location=resolveLocation(input);
        var city=locations.selected(location.countryId(),location.cityId());
        if(input.coverId()==null || !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM events_media WHERE id=? AND organizer_id IS NULL)",Boolean.class,input.coverId())))throw bad("Uploaded admin event cover required.");
        int revision=1;
        if(id==null) {
            id=UUID.randomUUID();jdbc.update("INSERT INTO sober_event(id,curated) VALUES (?,true)",id);
        } else {
            var existing=lock(id);version(input.expectedVersion(),existing.get("version"));
            if("DELETED".equals(existing.get("status")))throw missing();
            revision=((Number)existing.get("current_revision")).intValue()+1;
        }
        UUID venue=UUID.randomUUID();boolean exact=input.latitude()!=null && !"CITY".equals(precision);
        jdbc.update("""
            INSERT INTO events_venue(id,name,address,city,region,country_code,latitude,longitude,country_id,city_id,city_version,coordinate_source,
            street,building_number,postal_code,formatted_address,provider_place_id,location_precision)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,venue,Objects.toString(optional(input.venueName(),200),""),Objects.toString(optional(input.address(),500),""),city.get("name"),city.get("region"),city.get("iso_code"),
            exact?input.latitude():city.get("latitude"),exact?input.longitude():city.get("longitude"),location.countryId(),location.cityId(),city.get("version"),exact?"VENUE":"CITY",
            optional(input.street(),200),optional(input.buildingNumber(),40),optional(input.postalCode(),20),optional(input.formattedAddress(),500),optional(input.providerPlaceId(),200),precision);
        jdbc.update("""
            INSERT INTO events_revision(event_id,revision,author_ref,title,description,locale,track,category_code,alcohol_policy,alcohol_rules,
            alcohol_sold,alcohol_served,alcohol_permitted,beverage_notes,venue_id,starts_at,ends_at,timezone,
            price_kind,accessibility,entry_rules,source_url,source_reference,content_rights_attested,cover_id,organizer_url,source_checked_at,beverage_rules_confirmed,description_document)
            VALUES (?,?,?,?,?,?,?,?,'ALCOHOL_FREE',?,false,false,false,?,?,?,?,?,'UNKNOWN','UNKNOWN','',?,?,true,?,?,clock_timestamp(),true,?::jsonb)
            """,id,revision,access.ref(actor),title,description,input.locale(),input.track().name(),input.category().name(),rules,beverages,venue,
            Timestamp.from(input.startsAt().toInstant()),input.endsAt()==null?null:Timestamp.from(input.endsAt().toInstant()),input.timezone(),source,reference,input.coverId(),organizerUrl,document);
        if(revision>1)jdbc.update("UPDATE sober_event SET current_revision=?,status='DRAFT',version=version+1,updated_at=clock_timestamp() WHERE id=?",revision,id);
        audit(actor,id,revision==1?"EVENT_CREATED":"EVENT_REVISED");return id;
    }
    public void publish(VerifiedToken actor,UUID id,Integer expectedVersion) {
        access.admin(actor);
        // Always acquire snapshot lock before the event row (same order as authoring).
        jdbc.queryForList("SELECT pg_advisory_xact_lock_shared(hashtextextended('events_locations',0))");
        var event=lock(id);version(expectedVersion,event.get("version"));
        if(!"DRAFT".equals(event.get("status")))throw conflict();
        // Database guard revalidates source attestation, classification, required fields and current location.
        jdbc.update("UPDATE sober_event SET status='PUBLISHED',published_at=clock_timestamp(),published_revision=current_revision,version=version+1,updated_at=clock_timestamp() WHERE id=?",id);
        audit(actor,id,"EVENT_PUBLISHED");
    }
    public void delete(VerifiedToken actor,UUID id,Integer expectedVersion) {
        access.admin(actor);var event=lock(id);version(expectedVersion,event.get("version"));
        if("DELETED".equals(event.get("status")))throw missing();
        jdbc.update("UPDATE sober_event SET status='DELETED',version=version+1,updated_at=clock_timestamp() WHERE id=?",id);
        audit(actor,id,"EVENT_DELETED");
        // V26 removes participation in the same transaction when status becomes DELETED.
    }
    private record ResolvedLocation(UUID countryId,UUID cityId) { }
    /** Explicit catalog IDs stay supported; otherwise the country and city come from the confirmed address point. */
    private ResolvedLocation resolveLocation(CuratedEventInput input) {
        if(input.countryId()!=null && input.cityId()!=null) return new ResolvedLocation(input.countryId(),input.cityId());
        if(input.latitude()==null || input.longitude()==null) throw bad("Confirm the address position on the map to set the city.");
        var place=locations.nearbyPlace(input.latitude(),input.longitude());
        if(place==null) throw bad("No active catalog city within 20 km of the address.");
        return new ResolvedLocation((UUID)place.get("country_id"),(UUID)place.get("city_id"));
    }
    public Map<String,Object> detail(VerifiedToken actor,UUID id) {
        access.admin(actor);var event=lock(id);
        var result=new LinkedHashMap<>(event);
        var content=new LinkedHashMap<>(jdbc.queryForMap("""
            SELECT r.*,v.country_id,v.city_id,v.name AS venue_name,v.address,v.coordinate_source,v.latitude,v.longitude,
              v.street,v.building_number,v.postal_code,v.formatted_address,v.provider_place_id,v.location_precision,
              c.geoname_id AS city_geoname_id,c.name AS city_name,c.label_en AS city_label_en,c.label_pl AS city_label_pl,c.region,c.district,
              co.geoname_id AS country_geoname_id,co.name AS country_name,co.label_en AS country_label_en,co.label_pl AS country_label_pl
            FROM events_revision r JOIN events_venue v ON v.id=r.venue_id
            JOIN location_city c ON c.id=v.city_id JOIN location_country co ON co.id=v.country_id
            WHERE r.event_id=? AND revision=?
            """,id,event.get("current_revision")));
        Object document=content.get("description_document");
        if(document!=null)content.put("description_document",tools.jackson.databind.json.JsonMapper.builder().build().readTree(document.toString()));
        result.put("content",content);
        result.put("audit",jdbc.queryForList("SELECT action,created_at FROM events_audit WHERE event_id=? ORDER BY created_at,id",id));return result;
    }
    public Map<String,Object> list(VerifiedToken actor,int page,int size,UUID countryId,UUID cityId) {
        access.admin(actor);pagination(page,size);
        if(countryId!=null && !locations.existsCountry(countryId))throw bad("Select an active country.");
        if(cityId!=null)locations.selected(countryId,cityId);
        String from="""
            FROM sober_event e JOIN events_revision r ON r.event_id=e.id AND r.revision=e.current_revision
            JOIN events_venue v ON v.id=r.venue_id JOIN location_city c ON c.id=v.city_id
            JOIN location_country co ON co.id=v.country_id
            WHERE e.curated AND e.status<>'DELETED'
            """;
        var args=new ArrayList<Object>();
        if(countryId!=null){from+=" AND v.country_id=?";args.add(countryId);}
        if(cityId!=null){from+=" AND v.city_id=?";args.add(cityId);}
        long total=jdbc.queryForObject("SELECT count(*) "+from,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        return Map.of("items",jdbc.queryForList("""
            SELECT e.id,e.status,e.version,r.title,r.starts_at,r.timezone,v.country_id,v.city_id,
              c.label_en AS city_en,c.label_pl AS city_pl,co.label_en AS country_en,co.label_pl AS country_pl
            """+from+" ORDER BY e.updated_at DESC,e.id LIMIT ? OFFSET ?",args.toArray()),
            "page",page,"size",size,"total",total);
    }
    public Map<String,Object> legacy(VerifiedToken actor,int page,int size) {
        access.admin(actor);pagination(page,size);
        return Map.of("items",jdbc.queryForList("SELECT * FROM events_legacy_location_resolution ORDER BY event_id LIMIT ? OFFSET ?",size,(long)page*size),
            "page",page,"size",size,"total",jdbc.queryForObject("SELECT count(*) FROM events_legacy_location_resolution",Long.class));
    }
    private Map<String,Object> lock(UUID id) {
        var rows=jdbc.queryForList("SELECT * FROM sober_event WHERE id=? AND curated FOR UPDATE",id);
        if(rows.isEmpty())throw missing();return rows.getFirst();
    }
    private void audit(VerifiedToken actor,UUID id,String action) {
        jdbc.update("INSERT INTO events_audit(id,event_id,actor_ref,action) VALUES (?,?,?,?)",UUID.randomUUID(),id,access.ref(actor),action);
    }
    private void pagination(int page,int size){if(page<0||page>100000||size<1||size>100)throw bad("Invalid pagination.");}
    private ResponseStatusException missing(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Event unavailable.");}
    private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Reload before changing event state.");}
}
