# Soberity — PHASES.md

**Wersja:** 2.0 — 2026-10-29  
**Status globalny:** IN_PROGRESS — P0-I00–P0-I03 DONE; P0-I04 oczekuje osobnego polecenia  
**Źródło wymagań:** [`Soberity_raport_produktowo_techniczny.md`](./Soberity_raport_produktowo_techniczny.md)  
**Zasady Codex:** [`AGENTS.md`](./AGENTS.md)  
**Historia wdrożeń:** [`CHANGELOG.md`](./CHANGELOG.md)

> Ten dokument jest **operacyjnym planem iteracyjnym dla agenta kodującego**. Raport określa **co i dlaczego** budujemy; ten plik — **w jakiej kolejności, na jaki zakres oraz jakimi testami potwierdzić wykonanie**. Wszystkie statusy początkowe są `TODO`, ponieważ przygotowanie planu nie oznacza wykonania prac.
>
> **SCIENCE FIRST, EVIDENCE ALWAYS.** Twierdzenia naukowe, gry, mapy, symulacje i odpowiedzi AI wymagają sprawdzalnych źródeł, właściwych zastrzeżeń i uczciwego komunikowania niepewności.

## 1. Kontrakt pracy agentowej

1. **Jedna iteracja = jedno zlecenie w Codex.** Każda ma ID `P{phase}-I{iteration}`, ograniczony zakres, checklistę i warunek ukończenia. Nie wdrażaj kolejnej iteracji bez polecenia właściciela projektu.
2. **Przed startem:** przeczytaj `AGENTS.md`, odpowiednie sekcje raportu, tę iterację i jej zależności; sprawdź `git status`, kod, aktualne biblioteki oraz istniejące testy. Najpierw krótki plan.
3. **Zakres:** implementuj tylko bieżącą iterację, z małymi koniecznymi poprawkami zależności. Większe odstępstwa, zmiany architektury i nowe funkcje wymagają zgody.
4. **Dowody:** `- [x]` wolno zaznaczyć po wykonaniu i rzeczywistej weryfikacji. Jeśli część pracy nie jest gotowa, pozostaje `- [ ]` z blokadą. Nie stosuj niestandardowego `[~]`, którego renderery Markdown nie rozpoznają.
5. **Status iteracji:** `TODO | IN_PROGRESS | BLOCKED | DONE`. `DONE` wyłącznie jeśli wszystkie obowiązkowe zadania i bramka odbioru są spełnione; wymagany dowód w logu.
6. **Status fazy:** `DONE` dopiero po ukończeniu jej obowiązkowych iteracji i przejściu bramki jakości. Wyjątki tylko za zgodą właściciela i z zapisanym ADR/uzasadnieniem.
7. **Testy:** przy każdej iteracji wykonuj testy odpowiednie do zmian (unit/integration/E2E, lint/typecheck, security, web i dostępne symulatory). Iteracje końcowe służą regresji, a nie pierwszemu uruchomieniu testów.
8. **Środowiska:** nie potwierdzaj testu iOS/Android, jeśli nie było fizycznego urządzenia lub emulatora. Niedostępność macOS/Xcode, Android Emulator, Firebase Console albo kont/sekretów oznacz `BLOCKED / NOT VERIFIED` i podaj czynność manualną.
9. **Dokumentacja po pracy:** aktualizuj checkboxy, `Status`, `Dowód`, `Dziennik sesji` i `Aktualny punkt pracy`. Do `CHANGELOG.md` dopisuj wyłącznie istotne, faktycznie ukończone i datowane zmiany, nie każdy commit. Przy ukończeniu fazy obowiązkowo podsumuj rezultat.
10. **Bezpieczeństwo i zgodność:** nigdy nie commituj haseł, tokenów, service accounts ani danych zdrowotnych; nie wykonuj deploymentu produkcyjnego, płatności, migracji destrukcyjnych ani publikacji sklepów bez zatwierdzenia.
11. **Kolejność zależności:** fazy są roadmapą, nie ścisłym łańcuchem blokującym. Np. Community nie wymaga marketplace; World Map/Brain Lab nie wymagają ukończenia Phase 4–5. Zależności iteracji są ważniejsze niż numer fazy.
12. **Funkcje opcjonalne:** decyzja `NO-GO` po sprawdzeniu opłacalności/jakości danych może zaliczyć iterację badawczą; nie jest to zgoda na publikację niesprawdzonych funkcji. Funkcje opcjonalne nie blokują zakończenia fazy, jeśli jasno odroczone.

### Prompt uniwersalny — kopiuj i zmieniaj jedynie ID

```text
Read AGENTS.md, PHASES.md, CHANGELOG.md and the relevant sections of
Soberity_raport_produktowo_techniczny.md.

Implement exactly: ITERATION_ID = P0-I00

1. Inspect git status and actual code; compare it with the iteration checklist.
2. Briefly report your plan, dependencies, risks and planned verification.
3. Implement ONLY the tasks for ITERATION_ID. Do not start the next iteration.
4. Run the relevant tests/builds and available cross-platform checks.
5. Update ONLY verified checkboxes, iteration status, proof of completion,
   current work pointer and session log in PHASES.md.
6. Update CHANGELOG.md only for significant verified changes, with actual date.
7. At the end report: changed files, tests + results, platform coverage,
   blockers/manual setup, changelog decision and next iteration ID.

If a required account, credential, environment or architectural decision is
missing: stop that part, mark BLOCKED, and explain exactly what I must do.
Never claim an unexecuted test passed. Do not perform production operations.
```

**Przykład:** zmień `ITERATION_ID = P0-I00` na `ITERATION_ID = P0-I01` po zatwierdzeniu zakończenia poprzedniej iteracji.

## 2. Zasady statusów i zapisu wyniku

```text
Iteration: P0-I00
Status: TODO | IN_PROGRESS | BLOCKED | DONE
Started: YYYY-MM-DD lub —
Finished: YYYY-MM-DD lub —
Evidence: ścieżka pliku testowego / komenda + exit code / PR / commit / zapis testów manualnych
Blockers: opis lub —
```

- Ustaw `Started` dopiero przy rozpoczęciu pracy, `Finished` dopiero po pomyślnym odbiorze. Bez automatycznego zgadywania daty.
- Każda iteracja ma identyfikatory zadań `P0-I00-T01` itd.; nie zmieniaj ID przy aktualizacjach. Możesz dopisywać nowe zadania `Txx`, ale nie kasuj historii.
- Nie zmieniaj zweryfikowanych statusów innych iteracji, chyba że rzeczywiście wykryto regresję — wtedy opisz ją w dzienniku.
- Status globalny i licznik wykonania aktualizuj z faktycznej liczby ukończonych iteracji, a nie z samych checkboxów.
- Jeśli user celowo pomija iterację, oznacz `SKIPPED (approved)` w notatkach, ale nie `DONE`; wskaż ryzyko i powiązane zależności.
- Weryfikacja manualna jest wiarygodnym dowodem tylko z zapisanym urządzeniem, datą, środowiskiem i wynikiem.

## 3. Mapa faz i postęp

| Faza | Główny zakres | Iteracje | Ukończone | Status |
|---|---|---:|---:|---|
| Phase 0 | Foundation — Expo, Spring Boot, Firebase Auth i profil | 14 | 4/14 | IN_PROGRESS |
| Phase 1 | Science & Discover MVP | 7 | 0/7 | TODO |
| Phase 2 | Sober Events — katalog, organizerzy, kontakt | 7 | 0/7 | TODO |
| Phase 3 | Retention, gry, personalizacja i powiadomienia | 7 | 0/7 | TODO |
| Phase 4 | Organizer marketplace, bilety, płatności i QR | 9 | 0/9 | TODO |
| Phase 5 | Community — grupy, posty, interakcje i moderacja | 7 | 0/7 | TODO |
| Phase 6 | World Map — dane o spożyciu alkoholu | 8 | 0/8 | TODO |
| Phase 7 | Brain Lab / Body Lab — edukacja interaktywna | 6 | 0/6 | TODO |
| Phase 8 | AI Myth Buster & evidence-grounded search | 6 | 0/6 | TODO |
| Phase 9 | Global launch, City Guides i skalowanie | 7 | 0/7 | TODO |

**Łącznie:** 78 iteracji agentowych; wykonane: **4/78** (2026-10-29: P0-I00 zaakceptowane; P0-I01 i P0-I02 zweryfikowane; 2026-10-31: P0-I03 zweryfikowane).

### Dlaczego kolejność nie zawsze jest liniowa?

- **Phase 0 → Phase 1 i Phase 2**: fundament pozwala budować naukę i katalog eventów równolegle, kiedy kontrakty są zatwierdzone.
- **Phase 3** wykorzystuje Discover i Events. Gra **Guess the Country** realizowana jest dopiero w **P6-I05**, po imporcie danych World Map; gra **Brain Explorer** dopiero w **P7-I04**, po naukowym Brain Lab. Nie implementuj atrap w Phase 3.
- **Phase 4** zależy od prawnego i biznesowego potwierdzenia marketplace; **Phase 5** (community) może rozpocząć się niezależnie od płatności.
- **Phase 6/7/8** opierają się na Evidence Governance z Phase 1, nie muszą czekać na Community ani marketplace.
- **Phase 9** to ekspansja i operacje, nie zastępuje przygotowania i18n, timezone i bezpieczeństwa od Phase 0/2.

### Mapowanie poprzednich bloków P0.x na nowe iteracje

| Poprzedni podział | Nowe iteracje | Znaczenie |
|---|---|---|
| P0.0 | P0-I00–P0-I01 | Decyzje architektoniczne i monorepo |
| P0.1 | P0-I01–P0-I03 | Expo na 3 platformach, UI, routing, i18n |
| P0.2 | P0-I04 | Backend, PostgreSQL, migracje |
| P0.3 | P0-I05–P0-I06 | Konfiguracja Firebase i integracja auth |
| P0.4 | P0-I06–P0-I10 | Rejestracja, logowanie, weryfikacja, reset, settings |
| P0.5 | P0-I09–P0-I10 | Profil i ustawienia konta |
| P0.6 | P0-I11–P0-I12 | Testy automatyczne i manualna macierz platform |
| P0.7 | P0-I13 | CI, EAS, staging, dokumentacja i odbiór |

Nie przenoś starych checkboxów automatycznie: **nowy status wynika wyłącznie z przeglądu istniejącego kodu i dowodów testów**.

---

# Phase 0 — Foundation — Expo, Spring Boot, Firebase Auth i profil

**Status fazy:** IN_PROGRESS  
**Cel:** Architektura i działające konto na web, iOS, Android; priorytet startowy.  
**Zależności:** Phase 0 implementacyjna; niezależna od discovery z raportu.  
**Raport główny:** §3.1, §5–§13, §19  
**Iteracje:** 14

## P0-I00 — Architecture & repository audit

**Status:** DONE  
**Started:** 2026-10-29  
**Finished:** 2026-10-29  
**Zależności iteracji:** brak  
**Dowód:** [Audyt i plan](docs/architecture/P0-I00-audit.md), [wyniki weryfikacji](docs/testing/P0-I00-results.md), [ADR-001](docs/adr/001-universal-client-and-monorepo.md), [ADR-002](docs/adr/002-modular-backend.md), [ADR-003](docs/adr/003-identity-and-environments.md).  
**Blokery:** —. Właściciel zatwierdził D1–D4 2026-10-29 i zlecił P0-I01. ADR mają status ACCEPTED. Ryzyka przyszłego P0-I02 (Android Emulator/platform SDK 37) pozostają odnotowane; nie blokują odbioru audytu.

**Zakres zadań:**

- [x] `P0-I00-T01` Zbadaj kod, git status, AGENTS.md, raport i PHASES.md.
- [x] `P0-I00-T02` Zweryfikuj kompatybilne wersje Expo/React Native/Firebase i Java 21/Spring Boot.
- [x] `P0-I00-T03` Spisz strukturę monorepo, granice modułów, identyfikatory aplikacji i plan środowisk.
- [x] `P0-I00-T04` Dokumentuj kluczowe ustalenia w ADR bez instalowania całego stosu.

**Weryfikacja:**

- [x] `P0-I00-V01` Przedstaw komendy, ryzyka i testy dla każdej platformy.
- [x] `P0-I00-V02` Wylistuj decyzje potrzebujące akceptacji.

Weryfikacja T02 dotyczy oficjalnych macierzy i wymagań wersji, nie instalacji ani buildu. T03/T04 potwierdzają przygotowanie dokumentów; D1–D4 i DoD zatwierdzono 2026-10-29 w rozmowie z właścicielem. Dokumenty docs pozostają lokalne zgodnie z jego decyzją.

**Definition of Done:** Zatwierdzony plan i ADR; brak nieuzgodnionych założeń. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I01 — Monorepo, tools & local bootstrap

**Status:** DONE  
**Started:** 2026-10-29  
**Finished:** 2026-10-29  
**Zależności iteracji:** P0-I00  
**Dowód:** [README](README.md), [bootstrap](scripts/bootstrap.mjs), [kontrola ignore](scripts/check-secret-ignores.mjs), [lokalny raport](docs/testing/P0-I01-results.md). 2026-10-29: `pnpm install`, `pnpm check`, `pnpm build`, `pnpm -r lint`, `./mvnw --batch-mode verify` — exit 0; czysta kopia 40 plików bez docs/node_modules/env przygotowana według README, powtórny bootstrap zachowuje env. Testy negatywne narzędzi, lint/TS, reguł ignore i rozbieżności lockfile zachowują się zgodnie z oczekiwaniami.  
**Blokery:** — dla P0-I01. Web/iOS/Android NOT VERIFIED (brak aplikacji w tej iteracji); historyczne problemy Android są do rozwiązania przed testami P0-I02. `/docs` pozostaje ignorowane na wyraźne polecenie właściciela; README i ten tracker zawierają samodzielny opis bootstrapu i wyników.

**Zakres zadań:**

- [x] `P0-I01-T01` Utwórz apps/consumer, backend, packages, infra, docs.
- [x] `P0-I01-T02` Skonfiguruj pnpm workspace, Maven wrapper, .editorconfig, lint, format, .gitignore, .env.example.
- [x] `P0-I01-T03` Przygotuj skrypty bootstrap i podstawowy README.
- [x] `P0-I01-T04` Nie dodawaj Kafki/Kubernetes/mikroserwisów.

**Weryfikacja:**

- [x] `P0-I01-V01` Sprawdź instalację paczek i komendy lint/build dla wygenerowanych szkieletów.
- [x] `P0-I01-V02` Potwierdź, że git ignoruje sekrety.

Build TS kompiluje jawnie puste moduły narzędziowe. Maven sprawdza POM/JDK/wrapper (packaging=pom), bez testów Java ani JAR. Nie rozpoczęto Expo, Spring Boot, DB, Auth ani dalszych iteracji. `check:secrets` potwierdził 22 syntetyczne ścieżki ignorowane i 8 ścieżek setup widocznych; nie jest skanerem treści.

**Definition of Done:** Świeży klon można przygotować zgodnie z README, bez prywatnych danych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I02 — Expo web/iOS/Android bootstrap

**Status:** DONE

**Started:** 2026-10-29

**Finished:** 2026-10-29

**Zależności iteracji:** P0-I01  

**Dowód:** [klient i instrukcje](apps/consumer/README.md), [testy web](apps/consumer/tests/web/navigation.spec.ts), [lokalny raport](docs/testing/P0-I02-results.md). 2026-10-29: frozen install, pnpm check/build, eksport Hermes iOS/Android — exit 0; Expo Doctor 20/20 i expo install --check PASS; Playwright Chromium desktop + mobile viewport 4/4 PASS (3 trasy, powroty, reload, nieznana trasa, granice kart). iOS: Xcode 26.6, iPhone 17e / iOS 26.5, development build com.soberity.app.dev zbudowany i uruchomiony przez agenta; właściciel ręcznie potwierdził wszystkie 3 trasy i powroty w rozmowie. Android: Emulator 36.6.11, Medium_Phone API 37 arm64, Expo Go SDK 58; ADB/UIAutomator potwierdziły Science, Events, konto i każdy powrót na welcome, zapisano XML i screenshoty. Przejrzano screenshoty web oraz ekrany natywne.

**Blokery:** brak dla zakresu P0-I02. Android development APK NOT VERIFIED — brak platformy SDK 37/pełnego toolchainu; test wykonano w Expo Go, nie własnym binary. Android Studio → SDK Manager: doinstaluj platformę/Build Tools, następnie `pnpm --filter @soberity/consumer android`. Historyczny błąd neon znika poza sandboxem; renderer software/ANR System UI utrudniały pierwszy start AVD, końcowy test z GPU host przeszedł po zamknięciu komunikatu. iOS automatyzacja kliknięć zablokowana przez macOS Accessibility; zastąpiona jawnym testem właściciela. Fizyczne urządzenia, release, API/Firebase i Safari NOT VERIFIED (poza zakresem).

**Zakres zadań:**

- [x] `P0-I02-T01` Skonfiguruj Expo Router i TypeScript dla jednego klienta.
- [x] `P0-I02-T02` Dodaj ekran powitalny i podstawowe routing placeholders jawnie oznaczone jako nieaktywne.
- [x] `P0-I02-T03` Zweryfikuj web, iOS Simulator i Android Emulator tam, gdzie narzędzia są dostępne.
- [x] `P0-I02-T04` Udokumentuj różnice hostów API i Expo Go vs development build.

**Weryfikacja:**

- [x] `P0-I02-V01` Uruchom web.
- [x] `P0-I02-V02` Zweryfikuj start i nawigację na dostępnych symulatorach, nie deklaruj nieuruchomionych.

**Definition of Done:** Jedna baza aplikacji uruchamia się na 3 platformach lub brakujący test ma status BLOCKED. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I03 — Design system, navigation & i18n

**Status:** DONE  
**Started:** 2026-10-31  
**Finished:** 2026-10-31  
**Zależności iteracji:** P0-I02  
**Dowód:** `packages/design-tokens/src/index.ts`; `apps/consumer/src/ui/*`; `apps/consumer/src/auth/AuthStatusContext.tsx`; `apps/consumer/app/_layout.tsx` (`Stack.Protected`); `apps/consumer/src/i18n/*`; `apps/consumer/tests/web/navigation.spec.ts`; `apps/consumer/src/**/*.test.tsx`. Komendy: `pnpm run check` (lint+typecheck+format+secrets) exit 0; `pnpm --filter @soberity/consumer exec jest` 6/6 suites, 15/15 testów PASS; `pnpm --filter @soberity/consumer run test:web` 6/6 PASS (desktop+mobile-web); `pnpm run build` (tsc pakietów + `expo export --platform web`) i `export:native` (iOS+Android) exit 0 bez błędów. Manualna weryfikacja na iOS Simulator (iPhone 17 Pro, Expo Go 58.0.7) i Android Emulator (Medium_Phone, Expo Go 58.0.5): render ekranu powitalnego z automatycznym wykryciem lokalizacji urządzenia (PL/EN), nawigacja Science↔welcome, oraz deep-linki do `/account` i `/verification-pending` potwierdzające przekierowanie gościa na `/` bez ujawnienia prywatnej treści na obu platformach.  
**Blokery:** brak.

**Zakres zadań:**

- [x] `P0-I03-T01` Utwórz tokeny designu, podstawowe Button/Input/Screen/Alert/Loading/Empty.
- [x] `P0-I03-T02` Zaimplementuj routing public/authenticated/verification-pending na kontraktach.
- [x] `P0-I03-T03` Dodaj i18n en/pl, domyślny en i lokalizowane błędy.
- [x] `P0-I03-T04` Dodaj podstawy a11y, ekranowe klawiatury i responsywność.

**Weryfikacja:**

- [x] `P0-I03-V01` Sprawdź routing bez danych prywatnych.
- [x] `P0-I03-V02` Uruchom lint/typecheck oraz podstawowe testy komponentów.

**Definition of Done:** Komponenty i nawigacja są wieloplatformowe, dostępne i gotowe pod Auth. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

**Uwagi i ograniczenia:**
- `AuthStatusContext` to świadomy stub (zawsze `guest`, bez sieci/trwałości) — rzeczywiste logowanie, sesja i Firebase ID token to zakres P0-I05/P0-I06; weryfikacja e-maila to P0-I07. Nie fabrykowano żadnych ekranów spoza tej iteracji.
- Pełne przejście po trasach dotykiem (tap-through) na iOS Simulator nie zostało zautomatyzowane przez agenta (brak narzędzia do syntetycznych gestów dotyku w tym środowisku) — zweryfikowano render i i18n wizualnie oraz guard przez deep-linki `exp://...`; pełna manualna nawigacja dotykiem pozostaje do potwierdzenia przez właściciela, analogicznie do P0-I02.
- `npx expo-doctor` raportuje 1/20 (patch-level rozjazd `expo`/`expo-router`/`expo-dev-client` o jedną wersję) — rozjazd nie dotyczy żadnej zależności dodanej w tej iteracji i powstał wskutek nowych wydań na rejestrze od czasu P0-I02; nie naprawiano w ramach tego zadania (poza zakresem P0-I03).


## P0-I04 — Spring Boot, PostgreSQL & API skeleton

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I04-T01` Skonfiguruj Spring Boot Java 21: Web, Security, Validation, JPA, Flyway, Actuator i OpenAPI.
- [ ] `P0-I04-T02` Dodaj moduły identity/profile/common oraz PostgreSQL w Docker Compose.
- [ ] `P0-I04-T03` Utwórz migrację profilu z firebaseUid i indeksami, bez haseł/tokenów.
- [ ] `P0-I04-T04` Dodaj Problem Details, correlation ID i bezpieczne logowanie.
- [ ] `P0-I04-T05` Dodaj profile local/test/staging i CORS.
- [ ] `P0-I04-T06` Przygotuj Kubernetes-ready architecture
      bez wdrażania Kubernetes:
  - Stateless backend (bez przechowywania sesji lokalnie).
  - Konfiguracja przez environment variables.
  - Sekrety poza kodem źródłowym.
  - Dockerized Spring Boot application.
  - Actuator health, readiness i liveness endpoints.
  - Graceful shutdown.
  - Structured logging.
  - Brak zależności od lokalnego storage kontenera.
  - Możliwość uruchomienia wielu replik backendu.
  - Przygotowanie do zewnętrznego zarządzania migracjami DB.
  - Bez Helm, Kubernetes YAML i klastra K8s.

**Weryfikacja:**

- [ ] `P0-I04-V01` Uruchom compose i healthcheck.
- [ ] `P0-I04-V02` Testcontainers: migracja, unikalność UID, podstawowe 400/401.
- [ ] `P0-I04-V03` Sprawdź OpenAPI.
- [ ] `P0-I04-V04` Zweryfikuj Kubernetes-ready architecture:
  - Backend uruchamia się z konfiguracją ENV.
  - Health/readiness endpoints działają.
  - Graceful shutdown kończy aktywne żądania.
  - Można uruchomić dwie instancje backendu
    bez konfliktów portów i współdzielonego stanu.
  - Brak sekretów w repozytorium i obrazie Docker.

**Definition of Done:** Backend startuje, DB migruje, endpointy mają spójne kontrakty. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I05 — Firebase project & backend token verification

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I05-T01` Zdefiniuj konfiguracje Firebase dev/staging/prod i manualne kroki w konsoli.
- [ ] `P0-I05-T02` Włącz Email/Password, e-mail verification, domeny i action links.
- [ ] `P0-I05-T03` Skonfiguruj Firebase Admin SDK przez bezpieczne poświadczenia.
- [ ] `P0-I05-T04` Dodaj filtr Spring Security weryfikujący podpis, issuer, audience, exp i projekt.
- [ ] `P0-I05-T05` Zdefiniuj zasady email_verified i role zaufane.

**Weryfikacja:**

- [ ] `P0-I05-V01` Testuj brak/wadliwy/wygasły/obcy token: 401.
- [ ] `P0-I05-V02` Testuj ograniczony dostęp do prywatnego endpointu i brak eskalacji roli.

**Definition of Done:** Backend nie ufa UID ani roli dostarczonej z klienta; brak sekretów w repo. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I06 — Cross-platform Auth adapter, signup & login

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I03, P0-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I06-T01` Wybierz i zaimplementuj zgodną wersję Firebase JS SDK oraz persystencję osobno web/native.
- [ ] `P0-I06-T02` Zaimplementuj AuthProvider, nasłuch stanu, loading, token refresh.
- [ ] `P0-I06-T03` Utwórz rejestrację i logowanie email/hasło oraz walidację.
- [ ] `P0-I06-T04` Zapewnij czytelne komunikaty błędów i ekran braku sieci.
- [ ] `P0-I06-T05` Nie przedstawiaj fałszywego zalogowania bez backendu.

**Weryfikacja:**

- [ ] `P0-I06-V01` Testuj formularze i adapter.
- [ ] `P0-I06-V02` Smoke test konta dev na web.
- [ ] `P0-I06-V03` Powtórz na dostępnych emulatorach.

**Definition of Done:** Realna rejestracja i logowanie Firebase, spójny stan AuthProvider. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I07 — Email verification end-to-end

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I07-T01` Wysyłaj mail weryfikacyjny po rejestracji.
- [ ] `P0-I07-T02` Dodaj ekran oczekiwania, resend z ograniczeniem częstotliwości.
- [ ] `P0-I07-T03` Obsłuż action links i odświeżenie statusu email_verified.
- [ ] `P0-I07-T04` Ustal backendowe ograniczenia dla kont niezweryfikowanych.
- [ ] `P0-I07-T05` Dokumentuj zachowanie web, mobile i ograniczenia emulatorów.

**Weryfikacja:**

- [ ] `P0-I07-V01` Przetestuj poprawny/wygasły link, resend oraz aktualizację tokena.
- [ ] `P0-I07-V02` Sprawdź niedostępność chronionych funkcji przed weryfikacją.

**Definition of Done:** Rejestracja → mail → weryfikacja → udzielony dostęp działa. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I08 — Session restore, logout & password reset

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I06, P0-I07  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I08-T01` Przywracaj sesję po restartach/odświeżeniu i rozstrzygaj stan startowy.
- [ ] `P0-I08-T02` Dodaj logout z wyczyszczeniem prywatnego stanu/cachu.
- [ ] `P0-I08-T03` Dodaj forgot/reset password z ochroną przed enumeracją.
- [ ] `P0-I08-T04` Zadbaj o expired links, offline i retry UI.

**Weryfikacja:**

- [ ] `P0-I08-V01` Testuj odświeżenie web i restart app, logout, reset hasła.
- [ ] `P0-I08-V02` Testuj błędny i wygasły kod oraz brak wycieku danych.

**Definition of Done:** Sesja i odzyskiwanie hasła są działające i odporne na błędy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I09 — Profile sync & self-service editing

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I04, P0-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I09-T01` Dodaj bezpieczne provisioning/upsert profilu powiązanego z Firebase UID.
- [ ] `P0-I09-T02` Zaimplementuj GET/PATCH /api/v1/me (allowed fields only).
- [ ] `P0-I09-T03` Utwórz ekrany profilu i edycji preferencji, miasta, displayName, języka i zainteresowań.
- [ ] `P0-I09-T04` Rozdziel pola własne Firebase i dane PostgreSQL.

**Weryfikacja:**

- [ ] `P0-I09-V01` Testy ACL: dwaj użytkownicy nie widzą ani nie edytują cudzych danych.
- [ ] `P0-I09-V02` Testuj po ponownym zalogowaniu trwałość profilu.

**Definition of Done:** GET/PATCH /me działa dla własnego konta na trzech platformach. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I10 — Sensitive account settings & deletion

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I07, P0-I08, P0-I09  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I10-T01` Dodaj zmianę hasła z recent login / reautoryzacją.
- [ ] `P0-I10-T02` Dodaj zmianę e-maila z weryfikacją nowego adresu i spójną synchronizacją.
- [ ] `P0-I10-T03` Zaimplementuj bezpieczną procedurę usunięcia konta Firebase + dane aplikacyjne z retry/reconciliation.
- [ ] `P0-I10-T04` Dodaj ekran ustawień konta, ostrzeżenia i potwierdzenia.

**Weryfikacja:**

- [ ] `P0-I10-V01` Testuj reauth, odmowę przy starej sesji, anulowania i błędy częściowe.
- [ ] `P0-I10-V02` Testuj, że dane po usunięciu nie są dostępne.

**Definition of Done:** Operacje wrażliwe mają poprawne zabezpieczenia i nie pozostawiają niekontrolowanego stanu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I11 — Automated test coverage & E2E web

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I06–P0-I10  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I11-T01` Uzupełnij testy jednostkowe formularzy, hooków i walidacji.
- [ ] `P0-I11-T02` Uzupełnij integracyjne testy Firebase security, Flyway, profilu i uprawnień.
- [ ] `P0-I11-T03` Dodaj web E2E: signup→verify→login→profile→logout→reset.
- [ ] `P0-I11-T04` Przygotuj fixtures i bezpieczne testowe środowisko bez kluczy w repo.

**Weryfikacja:**

- [ ] `P0-I11-V01` Uruchom frontend lint/typecheck/test i backend test.
- [ ] `P0-I11-V02` Zapisz komendy, raport i ograniczenia E2E w docs/testing.

**Definition of Done:** Krytyczne ścieżki mają powtarzalne testy, testy przechodzą. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I12 — Cross-platform verification matrix

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I02, P0-I07–P0-I11  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I12-T01` Przeprowadź rzeczywiste smoke/E2E web, iOS Simulator, Android Emulator.
- [ ] `P0-I12-T02` Sprawdź deep linki, klawiaturę, accessibility, reset, reauth, usuwanie konta.
- [ ] `P0-I12-T03` Sprawdź różnice localhost i zdalny API oraz sieć/offline.
- [ ] `P0-I12-T04` Udokumentuj wersje OS, SDK, urządzenia i wyniki.

**Weryfikacja:**

- [ ] `P0-I12-V01` Uzupełnij docs/testing/phase-0-results.md dla każdego scenariusza i platformy.
- [ ] `P0-I12-V02` Zgłoś BLOCKED przy braku symulatora zamiast fikcyjnego PASS.

**Definition of Done:** P0 ma potwierdzone testy na trzech platformach, bez otwartych blockerów krytycznych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I13 — CI, EAS, staging & Phase 0 gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I11, P0-I12  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P0-I13-T01` Dodaj CI frontend/backend/secrets scanning i lockfile checks.
- [ ] `P0-I13-T02` Skonfiguruj EAS development/preview oraz staging backend/web z HTTPS.
- [ ] `P0-I13-T03` Uzupełnij README bootstrap, sieć emulatorów, sekrety, troubleshooting.
- [ ] `P0-I13-T04` Dodaj monitoring minimum i strategię backup/restore staging.
- [ ] `P0-I13-T05` Wykonaj przegląd bezpieczeństwa i zamknij Phase 0.

**Weryfikacja:**

- [ ] `P0-I13-V01` CI green, staging healthcheck i smoke.
- [ ] `P0-I13-V02` Sprawdź wszystkie P0 gate oraz zaktualizuj changelog po weryfikacji.

**Definition of Done:** Można wdrażać kolejne funkcje na działającym cross-platform fundamencie. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 0

- [ ] Wszystkie obowiązkowe iteracje Phase 0 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 1 — Science & Discover MVP

**Status fazy:** TODO  
**Cel:** Źródłowa baza wiedzy, recenzja treści, Discover, fiszki, quizy i Weekly Science Drop.  
**Zależności:** Phase 0  
**Raport główny:** §3.2, §24, §25  
**Iteracje:** 7

## P1-I00 — Scientific content schema & source policy

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I13  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I00-T01` Zaprojektuj ScientificSource, EvidenceClaim, evidenceLevel, limitations, license i publishedAt.
- [ ] `P1-I00-T02` Zdefiniuj wersjonowanie, datę przeglądu i relacje źródeł.
- [ ] `P1-I00-T03` Wprowadź politykę korelacji/przyczynowości oraz informację o niepewności.
- [ ] `P1-I00-T04` Przygotuj migracje i ADR dot. redakcji.

**Weryfikacja:**

- [ ] `P1-I00-V01` Test migracji i constraint: publikacja bez źródeł jest niedozwolona.

**Definition of Done:** Źródła i claims mają weryfikowalny model danych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I01 — Science public APIs & authorization

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I01-T01` Wdroż endpointy kategorii, claimów, artykułów i cytowań.
- [ ] `P1-I01-T02` Rozdziel publiczne PUBLISHED od DRAFT/REVIEW.
- [ ] `P1-I01-T03` Dodaj paginację, filtrowanie i cache z kontrolą wersji.
- [ ] `P1-I01-T04` Zadbaj o odmowę nieautoryzowanej publikacji.

**Weryfikacja:**

- [ ] `P1-I01-V01` Integracyjne testy ACL, paginacji, statusów, walidacji URL/DOI.

**Definition of Done:** Publiczne API zwraca wyłącznie zatwierdzone treści. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I02 — Editorial workflow & admin UI

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I02-T01` Dodaj DRAFT→IN_REVIEW→PUBLISHED→ARCHIVED i audit trail.
- [ ] `P1-I02-T02` Zbuduj minimalistyczny panel redaktorski na webie.
- [ ] `P1-I02-T03` Rozdziel role author/reviewer i odrębne zatwierdzenie.
- [ ] `P1-I02-T04` Zablokuj edycję opublikowanej wersji bez nowej rewizji.

**Weryfikacja:**

- [ ] `P1-I02-V01` Testy ról, wersji, niekompletnych źródeł i wycofania publikacji.

**Definition of Done:** Recenzent może świadomie zatwierdzić i wycofać materiał. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I03 — Discover reading experience

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I01, P1-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I03-T01` Zbuduj Discover feed, artykuł i kartę Evidence.
- [ ] `P1-I03-T02` Pokaż link „Sprawdź badania”, rok, typ źródła, siłę dowodów i ograniczenia.
- [ ] `P1-I03-T03` Dodaj loading/empty/error oraz i18n.
- [ ] `P1-I03-T04` Współdziel UI na web, iOS, Android.

**Weryfikacja:**

- [ ] `P1-I03-V01` Testy renderowania dat/źródeł i a11y.
- [ ] `P1-I03-V02` Smoke na dostępnych platformach.

**Definition of Done:** Użytkownik może przeczytać i zweryfikować źródło każdej tezy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I04 — Flashcards & quizzes

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I02, P1-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I04-T01` Zaprojektuj pytania, odpowiedzi, wyjaśnienia i relacje do EvidenceClaim.
- [ ] `P1-I04-T02` Dodaj quizy prawda/fałsz i wielokrotnego wyboru.
- [ ] `P1-I04-T03` Zapisuj postęp bez zapisywania danych zdrowotnych.
- [ ] `P1-I04-T04` Unikaj kar za błędną odpowiedź i stosuj czytelne wyjaśnienia.

**Weryfikacja:**

- [ ] `P1-I04-V01` Test poprawności odpowiedzi i źródeł.
- [ ] `P1-I04-V02` Test zapisu postępu i powtórek.

**Definition of Done:** Działający quiz z uzasadnieniem i klikanym źródłem. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I05 — Weekly Science Drop & publishing cadence

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I02, P1-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I05-T01` Wprowadź typ Science Drop z datą publikacji, datą przeglądu i recenzją.
- [ ] `P1-I05-T02` Dodaj planowanie tygodniowej publikacji i bezpieczny scheduler.
- [ ] `P1-I05-T03` Zbuduj kartę tygodnia w Discover.
- [ ] `P1-I05-T04` Zaprojektuj fallback przy braku nowego recenzowanego badania.

**Weryfikacja:**

- [ ] `P1-I05-V01` Test przyszłych dat publikacji, stref czasowych i ukrywania DRAFT.

**Definition of Done:** Tygodniowy materiał jest publikowany dopiero po recenzji. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I06 — Myth Battle, seed data & phase gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I04, P1-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P1-I06-T01` Dodaj trzy krótkie pytania Myth Battle z feedbackiem i postępem.
- [ ] `P1-I06-T02` Zaimportuj niewielką pulę zweryfikowanych treści pilotażowych.
- [ ] `P1-I06-T03` Wykonaj E2E: recenzent publikuje→Discover→quiz→źródło.
- [ ] `P1-I06-T04` Zamknij Phase 1 po sprawdzeniu web/iOS/Android.

**Weryfikacja:**

- [ ] `P1-I06-V01` Test, że wycofany claim nie trafia do nowej rozgrywki.
- [ ] `P1-I06-V02` Sprawdź źródła i blokady uprawnień.

**Definition of Done:** Discover+Weekly Drop+Myth Battle działają na recenzowanych treściach. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 1

- [ ] Wszystkie obowiązkowe iteracje Phase 1 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 2 — Sober Events — katalog, organizerzy, kontakt

**Status fazy:** TODO  
**Cel:** Międzynarodowy katalog głównie sober rave/party, rozszerzony o lifestyle; bez własnych płatności.  
**Zależności:** Phase 0; interfejs Discover można rozwijać równolegle do Phase 1 po zatwierdzeniu kontraktów.  
**Raport główny:** §3.3–§3.4, §7–§8, §13  
**Iteracje:** 7

## P2-I00 — Event policy, taxonomy & trust

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I13  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I00-T01` Ustal Sober Nightlife vs Sober Lifestyle, 100% ALCOHOL-FREE vs SOBER-FRIENDLY.
- [ ] `P2-I00-T02` Spisz kryteria kwalifikacji i weryfikacji organizatora.
- [ ] `P2-I00-T03` Zdefiniuj zasady źródła danych, prywatności i retencji.
- [ ] `P2-I00-T04` Zaprojektuj cykl MODERATION statusów.

**Weryfikacja:**

- [ ] `P2-I00-V01` Przetestuj scenariusze niekwalifikujących się wydarzeń na przykładach.

**Definition of Done:** Wydarzenia mają jasne, moderowalne kryteria. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I01 — Events data model & APIs

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I01-T01` Dodaj Event, Venue, Organizer, Category, Moderation, ContactInquiry i bazową lokalizację.
- [ ] `P2-I01-T02` Implementuj API tworzenia/odczytu/wyszukiwania z rolami.
- [ ] `P2-I01-T03` Daty przechowuj poprawnie UTC + IANA timezone.
- [ ] `P2-I01-T04` Dodaj paginację, walidację linków, zdjęć i geolokacji.

**Weryfikacja:**

- [ ] `P2-I01-V01` Testy migracji, ACL, timezone, parametrów wyszukiwania.

**Definition of Done:** API eventów oddziela dane publiczne od niezatwierdzonych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I02 — Event discovery web + mobile

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I02-T01` Zbuduj listę wydarzeń z filtrami miasto/region/data/kategoria/cena.
- [ ] `P2-I02-T02` Dodaj sortowanie i stany pustej listy, paginację.
- [ ] `P2-I02-T03` Wyróżnij sober party/rave w UI.
- [ ] `P2-I02-T04` Dodaj opcjonalny tryb lokalizacji bez żądania niepotrzebnych uprawnień.

**Weryfikacja:**

- [ ] `P2-I02-V01` Test filtrów, przekraczania daty, a11y i responsywności.

**Definition of Done:** Użytkownik znajduje aktualne eventy w wybranym mieście. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I03 — Event detail, external checkout & links

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I01, P2-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I03-T01` Zbuduj szczegóły eventu, zasady sober, organizator, miejsce, cena i strefa czasu.
- [ ] `P2-I03-T02` Dodaj zapisanie do kalendarza i zewnętrzny link zakupu.
- [ ] `P2-I03-T03` Zaimplementuj deep linki i bezpieczną walidację redirectów.
- [ ] `P2-I03-T04` Ustal minimalne wymagania SEO publicznych stron.

**Weryfikacja:**

- [ ] `P2-I03-V01` E2E lista→szczegóły→link organizatora.
- [ ] `P2-I03-V02` Test błędnych i wygasłych linków.

**Definition of Done:** Szczegóły wydarzenia i zewnętrzny zakup są czytelne i bezpieczne. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I04 — Organizer identity & moderation portal

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I00, P2-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I04-T01` Zbuduj publiczny profil organizatora.
- [ ] `P2-I04-T02` Dodaj formularz zgłaszania wydarzeń i panel kuratorski.
- [ ] `P2-I04-T03` Moderacja zatwierdź/odrzuć/ukryj z audytem.
- [ ] `P2-I04-T04` Zachowaj kontrolę roli ORGANIZER po stronie backendu.

**Weryfikacja:**

- [ ] `P2-I04-V01` Testy nieautoryzowanej edycji, ukrytych eventów i eskalacji roli.

**Definition of Done:** Zweryfikowany organizator może zgłosić wydarzenie, moderator je zatwierdza. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I05 — Organizer inquiries & saved events

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I03, P2-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I05-T01` Dodaj formularz kontaktowy z antyspamem, rate limit i bezpieczną zgodą na kontakt.
- [ ] `P2-I05-T02` Zaimplementuj powiadomienie i możliwość odpowiedzi bez ujawniania prywatnego e-maila, jeśli to możliwe.
- [ ] `P2-I05-T03` Dodaj ulubione/My Events i kontrolę prywatności.
- [ ] `P2-I05-T04` Udokumentuj retencję zapytań.

**Weryfikacja:**

- [ ] `P2-I05-V01` Testy antyspam, ACL wiadomości, idempotencji ulubionych.
- [ ] `P2-I05-V02` E2E pytanie→odpowiedź.

**Definition of Done:** Kontakt z organizatorem i zapisane eventy działają end-to-end. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I06 — Curated events & Phase 2 acceptance

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I01–P2-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I06-T01` Dodaj pierwsze realne, legalnie pozyskane/zweryfikowane wydarzenia.
- [ ] `P2-I06-T02` Zadbaj o status anulowane/zmienione/odbyte.
- [ ] `P2-I06-T03` Przeprowadź smoke na web/iOS/Android i kontrolę stref czasowych.
- [ ] `P2-I06-T04` Zweryfikuj konwersję event→external checkout oraz jakość katalogu.

**Weryfikacja:**

- [ ] `P2-I06-V01` E2E wyszukanie→kontakt→zapisanie→zewnętrzny link.
- [ ] `P2-I06-V02` Audit brak fikcyjnych eventów.

**Definition of Done:** Działa katalog wiarygodnych wydarzeń i kontakt bez własnych płatności. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 2

- [ ] Wszystkie obowiązkowe iteracje Phase 2 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 3 — Retention, gry, personalizacja i powiadomienia

**Status fazy:** TODO  
**Cel:** Powroty dzięki wiedzy i wydarzeniom, z przejrzystym UX i zgodą na komunikację.  
**Zależności:** Phase 1 i funkcje eventów z Phase 2; Guess the Country dopiero w Phase 6, Brain Explorer dopiero w Phase 7.  
**Raport główny:** §25, §16, §24  
**Iteracje:** 7

## P3-I00 — Engagement architecture & ethical UX

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I06, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I00-T01` Ustal zdarzenia retencji, limity powiadomień i brak manipulacyjnych streaków.
- [ ] `P3-I00-T02` Zdefiniuj reguły unikania presji na abstynencję i prywatność.
- [ ] `P3-I00-T03` Zaprojektuj model engagement ledger oraz uprawnień.
- [ ] `P3-I00-T04` Zaplanuj kontrolę eksperymentów i zgodności zgód.

**Weryfikacja:**

- [ ] `P3-I00-V01` Przegląd polityki prywatności i prototypów.
- [ ] `P3-I00-V02` Testy zapisów zgód.

**Definition of Done:** Grywalizacja jest dobrowolna i mierzy naukę, nie historię uzależnienia. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I01 — Science Passport, XP & badges

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P3-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I01-T01` Dodaj XP ledger, poziomy, odznaki i źródła punktów.
- [ ] `P3-I01-T02` Zaimplementuj idempotencję naliczeń i limity antyfraud.
- [ ] `P3-I01-T03` Zbuduj ekran Science Passport na wszystkich platformach.
- [ ] `P3-I01-T04` Dodaj wyłączenie publicznego pokazywania profilu.

**Weryfikacja:**

- [ ] `P3-I01-V01` Test dwukrotnego ukończenia quizu i antyduplikacji XP.
- [ ] `P3-I01-V02` Test prywatności.

**Definition of Done:** Punkty i poziomy są spójne, bez dopisywania duplikatów. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I02 — Party Decisions branching mini-game

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P3-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I02-T01` Dodaj edytowalne drzewka wyborów i wersjonowanie scenariuszy.
- [ ] `P3-I02-T02` Napisz pierwsze recenzowane scenariusze o presji społecznej.
- [ ] `P3-I02-T03` Dodaj ekran gry, cofanie i wyjaśnienia.
- [ ] `P3-I02-T04` Nie przedstawiaj „jednej moralnie poprawnej” odpowiedzi bez uzasadnienia.

**Weryfikacja:**

- [ ] `P3-I02-V01` Test krawędzi scenariuszy, zakończeń i weryfikacji źródeł.

**Definition of Done:** Scenariusze dają edukacyjną refleksję, a nie ocenę człowieka. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I03 — Soberity Missions & opt-in challenges

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P3-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I03-T01` Dodaj modele misji indywidualnych/grupowych i postępu.
- [ ] `P3-I03-T02` Obsłuż opt-in/opt-out, daty, ukończenie i anulowanie.
- [ ] `P3-I03-T03` Zintegruj z XP bez sztucznego generowania aktywności.
- [ ] `P3-I03-T04` Przetestuj prywatność misji i brak przymusu raportowania alkoholu.

**Weryfikacja:**

- [ ] `P3-I03-V01` Testy granic czasowych, rezygnacji i idempotencji nagród.

**Definition of Done:** Dobrowolne misje działają bez kar za nieobecność. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I04 — Science + events notification pipeline

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I05, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I04-T01` Dodaj preferencje kanałów: email, native push i web fallback.
- [ ] `P3-I04-T02` Zaimplementuj rejestrację/unieważnianie tokenów Expo i zgodę na push.
- [ ] `P3-I04-T03` Powiadamiaj o Science Drop i wydarzeniach zgodnie z preferencjami.
- [ ] `P3-I04-T04` Dodaj rate limit, opt-out i deduplikację wysyłek.

**Weryfikacja:**

- [ ] `P3-I04-V01` Testy schedulerów, stref, unieważnionych tokenów i brak duplikatów.

**Definition of Done:** Użytkownik może kontrolować częstotliwość i wyłączyć powiadomienia. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I05 — Personalized Discover & Events

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P0-I09, P1-I06, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I05-T01` Dodaj rekomendacje deterministyczne po mieście, języku i tematach.
- [ ] `P3-I05-T02` Zbuduj sekcje Discover/Event rekomendowane i fallback dla nowych kont.
- [ ] `P3-I05-T03` Unikaj profilowania wrażliwego i tłumacz kryteria.
- [ ] `P3-I05-T04` Zadbaj o możliwość resetu zainteresowań.

**Weryfikacja:**

- [ ] `P3-I05-V01` Testy cold-start, brak danych, zmiana miasta i prywatność.

**Definition of Done:** Personalizacja działa bez zbierania danych o zdrowiu i piciu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P3-I06 — Analytics, experiments & Phase 3 gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P3-I01–P3-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I06-T01` Dodaj zgodne ze zgodą eventy produktu i metryki D1/D7/D30, quiz completion i event CTR.
- [ ] `P3-I06-T02` Przygotuj eksperymenty porównawcze na sensownych hipotezach.
- [ ] `P3-I06-T03` Zadbaj o minimum danych/retencję i możliwość wycofania zgody.
- [ ] `P3-I06-T04` Wykonaj testy cross-platform i review jakości treści.

**Weryfikacja:**

- [ ] `P3-I06-V01` Testy consent, no-PII telemetry i poprawności zdarzeń.
- [ ] `P3-I06-V02` Test odznak/powiadomień E2E.

**Definition of Done:** Retencja jest mierzalna, komunikacja dobrowolna i gry recenzowane. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 3

- [ ] Wszystkie obowiązkowe iteracje Phase 3 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 4 — Organizer marketplace, bilety, płatności i QR

**Status fazy:** TODO  
**Cel:** Bezpieczna sprzedaż biletów na prawdziwe wydarzenia z pełną ścieżką rozliczeń.  
**Zależności:** Phase 2 + walidacja popytu + zatwierdzony model prawny i obsługiwane kraje.  
**Raport główny:** §3.5, §9–§10, §20  
**Iteracje:** 9

## P4-I00 — Legal/payment architecture gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I00-T01` Ustal sprzedawcę, odpowiedzialność za VAT, zwroty, dokumenty i region startu.
- [ ] `P4-I00-T02` Zweryfikuj dostępność PSP marketplace i zasady sklepów aplikacji.
- [ ] `P4-I00-T03` Zaprojektuj granice odpowiedzialności, stany płatności i ADR.
- [ ] `P4-I00-T04` Ustal minimalne wymagania ochrony danych i PCI scope.

**Weryfikacja:**

- [ ] `P4-I00-V01` Wykonaj review ryzyk i listę ręcznych zgód/umów.

**Definition of Done:** Nie zaczynaj checkoutu bez zatwierdzonego modelu prawnego. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I01 — Organizer onboarding & verification

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I01-T01` Dodaj onboarding organizatorów i weryfikację uprawnień.
- [ ] `P4-I01-T02` Zintegruj wymagane KYC/KYB wyłącznie przez operatora płatności.
- [ ] `P4-I01-T03` Dodaj podgląd statusu weryfikacji i blokady sprzedaży.
- [ ] `P4-I01-T04` Zapewnij audyt zmian roli i organizatora.

**Weryfikacja:**

- [ ] `P4-I01-V01` Test autoryzacji, podmiany organizerId i odmowy nieweryfikowanych.

**Definition of Done:** Tylko zweryfikowany organizator może publikować ofertę sprzedaży. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I02 — Organizer dashboard & ticket types

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I02-T01` Zbuduj web dashboard z edycją wydarzeń, pul i cen.
- [ ] `P4-I02-T02` Dodaj TicketType, capacity, sales window, cancellation policy.
- [ ] `P4-I02-T03` Kontroluj zmianę ceny i limity po pierwszej sprzedaży.
- [ ] `P4-I02-T04` Dodaj rozdział uprawnień moderator/organizator.

**Weryfikacja:**

- [ ] `P4-I02-V01` Test uprawnień i zmian dostępności, dat, walut.

**Definition of Done:** Organizator zarządza legalną ofertą biletów. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I03 — Orders, inventory holds & concurrency

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I03-T01` Zaprojektuj Order/OrderItem/InventoryHold i maszynę stanów.
- [ ] `P4-I03-T02` Utrzymuj rezerwację stock z TTL i transakcją.
- [ ] `P4-I03-T03` Dodaj idempotency key przy tworzeniu zamówienia.
- [ ] `P4-I03-T04` Obsłuż concurrency na ostatnim bilecie.

**Weryfikacja:**

- [ ] `P4-I03-V01` Test race last ticket, wygaśnięcie hold i retry requestów.

**Definition of Done:** Brak overselling i duplikowanych zamówień. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I04 — Checkout web/native & payment sandbox

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I00, P4-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I04-T01` Zintegruj operatora płatności w sandboxie z backendem.
- [ ] `P4-I04-T02` Dodaj checkout na web i mobile w sposób zgodny z aktualnymi zasadami sklepów.
- [ ] `P4-I04-T03` Użyj bezpiecznych tokenów sesji płatniczej, nie przechowuj danych karty.
- [ ] `P4-I04-T04` Obsłuż porzuconą płatność, 3DS, błędy i anulowania.

**Weryfikacja:**

- [ ] `P4-I04-V01` Test success/fail/3DS/timeout na staging bez prawdziwych pieniędzy.

**Definition of Done:** Checkout przekazuje kontrolę do legalnego operatora, nie tworzy biletów przed potwierdzeniem. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I05 — Webhooks, outbox & reconciliation

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I05-T01` Zweryfikuj podpis i replay protection webhooków.
- [ ] `P4-I05-T02` Dodaj idempotentne przejścia Order/Payment, outbox i retry.
- [ ] `P4-I05-T03` Rozwiąż nieuporządkowane i powtórzone webhooki.
- [ ] `P4-I05-T04` Dodaj reconciliation i alertowanie rozbieżności.

**Weryfikacja:**

- [ ] `P4-I05-V01` Test duplicate/out-of-order webhook, restart worker, utracony callback.

**Definition of Done:** Stan płatności wynika z wiarygodnych zdarzeń i da się go rozliczyć. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I06 — Ticket issuance, QR & delivery

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I06-T01` Dodaj Tickets z bezpiecznym niezgadywalnym identyfikatorem/QR.
- [ ] `P4-I06-T02` Generuj bilet po potwierdzeniu płatności.
- [ ] `P4-I06-T03` Dodaj ekran My Tickets, e-mail i ponowną dostawę.
- [ ] `P4-I06-T04` Uwzględnij prywatność danych uczestników.

**Weryfikacja:**

- [ ] `P4-I06-V01` Test wygenerowania tylko po PAID, duplikacji wysyłek i dostępu właściciela.

**Definition of Done:** Jedna opłacona sztuka biletu odpowiada jednej ważnej identyfikacji wejścia. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I07 — Check-in validation & organizer scanning

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I07-T01` Dodaj ekran skanowania biletów i autoryzację personelu organizatora.
- [ ] `P4-I07-T02` Obsłuż online idempotentny check-in i wykrywanie ponownego skanu.
- [ ] `P4-I07-T03` Przetestuj słabą sieć i odrzuć offline tryb bez odrębnego projektu.
- [ ] `P4-I07-T04` Loguj tylko niezbędne informacje.

**Weryfikacja:**

- [ ] `P4-I07-V01` Test niepoprawny/zużyty/cudzy bilet, concurrent scans.

**Definition of Done:** Jednorazowy check-in jest bezpieczny i audytowalny. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P4-I08 — Refunds, payout lifecycle & pilot gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P4-I05–P4-I07  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P4-I08-T01` Dodaj refund/cancel z właściwymi stanami zamówień i biletów.
- [ ] `P4-I08-T02` Powiąż rozliczenie operatora i status payout, bez tworzenia własnej księgowości.
- [ ] `P4-I08-T03` Dodaj panel statusów i komunikaty do kupującego.
- [ ] `P4-I08-T04` Zrób sandbox E2E od zakupu po refund/check-in oraz review prawny.

**Weryfikacja:**

- [ ] `P4-I08-V01` Test partial refund, refund after check-in, failed payout, chargeback signals.

**Definition of Done:** Zakupy, zwroty i bilety przechodzą bez znanych rozbieżności finansowych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 4

- [ ] Wszystkie obowiązkowe iteracje Phase 4 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 5 — Community — grupy, posty, interakcje i moderacja

**Status fazy:** TODO  
**Cel:** Bezpieczna społeczność przy sober events i aktywnościach, a nie ogólna niestrzeżona tablica.  
**Zależności:** Phase 2; nie wymaga aktywacji płatności z Phase 4.  
**Raport główny:** §3.6, §10, §25  
**Iteracje:** 7

## P5-I00 — Community policy, privacy & threat model

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I00-T01` Zdefiniuj zasady publikacji, zgłoszeń, banów, treści naukowych vs opinii.
- [ ] `P5-I00-T02` Zaprojektuj prywatność profili i grup oraz przeciwdziałanie nękaniu.
- [ ] `P5-I00-T03` Ustal tryb moderacji, retencję i procedury odwołań.
- [ ] `P5-I00-T04` Przejrzyj wymogi RODO/DSA dla obszaru uruchomienia.

**Weryfikacja:**

- [ ] `P5-I00-V01` Przegląd scenariuszy nadużyć i polityk dostępu.

**Definition of Done:** Zanim powstanie feed, istnieją reguły moderacji i prywatności. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I01 — Thematic & city groups

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I01-T01` Dodaj Group, Membership, roles i visibility public/private.
- [ ] `P5-I01-T02` Zbuduj grupy miejskie, Sober Runners, Sober Rave i Science Discussion.
- [ ] `P5-I01-T03` Dodaj join/leave/moderację członkostwa.
- [ ] `P5-I01-T04` Zablokuj dostęp do danych grup prywatnych.

**Weryfikacja:**

- [ ] `P5-I01-V01` Testy ACL, przejęcia cudzej grupy, nadużyć zaproszeń.

**Definition of Done:** Użytkownik dołącza do grup, uprawnienia są egzekwowane backendowo. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I02 — Posts, comments, reactions

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I02-T01` Dodaj modele postów/komentarzy/reakcji, edycję i kasowanie własnych treści.
- [ ] `P5-I02-T02` Zaimplementuj paginację, filtrowanie, limity i podstawowy antyspam.
- [ ] `P5-I02-T03` Oznacz w UI opinie użytkowników jako niezweryfikowane.
- [ ] `P5-I02-T04` Zbuduj formularze i widok na 3 platformach.

**Weryfikacja:**

- [ ] `P5-I02-V01` Testy ownership, paginacji i usunięć.
- [ ] `P5-I02-V02` Moderacja ukrytego contentu.

**Definition of Done:** Grupy mają prosty, bezpieczny feed i komentarze. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I03 — Event conversations & organizer messaging

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I02, P2-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I03-T01` Połącz komentarze z eventami i grupami, bez domyślnego publicznego czatu.
- [ ] `P5-I03-T02` Wprowadź asynchroniczne wątki organizator↔uczestnik.
- [ ] `P5-I03-T03` Dodaj uprawnienia uczestnictwa i ograniczenia widoczności.
- [ ] `P5-I03-T04` Odłóż realtime do czasu walidacji.

**Weryfikacja:**

- [ ] `P5-I03-V01` Test wycieku wiadomości między kontami, spam i opt-out.

**Definition of Done:** Kontakt i wątki wydarzeń są kontekstowe, prywatne i sprawdzalne. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I04 — Opt-in attendee discovery

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I04-T01` Dodaj dobrowolne Who’s going? z wyraźnym opt-in.
- [ ] `P5-I04-T02` Nie ujawniaj listy uczestników automatycznie.
- [ ] `P5-I04-T03` Dodaj kontrolę widoczności i możliwość cofnięcia zgody.
- [ ] `P5-I04-T04` Rozważ blokowanie kontaktu i zgłaszanie zachowań.

**Weryfikacja:**

- [ ] `P5-I04-V01` Test zgody, public/private i cofnięcia wyświetlania.

**Definition of Done:** Obecność na wydarzeniu ujawniana wyłącznie świadomie. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I05 — Moderation queue, reports, block/mute

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I02–P5-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I05-T01` Dodaj report/block/mute, queue i role moderatorów.
- [ ] `P5-I05-T02` Zbuduj panel obsługi zgłoszeń, audyt i mechanizm odwołania.
- [ ] `P5-I05-T03` Dodaj rate limits, wykrywanie spamu i usuwanie problematycznej treści.
- [ ] `P5-I05-T04` Ogranicz ryzyko publikacji szkodliwych porad medycznych.

**Weryfikacja:**

- [ ] `P5-I05-V01` Testy blokowania, zgłoszeń, nadużyć i dostępu moderatorów.

**Definition of Done:** Zgłoszenia i blokady faktycznie działają, nie są tylko UI. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P5-I06 — Privacy & community pilot acceptance

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P5-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P5-I06-T01` Dodaj eksport/usunięcie treści użytkownika zgodnie z polityką.
- [ ] `P5-I06-T02` Przeprowadź E2E grupy/posty/zgłoszenia na web i mobile.
- [ ] `P5-I06-T03` Zbierz bezpieczne metryki jakości społeczności i obciążenie moderacji.
- [ ] `P5-I06-T04` Potwierdź zasady lokalnych grup i eventów.

**Weryfikacja:**

- [ ] `P5-I06-V01` Security/regulatory review i testy regresyjne ACL.

**Definition of Done:** Społeczność działa z kontrolą prywatności i realną moderacją. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 5

- [ ] Wszystkie obowiązkowe iteracje Phase 5 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 6 — World Map — dane o spożyciu alkoholu

**Status fazy:** TODO  
**Cel:** Interaktywny atlas krajów z realnymi i datowanymi statystykami oraz grą Guess the Country.  
**Zależności:** Phase 1 (science governance); można rozpocząć niezależnie od marketplace.  
**Raport główny:** §22, §24, §25  
**Iteracje:** 8

## P6-I00 — Map scope, source licensing & indicators

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I00-T01` Wybierz definicje miar, m.in. l czystego alkoholu na osobę 15+/rok.
- [ ] `P6-I00-T02` Zapisz źródła WHO/World Bank/OWID, licencje i pokrycie.
- [ ] `P6-I00-T03` Określ braki danych, niepewność i porównywalność.
- [ ] `P6-I00-T04` Zatwierdź zasady legend, roku i bez „real-time”.

**Weryfikacja:**

- [ ] `P6-I00-V01` Sprawdź przykładowe dane kilku krajów i definicje.

**Definition of Done:** Wskaźniki są rozumiane i porównywalne lub wyraźnie nieporównywalne. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I01 — Versioned import & data validation

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I01-T01` Zaprojektuj CountryMetric, Dataset, SourceVersion i audit importu.
- [ ] `P6-I01-T02` Implementuj ETL z testami jednostek, ISO alpha-3 i duplikatów.
- [ ] `P6-I01-T03` Rejestruj rok, źródło, metodykę oraz poprawki importu.
- [ ] `P6-I01-T04` Dodaj automatyczne raporty jakości i braków danych.

**Weryfikacja:**

- [ ] `P6-I01-V01` Testy źródłowych wartości, importu idempotentnego i rollbacku.

**Definition of Done:** Statystyki można odtworzyć i prześledzić do datasetu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I02 — Country metrics REST API

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I02-T01` Udostępnij API wybranych miar, zakresu lat, metadanych i listy krajów.
- [ ] `P6-I02-T02` Zadbaj o paginację/cache i poprawne missing/null.
- [ ] `P6-I02-T03` Udokumentuj jednostki i źródło w odpowiedzi API.
- [ ] `P6-I02-T04` Zabezpiecz admin import.

**Weryfikacja:**

- [ ] `P6-I02-V01` Testy country/year missing, jednostek, rate limit i błędnych kodów.

**Definition of Done:** API nie ukrywa braków ani nie udaje dokładnych wartości. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I03 — Web choropleth & country detail

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I03-T01` Zbuduj web mapę z legendą, kolorami i tooltipami.
- [ ] `P6-I03-T02` Dodaj widok kraju, wyraźny rok, jednostkę, źródło.
- [ ] `P6-I03-T03` Dodaj wersję listową dostępną klawiaturą i czytnikiem ekranu.
- [ ] `P6-I03-T04` Zadbaj o prawidłowe użycie mapowych zasobów/attribution.

**Weryfikacja:**

- [ ] `P6-I03-V01` Test kolorów, źródła, braków, a11y i wydajności web.

**Definition of Done:** Mapa web nie wprowadza w błąd i ma alternatywę dostępną. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I04 — Native map & mobile compatibility

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I02, P6-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I04-T01` Zintegruj mapę na iOS/Android z kompatybilnym native buildem, jeśli wymaga tego biblioteka.
- [ ] `P6-I04-T02` Współdziel logikę danych, bez wymuszania identycznego renderera.
- [ ] `P6-I04-T03` Dodaj gesty, tooltipy i tryb listy.
- [ ] `P6-I04-T04` Zweryfikuj web/native styling i licencje.

**Weryfikacja:**

- [ ] `P6-I04-V01` Build development client.
- [ ] `P6-I04-V02` Smoke iOS/Android oraz brak crashy.

**Definition of Done:** Mapę można używać na wszystkich 3 platformach. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I05 — Timeline, comparison & Guess the Country

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I02–P6-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I05-T01` Dodaj oś czasu i porównanie krajów z tymi samymi miarami.
- [ ] `P6-I05-T02` Przygotuj Guess the Country z zatwierdzonym datasetem/rokiem.
- [ ] `P6-I05-T03` Pokaż definicję miary i źródła po odpowiedzi.
- [ ] `P6-I05-T04` Nie zadawaj pytań na danych nieporównywalnych.

**Weryfikacja:**

- [ ] `P6-I05-V01` Testy agregacji lat, remisu i brakujących danych.
- [ ] `P6-I05-V02` Test źródeł w grze.

**Definition of Done:** Mapa i minigra są zgodne z konkretnymi datasetami. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I06 — Outlet-density feasibility & guarded pilot

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I06-T01` Zbadaj, co OSM faktycznie oznacza i czy punkty sprzedaży są kompletne.
- [ ] `P6-I06-T02` Porównaj próbkę z oficjalnymi rejestrami dla 1–2 regionów.
- [ ] `P6-I06-T03` Opracuj wskaźnik pokrycia i disclaimery.
- [ ] `P6-I06-T04` Nie publikuj wskaźnika globalnego, jeśli brak porównywalności.

**Weryfikacja:**

- [ ] `P6-I06-V01` Spisz decyzję GO/NO-GO na podstawie jakości danych.

**Definition of Done:** Warstwa punktów tylko przy udowodnionej jakości; NO-GO też jest dopuszczalnym wynikiem. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P6-I07 — World Map cross-platform evidence gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P6-I03–P6-I07  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P6-I07-T01` Sprawdź a11y mapy, legend, porównania i odnośników.
- [ ] `P6-I07-T02` Przetestuj naruszenia licencji i brakujące atrybucje.
- [ ] `P6-I07-T03` Wykonaj E2E web/iOS/Android oraz review naukowe.
- [ ] `P6-I07-T04` Udokumentuj ograniczenia i plan odświeżania zbiorów.

**Weryfikacja:**

- [ ] `P6-I07-V01` Testy porównywalności i provenance na przykładach.
- [ ] `P6-I07-V02` Smoke cross-platform.

**Definition of Done:** Każda liczba jest możliwa do zweryfikowania, bez pseudoprecyzji. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 6

- [ ] Wszystkie obowiązkowe iteracje Phase 6 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 7 — Brain Lab / Body Lab — edukacja interaktywna

**Status fazy:** TODO  
**Cel:** Rzetelne wizualizacje mózgu i funkcji fizjologicznych bez symulowania indywidualnych uszkodzeń.  
**Zależności:** Phase 1 (Evidence Cards) i zweryfikowana treść naukowa.  
**Raport główny:** §23–§24, §25  
**Iteracje:** 6

## P7-I00 — Scientific scope & visualization review

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I00-T01` Zdefiniuj obszary mózgu, funkcje i źródła do każdego twierdzenia.
- [ ] `P7-I00-T02` Oddziel skutki ostre i przewlekłe oraz ich ograniczenia.
- [ ] `P7-I00-T03` Zatwierdź copy i anti-claims typu X ml = Y% uszkodzeń.
- [ ] `P7-I00-T04` Przygotuj plan dostępności i kontrastów.

**Weryfikacja:**

- [ ] `P7-I00-V01` Merytoryczny przegląd opisu funkcji i źródeł.

**Definition of Done:** Gotowa lista zweryfikowanych wizualizacji i zakazanych uproszczeń. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P7-I01 — Accessible interactive 2D brain

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P7-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I01-T01` Zbuduj skalowalny mózg 2D (SVG lub odpowiedni rendering).
- [ ] `P7-I01-T02` Dodaj interakcję z regionami i listowy ekwiwalent a11y.
- [ ] `P7-I01-T03` Każdy region otwiera Evidence Cards i ograniczenia.
- [ ] `P7-I01-T04` Współdziel dane między web/iOS/Android.

**Weryfikacja:**

- [ ] `P7-I01-V01` Test tap/keyboard/screen reader i źródeł.

**Definition of Done:** Użytkownik poznaje obszary mózgu bez pseudomedycznej diagnozy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P7-I02 — Ethanol dose calculator & caveats

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P7-I00, P7-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I02-T01` Dodaj objętość napoju i ABV oraz obliczenie gramów etanolu.
- [ ] `P7-I02-T02` Jawnie opisz, że wynik nie mierzy uszkodzenia mózgu.
- [ ] `P7-I02-T03` Zadbaj o precyzję jednostek i scenariusz zero.
- [ ] `P7-I02-T04` Dodaj komunikat o zmienności indywidualnej.

**Weryfikacja:**

- [ ] `P7-I02-V01` Testy granic ABV i przeliczenia etanol 0.789 g/ml.
- [ ] `P7-I02-V02` Test czytelnych caveats.

**Definition of Done:** Kalkulator poprawnie liczy etanol i nie wyciąga nieuprawnionych wniosków. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P7-I03 — Short- and long-term evidence paths

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P7-I00–P7-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I03-T01` Dodaj ścieżki krótkoterminowego i długoterminowego wpływu alkoholu.
- [ ] `P7-I03-T02` Odsyłaj do odpowiednich źródeł i poziomu pewności.
- [ ] `P7-I03-T03` Dodaj rozróżnienie korelacja/przyczynowość.
- [ ] `P7-I03-T04` Zadbaj o aktualizowalność treści w panelu redakcji.

**Weryfikacja:**

- [ ] `P7-I03-V01` Testy wycofanego claimu, tłumaczeń i disclaimers.

**Definition of Done:** Dwie ścieżki edukacyjne są kontrolowane redakcyjnie. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P7-I04 — Brain Explorer interactive mini-game

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P7-I01, P7-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I04-T01` Zbuduj grę identyfikacji funkcji/obszarów mózgu.
- [ ] `P7-I04-T02` Zasil pytania z zatwierdzonego content API, bez losowego generowania faktów.
- [ ] `P7-I04-T03` Zintegruj z XP Passport, jeśli Phase 3 jest aktywna.
- [ ] `P7-I04-T04` Dodaj stany retry, brak danych i dostępność.

**Weryfikacja:**

- [ ] `P7-I04-V01` Test poprawnych odpowiedzi, archiwalnych claimów, punktów i ekranów.

**Definition of Done:** Brain Explorer uczy na zweryfikowanych pytaniach. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P7-I05 — Optional 3D/Body Lab evaluation & gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P7-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P7-I05-T01` Oceń 3D i rozszerzenie na serce, wątrobę, sen i regenerację na podstawie badań.
- [ ] `P7-I05-T02` Przygotuj prototyp tylko po zatwierdzeniu zakresu.
- [ ] `P7-I05-T03` Zweryfikuj performance web/native i ryzyko mylących animacji.
- [ ] `P7-I05-T04` Wykonaj cross-platform testy podstawowego Brain Lab i przegląd naukowy.

**Weryfikacja:**

- [ ] `P7-I05-V01` Dokument decyzji GO/NO-GO dla 3D/Body Lab.
- [ ] `P7-I05-V02` Testy a11y i naukowego copy.

**Definition of Done:** Brain Lab 2D zamknięty; 3D/Body Lab może zostać odroczony bez blokowania fazy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 7

- [ ] Wszystkie obowiązkowe iteracje Phase 7 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 8 — AI Myth Buster & evidence-grounded search

**Status fazy:** TODO  
**Cel:** AI cytuje tylko sprawdzone źródła i umie jasno powiedzieć „brak wystarczających danych”.  
**Zależności:** Phase 1 i wiarygodny korpus zatwierdzonych materiałów.  
**Raport główny:** §24–§25, §3.7  
**Iteracje:** 6

## P8-I00 — RAG requirements, privacy & evaluation set

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I00-T01` Ustal legalne prawo do wykorzystywania publikacji i zakres corpus.
- [ ] `P8-I00-T02` Stwórz threat model prompt injection, privacy i porady medyczne.
- [ ] `P8-I00-T03` Przygotuj testowy zestaw pytań z oczekiwanymi dowodami i odmowami.
- [ ] `P8-I00-T04` Zatwierdź cel jakościowy i budżet kosztów.

**Weryfikacja:**

- [ ] `P8-I00-V01` Review wymagań prawnych i eval spec bez produkcyjnego LLM.

**Definition of Done:** Istnieje mierzalny próg uruchomienia funkcji AI. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P8-I01 — Approved-corpus indexing & retrieval

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P8-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I01-T01` Implementuj ingest wyłącznie zatwierdzonych Evidence Claims i metadanych.
- [ ] `P8-I01-T02` Dodaj indeks semantyczny/hybrydowy z wersjonowaniem i provenance.
- [ ] `P8-I01-T03` Obsłuż archiwizację i usuwanie źródeł z indeksu.
- [ ] `P8-I01-T04` Nie dodawaj arbitralnych stron internetowych bez recenzji.

**Weryfikacja:**

- [ ] `P8-I01-V01` Test usunięcia wycofanego claimu i precyzji retrieval.

**Definition of Done:** Retrieval wskazuje źródła z zatwierdzonego korpusu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P8-I02 — Grounded answer service & citations

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P8-I01  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I02-T01` Dodaj backend zapytania AI z kontrolą rate limits.
- [ ] `P8-I02-T02` Ogranicz generowanie do kontekstu i rzeczywistych identyfikatorów źródeł.
- [ ] `P8-I02-T03` Zweryfikuj citations serwerowo przed prezentacją.
- [ ] `P8-I02-T04` Zaimplementuj brak odpowiedzi przy braku źródła.

**Weryfikacja:**

- [ ] `P8-I02-V01` Test halucynowanych DOI i pytań poza corpus.
- [ ] `P8-I02-V02` Test błędnego cytowania.

**Definition of Done:** Nie da się pokazać niezweryfikowanego cytowania jako faktu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P8-I03 — AI Myth Buster UX

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P8-I02  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I03-T01` Dodaj ekran pytania, streaming lub progress oraz odpowiedź z evidence level.
- [ ] `P8-I03-T02` Pokaż źródła, rok i ograniczenia, odróżnij AI od treści redakcyjnych.
- [ ] `P8-I03-T03` Dodaj przycisk zgłoszenia nieścisłości.
- [ ] `P8-I03-T04` Dodaj czytelne braki wyniku i retry.

**Weryfikacja:**

- [ ] `P8-I03-V01` Testy wyświetlania cytowań, pustych odpowiedzi i dostępności.

**Definition of Done:** Użytkownik wie skąd pochodzi każda istotna teza AI. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P8-I04 — Safety, adversarial tests & cost controls

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P8-I02, P8-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I04-T01` Dodaj medyczne guardrails, kryzysowe przekierowanie do pomocy i PII redaction.
- [ ] `P8-I04-T02` Przetestuj prompt injection w dokumentach i wejściu użytkownika.
- [ ] `P8-I04-T03` Dodaj limity tokenów, kosztów i telemetrię bez wrażliwych pytań.
- [ ] `P8-I04-T04` Wprowadź bezpieczny fallback w awariach LLM.

**Weryfikacja:**

- [ ] `P8-I04-V01` Uruchom eval set: źródła, odmowy, bezpieczeństwo, koszt.
- [ ] `P8-I04-V02` Raportuj wynik bez fałszywej „100% dokładności”.

**Definition of Done:** Wiadomo kiedy system ma odmówić i jaki jest poziom jakości. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P8-I05 — Staging eval, human review & Phase 8 gate

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P8-I04  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P8-I05-T01` Uruchom testy porównawcze na różnych modelach i wersjach corpus.
- [ ] `P8-I05-T02` Zatwierdź minimalny poziom jakości z ekspertami redakcyjnymi.
- [ ] `P8-I05-T03` Włącz staged rollout/feature flag z możliwością wyłączenia.
- [ ] `P8-I05-T04` Udokumentuj proces aktualizacji wiedzy i odpowiedzi AI.

**Weryfikacja:**

- [ ] `P8-I05-V01` Przeprowadź e2e, regresję i ręczną kontrolę próbki.
- [ ] `P8-I05-V02` Zapisz progi jakości i wyniki.

**Definition of Done:** AI dostępne tylko po zaliczeniu ewaluacji i przeglądu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 8

- [ ] Wszystkie obowiązkowe iteracje Phase 8 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 9 — Global launch, City Guides i skalowanie

**Status fazy:** TODO  
**Cel:** Międzynarodowe wdrożenie dopasowane do miast, lokalizacji i jakości partnerów.  
**Zależności:** Phase 1 + Phase 2 i potwierdzone KPI; funkcje płatności tylko tam, gdzie Phase 4 i przepisy na to pozwalają.  
**Raport główny:** §2, §4, §12, §16, §22, §25  
**Iteracje:** 7

## P9-I00 — Pilot city selection & go-to-market

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I06, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I00-T01` Wybierz 2–3 miasta pilotażowe na podstawie realnych partnerów sober nightlife.
- [ ] `P9-I00-T02` Zdefiniuj KPI event coverage, retencję i konwersję.
- [ ] `P9-I00-T03` Zaplanuj źródła eventów i moderację lokalną.
- [ ] `P9-I00-T04` Ustal operacyjne koszty oraz zakres pilota.

**Weryfikacja:**

- [ ] `P9-I00-V01` Walidacja partnerów i danych zamiast teoretycznego zasięgu.

**Definition of Done:** Istnieje realny, obsługiwalny rynek pilotażowy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I01 — International content & localization

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I00  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I01-T01` Rozszerz tłumaczenia UI i redagowanych treści bez automatycznego przekłamywania badań.
- [ ] `P9-I01-T02` Dodaj fallback dla języka artykułu i opisów organizatora.
- [ ] `P9-I01-T03` Przetestuj teksty długie, formaty dat, pluralizacje i a11y.
- [ ] `P9-I01-T04` Przygotuj regionalne informacje prawne i wsparcie.

**Weryfikacja:**

- [ ] `P9-I01-V01` Test EN/PL plus docelowy język pilota, regresja UI.

**Definition of Done:** Język i dane są spójne oraz zrozumiałe w wybranym regionie. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I02 — Timezones, currencies & regional rules

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I00, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I02-T01` Zweryfikuj modele stref IANA, DST, ceny i waluty ISO 4217.
- [ ] `P9-I02-T02` Dodaj lokalny formatting do eventów i checkoutu.
- [ ] `P9-I02-T03` Sprawdź ograniczenia operatorów płatności per kraj.
- [ ] `P9-I02-T04` Zadbaj o walidację i logowanie zdarzeń strefowych.

**Weryfikacja:**

- [ ] `P9-I02-V01` Test DST, cross-border booking, walut i formatów.

**Definition of Done:** Zagraniczne wydarzenia mają poprawne terminy i ceny. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I03 — Soberity City Guides & curation

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I00, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I03-T01` Dodaj przewodniki sober nightlife i aktywności per miasto.
- [ ] `P9-I03-T02` Rozdziel 100% alcohol-free od sober-friendly i pokaż źródła/aktualność.
- [ ] `P9-I03-T03` Zbuduj workflow redakcji/partnerów i moderacji.
- [ ] `P9-I03-T04` Dodaj raportowanie nieaktualnych miejsc.

**Weryfikacja:**

- [ ] `P9-I03-V01` Testy wygasłych danych, profili i ukrywania wpisów.

**Definition of Done:** City Guide jest użyteczny i zawiera aktualne, zweryfikowane miejsca. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I04 — Web SEO, deep links & acquisition funnel

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I01–P9-I03  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I04-T01` Zadbaj o crawlability i indexability webowych eventów/miast.
- [ ] `P9-I04-T02` Zaimplementuj poprawne deep linki do aplikacji.
- [ ] `P9-I04-T03` Dodaj wyjaśnienia bezpiecznego zakupu biletów i routing użytkownika.
- [ ] `P9-I04-T04` Mierz przejścia web→mobile i odkrycie eventu bez śledzenia wrażliwego.

**Weryfikacja:**

- [ ] `P9-I04-V01` Test linków bez aplikacji, canonical urls, metadata i a11y.

**Definition of Done:** Odkrywanie miasta przez web prowadzi do użytecznej aplikacji. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I05 — Partner operations & regional moderation

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I03, P5-I05 jeśli Community uruchomiona  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I05-T01` Zbuduj proces partnerów: onboarding, aktualizacja, zgłoszenia i support.
- [ ] `P9-I05-T02` Przygotuj procedury sporów, anulowań i fraud w zależności od dostępnego checkoutu.
- [ ] `P9-I05-T03` Zdefiniuj SLA moderacji i kontaktów, regionalne obowiązki.
- [ ] `P9-I05-T04` Opracuj operacyjne metryki jakości katalogu.

**Weryfikacja:**

- [ ] `P9-I05-V01` Symulacja anulowania eventu i skargi użytkownika.
- [ ] `P9-I05-V02` Sprawdzenie dostępu personelu.

**Definition of Done:** Regionalni partnerzy są obsługiwani w powtarzalny sposób. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P9-I06 — Load, observability & international go/no-go

**Status:** TODO  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P9-I00–P9-I05  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P9-I06-T01` Uruchom load i disaster recovery dla backendu i DB.
- [ ] `P9-I06-T02` Ustal alerting, metryki kosztów, konwersji i jakości treści per miasto.
- [ ] `P9-I06-T03` Udokumentuj proces rollout/rollback i flagi funkcji.
- [ ] `P9-I06-T04` Zweryfikuj zgodność prawną i macierz web/iOS/Android dla pilota.

**Weryfikacja:**

- [ ] `P9-I06-V01` Wyniki load test, backup restore, security i user acceptance.
- [ ] `P9-I06-V02` Decyzja GO/NO-GO.

**Definition of Done:** Globalny rollout opiera się na danych i sprawdzonym planie operacyjnym. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 9

- [ ] Wszystkie obowiązkowe iteracje Phase 9 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# 4. Stała macierz testów cross-platform (uzupełnij po wykonaniu)

| Scenariusz Phase 0 | Web | iOS Simulator | Android Emulator | Dowód / data |
|---|---|---|---|---|
| Start i nawigacja Expo | PASS | PASS | PASS | 2026-10-29: Chromium desktop/mobile 4/4; iPhone 17e iOS 26.5 development build + manualne potwierdzenie właściciela; Medium_Phone API 37 Expo Go, ADB/UIAutomator 3 trasy i powroty. Własny APK Android NOT VERIFIED. |
| Sign up i logowanie | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Weryfikacja e-mail / refresh | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Przywracanie sesji / logout | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Forgot/reset password | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Change password/e-mail, reauth | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| GET/PATCH profilu | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Delete account | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |
| Backend ACL i invalid token | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | — |

Wartości: `PASS`, `FAIL`, `BLOCKED`, `N/A` (z uzasadnieniem), `NOT VERIFIED`. Nie zamieniaj `NOT VERIFIED` na `PASS` bez rzeczywistego uruchomienia testu. Wyniki szczegółowe umieszczaj w `docs/testing/`.

# 5. Aktualny punkt pracy

- **Aktualna faza:** Phase 0
- **Aktualna iteracja:** `P0-I03 — Design system, navigation & i18n`
- **Status:** DONE — T01–T04 i V01–V02 zweryfikowane 2026-10-31; bramka Phase 0 pozostaje niezamknięta.
- **Następna iteracja po akceptacji:** `P0-I04 — Spring Boot, PostgreSQL & API skeleton`
- **Otwarte blokery:** brak dla P0-I03. Pełna manualna nawigacja dotykiem na iOS Simulator/Android Emulator NOT VERIFIED przez agenta (brak narzędzia do syntetycznych gestów); render, i18n i guard tras zweryfikowano zrzutami ekranu i deep-linkami. Android development APK nadal NOT VERIFIED (brak platformy SDK 37, z P0-I02). Firebase/EAS/hosting poza zakresem, NOT VERIFIED.
- **Wymagana akceptacja:** osobne polecenie rozpoczęcia P0-I04. `/docs` zachowano w .gitignore na polecenie właściciela.
- **Ostatni potwierdzony wynik testów:** `pnpm run check` (lint+typecheck+format+secrets) exit 0; Jest 6/6 suites, 15/15 PASS; Playwright web 6/6 PASS (desktop+mobile-web, nowy test guardu tras); `pnpm run build` i `export:native` exit 0. iOS Simulator (Expo Go 58.0.7) i Android Emulator (Expo Go 58.0.5): render + i18n + deep-linki `/account`, `/verification-pending` PASS; pełna nawigacja dotykiem NOT VERIFIED (brak narzędzia do gestów w środowisku agenta).

# 6. Dziennik sesji agenta (dopisuj po każdej sesji)

| Data (YYYY-MM-DD) | Iteracja | Wynik | Zmienione pliki / testy / dowody | Blokery i następne kroki |
|---|---|---|---|---|
| — | — | Utworzono plan iteracyjny; brak potwierdzonych prac implementacyjnych | — | Rozpocznij `P0-I00` |
| 2026-10-29 | P0-I00 | Audyt i propozycje gotowe; T01–T04, V01–V02 zweryfikowane dokumentacyjnie; status BLOCKED, DoD niezatwierdzony | docs/architecture/P0-I00-audit.md, docs/adr/001–003, docs/testing/P0-I00-results.md, PHASES.md, CHANGELOG.md; kontrola repo, wersji narzędzi, oficjalnych macierzy i dokumentacji | Właściciel: decyzje D1–D4, w tym rozbieżność JUnit. Android wymaga naprawy przed testami. Następna P0-I01 wyłącznie po odrębnym poleceniu. |

| 2026-10-29 | P0-I00 | Właściciel zatwierdził D1–D4; DoD spełnione, DONE | ADR-001–003 ACCEPTED, audyt i raport uzupełnione o zapis akceptacji; historyczne wyniki pozostawiono jawne | Zlecono P0-I01; katalog docs lokalny na wyraźne polecenie właściciela |
| 2026-10-29 | P0-I01 | DONE; T01–T04 i V01–V02 zweryfikowane | apps/consumer, packages, backend/pom.xml i wrapper, infra/compose, konfiguracje root, lockfile, scripts, README, PHASES, CHANGELOG; lokalnie docs/testing/P0-I01-results.md. Bootstrap czystej kopii i powtórzenie, pnpm check/build/-r lint, Maven verify — exit 0; negatywne scenariusze narzędzi i konfiguracji PASS | Brak blokera P0-I01; brak testów platform (brak aplikacji). P0-I02 wyłącznie po kolejnym poleceniu; Android do sprawdzenia. |

# 7. Wzór raportu kończącego sesję Codex

```text
ITERATION: P0-I00
STATUS: TODO / IN_PROGRESS / BLOCKED / DONE
IMPLEMENTED: [konkretne ID zadań + skrót]
CHANGED FILES: [ścieżki]
TESTS: [komendy, wynik, ewentualne urządzenie/środowisko]
PLATFORM COVERAGE: web=PASS/NOT VERIFIED, iOS=PASS/NOT VERIFIED, Android=PASS/NOT VERIFIED
EVIDENCE: [konkretne linki / ścieżki / logi]
BLOCKERS: [brak lub dokładne wymagane czynności]
ADR: [ścieżki lub brak]
CHANGELOG: [wpis z datą lub pominięto: powód]
NEXT: [kolejny ID, tylko do zaakceptowania przez właściciela]
```

# 8. Wymagania globalne i kryteria jakości

- **Misja:** aktywnie wspieraj wybór życia bez alkoholu, bez moralizowania ani zawstydzania. Wiedza naukowa i społeczność/eventy są równie ważne; najważniejszy rodzaj wydarzeń to sober party/rave, poszerzony o sober lifestyle.
- **Wiarygodność:** każde twierdzenie naukowe ma źródło, poziom pewności, rok/dataset i ograniczenia. Nie przedstawiaj wyników badań obserwacyjnych jako dowodu przyczynowości ani dowodów populacyjnych jako prognozy dla osoby.
- **Dostępność i internacjonalizacja:** web/iOS/Android, minimum en/pl od startu, poprawne daty i strefy IANA, waluty ISO, klawiatura i podstawowa obsługa screen reader.
- **Bezpieczeństwo:** weryfikacja tożsamości na backendzie, zasada najmniejszych uprawnień, walidacja wejścia, rate limiting, testy authz, minimalizacja PII, bez sekretów w repo.
- **Observability:** użyteczne metryki, logi bez PII/tokenów, kontrola błędów i kosztów. Dane o abstynencji/zdrowiu nie są domyślnym warunkiem korzystania z aplikacji.
- **Środowiska:** żadnego udawania gotowych funkcji, zatwierdzonych publikacji, przetestowanych platform, prawdziwych eventów, zakupionych biletów ani działań produkcyjnych.
- **Regresje:** testy przy każdej iteracji, wymogi gate przed zamknięciem fazy i konkretne zapisy w `CHANGELOG.md` dla rzeczywiście ukończonych większych zmian.

| 2026-10-29 | P0-I02 | DONE; T01–T04 i V01–V02 zweryfikowane | apps/consumer: Expo Router/TS, start, jawne placeholdery, Playwright; lockfile, README, ignore, PHASES, CHANGELOG. Frozen install/check/build/export PASS, Doctor 20/20, web 4/4; iOS development build/start i manualna nawigacja właściciela; Android Expo Go/ADB wszystkie trasy i powroty. Lokalne XML/screenshoty i raport w docs/testing/P0-I02. | Brak blokera iteracji; własny APK Android NOT VERIFIED, brak platformy SDK 37. Nie uruchomiono P0-I03. /docs nadal ignorowane. |
| 2026-10-31 | P0-I03 | DONE; T01–T04 i V01–V02 zweryfikowane | `packages/design-tokens` (tokeny), `apps/consumer/src/ui/*` (Screen/Button/TextField/Alert/LoadingState/EmptyState + testy Jest), `apps/consumer/src/auth/AuthStatusContext.tsx` (stub, zawsze `guest`) + test, `apps/consumer/app/_layout.tsx` i nowe grupy tras `(public)`/`(authenticated)`/`verification-pending` (Expo Router `Stack.Protected`), `apps/consumer/src/i18n/*` (i18next/react-i18next/expo-localization, en/pl) + test parzystości kluczy, przepisane `WelcomeScreen`/`UnavailableScreen`/nowy `VerificationPendingScreen`/`+not-found`, zaktualizowany `tests/web/navigation.spec.ts`, `babel.config.cjs`, `jest.config.cjs`, `eslint.config.mjs` (globale dla `.cjs`), README konsumenta, PHASES, CHANGELOG. `pnpm run check` exit 0; Jest 6/6 suites (15/15) PASS; Playwright web 6/6 PASS; `pnpm run build` + `export:native` exit 0; manualnie na iOS Simulator i Android Emulator (Expo Go dopasowane do SDK 58): render, i18n wg lokalizacji urządzenia i guard `/account`+`/verification-pending` (deep-linki) PASS na obu platformach. | Brak blokera iteracji. Nawigacja dotykiem na symulatorach NOT VERIFIED przez agenta (brak narzędzia do gestów) — do potwierdzenia manualnie przez właściciela. `expo-doctor` 19/20 z powodu niezwiązanego z tą iteracją patch-rozjazdu `expo`/`expo-router`/`expo-dev-client`. Nie uruchomiono P0-I04. |
