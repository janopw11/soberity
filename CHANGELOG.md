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
