package com.soberity.profile.application;

import com.soberity.profile.domain.UserProfile;
import com.soberity.profile.domain.UserProfileRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Profile operations keyed only by the Firebase UID taken from the verified token. Callers never pass another
 * user's identifier, so profile access is limited to the authenticated owner.
 */
@Service
public class ProfileService {

    private final UserProfileRepository repository;

    public ProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns the existing profile. A new profile takes {@code initialLocale} (the guest's explicit choice) only when
     * it is created; an existing account preference always wins.
     */
    public UserProfile provision(String uid, String initialLocale) {
        Optional<UserProfile> existing = repository.findByFirebaseUid(uid);
        if (existing.isPresent()) {
            return existing.get();
        }
        try {
            return repository.saveAndFlush(new UserProfile(uid, initialLocale));
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request created the profile first.
            return repository.findByFirebaseUid(uid).orElseThrow(() -> ex);
        }
    }

    public UserProfile get(String uid) {
        return repository.findByFirebaseUid(uid).orElseThrow(ProfileNotFoundException::new);
    }

    /** Applies only the supplied fields. A {@code null} argument leaves the field unchanged. */
    @Transactional
    public UserProfile update(String uid, ProfileUpdate update) {
        UserProfile profile = get(uid);
        if (update.displayName() != null) {
            profile.setDisplayName(blankToNull(update.displayName()));
        }
        if (update.city() != null) {
            profile.setCity(blankToNull(update.city()));
        }
        if (update.interests() != null) {
            profile.setInterests(update.interests().stream().distinct().toList());
        }
        if (update.locale() != null) {
            profile.setLocale(update.locale());
        }
        return profile;
    }

    private static String blankToNull(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Values supplied by the client; {@code null} means "not changed". */
    public record ProfileUpdate(String displayName, String city, List<String> interests, String locale) {
    }
}
