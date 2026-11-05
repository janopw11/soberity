package com.soberity.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_profile")
public class UserProfile {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "firebase_uid", nullable = false, length = 128, updatable = false)
    private String firebaseUid;

    @Column(name = "locale", length = 8)
    private String locale;

    @Column(name = "display_name", length = 50)
    private String displayName;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "event_location_consent", nullable = false)
    private boolean eventLocationConsent;

    public boolean isEventLocationConsent() { return eventLocationConsent; }

    public void setEventLocationConsent(boolean consent) { this.eventLocationConsent = consent; }

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "interests", nullable = false)
    private String[] interests = new String[0];

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserProfile() {
    }

    public UserProfile(String firebaseUid, String locale) {
        this.id = UUID.randomUUID();
        this.firebaseUid = firebaseUid;
        this.locale = locale;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public List<String> getInterests() {
        return List.of(interests);
    }

    public void setInterests(List<String> interests) {
        this.interests = interests.toArray(new String[0]);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
