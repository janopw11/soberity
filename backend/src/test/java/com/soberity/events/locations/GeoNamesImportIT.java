package com.soberity.events.locations;

import static org.assertj.core.api.Assertions.*;
import com.soberity.support.AbstractIntegrationTest;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class GeoNamesImportIT extends AbstractIntegrationTest {
    @Autowired GeoNamesImporter importer;
    @Autowired LocationCatalog catalog;
    @Autowired JdbcTemplate jdbc;
    @TempDir Path directory;

    @Test void importsGlobalShapedRecordsAliasesAndDuplicateNamesWithAttribution()throws Exception {
        GeoNamesFixture.write(directory);var result=importer.importDirectory(directory,1,1);
        assertThat(result.countries()).isEqualTo(7);assertThat(result.cities()).isEqualTo(8);assertThat(result.quarantined()).isEqualTo(3);
        assertThat(catalog.countries("polska","pl",0,20).get("total")).isEqualTo(1L);
        assertThat(catalog.countries("JAPONIA","pl",0,20).get("total")).isEqualTo(1L);
        assertThat(catalog.cities(GeoNamesFixture.country(1),"WIEDEN","en",0,20).get("total")).isEqualTo(1L);
        assertThat(catalog.cities(GeoNamesFixture.country(2),"lodz","pl",0,20).get("total")).isEqualTo(1L);
        assertThat(catalog.cities(GeoNamesFixture.country(2),"stara nazwa","pl",0,20).get("total")).isEqualTo(1L);
        assertThat(catalog.cities(GeoNamesFixture.country(3),"sao paulo","en",0,20).get("total")).isEqualTo(1L);
        var duplicates=jdbc.queryForList("SELECT region,district FROM location_city WHERE name='Springfield' ORDER BY region");
        assertThat(duplicates).extracting(row->row.get("region")).containsExactly("Illinois","Massachusetts");
        assertThat(jdbc.queryForObject("SELECT label_pl FROM location_city WHERE geoname_id=102",String.class)).isEqualTo("Łódź");
        assertThat(catalog.metadata().get("available")).isEqualTo(true);
        assertThat(catalog.metadata().get("licenseUrl")).isEqualTo("https://creativecommons.org/licenses/by/4.0/");
        assertThat(catalog.cities(GeoNamesFixture.country(1),"tracker","en",0,20).get("total")).isEqualTo(0L);
    }
    @Test void refreshPreservesIdsVersionsAndRollsBackFailedSnapshots()throws Exception {
        GeoNamesFixture.write(directory);var first=importer.importDirectory(directory,1,1);
        var old=jdbc.queryForMap("SELECT id,version FROM location_city WHERE geoname_id=101");
        importer.importDirectory(directory,1,1);
        assertThat(jdbc.queryForMap("SELECT id,version FROM location_city WHERE geoname_id=101")).isEqualTo(old);
        GeoNamesFixture.write(directory,48.3);importer.importDirectory(directory,1,1);
        assertThat(jdbc.queryForObject("SELECT id FROM location_city WHERE geoname_id=101",UUID.class)).isEqualTo(old.get("id"));
        assertThat(jdbc.queryForObject("SELECT version FROM location_city WHERE geoname_id=101",Integer.class)).isEqualTo(((Number)old.get("version")).intValue()+1);
        UUID good=jdbc.queryForObject("SELECT id FROM location_snapshot WHERE active",UUID.class);
        assertThatThrownBy(()->importer.importDirectory(directory,200,1_000_000)).isInstanceOf(IllegalArgumentException.class);
        assertThat(jdbc.queryForObject("SELECT id FROM location_snapshot WHERE active",UUID.class)).isEqualTo(good);
        Files.writeString(directory.resolve("alternateNamesV2.zip"),"not a zip");GeoNamesFixture.manifest(directory);
        assertThatThrownBy(()->importer.importDirectory(directory,1,1)).isInstanceOf(java.io.UncheckedIOException.class);
        assertThat(jdbc.queryForObject("SELECT id FROM location_snapshot WHERE active",UUID.class)).isEqualTo(good);
        assertThat(jdbc.queryForObject("SELECT city_count FROM location_snapshot WHERE id=?",Long.class,first.snapshotId())).isEqualTo(8);
    }
    @Test void retiredCityIsNotReusedAndCanReactivateWithSameIdentity()throws Exception {
        GeoNamesFixture.write(directory);importer.importDirectory(directory,1,1);
        UUID id=GeoNamesFixture.city(108);
        GeoNamesFixture.removeCity(directory,108);importer.importDirectory(directory,1,1);
        assertThat(jdbc.queryForObject("SELECT active FROM location_city WHERE id=?",Boolean.class,id)).isFalse();
        assertThatThrownBy(()->catalog.selected(GeoNamesFixture.country(7),id)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(catalog.cities(GeoNamesFixture.country(7),"Springfield","en",0,20).get("total")).isEqualTo(1L);
        GeoNamesFixture.write(directory);importer.importDirectory(directory,1,1);
        assertThat(catalog.selected(GeoNamesFixture.country(7),id).get("id")).isEqualTo(id);
    }
    @Test void corruptProvenanceAndInvalidSelectionCannotMutateActiveData()throws Exception {
        GeoNamesFixture.write(directory);importer.importDirectory(directory,1,1);
        Files.writeString(directory.resolve("countryInfo.txt"),"corrupted");
        assertThatThrownBy(()->importer.importDirectory(directory,1,1)).isInstanceOf(java.io.UncheckedIOException.class);
        assertThatThrownBy(()->catalog.selected(GeoNamesFixture.country(1),GeoNamesFixture.city(102))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var global=catalog.cities(null,"wieden","pl",0,20);
        assertThat(global.get("total")).isEqualTo(1L);
        var globalRows=(List<?>)global.get("items");
        var globalCity=(Map<?,?>)globalRows.getFirst();
        assertThat(globalCity.get("country_id")).isEqualTo(GeoNamesFixture.country(1));
        assertThat(globalCity.get("country_label_en")).isEqualTo("Austria");
        assertThat(globalCity.get("country_label_pl")).isEqualTo("Austria");
        assertThat(catalog.cities(null,"Springfield","en",0,20).get("total")).isEqualTo(2L);
        assertThat(catalog.cities(GeoNamesFixture.country(1),"%_","en",0,20).get("total")).isEqualTo(0L);
    }
}
