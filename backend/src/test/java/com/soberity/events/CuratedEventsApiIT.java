package com.soberity.events;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.events.locations.*;
import com.soberity.identity.token.VerifiedToken;
import com.soberity.support.AbstractIntegrationTest;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class CuratedEventsApiIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    @Autowired GeoNamesImporter importer;
    @TempDir Path directory;
    private String admin;
    @BeforeEach void prepare()throws Exception {
        GeoNamesFixture.write(directory);importer.importDirectory(directory,1,1);admin=user(true);
    }
    private String user(boolean admin)throws Exception {
        String uid="event-"+UUID.randomUUID();when(tokenVerifier.verify(uid)).thenReturn(new VerifiedToken(uid,true));
        if(admin)jdbc.update("INSERT INTO events_admin(firebase_uid) VALUES (?)",uid);return uid;
    }
    private String cover()throws Exception {
        var bytes=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(10,10,BufferedImage.TYPE_INT_RGB),"png",bytes);
        return json.readTree(mvc.perform(multipart("/api/v1/admin/events/media").file(new MockMultipartFile("file","fixture.png","image/png",bytes.toByteArray()))
            .param("altText","Synthetic event cover").header("Authorization","Bearer "+admin)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
    }
    private Map<String,Object> input(String title)throws Exception {
        var body=new LinkedHashMap<String,Object>();
        body.put("countryId",GeoNamesFixture.country(1));body.put("cityId",GeoNamesFixture.city(101));body.put("title",title);body.put("description","Synthetic event description");
        body.put("locale","en");body.put("track","SOBER_NIGHTLIFE");body.put("category","SOBER_RAVE");body.put("organizerUrl","https://example.test/host");body.put("coverId",cover());
        body.put("startsAt","2029-11-06T20:00:00+01:00");body.put("timezone","Europe/Vienna");body.put("alcoholRules","No sale, service or BYOB; confirmed 0.0% only.");
        body.put("controls",Map.of("alcoholSold",false,"alcoholServed",false,"alcoholPermitted",false));body.put("beverageNotes","Confirmed 0.0% only");body.put("beverageRulesConfirmed",true);
        body.put("sourceUrl","https://example.test/event");body.put("sourceReference","Private synthetic confirmation");body.put("contentRightsAttested",true);return body;
    }
    private JsonNode create(Map<String,Object> body)throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    private String published(Map<String,Object> body)throws Exception {
        String id=create(body).path("id").asText();publish(id,1);return id;
    }
    private void publish(String id,int version)throws Exception {
        mvc.perform(post("/api/v1/admin/events/"+id+"/publish").header("Authorization","Bearer "+admin).contentType("application/json").content("{\"expectedVersion\":"+version+"}")).andExpect(status().isNoContent());
    }
    @Test void adminPublishesAndDeletesWithoutOrganizationAndPrivateFactsStayPrivate()throws Exception {
        var body=input("Lifecycle "+UUID.randomUUID());String media=body.get("coverId").toString(),id=create(body).path("id").asText();
        mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/events/media/"+media)).andExpect(status().isNotFound());
        publish(id,1);
        String response=mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.city_id").value(GeoNamesFixture.city(101).toString())).andExpect(jsonPath("$.ends_at").isEmpty()).andExpect(jsonPath("$.organizer_url").value("https://example.test/host"))
            .andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain("source_reference","Private synthetic","author_ref",admin,"content_rights_attested");
        mvc.perform(get("/api/v1/events/media/"+media)).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));
        mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","1").header("Authorization","Bearer "+admin)).andExpect(status().isConflict());
        mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","2").header("Authorization","Bearer "+admin)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isNotFound());mvc.perform(get("/api/v1/events/media/"+media)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/events").param("q",body.get("title").toString())).andExpect(jsonPath("$.total").value(0));
        assertThat(jdbc.queryForList("SELECT action FROM events_audit WHERE event_id=? ORDER BY created_at",UUID.fromString(id)))
            .extracting(row->row.get("action")).containsExactly("EVENT_CREATED","EVENT_PUBLISHED","EVENT_DELETED");
        assertThat(jdbc.queryForObject("SELECT organizer_id FROM sober_event WHERE id=?",UUID.class,UUID.fromString(id))).isNull();
    }
    @Test void ordinaryUnverifiedRevokedAndDeletedAccountsCannotWriteOrUseLegacyBypass()throws Exception {
        var body=input("ACL");String plain=user(false),id=create(body).path("id").asText();
        jdbc.update("INSERT INTO events_moderator(firebase_uid) VALUES (?)",plain);
        mvc.perform(post("/api/v1/admin/events").contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+plain).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/events/"+id+"/publish").header("Authorization","Bearer "+plain).contentType("application/json").content("{\"expectedVersion\":1}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","1").header("Authorization","Bearer "+plain)).andExpect(status().isForbidden());
        for(String route:List.of("/api/v1/organizer/organizations","/api/v1/moderation/events/"+id+"/publish"))
            mvc.perform(post(route).header("Authorization","Bearer "+admin).contentType("application/json").content("{}")).andExpect(status().isForbidden());
        when(tokenVerifier.verify("unverified-events")).thenReturn(new VerifiedToken("unverified-events",false));
        mvc.perform(get("/api/v1/admin/events").header("Authorization","Bearer unverified-events")).andExpect(status().isForbidden());
        jdbc.update("UPDATE events_admin SET active=false WHERE firebase_uid=?",admin);
        mvc.perform(get("/api/v1/admin/events").header("Authorization","Bearer "+admin)).andExpect(status().isForbidden());
        String erased=user(true);jdbc.update("INSERT INTO deleted_account(firebase_uid,requested_at) VALUES (?,clock_timestamp())",erased);
        mvc.perform(get("/api/v1/admin/events").header("Authorization","Bearer "+erased)).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM events_admin WHERE firebase_uid=?",Long.class,erased)).isZero();
    }
    @Test void combinedFiltersAndLiteralNameApplyBeforeStablePagination()throws Exception {
        String prefix="Combined-"+UUID.randomUUID();
        for(int i=0;i<3;i++){var body=input(prefix+" 100%_literal "+i);body.put("startsAt","2029-11-0"+(6+i)+"T20:00:00+01:00");published(body);}
        var hidden=input(prefix+" 100%_literal hidden");create(hidden);
        for(int page=0;page<3;page++)mvc.perform(get("/api/v1/events").param("q",prefix.toLowerCase()+" 100%_literal").param("countryId",GeoNamesFixture.country(1).toString())
            .param("cityId",GeoNamesFixture.city(101).toString()).param("category","SOBER_RAVE").param("from","2029-11-01T00:00:00Z").param("to","2029-12-01T00:00:00Z").param("size","1").param("page",""+page))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(get("/api/v1/events").param("q",prefix).param("category","COFFEE_MEETUP")).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/events").param("q","' OR 1=1 --")).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/events").param("from","2029-12-01T00:00:00Z").param("to","2029-11-01T00:00:00Z")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/events").param("city","Wien")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/events").param("latitude","61.12345678")).andExpect(status().isBadRequest());
    }
    @Test void categorySetsAndStructuredCountryCombineBeforePaginationAndIgnoreBlankFilters()throws Exception {
        String prefix="FilterSet-"+UUID.randomUUID();
        var rave=input(prefix+" RAVE");published(rave);
        var coffee=input(prefix+" Coffee");coffee.put("track","SOBER_LIFESTYLE");coffee.put("category","COFFEE_MEETUP");published(coffee);
        create(input(prefix+" private draft"));
        mvc.perform(get("/api/v1/events").param("q","  "+prefix.toLowerCase()+"  ").param("countryId",GeoNamesFixture.country(1).toString())
            .param("category","SOBER_RAVE,COFFEE_MEETUP").param("size","1").param("page","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(get("/api/v1/events").param("q",prefix).param("category","SOBER_RAVE","COFFEE_MEETUP"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
        mvc.perform(get("/api/v1/events").param("q",prefix).param("countryId",GeoNamesFixture.country(2).toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/events").param("q",prefix).param("category","").param("countryId","").param("cityId","").param("from","").param("to",""))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
        for(var invalid:List.of(Map.of("category","MUSIC"),Map.of("dateScope","INVALID"),Map.of("from","not-a-date"),Map.of("cityId","invalid"),Map.of("countryId",UUID.randomUUID().toString())))
            for(var entry:invalid.entrySet())mvc.perform(get("/api/v1/events").param(entry.getKey(),entry.getValue())).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/locations/cities").param("q","wieden").param("locale","en"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].label_en").value("Vienna")).andExpect(jsonPath("$.items[0].country_label_en").value("Austria"));
    }
    @Test void dateWindowIncludesTheEntireFinalLocalDayAndExcludesNextMidnightAcrossDst()throws Exception {
        String prefix="InclusiveDst-"+UUID.randomUUID();
        for(String starts:List.of("2029-03-24T23:59:59+01:00","2029-03-25T00:00:00+01:00","2029-03-25T23:59:59+02:00","2029-03-26T00:00:00+02:00")) {
            var body=input(prefix+" "+starts);body.put("startsAt",starts);published(body);
        }
        mvc.perform(get("/api/v1/events").param("q",prefix).param("from","2029-03-24T23:00:00Z").param("to","2029-03-25T22:00:00Z"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
        mvc.perform(get("/api/v1/events").param("q",prefix).param("from","2029-03-25T22:00:00Z").param("to","2029-03-25T22:00:00Z"))
            .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForList("SELECT indexname FROM pg_indexes WHERE indexname IN ('events_revision_title_search','events_venue_location')"))
            .hasSize(2);
    }
    @Test void validatesGlobalSelectionsCoordinatesRightsLinksAndClassification()throws Exception {
        var body=input("Validation");
        for(var change:List.of(Map.of("cityId",GeoNamesFixture.city(102)),Map.of("latitude",91.0,"longitude",0.0),Map.of("latitude",0.0),
                Map.of("sourceUrl","http://example.test/source"),Map.of("organizerUrl","https://user:secret@example.test/host"),Map.of("coverId",UUID.randomUUID()),
                Map.of("contentRightsAttested",false),Map.of("beverageRulesConfirmed",false),Map.of("category","COFFEE_MEETUP"))) {
            var invalid=new LinkedHashMap<>(body);invalid.putAll(change);
            mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
        }
        body.put("controls",Map.of("alcoholSold",false,"alcoholPermitted",false));
        mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/locations/cities").param("countryId",GeoNamesFixture.country(2).toString()).param("q","Wien")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/locations/countries").param("q","polska").param("locale","pl")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].label").value("Polska"));
    }
    @Test void validatesDstAndStoresUtcWhileAllowingOptionalEnd()throws Exception {
        var body=input("DST");body.put("startsAt","2029-03-25T02:30:00+01:00"); // missing Vienna spring-forward hour
        mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        body.put("startsAt","2029-10-28T02:30:00+02:00");String id=create(body).path("id").asText();
        assertThat(jdbc.queryForObject("SELECT starts_at FROM events_revision WHERE event_id=?",java.sql.Timestamp.class,UUID.fromString(id)).toInstant()).isEqualTo(java.time.Instant.parse("2029-10-28T00:30:00Z"));
        body.put("startsAt","2029-10-28T02:30:00+01:00");create(body); // explicit second occurrence
        body.put("timezone","+01:00");mvc.perform(post("/api/v1/admin/events").header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    }
    @Test void nearbyUsesInclusiveConfiguredRadiusDistanceOrderAndNoRemoteFallback()throws Exception {
        var ids=new ArrayList<String>();
        for(double km:new double[]{20,10,100,100.001}) {
            var body=input("Near "+km);body.put("latitude",Math.toDegrees(km/6371.0088));body.put("longitude",0.0);ids.add(published(body));
        }
        String response=mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":0,\"longitude\":0,\"size\":1}"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.radiusKm").value(100))
            .andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.items[0].id").value(ids.get(1))).andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain("source_reference","author_ref");
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":0,\"longitude\":0,\"page\":2,\"size\":1}"))
            .andExpect(jsonPath("$.items[0].id").value(ids.get(2)));
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":-80,\"longitude\":160}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":0}" )).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/events/nearby").param("latitude","0").contentType("application/json").content("{\"latitude\":0,\"longitude\":0}" )).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":0,\"longitude\":0,\"radiusKm\":500}" )).andExpect(status().isBadRequest());
        for(String id:ids)mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","2").header("Authorization","Bearer "+admin)).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":0,\"longitude\":0}" )).andExpect(jsonPath("$.total").value(0));
    }
    @Test void editsWithdrawPublishedSnapshotAndRefreshRequiresLocationReconfirmation()throws Exception {
        var body=input("Reconfirmation "+UUID.randomUUID());String id=published(body);
        GeoNamesFixture.write(directory,48.4);importer.importDirectory(directory,1,1);
        mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isNotFound());
        body.put("expectedVersion",2);body.put("title","Reconfirmed "+UUID.randomUUID());
        mvc.perform(put("/api/v1/admin/events/"+id).header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
        mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isNotFound());publish(id,3);
        mvc.perform(get("/api/v1/events/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value(body.get("title")));
        mvc.perform(put("/api/v1/admin/events/"+id).header("Authorization","Bearer "+admin).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isConflict());
    }
    @Test void concurrentDeletionHasOneWinnerAndOneAuditAction()throws Exception {
        String id=published(input("Concurrent deletion")),other=user(true);
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var first=pool.submit(()->mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","2").header("Authorization","Bearer "+admin)).andReturn().getResponse().getStatus());
            var second=pool.submit(()->mvc.perform(delete("/api/v1/admin/events/"+id).param("expectedVersion","2").header("Authorization","Bearer "+other)).andReturn().getResponse().getStatus());
            assertThat(List.of(first.get(10,java.util.concurrent.TimeUnit.SECONDS),second.get(10,java.util.concurrent.TimeUnit.SECONDS))).containsExactlyInAnyOrder(204,409);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM events_audit WHERE event_id=? AND action='EVENT_DELETED'",Long.class,UUID.fromString(id))).isEqualTo(1);
    }
    @Test void startedEventsLeaveUpcomingAndNearbyButExplicitPastSearchStillWorks()throws Exception {
        var body=input("Just started "+UUID.randomUUID());body.put("startsAt",java.time.Instant.now().plusSeconds(5).toString());
        String id=published(body);
        Thread.sleep(5200);
        mvc.perform(get("/api/v1/events").param("q",body.get("title").toString())).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/events").param("q",body.get("title").toString()).param("dateScope","ANY"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/events").param("q",body.get("title").toString()).param("from",java.time.Instant.now().minusSeconds(86400).toString())).andExpect(jsonPath("$.total").value(1));
        mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":48.2082,\"longitude\":16.3738}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items[*].id").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(id))));
    }
    @Test void badImagesAndUnpublishedMediaCannotEscapeAdminPermissions()throws Exception {
        mvc.perform(multipart("/api/v1/admin/events/media").file(new MockMultipartFile("file","bad.svg","image/svg+xml","<svg/>".getBytes())).param("altText","Bad")
            .header("Authorization","Bearer "+admin)).andExpect(status().isBadRequest());
        String id=cover();mvc.perform(get("/api/v1/admin/events/media/"+id).header("Authorization","Bearer "+user(false))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/events/media/"+id).header("Authorization","Bearer "+admin)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/events/media/"+id)).andExpect(status().isNotFound());
    }
}
