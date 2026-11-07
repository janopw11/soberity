# Uruchamianie Soberity lokalnie

Wszystkie komendy wykonuj z katalogu głównego repozytorium. Backend uruchom
przed klientem; każdy serwer pozostaw w osobnym terminalu.

## Przygotowanie — pierwszy raz

Wymagane: Node **24.14.0+ z linii 24**, pnpm **10.4.1**, Java **21** oraz
uruchomiony Docker Desktop z Compose v2.

```sh
pnpm install --frozen-lockfile

# Utwórz brakujące pliki; -n zachowuje istniejącą konfigurację.
cp -n apps/consumer/.env.example apps/consumer/.env
cp -n backend/.env.example backend/.env
cp -n infra/compose/.env.example infra/compose/.env
```

W `infra/compose/.env` ustaw lokalne `SOBERITY_DB_PASSWORD`. Jeśli port 5432
jest zajęty, ustaw wolny `SOBERITY_POSTGRES_PORT`. Dla istniejącej bazy zachowaj
dotychczasowe hasło — zmiana zmiennej nie zmienia hasła w zapisanej bazie.

W `apps/consumer/.env` ustaw `EXPO_PUBLIC_API_URL=http://localhost:8090` oraz
publiczne wartości Firebase dla swojego środowiska. Konfigurację prawdziwego
projektu dev i emulatora opisuje [instrukcja Firebase](infra/firebase/README.md).
Dla prawdziwego Firebase pozostaw `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`
puste; backend potrzebuje poświadczeń ADC poza repozytorium.

## Backend z bazą — Java lokalnie, PostgreSQL w Dockerze

```sh
docker compose -f infra/compose/compose.yml up -d postgres
node scripts/start-local-backend.mjs
```

Helper buduje JAR bez uruchamiania testów i uruchamia backend na porcie
odczytanym z `EXPO_PUBLIC_API_URL` w `apps/consumer/.env` (w przykładzie 8090).
Wymaga adresu `localhost` lub `127.0.0.1`. Odczytuje dane połączenia z lokalnego
kontenera `soberity-postgres-1` oraz projekt Firebase z konfiguracji klienta;
Spring sam nie ładuje `backend/.env`. Flyway stosuje zaległe migracje lokalnej
bazy przy starcie. Helper może zrestartować wcześniej uruchomiony lokalny JAR.

Sprawdzenie w drugim terminalu:

```sh
curl --fail http://localhost:8090/actuator/health/readiness
```

Oczekiwany status: `UP`. Jeśli wybrano inny port API, zmień go też w tej komendzie.
Backend zatrzymasz przez `Ctrl+C`, bazę przez:

```sh
docker compose -f infra/compose/compose.yml stop postgres
```

## iOS — Simulator

Wymagane: macOS, Xcode z zainstalowanym runtime iOS Simulator oraz CocoaPods.
API w `apps/consumer/.env`: `http://localhost:8090` (lub własny port backendu).

```sh
pnpm --filter @soberity/consumer ios
```

Komenda buduje i instaluje development client oraz uruchamia Metro.
Przy kolejnych uruchomieniach, jeśli aplikacja jest już zainstalowana i nie
zmieniono zależności natywnych ani konfiguracji pluginów:

```sh
pnpm --filter @soberity/consumer start
# W terminalu Metro naciśnij i.
```

## Web

```sh
pnpm --filter @soberity/consumer web
```

Domyślny adres: <http://localhost:8081>. API ustaw w `apps/consumer/.env`.
Jeśli Metro wybierze inny port, dodaj jego origin do
`SOBERITY_CORS_ALLOWED_ORIGINS` w `backend/.env` i zrestartuj backend helperem.
Po zmianie `EXPO_PUBLIC_*` zrestartuj Metro.

## Android — Emulator

Wymagane: Android Studio, SDK Platform 37, zgodne Build Tools/NDK, Java 21
oraz `adb` w `PATH`. Uruchom AVD przez Android Studio → Device Manager.

Przekieruj port API, aby zachować ten sam `localhost` w konfiguracji co na
web/iOS. W przykładzie backend działa na 8090, a Metro na 8081:

```sh
adb reverse tcp:8090 tcp:8090
adb reverse tcp:8081 tcp:8081

# Tylko jeśli korzystasz z lokalnego emulatora Firebase Auth:
# adb reverse tcp:9099 tcp:9099

pnpm --filter @soberity/consumer android
```

Komenda buduje i instaluje development client. Przekierowania wykonaj ponownie
po restarcie emulatora i dostosuj do faktycznych portów. Jeśli podłączono kilka
urządzeń, wybierz właściwe przez `adb -s ID_URZĄDZENIA reverse ...`.
Przy kolejnych startach z zainstalowaną aplikacją:

```sh
pnpm --filter @soberity/consumer start
# W terminalu Metro naciśnij a.
```

## Alternatywa — cały backend, baza i testowy Auth w Dockerze

Ten wariant używa projektu emulatora `demo-soberity`. Aby korzystać z kont
prawdziwego projektu Firebase dev, wybierz wariant z lokalnym helperem powyżej.

```sh
docker compose -f infra/compose/compose.yml up -d --build
docker compose -f infra/compose/compose.yml ps
docker compose -f infra/compose/compose.yml port backend 8080
```

Backend otrzymuje **losowy port hosta**, np. wynik `127.0.0.1:49152` oznacza
API `http://localhost:49152`. Uzupełnij `apps/consumer/.env` (wartości `demo`
poniżej służą wyłącznie emulatorowi):

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:49152
EXPO_PUBLIC_FIREBASE_API_KEY=demo-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-soberity.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-soberity
EXPO_PUBLIC_FIREBASE_APP_ID=demo-app-id
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
```

Zastąp `49152` odczytanym portem i uruchom klienta jedną z komend powyżej.
Na Androidzie przekieruj ten port API oraz 8081 i 9099 przez `adb reverse`.
Sprawdzenie i logi:

```sh
curl --fail http://localhost:49152/actuator/health/readiness
docker compose -f infra/compose/compose.yml logs -f backend
```

Jeśli web działa na innym porcie niż 8081, ustaw jego origin w
`SOBERITY_CORS_ALLOWED_ORIGINS` w `infra/compose/.env` i ponownie wykonaj
`docker compose -f infra/compose/compose.yml up -d backend`.

Zatrzymanie stosu z zachowaniem danych PostgreSQL:

```sh
docker compose -f infra/compose/compose.yml down
```

Konta emulatora Auth są tymczasowe; Compose nie konfiguruje ich trwałego zapisu.
