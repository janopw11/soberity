# Changelog

## 2026-11-02

- P0-I09 (DONE 2026-11-02): profil konta w PostgreSQL powiązany z Firebase UID,
  endpointy `/api/v1/me` z ACL po tokenie, język konta zapisywany w profilu i
  stosowany po logowaniu, oczekujący zapis nieraportowany jako zapisany. Właściciel
  zaakceptował trwałość po ponownym logowaniu oraz zmianę EN↔PL na web i na drugim
  urządzeniu. `./mvnw clean verify` (3 unit + 30 IT), `pnpm check`, Jest 53/53 i
  eksport web PASS. iOS/Android NOT VERIFIED.
- P0-I08 (DONE 2026-11-02): reset hasła na localhost. Właściciel potwierdził
  pełny przepływ przez mail i stronę Firebase, obsługę `oobCode` w
  `/reset-password`, przywrócenie sesji po odświeżeniu, wylogowanie oraz komunikat
  dla wygasłego/zużytego kodu. Wylogowanie czyści stan lokalnie od razu, a
  późne odpowiedzi poprzedniej sesji są ignorowane. Jest 46/46, `pnpm check` i
  eksport web PASS. Hosted domain i deep-linki mobilne NOT VERIFIED.
- P0-I07 (DONE 2026-11-02): weryfikacja e-maila end-to-end na web w projekcie
  dev. Rejestracja wysyła mail z linkiem, ekran oczekiwania obsługuje ponowne
  wysłanie z 60-sekundowym limitem, a po kliknięciu linku właściciel potwierdził
  logowanie i dostęp do strefy zalogowanej. Backend nadal zwraca 403 dla
  niezweryfikowanego konta. Testy: Jest 41/41, `pnpm check`, eksport web,
  `FirebaseAuthIT`. Ręcznie przez właściciela potwierdzono także wygasły link
  i ponowne wysłanie maila. Smoke test iOS/Android pozostaje NOT VERIFIED.
- Rozpoczęto P0-I07 (wcześniejszy etap): rejestracja wysyła wiadomość
  weryfikacyjną Firebase, ekran oczekiwania obsługuje ponowne wysłanie z
  60-sekundowym limitem i odświeżenie sesji, a `/verify-email` stosuje Firebase
  action links oraz komunikuje kody nieważne/wygasłe. Dodano konfigurację
  continue URL, komunikaty en/pl i dokumentację ograniczeń emulatorów.
  Typecheck, lint, 40 testów Jest, eksport web oraz testy backendu przechodzą.
  Dostarczenie wiadomości i deep-linki na realnym projekcie Firebase pozostają
  NOT VERIFIED.
- Naprawiono przepływ po rejestracji: aplikacja przechodzi bezpośrednio do
  ekranu oczekiwania zamiast do niedostępnej trasy action linku. Obsługa linku
  toleruje brak parametru `oobCode`, oferuje powrót do potwierdzenia/logowania,
  a sprawdzenie po weryfikacji wymusza odświeżenie ID tokena.

## 2026-11-01

- P0-I06 (DONE 2026-11-01): logowanie i rejestracja e-mail/hasło przez Firebase
  Auth w aplikacji. Stan sesji pochodzi z backendu (`/api/v1/identity/me`):
  zweryfikowane konto trafia do strefy zalogowanej, niezweryfikowane dostaje
  ekran potwierdzenia e-maila, a brak połączenia pokazuje ekran offline. Smoke
  test web na koncie dev obejmuje logowanie, wylogowanie, błędne hasło i offline;
  wykryty brak trasy indeksowej `/(authenticated)` naprawiono. Testy: lint,
  typecheck, format, 40 testów Jest, eksport web. Test na emulatorze mobilnym
  zaliczony przez właściciela (szczegóły platformy do uzupełnienia).
- Rozpoczęto P0-I05: backend weryfikuje Firebase ID tokeny przez Firebase Admin
  SDK (sprawdzenie issuera, audience, wygaśnięcia i projektu). Endpointy
  `/api/v1/**` wymagają zweryfikowanego e-maila; niezweryfikowane konto
  dostaje 403, a brak lub zły token 401. Dodano emulator Firebase Auth do
  Docker Compose, dzięki czemu start deweloperski działa bez internetu.
- Zweryfikowano lokalnie: `./mvnw verify` (3 testy jednostkowe, 21 testów
  integracyjnych) oraz scenariusz end-to-end na emulatorze (rejestracja,
  weryfikacja e-maila, logowanie, odrzucone tokeny). Nie zweryfikowano podpisu
  względem kluczy Google, konsoli Firebase ani ścieżki produkcyjnej (uzupełnione
  przez testy na realnym projekcie dev poniżej).
- Sprawdzono na realnym projekcie dev: filtr Spring z tokenami konta testowego
  (bez tokena 401, niezweryfikowany e-mail 403, zmodyfikowany token 401,
  po weryfikacji 200). Konto testowe usunięto. Staging i produkcja (T01)
  odłożone przez właściciela.
- Zamknięto P0-I05 (DONE 2026-11-01) decyzją właściciela. T01 (konfiguracja
  staging/prod) pozostaje niezaznaczone i wymaga ID projektów.

- Ukończono P0-I04: backend Spring Boot 4.1.2 na Java 21 z modułami
  `common`, `identity` i `profile`, migracją Flyway tabeli profilu
  (`firebase_uid` unikalny, nullable `locale` en/pl), PostgreSQL 17 w Docker
  Compose oraz OpenAPI. Dodano Problem Details, correlation ID, profile
  local/test/staging/production i CORS. Obraz Docker jest bezstanowy i nie
  zawiera sekretów.
- Zweryfikowano: `./mvnw verify` (3 testy jednostkowe, 15 testów integracyjnych
  z Testcontainers), stos compose z healthcheckiem, probes, 401 w formacie
  problem+json, OpenAPI, dwie repliki backendu oraz graceful shutdown. Nie
  uruchomiono aplikacji mobilnej ani natywnych testów; P0-I03A V02/V03 pozostają
  otwarte.

- Przeprowadzono audyt początkowego repozytorium i narzędzi dla P0-I00.
  Udokumentowano zgodność wersji na podstawie oficjalnych źródeł, plan
  monorepo, granice modułów, środowiska i macierz przyszłych testów.
- Właściciel zatwierdził D1–D4 i trzy ADR, zamykając P0-I00. Raport audytu
  zachowuje ograniczenia środowiska Android. Katalog `docs/` pozostaje lokalny
  i ignorowany przez Git zgodnie z decyzją właściciela.
- Przygotowano P0-I01: prywatny workspace pnpm z lockfile, szkielety
  TypeScript, ESLint/Prettier, Maven Wrapper 3.9.16 z kontrolą SHA-256,
  wymagania JDK 21, szablony env i bootstrap zachowujący istniejącą konfigurację.
  Instalację, lint/typecheck, build szkieletów i walidację Maven sprawdzono
  również w czystej kopii bez lokalnych plików. Kontrola ignore chroni typowe
  ścieżki sekretów. Nie wdrożono jeszcze aplikacji Expo ani serwera Spring Boot.

- W P0-I02 uruchomiono wspólnego klienta Expo Router/TypeScript na web,
  iOS i Androidzie: ekran powitalny, jawne placeholdery Science,
  Events/Community i konta oraz obsługę nieznanej trasy. Dodano instrukcje
  hostów API i Expo Go/development build oraz testy nawigacji web (4/4 PASS).
  Zweryfikowano eksport web i bundle natywne, build development iOS oraz
  nawigację iOS (ręcznie przez właściciela) i Android Expo Go (ADB/UIAutomator).
  Własny APK Android pozostaje NOT VERIFIED — brakuje platformy SDK 37.

## 2026-10-31

- W P0-I03 dodano podstawowy design system (`packages/design-tokens`: paleta
  fioletowo-jasna, typografia, spacing, promienie wg `docs/BRANDING.md`) i
  komponenty `Screen`/`Button`/`TextField`/`Alert`/`LoadingState`/`EmptyState`
  z a11y (role, focus ring, min. 48pt) w `apps/consumer/src/ui`.
- Wprowadzono routing na kontraktach `public` / `verification-pending` /
  `authenticated` przez Expo Router `Stack.Protected` oraz stub
  `AuthStatusContext` (zawsze `guest` do czasu Firebase z P0-I05/P0-I06);
  `/account` i nowy ekran `/verification-pending` są teraz chronione i dla
  gościa przekierowują na stronę główną bez ujawniania treści.
- Dodano i18n en/pl (i18next + react-i18next + expo-localization, domyślny
  en, słownik błędów) — wszystkie teksty UI przeniesiono z hardcode do
  zasobów tłumaczeń; zweryfikowano automatyczne wykrycie języka urządzenia
  na iOS Simulator i Android Emulator.
- Dodano testy jednostkowe (`jest-expo` + Testing Library, 6 plików/15
  testów PASS) dla komponentów UI i kontekstu auth oraz zaktualizowano
  testy Playwright pod nową strukturę tras (6/6 PASS, w tym nowy test
  guardu tras chronionych). `pnpm run check`, `pnpm run build` i
  `export:native` przechodzą bez błędów na web, iOS i Android.

- Zmieniono nawigację P0-I03 na menu otwierane przyciskiem trzech kresek ☰
  w lewym górnym rogu nagłówka. Panel zamyka się po wyborze dostępnej sekcji,
  przyciskiem ☰, tłem lub Back/Escape. Usunięto kafelki wyboru funkcji.
  Menu uproszczono do ośmiu głównych pozycji: Main page, Science & Discover,
  Sober Events, Sober Games, Soberity (community), World Map, Brain Lab
  i Myth Buster. Bez grup i podsekcji; każda pozycja ma pasujące emoji,
  bez podpisów „Planowane”. Niewdrożone pozycje pozostają nieaktywne.
  Uproszczenie zweryfikowano przez check i Playwright 10/10 PASS. Check, Jest 15/15, bazowe testy web 6/6
  i ponowione testy menu 4/4 oraz eksporty web/iOS/Android PASS.
  Runtime menu iOS/Android pozostaje NOT VERIFIED.

## 2026-11-01

- Zatwierdzono układ UI v4 i dwa motywy Soberity: domyślną jaśniejszą Śliwkę
  oraz jasny fioletowo-biały. Specyfikację i stan dalszych prac zapisano
  w BRANDING/PHASES; zachowano jedną referencję w `design/reference/P0-I03A`
  i usunięto robocze podglądy. Referencję sprawdzono w Chromium (8 wariantów
  EN/PL oraz 20 par kontrastu). Akceptacja projektu nie zamknęła iteracji;
  stan wdrożenia i weryfikacji opisuje kolejny wpis.
- W P0-I03A wdrożono zatwierdzone tokeny obu motywów w kliencie Expo,
  dostępne przełączniki wyglądu i języka EN/PL oraz lokalny zapis preferencji
  dla gościa; dostosowano istniejące ekrany, menu i wspólne komponenty.
  `pnpm run check`, Jest 17/17, testy referencji 8 wariantów, web export i
  build/install iOS Simulator przeszły. Playwright 12/12 przeszedł przed
  ostatnią korektą klawiatury, a ukierunkowany test preferencji desktop/mobile
  web 2/2 po niej. Android build nie został ukończony: pierwszą próbę
  zatrzymano przy 535 MiB wolnego miejsca; po odzyskaniu miejsca instalacja
  NDK 27.1.12297006 pobrała 136 MiB i również została zatrzymana przed
  ukończeniem. Kontrola VoiceOver/TalkBack, dużego fontu i pełne testy
  natywne pozostają NOT VERIFIED. P0-I03A pozostaje IN_PROGRESS.
