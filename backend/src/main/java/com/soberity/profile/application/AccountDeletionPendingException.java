package com.soberity.profile.application;

/** Raised when the account was deleted and its Firebase account has not been removed yet. */
public class AccountDeletionPendingException extends RuntimeException {

    public AccountDeletionPendingException() {
        super("Account deletion is in progress.");
    }
}
