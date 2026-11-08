package com.soberity.events.application;

import static org.assertj.core.api.Assertions.*;
import static com.soberity.events.application.EventValidation.precision;
import org.junit.jupiter.api.Test;

class EventVenuePrecisionTest {
    @Test void acceptsLegacyCoordinatesWithoutPrecisionAsNonMarker() {
        assertThat(precision(null,52.2,21.0)).isNull();
    }

    @Test void allowsMissingPrecisionWithoutCoordinates() {
        assertThat(precision(null,null,null)).isNull();
    }

    @Test void requiresCoordinatesForMarkerPrecision() {
        assertThatThrownBy(() -> precision("address",null,null)).hasMessageContaining("Coordinates required");
        assertThatThrownBy(() -> precision("VENUE",null,null)).hasMessageContaining("Coordinates required");
    }

    @Test void allowsCityPrecisionWithoutCoordinates() {
        assertThat(precision("city",null,null)).isEqualTo("CITY");
    }

    @Test void normalisesKnownPrecisionAndRejectsUnknown() {
        assertThat(precision("address",52.2,21.0)).isEqualTo("ADDRESS");
        assertThatThrownBy(() -> precision("ROOFTOP",52.2,21.0)).hasMessageContaining("Unsupported location precision");
    }
}
