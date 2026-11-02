package com.soberity.profile.application;

import com.soberity.profile.domain.DeletedAccount;
import com.soberity.profile.domain.DeletedAccountRepository;
import com.soberity.profile.domain.UserProfile;
import com.soberity.profile.domain.UserProfileRepository;
import java.time.Instant;
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
    private final DeletedAccountRepository deletedAccounts;

    public ProfileService(UserProfileRepository repository, DeletedAccountRepository deletedAccounts) {
        this.repository = repository;
        this.deletedAccounts = deletedAccounts;
    }

    /**
     * Returns the existing profile. A new profile takes {@code initialLocale} (the guest's explicit choice) and
     * {@code initialDisplayName} (chosen at sign-up) only when it is created; existing values always win.
     */
    public UserProfile provision(String uid, String initialLocale, String initialDisplayName) {
        if (deletedAccounts.existsById(uid)) {
            throw new AccountDeletionPendingException();
        }
        Optional<UserProfile> existing = repository.findByFirebaseUid(uid);
        if (existing.isPresent()) {
            return existing.get();
        }
        try {
            UserProfile profile = new UserProfile(uid, initialLocale);
            if (initialDisplayName != null) {
                profile.setDisplayName(blankToNull(initialDisplayName));
            }
            return repository.saveAndFlush(profile);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request created the profile first.
            return repository.findByFirebaseUid(uid).orElseThrow(() -> ex);
        }
    }

    /**
     * Removes all application data of the account and records the deletion, so the profile cannot be re-created while
     * the Firebase account still exists. Repeating the call is harmless.
     */
    @Transactional
    public void deleteOwnAccount(String uid) {
        repository.findByFirebaseUid(uid).ifPresent(repository::delete);
        if (!deletedAccounts.existsById(uid)) {
            deletedAccounts.save(new DeletedAccount(uid, Instant.now()));
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
