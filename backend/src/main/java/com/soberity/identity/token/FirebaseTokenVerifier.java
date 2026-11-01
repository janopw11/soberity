package com.soberity.identity.token;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.soberity.identity.config.FirebaseProperties;
import java.io.IOException;
import org.springframework.stereotype.Component;

/**
 * Verifies ID tokens with the Firebase Admin SDK. The app is created lazily so that the application context starts
 * without Google credentials (tests and emulator runs never touch Google's servers).
 */
@Component
public class FirebaseTokenVerifier implements TokenVerifier {

    private static final String APP_NAME = "soberity-backend";
    private static final String EMULATOR_ENV = "FIREBASE_AUTH_EMULATOR_HOST";

    private final FirebaseProperties properties;
    private volatile FirebaseAuth auth;

    public FirebaseTokenVerifier(FirebaseProperties properties) {
        this.properties = properties;
    }

    @Override
    public VerifiedToken verify(String idToken) throws InvalidTokenException {
        try {
            FirebaseToken token = firebaseAuth().verifyIdToken(idToken);
            return new VerifiedToken(token.getUid(), token.isEmailVerified());
        } catch (FirebaseAuthException ex) {
            throw new InvalidTokenException("Firebase ID token was rejected.", ex);
        }
    }

    private FirebaseAuth firebaseAuth() {
        FirebaseAuth existing = auth;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (auth == null) {
                auth = FirebaseAuth.getInstance(initializeApp());
            }
            return auth;
        }
    }

    private FirebaseApp initializeApp() {
        for (FirebaseApp app : FirebaseApp.getApps()) {
            if (APP_NAME.equals(app.getName())) {
                return app;
            }
        }
        FirebaseOptions.Builder options = FirebaseOptions.builder().setProjectId(properties.projectId());
        if (System.getenv(EMULATOR_ENV) != null) {
            options.setCredentials(emulatorCredentials());
        } else {
            options.setCredentials(applicationDefaultCredentials());
        }
        return FirebaseApp.initializeApp(options.build(), APP_NAME);
    }

    /** The emulator does not check credentials; a placeholder keeps the SDK from looking for ADC. */
    private static GoogleCredentials emulatorCredentials() {
        return GoogleCredentials.create(new AccessToken("emulator-owner", null));
    }

    private static GoogleCredentials applicationDefaultCredentials() {
        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException ex) {
            throw new IllegalStateException("Firebase Application Default Credentials are not available.", ex);
        }
    }
}
