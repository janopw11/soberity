package com.soberity.events;

import static org.assertj.core.api.Assertions.*;
import com.soberity.support.AbstractIntegrationTest;
import java.util.UUID;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

class EventsMigrationIT extends AbstractIntegrationTest {
    @Autowired DataSource source;
    @Test void upgradesV18WithoutGuessingAmbiguousTextLocationsOrLosingLegacyData()throws Exception {
        String schema="event_upgrade_"+UUID.randomUUID().toString().replace("-","");
        var old=Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).target(MigrationVersion.fromVersion("18")).load();
        old.migrate();
        UUID organizer=UUID.randomUUID(),event=UUID.randomUUID(),venue=UUID.randomUUID();
        try(var connection=source.getConnection()) {
            connection.setSchema(schema);connection.setAutoCommit(false);
            var jdbc=new JdbcTemplate(new SingleConnectionDataSource(connection,true));
            jdbc.update("INSERT INTO events_organizer(id,name,description,website,contact_actor_ref,created_by_ref) VALUES (?,'Legacy host','Preserved source','https://example.test',repeat('a',64),repeat('a',64))",organizer);
            jdbc.update("INSERT INTO events_venue(id,organizer_id,name,address,city,region,country_code) VALUES (?,?,'Legacy venue','Unknown address','Springfield','Unknown','US')",venue,organizer);
            jdbc.update("INSERT INTO sober_event(id,organizer_id) VALUES (?,?)",event,organizer);
            jdbc.update("""
                INSERT INTO events_revision(event_id,organizer_id,revision,author_ref,title,description,locale,track,category_code,
                alcohol_policy,alcohol_rules,beverage_notes,venue_id,starts_at,ends_at,timezone,price_kind,accessibility,entry_rules,source_url,source_reference)
                VALUES (?,?,1,repeat('a',64),'Legacy event','Preserved description','en','SOBER_NIGHTLIFE','SOBER_RAVE',
                'ALCOHOL_FREE','No alcohol','Unknown ABV',?,'2029-11-06T20:00:00Z','2029-11-07T01:00:00Z','America/Chicago','UNKNOWN','UNKNOWN','','https://example.test','Preserved evidence')
                """,event,organizer,venue);
            connection.commit();connection.setAutoCommit(true);connection.setSchema("public");
        }
        Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).load().migrate();
        try(var connection=source.getConnection()) {
            connection.setSchema(schema);var jdbc=new JdbcTemplate(new SingleConnectionDataSource(connection,true));
            assertThat(jdbc.queryForMap("SELECT event_id,city FROM events_legacy_location_resolution WHERE event_id=?",event)).containsEntry("city","Springfield");
            assertThat(jdbc.queryForObject("SELECT description FROM events_revision WHERE event_id=?",String.class,event)).isEqualTo("Preserved description");
            assertThat(jdbc.queryForObject("SELECT curated FROM sober_event WHERE id=?",Boolean.class,event)).isFalse();
            assertThat(jdbc.queryForObject("SELECT city_id FROM events_venue WHERE id=?",UUID.class,venue)).isNull();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM location_city",Long.class)).isZero();
            connection.setSchema("public");
            jdbc.execute("DROP SCHEMA "+schema+" CASCADE");
        }
    }
}
