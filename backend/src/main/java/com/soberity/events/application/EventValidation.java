package com.soberity.events.application;

import java.net.URI;
import java.time.DateTimeException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Currency;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static com.soberity.events.application.EventInputs.*;

final class EventValidation {
    private EventValidation() { }
    static String text(String value,int max) {
        if(value==null || value.isBlank() || value.strip().length()>max) throw bad("Missing or oversized field.");
        return value.strip();
    }
    static String optional(String value,int max) { return value==null || value.isBlank()?null:text(value,max); }
    static String url(String value,boolean required) {
        String checked=required?text(value,2048):optional(value,2048);
        if(checked==null) return null;
        try {
            URI uri=URI.create(checked);
            if(!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null)
                throw bad("Absolute HTTPS link without credentials required.");
            return "https"+uri.toASCIIString().substring(uri.getScheme().length());
        } catch(IllegalArgumentException e) { throw bad("Invalid HTTPS link."); }
    }
    static String email(String value) {
        String checked=text(value,254);
        if(!checked.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) throw bad("Contact email required.");
        return checked;
    }
    static String country(String value) {
        String checked=text(value,2).toUpperCase(Locale.ROOT);
        if(!Set.of(Locale.getISOCountries()).contains(checked)) throw bad("ISO country code required.");
        return checked;
    }
    static void coordinates(Double latitude,Double longitude) {
        if(latitude==null && longitude==null) return;
        if(latitude==null || longitude==null || !Double.isFinite(latitude) || !Double.isFinite(longitude)
            || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw bad("Valid latitude and longitude must be supplied together.");
    }
    static String precision(String value,Double latitude,Double longitude) {
        String checked=optional(value,8);
        if(checked==null) return null;
        checked=checked.toUpperCase(Locale.ROOT);
        if(!Set.of("ADDRESS","VENUE","CITY").contains(checked)) throw bad("Unsupported location precision.");
        if(!"CITY".equals(checked) && (latitude==null || longitude==null)) throw bad("Coordinates required for ADDRESS and VENUE precision.");
        return checked;
    }
    static void dates(OffsetDateTime start,OffsetDateTime end,String timezone) {
        if(start==null || end==null || !end.toInstant().isAfter(start.toInstant())) throw bad("Offset-aware start and later end required.");
        ZoneId zone;
        try {
            if(timezone==null || !ZoneId.getAvailableZoneIds().contains(timezone)) throw bad("IANA timezone required.");
            zone=ZoneId.of(timezone);
        } catch(DateTimeException e) { throw bad("Invalid IANA timezone."); }
        // Z denotes an absolute UTC instant; other offsets must agree with event-local rules.
        for(var value:new OffsetDateTime[]{start,end})
            if(!value.getOffset().equals(ZoneOffset.UTC) && !zone.getRules().getOffset(value.toInstant()).equals(value.getOffset()))
                throw bad("Date offset does not match the event timezone (check DST).");
    }
    static void curatedDates(OffsetDateTime start,OffsetDateTime end,String timezone) {
        if(start==null || (end!=null && !end.toInstant().isAfter(start.toInstant()))) throw bad("Offset-aware start and optional later end required.");
        if(timezone==null || !ZoneId.getAvailableZoneIds().contains(timezone)) throw bad("IANA timezone required.");
        var zone=ZoneId.of(timezone);
        for(var value:new OffsetDateTime[]{start,end}) {
            if(value!=null && !value.getOffset().equals(ZoneOffset.UTC) && !zone.getRules().getOffset(value.toInstant()).equals(value.getOffset()))
                throw bad("Date offset does not match event timezone (check DST).");
        }
    }
    static void price(PriceKind kind,Long minor,String currency) {
        if(kind==null) throw bad("Explicit FREE, PAID or UNKNOWN price required.");
        boolean valid=switch(kind) {
            case FREE -> minor!=null && minor==0 && currency==null;
            case UNKNOWN -> minor==null && currency==null;
            case PAID -> minor!=null && minor>0 && currency!=null;
        };
        if(!valid) throw bad("Price amount and currency do not match price kind.");
        if(currency!=null) {
            try { if(!currency.matches("[A-Z]{3}")) throw bad("ISO currency required."); Currency.getInstance(currency); }
            catch(IllegalArgumentException e) { throw bad("ISO currency required."); }
        }
    }
    static void version(Integer expected,Object actual) {
        if(expected==null || expected.intValue()!=((Number)actual).intValue())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Version changed; reload before writing.");
    }
    static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
