package com.soberity.profile.application;

/** Raised when the authenticated user has no profile yet. */
public class ProfileNotFoundException extends RuntimeException {

    public ProfileNotFoundException() {
        super("Profile not found.");
    }
}
