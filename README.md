# Soberity

Aplikacja web/iOS/Android wspierająca życie bez alkoholu. Science oraz
Events/Community są równorzędnymi filarami produktu. Twierdzenia zdrowotne
wymagają weryfikowalnych źródeł; produkt nie zastępuje pomocy medycznej.

## Stan repozytorium

P0-I01: monorepo i lokalne narzędzia. Pakiety TypeScript zawierają jawnie puste
moduły do sprawdzenia kompilatora. Backend ma wyłącznie POM i Maven Wrapper.
Nie ma jeszcze działającej aplikacji, API, bazy danych ani Firebase Auth.
Expo i ekrany powstaną w P0-I02, backend Spring Boot w P0-I04.

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
Docker, Xcode i Android SDK nie są wymagane w P0-I01. Skrypty bootstrapu
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
| `pnpm build`                               | kompilacja szkieletów TS do lokalnych `dist/`, nie build Expo                        |
| `pnpm format:check`                        | kontrola formatowania źródeł, konfiguracji i README                                  |
| `pnpm format`                              | formatowanie tych plików; pomija dokumenty wymagań i wrapper Apache                  |
| `pnpm check:secrets`                       | reguły ignorowania na syntetycznych ścieżkach, bez odczytu sekretów                  |
| `pnpm check`                               | lint + typecheck + format + kontrola ignore                                          |
| `cd backend && ./mvnw --batch-mode verify` | poprawność POM i wymaganych wersji JDK/Maven; jeszcze bez kompilacji Java/testów/JAR |

Brak testów funkcjonalnych produktu w P0-I01. Pozytywny wynik powyższych
komend oznacza sprawne narzędzia, nie działający web/iOS/Android ani API.
Wyniki P0-I01 i ograniczenia są zapisane w PHASES.md.

## Struktura

```text
apps/consumer/          prywatny pakiet przyszłego klienta Expo
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

Pliki `.env.example` są publicznymi szablonami bez poświadczeń; bieżące
szkielety ich nie odczytują. Konfiguracja zostanie podłączona w kolejnych
iteracjach. `EXPO_PUBLIC_*` trafia do aplikacji klienta — nigdy nie umieszczaj
tam klucza serwisowego, hasła ani tokena. Backend otrzyma poświadczenia
Firebase przez ADC/secret manager, poza repozytorium.

`.gitignore` wyklucza lokalne env, typowe service accounts, klucze i pliki
podpisywania; pozostawia szablony, lockfile i wrapper. `pnpm check:secrets`
sprawdza reguły, **nie skanuje zawartości plików**. Git nie przestaje śledzić
już dodanego pliku po dodaniu reguły ignore: przed commitem sprawdź zawartość
zmian. Nigdy nie używaj `git add -f` dla sekretów.

## Kolejne uruchomienia platform

W P0-I02 powstaną rzeczywiste komendy Expo. Docelowo API lokalne będzie
osiągalne przez `localhost:8080` z web/iOS Simulator, `10.0.2.2:8080` z Android
Emulator oraz adres LAN hosta z telefonu. Obecnie nic nie nasłuchuje tam
z ramienia tego projektu. Staging/production będą używać HTTPS.

Audyt P0-I00 wykazał Xcode 26.6 i listę symulatorów iOS 26.5; nie uruchomiono
aplikacji. Android Emulator 36.6.11 zgłaszał błąd procesora `neon`, a SDK
Platforms zawierało tylko 36.1. Przed P0-I02 napraw emulator w Android Studio
→ SDK Manager → SDK Tools, doinstaluj platformę 37 i potwierdź start AVD
`Medium_Phone`. To historyczny wynik audytu, nie test ponowiony w P0-I01.

Jeżeli bootstrap zgłasza błędną Javę, sprawdź `JAVA_HOME` oraz `java -version`.
Jeżeli frozen install odrzuca manifest, nie usuwaj lockfile: po świadomej
zmianie zależności wykonaj `pnpm install` i przejrzyj oba pliki.
Jeżeli wrapper odrzuca checksum, nie wyłączaj weryfikacji; sprawdź pochodzenie
dystrybucji i konfigurację proxy.
