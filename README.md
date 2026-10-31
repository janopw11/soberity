# Soberity

Aplikacja web/iOS/Android wspierająca życie bez alkoholu. Science oraz
Events/Community są równorzędnymi filarami produktu. Twierdzenia zdrowotne
wymagają weryfikowalnych źródeł; produkt nie zastępuje pomocy medycznej.

## Stan repozytorium

P0-I02: wspólny klient Expo Router / TypeScript z ekranem powitalnym oraz
jawnymi placeholderami Science, Events/Community i konta. API, dane oraz
Firebase Auth nie są jeszcze podłączone. Pakiety współdzielone pozostają
szkieletami; backend ma POM i Maven Wrapper (Spring Boot w P0-I04).

Wymagania i postęp: [AGENTS.md](AGENTS.md), [PHASES.md](PHASES.md),
[raport produktu](Soberity_raport_produktowo_techniczny.md),
[CHANGELOG.md](CHANGELOG.md). Decyzje D1–D4 zatwierdzono 2026-10-29:
Expo SDK 58 / RN 0.88 / React 19.3, Java 21 / Boot 4.1.2 / JUnit 6 z BOM,
Firebase jako tożsamość i PostgreSQL jako dane aplikacji. Ich wdrażanie jest
podzielone na iteracje w PHASES.md.

Katalog `docs/` pozostaje lokalny i ignorowany przez Git na wyraźne życzenie
właściciela. Zawiera ADR i szczegółowe raporty testów, ale nie będzie obecny
w świeżym klonie. Ten README zawiera samodzielną instrukcję przygotowania repo.

## Wymagania lokalne

- Node **24.14.0** (`.nvmrc`; dozwolona linia 24 od tej wersji).
- pnpm **10.4.1**, przypięty w `packageManager`; nie używaj npm/yarn do instalacji
  zależności projektu. Jeśli brak pnpm: `npm install --global pnpm@10.4.1`.
- JDK **21**; ustaw `JAVA_HOME` na JDK 21 i dodaj jego `bin` do `PATH`.
- Git, curl lub wget, unzip oraz shasum/sha256sum do pobrania i weryfikacji Maven.
- Dostęp sieciowy do npm i Maven Central przy pierwszym bootstrapie.

Systemowy Maven nie jest potrzebny: wrapper pobiera wersję **3.9.16**.
Docker nie jest wymagany do uruchomienia klienta. iOS wymaga macOS/Xcode
i CocoaPods, Android wymaga Android SDK i działającego AVD. Skrypty bootstrapu
są przeznaczone dla macOS/Linux; zweryfikowano macOS. Na Windows użyj WSL
z narzędziami wewnątrz WSL.
`backend/mvnw.cmd` jest dostarczony przez Apache, lecz Windows nie był testowany.

## Przygotowanie świeżego klona

Po sklonowaniu repo przejdź do jego katalogu. Jeżeli używasz nvm, wykonaj
`nvm install` i `nvm use`. Następnie:

```sh
node --version
pnpm --version
java -version
node scripts/bootstrap.mjs
pnpm check
pnpm build
```

Bootstrap sprawdza wersje Node/pnpm/Java, instaluje zależności z
`--frozen-lockfile`, uruchamia `backend/mvnw --batch-mode verify` i kopiuje
publiczne szablony do `apps/consumer/.env` oraz `backend/.env`.
Istniejące pliki `.env` pozostają nienaruszone. Skrypt działa również po
wywołaniu przez ścieżkę z innego katalogu. Nie uruchamia usług ani deployu.

Cache pnpm i Maven znajdują się w standardowych lokalizacjach użytkownika.
Pierwszy przebieg pobiera narzędzia; kolejne mogą używać cache. W środowisku
z sandboxem pobranie zależności i zapis cache mogą wymagać dostępu poza nim.
Brak sieci lub niewłaściwa wersja narzędzia kończy bootstrap błędem.

## Komendy i znaczenie wyników

| Komenda (root repo)                        | Co sprawdza / tworzy                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`           | instalacja dokładnego zestawu z lockfile; brak jego aktualizacji                     |
| `pnpm lint`                                | ESLint dla skryptów i źródeł TS                                                      |
| `pnpm -r lint`                             | lint każdego z czterech pakietów workspace                                           |
| `pnpm typecheck`                           | TypeScript strict we wszystkich pakietach                                            |
| `pnpm build`                               | statyczny eksport Expo web oraz kompilacja pakietów TS                               |
| `pnpm format:check`                        | kontrola formatowania źródeł, konfiguracji i README                                  |
| `pnpm format`                              | formatowanie tych plików; pomija dokumenty wymagań i wrapper Apache                  |
| `pnpm check:secrets`                       | reguły ignorowania na syntetycznych ścieżkach, bez odczytu sekretów                  |
| `pnpm check`                               | lint + typecheck + format + kontrola ignore                                          |
| `cd backend && ./mvnw --batch-mode verify` | poprawność POM i wymaganych wersji JDK/Maven; jeszcze bez kompilacji Java/testów/JAR |

Testy nawigacji web: `pnpm --filter @soberity/consumer test:web`
(po `pnpm --filter @soberity/consumer exec playwright install chromium`).
Instrukcje platform: [apps/consumer/README.md](apps/consumer/README.md).
Wyniki i ograniczenia testów są zapisane w PHASES.md.

## Struktura

```text
apps/consumer/          wspólny klient Expo web/iOS/Android
packages/api-client/   przyszłe kontrakty generowane z OpenAPI
packages/design-tokens/ przyszłe tokeny UI
packages/shared-utils/ przyszłe czyste funkcje współdzielone
backend/               Maven Wrapper i POM, jeden przyszły backend
infra/compose/         miejsce na lokalne usługi z P0-I04
scripts/               bootstrap i kontrola reguł ignore
docs/                  lokalne ADR i raporty; celowo poza Git
```

Pakiety są prywatne. Zależności między workspace dodawaj jako `workspace:*`.
Lockfile i wrapper należą do repo. Nie dodano Kafki, Kubernetes, mikroserwisów
ani usług chmurowych. Konfiguracja Spring/DB/Auth nie jest częścią bootstrapu.

## Środowisko i sekrety

Pliki `.env.example` są publicznymi szablonami bez poświadczeń; Expo ładuje env, ale klient jeszcze nie wykonuje żądań do API.
Konfiguracja API zostanie podłączona w kolejnych iteracjach. `EXPO_PUBLIC_*` trafia do aplikacji klienta — nigdy nie umieszczaj
tam klucza serwisowego, hasła ani tokena. Backend otrzyma poświadczenia
Firebase przez ADC/secret manager, poza repozytorium.

`.gitignore` wyklucza lokalne env, typowe service accounts, klucze i pliki
podpisywania; pozostawia szablony, lockfile i wrapper. `pnpm check:secrets`
sprawdza reguły, **nie skanuje zawartości plików**. Git nie przestaje śledzić
już dodanego pliku po dodaniu reguły ignore: przed commitem sprawdź zawartość
zmian. Nigdy nie używaj `git add -f` dla sekretów.

## Uruchomienie klienta

```sh
pnpm --filter @soberity/consumer web
pnpm --filter @soberity/consumer ios
pnpm --filter @soberity/consumer android
```

Komendy natywne budują lokalny development build. Pierwszy build pobiera
zależności. Alternatywą do podstawowego smoke testu jest Expo Go:
`pnpm --filter @soberity/consumer exec expo start --go`.
Hosty API, ograniczenia Expo Go i konfigurację urządzeń opisuje
[README klienta](apps/consumer/README.md).

Jeżeli bootstrap zgłasza błędną Javę, sprawdź `JAVA_HOME` oraz `java -version`.
Jeżeli frozen install odrzuca manifest, nie usuwaj lockfile: po świadomej
zmianie zależności wykonaj `pnpm install` i przejrzyj oba pliki.
Jeżeli wrapper odrzuca checksum, nie wyłączaj weryfikacji; sprawdź pochodzenie
dystrybucji i konfigurację proxy.
