package com.soberity.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Marks an account whose application data was deleted. It blocks re-creating the profile while the Firebase account
 * still exists, so a partially failed deletion cannot silently bring the data back.
 */
@Entity
@Table(name = "deleted_account")
public class DeletedAccount {

    @Id
    @Column(name = "firebase_uid", nullable = false, length = 128, updatable = false)
    private String firebaseUid;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    protected DeletedAccount() {
    }

    public DeletedAccount(String firebaseUid, Instant requestedAt) {
        this.firebaseUid = firebaseUid;
        this.requestedAt = requestedAt;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }
}
