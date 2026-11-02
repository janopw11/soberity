package com.soberity.profile.api;

import com.soberity.identity.token.VerifiedToken;
import com.soberity.profile.application.AccountDeletionPendingException;
import com.soberity.profile.application.ProfileNotFoundException;
import com.soberity.profile.application.ProfileService;
import com.soberity.profile.application.ProfileService.ProfileUpdate;
import com.soberity.profile.domain.UserProfile;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The authenticated user's own profile. Only fields listed in the request records are read; anything else in the
 * body (such as a UID or role) is ignored and cannot change ownership.
 */
@RestController
@RequestMapping("/api/v1/me")
public class ProfileController {

    private static final String LOCALE_PATTERN = "en|pl";
    private static final String INTEREST_PATTERN = "science|sport|events|community";

    private final ProfileService profiles;

    public ProfileController(ProfileService profiles) {
        this.profiles = profiles;
    }

    /** Creates the profile on first use or returns the existing one. */
    @PostMapping
    public ProfileResponse provision(@AuthenticationPrincipal VerifiedToken token,
            @Valid @RequestBody(required = false) ProvisionRequest request) {
        String initialLocale = request == null ? null : request.initialLocale();
        return ProfileResponse.from(profiles.provision(token.uid(), initialLocale));
    }

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal VerifiedToken token) {
        return ProfileResponse.from(profiles.get(token.uid()));
    }

    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ProfileResponse update(@AuthenticationPrincipal VerifiedToken token,
            @Valid @RequestBody ProfileUpdateRequest request) {
        ProfileUpdate update = new ProfileUpdate(
                request.displayName(), request.city(), request.interests(), request.locale());
        return ProfileResponse.from(profiles.update(token.uid(), update));
    }

    /** Deletes the application data of the caller. The Firebase account is removed by the client afterwards. */
    @DeleteMapping
    public ResponseEntity<Void> deleteOwnAccount(@AuthenticationPrincipal VerifiedToken token) {
        profiles.deleteOwnAccount(token.uid());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ProfileNotFoundException.class)
    ResponseEntity<ProblemDetail> notFound(ProfileNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Not Found", "Profile not found.");
    }

    @ExceptionHandler(AccountDeletionPendingException.class)
    ResponseEntity<ProblemDetail> deletionPending(AccountDeletionPendingException ex) {
        return problem(HttpStatus.CONFLICT, "Conflict", "Account deletion is in progress.");
    }

    private static ResponseEntity<ProblemDetail> problem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    public record ProvisionRequest(@Pattern(regexp = LOCALE_PATTERN) String initialLocale) {
    }

    public record ProfileUpdateRequest(
            @Size(max = 50) String displayName,
            @Size(max = 100) String city,
            @Size(max = 4) List<@Pattern(regexp = INTEREST_PATTERN) String> interests,
            @Pattern(regexp = LOCALE_PATTERN) String locale) {
    }

    public record ProfileResponse(
            UUID id,
            String displayName,
            String city,
            List<String> interests,
            String locale,
            Instant updatedAt) {

        static ProfileResponse from(UserProfile profile) {
            return new ProfileResponse(profile.getId(), profile.getDisplayName(), profile.getCity(),
                    profile.getInterests(), profile.getLocale(), profile.getUpdatedAt());
        }
    }
}
