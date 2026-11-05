package com.soberity.events.application;

import com.soberity.events.domain.CuratedEventPolicy;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("soberity.events")
public record EventProperties(@DefaultValue("100") double nearbyRadiusKm) {
    public EventProperties { CuratedEventPolicy.radiusKm(nearbyRadiusKm); }
}
