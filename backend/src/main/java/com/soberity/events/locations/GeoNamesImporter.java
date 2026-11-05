package com.soberity.events.locations;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import java.sql.Date;
import java.time.*;
import java.util.*;
import java.util.zip.ZipFile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/** Operator-only offline import. Never called by user searches, never fetches arbitrary URLs. */
@Service
public class GeoNamesImporter {
    public static final List<String> FILES=List.of("countryInfo.txt","allCountries.zip","alternateNamesV2.zip","admin1CodesASCII.txt","admin2Codes.txt","timeZones.txt");
    private static final Set<String> ACTIVE_CODES=Set.of("PPL","PPLA","PPLA2","PPLA3","PPLA4","PPLA5","PPLC","PPLCD","PPLF","PPLG","PPLL","PPLR","STLMT");
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    public GeoNamesImporter(JdbcTemplate jdbc,JsonMapper json) {this.jdbc=jdbc;this.json=json;}
    public record Result(UUID snapshotId,long countries,long cities,long quarantined) { }

    @Transactional
    public Result importDirectory(Path directory) throws IOException {
        return importDirectory(directory,200,1_000_000);
    }
    /** Small thresholds are for explicit fixture tests only; the CLI always uses global coverage limits. */
    @Transactional
    public Result importDirectory(Path directory,int minimumCountries,long minimumCities) throws IOException {
        // Roll back checked IO failures too: parse/validate first-stage work is part of the transaction.
        try { return run(directory,minimumCountries,minimumCities); }
        catch(IOException e) {throw new UncheckedIOException("GeoNames input could not be read; snapshot not promoted.",e);}
    }
    private Result run(Path directory,int minimumCountries,long minimumCities) throws IOException {
        jdbc.queryForList("SELECT pg_advisory_xact_lock(hashtextextended('events_locations',0))");
        var manifest=new LinkedHashMap<String,Object>();
        for(String name:FILES) {
            Path path=directory.resolve(name);
            if(!Files.isRegularFile(path) || Files.isSymbolicLink(path)) throw new IOException("Required GeoNames input missing.");
            manifest.put(name,Map.of("sha256",sha256(path),"bytes",Files.size(path),"sourceUrl","https://download.geonames.org/export/dump/"+name,
                    "fileModifiedAt",Files.getLastModifiedTime(path).toInstant().toString()));
        }
        manifest.put("importerVersion",1);manifest.put("validatedAt",Instant.now().toString());
        Path provenance=directory.resolve("download-manifest.json");
        if(!Files.isRegularFile(provenance))throw new IOException("Download manifest required.");
        var download=json.readTree(Files.readString(provenance));
        for(String name:FILES) {
            var recorded=download.get(name);
            if(recorded==null || !recorded.hasNonNull("downloadedAt")
                || !Objects.equals(recorded.path("sha256").asText(),((Map<?,?>)manifest.get(name)).get("sha256"))
                || !Objects.equals(recorded.path("sourceUrl").asText(),"https://download.geonames.org/export/dump/"+name))
                throw new IOException("Download manifest does not match source files.");
            Instant.parse(recorded.path("downloadedAt").asText());
        }
        manifest.put("downloads",download);
        manifest.put("licenseUrl","https://creativecommons.org/licenses/by/4.0/");manifest.put("modifications","Active inhabited places, normalized search, EN/PL labels");
        UUID snapshot=UUID.randomUUID();
        jdbc.update("INSERT INTO location_snapshot(id,manifest,country_count,city_count) VALUES (?,?::jsonb,0,0)",snapshot,json.writeValueAsString(manifest));
        jdbc.execute("CREATE TEMP TABLE geo_country (LIKE location_country INCLUDING DEFAULTS) ON COMMIT DROP");
        jdbc.execute("CREATE TEMP TABLE geo_city (LIKE location_city INCLUDING DEFAULTS) ON COMMIT DROP");
        jdbc.execute("CREATE TEMP TABLE geo_alias(geoname_id bigint,language varchar(2),name text,preferred boolean,historic boolean) ON COMMIT DROP");
        var countries=new HashMap<String,UUID>();var quarantine=new TreeMap<String,Long>();
        lines(directory.resolve("countryInfo.txt"),null,columns->{
            if(columns.length<17 || !columns[0].matches("[A-Z]{2}")) {count(quarantine,"INVALID_COUNTRY");return;}
            try {
                long source=Long.parseLong(columns[16]);if(source<1 || columns[4].isBlank()) throw new IllegalArgumentException();
                UUID id=identity("country",source);countries.put(columns[0],id);
                jdbc.update("INSERT INTO geo_country(id,geoname_id,iso_code,name,label_en,label_pl,search_text,snapshot_id) VALUES (?,?,?,?,?,?,?,?)",
                    id,source,columns[0],columns[4],columns[4],columns[4],LocationNames.key(columns[0]+" "+columns[4]),snapshot);
            } catch(IllegalArgumentException e) {count(quarantine,"INVALID_COUNTRY");}
        });
        var regions=names(directory.resolve("admin1CodesASCII.txt"));var districts=names(directory.resolve("admin2Codes.txt"));
        var zones=new HashSet<String>();
        lines(directory.resolve("timeZones.txt"),null,c->{if(c.length>=2 && ZoneId.getAvailableZoneIds().contains(c[1]))zones.add(c[0]+"."+c[1]);});
        var cityBatch=new ArrayList<Object[]>();
        lines(directory.resolve("allCountries.zip"),"allCountries.txt",c->{
            if(c.length<19) {count(quarantine,"INVALID_FEATURE");return;}
            if(!"P".equals(c[6]))return;
            if(!ACTIVE_CODES.contains(c[7])) {count(quarantine,"EXCLUDED_FEATURE_CODE");return;}
            try {
                long source=Long.parseLong(c[0]);double lat=Double.parseDouble(c[4]),lon=Double.parseDouble(c[5]);UUID country=countries.get(c[8]);
                if(source<1 || c[1].isBlank() || !Double.isFinite(lat) || !Double.isFinite(lon) || lat< -90 || lat>90 || lon< -180 || lon>180)throw new IllegalArgumentException();
                if(country==null) {count(quarantine,"UNKNOWN_COUNTRY");return;}
                if(!zones.contains(c[8]+"."+c[17])) {count(quarantine,"INVALID_TIMEZONE");return;}
                cityBatch.add(new Object[]{identity("city",source),source,country,c[1],c[1],c[1],LocationNames.key(c[1]+" "+c[2]+" "+c[3]),
                    regions.getOrDefault(c[8]+"."+c[10],c[10]),districts.getOrDefault(c[8]+"."+c[10]+"."+c[11],c[11]),lat,lon,c[17],Date.valueOf(c[18]),snapshot});
                if(cityBatch.size()>=1000)flushCities(cityBatch);
            } catch(IllegalArgumentException e) {count(quarantine,"INVALID_CITY");}
        });
        flushCities(cityBatch);
        jdbc.execute("CREATE UNIQUE INDEX ON geo_country(geoname_id)");jdbc.execute("CREATE UNIQUE INDEX ON geo_city(geoname_id)");
        var aliases=new ArrayList<Object[]>();
        lines(directory.resolve("alternateNamesV2.zip"),"alternateNamesV2.txt",c->{
            if(c.length<8 || !Set.of("en","pl").contains(c[2]) || c[3].isBlank())return;
            try {
                aliases.add(new Object[]{Long.parseLong(c[1]),c[2],c[3],"1".equals(c[4]),"1".equals(c[7])});
                if(aliases.size()>=1000)flushAliases(aliases);
            }catch(IllegalArgumentException e){count(quarantine,"INVALID_ALIAS");}
        });
        flushAliases(aliases);jdbc.execute("CREATE INDEX ON geo_alias(geoname_id,language)");
        for(String table:List.of("geo_country","geo_city")) {
            jdbc.execute("UPDATE "+table+" t SET label_en=coalesce((SELECT a.name FROM geo_alias a WHERE a.geoname_id=t.geoname_id AND language='en' AND NOT historic ORDER BY preferred DESC,name COLLATE \"C\" LIMIT 1),t.name), label_pl=coalesce((SELECT a.name FROM geo_alias a WHERE a.geoname_id=t.geoname_id AND language='pl' AND NOT historic ORDER BY preferred DESC,name COLLATE \"C\" LIMIT 1),t.name)");
            // Alias search includes historic names while labels always use current names.
            jdbc.query(connection->{
                var statement=connection.prepareStatement("SELECT t.id,t.search_text,coalesce(string_agg(a.name,' '),'') AS aliases FROM "+table+" t JOIN geo_alias a ON a.geoname_id=t.geoname_id GROUP BY t.id,t.search_text");
                statement.setFetchSize(1000);return statement;
            },(org.springframework.jdbc.core.RowCallbackHandler)rs->{
                jdbc.update("UPDATE "+table+" SET search_text=? WHERE id=?",rs.getString("search_text")+" "+LocationNames.key(rs.getString("aliases")),rs.getObject("id"));
            });
        }
        long countryCount=jdbc.queryForObject("SELECT count(*) FROM geo_country",Long.class),cityCount=jdbc.queryForObject("SELECT count(*) FROM geo_city",Long.class);
        if(countryCount<minimumCountries || cityCount<minimumCities)throw new IllegalArgumentException("GeoNames snapshot fails minimum global coverage; previous data retained.");
        var current=jdbc.queryForList("SELECT country_count,city_count FROM location_snapshot WHERE active");
        if(!current.isEmpty() && (countryCount<((Number)current.getFirst().get("country_count")).longValue()*0.8 || cityCount<((Number)current.getFirst().get("city_count")).longValue()*0.8))
            throw new IllegalArgumentException("GeoNames coverage dropped by over 20%; explicit investigation required.");
        jdbc.execute("UPDATE location_country SET active=false WHERE active AND geoname_id NOT IN (SELECT geoname_id FROM geo_country)");
        jdbc.execute("INSERT INTO location_country SELECT * FROM geo_country ON CONFLICT(geoname_id) DO UPDATE SET iso_code=excluded.iso_code,name=excluded.name,label_en=excluded.label_en,label_pl=excluded.label_pl,search_text=excluded.search_text,active=true,snapshot_id=excluded.snapshot_id");
        jdbc.execute("UPDATE location_city SET active=false,version=version+1 WHERE active AND geoname_id NOT IN (SELECT geoname_id FROM geo_city)");
        jdbc.execute("""
            INSERT INTO location_city SELECT * FROM geo_city ON CONFLICT(geoname_id) DO UPDATE SET
            country_id=excluded.country_id,name=excluded.name,label_en=excluded.label_en,label_pl=excluded.label_pl,search_text=excluded.search_text,
            region=excluded.region,district=excluded.district,latitude=excluded.latitude,longitude=excluded.longitude,timezone=excluded.timezone,
            source_modified=excluded.source_modified,active=true,snapshot_id=excluded.snapshot_id,
            version=location_city.version+CASE WHEN NOT location_city.active OR
              (location_city.country_id,location_city.name,location_city.region,location_city.district,location_city.latitude,location_city.longitude,location_city.timezone)
              IS DISTINCT FROM (excluded.country_id,excluded.name,excluded.region,excluded.district,excluded.latitude,excluded.longitude,excluded.timezone) THEN 1 ELSE 0 END
            """);
        long quarantined=quarantine.values().stream().mapToLong(Long::longValue).sum();
        quarantine.forEach((reason,count)->jdbc.update("INSERT INTO location_quarantine VALUES (?,?,?)",snapshot,reason,count));
        jdbc.update("UPDATE location_snapshot SET active=false WHERE active");
        jdbc.update("UPDATE location_snapshot SET active=true,country_count=?,city_count=?,quarantined_count=? WHERE id=?",countryCount,cityCount,quarantined,snapshot);
        return new Result(snapshot,countryCount,cityCount,quarantined);
    }
    private void flushCities(List<Object[]> batch) {
        if(batch.isEmpty())return;
        jdbc.batchUpdate("INSERT INTO geo_city(id,geoname_id,country_id,name,label_en,label_pl,search_text,region,district,latitude,longitude,timezone,source_modified,snapshot_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",batch);batch.clear();
    }
    private void flushAliases(List<Object[]> batch) {
        if(batch.isEmpty())return;
        jdbc.batchUpdate("INSERT INTO geo_alias VALUES (?,?,?,?,?)",batch);batch.clear();
    }
    private Map<String,String> names(Path path)throws IOException {
        var result=new HashMap<String,String>();lines(path,null,c->{if(c.length>=2)result.put(c[0],c[1]);});return result;
    }
    private interface Row {void accept(String[] columns);}
    private void lines(Path file,String entry,Row row)throws IOException {
        if(entry==null) {try(var reader=Files.newBufferedReader(file,StandardCharsets.UTF_8)){consume(reader,row);}return;}
        try(var zip=new ZipFile(file.toFile(),StandardCharsets.UTF_8)) {
            var item=zip.getEntry(entry);if(item==null || item.getSize()>20_000_000_000L)throw new IOException("Invalid GeoNames archive.");
            try(var reader=new BufferedReader(new InputStreamReader(zip.getInputStream(item),StandardCharsets.UTF_8))){consume(reader,row);}
        }
    }
    private void consume(BufferedReader reader,Row row)throws IOException {
        for(String line;(line=reader.readLine())!=null;)if(!line.isBlank()&&!line.startsWith("#")) {
            if(line.length()>100000)throw new IOException("Oversized GeoNames record.");row.accept(line.split("\t",-1));
        }
    }
    private static void count(Map<String,Long> counts,String reason){counts.merge(reason,1L,Long::sum);}
    public static UUID identity(String kind,long source){return UUID.nameUUIDFromBytes(("geonames:"+kind+":"+source).getBytes(StandardCharsets.UTF_8));}
    private String sha256(Path path)throws IOException {
        try(var in=Files.newInputStream(path)) {
            var digest=MessageDigest.getInstance("SHA-256");byte[] buffer=new byte[65536];for(int n;(n=in.read(buffer))!=-1;)digest.update(buffer,0,n);
            return HexFormat.of().formatHex(digest.digest());
        }catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}
    }
}
