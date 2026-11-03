# Soberity

Wspólny klient web/iOS/Android (Expo, React Native, TypeScript), backend Java 21
Spring Boot jako modularny monolit, PostgreSQL/Flyway i Firebase Authentication.
Science oraz Community/Events są równorzędnymi filarami produktu. Stan prac i
odbiorów opisuje [PHASES.md](PHASES.md), historię zmian [CHANGELOG.md](CHANGELOG.md).

## Pierwsze uruchomienie

Wymagane: Node **24.14.0+ na linii 24 LTS**, pnpm **10.4.1**, JDK **21**,
Docker z Compose v2 oraz Git. Maven Wrapper pobiera Maven 3.9.16 i weryfikuje
checksum. W Windows używaj WSL. Build iOS wymaga macOS/Xcode/CocoaPods; Android
wymaga SDK/Build Tools i NDK zgodnych z Expo oraz działającego AVD.

```sh
pnpm bootstrap
cp infra/compose/.env.example infra/compose/.env
```

Bootstrap instaluje frozen lockfile, uruchamia Maven verify (w tym Testcontainers,
więc Docker musi działać) i tworzy brakujące `apps/consumer/.env` oraz
`backend/.env` z szablonów. Nie nadpisuje istniejących plików i nie uruchamia
usług. Ustaw lokalne hasło w `infra/compose/.env`, następnie:

```sh
docker compose -f infra/compose/compose.yml up -d --build
docker compose -f infra/compose/compose.yml port backend 8080
pnpm --filter @soberity/consumer web
```

Backend dostaje **losowy port hosta na 127.0.0.1**. Wpisz odczytany port do
`EXPO_PUBLIC_API_URL` w `apps/consumer/.env`. Ustaw publiczną konfigurację
Firebase oraz opcjonalny Auth emulator zgodnie z
[infra/firebase/README.md](infra/firebase/README.md). Projekt emulatora to
`demo-soberity`; backend i klient muszą wskazywać to samo środowisko.
Backendu nie uruchamia sam klient. Spring nie ładuje `backend/.env` automatycznie.

## Komendy i weryfikacja

| Komenda z katalogu głównego                                               | Znaczenie                                                               |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                          | instalacja bez aktualizacji lockfile                                    |
| `pnpm check`                                                              | ESLint, TypeScript, Prettier i kontrola ignorowania sekretów            |
| `pnpm test:infra`                                                         | testy pozytywnych i negatywnych przypadków smoke stagingu               |
| `pnpm --filter @soberity/consumer exec jest --runInBand --watchman=false` | testy klienta                                                           |
| `pnpm --filter @soberity/consumer test:web`                               | emulator Auth + Playwright desktop/mobile-web; API profilu to fixture   |
| `pnpm build`                                                              | eksport web i kompilacja pakietów workspace                             |
| `pnpm --filter @soberity/consumer export:native`                          | bundle JS/assets iOS/Android; nie tworzy IPA/APK                        |
| `cd backend && ./mvnw --batch-mode verify`                                | kompilacja, unit/integration/security/ACL, Flyway i JAR; wymaga Dockera |
| `gitleaks git . --redact --no-banner --log-opts="--all"`                  | skan pełnej historii Git (Gitleaks 8.30.1)                              |
| `pnpm check:staging https://STAGING_HOST`                                 | odczytowy smoke transportu, probes i autoryzacji stagingu               |

Przed Playwright pobierz przeglądarkę:
`pnpm --filter @soberity/consumer exec playwright install chromium --only-shell`.
Testowy Metro używa portu 8091, Auth 9099 i demonstracyjnej konfiguracji;
nie potrzebuje prawdziwych kluczy Firebase. Wynik web mobile viewport nie jest
wynikiem testu aplikacji natywnej.

CI w [.github/workflows/ci.yml](.github/workflows/ci.yml) uruchamia frozen install,
check, testy klienta, eksporty web/native, E2E, Maven/Testcontainers i Gitleaks.
Akcje przypięto do commitów; uprawnienia to `contents: read`, bez sekretów
wdrożeniowych i bez automatycznego deploymentu. Po pushu sprawdź rzeczywisty
wynik wszystkich trzech jobów. Lokalne testy nie dowodzą zielonego GitHub CI.

## Sieć emulatorów i urządzeń

| Klient           | API/Auth uruchomione na Macu/PC                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| Web              | `http://127.0.0.1:PORT`; backend dopuszcza dokładny origin Metro przez CORS     |
| iOS Simulator    | `http://127.0.0.1:PORT`                                                         |
| Android Emulator | `http://10.0.2.2:PORT` albo `adb reverse tcp:PORT tcp:PORT` i `127.0.0.1`       |
| Fizyczny telefon | osiągalny adres LAN lub staging HTTPS; loopback telefonu nie wskazuje komputera |
| Staging preview  | rzeczywisty HTTPS origin stagingu, bez emulatora Auth                           |

Przy Android `adb reverse` przekieruj **każdy** potrzebny port: Metro, backend
oraz Auth 9099. Port API jest niezależny od Metro 8081/8091. Lokalny Compose
wiąże API/DB do loopback; dostęp fizycznego telefonu wymaga świadomej konfiguracji
nasłuchu/firewalla albo tunelu do środowiska developerskiego. Nie wystawiaj bazy.
Jeśli zmieniasz port/origin web, dodaj go do `SOBERITY_CORS_ALLOWED_ORIGINS`.
Po zmianie `EXPO_PUBLIC_*` zrestartuj Metro lub zbuduj nowy eksport.

## Sekrety i środowiska

`EXPO_PUBLIC_*` jest widoczne w bundle — wyłącznie publiczne wartości klienta.
Nigdy nie umieszczaj tam haseł, tokenów, ADC/service accounts ani kluczy
podpisywania. ADC backendu pochodzi spoza repo. Dev, staging i produkcja mają
osobne projekty Firebase i bazy. `.env.example` jest publicznym szablonem.

`.gitignore` wyklucza env, klucze, backupy oraz lokalny stan narzędzi.
`pnpm check:secrets` sprawdza reguły ignorowania na syntetycznych ścieżkach;
**Gitleaks** skanuje zawartość historii. Ignorowanie nie usuwa sekretu już
śledzonego przez Git. Jeśli taki wyciek wykryto, wycofaj/rotuj poświadczenie
przed osobno uzgodnionym czyszczeniem historii. Nie drukuj tokenów w logach.

## EAS i staging

Profile `development`, `development-simulator`, `preview`, `preview-simulator`
są w [apps/consumer/eas.json](apps/consumer/eas.json). Polecenia EAS wykonuj w
`apps/consumer`. Projekt EAS i zdalne buildy wymagają konfiguracji konta;
[README klienta](apps/consumer/README.md) podaje kroki. Nie skonfigurowano
publikacji sklepowej ani automatycznych buildów chmurowych.

[infra/staging/README.md](infra/staging/README.md) opisuje konfigurację HTTPS,
artefakty, Firebase, kontrolę po wdrożeniu, monitoring, codzienny backup,
zaszyfrowany offsite, izolowany restore drill i rollback. Host i domena nie
istniały przy przygotowaniu konfiguracji; staging i odbiór Phase 0 wymagają
oddzielnego faktycznego uruchomienia. Lokalne raporty są w ignorowanym `docs/testing/`.

## Troubleshooting

- **Docker read-only / ENOSPC:** sprawdź wolne miejsce i diagnostykę Docker
  Desktop. Nie resetuj danych ani nie uruchamiaj `down -v` jako naprawy.
- **Brak konfiguracji Auth:** wypełnij publiczne wartości Firebase; nie zastępuj
  ich kluczem serwisowym. Sprawdź zgodność project ID i URL emulatora.
- **Offline po logowaniu:** sprawdź API URL, osiągalność portu, CORS, health
  readiness, a na Androidzie adres `10.0.2.2`/port forwarding. Obejrzyj ECS
  logi backendu przez correlation ID, bez logowania tokena.
- **Link resetu/weryfikacji:** skonfiguruj odpowiedni action URL szablonu
  Firebase, authorized domains i osobny continue URL. Nie zapisuj kodów w logach.
- **iOS dialog Open / błąd osascript 1002:** zaakceptuj dialog ręcznie;
  automatyzacja wymaga uprawnienia Accessibility aplikacji hosta w macOS.
- **NDK / brak SDK:** obraz AVD nie zastępuje platformy SDK/Build Tools/NDK
  potrzebnych do kompilacji. Zainstaluj je przez Android SDK Manager i sprawdź dysk.
- **Frozen lockfile:** po świadomej zmianie zależności przejrzyj manifest i
  lockfile razem; nie kasuj lockfile, aby ominąć błąd CI.
- **Java/Maven:** sprawdź `JAVA_HOME`, `java -version`, sieć i cache wrappera;
  nie wyłączaj kontroli checksum ani reguł toolchain.

## Struktura

```text
apps/consumer/          klient Expo, Firebase adapter, konto i testy
packages/design-tokens/ wspólne tokeny i motywy
packages/api-client/    miejsce na generowany klient OpenAPI
packages/shared-utils/ wspólne narzędzia
backend/               Spring Boot: identity, profile, common, Flyway
infra/compose/         lokalna baza/backend/emulator Auth
infra/staging/         konfiguracja HTTPS, backup/restore i monitoring
scripts/               bootstrap, kontrola ignore i staging smoke
.github/workflows/     CI i ręczny staging smoke
docs/                  lokalne ADR/raporty, celowo poza Git
```
