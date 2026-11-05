package com.soberity.events;

import static org.assertj.core.api.Assertions.*;
import com.soberity.events.application.EventCatalog;
import com.soberity.events.application.EventProperties;
import com.soberity.events.locations.LocationNames;
import org.junit.jupiter.api.Test;

class EventConfigurationTest {
    @Test void deploymentRadiusCannotSilentlyBecomeUnlimited() {
        assertThat(new EventProperties(100).nearbyRadiusKm()).isEqualTo(100);
        for(double value:new double[]{0,501,Double.NaN,Double.POSITIVE_INFINITY})
            assertThatThrownBy(()->new EventProperties(value)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void searchNormalizationPreservesIdentityOutsideTheSearchKeyAndEscapesWildcards() {
        assertThat(LocationNames.key("ŁÓDŹ São Paulo")).isEqualTo("lodz sao paulo");
        assertThat(LocationNames.like("%_!")).isEqualTo("%!%!_!!%");
    }
    @Test void nearbyInputCannotExposeCoordinatesThroughDefaultRecordLogging() {
        assertThat(new EventCatalog.Nearby(61.12345678,17.98765432,"en",0,20).toString())
                .doesNotContain("61.12345678","17.98765432").contains("redacted");
    }
}
