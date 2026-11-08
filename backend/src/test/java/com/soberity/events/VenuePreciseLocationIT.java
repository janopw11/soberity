package com.soberity.events;

import static org.assertj.core.api.Assertions.*;
import com.soberity.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

class VenuePreciseLocationIT extends AbstractIntegrationTest {
    @Autowired JdbcTemplate jdbc;

    @Test void legacyVenuesKeepNullPrecisionAndNoNewFields() {
        UUID organizer=organizer();
        UUID venue=UUID.randomUUID();
        jdbc.update("INSERT INTO events_venue(id,organizer_id,name,address,city,region,country_code) VALUES (?,?,'Legacy','Unknown','Springfield','Unknown','US')",venue,organizer);
        assertThat(jdbc.queryForMap("SELECT location_precision,street,formatted_address,provider_place_id FROM events_venue WHERE id=?",venue))
            .containsEntry("location_precision",null).containsEntry("street",null).containsEntry("formatted_address",null).containsEntry("provider_place_id",null);
    }

    @Test void markerPrecisionRequiresCoordinates() {
        UUID organizer=organizer();
        assertThatThrownBy(() -> insert(organizer,"ADDRESS",null,null)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert(organizer,"VENUE",null,null)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatCode(() -> insert(organizer,"ADDRESS",52.2297,21.0122)).doesNotThrowAnyException();
        assertThatCode(() -> insert(organizer,"CITY",null,null)).doesNotThrowAnyException();
    }

    @Test void rejectsUnknownPrecision() {
        UUID organizer=organizer();
        assertThatThrownBy(() -> insert(organizer,"ROOFTOP",52.2297,21.0122)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void rejectsCoordinatesOutOfRangeThroughExistingCheck() {
        UUID organizer=organizer();
        assertThatThrownBy(() -> insert(organizer,"ADDRESS",91.0,21.0122)).isInstanceOf(DataIntegrityViolationException.class);
    }

    private UUID organizer() {
        UUID id=UUID.randomUUID();
        jdbc.update("INSERT INTO events_organizer(id,name,description,website,contact_actor_ref,created_by_ref) VALUES (?,'Precise host','Test','https://example.test',repeat('a',64),repeat('a',64))",id);
        return id;
    }

    private void insert(UUID organizer,String precision,Double latitude,Double longitude) {
        jdbc.update("""
            INSERT INTO events_venue(id,organizer_id,name,address,city,region,country_code,latitude,longitude,location_precision)
            VALUES (?,?,'Venue','Address','Warsaw','Mazovia','PL',?,?,?)
            """,UUID.randomUUID(),organizer,latitude,longitude,precision);
    }
}
