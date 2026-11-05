package com.soberity.events.locations;

import java.nio.file.Path;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

/** Run with Boot PropertiesLauncher, without starting HTTP, schedulers or Firebase. Credentials stay in env. */
public final class GeoNamesImportCli {
    private GeoNamesImportCli(){ }
    public static void main(String[] args) {
        if(args.length==1 && "--help".equals(args[0])) {
            System.out.println("Usage: GeoNamesImportCli <download-directory>; credentials: SOBERITY_DB_URL, SOBERITY_DB_USER, SOBERITY_DB_PASSWORD");
            return;
        }
        if(args.length!=1)throw new IllegalArgumentException("Usage: GeoNamesImportCli <download-directory>");
        var source=new DriverManagerDataSource(required("SOBERITY_DB_URL"),required("SOBERITY_DB_USER"),required("SOBERITY_DB_PASSWORD"));
        var jdbc=new JdbcTemplate(source);
        var transaction=new TransactionTemplate(new DataSourceTransactionManager(source));
        var importer=new GeoNamesImporter(jdbc,JsonMapper.builder().build());
        var result=transaction.execute(status->{
            try{return importer.importDirectory(Path.of(args[0]));}
            catch(java.io.IOException e){throw new java.io.UncheckedIOException("Import failed; active snapshot unchanged.",e);}
        });
        System.out.println("GeoNames snapshot promoted: "+result);
    }
    private static String required(String key) {
        String value=System.getenv(key);
        if(value==null||value.isBlank())throw new IllegalArgumentException("Missing required import environment setting: "+key);
        return value;
    }
}
