package com.soberity.events.application;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** UTC ICS uses the same public projection as details; never includes private evidence/contact. */
@Service
public class EventCalendar {
    private final EventCatalog catalog;
    private static final DateTimeFormatter UTC=DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    public EventCalendar(EventCatalog catalog) {this.catalog=catalog;}
    public byte[] export(UUID id) {
        var event=catalog.detail(id);
        if(!"PUBLISHED".equals(event.get("status")) || !((Timestamp)event.get("ends_at")).toInstant().isAfter(Instant.now()))
            throw new ResponseStatusException(HttpStatus.GONE,"Event is cancelled or has ended.");
        var lines=List.of("BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Soberity//Events//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
            "UID:"+id+"@soberity.events","DTSTAMP:"+UTC.format(Instant.now()),
            "DTSTART:"+UTC.format(((Timestamp)event.get("starts_at")).toInstant()),"DTEND:"+UTC.format(((Timestamp)event.get("ends_at")).toInstant()),
            "SUMMARY:"+escape(event.get("title")),
            "DESCRIPTION:"+escape(event.get("description")+"\n"+event.get("timezone")+"\n"+event.get("alcohol_rules")),
            "LOCATION:"+escape(event.get("venue_name")+", "+event.get("address")+", "+event.get("city")+", "+event.get("country_code")),
            "STATUS:CONFIRMED","END:VEVENT","END:VCALENDAR");
        var output=new StringBuilder();for(String line:lines) output.append(fold(line)).append("\r\n");
        return output.toString().getBytes(StandardCharsets.UTF_8);
    }
    private static String escape(Object input) {
        return Objects.toString(input,"").replace("\\","\\\\").replace("\r\n","\n").replace("\r","\n").replace("\n","\\n").replace(";","\\;").replace(",","\\,").replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]","");
    }
    /** RFC5545 folding by UTF-8 octets, without splitting a Unicode code point. */
    private static String fold(String line) {
        var out=new StringBuilder();int column=0;
        for(int cp:line.codePoints().toArray()) {
            String character=new String(Character.toChars(cp));int bytes=character.getBytes(StandardCharsets.UTF_8).length;
            if(column+bytes>75) {out.append("\r\n ");column=1;}
            out.append(character);column+=bytes;
        }
        return out.toString();
    }
}
