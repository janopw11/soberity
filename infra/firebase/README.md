# Firebase — konfiguracja i start deweloperski (P0-I05)

Soberity używa Firebase Authentication wyłącznie do tożsamości. Profil i dane
aplikacji są w PostgreSQL. Backend weryfikuje Firebase ID tokeny przez Firebase
Admin SDK.

## Start deweloperski bez internetu (emulator)

Emulator Auth działa w Docker Compose i nie wymaga konta Firebase ani wystawiania
usług do internetu. Projekt `demo-soberity` jest projektem emulatora (prefiks
`demo-` oznacza brak połączenia z prawdziwym Firebase).

```bash
cd infra/compose
cp .env.example .env            # ustaw SOBERITY_DB_PASSWORD lokalnie
docker compose up -d --build    # emulator, PostgreSQL i backend
```

Emulator nasłuchuje tylko na `127.0.0.1:9099`. Backend łączy się z nim przez
zmienną `FIREBASE_AUTH_EMULATOR_HOST` ustawianą w `compose.yml`. Konfiguracja
emulatora: [firebase.json](./firebase.json).

## Środowiska Firebase

| Środowisko | ID projektu                                | Źródło                                  | Status                                |
| ---------- | ------------------------------------------ | --------------------------------------- | ------------------------------------- |
| local/dev  | `demo-soberity` (emulator)                 | `application-local.yaml`, `compose.yml` | VERIFIED (emulator)                   |
| dev (real) | `soberity-f9e4b`                           | `SOBERITY_FIREBASE_PROJECT_ID`          | VERIFIED (podpis tokenu, konsola dev) |
| test       | `demo-soberity-test` (Testcontainers mock) | `application-test.yaml`                 | VERIFIED                              |
| staging    | z `SOBERITY_FIREBASE_PROJECT_ID`           | `application-staging.yaml`              | NOT VERIFIED                          |
| production | z `SOBERITY_FIREBASE_PROJECT_ID`           | `application-production.yaml`           | NOT VERIFIED                          |

Staging i produkcja wymagają prawdziwych projektów Firebase oraz poświadczeń
Application Default Credentials (np. workload identity). Nie zapisuj kluczy
serwisowych w repozytorium ani w pliku `.env`.

## Konsola Firebase — projekt dev `soberity-f9e4b`

Wykonane przez właściciela (2026-11-01):

1. Email/Password włączony (tylko pierwszy przełącznik).
2. Szablon „Email address verification” aktywny.
3. Autoryzowane domeny: `localhost`, `soberity-f9e4b.firebaseapp.com`.
4. Action links na domyślnym adresie Firebase (bez własnej domeny).
5. Konto usługowe: odłożone do wdrożenia. Dla dev zamiast niego używany jest ADC przez `gcloud`
   (zainstalowany przez Homebrew, wersja 591.0.0). Logowanie wykonuje właściciel:
   `gcloud auth application-default login`.

Weryfikacja: test REST `signUp` na `soberity-f9e4b` zakończył się sukcesem, a prawdziwy
token został zaakceptowany przez `FirebaseAuth.verifyIdToken` (Google'owe klucze),
zmodyfikowany token został odrzucony. Testowe konto zostało usunięte.

## Do zrobienia (NOT VERIFIED)

- Projekty staging i production (osobno od dev) oraz ich ID.
- Konto usługowe i ścieżka ADC dla staging/production.
- Domeny produkcyjne i własne action URL, gdy będą znane adresy aplikacji.
