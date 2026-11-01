package com.soberity.profile.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.soberity.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class UserProfileRepositoryIT extends AbstractIntegrationTest {

    @Autowired
    private UserProfileRepository repository;

    @Test
    void persistsProfileAndSetsAuditTimestamps() {
        String uid = "uid-" + UUID.randomUUID();
        UserProfile saved = repository.saveAndFlush(new UserProfile(uid, "pl"));

        UserProfile loaded = repository.findByFirebaseUid(uid).orElseThrow();
        assertThat(loaded.getId()).isEqualTo(saved.getId());
        assertThat(loaded.getLocale()).isEqualTo("pl");
        assertThat(loaded.getCreatedAt()).isNotNull();
        assertThat(loaded.getUpdatedAt()).isNotNull();
    }

    @Test
    void rejectsDuplicateFirebaseUid() {
        String uid = "uid-" + UUID.randomUUID();
        repository.saveAndFlush(new UserProfile(uid, null));

        assertThatThrownBy(() -> repository.saveAndFlush(new UserProfile(uid, "en")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsUnsupportedLocale() {
        assertThatThrownBy(() -> repository.saveAndFlush(new UserProfile("uid-" + UUID.randomUUID(), "de")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsBlankFirebaseUid() {
        assertThatThrownBy(() -> repository.saveAndFlush(new UserProfile("   ", null)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
