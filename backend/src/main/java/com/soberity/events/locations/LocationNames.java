package com.soberity.events.locations;

import java.text.Normalizer;
import java.util.Locale;

/** Search normalization only; original display strings and source identity are retained. */
public final class LocationNames {
    private LocationNames() { }
    public static String key(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFKD).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT).replace('ł','l').replace('ø','o').replace("æ","ae")
                .replace("œ","oe").replace("ß","ss").strip();
    }
    public static String like(String value) {
        return "%" + key(value).replace("!","!!").replace("%","!%").replace("_","!_") + "%";
    }
}
