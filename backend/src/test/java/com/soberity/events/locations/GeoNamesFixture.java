package com.soberity.events.locations;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.*;
import tools.jackson.databind.json.JsonMapper;

/** Small synthetic source-shaped records; no claims of actual global dataset ingestion. */
public final class GeoNamesFixture {
    private GeoNamesFixture(){ }
    public static UUID country(long id){return GeoNamesImporter.identity("country",id);}
    public static UUID city(long id){return GeoNamesImporter.identity("city",id);}
    public static void write(Path dir)throws Exception{write(dir,48.2082);}
    public static void write(Path dir,double viennaLatitude)throws Exception {
        Files.createDirectories(dir);
        var countries=new StringBuilder("# synthetic countries\n");
        String[] codes={"AT","PL","BR","KE","JP","AU","US"},names={"Austria","Poland","Brazil","Kenya","Japan","Australia","United States"};
        for(int i=0;i<codes.length;i++) {
            var fields=new String[19];Arrays.fill(fields,"");fields[0]=codes[i];fields[4]=names[i];fields[16]=""+(i+1);
            countries.append(String.join("\t",fields)).append('\n');
        }
        Files.writeString(dir.resolve("countryInfo.txt"),countries);
        var features=new StringBuilder();
        features.append(feature(101,"Wien","Vienna,Wiedeń","AT","9","1",viennaLatitude,16.3738,"Europe/Vienna","PPLC"));
        features.append(feature(102,"Łódź","Lodz","PL","74","1",51.7592,19.455,"Europe/Warsaw","PPL"));
        features.append(feature(103,"São Paulo","Sao Paulo","BR","27","1",-23.5505,-46.6333,"America/Sao_Paulo","PPL"));
        features.append(feature(104,"Nairobi","Nairobi","KE","47","1",-1.2864,36.8172,"Africa/Nairobi","PPLC"));
        features.append(feature(105,"東京","Tokyo","JP","40","1",35.6762,139.6503,"Asia/Tokyo","PPLC"));
        features.append(feature(106,"Sydney","Sydney","AU","02","1",-33.8688,151.2093,"Australia/Sydney","PPL"));
        features.append(feature(107,"Springfield","Springfield","US","IL","1",39.78,-89.65,"America/Chicago","PPL"));
        features.append(feature(108,"Springfield","Springfield","US","MA","1",42.10,-72.58,"America/New_York","PPL"));
        features.append(feature(109,"Abandoned fixture","","AT","9","1",48,16,"Europe/Vienna","PPLQ"));
        features.append(feature(110,"Unknown country fixture","","ZZ","1","1",48,16,"Europe/Vienna","PPL"));
        features.append(feature(111,"Invalid point fixture","","AT","9","1",999,16,"Europe/Vienna","PPL"));
        zip(dir.resolve("allCountries.zip"),"allCountries.txt",features.toString());
        zip(dir.resolve("alternateNamesV2.zip"),"alternateNamesV2.txt","1\t1\ten\tAustria\t1\t\t\t\t\t\n2\t2\tpl\tPolska\t1\t\t\t\t\t\n3\t5\tpl\tJaponia\t1\t\t\t\t\t\n4\t101\ten\tVienna\t1\t\t\t\t\t\n5\t101\tpl\tWiedeń\t1\t\t\t\t\t\n6\t102\ten\tLodz\t1\t\t\t\t\t\n7\t102\tpl\tŁódź\t1\t\t\t\t\t\n8\t102\tpl\tStara nazwa\t1\t\t\t1\t\t\n9\t101\tlink\thttps://tracker.test\t\t\t\t\t\t\n");
        Files.writeString(dir.resolve("admin1CodesASCII.txt"),"AT.9\tVienna region\nPL.74\tŁódzkie\nUS.IL\tIllinois\nUS.MA\tMassachusetts\n");
        Files.writeString(dir.resolve("admin2Codes.txt"),"US.IL.1\tIllinois county\nUS.MA.1\tMassachusetts county\n");
        Files.writeString(dir.resolve("timeZones.txt"),"CountryCode\tTimeZoneId\nAT\tEurope/Vienna\nPL\tEurope/Warsaw\nBR\tAmerica/Sao_Paulo\nKE\tAfrica/Nairobi\nJP\tAsia/Tokyo\nAU\tAustralia/Sydney\nUS\tAmerica/Chicago\nUS\tAmerica/New_York\n");
        manifest(dir);
    }
    public static void removeCity(Path directory,long source)throws Exception {
        String content;
        try(var input=new ZipFile(directory.resolve("allCountries.zip").toFile())) {
            content=new String(input.getInputStream(input.getEntry("allCountries.txt")).readAllBytes(),StandardCharsets.UTF_8);
        }
        zip(directory.resolve("allCountries.zip"),"allCountries.txt",content.lines().filter(line->!line.startsWith(source+"\t")).collect(java.util.stream.Collectors.joining("\n"))+"\n");
        manifest(directory);
    }
    public static void manifest(Path dir)throws Exception {
        var manifest=new TreeMap<String,Object>();
        for(String name:GeoNamesImporter.FILES)manifest.put(name,Map.of("sha256",HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(dir.resolve(name)))),
            "sourceUrl","https://download.geonames.org/export/dump/"+name,"downloadedAt",Instant.now().toString()));
        Files.writeString(dir.resolve("download-manifest.json"),JsonMapper.builder().build().writeValueAsString(manifest));
    }
    private static String feature(long id,String name,String aliases,String country,String region,String district,double lat,double lon,String timezone,String code) {
        String[] c=new String[19];Arrays.fill(c,"");c[0]=""+id;c[1]=name;c[2]=LocationNames.key(name);c[3]=aliases;c[4]=""+lat;c[5]=""+lon;c[6]="P";c[7]=code;c[8]=country;c[10]=region;c[11]=district;c[17]=timezone;c[18]="2026-11-05";return String.join("\t",c)+"\n";
    }
    private static void zip(Path path,String entry,String data)throws Exception {
        try(var out=new ZipOutputStream(Files.newOutputStream(path),StandardCharsets.UTF_8)){out.putNextEntry(new ZipEntry(entry));out.write(data.getBytes(StandardCharsets.UTF_8));out.closeEntry();}
    }
}
