# Changelog

## 2026-10-29

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
