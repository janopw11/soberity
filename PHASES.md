# Soberity — PHASES.md

**Wersja:** 2.1 — 2026-11-01
**Status globalny:** IN_PROGRESS — aktywna Phase 2: P2-I03 IN_PROGRESS (szczegóły/linki/kalendarz, NOT VERIFIED), P2-I00–P2-I02 nadal IN_PROGRESS / NOT VERIFIED, 0/7 DONE. Phase 1: P1-I00–P1-I02 i P1-I04 DONE (4/6), P1-I03 IN_PROGRESS, P1-I06 TODO / Myth Battle PARKED na polecenie właściciela. Phase 0: 13/15 DONE; P0-I03A IN_PROGRESS i P0-I13 BLOCKED pozostają otwarte.
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
| Phase 0 | Foundation — Expo, Spring Boot, Firebase Auth i profil | 15 | 13/15 | IN_PROGRESS |
| Phase 1 | Science & Discover MVP | 6 | 4/6 | IN_PROGRESS |
| Phase 2 | Sober Events — katalog, organizerzy, kontakt | 7 | 0/7 | IN_PROGRESS |
| Phase 3 | Retention, gry, personalizacja i powiadomienia | 7 | 0/7 | TODO |
| Phase 4 | Organizer marketplace, bilety, płatności i QR | 9 | 0/9 | TODO |
| Phase 5 | Community — grupy, posty, interakcje i moderacja | 7 | 0/7 | TODO |
| Phase 6 | World Map — dane o spożyciu alkoholu | 8 | 0/8 | TODO |
| Phase 7 | Brain Lab / Body Lab — edukacja interaktywna | 6 | 0/6 | TODO |
| Phase 8 | AI Myth Buster & evidence-grounded search | 6 | 0/6 | TODO |
| Phase 9 | Global launch, City Guides i skalowanie | 7 | 0/7 | TODO |

**Łącznie:** 78 iteracji agentowych; wykonane: **17/78** (2026-10-29: P0-I00 zaakceptowane; P0-I01 i P0-I02 zweryfikowane; 2026-10-31: P0-I03 zweryfikowane; 2026-11-01: P0-I04 i P0-I05 zweryfikowane/zamknięte, P0-I06 DONE; 2026-11-02: P0-I07, P0-I08, P0-I09 i P0-I10 DONE; 2026-11-03: P0-I11 DONE według zastanego statusu właściciela; P0-I12 DONE po potwierdzeniu manualnych testów T01–T03 przez właściciela; P1-I00 DONE po migracjach i testach PostgreSQL; P1-I01 DONE po testach publicznego API i ACL; P1-I02 DONE po testach workflow, ról i panelu web).

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
| P0.1 | P0-I01–P0-I03 + P0-I03A | Expo na 3 platformach, UI, routing, i18n i akceptacja docelowego kierunku UI |
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
**Iteracje:** 15

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
- Uproszczenie menu 2026-10-31 (aktualne, T02/T03/T04): dokładnie osiem głównych pozycji w kolejności właściciela — Main page, Science & Discover, Sober Events, Sober Games, Soberity (community), World Map, Brain Lab, Myth Buster. Usunięto grupy i szczegółowe funkcje; zachowano ☰, emoji i brak podpisów Planowane. `navigation.ts`, SideMenu, EN/PL i testy zaktualizowane. `pnpm run check` PASS; Playwright 10/10 PASS (desktop/mobile-web, EN/PL, dokładna liczba pozycji, widoczność, nawigacja, zamykanie i guardy); kontrola zrzutu mobile-web PASS. Natywne runtime tej korekty NOT VERIFIED. Zastępuje wcześniejszą listę 45 pozycji; brak nowych zadań/checkboxów i zmiany historycznego DONE.
- Aktualna korekta 2026-10-31 (T02/T03/T04): menu domyślnie ukryte, otwierane przyciskiem trzech kresek w lewym górnym rogu nagłówka; modal zamykany wyborem dostępnej trasy, ponownym przyciskiem ☰, tłem lub Back/Escape. Wszystkie 44 funkcje + Home zachowano; skróty zastąpiono pasującymi emoji, usunięto podpisy Planowane również z etykiet a11y. Niewdrożone funkcje nadal nieaktywne. Ta decyzja zastępuje stały panel opisany poniżej. Check PASS; Jest 15/15 PASS; build web + export:native PASS. Playwright: 6 testów bazowych PASS w pełnym przebiegu; po korekcie asercji aktywnej pozycji dla RN Web powtórzono 4 testy menu (desktop/mobile-web, EN/PL) — 4/4 PASS. Kontrola zrzutu PL mobile-web PASS. Nowe menu runtime iOS/Android, VoiceOver/TalkBack i duży font NOT VERIFIED; na obu platformach otworzyć ☰, przewinąć listę emoji, przejść Science↔Sober Events, sprawdzić zamykanie i czytnik ekranu.
- Doprecyzowanie nawigacji 2026-10-31 (T02/T03/T04): stały panel obok treści, domyślnie rozwinięty; zwinięcie pozostawia pasek 64 dp. Bez modala, zamykania i przycisku „Zamknij menu”; stan zachowany przy zmianie publicznej sekcji. `src/navigation.ts` mapuje 44 funkcje produktowe do iteracji PHASES.md, dodatkowo Home; 11 grup, EN/PL, niewdrożone pozycje nieaktywne ze statusem Planowane. Nazwa Events rozdzielona od Community: Sober Events (P2) oraz osobna grupa Community (P5). `pnpm run check` PASS, Jest 6/6 suites i 15/15 PASS, Playwright 10/10 PASS (desktop/mobile-web, EN/PL, domyślne rozwinięcie, zwijanie bez ukrycia, zachowanie stanu między trasami, planowane funkcje, guardy), `pnpm run build` i `export:native` PASS. Zrzuty menu web sprawdzono wizualnie. Runtime iOS/Android oraz VoiceOver/TalkBack i duży font **NOT VERIFIED**; na urządzeniu uruchomić Expo, sprawdzić menu rozwinięte/zwinięte, niezależny scroll, Science↔Sober Events i czytnik ekranu. Ta zmiana zastępuje zachowanie modala opisane w poprzedniej korekcie poniżej.
- Korekta nawigacji 2026-10-31 na polecenie właściciela (T02/T03/T04): wspólne menu boczne w nagłówku publicznych sekcji, aktywna sekcja, zamykanie przyciskiem/tłem/Escape/Android Back przez Modal; usunięto kafelki nawigacyjne. EN/PL, min. 48, focus i przewijanie. `pnpm run check` PASS; Jest 6/6 suites, 15/15 PASS; Playwright 10/10 PASS (desktop/mobile-web, EN/PL, menu i guardy); `pnpm run build` + `export:native` PASS. Nowe menu na iOS/Android runtime: **NOT VERIFIED** — brak uruchomionych urządzeń (`simctl list devices booted`, `adb devices`). Do potwierdzenia: uruchomić Expo na obu platformach, otworzyć menu, przejść Science↔Events, zamknąć przyciskiem/tłem/Android Back, sprawdzić VoiceOver/TalkBack i duży font. Historyczne DONE dotyczy pierwotnej weryfikacji P0-I03; korekta wymaga jeszcze tej weryfikacji natywnej.
- `AuthStatusContext` to świadomy stub (zawsze `guest`, bez sieci/trwałości) — rzeczywiste logowanie, sesja i Firebase ID token to zakres P0-I05/P0-I06; weryfikacja e-maila to P0-I07. Nie fabrykowano żadnych ekranów spoza tej iteracji.
- Pełne przejście po trasach dotykiem (tap-through) na iOS Simulator nie zostało zautomatyzowane przez agenta (brak narzędzia do syntetycznych gestów dotyku w tym środowisku) — zweryfikowano render i i18n wizualnie oraz guard przez deep-linki `exp://...`; pełna manualna nawigacja dotykiem pozostaje do potwierdzenia przez właściciela, analogicznie do P0-I02.
- `npx expo-doctor` raportuje 1/20 (patch-level rozjazd `expo`/`expo-router`/`expo-dev-client` o jedną wersję) — rozjazd nie dotyczy żadnej zależności dodanej w tej iteracji i powstał wskutek nowych wydań na rejestrze od czasu P0-I02; nie naprawiano w ramach tego zadania (poza zakresem P0-I03).


## P0-I03A — Docelowy kierunek UI i akceptacja wizualna

**Status:** IN_PROGRESS
**Started:** 2026-11-01
**Finished:** —
**Zależności iteracji:** P0-I03; przed implementacją sprawdź również otwartą weryfikację natywnego menu z korekty P0-I03
**Dowód:** Właściciel zaakceptował 2026-11-01 układ v4 i dwa motywy: domyślna jaśniejsza Śliwka (`plum-soft`), jasny fioletowo-biały (`violet`). Jedyna zachowana referencja: `design/reference/P0-I03A/` — źródła, `palettes.json`, screenshoty, raport testów; audyt T01 w `audit.md`, historyczne wyniki w `history/`. Specyfikacja obu motywów i zasady rozszerzania: `docs/BRANDING.md`. T04 wdrożono: tokeny i komponenty używają obu motywów, dostępne ustawienia lokalne zapisują motyw i język EN/PL; przeprowadzono weryfikację web oraz build/install iOS. Weryfikacje i blokady pozostałe opisano w dzienniku sesji.
**Aktualizacja palety 2026-11-04:** Na polecenie właściciela ciemną Śliwkę zastąpiono motywem Ocean inspirowanym dostarczonym zdjęciem meduzy (granat/błękit/cyjan); jasny motyw pozostaje fioletowo-biały. Tokeny i `docs/BRANDING.md` są bieżącą specyfikacją; referencje w `design/reference/P0-I03A/` zachowują historyczną Śliwkę. Testy kontrastu 2/2 PASS, typecheck PASS, lint zmienionych tokenów PASS; pełny lint zgłasza dwa istniejące błędy no-require-imports w `apps/consumer/metro.config.cjs`. Playwright klawiatura desktop/mobile-web 2/2 PASS; odczyt kolorów, brak overflow i zrzuty ekranu logowania EN/PL przy 390/1440 px PASS, zachowany wybór jasnego motywu PASS. Native runtime NOT VERIFIED (sandbox nie uzyskał połączenia CoreSimulator/ADB). V02/V03 pozostają otwarte.

**Aktualizacja jasnego motywu 2026-11-04:** Właściciel zaakceptował ciemny Ocean i zlecił biały jasny motyw z oceaniczno-niebieskimi akcentami. Wdrożono wspólne tokeny light: białe tło, błękitne powierzchnie, granatowy tekst i niebieskie akcje. Klucz `light` zachowany. Kontrast Jest 2/2 PASS (bez Watchmana), typecheck klienta/tokenów i lint tokenów PASS. Render web/iOS/Android oraz screen readery dla nowej jasnej palety NOT VERIFIED; V02/V03 nadal otwarte.

**Blokery i otwarte prace:** Brak otwartej decyzji o palecie. V02 pozostaje otwarte: nie wykonano kontroli VoiceOver/TalkBack, dużego fontu ani pełnego runtime iOS/Android. V03 pozostaje otwarte: pierwszy Android build zatrzymano przy 535 MiB wolnego miejsca; po wyłączeniu emulatora wolne miejsce wzrosło do 3.8 GiB, lecz pobieranie NDK 27.1.12297006 osiągnęło tylko 136 MiB i zostało zatrzymane przed ukończeniem. Należy dokończyć instalację NDK przez Android SDK Manager lub ponowić pobieranie przy stabilnym łączu i wykonać build/eksport. Historyczna weryfikacja natywnego menu P0-I03 pozostaje do wykonania.

**Cel i kolejność:** Zatwierdzić reprezentatywny wzorzec wizualny przed rozbudową kolejnych ekranów. Iteracja dodana decyzją właściciela 2026-11-01, wykonywana przed P0-I04, bez zmiany historycznych ID i wyników P0-I03. Dodanie do planu nie oznacza rozpoczęcia ani zatwierdzenia projektu UI.

**Zakres zadań:**

- [x] `P0-I03A-T01` Przejrzyj istniejące ekrany, komponenty i tokeny oraz `docs/BRANDING.md`; określ elementy wymagające dopracowania, zachowując fiolet i uzgodnione menu ośmiu sekcji. Historyczny przegląd jasnej bazy wykonano przed wyborem domyślnej Śliwki.
- [x] `P0-I03A-T02` Przygotuj do oceny makiety lub odizolowany podgląd trzech reprezentatywnych ekranów: strony głównej, Science & Discover i Sober Events; każdy w układzie mobilnym i desktopowym. Zachowaj równorzędność Science i Events w produkcie i menu; zgodnie z decyzją właściciela 2026-11-01 Home zawiera tylko powitanie i najnowsze artykuły/badania. Pokaż hierarchię treści, typografię, karty, zdjęcia/ilustracje, odstępy oraz nawigację.
- [x] `P0-I03A-T03` Przedstaw konkretny projekt właścicielowi, zbierz uwagi, dopracuj go i zapisz jego jawną akceptację wraz z datą oraz wskazaniem zaakceptowanej wersji. Akceptacja 2026-11-01: układ v4, `plum-soft` jako default i `violet` jako motyw jasny; referencja `design/reference/P0-I03A/`. Zgoda na palety nie jest dowodem wdrożenia ani testów aplikacji.
- [x] `P0-I03A-T04` Po akceptacji zaktualizuj `docs/BRANDING.md` jako jedyne repozytoryjne źródło zasad UI, tokeny i wspólne komponenty oraz dostosuj istniejące ekrany w granicach wdrożonych funkcji. Zapisz lokalizację zaakceptowanych materiałów referencyjnych. Zaimplementuj osobne zestawy tokenów dark/light, dostępny przełącznik oraz lokalne zapamiętywanie wyboru na web/iOS/Android. Bez zapisanego wyboru domyślna jest Śliwka, niezależnie od ustawień systemu. Dobierz i sprawdź stany success/warning/danger/info w obu motywach; logo i font pozostają tymczasowe. Dodaj dostępny ręczny wybór języka EN/PL i lokalny zapis dla gościa jako podstawę UI; pokaż nazwy języków, nie same flagi. Integracja z profilem PostgreSQL należy do P0-I09; do jej wdrożenia nie sugeruj synchronizacji z kontem.
- [x] `P0-I03A-T05` Zapisz zasady rozszerzania wzorca na kolejne moduły i stan decyzji dotyczących logo/fontu. Tymczasowy tekstowy wordmark i font systemowy mogą pozostać; finalne logo nie blokuje tej iteracji. Zasady zapisano w BRANDING 2026-11-01; dwa motywy dziedziczą kolejne moduły. Logo i font nadal wymagają odrębnej decyzji.

**Granice zakresu:** Makiety Science i Events służą zatwierdzeniu wyglądu, nie wdrożeniu funkcji Phase 1/2. Przykładowe dane oznacz jako demonstracyjne i trzymaj poza produkcyjnymi trasami; nie sugeruj działającego katalogu, quizów ani backendu. Nie publikuj niezweryfikowanych twierdzeń zdrowotnych. Nie projektuj z góry wszystkich przyszłych modułów.

**Weryfikacja:**

- [x] `P0-I03A-V01` Zapisz wizualny odbiór wszystkich sześciu widoków (trzy ekrany × mobile/desktop), uwagi i akceptację właściciela; sprawdź EN/PL, długie teksty, hierarchię i responsywność. Akceptacja właściciela v4 z 2026-11-01; 8 wariantów referencji EN/PL × mobile/desktop × oba motywy sprawdzono skryptem `design/reference/P0-I03A/verify.mjs` — PASS.
- [ ] `P0-I03A-V02` Po wdrożeniu wzorca sprawdź kontrast, focus, klawiaturę, czytniki ekranu, duży font i stany loading/error/empty/disabled stosownie do komponentów. Zweryfikuj menu oraz istniejące ekrany na web/iOS/Android; zapisz urządzenia, wyniki i braki jako NOT VERIFIED wraz z czynnościami do wykonania. Nie deklaruj pełnego odbioru przy niewykonanych obowiązkowych kontrolach.
- [ ] `P0-I03A-V03` Uruchom wymagane dla zmian lint/typecheck, testy komponentów i nawigacji oraz build/eksporty; sprawdź default Śliwka, oba motywy, zmianę motywu, zachowanie wyboru po restarcie/reload i brak regresji przy EN/PL; zapisz wyniki i sprawdź brak regresji routingu oraz guardów.

**Definition of Done:** Właściciel zaakceptował wskazaną wersję projektu; BRANDING, tokeny, komponenty i istniejące ekrany odzwierciedlają ten wzorzec. Makiety przyszłych funkcji pozostają oddzielone od działającego produktu. Wszystkie obowiązkowe zadania i kontrole mają dowody; braki weryfikacji uniemożliwiają DONE. Kolejne moduły rozwijają zatwierdzony wzorzec, a wspólny przegląd przed publicznym MVP odbywa się w P2-I06.

**Porządkowanie materiałów (2026-11-01):** na polecenie właściciela usunięto zbędne `design/previews/P0-I03A-*`. Historia decyzji i wyników w dzienniku jest zachowana; dawne ścieżki w wpisach historycznych opisują pliki istniejące w tamtym momencie. Aktualne źródła, audyt, dowody i zatwierdzone dwa motywy znajdują się wyłącznie w `design/reference/P0-I03A/`.

## P0-I04 — Spring Boot, PostgreSQL & API skeleton

**Status:** DONE  
**Started:** 2026-11-01  
**Finished:** 2026-11-01  
**Zależności iteracji:** P0-I01, P0-I03A (uzgodniona kolejność prac)
**Dowód:** `docs/testing/P0-I04-results.md` (lokalnie): `./mvnw --batch-mode verify` exit 0 (3 unit + 15 IT Testcontainers); `docker compose up` z healthy Postgres i backendem; probes 200; anonimowe 401 problem+json z correlationId; OpenAPI 200; dwie repliki; `docker stop` z graceful shutdown; brak `.env`/hasła w obrazie; `pnpm check` exit 0.  
**Blokery:** brak blokerów dla backendu. Port 5432 na hoście był zajęty: compose używa `SOBERITY_POSTGRES_PORT`. P0-I03A V02/V03 nadal otwarte. Flaga `SPRING_FLYWAY_ENABLED=false` nie była uruchamiana osobno.

**Zakres zadań:**

- [x] `P0-I04-T01` Skonfiguruj Spring Boot Java 21: Web, Security, Validation, JPA, Flyway, Actuator i OpenAPI.
- [x] `P0-I04-T02` Dodaj moduły identity/profile/common oraz PostgreSQL w Docker Compose.
- [x] `P0-I04-T03` Utwórz migrację profilu z firebaseUid i indeksami, bez haseł/tokenów. Przewidź nullable `locale` jako preferencję języka użytkownika (`en`/`pl` na start), zgodnie z raportem §7; brak wartości oznacza brak zapisanego wyboru. Obsługa GET/PATCH i synchronizacja klienta w P0-I09.
- [x] `P0-I04-T04` Dodaj Problem Details, correlation ID i bezpieczne logowanie.
- [x] `P0-I04-T05` Dodaj profile local/test/staging i CORS.
- [x] `P0-I04-T06` Przygotuj Kubernetes-ready architecture
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

- [x] `P0-I04-V01` Uruchom compose i healthcheck.
- [x] `P0-I04-V02` Testcontainers: migracja, unikalność UID, podstawowe 400/401.
- [x] `P0-I04-V03` Sprawdź OpenAPI.
- [x] `P0-I04-V04` Zweryfikuj Kubernetes-ready architecture:
  - Backend uruchamia się z konfiguracją ENV.
  - Health/readiness endpoints działają.
  - Graceful shutdown kończy aktywne żądania.
  - Można uruchomić dwie instancje backendu
    bez konfliktów portów i współdzielonego stanu.
  - Brak sekretów w repozytorium i obrazie Docker.

**Definition of Done:** Backend startuje, DB migruje, endpointy mają spójne kontrakty. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I05 — Firebase project & backend token verification

**Status:** DONE (zamknięte 2026-11-01 decyzją właściciela; T01 odroczone)  
**Started:** 2026-11-01  
**Finished:** 2026-11-01  
**Zależności iteracji:** P0-I04  
**Dowód:** `docs/testing/P0-I05-results.md` (lokalnie): `./mvnw verify` exit 0 (3 unit, 21 IT); emulator E2E: nieweryfikowany e-mail 403, prawidłowy 200, wygasły/obcy projekt/obcy issuer/śmieciowy/brak tokena 401; projekt dev `soberity-f9e4b`: prawdziwy token zaakceptowany przez Google'owe klucze (aud=soberity-f9e4b), zmodyfikowany token odrzucony, testowe konto usunięte.  
**Blokery:** brak. T01 (staging/prod) odroczone przez właściciela do momentu podania ID projektów; wymagane przed wdrożeniem staging/prod. Ten punkt nie jest zaznaczony.

**Zakres zadań:**

- [ ] `P0-I05-T01` Zdefiniuj konfiguracje Firebase dev/staging/prod i manualne kroki w konsoli.
- [x] `P0-I05-T02` Włącz Email/Password, e-mail verification, domeny i action links (dev `soberity-f9e4b`; staging/prod NOT VERIFIED).
- [x] `P0-I05-T03` Skonfiguruj Firebase Admin SDK przez bezpieczne poświadczenia (ADC; dev `soberity-f9e4b` zweryfikowany).
- [x] `P0-I05-T04` Dodaj filtr Spring Security weryfikujący podpis, issuer, audience, exp i projekt (dev `soberity-f9e4b`, test na koncie testowym).
- [x] `P0-I05-T05` Zdefiniuj zasady email_verified i role zaufane.

**Weryfikacja:**

- [x] `P0-I05-V01` Testuj brak/wadliwy/wygasły/obcy token: 401.
- [x] `P0-I05-V02` Testuj ograniczony dostęp do prywatnego endpointu i brak eskalacji roli.

**Definition of Done:** Backend nie ufa UID ani roli dostarczonej z klienta; brak sekretów w repo. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I06 — Cross-platform Auth adapter, signup & login

**Status:** DONE  
**Started:** 2026-11-01  
**Finished:** 2026-11-01  
**Zależności iteracji:** P0-I03, P0-I05  
**Dowód:** kod: `apps/consumer/src/auth/` (adapter Firebase web/native, `AuthStatusContext`, `identityApi`, walidacja, mapowanie błędów), ekrany `SignInScreen`/`SignUpScreen`/`OfflineScreen`/`AccountScreen`, trasy `app/(public)/sign-in|sign-up` i `app/(authenticated)/index.tsx`. Weryfikacja: `pnpm run check` PASS; Jest 9/9 suites, 40/40 PASS; web export PASS. V02 (web, konto dev `soberity-f9e4b`): logowanie → strefa zalogowana, wylogowanie, błędne hasło i ekran offline sprawdzone ręcznie przez właściciela. V03: potwierdzone przez właściciela jako PASS (urządzenie i wersja OS do uzupełnienia w `docs/testing/P0-I06-results.md`). Szczegóły: `docs/testing/P0-I06-results.md` (lokalnie).  
**Blokery:** brak. Do uzupełnienia dowodu: nazwa platformy i wersja OS dla V03.

**Zakres zadań:**

- [x] `P0-I06-T01` Wybierz i zaimplementuj zgodną wersję Firebase JS SDK oraz persystencję osobno web/native. (`firebase@^13.1.0`; `firebaseInstance.web.ts` / `.native.ts`; typy dla `getReactNativePersistence` w `firebase-react-native.d.ts`.)
- [x] `P0-I06-T02` Zaimplementuj AuthProvider, nasłuch stanu, loading, token refresh. (`onIdTokenChanged`, stany `loading | guest | verification-pending | authenticated | offline`, ochrona przed nieaktualnymi odpowiedziami.)
- [x] `P0-I06-T03` Utwórz rejestrację i logowanie email/hasło oraz walidację. (Ekrany + `validation.ts`, testy `validation.test.ts`.)
- [x] `P0-I06-T04` Zapewnij czytelne komunikaty błędów i ekran braku sieci. (`errors.ts`, testy `errors.test.ts`; `OfflineScreen` z ponowieniem.)
- [x] `P0-I06-T05` Nie przedstawiaj fałszywego zalogowania bez backendu. (`authenticated` tylko po HTTP 200 z `/api/v1/identity/me`; 403 → weryfikacja; 401 → wylogowanie; błąd sieci/5xx → offline.)

**Weryfikacja:**

- [x] `P0-I06-V01` Testuj formularze i adapter. (Jest 40/40, w tym provider z fałszywym adapterem i `identityApi` zamockowanym.)
- [x] `P0-I06-V02` Smoke test konta dev na web. — PASS 2026-11-01 (przeglądarka, `http://localhost:8082`, konto dev `soberity-f9e4b` z potwierdzonym e-mailem): logowanie, wylogowanie, błędne hasło, ekran offline. Naprawiono brak trasy indeksowej `(authenticated)/index.tsx`.
- [x] `P0-I06-V03` Powtórz na dostępnych emulatorach. — PASS wg właściciela 2026-11-01 (co najmniej jedna platforma; szczegóły do uzupełnienia).


**Definition of Done:** Realna rejestracja i logowanie Firebase, spójny stan AuthProvider. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I07 — Email verification end-to-end

**Status:** DONE
**Started:** 2026-11-02
**Finished:** 2026-11-02
**Zależności iteracji:** P0-I06
**Dowód:** klient: `apps/consumer/src/auth/authAdapter.ts` wysyła wiadomość po rejestracji, obsługuje resend, reload i wymuszone odświeżenie ID tokena; `VerificationPendingScreen` ma cooldown 60 s i odświeżenie statusu; trasa `apps/consumer/app/verify-email.tsx` obsługuje brak/nieważny link i ma ścieżki powrotu. Weryfikacja automatyczna: `pnpm check` PASS, Jest 41/41 PASS, eksport web PASS, backend `./mvnw --batch-mode test` PASS (`FirebaseAuthIT`: 403 dla niezweryfikowanego konta). Weryfikacja ręczna właściciela 2026-11-02 (web, dev `soberity-f9e4b`): mail z kodem wysłany, kliknięcie linku potwierdza konto, po weryfikacji logowanie działa i udziela dostępu.
**Blokery:** brak. Smoke test na iOS/Android NOT VERIFIED (poza zakresem zgłoszenia).

**Zakres zadań:**

- [x] `P0-I07-T01` Wysyłaj mail weryfikacyjny po rejestracji.
- [x] `P0-I07-T02` Dodaj ekran oczekiwania, resend z ograniczeniem częstotliwości.
- [x] `P0-I07-T03` Obsłuż action links i odświeżenie statusu email_verified.
- [x] `P0-I07-T04` Ustal backendowe ograniczenia dla kont niezweryfikowanych. (Backend z P0-I05: 403 dla `ROLE_UNVERIFIED`, test `FirebaseAuthIT`.)
- [x] `P0-I07-T05` Dokumentuj zachowanie web, mobile i ograniczenia emulatorów.

**Weryfikacja:**

- [x] `P0-I07-V01` Przetestuj poprawny/wygasły link, resend oraz aktualizację tokena. (Ręcznie przez właściciela na web 2026-11-02: poprawny link, wygasły link, ponowne wysłanie, aktualizacja tokena.)
- [x] `P0-I07-V02` Sprawdź niedostępność chronionych funkcji przed weryfikacją. (Niezweryfikowane konto trafia na ekran oczekiwania; backend zwraca 403 — `FirebaseAuthIT`.)

**Definition of Done:** Rejestracja → mail → weryfikacja → udzielony dostęp działa. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I08 — Session restore, logout & password reset

**Status:** DONE  
**Started:** 2026-11-02  
**Finished:** 2026-11-02  
**Zależności iteracji:** P0-I06, P0-I07  
**Dowód:** kod: `authAdapter.ts` (reset przez `sendPasswordResetEmail` z ignorowaniem `auth/user-not-found`, `verifyPasswordResetCode`, `confirmPasswordReset`), `AuthStatusContext.tsx` (`signOut` przechodzi do `guest` natychmiast i unieważnia późniejsze odpowiedzi backendu), `ForgotPasswordScreen.tsx` (`/forgot-password`, jednakowy komunikat dla każdego adresu), `ResetPasswordScreen.tsx` (`/reset-password`: sprawdzenie kodu przed formularzem, stany wygasły/nieprawidłowy/offline z ponowieniem, sukces), link na ekranie logowania, EN/PL. Testy automatyczne: `pnpm check` PASS, Jest 46/46 PASS (restore przy starcie, logout z późną odpowiedzią backendu, adapter: brak enumeracji i błędy inne niż `user-not-found`), eksport web PASS. Ręczna weryfikacja właściciela 2026-11-02 na web (localhost, projekt dev `soberity-f9e4b`): pełny przepływ resetu przez mail i stronę Firebase; nasz ekran `/reset-password` z `oobCode` z maila; odświeżenie/restart z przywróceniem sesji; wylogowanie; wygasły/zużyty kod pokazuje komunikat.  
**Blokery:** brak. Konfiguracja action URL w konsoli Firebase nie jest wymagana na localhost (domyślny handler). Hosted domain i deep-linki iOS/Android NOT VERIFIED — poza zakresem tej iteracji.

**Zakres zadań:**

- [x] `P0-I08-T01` Przywracaj sesję po restartach/odświeżeniu i rozstrzygaj stan startowy. (Firebase przywraca sesję, backend ustala stan; test regresyjny bez ponownego logowania.)
- [x] `P0-I08-T02` Dodaj logout z wyczyszczeniem prywatnego stanu/cachu. (Stan lokalny czyszczony od razu; aplikacja nie ma innego cache prywatnych danych.)
- [x] `P0-I08-T03` Dodaj forgot/reset password z ochroną przed enumeracją.
- [x] `P0-I08-T04` Zadbaj o expired links, offline i retry UI.

**Weryfikacja:**

- [x] `P0-I08-V01` Testuj odświeżenie web i restart app, logout, reset hasła. (Ręcznie właściciel 2026-11-02, web/localhost.)
- [x] `P0-I08-V02` Testuj błędny i wygasły kod oraz brak wycieku danych. (Wygasły/zużyty kod pokazuje komunikat; test adaptera bez ujawniania konta.)


**Definition of Done:** Sesja i odzyskiwanie hasła są działające i odporne na błędy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I09 — Profile sync & self-service editing

**Status:** DONE  
**Started:** 2026-11-02  
**Finished:** 2026-11-02  
**Zależności iteracji:** P0-I04, P0-I06  
**Dowód:** backend: migracja `V2__extend_user_profile.sql` (display_name, city, interests z CHECK), `ProfileService` (provisioning z obsługą wyścigu, PATCH tylko wskazanych pól, właściciel wyłącznie z tokena), `ProfileController` (`POST/GET/PATCH /api/v1/me`, 400 dla niepoprawnych wartości, 404 dla braku profilu), `ProfileApiIT` (9 testów: 401/403, trwałość po ponownym odczycie, ACL dwóch użytkowników, uid/role w body ignorowane, pierwszeństwo konta nad wyborem gościa, 400). `./mvnw --batch-mode clean verify` PASS (3 unit + 30 IT). Klient: `src/profile/` (`profileApi.ts`, `accountLocale.ts` z kluczem per UID, `accountLanguage.ts` z oczekującym zapisem, `useAccountLanguage.ts`), `ProfileScreen.tsx` i trasa `/profile`, zmiana języka w menu dla konta, `accountLanguage.test.ts` (7 testów). `pnpm check` PASS; Jest 53/53 PASS; eksport web PASS.  
**Blokery:** brak. Właściciel zaakceptował V02 i V03 (2026-11-02). Kontrole iOS/Android pozostają NOT VERIFIED i nie są częścią tej akceptacji.

**Zakres zadań:**

- [x] `P0-I09-T01` Dodaj bezpieczne provisioning/upsert profilu powiązanego z Firebase UID.
- [x] `P0-I09-T02` Zaimplementuj GET/PATCH /api/v1/me (allowed fields only).
- [x] `P0-I09-T03` Utwórz ekrany profilu i edycji preferencji, miasta, displayName, języka i zainteresowań.
- [x] `P0-I09-T04` Rozdziel pola własne Firebase i dane PostgreSQL.
- [x] `P0-I09-T05` Udostępnij preferencję `locale` z PostgreSQL w GET/PATCH `/api/v1/me`. Ręczny wybór EN/PL zapisuj wyłącznie we własnym profilu, po weryfikacji Firebase ID tokenu; nie w Firebase jako źródle prawdy. Backend waliduje wspieraną listę (`en`/`pl` na start), odrzuca niepoprawny kod jako 400 i nie pozwala podmieniać UID/roli.
- [x] `P0-I09-T06` Po ręcznej zmianie przełącz UI bez restartu i zapisz wybór w profilu oraz lokalnym cache przypisanym do konta. Po logowaniu/odczycie profilu stosuj zapisany język ponad językiem urządzenia i ustawieniem gościa; odczytuj go ponownie przy kolejnym uruchomieniu/logowaniu, aby wybór działał między urządzeniami. Zmiana języka urządzenia nie nadpisuje istniejącego `locale`.
- [x] `P0-I09-T07` Obsłuż gościa, brak `locale`, offline i błędy zapisu zgodnie z zasadami poniżej. Przy tworzeniu profilu można przenieść jawny wybór gościa tylko do nowego profilu bez preferencji; istniejąca preferencja konta ma pierwszeństwo. Nie zapisuj automatycznie wykrytego języka jako ręcznego wyboru.


**Weryfikacja:**

- [x] `P0-I09-V01` Testy ACL: dwaj użytkownicy nie widzą ani nie edytują cudzych danych. (`ProfileApiIT`.)
- [x] `P0-I09-V02` Testuj po ponownym zalogowaniu trwałość profilu. (Ręcznie zaakceptowane przez właściciela 2026-11-02; backend: odczyt z PostgreSQL w `ProfileApiIT`.)
- [x] `P0-I09-V03` Testuj ręczną zmianę EN↔PL: natychmiastowy UI, PATCH, odczyt z PostgreSQL po reload/restart/ponownym logowaniu oraz na drugim urządzeniu z innym językiem systemu. Zweryfikuj na web/iOS/Android; niewykonane kontrole pozostają NOT VERIFIED. (Zaakceptowane przez właściciela 2026-11-02 na web; iOS/Android NOT VERIFIED.)
- [x] `P0-I09-V04` Testuj brak preferencji, gościa i przeniesienie jego jawnego wyboru do nowego profilu, pierwszeństwo istniejącego profilu nad ustawieniem gościa, brakujące tłumaczenia, niepoprawne `locale` (400), brak autoryzacji i odmowę edycji cudzego języka. (`ProfileApiIT`, `accountLanguage.test.ts`, parzystość kluczy i18n.)
- [x] `P0-I09-V05` Testuj offline/błąd PATCH: lokalna zmiana nie jest fałszywie potwierdzona jako zapisana na koncie, retry nie dotyka innego użytkownika, a logout/zmiana konta nie przenosi cache ani oczekującego zapisu między kontami. (`accountLanguage.test.ts`; ręczny test offline na urządzeniu nadal do wykonania.)


**Uzgodnione zasady języka (2026-11-01):**

- UI korzysta ze wspólnych słowników i18n (minimum EN/PL); zmiana obejmuje nawigację, formularze, stany i komunikaty błędów. Wybór jest dostępny dla gościa i w ustawieniach zalogowanego użytkownika, z nazwami „English” / „Polski”.
- **Po zalogowaniu:** zapisane `locale` w profilu jest źródłem prawdy. Lokalny cache tego samego konta służy do startu/offline, ale ustępuje udanemu odczytowi aktualnego profilu. Brak zapisanej preferencji: jawny lokalny wybór dla bieżącego kontekstu → wspierany język urządzenia → `en`. Dla gościa obowiązuje ten sam fallback bez odczytu profilu.
- **Zmiana ręczna:** UI może przełączyć język od razu, lecz potwierdzenie „zapisano w profilu” wymaga sukcesu PATCH. Offline/błąd zapisu oznacza lokalną zmianę i widoczny stan niezsynchronizowany z opcją ponowienia; bez cichego nadpisywania profilu. Pending zmiana dotyczy wyłącznie tego UID i nie może wykonać się po przełączeniu na inne konto.
- Preferencję konta synchronizuje się przez backend i PostgreSQL, nie przez sam język systemu, local storage ani token Firebase. Cache kont rozdzielaj od ustawienia gościa; cache poprzedniego użytkownika nie jest fallbackiem następnego.
- `locale` wybiera język interfejsu, nie strefę czasową, kraj, walutę ani język treści organizatora. Artykuły/omówienia badań są lokalizowane redakcyjnie; brak tłumaczenia wymaga jawnego oznaczenia języka oryginału i fallbacku, bez automatycznego przekłamywania nauki. Języki poza EN/PL rozszerza P9-I01.

**Definition of Done:** GET/PATCH /me działa dla własnego konta na trzech platformach. Ręczny wybór języka zapisuje się w PostgreSQL i jest stosowany po ponownym logowaniu/uruchomieniu oraz odczycie na drugim urządzeniu; błędy i offline nie udają udanej synchronizacji. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I10 — Sensitive account settings & deletion

**Status:** DONE  
**Started:** 2026-11-02  
**Finished:** 2026-11-02  
**Zależności iteracji:** P0-I07, P0-I08, P0-I09  
**Dowód:** backend: migracja `V3__create_deleted_account.sql`, encja `DeletedAccount` (znacznik usunięcia), `ProfileService.deleteOwnAccount` (idempotentne, blokuje ponowne utworzenie profilu przy 409), `DELETE /api/v1/me` (204); `ProfileApiIT` (12 testów, w tym usunięcie, 404/409 po usunięciu, brak wpływu na inne konto, 401). `./mvnw --batch-mode clean verify` PASS (3 unit + 33 IT). Klient: `auth/authAdapter.ts` (reauth, updatePassword, verifyBeforeUpdateEmail, deleteUser), `account/accountSecurity.ts` (kolejność: reauth → znacznik „w toku” → dane backendu → konto Firebase → sprzątanie lokalne; wznawianie), `account/accountSecurity.test.ts` (7 testów: stara sesja, błędne hasło, błąd backendu, błąd Firebase i wznowienie), `AccountSettingsScreen.tsx` i trasa `(authenticated)/settings`, EN/PL. `pnpm check` PASS; Jest 60/60 PASS; eksport web PASS. Ręczna weryfikacja właściciela 2026-11-02 na koncie testowym (dev): zmiana hasła, zmiana e-maila i usunięcie konta działają; dane po usunięciu niedostępne (V02 zaakceptowane przez właściciela).  
**Blokery:** brak. iOS/Android NOT VERIFIED (poza zakresem zaakceptowanych kontroli).

**Zakres zadań:**

- [x] `P0-I10-T01` Dodaj zmianę hasła z recent login / reautoryzacją.
- [x] `P0-I10-T02` Dodaj zmianę e-maila z weryfikacją nowego adresu i spójną synchronizacją. (E-mail trzyma tylko Firebase; PostgreSQL go nie przechowuje, więc nie ma rozjazdu.)
- [x] `P0-I10-T03` Zaimplementuj bezpieczną procedurę usunięcia konta Firebase + dane aplikacyjne z retry/reconciliation.
- [x] `P0-I10-T04` Dodaj ekran ustawień konta, ostrzeżenia i potwierdzenia.

**Weryfikacja:**

- [x] `P0-I10-V01` Testuj reauth, odmowę przy starej sesji, anulowania i błędy częściowe. (Właściciel potwierdził zmianę hasła i e-maila; odmowa przy starej sesji, błędy i wznowienie pokryte `accountSecurity.test.ts`.)
- [x] `P0-I10-V02` Testuj, że dane po usunięciu nie są dostępne. (Backend: `ProfileApiIT` 404/409; właściciel zaakceptował 2026-11-02.)



**Definition of Done:** Operacje wrażliwe mają poprawne zabezpieczenia i nie pozostawiają niekontrolowanego stanu. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I11 — Automated test coverage & E2E web

**Status:** DONE
**Started:** 2026-11-03
**Finished:**  2026-11-03
**Zależności iteracji:** P0-I06–P0-I10
**Dowód:** `docs/testing/P0-I11-results.md` (lokalny raport, `/docs` ignorowane przez Git); Jest 71/71, `pnpm check` PASS, Maven verify 37/37. Pełny Playwright: 17 PASS / 1 FAIL; desktop E2E oraz mobile Home/navigation PASS.
**Blokery:** Mobilny E2E signup→verify→login→profile→logout→reset wymaga przejścia po zaktualizowanej nawigacji SPA. Ponowne uruchomienie zablokowane przez lokalny Docker overlay read-only.

**Wytyczna Home:** istniejącą implementację Home traktuj jako aktualny, zaakceptowany kierunek. W P0-I11 dostosuj testy, fixtures i asercje do obecnego interfejsu oraz przepływów. Nie zmieniaj działającej implementacji wyłącznie po to, aby spełnić oczekiwania starych testów; wszelkie zmiany produktowe wymagają osobnego polecenia właściciela.

**Zakres zadań:**

- [x] `P0-I11-T01` Uzupełnij testy jednostkowe formularzy, hooków i walidacji.
- [x] `P0-I11-T02` Zweryfikuj integracyjne testy Firebase security, Flyway, profilu i uprawnień (istniejące testy Testcontainers).
- [x] `P0-I11-T03` Dodaj web E2E: signup→verify→login→profile→logout→reset (desktop PASS; mobile-web wymaga potwierdzenia po zmianie selektorów na nawigację SPA).
- [x] `P0-I11-T04` Przygotuj fixtures i bezpieczne testowe środowisko bez kluczy w repo.

**Weryfikacja:**

- [x] `P0-I11-V01` Uruchom frontend lint/typecheck/test i backend test.
- [x] `P0-I11-V02` Zapisz komendy, raport i ograniczenia E2E w docs/testing.

**Definition of Done:** Krytyczne ścieżki mają powtarzalne testy, testy przechodzą. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I12 — Cross-platform verification matrix

**Status:** DONE
**Started:** 2026-11-03
**Finished:** 2026-11-03
**Zależności iteracji:** P0-I02, P0-I07–P0-I11
**Dowód:** 2026-11-03: właściciel potwierdził samodzielne wykonanie T01, T02 i T03 z wynikiem pozytywnym i polecił zamknąć iterację. Potwierdzenie manualne właściciela, bez ponownego uruchomienia testów przez agenta. Wcześniejsze dowody: `docs/testing/phase-0-results.md`, lokalne dowody `docs/testing/P0-I12/`; `pnpm check` PASS, Jest 71/71; Android Expo Go: welcome, deep linki bez kodu, recovery, klawiatura i reveal PASS. Web: 22/24 w pełnym przebiegu, następnie 6/6 poprawionej grupy (wszystkie 24 unikalne scenariusze mają PASS; brak jednego pełnego przebiegu 24/24 po korekcie asercji).
**Blokery:** brak otwartych blockerów odbioru P0-I12 według potwierdzenia właściciela. Historyczne ograniczenia środowiska agenta pozostają opisane w raporcie; ich naprawy nie deklarowano.

**Zakres zadań:**

- [x] `P0-I12-T01` Przeprowadź rzeczywiste smoke/E2E web, iOS Simulator, Android Emulator.
- [x] `P0-I12-T02` Sprawdź deep linki, klawiaturę, accessibility, reset, reauth, usuwanie konta.
- [x] `P0-I12-T03` Sprawdź różnice localhost i zdalny API oraz sieć/offline.
- [x] `P0-I12-T04` Udokumentuj wersje OS, SDK, urządzenia i wyniki.

**Weryfikacja:**

- [x] `P0-I12-V01` Uzupełnij docs/testing/phase-0-results.md dla każdego scenariusza i platformy.
- [x] `P0-I12-V02` Zgłoś BLOCKED przy braku symulatora zamiast fikcyjnego PASS.

**Definition of Done:** P0 ma potwierdzone testy na trzech platformach, bez otwartych blockerów krytycznych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P0-I13 — CI, EAS, staging & Phase 0 gate

**Status:** BLOCKED
**Started:** 2026-11-03
**Finished:** —
**Zależności iteracji:** P0-I11, P0-I12
**Dowód:** `docs/testing/P0-I13-results.md`, lokalne logi `docs/testing/P0-I13/`; actionlint, Compose/Caddy i EAS schema PASS; `pnpm check`, infra 10/10, Jest 71/71, Playwright 24/24, web/native exports, backend unit 3/3 oraz Gitleaks historii i źródeł PASS. Lokalny Caddy TLS + prawdziwy eksport + fixture API: 17 kontroli PASS. Nie jest to hosted CI ani zdalny staging.
**Blokery:** właściciel potwierdził brak hosta/domeny staging oraz projektu EAS. Brak hosted CI run/build IDs, rzeczywistego HTTPS/API i uruchomionego monitoringu/offsite/restore drill. Docker read-only blokuje Maven IT, image build i prawdziwy backup/restore. P0-I03A V02/V03 nadal otwarte; Phase 0 niezamknięta.

**Zakres zadań:**

- [x] `P0-I13-T01` Dodaj CI frontend/backend/secrets scanning i lockfile checks.
- [ ] `P0-I13-T02` Skonfiguruj EAS development/preview oraz staging backend/web z HTTPS.
- [x] `P0-I13-T03` Uzupełnij README bootstrap, sieć emulatorów, sekrety, troubleshooting.
- [ ] `P0-I13-T04` Dodaj monitoring minimum i strategię backup/restore staging.
- [ ] `P0-I13-T05` Wykonaj przegląd bezpieczeństwa i zamknij Phase 0.

**Stan częściowy:** T02: cztery profile EAS + preview preflight i Compose/Caddy gotowe; projekt/buildy/host nieutworzone. T04: skrypty, timery i strategia gotowe, ale rzeczywisty restore/offsite i harmonogram niezweryfikowane. T05: przegląd `infra/staging/SECURITY.md` zapisany; bramka pozostaje otwarta.

**Weryfikacja:**

- [ ] `P0-I13-V01` CI green, staging healthcheck i smoke.
- [ ] `P0-I13-V02` Sprawdź wszystkie P0 gate oraz zaktualizuj changelog po weryfikacji.

**Definition of Done:** Można wdrażać kolejne funkcje na działającym cross-platform fundamencie. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 0

- [ ] Wszystkie obowiązkowe iteracje Phase 0 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [x] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo. 2026-11-03: zgoda na lokalny rozwój Phase 1 przed uzyskaniem hosta; ADR-004. Pozostałe checkboxy bramki pozostają otwarte; nie jest to pełny odbiór Phase 0.

---

# Phase 1 — Science & Discover MVP

**Status fazy:** IN_PROGRESS
**Cel:** Źródłowa baza wiedzy, recenzja treści, Discover, fiszki i quizy.  
**Zależności:** lokalne fundamenty Phase 0; odroczenie zdalnego odbioru P0-I13 zatwierdzone przez właściciela 2026-11-03 (`docs/adr/004-local-phase-1-before-staging.md`). Phase 0 pozostaje otwarta.
**Raport główny:** §3.2, §24, §25  
**Iteracje:** 6

**Zmiana planu 2026-11-04:** na polecenie właściciela usunięto iterację `P1-I05` z planu; identyfikator pozostaje wycofany i nie jest ponownie używany. Historyczne wpisy sesji zachowano. Nie oznaczono iteracji jako DONE ani nie usunięto kodu aplikacji.

## P1-I00 — Scientific content schema & source policy

**Status:** DONE
**Started:** 2026-11-03
**Finished:** 2026-11-03
**Zależności iteracji:** P0-I13 — wyjątek zatwierdzony 2026-11-03: brak hosta/EAS i zdalnego odbioru nie blokuje lokalnej implementacji P1-I00. Własne testy migracji/constraintów V01 pozostają obowiązkowe.
**Dowód:** `backend/SCIENCE_POLICY.md`, moduł `evidence`, migracja V4, ADR-005 i `docs/testing/P1-I00-results.md`; Maven verify PASS: 8 unit + 50 IT (w tym 16 evidence IT), realny PostgreSQL 17.11 w izolowanym klastrze /tmp. Test upgrade V3→V4, mapowań JPA, źródeł/recenzji, wersjonowania i współbieżności PASS. `pnpm check` PASS.
**Blokery:** brak dla P1-I00. Docker nadal read-only; testy wykonano na rzeczywistym lokalnym PostgreSQL poprzez ograniczony override testowy. Domyślny Testcontainers zachowano; nie twierdzimy, że Docker został naprawiony.

**Uzgodnienie źródeł (2026-11-03):** właściciel dodał [The Lancet](https://www.thelancet.com) do planowanych źródeł artykułów i badań Science & Discover. Polityka/model mają rozróżniać typ materiału, zapisywać DOI/URL, ograniczenia i licencję oraz wymagać indywidualnej oceny i recenzji; szczegóły w raporcie §24.2. Wdrożono metadane/provider THE_LANCET i politykę oceny; nie dodano importera ani rzeczywistych publikacji (treści pilotażowe należą do P1-I06).

**Zakres zadań:**

- [x] `P1-I00-T01` Zaprojektuj ScientificSource, EvidenceClaim, evidenceLevel, limitations, license i publishedAt.
- [x] `P1-I00-T02` Zdefiniuj wersjonowanie, datę przeglądu i relacje źródeł.
- [x] `P1-I00-T03` Wprowadź politykę korelacji/przyczynowości oraz informację o niepewności.
- [x] `P1-I00-T04` Przygotuj migracje i ADR dot. redakcji.

**Weryfikacja:**

- [x] `P1-I00-V01` Test migracji i constraint: publikacja bez źródeł jest niedozwolona.

**Definition of Done:** Źródła i claims mają weryfikowalny model danych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I01 — Science public APIs & authorization

**Status:** DONE
**Started:** 2026-11-03
**Finished:** 2026-11-03
**Zależności iteracji:** P1-I00
**Dowód:** `backend/SCIENCE_API.md`, `SciencePublicController`, `SciencePublicReader`, `SecurityConfig`, Flyway V5 i `SciencePublicApiIT`; raport `docs/testing/P1-I01-results.md`. Maven verify PASS (8 unit + 64 IT, w tym 14 Science API IT), pnpm check PASS; migracje fresh V1–V5 i upgrade V3→V5 na izolowanym PostgreSQL 17.11.
**Blokery:** brak dla P1-I01. Docker/Testcontainers nie uruchamiano; testy wykonano na izolowanym natywnym PostgreSQL. Bez zmian UI i bez nowych testów runtime web/iOS/Android.

**Zakres zadań:**

- [x] `P1-I01-T01` Wdroż endpointy kategorii, claimów, artykułów i cytowań.
- [x] `P1-I01-T02` Rozdziel publiczne PUBLISHED od DRAFT/REVIEW.
- [x] `P1-I01-T03` Dodaj paginację, filtrowanie i cache z kontrolą wersji.
- [x] `P1-I01-T04` Zadbaj o odmowę nieautoryzowanej publikacji.

**Weryfikacja:**

- [x] `P1-I01-V01` Integracyjne testy ACL, paginacji, statusów, walidacji URL/DOI.

**Definition of Done:** Publiczne API zwraca wyłącznie zatwierdzone treści. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I02 — Editorial workflow & admin UI

**Status:** DONE
**Started:** 2026-11-03
**Finished:** 2026-11-03
**Zależności iteracji:** P1-I01
**Dowód:** `backend/EDITORIAL_API.md`, moduł `evidence/editorial`, Flyway V6, `EditorialApiIT`, panel `/editorial` i testy klienta/przeglądarkowe; `docs/testing/P1-I02-results.md`. Maven verify 8 unit + 73 IT PASS (9 editorial IT), Jest 76/76 PASS, Playwright realny backend/Firebase emulator/PostgreSQL 8/8 + 2/2 ukierunkowane PASS, pnpm check/build i export:native PASS.
**Blokery:** brak dla webowego zakresu P1-I02. Role rzeczywistych redaktorów nadaje operator, brak domyślnych grantów. Native runtime i VoiceOver/TalkBack NOT VERIFIED; panel jest web-only, fallback natywny przetestowany komponentowo, eksporty iOS/Android PASS. Staging/hosted CI i otwarte bramki Phase 0 bez zmian.

**Korekta właściciela 2026-11-03 — blog editor:** dotychczasowy status DONE i dowody opisują pierwotny zakres. Na dodatkowe zlecenie wdrożono nowy panel Tiptap, uproszczony formularz bez języka, źródła w stopce, dynamiczne kategorie, obrazy i automatyczne daty; AUTHOR może publikować bezpośrednio lub wysłać do niezależnej recenzji. Historyczny model EvidenceClaim i stary panel `/editorial-evidence` zachowano. Automatyczne tłumaczenia odroczone za zgodą właściciela. UI 8/8 PASS (symulowane API, desktop/mobile-web, EN/PL), klient 76/76 PASS, backend 13 unit PASS, kompilacja, check i eksporty PASS. V7 zastosowana przy starcie lokalnego API; odczytowy smoke PASS. **Nowe 7 BlogApiIT: NOT VERIFIED / skipped (approved)** — właściciel zgodził się pominąć pełną integrację Docker; nie zaliczamy tych testów jako PASS. Raport: `docs/testing/P1-I02-blog-editor-results.md`, decyzja ADR-006 i `backend/BLOG_EDITORIAL_API.md`. Nie rozpoczęto P1-I03.

**Zakres zadań:**

- [x] `P1-I02-T01` Dodaj DRAFT→IN_REVIEW→PUBLISHED→ARCHIVED i audit trail.
- [x] `P1-I02-T02` Zbuduj minimalistyczny panel redaktorski na webie.
- [x] `P1-I02-T03` Rozdziel role author/reviewer i odrębne zatwierdzenie.
- [x] `P1-I02-T04` Zablokuj edycję opublikowanej wersji bez nowej rewizji.

**Weryfikacja:**

- [x] `P1-I02-V01` Testy ról, wersji, niekompletnych źródeł i wycofania publikacji.

**Definition of Done:** Recenzent może świadomie zatwierdzić i wycofać materiał. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I03 — Discover reading experience

**Status:** IN_PROGRESS — implementacja gotowa do ręcznego odbioru; NOT VERIFIED  
**Started:** 2026-11-03  
**Finished:** —  
**Zależności iteracji:** P1-I01, P1-I02  
**Dowód:** kod `apps/consumer/src/science/*`, wspólne trasy `app/science/*`, integracja Home i EN/PL; README klienta. T01–T04 zaimplementowane, checkboxy pozostają otwarte do weryfikacji.  
**Blokery:** historyczna implementacja 2026-11-03 nie miała testów na polecenie właściciela. Rozszerzenie wyszukiwania 2026-11-04 zweryfikowano osobno poniżej; pełne V01/V02, runtime iOS/Android i DoD iteracji nadal NOT VERIFIED.

**Implementacja 2026-11-03:** feed blogów, recenzowanych omówień i kart dowodów; paginacja, filtry tematów recenzowanej biblioteki, czytnik canonical JSON, okładki/obrazy i źródła HTTPS, rok/typ badań, pewność z uzasadnieniem i ograniczenia, daty recenzji, loading/empty/error/retry, EN/PL i wspólne RN UI. Home pobiera rzeczywiste publikacje. Rozróżnienie AUTHOR/REVIEWED; bez fikcyjnych ocen dowodów dla blogów i bez automatycznych tłumaczeń. Bez zmian backendu, publikacji danych ani startu P1-I04.

**Korekta 2026-11-04:** na polecenie właściciela usunięto przycisk „Explore Science & Discover” z `GuestWelcomeScreen` (EN/PL). Testów nie uruchomiono zgodnie z poleceniem; UI web/iOS/Android NOT VERIFIED. Status iteracji i checkboxy bez zmian. Drobna korekta bez wpisu w CHANGELOG.

**Rozszerzenie 2026-11-04 — wyszukiwanie Articles:** q (literalny fragment tytułu, case-insensitive, max 200) i select kategorii, filtry łączone po stronie serwera przed count/paginacją. UI EN/PL, debounce 500 ms, reset strony, osobny empty state. Backend zachowuje publiczne projekcje i bramki publikacji. Maven: 13 unit + 23 IT (BlogApiIT/SciencePublicApiIT) PASS na izolowanym PostgreSQL/Testcontainers. Jest filtrów 4/4, typecheck i ESLint zmienionych modułów PASS. Playwright smoke na lokalnym Expo z syntetycznym API: EN/PL × 390/1440 px 4/4 PASS; wyszukiwanie, select, empty i brak overflow. Lokalny backend zaktualizowany; read-only smoke filtrowanego API 200/zero wyników PASS. Ogólny test parzystości i18n FAIL: 10 istniejących różnic kluczy, identycznych z HEAD, bez nowych różnic tej zmiany. Dowody: `/tmp/soberity-articles-{search-tests,ui-tests,browser-tests}.log`, screenshoty `/tmp/soberity-articles-search-{en,pl}-{390,1440}.png`. Brak nowych checkboxów/DONE; native runtime i dark smoke wyszukiwania NOT VERIFIED.

**Zakres zadań:**

- [ ] `P1-I03-T01` Zbuduj Discover feed, artykuł i kartę Evidence.
- [ ] `P1-I03-T02` Pokaż link „Sprawdź badania”, rok, typ źródła, siłę dowodów i ograniczenia.
- [ ] `P1-I03-T03` Dodaj loading/empty/error oraz i18n.
- [ ] `P1-I03-T04` Współdziel UI na web, iOS, Android.

**Weryfikacja:**

- [ ] `P1-I03-V01` Testy renderowania dat/źródeł i a11y.
- [ ] `P1-I03-V02` Smoke na dostępnych platformach.

**Definition of Done:** Użytkownik może przeczytać i zweryfikować źródło każdej tezy. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

**Korekta formularza i nagłówka 2026-11-04:** usunięto chapter Articles z treści; tylko trasa index ma nagłówek Articles/Artykuły w primary z istniejącym oceanicznym assetem artykułów. Search/category w jednym rzędzie 3:2 również na mobile, fullWidth select ogranicza szerokość. Debounce 500 ms potwierdzony testem braku zapytań po 499 ms i pojedynczej końcowej frazy. Typecheck, ESLint pięciu zmienionych modułów, Jest 4/4 PASS; Playwright EN/PL 390/1440 px 4/4 PASS (pojedynczy niebieski nagłówek, jeden rząd, debounce, brak overflow). Dowody `/tmp/soberity-articles-layout-tests.log`, `/tmp/soberity-articles-header-smoke.log`, zrzuty `/tmp/soberity-articles-header-{en,pl}-{390,1440}.png`. Native runtime nadal NOT VERIFIED.

## P1-I04 — Flashcards & quizzes

**Korekta właściciela 2026-11-04 — uproszczenie ekranu quizu (NOT VERIFIED):** usunięto Wróć do quizów, opis noPressure, completionPrivacy i panel opt-in. Quizy zalogowanych automatycznie wczytują zapisane odpowiedzi i zapisują każdą zatwierdzoną odpowiedź; goście bez zapisu na koncie. Przywracanie wskazuje pierwsze pytanie bez odpowiedzi (ostatnie, jeżeli wszystkie są zapisane), błędy pozostają widoczne. Fiszki zachowują własny opt-in i usuwanie danych. README/API uaktualnione. Ta decyzja zastępuje poprzedni opt-in quizów; bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela.

**Korekta UI 2026-11-04 — menu i kategorie (NOT VERIFIED):** Science & Discover domyślnie zwinięte, rozwijane kliknięciem; wyśrodkowane oceaniczne etykiety kart kategorii z subtelnymi ikonami mózgu, osób, pytajnika i piłki w prawym dolnym rogu. Kategoria w parametrach trasy pozwala strzałce obok menu wrócić do siatki, bez przycisku Wszystkie kategorie; tytuł kategorii wyśrodkowany. Usunięto Wróć do nauki z fiszek. Na wyraźne polecenie właściciela bez testów, buildów, lint/typecheck ani dodatkowej weryfikacji web/iOS/Android. Status IN_PROGRESS, checkboxy i Finished bez zmian; odbiór wykonuje właściciel. CHANGELOG bez nowego wpisu do czasu weryfikacji.

**Status:** DONE — zamknięte na podstawie odbioru i polecenia właściciela 2026-11-04  
**Started:** 2026-11-03  
**Finished:** 2026-11-04  
**Zależności iteracji:** P1-I02, P1-I03  
**Dowód:** właściciel 2026-11-04 uznał fiszki i quizy za zakończone i polecił zaznaczyć wszystkie punkty T01–T04 oraz V01–V02. Zapis odbioru w dzienniku poniżej; wcześniejsze dowody API/komponentów/web zachowano historycznie. Nie uruchamiano nowych testów ani dodatkowej weryfikacji. Właściciel nie podał nowej macierzy urządzeń/platform; nie przypisano agentowi nowych wyników PASS.
**Blokery:** brak zgłoszonych blokerów zamknięcia P1-I04; P1-I03 pozostaje osobną otwartą iteracją. Historyczne ograniczenia weryfikacji opisane poniżej dotyczą wcześniejszych sesji i nie są nadpisywane.

**Odbiór końcowy 2026-11-04:** zamknięto pełną checklistę na wyraźne polecenie właściciela („Flashcard and quizies is finished for now, mark this as finished (all bullets)”). Aktualny zakres obejmuje automatyczny zapis quizów, opcjonalny zapis fiszek, kategorie i miniatury, interaktywny quiz, wyjaśnienia/źródła, wynik i powtórki. Wcześniejsze wzmianki NOT VERIFIED i brak Finished/DONE poniżej są historią kolejnych wdrożeń, a nie bieżącym statusem. Nie rozpoczęto następnej iteracji.

**Implementacja 2026-11-03:** fiszki z recenzowanych EvidenceClaim (teza → wyjaśnienie/źródła/ograniczenia, powtórki), quizy TRUE_FALSE/SINGLE_CHOICE/MULTIPLE_CHOICE, serwerowa ocena dokładnego zbioru odpowiedzi, wyjaśnienia i źródła po odpowiedzi. Niemutowalne quizy przypięte do wersji dowodów, przygotowanie AUTHOR i niezależna publikacja REVIEWER w nowym panelu web. Wycofanie/zastąpienie dowodu ukrywa zależny quiz. Opcjonalny zapis na koncie z jawnym włączeniem, wznowieniem, kasowaniem i czyszczeniem przy usunięciu konta; anonimowo bez zapisu. Brak danych zdrowotnych, kar, timerów i XP. Wspólne RN UI web/iOS/Android, EN/PL, stany empty/loading/error/retry, wejścia z Discover i konta/panelu. Nie dodano treści pilotażowych ani Myth Battle (P1-I06), nie rozpoczęto P1-I05.

**Korekta właściciela 2026-11-03 — publikacja quizu:** AUTHOR może wybrać bezpośrednie Opublikuj albo wysłanie do recenzji; może też opublikować własny istniejący IN_REVIEW quiz. V9 i API rozróżniają AUTHOR/REVIEWED, obowiązek opublikowanego recenzowanego EvidenceClaim pozostaje. Backend zbudowano z -DskipTests i uruchomiono; log potwierdza migrację V9 i gotowość aplikacji. UI i ścieżki publikacji nadal NOT VERIFIED — testów nie wykonywano.

**Aktualna korekta właściciela 2026-11-03 — źródła przy wyjaśnieniu:** nowy quiz nie wymaga osobnej karty EvidenceClaim. Każde pytanie ma wyjaśnienie i 1–10 źródeł (tytuł/HTTPS URL), pokazywanych od razu po odpowiedzi. Formularz nie pobiera już listy kart dowodów; Publish/Review pozostają. Istniejące quizy z przypiętymi wersjami i fiszki są nadal obsługiwane. ADR-007 oraz zatwierdzona korekta raportu dokumentują zastąpienie wcześniejszego wymogu. Kod backendu zbudowano z pominięciem testów i uruchomiono; UI i scenariusze nadal NOT VERIFIED.

**Korekta UI 2026-11-04 — lista Quizzes:** wspólny ScienceTitle z ikoną/primary jak Articles; bez redundantnego tytułu/opisu i przycisku Back to Discover. Pusta lista pokazuje tylko stylowany No quizzes / Brak quizów. Wyodrębniono Pagination używany przez Articles i Quizzes (strzałki, liczba stron, disabled/focus/hover/pressed, pozycja na dole strony). Testy komponentów Quizzes + regresja Articles 6/6 PASS, typecheck i ESLint zmienionych modułów PASS. Web z syntetycznym API EN/PL × light/dark × 390/1440 px 8/8 PASS: tytuł/kolor, empty, brak back, granice paginacji i brak overflow. Logi `/tmp/soberity-quizzes-refactor-{tests,smoke}.log`; zrzuty `/tmp/soberity-quizzes-{empty,list}-{en,pl}-{light,dark}-{390,1440}.png`. Runtime iOS/Android NOT VERIFIED: otworzyć Quizzes z pustymi i opublikowanymi danymi, sprawdzić nagłówek, paging, duży font i czytnik. Bez nowych checkboxów i Finished/DONE.

**Zapis wyników 2026-11-04:** na polecenie właściciela ukończone quizy zalogowanego użytkownika zapisują minimalny wynik niezależnie od opt-in zapisu odpowiedzi w trakcie (jawny komunikat UI). V10 learning_quiz_result, prywatne POST complete i GET results; serwer ocenia pełną listę odpowiedzi, sprawdza kompletność/opcje i zapisuje counts/version/timestamp. Karta pokazuje ostatni wynik, nie najlepszy; 80% należy do green. Każdy quiz można powtórzyć, poprzedni wynik pozostaje do ukończenia nowej próby. Idempotentne retry, izolacja kont, wycofanie treści, kasowanie learning/account, bez danych zdrowotnych. Backend 13 unit + 27 IT PASS, klient 12/12 PASS, web synthetic auth/API EN/PL light/dark 390/1440 px 8/8 PASS; kontrast light min 5.26 i dark 6.63 PASS. Lokalny restart na polecenie właściciela: V10 i 200/UP. Runtime iOS/Android i test rzeczywistego Firebase/real API E2E nadal NOT VERIFIED. Dowody /tmp/soberity-quiz-results-{backend-tests,ui-tests,browser-tests}.log oraz /tmp/soberity-backend-restart.log. Bez nowych zaliczeń checkboxów/Finished.

**Zakres zadań:**

- [x] `P1-I04-T01` Zaprojektuj pytania, odpowiedzi, wyjaśnienia i relacje do EvidenceClaim.
- [x] `P1-I04-T02` Dodaj quizy prawda/fałsz i wielokrotnego wyboru.
- [x] `P1-I04-T03` Zapisuj postęp bez zapisywania danych zdrowotnych.
- [x] `P1-I04-T04` Unikaj kar za błędną odpowiedź i stosuj czytelne wyjaśnienia.

**Weryfikacja:**

- [x] `P1-I04-V01` Test poprawności odpowiedzi i źródeł.
- [x] `P1-I04-V02` Test zapisu postępu i powtórek.

**Definition of Done:** Działający quiz z uzasadnieniem i klikanym źródłem. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P1-I06 — Myth Battle, seed data & phase gate

**Status:** TODO
**Priorytet:** PARKED (approved by owner, 2026-11-04) — Myth Battle odłożone na później; właściciel polecił przejść do Sober Events. Bramka Phase 1 nie jest przez to zaliczona. Powrót do tej iteracji wymaga osobnego polecenia.  
**Started:** —  
**Finished:** —  
**Zależności iteracji:** P1-I04  
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

**Definition of Done:** Discover+Myth Battle działają na recenzowanych treściach. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 1

- [ ] Wszystkie obowiązkowe iteracje Phase 1 mają status `DONE` oraz dowody wykonania i testów.
- [ ] Zrealizowano regresję odpowiednią do fazy, testy bezpieczeństwa, a tam gdzie dotyczy — potwierdzono web/iOS/Android.
- [ ] Rozwiązano krytyczne blokery, uzupełniono dokumentację, zaktualizowano statusy i `CHANGELOG.md` dla istotnych rezultatów.
- [ ] Właściciel projektu potwierdził przejście do kolejnej fazy lub udokumentował świadome odstępstwo.

---

# Phase 2 — Sober Events — katalog, organizerzy, kontakt

**Status fazy:** IN_PROGRESS  
**Cel:** Międzynarodowy katalog głównie sober rave/party, rozszerzony o lifestyle; bez własnych płatności.  
**Zależności:** Phase 0; interfejs Discover można rozwijać równolegle do Phase 1 po zatwierdzeniu kontraktów.  
**Raport główny:** §3.3–§3.4, §7–§8, §13  
**Iteracje:** 7

**Decyzja priorytetowa 2026-11-04:** start lokalnego P2-I00 na wyraźne polecenie właściciela, z odłożonym Myth Battle. Otwarte bramki Phase 0/1 nie są zaliczone; odroczenie zdalnego P0-I13 dla lokalnych prac zapisano w ADR-010.

## P2-I00 — Event policy, taxonomy & trust

**Status:** IN_PROGRESS — implementacja do odbioru; NOT VERIFIED  
**Started:** 2026-11-04  
**Finished:** —  
**Zależności iteracji:** P0-I13 — lokalny start zatwierdzony przez właściciela 2026-11-04 mimo otwartego staging/remote, ADR-010; zależność nie jest oznaczona DONE.  
**Dowód:** `docs/policies/EVENTS_POLICY.md`, `docs/policies/EVENTS_POLICY_SCENARIOS.md` (scenariusze nieuruchomione), `backend/src/main/java/com/soberity/events/domain/EventPolicy.java`, `backend/EVENTS_POLICY.md`, ADR-010. T01–T04 przygotowane/zaimplementowane, checkboxy otwarte do rzeczywistego odbioru.  
**Blokery:** brak blokera lokalnego przygotowania polityki; na obowiązujące polecenie właściciela bez testów i dodatkowej weryfikacji. Nie uruchomiono kompilacji/lint/buildów, API, migracji, przeglądarki ani symulatorów. Kryteria produktu i domyślna retencja wymagają odbioru właściciela; żaden organizator/event nie został zatwierdzony.

**Implementacja 2026-11-04:** podział SOBER_NIGHTLIFE/SOBER_LIFESTYLE, kategorie i oddzielna polityka ALCOHOL_FREE/SOBER_FRIENDLY. Domyślne wyniki wyłącznie PUBLISHED+ALCOHOL_FREE+VERIFIED; friendly osobny opt-in, bez cichego fallbacku. Polityka: brak sprzedaży/serwowania/BYOB dla strict; unknown nie jest false, zasady ABV wymagają wyjaśnienia przez moderatora. Kryteria kwalifikacji hosta, źródeł/uprawnień do treści, public/private projekcji, minimalizacji i okresów retencji. Cykl DRAFT/IN_REVIEW/CHANGES_REQUESTED/APPROVED/PUBLISHED/REJECTED/CANCELLED/ARCHIVED, niezależny moderator i unieważnienie po materialnych zmianach. Czysta klasa domenowa koduje enumy, wstępną ocenę z reason codes i dopuszczalne przejścia; nie zastępuje późniejszego ACL/version guards i nie publikuje automatycznie. Scenariusze akceptacyjne zapisane bez wykonania. Nie dodano API/DB/UI ani rzeczywistych wydarzeń; P2-I01 i P2-I02 nierozpoczęte. CHANGELOG odroczony do weryfikacji.

**Zakres zadań:**

- [ ] `P2-I00-T01` Ustal Sober Nightlife vs Sober Lifestyle, 100% ALCOHOL-FREE vs SOBER-FRIENDLY.
- [ ] `P2-I00-T02` Spisz kryteria kwalifikacji i weryfikacji organizatora.
- [ ] `P2-I00-T03` Zdefiniuj zasady źródła danych, prywatności i retencji.
- [ ] `P2-I00-T04` Zaprojektuj cykl MODERATION statusów.

**Weryfikacja:**

- [ ] `P2-I00-V01` Przetestuj scenariusze niekwalifikujących się wydarzeń na przykładach.

**Definition of Done:** Wydarzenia mają jasne, moderowalne kryteria. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I01 — Events data model & APIs

**Status:** IN_PROGRESS — implementacja przygotowana; NOT VERIFIED  
**Started:** 2026-11-04  
**Finished:** —  
**Zależności iteracji:** P2-I00 pozostaje NOT VERIFIED; start P2-I01 na wyraźne polecenie właściciela 2026-11-04, bez zaliczania wcześniejszej iteracji/bramek.  
**Dowód:** `backend/src/main/resources/db/migration/V17__events_catalog_and_moderation.sql`, `backend/src/main/java/com/soberity/events/application/`, `backend/src/main/java/com/soberity/events/api/`, `SecurityConfig.java`, `backend/EVENTS_API.md`.  
**Blokery:** wykonanie migracji i odbiór techniczny pozostają do wykonania. Na polecenie właściciela bez testów, kompilacji, dodatkowej weryfikacji i restartu. Checkboxy T01–T04/V01 otwarte; nie deklarowano DONE.

**Implementacja 2026-11-04:** V17: organizatorzy i członkostwo, osobna lista moderatorów, kategorie, niezmienne lokalizacje/media, wersjonowane wydarzenia, niezależne review, audyt i schemat ContactInquiry (bez wysyłki). API organizatora tworzy/odczytuje/edytuje/zgłasza i anuluje; moderacja weryfikuje organizatora, ocenia treść i publikuje. Publiczne projekcje ograniczają pola i widoczność do zatwierdzonych danych zweryfikowanych organizatorów; strict domyślnie, friendly jawnie. Wyszukiwanie: daty, miasto/kraj, kategoria/track, cena/waluta, dostępność/availability, język i opcjonalny promień; paginacja. Daty UTC+IANA, kontrola offsetu/DST, walidacja HTTPS bez pobierania URL, normalizacja zdjęć istniejącym BlogImages. Edycja wycofuje publikację do ponownej moderacji; anulowanie udostępnia wyłącznie ostatni opublikowany snapshot. Integracja z tombstone usuwania kont. Nie dodano eventów demonstracyjnych ani interfejsu P2-I02/P2-I03. CHANGELOG odroczony do rzeczywistej weryfikacji.

**Zakres zadań:**

- [ ] `P2-I01-T01` Dodaj Event, Venue, Organizer, Category, Moderation, ContactInquiry i bazową lokalizację.
- [ ] `P2-I01-T02` Implementuj API tworzenia/odczytu/wyszukiwania z rolami.
- [ ] `P2-I01-T03` Daty przechowuj poprawnie UTC + IANA timezone.
- [ ] `P2-I01-T04` Dodaj paginację, walidację linków, zdjęć i geolokacji.

**Weryfikacja:**

- [ ] `P2-I01-V01` Testy migracji, ACL, timezone, parametrów wyszukiwania.

**Definition of Done:** API eventów oddziela dane publiczne od niezatwierdzonych. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I02 — Event discovery web + mobile

**Status:** IN_PROGRESS — implementacja przygotowana; NOT VERIFIED  
**Started:** 2026-11-04  
**Finished:** —  
**Zależności iteracji:** P2-I01 pozostaje NOT VERIFIED; start P2-I02 na wyraźne polecenie właściciela, bez automatycznego zaliczenia zależności i wykonania V17.  
**Dowód:** `apps/consumer/app/events.tsx`, `apps/consumer/src/events/{EventsScreen,EventCard,EventSelect}.tsx`, `eventsApi.ts`, `location.ts` / `location.web.ts`, EN/PL resources, `EventCatalog.java`, `EventPublicController.java`, `backend/EVENT_DISCOVERY.md`.  
**Blokery:** backend/V17 z P2-I01 muszą zostać uruchomione i odebrane; katalog wymaga prawdziwych zatwierdzonych danych. Zgodnie z poleceniem właściciela nie uruchamiano testów/buildów/typecheck, migracji/restartów, API, przeglądarki ani symulatorów. T01–T04/V01 pozostają niezaliczone do odbioru.

**Implementacja 2026-11-04:** `/events` zastępuje UnavailableScreen wspólnym katalogiem Expo web/iOS/Android. Filtry miasto/region/kraj/data/kategoria/cena/waluta/accessibility, jawny strict/friendly, zastosowanie i czyszczenie filtrów, sortowanie dat serwerowe i paginacja12. Ocean light/dark, EN/PL, responsywny grid, rzeczywiste zdjęcia lub neutralny fallback, silniejsza etykieta sober party/rave, data/czas w strefie wydarzenia, cena z jednostek najmniejszych. Dni zakresu w strefie użytkownika, koniec przez następny dzień kalendarzowy (DST). Obsługa loading/error/retry/empty i anulowania starych zapytań. Opcjonalny promień: ręczne współrzędne na każdej platformie, jednorazowa geolokalizacja przeglądarki dopiero po kliknięciu; bez zapisu w profilu/storage i śledzenia. Automatyczny GPS native nie jest dostarczony, pozostaje tryb ręczny. API rozszerzone o region i bezpieczny enum sort przed paginacją; bez nowej migracji. Nie rozpoczęto szczegółów/biletów/kalendarza P2-I03 ani nie zmieniano Home. CHANGELOG odroczony do weryfikacji.

**Zakres zadań:**

- [ ] `P2-I02-T01` Zbuduj listę wydarzeń z filtrami miasto/region/data/kategoria/cena.
- [ ] `P2-I02-T02` Dodaj sortowanie i stany pustej listy, paginację.
- [ ] `P2-I02-T03` Wyróżnij sober party/rave w UI.
- [ ] `P2-I02-T04` Dodaj opcjonalny tryb lokalizacji bez żądania niepotrzebnych uprawnień.

**Weryfikacja:**

- [ ] `P2-I02-V01` Test filtrów, przekraczania daty, a11y i responsywności.

**Definition of Done:** Użytkownik znajduje aktualne eventy w wybranym mieście. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

## P2-I03 — Event detail, external checkout & links

**Status:** IN_PROGRESS — implementacja przygotowana; NOT VERIFIED  
**Started:** 2026-11-04  
**Finished:** —  
**Zależności iteracji:** P2-I01/P2-I02 pozostają NOT VERIFIED; start P2-I03 na wyraźne polecenie właściciela, bez zaliczania poprzednich iteracji.  
**Dowód:** `apps/consumer/app/events/{_layout,index,[id]}.tsx`, `apps/consumer/src/events/EventDetailScreen.tsx`, `EventCard.tsx`, `eventsApi.ts`, `calendarDownload.ts`/`.web.ts`, `EventMetadata.tsx`/`.web.ts`, EN/PL, `EventCalendar.java`, publiczny kontroler/SecurityConfig, `backend/EVENT_DETAIL.md`.  
**Blokery:** aktywacja backendu i V17 oraz rzeczywisty odbiór pozostają do wykonania. Na polecenie właściciela bez testów/buildów/typecheck, API/przeglądarki/symulatorów, migracji i restartów. T01–T04/V01/V02 otwarte. SEO produkcyjne wymaga finalnego origin i hostingu; T04 określa minimum, nie deklaruje indeksowania.

**Implementacja 2026-11-04:** szczegóły rzeczywistego publicznego wydarzenia, zdjęcie/fallback, opis, daty/strefa, cena, zasady sober/napojów, miejsce i dostępność, zasady wstępu i zweryfikowany organizator. Całe karty prowadzą do /events/{UUID}, web href i native route w istniejącym scheme. Invalid ID/404, ładowanie, błędy i ponowienie; cancelled/ended oznaczone bez zakupu/kalendarza. Linki HTTPS bez credentials/control characters, dialog z domeną, ponowny odczyt aktualnego eventu/organizatora i porównanie celu; brak dowolnego redirect parametru. Eksport .ics przez publiczny endpoint: aktualna kwalifikacja, 410 dla cancelled/ended, UTC, UTF-8 fold/escape/CRLF, no-store, import bez uprawnień do kalendarza; native otwiera attachment w OS/browser, bez deklaracji bezpośredniego zapisu. Minimalny kontrakt SEO w EVENT_DETAIL.md, runtime title/description i noindex do przygotowania serwerowego renderowania/hostingu. EN/PL, oba motywy. Bez następnej P2-I04 i płatności. Dodatkowa korekta właściciela: wizualny pill gwiazdki Articles mniejszy (36×28, ikona16), target48×44 i popover zachowane. CHANGELOG odroczony do odbioru.

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
**Zależności iteracji:** P2-I01–P2-I05, P1-I06, P0-I03A
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P2-I06-T01` Dodaj pierwsze realne, legalnie pozyskane/zweryfikowane wydarzenia.
- [ ] `P2-I06-T02` Zadbaj o status anulowane/zmienione/odbyte.
- [ ] `P2-I06-T03` Przeprowadź smoke na web/iOS/Android i kontrolę stref czasowych.
- [ ] `P2-I06-T04` Zweryfikuj konwersję event→external checkout oraz jakość katalogu.

- [ ] `P2-I06-T05` Przeprowadź wspólny przegląd spójności wizualnej całego zakresu publicznego MVP: Home, Auth/profil, Science i Events, na podstawie wzorca zaakceptowanego w P0-I03A i aktualnego `docs/BRANDING.md`. Usuń rozbieżności komponentów, typografii, spacingu, nawigacji i stanów; większe zmiany kierunku przedstaw do akceptacji właściciela.

**Weryfikacja:**

- [ ] `P2-I06-V01` E2E wyszukanie→kontakt→zapisanie→zewnętrzny link.
- [ ] `P2-I06-V02` Audit brak fikcyjnych eventów.
- [ ] `P2-I06-V03` Zapisz końcowy odbiór wizualny MVP przez właściciela oraz regresję EN/PL, responsywności i a11y na web/iOS/Android. Udokumentuj wyniki i nierozwiązane braki; bez odbioru i obowiązkowych testów nie uznawaj UI MVP za gotowe do publikacji.

**Definition of Done:** Działa katalog wiarygodnych wydarzeń i kontakt bez własnych płatności. Każdy obowiązkowy punkt powyżej ma dowód, a wyniki testów są zapisane.

### Gate — Phase 2

- [ ] Przed publicznym MVP ukończono wspólny przegląd UI z P2-I06-T05/V03 i zapisano akceptację właściciela; ten odbiór nie stanowi zgody na deployment ani publikację sklepową.

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
**Zależności iteracji:** P1-I03, P2-I06  
**Dowód:** —  
**Blokery:** —

**Zakres zadań:**

- [ ] `P3-I04-T01` Dodaj preferencje kanałów: email, native push i web fallback.
- [ ] `P3-I04-T02` Zaimplementuj rejestrację/unieważnianie tokenów Expo i zgodę na push.
- [ ] `P3-I04-T03` Powiadamiaj o nowych artykułach naukowych i wydarzeniach zgodnie z preferencjami.
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

# 4. Stała macierz testów cross-platform

**Odbiór 2026-11-03:** właściciel potwierdził samodzielne wykonanie T01–T03 z wynikiem pozytywnym; P0-I12 DONE. Poniższa tabela zachowuje historyczne wyniki i ograniczenia przebiegu agenta, nie stan po manualnym odbiorze właściciela. Szczegółowych urządzeń, wersji i artefaktów dodatkowego przebiegu właściciel nie podał; nie przypisano mu konfiguracji agenta.

| Scenariusz Phase 0 | Web | iOS Simulator | Android Emulator | Dowód / data |
|---|---|---|---|---|
| Start i nawigacja Expo | PASS | BLOCKED | PASS | 2026-11-03 P0-I12: web welcome/routes, Android Expo Go 58.0.5 welcome + reset recovery. iOS obecnie zatrzymany na systemowym Open dialog; historyczny P0-I02 PASS z 2026-10-29 pozostaje w raporcie. Własny APK Android NOT VERIFIED. |
| Sign up i logowanie | PASS | BLOCKED | NOT VERIFIED | 2026-11-03: desktop/mobile-web; Auth emulator, fixture API. |
| Weryfikacja e-mail / refresh | PASS | BLOCKED | NOT VERIFIED | 2026-11-03: web kod emulatora + refresh; backend identity fixture, bez rzeczywistej dostawy maila. |
| Przywracanie sesji / logout | PASS | BLOCKED | NOT VERIFIED | 2026-11-03: web reload, logout, ponowne logowanie. |
| Forgot/reset password | PASS | BLOCKED | NOT VERIFIED | 2026-11-03: web reset, login nowym hasłem, odrzucenie ponownie użytego kodu. Android: tylko missing-code recovery PASS. |
| Change password/e-mail, reauth | NOT VERIFIED | BLOCKED | NOT VERIFIED | 2026-11-03: web zmiana hasła i wrong/correct reauth PASS; e-mail read-only, zmiana e-maila nieprzetestowana. |
| GET/PATCH profilu | NOT VERIFIED | BLOCKED | NOT VERIFIED | 2026-11-03: web POST/provision + PATCH i UI PASS na fixture; rzeczywiste GET/PATCH API nieprzetestowane w P0-I12. |
| Delete account | PASS | BLOCKED | NOT VERIFIED | 2026-11-03: web wrong/correct reauth, fixture DELETE, Firebase delete i odmowa ponownego logowania. |
| Backend ACL i invalid token | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Bieżący backend zablokowany przez Docker read-only; historyczne testy P0-I11 w jego raporcie. |
| Deep linki bez kodu / klawiatura | PASS | BLOCKED | PASS | 2026-11-03: Android reset/verify missing-code, recovery, keyboard/reveal; web missing-code links, klawiatura/reveal PASS po korekcie asercji. |
| Sieć/offline i local/remote API | NOT VERIFIED | BLOCKED | NOT VERIFIED | 2026-11-03: web fixture connection refused → offline → retry PASS. Rzeczywiste local/remote API i odłączenie sieci niezweryfikowane. |

Wartości: `PASS`, `FAIL`, `BLOCKED`, `N/A` (z uzasadnieniem), `NOT VERIFIED`. PASS obejmuje wyłącznie zakres opisany w dowodzie. Nie zamieniaj `NOT VERIFIED` na `PASS` bez rzeczywistego uruchomienia testu. Wyniki szczegółowe: `docs/testing/phase-0-results.md`, lokalne dowody `docs/testing/P0-I12/`.

# 5. Aktualny punkt pracy

- **Bieżąca iteracja (2026-11-04):** `P2-I03` — Event detail, external checkout & links, IN_PROGRESS / NOT VERIFIED. Szczegóły, linki, ICS i wymagania SEO przygotowane; T01–T04/V01/V02 otwarte. P2-I00–P2-I02 nadal niezweryfikowane.
- **Priorytet właściciela:** Myth Battle P1-I06 PARKED/TODO; lokalny rozwój Sober Events zatwierdzony. Otwarte bramki Phase 0/1 pozostają niezaliczone (ADR-010).
- **Aktywna faza:** Phase 2 — IN_PROGRESS, 0/7 DONE. Phase 1 nadal 4/6 DONE; Phase 0 nadal 13/15 DONE.
- **Następny krok:** aktywacja backendu/V17 i odbiór przepływu lista→szczegóły→zewnętrzny link/kalendarz według `backend/EVENT_DETAIL.md` przez właściciela. P2-I04 (portal organizatora/moderacji) wymaga osobnego polecenia.
- **Weryfikacja:** bez testów/buildów/typecheck, migracji/restartów i wywołań API/przeglądarki/symulatorów. Eksport ICS nie deklaruje zapisu do kalendarza; SEO produkcyjne i universal links wymagają finalnego hostingu/origin.
- **Dokumentacja:** `backend/EVENT_DETAIL.md`, EVENTS_API/README, branding i tracker. CHANGELOG odroczony do rzeczywistego odbioru.

# 6. Dziennik sesji agenta (dopisuj po każdej sesji)

| Data (YYYY-MM-DD) | Iteracja | Wynik | Zmienione pliki / testy / dowody | Blokery i następne kroki |
|---|---|---|---|---|
| — | — | Utworzono plan iteracyjny; brak potwierdzonych prac implementacyjnych | — | Rozpocznij `P0-I00` |
| 2026-10-29 | P0-I00 | Audyt i propozycje gotowe; T01–T04, V01–V02 zweryfikowane dokumentacyjnie; status BLOCKED, DoD niezatwierdzony | docs/architecture/P0-I00-audit.md, docs/adr/001–003, docs/testing/P0-I00-results.md, PHASES.md, CHANGELOG.md; kontrola repo, wersji narzędzi, oficjalnych macierzy i dokumentacji | Właściciel: decyzje D1–D4, w tym rozbieżność JUnit. Android wymaga naprawy przed testami. Następna P0-I01 wyłącznie po odrębnym poleceniu. |

| 2026-10-29 | P0-I00 | Właściciel zatwierdził D1–D4; DoD spełnione, DONE | ADR-001–003 ACCEPTED, audyt i raport uzupełnione o zapis akceptacji; historyczne wyniki pozostawiono jawne | Zlecono P0-I01; katalog docs lokalny na wyraźne polecenie właściciela |
| 2026-10-29 | P0-I01 | DONE; T01–T04 i V01–V02 zweryfikowane | apps/consumer, packages, backend/pom.xml i wrapper, infra/compose, konfiguracje root, lockfile, scripts, README, PHASES, CHANGELOG; lokalnie docs/testing/P0-I01-results.md. Bootstrap czystej kopii i powtórzenie, pnpm check/build/-r lint, Maven verify — exit 0; negatywne scenariusze narzędzi i konfiguracji PASS | Brak blokera P0-I01; brak testów platform (brak aplikacji). P0-I02 wyłącznie po kolejnym poleceniu; Android do sprawdzenia. |
| 2026-11-01 | P0-I04 | DONE; T01–T06 i V01–V04 zweryfikowane | backend (pom Spring Boot 4.1.2, kod common/identity/profile, Flyway V1, profile, Dockerfile), infra/compose (compose.yml, .env.example, README), docs/testing/P0-I04-results.md (lokalnie), CHANGELOG, PHASES. `./mvnw verify` exit 0 (3 unit, 15 IT); compose: healthy, probes 200, 401 problem+json, OpenAPI 200, 2 repliki, graceful stop; brak sekretów w obrazie; `pnpm check` exit 0 | Brak blokera backendu. P0-I03A V02/V03 otwarte. Następna P0-I05 wyłącznie po poleceniu. |
| 2026-11-01 | P0-I05 | DONE (zamknięte decyzją właściciela); T02–T05, V01, V02 zweryfikowane dla dev | backend: Firebase Admin SDK (`identity/token`), filtr `FirebaseAuthenticationFilter`, `/api/v1/identity/me`, reguły ROLE_USER/ROLE_UNVERIFIED; infra/compose (emulator Auth, env), infra/firebase (README, firebase.json), docs/testing/P0-I05-results.md (lokalnie), CHANGELOG, PHASES. `./mvnw verify` exit 0 (3 unit, 21 IT); emulator E2E 403/200/401; realny projekt dev: filtr na koncie testowym (bez tokena 401, niezweryfikowany 403, zmodyfikowany token 401, po weryfikacji 200), ADC przez gcloud; konto testowe usunięte. | T01 staging/prod odłożone decyzją właściciela (zamknięcie iteracji zatwierdzone przez właściciela; T01 nie zaznaczone). Nie commitowano. |

| 2026-11-03 | P0-I12 | BLOCKED; T04, V01, V02 wykonane; T01–T03 częściowe | Playwright config + account-flow + platform-verification; PHASES, CHANGELOG; lokalne docs/testing/phase-0-results.md i P0-I12/. Web 22/24, następnie 6/6 po korekcie asercji typu pola; wszystkie 24 scenariusze potwierdzone. pnpm check PASS; Jest 71/71; Android Expo Go smoke i sześć asercji UI PASS. | iOS system Open dialog i osascript 1002; Docker read-only (testy web użyły lokalnego Auth CLI 15.30.1); natywne konto, screen readery, duży font, realne local/remote API NOT VERIFIED. Kontynuować P0-I12, nie rozpoczynać P0-I13. |

| 2026-11-03 | P0-I12 | DONE; T01–T03 zaznaczone po potwierdzeniu właściciela; wszystkie zadania i weryfikacje zamknięte | PHASES.md, CHANGELOG.md, lokalny docs/testing/phase-0-results.md; właściciel potwierdził samodzielne sprawdzenie T01–T03 z wynikiem OK i polecił zamknąć iterację. Kontrola dokumentacji; bez nowych testów automatycznych. | Brak blockerów odbioru zgłoszonych przez właściciela. Nie dopisano niepodanych urządzeń, wersji ani artefaktów. Następna P0-I13 tylko po odrębnym poleceniu; Phase 0 nadal otwarta. |

| 2026-11-03 | P0-I13 | BLOCKED; T01/T03 zweryfikowane, pozostałe częściowe | .github/workflows, EAS profiles/hook, infra/staging HTTPS/monitor/backup/restore/security, staging health config, scripts i README; lokalne docs/testing/P0-I13-results.md i logi. Check, infra 10/10, Jest 71/71, web 24/24, backend unit 3/3, exports, Gitleaks, actionlint/schema PASS; Caddy TLS fixture smoke 17 PASS. | Brak hosta/domeny/projektu EAS potwierdzony przez właściciela. Docker read-only blokuje IT/image/real restore; hosted CI i zdalny smoke nieuruchomione; P0-I03A otwarte. Kontynuować P0-I13, bez przejścia do Phase 1. |

| 2026-11-03 | P0-I13 / kolejność Phase 1 | Zatwierdzone odroczenie zdalnych prac; następna P1-I00 | PHASES.md, lokalny ADR-004; właściciel chce rozpocząć Phase 1 przed uzyskaniem hosta. Zmieniono zależność lokalnego startu, zachowując P0-I13 BLOCKED i Phase 0 otwartą; implementacji P1-I00 nie rozpoczęto. Kontrola dokumentacji, bez nowych testów aplikacji. | P1-I00 V01 nadal wymaga sprawnego PostgreSQL/Dockera. Brak nowego wpisu CHANGELOG: zmiana kolejności planu, bez ukończonej funkcjonalności. |

| 2026-11-03 | P1-I00 — wymagania źródeł | Dodano The Lancet jako planowane źródło artykułów i badań na polecenie właściciela | Raport §24.2, PHASES.md; kontrola dokumentacji i diff. Bez zmian kodu i nowych testów aplikacji; P1-I00 pozostaje TODO. | Uwzględnić typ publikacji, metadane, ograniczenia, licencję i recenzję w P1-I00. Bez wpisu CHANGELOG — aktualizacja wymagań, nie ukończona funkcja. |

| 2026-11-03 | P1-I00 | DONE; T01–T04 i V01 zweryfikowane | Moduł evidence (JPA/typy/walidacja), Flyway V4, SCIENCE_POLICY, ADR-005, testy evidence i native-PostgreSQL fallback testów; PHASES/CHANGELOG; lokalne docs/testing/P1-I00-results.md i logi. Maven 8 unit + 50 IT PASS (16 evidence IT), pnpm check PASS. | Docker nadal read-only; rzeczywisty PostgreSQL 17.11 uruchomiono jako izolowany klaster /tmp. Testy upgrade, JPA, publikacji/recenzji i współbieżności PASS. P0-I03A/P0-I13 pozostają otwarte. Następna P1-I01 tylko po poleceniu. |

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

- **Spójność UI:** kolejne moduły rozwijają wzorzec zaakceptowany w P0-I03A i opisany w `docs/BRANDING.md`; projektuj ich szczegóły w odpowiednich iteracjach. Przed publicznym MVP obowiązuje wspólny odbiór P2-I06-T05/V03.
- **Misja:** aktywnie wspieraj wybór życia bez alkoholu, bez moralizowania ani zawstydzania. Wiedza naukowa i społeczność/eventy są równie ważne; najważniejszy rodzaj wydarzeń to sober party/rave, poszerzony o sober lifestyle.
- **Wiarygodność:** każde twierdzenie naukowe ma źródło, poziom pewności, rok/dataset i ograniczenia. Nie przedstawiaj wyników badań obserwacyjnych jako dowodu przyczynowości ani dowodów populacyjnych jako prognozy dla osoby.
- **Dostępność i internacjonalizacja:** web/iOS/Android, minimum en/pl od startu, poprawne daty i strefy IANA, waluty ISO, klawiatura i podstawowa obsługa screen reader.
- **Bezpieczeństwo:** weryfikacja tożsamości na backendzie, zasada najmniejszych uprawnień, walidacja wejścia, rate limiting, testy authz, minimalizacja PII, bez sekretów w repo.
- **Observability:** użyteczne metryki, logi bez PII/tokenów, kontrola błędów i kosztów. Dane o abstynencji/zdrowiu nie są domyślnym warunkiem korzystania z aplikacji.
- **Środowiska:** żadnego udawania gotowych funkcji, zatwierdzonych publikacji, przetestowanych platform, prawdziwych eventów, zakupionych biletów ani działań produkcyjnych.
- **Regresje:** testy przy każdej iteracji, wymogi gate przed zamknięciem fazy i konkretne zapisy w `CHANGELOG.md` dla rzeczywiście ukończonych większych zmian.

| 2026-10-29 | P0-I02 | DONE; T01–T04 i V01–V02 zweryfikowane | apps/consumer: Expo Router/TS, start, jawne placeholdery, Playwright; lockfile, README, ignore, PHASES, CHANGELOG. Frozen install/check/build/export PASS, Doctor 20/20, web 4/4; iOS development build/start i manualna nawigacja właściciela; Android Expo Go/ADB wszystkie trasy i powroty. Lokalne XML/screenshoty i raport w docs/testing/P0-I02. | Brak blokera iteracji; własny APK Android NOT VERIFIED, brak platformy SDK 37. Nie uruchomiono P0-I03. /docs nadal ignorowane. |
| 2026-10-31 | P0-I03 | DONE; T01–T04 i V01–V02 zweryfikowane | `packages/design-tokens` (tokeny), `apps/consumer/src/ui/*` (Screen/Button/TextField/Alert/LoadingState/EmptyState + testy Jest), `apps/consumer/src/auth/AuthStatusContext.tsx` (stub, zawsze `guest`) + test, `apps/consumer/app/_layout.tsx` i nowe grupy tras `(public)`/`(authenticated)`/`verification-pending` (Expo Router `Stack.Protected`), `apps/consumer/src/i18n/*` (i18next/react-i18next/expo-localization, en/pl) + test parzystości kluczy, przepisane `WelcomeScreen`/`UnavailableScreen`/nowy `VerificationPendingScreen`/`+not-found`, zaktualizowany `tests/web/navigation.spec.ts`, `babel.config.cjs`, `jest.config.cjs`, `eslint.config.mjs` (globale dla `.cjs`), README konsumenta, PHASES, CHANGELOG. `pnpm run check` exit 0; Jest 6/6 suites (15/15) PASS; Playwright web 6/6 PASS; `pnpm run build` + `export:native` exit 0; manualnie na iOS Simulator i Android Emulator (Expo Go dopasowane do SDK 58): render, i18n wg lokalizacji urządzenia i guard `/account`+`/verification-pending` (deep-linki) PASS na obu platformach. | Brak blokera iteracji. Nawigacja dotykiem na symulatorach NOT VERIFIED przez agenta (brak narzędzia do gestów) — do potwierdzenia manualnie przez właściciela. `expo-doctor` 19/20 z powodu niezwiązanego z tą iteracją patch-rozjazdu `expo`/`expo-router`/`expo-dev-client`. Nie uruchomiono P0-I04. |

| 2026-10-31 | P0-I03 — korekta nawigacji | Web VERIFIED; natywne menu NOT VERIFIED | Menu boczne wspólne dla publicznych sekcji, aktywna pozycja, EN/PL, usunięte kafelki. Check PASS, Jest 15/15, Playwright 10/10, build web i eksport iOS/Android PASS. Wytyczne zapisano w lokalnym docs/BRANDING.md. | Brak uruchomionych symulatorów; właściciel powinien zweryfikować menu i a11y na iOS/Android. Nie rozpoczęto P0-I04. |

| 2026-10-31 | P0-I03 — doprecyzowanie stałego menu | Web VERIFIED; runtime natywny NOT VERIFIED | SideMenu, public layout, navigation.ts (44 funkcje + Home / 11 grup), EN/PL, testy, lokalne BRANDING. Panel rozwinięty domyślnie, zwijany do 64 dp, bez zamknięcia, stan zachowany między sekcjami; funkcje planowane widoczne i nieaktywne. Check PASS; Jest 15/15; web 10/10; build web i eksport iOS/Android PASS. | Na iOS/Android sprawdzić rozwijanie/zwijanie, scroll, nawigację, duży font i czytnik ekranu. P0-I04 nie rozpoczęto. |

| 2026-10-31 | P0-I03 — menu ☰ i emoji | Web VERIFIED; native runtime NOT VERIFIED | SideMenu/public layout/navigation/tłumaczenia/testy/token backdrop. Hamburger w lewym górnym rogu otwiera modal, 45 pozycji z emoji bez podpisów Planowane. Check, Jest 15/15, build/export PASS; web bazowe 6/6 oraz powtórzone testy menu 4/4 PASS po korekcie asercji RN Web. Lokalny BRANDING zaktualizowany. | Następnie sprawdzić menu na iOS/Android, czytniki ekranu i duży font (P0-I03); P0-I04 nie rozpoczęto. |

| 2026-10-31 | P0-I03 — uproszczenie menu | Web VERIFIED; native runtime NOT VERIFIED | navigation.ts, SideMenu, EN/PL, testy, lokalny BRANDING. Osiem pozycji zamiast 45, bez grup, zachowano ☰ i emoji. Check PASS, web 10/10 PASS; zrzut mobile-web sprawdzony. | Następny krok P0-I03: sprawdzenie menu i a11y na iOS/Android; P0-I04 nie rozpoczęto. |

| 2026-11-01 | Plan — P0-I03A / P2-I06 | Rozszerzono roadmapę na polecenie właściciela; brak rozpoczęcia implementacji | Wyłącznie PHASES.md: dodano P0-I03A (TODO), zależność P0-I04, wzorzec UI dla kolejnych modułów i odbiór wizualny MVP w P2-I06; zaktualizowano liczniki do 4/79 (Phase 0: 4/15). Weryfikacja dokumentu: diff, spójność ID/statusów i git diff --check. Bez testów aplikacji i wpisu w CHANGELOG — zmiana planu. | Następna P0-I03A na osobne polecenie; otwarte kontrole natywnego menu P0-I03 pozostają NOT VERIFIED. |

| 2026-11-01 | P0-I03A | IN_PROGRESS; T01/T02 zweryfikowane, projekt v1 do oceny | PHASES.md i design/previews/P0-I03A-v1: audyt UI, podgląd Home/Science/Events EN/PL, mobile/desktop, 12 screenshotów i skrypt weryfikacji. Chromium 12 wariantów PASS, PL 320 px/powiększenie PASS, ESLint/Prettier/składnia JS PASS. Bez zmian aplikacji i BRANDING. | T03: właściciel ocenia konkretną wersję; T04 dopiero po akceptacji. Brak uruchomionych symulatorów; runtime natywny i pełne a11y NOT VERIFIED. Bez CHANGELOG: propozycja jeszcze niezatwierdzona, brak wdrożonej funkcji. |

| 2026-11-01 | P0-I03A — projekt v2 | IN_PROGRESS; uwagi T03 uwzględnione, akceptacja nadal oczekuje | Właściciel odrzucił v1: dwie karty wejściowe Science/Events i zbyt sucha prezentacja. Dodano design/previews/P0-I03A-v2: sekcje odkrywania, wybór tematów, panele lektury i wydarzeń, agenda zamiast kart, filtry miasta/kategorii, reset/pusty stan, ręczna zmiana plakatów, reakcje hover/focus i reduced motion. Chromium 12 wariantów EN/PL PASS; 320 px/powiększenie i reduced motion PASS; ESLint/Prettier/składnia PASS. V1 zachowana z zapisem odrzucenia. | Następny krok T03: ocena wersji v2. Bez zmian współdzielonego UI, BRANDING i CHANGELOG (prototyp); natywne i pełne a11y nadal NOT VERIFIED. |

| 2026-11-01 | P0-I03A — projekt v3 | IN_PROGRESS; doprecyzowano Home na polecenie właściciela | design/previews/P0-I03A-v3 i PHASES; lokalny BRANDING: Home tylko powitanie i najnowsze artykuły/badania. Chronologiczny feed, typy, daty, filtry i panel lektury; bez promocji eventów. Science/Events w osobnych sekcjach. Chromium 12 wariantów i interakcje, PL 320 px/powiększenie, reduced motion, ESLint/Prettier/składnia i diff check — wyniki w verification.txt/README. | Następny krok T03: ocena v3. Akceptacja zakresu Home nie oznacza akceptacji całego wyglądu. Bez zmian aplikacji i wpisu CHANGELOG; runtime natywny/pełne a11y nadal NOT VERIFIED. |

| 2026-11-01 | P0-I03A — projekt v4 | IN_PROGRESS; dopracowano T03 według uwag właściciela | design/previews/P0-I03A-v4, PHASES i lokalny BRANDING. Usunięto CTA „Czytaj podgląd”, zmniejszono nagłówki i użyto fioletu; Home w układzie wyróżnionej publikacji z trzema mniejszymi, cztery lokalne ilustracje SVG, segmentowe filtry i interakcja całego wpisu. Chromium 12 wariantów EN/PL PASS, kontrola h1/ilustracji/CTA, PL 320 px/powiększenie i reduced motion PASS; lint/format/składnia/diff PASS. | T03: ocena v4. Bez zmian aplikacji Expo i wpisu CHANGELOG; runtime natywny oraz pełne a11y nadal NOT VERIFIED. |

| 2026-11-01 | P0-I03A — warianty kolorystyczne v4 | IN_PROGRESS; przygotowano 5 propozycji na życzenie właściciela | design/previews/P0-I03A-colors: Fiolet/Indygo/Błękit/Morski/Terakota, przełącznik, przemalowane SVG i porównanie desktop/mobile. Chromium 20 kombinacji EN/PL PASS, 35 par kontrastu PASS (tekst min. 4.93:1), lokalny HTML PASS; 10 screenshotów PL. ESLint/Prettier/składnia/diff PASS. | Następny krok T03: wybór palety i odbiór projektu. BRANDING, tokeny i Expo bez zmian; bez CHANGELOG (propozycje). Testy natywne/pełne a11y pozostają NOT VERIFIED. |

| 2026-11-01 | P0-I03A — ciemne motywy v4 | IN_PROGRESS; 5 ciemnych propozycji na polecenie właściciela | design/previews/P0-I03A-dark i PHASES: Śliwka/Północ/Grafit/Laguna/Kakao, osobne ciemne tokeny, dekoracyjne SVG, kontrast onPrimary, przełącznik i porównanie desktop/mobile. Chromium 20 kombinacji EN/PL PASS, 50 par kontrastu PASS (tekst min. 5.81:1), lokalny HTML PASS; 10 screenshotów PL. ESLint/Prettier/składnia/diff PASS. | T03: wybór palety i akceptacja projektu. Dotychczasowe BRANDING, tokeny i Expo bez zmian; bez wpisu CHANGELOG (prototyp). Natywne runtime/pełne a11y NOT VERIFIED. |

| 2026-11-01 | P0-I03A — jaśniejsza Śliwka | IN_PROGRESS; korekta preferowanego motywu do oceny | Właściciel preferuje Śliwkę i poprosił o lekkie rozjaśnienie. design/previews/P0-I03A-plum i PHASES: tło #211B2A, panele #2A2235/#342A43, lawenda #C1A4F6 bez zmiany; oryginał zachowany w przełączniku. Chromium 8 kombinacji EN/PL PASS, 20 par kontrastu PASS (nowa wersja: tekst min. 6.07:1); 4 screenshoty PL. ESLint/Prettier/składnia/diff PASS. | T03: ocena plum-soft i odbiór projektu. Bez zmiany BRANDING/tokenów/Expo i wpisu CHANGELOG; natywne runtime/pełne a11y NOT VERIFIED. |

| 2026-11-01 | P0-I03A — akceptacja motywów i porządkowanie | IN_PROGRESS; T03/T05 zakończone, T04/V01–V03 otwarte | Właściciel zaakceptował default plum-soft i jasny violet. PHASES, lokalny BRANDING i AGENTS zsynchronizowane. Zatwierdzone referencje oraz raporty przeniesiono do design/reference/P0-I03A; usunięto 7 katalogów previews na wyraźne polecenie. Referencja: Chromium 8 wariantów i 20 par kontrastu PASS; lint/format/składnia/diff PASS. CHANGELOG: wpis o zatwierdzonym projekcie, bez deklaracji wdrożenia. | Następny krok P0-I03A-T04: implementacja obu motywów/przełącznika/zapisu wyboru i testy. Bez twierdzenia, że aplikacja już używa Śliwki. |

| 2026-11-01 | Plan — język UI i profil (P0-I03A/P0-I04/P0-I09) | Doprecyzowano wymagania; bez rozpoczęcia nowych iteracji | PHASES: ręczny wybór EN/PL, nullable locale w profilu PostgreSQL, GET/PATCH /me, pierwszeństwo profilu nad urządzeniem, cache per konto/gość, migracja jawnego wyboru przy nowym profilu, offline/błędy i testy trwałości/ACL/drugiego urządzenia. Lokalny BRANDING uzupełniono o zachowanie języka. Sprawdzono obecny kod i18n: wykrywa urządzenie, brak ręcznej persystencji. | Aktualna iteracja nadal P0-I03A; lokalne UI języka w T04, zapis profilu w P0-I09. Bez zmiany kodu aplikacji, testów runtime i wpisu CHANGELOG — aktualizacja planu. |
| 2026-11-01 | P0-I03A — wdrożenie motywów i preferencji | T04 wdrożone, V01 zweryfikowane; iteracja IN_PROGRESS | Tokeny semantyczne dwóch motywów, provider i ustawienia dostępnego wyboru motywu oraz EN/PL z lokalnym zapisem; dostosowane istniejące ekrany/menu i wspólne komponenty; uzupełniono lokalny `docs/BRANDING.md`. `pnpm run check` PASS; Jest 7/7 suites, 17/17 PASS; Playwright 12/12 PASS przed zmianą klawiaturową, następnie ukierunkowane preferencje desktop/mobile-web 2/2 PASS; referencja 8 wariantów PASS; web export PASS; iOS Simulator build/install PASS. | Android prebuild PASS; instalacja NDK 27.1.12297006 nie została ukończona: pierwsza próba zatrzymana przy 535 MiB, druga pobrała 136 MiB po odzyskaniu miejsca i została zatrzymana przed końcem. Dokończyć instalację NDK i ponowić build/eksport. VoiceOver/TalkBack, duży font i pełny runtime natywny NOT VERIFIED; V02/V03 pozostają otwarte, P0-I04 nie rozpoczęto. |
| 2026-11-01 | P0-I06 | DONE; T01–T05, V01, V02 (web) i V03 zweryfikowane | `apps/consumer/src/auth/*` (Firebase web/native, `AuthStatusContext` z realnym stanem, `identityApi` → `/api/v1/identity/me`, walidacja, mapowanie błędów, offline), ekrany sign-in/sign-up/offline/account, trasy `(public)`, tłumaczenia EN/PL (klucze zgodne), `.env.example` z placeholderami. `pnpm run check` PASS; Jest 9/9 suites, 40/40 PASS; web export PASS. Brak: konfiguracja Firebase web i konto dev (V02), iOS/Android (V03). Polityka hasła 8 znaków wymaga akceptacji właściciela; sign-up nie wysyła e-maila weryfikacyjnego (P0-I07). | 2026-11-01 | P0-I06 | DONE; T01–T05, V01, V02 (web) i V03 zweryfikowane | `apps/consumer/src/auth/*` (Firebase web/native, `AuthStatusContext` z realnym stanem, `identityApi` → `/api/v1/identity/me`, walidacja, mapowanie błędów, offline), ekrany sign-in/sign-up/offline/account, trasy `(public)`, tłumaczenia EN/PL (klucze zgodne), `.env.example` z placeholderami. `pnpm run check` PASS; Jest 9/9 suites, 40/40 PASS; web export PASS. Brak: konfiguracja Firebase web i konto dev (V02), iOS/Android (V03). Polityka hasła 8 znaków wymaga akceptacji właściciela; sign-up nie wysyła e-maila weryfikacyjnego (P0-I07). | V03 na iOS Simulatorze i Android Emulatorze; po wynikach status DONE lub BLOCKED. P0-I07 nie rozpoczęto. |
| 2026-11-02 | P0-I07 | DONE; T01–T05, V01 (poprawny i wygasły link, ponowne wysłanie, token) i V02 zweryfikowane | `apps/consumer/src/auth/authAdapter.ts`, `AuthStatusContext.tsx`, `VerificationPendingScreen.tsx`, `VerifyEmailScreen.tsx` + trasa `app/verify-email.tsx`, `SignUpScreen.tsx` (przejście do oczekiwania), tłumaczenia EN/PL, README i `.env.example`. `pnpm check` PASS; Jest 41/41 PASS; eksport web PASS; backend `./mvnw test` PASS. Ręczna weryfikacja właściciela na web (dev `soberity-f9e4b`): mail z kodem, potwierdzenie linkiem, logowanie. | Brak blokerów dla P0-I07 w zakresie web. Smoke test iOS/Android NOT VERIFIED. Następna iteracja P0-I08 wyłącznie po poleceniu. |
| 2026-11-02 | P0-I09 | DONE; T01–T07 i V01–V05 zweryfikowane (V02/V03 zaakceptowane przez właściciela na web) | Backend: `V2__extend_user_profile.sql`, `ProfileService`, `ProfileController`, `ProfileApiIT`. Klient: `src/profile/*`, `ProfileScreen`, trasa `(authenticated)/profile`, zmiana języka konta w menu, EN/PL. `./mvnw clean verify` PASS (3 unit + 30 IT); `pnpm check` PASS; Jest 53/53; eksport web PASS. | iOS/Android NOT VERIFIED (poza zakresem akceptacji). Następna P0-I10 wyłącznie po poleceniu. |
| 2026-11-02 | P0-I10 | DONE; T01–T04 i V01–V02 zweryfikowane (właściciel potwierdził zmianę hasła, e-maila i usunięcie konta na koncie testowym dev) | Backend: `V3__create_deleted_account.sql`, `DeletedAccount`, `ProfileService.deleteOwnAccount`, `DELETE /api/v1/me`, `ProfileApiIT` (12). Klient: `authAdapter.ts`, `account/accountSecurity.ts` + test (7), `AccountSettingsScreen.tsx`, trasa `settings`, EN/PL. `./mvnw clean verify` PASS (3 unit + 33 IT); `pnpm check` PASS; Jest 60/60; eksport web PASS. Ops: lokalny backend na 8090 był starym buildem sprzed P0-I09 (404 na `/api/v1/me`, „Profile unavailable”); zrestartowano z aktualnego jara, Postgres z `infra/compose` (port 5433). | iOS/Android NOT VERIFIED. Następna P0-I11 wyłącznie po poleceniu. |
| 2026-11-02 | P0-I08 | DONE; T01–T04 i V01–V02 zweryfikowane ręcznie (web/localhost) | `authAdapter.ts`, `AuthStatusContext.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`, trasy `(public)/forgot-password` i `reset-password`, link na logowaniu, EN/PL, `authAdapter.test.ts`, testy kontekstu. `pnpm check` PASS; Jest 46/46 PASS; eksport web PASS; ręcznie: mail resetu, reset na stronie Firebase, `/reset-password?oobCode=…`, przywrócenie sesji po odświeżeniu, wylogowanie, wygasły/zużyty kod. | Hosted domain i action URL w konsoli NOT VERIFIED (nie wymagane na localhost); iOS/Android poza zakresem. Następna iteracja P0-I09 wyłącznie po poleceniu. |

| 2026-11-02 | P0-I03A — Home na polecenie właściciela | Wdrożono powitanie i mock news feed; status nadrzędnej iteracji bez zmiany | WelcomeScreen, src/news, EN/PL, testy home/navigation, ignore artefaktów testowych. 16/16 web PASS; po usunięciu web warning SVG Home 8/8 PASS; Jest 66/66; check i eksporty web/iOS/Android PASS; iOS Expo Go render PL/Śliwka PASS (iPhone 17 Pro / iOS 26.5). Raport lokalny docs/testing/home-news-2026-11-02.md; CHANGELOG zaktualizowany. | Brak emulatora Android (`adb devices` puste); runtime Android i screen-reader/duży font NOT VERIFIED. Właściciel 2026-11-02 zatwierdził pozostawienie interfejsu gościa bez menu i aktualizację testów. P0-I11 niezamknięte; powrót na osobne polecenie. |

| 2026-11-02 | P0-I03A — korekta Home po uwagach właściciela | Zmieniono kod; NOT VERIFIED na wyraźne polecenie bez testów | WelcomeScreen tylko w grupie authenticated, osobny GuestWelcomeScreen w public; usunięto opis powitania, akcje auth i opis pod wiadomościami. BRANDING zaktualizowany. | Nie uruchomiono testów ani buildów. Wcześniejsze wyniki dotyczą poprzedniej wersji; home.spec.ts i oczekiwania nagłówka w navigation.spec.ts wymagają dostosowania przy kolejnym zleceniu testów. Brak nowych checkboxów DONE; P0-I03A nadal IN_PROGRESS. |

| 2026-11-03 | P0-I03A — Home: kafle i powitanie z imieniem | Zmieniono kod; NOT VERIFIED | `WelcomeScreen`, profile GET z fallbackami, sekcje news/events/for you, EN/PL, `docs/BRANDING.md`, CHANGELOG. Testy/build nie uruchamiane zgodnie z obowiązującą zasadą. | Kontrole web/natywne i accessibility pozostają NOT VERIFIED; wcześniejszy `home.spec.ts` odnosi się do starej wersji. Iteracja P0-I03A nadal otwarta. |

| 2026-11-03 | P0-I03A — nowocześniejszy Home według inspiracji | Zmieniono hierarchię powitania i kafli; NOT VERIFIED | `WelcomeScreen`, EN/PL greeting. Osobne karty wpisów, wyróżnienie najnowszego, większe zaokrąglenia i delikatne tła kafli. Tylko zatwierdzone tokeny. Testów/buildów nie uruchamiano. | Weryfikacja web/iOS/Android i dostępności pozostaje NOT VERIFIED. P0-I03A nadal IN_PROGRESS. |

| 2026-11-03 | P0-I03A — kolejność sekcji Home i przycisk news | Zmieniono kod; NOT VERIFIED | Przeniesiono wydarzenia i rekomendacje przed news, ograniczono listę do 2 wpisów, dodano zlokalizowany wyłączony przycisk przejścia do news. Bez testów/buildów (polecenie użytkownika). | NOT VERIFIED; P0-I03A pozostaje IN_PROGRESS. |

| 2026-11-03 | P0-I03A — dopracowanie nowoczesnego Home | Zmieniono kod; NOT VERIFIED | WelcomeScreen: hierarchia greeting/name, wyróżniony news tile, category pill, ikony w miękkich polach; tylko istniejące tokeny. Testy/build nie uruchamiane. | Weryfikacja wyglądu i dostępności pozostaje otwarta; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — styl typografii Home | Zmieniono kod; NOT VERIFIED | Dopracowano wagę, tracking i line-height nagłówków/tekstów Home w obrębie fontu systemowego. Bez nowego fontu marki. Testów/buildów nie uruchamiano. | Weryfikacja wizualna i a11y pozostają otwarte; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — kolejność kafli Home | Zmieniono kolejność na prośbę właściciela; NOT VERIFIED | `WelcomeScreen`: „Dla Ciebie na dziś” nad „Najbliższe wydarzenia”. Testów nie uruchamiano. | P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — dekoracyjne tła kafli Home | Zmieniono wygląd kafli; NOT VERIFIED | `WelcomeScreen`: dwa subtelne, abstrakcyjne wzory SVG z łukami i pierścieniami dla rekomendacji oraz wydarzeń; istniejące kolory motywu, treść nad grafiką. Testów/buildów nie uruchamiano na polecenie właściciela. | Weryfikacja web/natywna i a11y pozostają NOT VERIFIED. P0-I03A IN_PROGRESS; P0-I11 nie rozpoczęto w tej sesji. |

| 2026-11-03 | P0-I03A — przykładowe treści kafli Home | Zmieniono zawartość kafli; NOT VERIFIED | „Dla Ciebie na dziś” prezentuje zaproszenie do sprawdzenia statystyk na mapie świata, „Najbliższe wydarzenia” prezentuje Vienna Coffee Rave. Oba oznaczone „Przykład/Sample”; EN/PL. Testów/buildów nie uruchamiano. | Wpisy są statycznymi mockami, bez nawigacji ani pobierania danych. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — uproszczenie i ilustracje kafli Home | Zmieniono wygląd kafli; NOT VERIFIED | Usunięto ikony i etykiety „Sample/Przykład”; dekoracja mapy świata dla rekomendacji oraz sylwetki osób dla Vienna Coffee Rave. Testów/buildów nie uruchamiano. | Mocki pozostają statyczne, bez nawigacji/danych live. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — wskazanie klikalności kafli Home | Zmieniono affordance; NOT VERIFIED | Dwa kafle dostały etykietę „Odkryj/Explore” i chevron oraz opis dostępności dla czytnika ekranu. Aktualnie disabled, bez nawigacji do nieistniejących tras. Testów/buildów nie uruchamiano. | Przyszłe trasy mapy i eventów nie są podpięte; wizualna weryfikacja NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — usunięcie powitania z Home | Zmieniono Home; NOT VERIFIED | Usunięto nagłówek z powitaniem i nazwą użytkownika oraz pobieranie profilu używane wyłącznie przez ten nagłówek. Testów/buildów nie uruchamiano. | Pozostała treść Home bez zmian; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — spersonalizowany nagłówek rekomendacji | Zmieniono Home; NOT VERIFIED | Nagłówek sekcji zawiera „Welcome {username}, here is your daily recommendation” i lokalizację EN/PL; nazwa z Firebase displayName lub prefiksu e-maila. Testów/buildów nie uruchamiano. | Tłumaczenia i układ wymagają weryfikacji wizualnej; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — grafika kafla Coffee Rave | Dodano asset właściciela; NOT VERIFIED | Dodano `apps/consumer/assets/images/vienna-coffee-rave.png` (1280×720 PNG) i użyto go jako przyciemnionego tła kafla Vienna Coffee Rave; obraz dekoracyjny ukryty przed czytnikami ekranu. Testów/buildów nie uruchamiano. | Weryfikacja renderu na web/iOS/Android pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — korekta kadru kafla Coffee Rave | Skorygowano layout po uwadze właściciela; NOT VERIFIED | Kafel ma zwartą wysokość 200 px; obraz wypełnia tylko kafel, a treść jest nałożona na subtelny tokenowy gradient. Usunięto flex rozciągający kafel do wysokości sekcji. Testów/buildów nie uruchamiano. | Render pozostaje do wizualnego potwierdzenia; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — kadr filiżanki i czytelność Vienna Coffee Rave | Zmieniono układ po informacji zwrotnej; NOT VERIFIED | Obraz 16:9 zajmuje jawny górny panel 180 px, pokazując centralną filiżankę; tytuł, opis i akcja są w oddzielnym panelu 120 px. Usunięto gradient nakładany na całą grafikę. Testów/buildów nie uruchamiano. | Render nadal wymaga potwierdzenia właściciela; P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — grafika kafla World Map | Dodano asset właściciela; NOT VERIFIED | Dodano `apps/consumer/assets/images/world-map-preview.png` (1280×720 PNG); górny kadr ma tę samą wysokość i panel tekstu/akcji co karta Coffee Rave. Testów/buildów nie uruchamiano. | Render web/natywny pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — przycięcie grafiki World Map | Podmieniono kadr na życzenie właściciela; NOT VERIFIED | Nowy `world-map-earth.png` (1672×941) skupia kadr na planecie i pinezce; karta używa go w tym samym górnym panelu co wcześniej, panel treści pozostaje oddzielny. Testów/buildów nie uruchamiano. | Render web/natywny pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — etykieta sekcji World Map | Zmieniono Home na polecenie właściciela; NOT VERIFIED | Usunięto powitanie z nazwą użytkownika; nad kartą mapy dodano nagłówek „Feature for today” / „Propozycja na dziś” w EN/PL. Testów/buildów nie uruchamiano. | Render pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — realistyczna grafika World Map | Podmieniono grafikę na życzenie właściciela; NOT VERIFIED | Nowy asset `world-map-realistic.png` (1020×525 PNG) jest kadrowany pod górny panel karty i eksponuje mapę świata. Testów/buildów nie uruchamiano. | Render pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — nowa grafika Coffee Rave | Podmieniono grafikę na życzenie właściciela; NOT VERIFIED | `vienna-coffee-rave-cup.png` (880×453 PNG) pokazuje filiżankę jako główny motyw w górnym panelu karty. Testów/buildów nie uruchamiano. | Render pozostaje NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — styl etykiet sekcji Home | Wystylizowano nagłówki; NOT VERIFIED | „Feature for today”, „Nearest events”, „Latest news” są kompaktowymi chipami z tłem/ramką z tokenów i fioletowym znacznikiem; semantyka nagłówków zachowana. Testów/buildów nie uruchamiano. | Render wizualny i oba motywy wymagają potwierdzenia. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — nagłówki Home w stylu rozdziałów | Zmieniono styl po uwadze właściciela; NOT VERIFIED | Zastąpiono chipy nagłówkami z numeracją 01–03, mocniejszym tytułem i cienką linią; semantic headings i tokeny motywu zachowane. Testów/buildów nie uruchamiano. | Weryfikacja wizualna obu motywów NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — kropki zamiast numeracji sekcji Home | Zmieniono detale stylu na życzenie właściciela; NOT VERIFIED | Usunięto 01–03; zachowano tytuły i linie, a numer zastąpiono małym akcentowym punktem. Testów/buildów nie uruchamiano. | Render obu motywów NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — linie po obu stronach nagłówków Home | Dopasowano detal do uwagi właściciela; NOT VERIFIED | Usunięto punkty i dodano krótki poziomy separator z lewej strony tytułu, stylistycznie zgodny z linią po prawej. Testów/buildów nie uruchamiano. | Render obu motywów NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — mocniejszy akcent nagłówków Home | Zmieniono wizualny akcent na życzenie właściciela; NOT VERIFIED | Tytuły sekcji oraz krótkie linie po lewej używają `primary`; dłuższe linie po prawej pozostają w `border`. Testów/buildów nie uruchamiano. | Render obu motywów NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I03A — dopracowanie Home według briefu premium | Zmieniono Home i nagłówek nawigacji; NOT VERIFIED | Dodano kompaktowy tagline, „Today's spotlight” i kartę World Map z kategorią, obrazem 150–180 px oraz treścią w neutralnym panelu; uproszczono nagłówki/news cards i zmniejszono menu/profil icons. Usunięto mock eventu; event data/API brak, więc pokazany jest pusty stan. Nie dodano nowego Science placeholdera. Testów/buildów nie uruchamiano. | Karuzela wydarzeń, działające trasy mapy/eventów, runtime/a11y i debug overlay pozostają poza dostępnym kodem lub NOT VERIFIED. P0-I03A IN_PROGRESS. |

| 2026-11-03 | P0-I11 — test coverage & E2E web | IN_PROGRESS; T01, T02, T04, V01, V02 PASS; T03 częściowo zweryfikowane | Asercje dopasowane do publicznego welcome i authenticated Home; walidacja logowania/resetu; emulatorowy Playwright account journey i bezpieczne API fixtures. Jest 71/71, `pnpm check` PASS, Maven verify 37/37. Pełny web run 17/18: desktop E2E PASS, mobile Home/navigation PASS. Raport `docs/testing/P0-I11-results.md`. | Mobile E2E utknął w stanie session-loading po profilu. Zmieniono test na SPA navigation; ponowienie zablokowane przez Docker overlay read-only. Nie oznaczać DONE do PASS. |

| 2026-11-03 | P1-I01 | DONE; T01–T04 i V01 zweryfikowane | Publiczne API Science/evidence, projekcje publiczne, filtry/paginacja, ETag JSON + rewalidacja, CORS, deny-all zapisów; Flyway V5 z kategoriami i recenzowanymi wersjami artykułów. Maven 8 unit + 64 IT PASS (14 Science API IT), pnpm check i diff check PASS. Dokumentacja API, PHASES/CHANGELOG i lokalny raport P1-I01. | Izolowany PostgreSQL 17.11; migracje fresh V1–V5 i upgrade V3→V5, wycofanie i podmiana wersji/ETag potwierdzone. Skorygowano oczekiwanie testu odrzuconego tokenu: istniejący filtr daje wyłącznie dostęp anonimowy do publicznego GET; prywatne/zapis nadal 401. Bez zmian UI ani testów runtime platform; P0 nadal otwarta. Następna P1-I02 tylko po poleceniu. |

| 2026-11-03 | P1-I02 | DONE; T01–T04 i V01 zweryfikowane | Prywatne API workflow, role AUTHOR/REVIEWER, Flyway V6 i immutable audit; panel web EN/PL, oba motywy, pełna karta dowodów, osobna recenzja artykułu, publikacja/wycofanie, nowe wersje; poprawki wrap/ARIA w SettingsRow i dekoracji SVG. Maven 81 testów PASS, Jest 76/76, Playwright 8/8 + 2/2 artykuły PASS na realnym lokalnym API/Firebase emulator/PostgreSQL; check/build/native exports i diff check PASS. Raport P1-I02, dokumentacja i CHANGELOG. | Role rzeczywistych redaktorów nadaje operator; brak grantów aplikacyjnych i rzeczywistych publikacji. Web-only; native runtime i czytniki natywne NOT VERIFIED. P0 otwarta; następna P1-I03 tylko po poleceniu. |

| 2026-11-03 | P1-I02 — korekta blog editora | Nowy kod i UI wdrożone lokalnie; pełna integracja NOT VERIFIED / skipped (approved) | Tiptap, panel blogowy, JSON allowlist, źródła, kategorie, obrazy, wersje i audit, autor Publish / Send for review, uwagi recenzenta; V7, helper lokalnego restartu, API docs/ADR-006/BRANDING/raport. Backend 13 unit PASS, klient 76/76, UI 8/8 PASS z symulowanymi API, check/build/native exports i odczytowy smoke PASS. | Właściciel ręcznie zainstalował Tiptap po awarii automatycznego przeglądu uprawnień i zgodził się pominąć Docker integration; 7 BlogApiIT skompilowane, nieuruchomione. Bez automatycznych tłumaczeń, deploymentu i P1-I03. Historyczny DONE pierwotnego P1-I02 zachowany. |

| 2026-11-03 | P1-I03 | IN_PROGRESS; implementacja T01–T04, NOT VERIFIED | `src/science/*`, `app/science/*`, root/public layouts, Home, guest entry, EN/PL i README klienta. Feed, czytnik artykułów i EvidenceCard, źródła, metadane, retry, paginacja i filtry. | Na wyraźne polecenie właściciela nie uruchomiono żadnych testów ani check/build/runtime. Checkboxy otwarte, brak Finished/DONE. CHANGELOG bez wpisu do odbioru; następny krok: ręczna weryfikacja P1-I03. |

| 2026-11-03 | P1-I04 | IN_PROGRESS; implementacja T01–T04, NOT VERIFIED | `src/learning/*`, trasy Science/editorial-quizzes, integracje Discover/panel/konto, EN/PL; backend learning API/service/limiter, SecurityConfig, Flyway V8, LEARNING_API i README. Fiszki, quizy, review, serwerowa ocena i opt-in progress/account erasure. | Na wyraźne polecenie właściciela bez testów, check/typecheck/lint, buildów, migracji i runtime. Checkboxy otwarte, brak Finished/DONE i wpisu CHANGELOG do odbioru. Następny krok: backend V8 i ręczna weryfikacja P1-I04; bez startu P1-I05. |

| 2026-11-03 | P1-I04 — lokalny runtime Expo | Usunięto konflikt procesów Metro; UI NOT VERIFIED | Po zgłoszeniu unknown module 839 znaleziono dwa potwierdzone serwery Expo tego checkoutu na porcie 8082 (IPv4 localhost i IPv6 wildcard). Zatrzymano tylko te procesy, uruchomiono jedną instancję z --clear; jeden listener 127.0.0.1:8082 i komunikat Waiting potwierdzone odczytem procesu/logu. | Bez testów/buildów i otwierania UI na życzenie właściciela. Następny krok: twarde odświeżenie przeglądarki przez właściciela. Bez wpisu CHANGELOG do potwierdzenia naprawy w UI; P1-I04 nadal NOT VERIFIED. |

| 2026-11-03 | P1-I04 — unknown module 839 | Poprawka konfiguracji web; UI NOT VERIFIED | Właściciel potwierdził, że poprzedni restart nie usunął błędu. Log wskazał lazy import trasy i brakujące trasy w grafie. Po sprawdzeniu lokalnego pluginu oraz oficjalnej migracji Expo SDK 58 ustawiono asyncRoutes.web=false w app.json; zrestartowano pojedynczą instancję Metro z --clear na 8082. README opisuje konfigurację. | Odczyt logu/procesu potwierdza gotowość serwera; bez testów i sprawdzania UI. Właściciel powinien wczytać świeżą stronę. Brak deklaracji usunięcia błędu runtime lub wpisu CHANGELOG do potwierdzenia. |

| 2026-11-03 | P1-I03/P1-I04 — obrazy web | Poprawka ReadingImage, NOT VERIFIED | Po zgłoszeniu wyjątku width sprawdzono lokalny ImageLoader RN Web: onLoad zawiera DOM event w nativeEvent, a nie nativeEvent.source. Dodano bezpieczny odczyt source.width/height dla native i target.naturalWidth/naturalHeight dla web, z walidacją skończonych dodatnich wymiarów; bez wymiarów pozostaje domyślna proporcja. | Bez testów/buildów zgodnie z poleceniem. Ręczny odbiór obrazu przez właściciela; CHANGELOG bez wpisu do potwierdzenia naprawy. |

| 2026-11-03 | P1-I03 — uproszczenie artykułu | Usunięto komunikat na polecenie właściciela; NOT VERIFIED | Usunięto osobny blok discover.authorNote z ArticleScreen i nieużywane tłumaczenia EN/PL. | Bez testów i buildów zgodnie z wcześniejszym poleceniem. Drobna korekta UI; bez nowego wpisu CHANGELOG. |

| 2026-11-03 | P1-I03 — stopka źródeł artykułu | Uproszczono UI na polecenie właściciela; NOT VERIFIED | Blok Sprawdź badania i objaśnienie zastąpiono ArticleSources: hr na web/separator native, mały nagłówek Źródła/Sources i subtelne linki bez karty. Zachowano focus i obszary dotyku. Usunięto nieużywane linkOnlyEvidence EN/PL. | Bez testów/buildów. Drobna korekta UI; bez wpisu CHANGELOG do odbioru. |

| 2026-11-03 | P1-I03 — ponowne zgłoszenie błędu obrazów | Usunięto onLoad wymiarów; NOT VERIFIED | Błąd nadal wskazywał dawny callback mimo braku destrukturyzacji w kodzie. ReadingImage używa teraz SizedReadingImage z Image.getSize dla inline, stałym 16:9 cover, walidacją wymiarów i anulowaniem aktualizacji po unmount. Stan jest resetowany przy zmianie URI. Zrestartowano pojedynczy Metro z --clear. | Bez testów/buildów i weryfikacji UI. Właściciel musi odświeżyć dokument przeglądarki; CHANGELOG bez wpisu do potwierdzenia naprawy. |

| 2026-11-03 | P1-I03 — stopka publikacji | Usunięto tekst na polecenie właściciela; NOT VERIFIED | Usunięto discover.education z ArticleScreen i nieużywane tłumaczenia EN/PL. Właściciel odroczył umieszczenie informacji w polityce prywatności; tej polityki nie zmieniano. | Bez testów/buildów. Drobna korekta UI; bez wpisu CHANGELOG. |

| 2026-11-03 | P1-I03 — uproszczenie dat artykułu | Zmieniono metadane czytnika na polecenie właściciela; NOT VERIFIED | ArticleScreen: usunięto wiersz Utworzono/Zmodyfikowano oraz wersję przy Opublikowano; pozostała data publikacji. | Bez testów/buildów. Drobna korekta UI; bez nowego wpisu CHANGELOG. |

| 2026-11-03 | P1-I03 — etykieta publikacji autora | Usunięto na polecenie właściciela; NOT VERIFIED | Usunięto authorPublication z czytnika, feedu i tłumaczeń EN/PL. Etykieta recenzowanej publikacji nadal dotyczy wyłącznie faktycznie recenzowanych materiałów. | Bez testów/buildów. Drobna korekta UI; bez wpisu CHANGELOG. |

| 2026-11-03 | P1-I04 — uruchomienie API quizów | Backend zaktualizowany; testy nadal skipped | Zgłoszony błąd panelu: działał JAR z 18:48 sprzed dodania quizów. Helper start-local-backend zbudował aktualny kod z -DskipTests (BUILD SUCCESS, Tests are skipped), zastąpił wyłącznie lokalny JAR i uruchomił API 8090. Flyway zastosował V8; log potwierdza schema v8 i Started SoberityBackendApplication. | Bez testów automatycznych, bez sprawdzenia UI i prywatnego API. Ręczny odbiór panelu przez właściciela; P1-I04 nadal IN_PROGRESS / NOT VERIFIED. Bez CHANGELOG — operacyjny restart lokalnej aplikacji. |

| 2026-11-03 | P1-I04 — bezpośrednia publikacja autora | Implementacja i lokalny startup, testy skipped | Na wyraźne polecenie właściciela dodano Publish/Send for review przy tworzeniu oraz AUTHOR_PUBLISH dla własnego IN_REVIEW. V9, publikacja AUTHOR/REVIEWED i audit, aktualizacja UI/i18n, raportu wymagań i dokumentacji. Maven BUILD SUCCESS z Tests are skipped; Flyway V9 i Started potwierdzone w logu. | Bez testów API/UI; P1-I04 nadal IN_PROGRESS/NOT VERIFIED. Nie opublikowano żadnego istniejącego quizu. CHANGELOG bez wpisu do ręcznego odbioru. |

| 2026-11-03 | P1-I04 — widoczność Opublikuj | Dodano bezpośrednią akcję na liście i uporządkowano Metro; NOT VERIFIED | QuizEditorialScreen: własny quiz IN_REVIEW ma Opublikuj bez otwierania szczegółów; formularz nadal ma Publish/Review. Ponownie znaleziono dwa serwery na 8082 (web localhost i Expo run:ios IPv6); zastąpiono je jednym wspólnym Metro z --clear, bez --localhost. | Bez testów/buildów. Ręczny odbiór po odświeżeniu; bez wpisu CHANGELOG do potwierdzenia. |

| 2026-11-03 | P1-I04 — źródła w wyjaśnieniu | Implementacja i lokalny startup; bez testów | Na polecenie właściciela zastąpiono wybór EvidenceClaim polami źródeł (tytuł/HTTPS URL) przy wyjaśnieniu. Backend waliduje i zwraca źródła po odpowiedzi/wznowieniu; UI pokazuje je pod wyjaśnieniem. Legacy przypięcia i fiszki zachowane; brak nowej migracji. Formularz pokazuje powód niekompletności. ADR-007, raport, branding i README/API zaktualizowane. Maven BUILD SUCCESS, Tests are skipped, Started backend. | Bez testów API/UI/native. P1-I04 nadal IN_PROGRESS/NOT VERIFIED; brak wpisu CHANGELOG do odbioru. Nie opublikowano żadnych quizów. |

| 2026-11-03 | P1-I03/P1-I04 — uproszczenie Science i menu | Implementacja na polecenie właściciela; NOT VERIFIED | Wspólny paginowany feed POST/ARTICLE/CLAIM z publicznymi projekcjami; brak filtrów i banera języka, nagłówek Artykuły. Menu zalogowanych we wszystkich trasach Science, podsekcje Artykuły/Quizy/Fiszki, osobny katalog quizów i powrót do niego. Home zachowuje najnowsze blogi. EN/PL, branding i README zaktualizowane. | Bez testów i buildów klienta. P1-I03/P1-I04 nadal NOT VERIFIED; CHANGELOG bez wpisu do ręcznego odbioru. |

| 2026-11-03 | P1-I03 — wspólny feed runtime | Lokalny backend zaktualizowany; testy skipped | Kompilacja i pakowanie BUILD SUCCESS z Tests are skipped; uruchomiono backend z nowym DiscoverReader/DiscoverController na 8090. Bez nowej migracji. | Nie uruchomiono testów API/UI/native ani buildów klienta; ręczny odbiór feedu i menu pozostaje otwarty. |

| 2026-11-03 | P1-I03/Home — klikalne karty i nagłówki | Implementacja na polecenie właściciela; NOT VERIFIED | PublicationCard: Expo Link asChild i Pressable z href, semantyką linku, hover/focus; cała karta Home/Discover otwiera czytnik, bez Czytaj publikację. Usunięto mission headline/subtitle Home, wszystkie trzy nagłówki korzystają z ReadingText heading i wspólnych odstępów. Branding uzupełniony. | Bez testów/buildów. Drobna korekta UI; CHANGELOG bez wpisu do ręcznego odbioru. |

| 2026-11-03 | Home — mock Sober rave Vienna | Dodano na wyraźne polecenie właściciela; NOT VERIFIED | Karta Schönbrunn w sekcji Wydarzenia w pobliżu, oryginalne załączone zdjęcie w assets i responsywny kadr eksponujący pałac. Styl jak karta mapy, EN/PL, etykieta Podgląd/Preview. Bez fikcyjnej daty/ceny i bez zapisu wydarzenia w API. Branding dokumentuje wyjątek właściciela. | Bez testów/buildów. Drobna zmiana UI; CHANGELOG bez wpisu do ręcznego odbioru. Nie rozpoczęto nowej iteracji/fazy Events. |

| 2026-11-03 | Nawigacja — menu i profil na każdym poziomie | Implementacja na polecenie właściciela; NOT VERIFIED | Wspólny useAppHeaderOptions dla root/public/authenticated/Science; menu i profil na wszystkich ekranach członka, kontekstowy powrót i brak duplikowania konta. Events przeniesione do wspólnej trasy root z zachowaniem placeholdera. EN/PL, README i branding uzupełnione. | Bez testów/buildów. Ręczny odbiór web/iOS/Android nadal otwarty; CHANGELOG bez wpisu do potwierdzenia. Bez rozpoczęcia nowej iteracji/fazy. |

| 2026-11-03 | Menu — ikony podsekcji Science | Podłączono wygenerowane assety; NOT VERIFIED | navigation.ts i SideMenu: articles-icon.png, quizzes-icon.png, flashcards-icon.png przy Artykuły/Quizy/Fiszki. Rozmiar i sposób wyświetlania jak pozostałe ikony menu, obrazy dekoracyjne dla czytnika ekranu. | Bez testów/buildów na polecenie właściciela. Drobna korekta UI; bez wpisu CHANGELOG. |

| 2026-11-04 | P0-I03A — motyw Ocean | Paleta wdrożona na polecenie właściciela; iteracja nadal IN_PROGRESS | `packages/design-tokens/src/index.ts`, lokalny `docs/BRANDING.md`, AGENTS, PHASES, CHANGELOG. Kontrast obu motywów Jest 2/2 PASS, typecheck i lint tokenów PASS. Playwright klawiatura desktop/mobile 2/2 PASS; smoke EN/PL 390/1440 px: kolory, brak overflow, reload i zapisany light PASS; zrzuty `/private/tmp/soberity-ocean-{en,pl}-{390,1440}.png`. | Pełny lint: dwa istniejące błędy require w metro.config.cjs. iOS/Android runtime, VoiceOver/TalkBack NOT VERIFIED; brak dostępu CoreSimulator/ADB w sandboxie. Ręcznie otworzyć aplikację na iOS/Android i sprawdzić paletę, stany, duży font i czytniki. V02/V03 bez nowych zaliczeń. |

| 2026-11-04 | P0-I03A — jasny Ocean | Paleta wdrożona; IN_PROGRESS | Wspólne tokeny light, AGENTS i lokalny BRANDING: białe tło i oceaniczny niebieski zamiast fioletu. Kontrast obu motywów Jest 2/2 PASS; typecheck klienta/tokenów i lint tokenów PASS. CHANGELOG uzupełniony. | Render web/iOS/Android, VoiceOver/TalkBack i duży font NOT VERIFIED. Następny krok P0-I03A-V02/V03: przełączyć na Jasny w Profilu i sprawdzić ekrany, stany oraz ponowne uruchomienie. |

| 2026-11-04 | P0-I03A — ikona Artykuły light/dark | Podłączono assety właściciela; NOT VERIFIED | `navigation.ts`, `SideMenu.tsx` i nowe `articles-icon-light.png` / `articles-icon-dark.png`: ikona Artykuły wybierana zgodnie z aktywnym motywem. Bez zmiany statusów i checkboxów iteracji. | Na polecenie właściciela nie uruchamiano testów, buildów ani aplikacji. CHANGELOG bez wpisu: drobna podmiana assetów bez odbioru runtime. Następny krok: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ikona Brain Lab light/dark | Podłączono assety właściciela; NOT VERIFIED | `navigation.ts`, `SideMenu.tsx`, `brain-icon-light.png` i `brain-icon-dark.png`: wybór grafiki Brain Lab według aktywnego motywu. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Bez zmiany checkboxów/statusów i bez wpisu CHANGELOG dla drobnej podmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — logo Soberity light/dark | Podmieniono assety właściciela; NOT VERIFIED | `AppLogo.tsx`, `soberity-logo-light.png`, `soberity-logo-dark.png`: nowe warianty logo wybierane zgodnie z aktywnym motywem, dotychczasowy rozmiar i contain zachowane. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla drobnej podmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ikona menu light/dark | Podłączono assety właściciela; NOT VERIFIED | `SideMenu.tsx`, `menu-icon-light.png`, `menu-icon-dark.png`: przycisk otwierania menu wybiera grafikę według aktywnego motywu. Dotychczasowy rozmiar i contain zachowane. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla drobnej podmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — jasny motyw domyślny | Zmiana na polecenie właściciela; NOT VERIFIED | ThemePreferencesContext: początkowy light przy braku zapisanej preferencji; istniejący wybór nadal odczytywany. AGENTS i BRANDING zaktualizowane zgodnie z decyzją. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian. CHANGELOG bez wpisu dla drobnej, nieodebranej w runtime zmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ikona profilu light/dark | Podłączono assety właściciela; NOT VERIFIED | `useAppHeaderOptions.tsx`, `profile-icon-light.png`, `profile-icon-dark.png`: ikona profilu w nagłówku wybierana według aktywnego motywu. Zachowano rozmiar i contain. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla drobnej podmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — Home Science CTA | Styl zmieniony na polecenie właściciela; NOT VERIFIED | `DiscoverScreen.tsx`: Explore Science & Discover jako zaokrąglona akcja z tłem surfaceAlt, obramowaniem primary i chevronem; stany hover/pressed/focus, oba motywy i istniejące EN/PL. | Bez testów, buildów i uruchamiania aplikacji zgodnie z poleceniem właściciela. Bez zmiany checkboxów/statusów; CHANGELOG bez wpisu dla drobnej korekty UI bez odbioru runtime. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ikona Events light/dark | Podłączono assety właściciela; NOT VERIFIED | `navigation.ts`, `events-icon-light.png`, `events-icon-dark.png`: ikona Events korzysta z istniejącego wyboru grafiki według aktywnego motywu w SideMenu. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla drobnej podmiany. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — codzienny spotlight Home | Implementacja na polecenie właściciela; NOT VERIFIED | Nowy DailySpotlight, WelcomeScreen, EN/PL i BRANDING: pozioma karta z grafiką 25%, tytułem primary i opisem; cykl Brain Lab → Myth Buster → World Map → Soberity od lokalnej daty 2026-11-04. Aktualizacja o północy, po powrocie na Home i wznowieniu aplikacji. Brak tras modułów: kliknięcie otwiera jawny podgląd Wkrótce. | Testów, buildów i aplikacji nie uruchamiano zgodnie z wcześniejszym poleceniem. Checkboxy i status iteracji bez zmian; CHANGELOG bez wpisu do odbioru runtime. Następny krok P0-I03A-V02/V03; docelowe przejścia wymagają wdrożenia modułów. |

| 2026-11-04 | P0-I03A — batch ikon menu light/dark | Podłączono assety właściciela; NOT VERIFIED | Dziesięć PNG dla Fiszek, Home, World Map, Myth Buster i Community; navigation.ts wybiera warianty przez istniejący mechanizm SideMenu. DailySpotlight korzysta również z nowych par map/myths/community. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla podmiany assetów bez odbioru runtime. Odbiór: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — jaśniejsze Events i Brain Lab w light mode | Korekta na polecenie właściciela; NOT VERIFIED | navigation.ts i DailySpotlight.tsx: jasny motyw używa jaśniejszych dostarczonych grafik events-icon-dark.png i brain-icon-dark.png zamiast ciemniejszych plików light. | Bez testów/buildów i uruchamiania aplikacji zgodnie z poleceniem. CHANGELOG bez wpisu dla drobnej korekty; statusy/checkboxy bez zmian. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ujednolicenie palety ikon | Wdrożono zaakceptowany wzorzec Home / Community; runtime NOT VERIFIED | Wbudowane image_gen: pięć edytowanych PNG `*-icon-ocean.png` dla science/quizzes/articles/events/brain, wizualnie obejrzanych jako pliki. navigation.ts i DailySpotlight.tsx korzystają z dopasowanej palety w obu motywach. Oryginały zachowane; prompt w design/assets/menu-ocean/README.md; BRANDING uzupełniony. | Na polecenie właściciela bez testów, buildów i uruchamiania aplikacji. Brak odbioru renderu web/iOS/Android; bez zmiany checkboxów/statusów i bez nowego wpisu CHANGELOG do odbioru. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — dopasowanie menu/profilu do logo | Podłączono cztery edytowane grafiki; runtime NOT VERIFIED | Wbudowane image_gen: menu/profile × light/dark, referencja kolorów z odpowiedniego logo. PNG obejrzane jako pliki, zapisane w assets/images z sufiksem ocean-light/ocean-dark; SideMenu.tsx i useAppHeaderOptions.tsx podłączone. Oryginały zachowane; BRANDING i opis promptów uzupełnione. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu do odbioru runtime. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — Read more articles | Zmieniono CTA na polecenie właściciela; NOT VERIFIED | DiscoverScreen.tsx i EN/PL: Read more articles / Czytaj więcej artykułów; wyśrodkowany kompaktowy pill, surfaceAlt, bez stałej ramki, spokojne hover/pressed i solidny focus bez zmiany geometrii. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla drobnej korekty UI bez odbioru runtime. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — Science jako nagłówek menu | Zmieniono na polecenie właściciela; NOT VERIFIED | SideMenu.tsx: Science & Discover renderowane jako View/Text header zamiast linku, bez obsługi kliknięcia/fokusu/selected. navigation.ts: usunięto href rodzica; podlinki bez zmian. BRANDING uzupełniony. | Bez testów, buildów i uruchamiania aplikacji zgodnie z poleceniem właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla drobnej zmiany nawigacji bez odbioru runtime. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — kompaktowa paginacja Articles | Implementacja na polecenie właściciela; NOT VERIFIED | DiscoverScreen.tsx i EN/PL: pojedynczy zaokrąglony pasek „‹ Page 1 of 1 · X publications ›”; liczba stron z total/size, strzałki z etykietami dostępności, disabled na granicach, focus/hover/pressed. Minimum dotyku 48 px; tekst może zawijać się przy dużym foncie. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla drobnej korekty UI bez odbioru runtime. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — trzy publikacje i paginacja na dole | Implementacja na polecenie właściciela; NOT VERIFIED | DiscoverScreen żąda size=3; DiscoverController/Reader obsługują walidowany size 1–100 z dotychczasowym default 20 i parametryzowanymi LIMIT/OFFSET. Screen otrzymał opcjonalny contentStyle; lista rośnie do wysokości strony, paginacja na końcu po treści, na dole przy krótkiej liście. | Bez testów, buildów i uruchamiania aplikacji zgodnie z poleceniem właściciela. Backend wymaga ponownego uruchomienia, aby obsłużyć size=3. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu do odbioru. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — kompaktowe karty publikacji Home/Articles | Implementacja na polecenie właściciela; NOT VERIFIED | readingUi.tsx i DiscoverScreen.tsx: poziome karty, miniatura 26% max 144 px, radius xl, mniejsze odstępy i typografia; opis 2/3 linie, status recenzji i pełny tytuł zachowane. Osobny wariant thumbnail w ReadingImage; obrazy w czytniku bez zmiany proporcji. BRANDING uzupełniony. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Brak odbioru web/iOS/Android; statusy/checkboxy bez zmian. CHANGELOG bez wpisu do odbioru runtime. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — obraz na pełną wysokość karty | Korekta na polecenie właściciela; NOT VERIFIED | readingUi.tsx i DiscoverScreen.tsx: obraz cover w lewej kolumnie 30%, rozciągniętej do wysokości karty, bez paddingu; minimum 144 px, tekst z osobnym paddingiem. BRANDING uzupełniony. | Bez testów, buildów i uruchamiania aplikacji. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu do odbioru runtime. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — pełna szerokość obrazu zamiast wysokości | Korekta interpretacji polecenia; NOT VERIFIED | readingUi.tsx i DiscoverScreen.tsx: pionowa karta, obraz 100% szerokości i 144 px wysokości, tekst poniżej. BRANDING zaktualizowany. | Bez testów, buildów i uruchamiania aplikacji zgodnie z poleceniem. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu do odbioru. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — obramowanie kart publikacji | Korekta na polecenie właściciela; NOT VERIFIED | readingUi.tsx: ramka PublicationCard zwiększona do 2 px, z tokenami border/primary/focusRing w obu motywach; Home i Articles korzystają ze wspólnego komponentu. BRANDING uzupełniony. | Bez testów, buildów i uruchamiania aplikacji. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla drobnej korekty. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — wyraźna oceaniczna ramka publikacji | Korekta po uwadze właściciela; NOT VERIFIED | readingUi.tsx: ramka PublicationCard 2 px solid primary zamiast border; hover/pressed surfaceAlt, focus focusRing. BRANDING uzupełniony. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla drobnej korekty. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — ramka karty poza Link asChild | Poprawka po zrzucie właściciela; NOT VERIFIED w runtime | readingUi.tsx: ramka 2 px primary, radius xl i clipping przeniesione na niezależny View, poza Link/Pressable. Statyczny styl linku zamiast funkcji style; pressed/hover/focus kontrolują wrapper. Zrzut właściciela potwierdził brak ramki i narożników we wcześniejszej wersji. | Bez testów, buildów i uruchamiania aplikacji na polecenie właściciela. Poprawka wymaga ponownego odbioru wizualnego; statusy/checkboxy bez zmian. CHANGELOG bez wpisu do potwierdzenia; P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — proste narożniki kart publikacji | Korekta na polecenie właściciela; NOT VERIFIED | readingUi.tsx: radius wrappera PublicationCard ustawiony na 0; oceaniczna ramka zachowana. BRANDING uzupełniony. | Właściciel potwierdził widoczność ramki poprzedniej wersji; nowe narożniki bez testów, buildów i uruchamiania aplikacji. Statusy/checkboxy bez zmian; CHANGELOG bez wpisu dla drobnej korekty. Odbiór P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — nagłówki chapter | Implementacja; runtime NOT VERIFIED | Nowy ChapterHeading; WelcomeScreen i DiscoverScreen: pełna szerokość, delikatnie szare tło light / oceaniczne dark, cienka dekoracyjna ramka, radius sm i mocniejszy tytuł. Semantyczne tokeny chapterSurface/chapterBorder oraz BRANDING zaktualizowane. Typecheck klienta, ESLint trzech zmienionych komponentów i git diff --check PASS. | Render web/iOS/Android, EN/PL na wąskim ekranie, duży font i czytniki NOT VERIFIED. Ręcznie sprawdzić Home i Articles w obu motywach oraz EN/PL, zawijanie przy dużym foncie i odczyt nagłówków. Bez zmiany checkboxów/statusu iteracji; CHANGELOG bez wpisu do odbioru wizualnego drobnej zmiany UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — korekta chapter | Implementacja; runtime NOT VERIFIED | ChapterHeading: oceaniczny primary, body 16/24 i waga 400, padding pionowy 8 px; bez ramki, radius i dodatkowego wcięcia tekstu. Nieinteraktywne tło szerokości okna wyśrodkowane za nagłówkiem, poza granicami kolumny. Usunięto nieużywany chapterBorder, BRANDING zaktualizowany. Typecheck klienta, ESLint ChapterHeading i git diff --check PASS. | Odbiór wizualny web/iOS/Android, krawędzie tła, brak poziomego przewijania, EN/PL i duży font NOT VERIFIED. Sprawdzić Home/Articles na telefonie i desktopie w obu motywach. Bez nowych checkboxów; CHANGELOG bez wpisu dla drobnej korekty przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — rozmiar i poziome ramki chapter | Implementacja; runtime NOT VERIFIED | ChapterHeading: tytuł h3 20/28, nadal waga 400 i oceaniczny primary; linie 1 px border na górze i dole tła pełnej szerokości. BRANDING zaktualizowany. Typecheck klienta, ESLint komponentu i git diff --check PASS. | Odbiór wizualny web/iOS/Android nadal NOT VERIFIED: sprawdzić Home/Articles, oba motywy i EN/PL. Bez zmiany checkboxów; CHANGELOG bez wpisu dla drobnej korekty przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — chapter bez borderów | Korekta na polecenie właściciela; runtime NOT VERIFIED | ChapterHeading: usunięto górną/dolną linię i borderColor; rozmiar tekstu i tło bez zmian. BRANDING zaktualizowany. | Bez testów runtime dla drobnej zmiany stylu; bez zmiany checkboxów i wpisu CHANGELOG. Odbiór wizualny: P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — próbne jasnoniebieskie tło | Wariant do oceny właściciela; runtime NOT VERIFIED | Wspólny light background zmieniono z bieli na subtelny #F5FAFD; surface pozostaje biały. BRANDING oznacza tło jako próbne. Typecheck i lint design-tokens oraz git diff --check PASS. | Bez odbioru renderu web/iOS/Android i ponownej weryfikacji kontrastu; sprawdzić wygląd ekranów w jasnym motywie. Bez zmiany checkboxów/statusu; CHANGELOG bez wpisu dla wariantu próbnego. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — białe tło i typografia chapter | Implementacja; runtime NOT VERIFIED | Przywrócono light background #FFFFFF. ChapterHeading: h3 20/28, waga 600, spacing -0.4, platformowy krój inspirowany geometrycznym napisem oryginalnego logo (Avenir Next / Century Gothic / sans-serif, Android sans-serif-medium). Źródłowy font logo nieobecny: przybliżenie, bez deklaracji identyczności. BRANDING zaktualizowany. Typecheck klienta, ESLint komponentu i git diff --check PASS. | Web/iOS/Android i EN/PL runtime NOT VERIFIED; ocenić nagłówki Home/Articles i dostępność kroju na urządzeniach. Bez zmiany checkboxów; CHANGELOG bez wpisu dla drobnej korekty przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — karta Events near you | Implementacja; runtime NOT VERIFIED | WelcomeScreen: wygląd zgodny z aktualnym PublicationCard: primary border 2 px, radius xl, obraz 144 px, padding 16 / gap 8, tytuł bodyStrong/primary, etykieta caption/textSecondary. Zachowano zdjęcie i kadrowanie pałacu oraz oznaczenie Preview; skorygowano fallback szerokości dla ramki 2 px. BRANDING odnotowuje dopasowanie do aktualnego kodu (historyczny wpis radius 0 różni się od PublicationCard). Typecheck klienta, ESLint WelcomeScreen i git diff --check PASS. | Runtime web/iOS/Android NOT VERIFIED; ocenić Home EN/PL w obu motywach i kadr na telefonie/desktopie. Bez zmiany checkboxów/statusów; CHANGELOG bez wpisu dla drobnego stylowania przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — Events jako bilet | Implementacja wybranego wariantu 2; runtime NOT VERIFIED | WelcomeScreen: cienka ramka border 1 px, radius lg, zdjęcie 144 px, perforowany separator i boczne wycięcia, dolny panel z odcinkiem Preview/Podgląd po lewej oraz kategorią/tytułem/lokalizacją po prawej. EN/PL uzupełnione, BRANDING zaktualizowany. Bez fikcyjnej daty i pozornej nawigacji dla podglądu. Typecheck klienta, ESLint WelcomeScreen i git diff --check PASS. | Render web/iOS/Android, EN/PL, duży font i czytniki NOT VERIFIED; sprawdzić Home w obu motywach na telefonie/desktopie, wycięcia i zawijanie tekstu. Bez zmiany statusów/checkboxów; CHANGELOG bez wpisu dla nieodebranej wizualnie korekty UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — uproszczenie biletu | Implementacja; runtime NOT VERIFIED | WelcomeScreen: usunięto boczne wycięcia/kółka i martwe style; separatory solid zamiast dashed, pozioma linia pełnej szerokości. Zachowano układ odcinka biletu i panel wydarzenia. BRANDING zaktualizowany. Typecheck klienta, ESLint WelcomeScreen i git diff --check PASS. | Odbiór wizualny Home EN/PL w obu motywach na web/iOS/Android NOT VERIFIED. Checkboxy/status bez zmian, CHANGELOG bez wpisu dla drobnej korekty. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — zdjęcie jako tło biletu | Implementacja; runtime NOT VERIFIED | WelcomeScreen: ImageBackground cover całego biletu, minHeight 200 rosnące z treścią, białe teksty na semantycznej nakładce eventImageScrim, odcinek Preview po prawej z pionową linią solid, bez kropek/wycięć. Tokeny i BRANDING zaktualizowane. Typecheck klienta, ESLint WelcomeScreen, git diff --check PASS. | Zewnętrzna referencja niedostępna (web open błąd, curl DNS); wdrożono opis właściciela. Runtime web/iOS/Android, EN/PL, duży font i odczyt czytnikiem NOT VERIFIED; sprawdzić Home w obu motywach, kadr zdjęcia, kontrast i zawijanie. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla nieodebranej korekty UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — dopracowanie biletu z referencji | Implementacja; runtime NOT VERIFIED | WelcomeScreen: bardziej podłużna forma minHeight 180/radius sm, kategoria u góry i tytuł/lokalizacja u dołu, padding 16. Odcinek 24% max 144 z mocniejszym przyciemnieniem i etykietą uppercase między cienkimi liniami. Wykorzystano załączoną referencję jako inspirację bez kopiowania cen/dat/kodu kreskowego; bez kropek/wycięć. BRANDING zaktualizowany. Typecheck klienta, ESLint WelcomeScreen i git diff --check PASS. | Runtime web/iOS/Android oraz EN/PL przy dużym foncie NOT VERIFIED; sprawdzić proporcje, kadr i zawijanie na Home w obu motywach. Bez zmiany checkboxów/statusu; CHANGELOG bez wpisu dla korekty przed odbiorem wizualnym. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — pill kategorii wydarzenia | Implementacja; runtime NOT VERIFIED | WelcomeScreen: Sober rave jako nieinteraktywny pill primary/onPrimary, radius pill, padding 4/12, caption 600; zawijanie i aktywne tokeny obu motywów. BRANDING zaktualizowany. Typecheck klienta, ESLint WelcomeScreen i git diff --check PASS. | Odbiór wizualny web/iOS/Android, EN/PL i duży font NOT VERIFIED; sprawdzić kartę Home w obu motywach. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla drobnej korekty UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — subtelniejszy pill kategorii | Implementacja; runtime NOT VERIFIED | WelcomeScreen: padding 2/8 zamiast 4/12, caption 400 zamiast 600 i spacing 0.2 zamiast 0.5; kolor i czytelny rozmiar tekstu zachowane. BRANDING zaktualizowany. ESLint komponentu i git diff --check PASS. | Runtime web/iOS/Android NOT VERIFIED; odbiór wizualny Home w obu motywach. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla drobnej korekty. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — lista Science Articles | Implementacja; runtime NOT VERIFIED | DiscoverScreen i readingUi: PublicationCard z wariantem list tylko dla pełnego Articles. Miniatura po lewej max 96 px / 24%, tekst po prawej, fragment do 3 linii, dolny separator zamiast obwiedni. Zachowano pełne tytuły, recenzję/pewność, daty, trasy, Link/Pressable i paginację. Brak obrazu nie dodaje placeholdera. Home nadal wariant card. BRANDING zaktualizowany. Typecheck klienta, ESLint obu modułów i git diff --check PASS. | Runtime web/iOS/Android NOT VERIFIED: sprawdzić Articles i niezmieniony Home, EN/PL, oba motywy, fokus/linki, długie tytuły i duży font. Bez zmiany checkboxów/statusu; CHANGELOG bez wpisu do odbioru wizualnego korekty UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — niższa lista Articles | Implementacja; runtime NOT VERIFIED | DiscoverScreen/readingUi: lista bez opisu, miniatura max 80 px, padding pionowy 12, gap treści 4 i border 1 px góra/dół. Zachowano tytuł, kategorię, status recenzji/pewności, datę i linki. Lista postów używa created_at; starsze typy bez tego pola published_at. Home bez zmian. BRANDING zaktualizowany. Typecheck klienta, ESLint obu modułów i git diff --check PASS. | Web/iOS/Android runtime NOT VERIFIED: sprawdzić Articles/Home EN/PL, oba motywy i duży font. Bez nowych checkboxów/statusu DONE; CHANGELOG bez wpisu dla drobnej korekty przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — pełna ramka listy Articles | Implementacja; runtime NOT VERIFIED | readingUi: wariant list ma borderWidth 1 ze wszystkich stron zamiast tylko góra/dół. Home bez zmian. BRANDING zaktualizowany. | Bez testów runtime dla drobnej korekty stylu; checkboxy/status bez zmian, CHANGELOG bez wpisu. Odbiór wizualny P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — odstęp miniatury od ramki | Poprawka; runtime NOT VERIFIED | readingUi: padding listy 12 ze wszystkich stron zamiast tylko pionowo; DiscoverScreen: flexShrink 0 miniatury. Home bez zmian. BRANDING uzupełniony. Typecheck klienta, ESLint obu modułów i git diff --check PASS. | Render web/iOS/Android NOT VERIFIED; sprawdzić położenie miniatury i ramkę Articles na wąskim ekranie, oba motywy i duży font. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla drobnej poprawki przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — radius i interakcje listy Articles | Implementacja; runtime NOT VERIFIED | readingUi: radius md (12) wariantu list; hover/pressed zachowują podświetlenie surfaceAlt i dodatkowo zmieniają ramkę na primary. Focus focusRing, Home bez zmian. BRANDING zaktualizowany. Typecheck klienta, ESLint modułu i git diff --check PASS. | Runtime web/iOS/Android NOT VERIFIED; sprawdzić hover, naciskanie, fokus klawiaturą oraz narożniki Articles w obu motywach. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla drobnej korekty przed odbiorem. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — błękitne wiersze i kategoria pill | Implementacja; runtime NOT VERIFIED | DiscoverScreen/readingUi i tokeny: listSurface light #F5FAFD / dark #081F3B, mocniejszy hover/pressed surfaceAlt, kategoria jako mały pill primary/onPrimary, data textMuted obok, metadane flexWrap. Home i tło strony bez zmian. BRANDING zaktualizowany. Typecheck klienta, ESLint obu modułów, lint tokenów, diff --check PASS. Obliczenie kontrastu tekstów na listSurface/surfaceAlt i pill: light min 5.27:1, dark min 6.90:1 PASS. | Web/iOS/Android runtime, EN/PL, duży font i interakcje wizualne NOT VERIFIED; sprawdzić listę Articles i Home w obu motywach. Checkboxy/status bez zmian; CHANGELOG bez wpisu do wizualnego odbioru korekty UI. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — data pod kategorią | Implementacja; runtime NOT VERIFIED | DiscoverScreen: listMeta w kolumnie, wyrównanie do lewej i gap 4; data pod kategorią. Home bez zmian. BRANDING zaktualizowany. | Bez testów runtime dla drobnej korekty układu; checkboxy/status bez zmian, CHANGELOG bez wpisu. Odbiór wizualny P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — jednakowa szerokość Articles | Implementacja; runtime NOT VERIFIED | readingUi: list width 800 / maxWidth 100% / minWidth 0 / alignSelf center; DiscoverScreen feed width 100% i minWidth 0. Treść nie ustala szerokości; na telefonie limit dostępnej kolumny. BRANDING zaktualizowany. Typecheck klienta, ESLint obu modułów i git diff --check PASS. | Runtime web/iOS/Android NOT VERIFIED; sprawdzić długie tytuły/kategorie, oba motywy i szerokości mobile/desktop. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla drobnej korekty. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P0-I03A — Home Latest publications jako lista | Wariant próbny; runtime NOT VERIFIED | DiscoverScreen: Home używa tego samego PublicationCard list co Articles, miniatury, tytułu i metadanych pill/data bez opisu. Usunięto nieużywane style pionowych kart w module. Feed Home, limit trzech i CTA bez zmian. BRANDING zaktualizowany jako wariant do oceny. Typecheck klienta, ESLint modułu i diff --check PASS. | Render web/iOS/Android i EN/PL NOT VERIFIED; ocenić Home w obu motywach i przy dużym foncie. Checkboxy/status bez zmian; CHANGELOG bez wpisu dla wariantu próbnego. Następny krok P0-I03A-V02/V03. |

| 2026-11-04 | P1-I03 — wyszukiwarka Articles | Rozszerzenie wdrożone i zweryfikowane częściowo; iteracja IN_PROGRESS | DiscoverScreen, select z istniejącego LanguageSelect, EN/PL, DiscoverController/Reader, testy BlogApiIT/SciencePublicApiIT i DiscoverScreen.test. q case-insensitive literalny fragment tytułu, kategoria, count/paginacja po filtrach, debounce/reset strony. Maven 13 unit + 23 IT PASS; Jest 3/3 PASS; typecheck i ESLint zmienionych modułów PASS; web light EN/PL 390/1440 px 4/4 PASS. Lokalny backend zrestartowany, odczyt API 200 PASS. BRANDING/API/README i CHANGELOG uzupełnione. | Ogólny test i18n: FAIL z powodu 10 wcześniejszych różnic kluczy (porównanie z HEAD potwierdzone), bez nowych różnic. Runtime iOS/Android oraz dark NOT VERIFIED: otworzyć Articles, wpisać frazę inną wielkością liter, wybrać kategorię, zmienić stronę i frazę, sprawdzić pusty wynik/fokus/duży font. Checkboxy/Finished bez zmiany; kolejny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — nagłówek Articles i rząd filtrów | Implementacja; native runtime NOT VERIFIED | Science index: własny nagłówek primary z articles-icon-ocean, bez chapter Articles w treści; Home chapter bez zmian. Filtry w jednym rzędzie 3:2, select fullWidth (web/native), debounce 500 ms. Jest filtrów 4/4, typecheck, ESLint i diff --check PASS; web EN/PL 390/1440 px 4/4 PASS: tytuł/kolor, jeden rząd, debounce, brak overflow. README/BRANDING/CHANGELOG zaktualizowane. | Pierwsza próba review testu przeglądarkowego przekroczyła deadline; dozwolone ponowienie zakończyło się zgodą i PASS. iOS/Android oraz dark runtime NOT VERIFIED; sprawdzić nagłówek i filtry na urządzeniach. Checkboxy/Finished/status bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — subtelniejszy pasek filtrów | Implementacja i web PASS; native NOT VERIFIED | DiscoverScreen oraz opcjonalny compact w TextField/LanguageSelect: pola web 40 px, tekst 14/20, etykiety 12/16 waga 400, gap 4 i radius sm. Native zachowuje min 48 px; pozostałe formularze bez zmian. Jeden rząd i debounce 500 ms zachowane. Typecheck, lint 4 modułów, diff --check PASS; Jest filtry 4/4 + TextField regresja 3/3 PASS. Playwright EN/PL 390/1440 px 4/4 PASS; zrzuty /tmp/soberity-articles-header-{en,pl}-{390,1440}.png. BRANDING i istniejący wpis CHANGELOG uzupełnione. | iOS/Android i dark runtime NOT VERIFIED: sprawdzić kompaktowy pasek, fokus i duży font na urządzeniach. Checkboxy/status iteracji bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — rozwijane menu kategorii bez modala | Implementacja, web PASS; native runtime NOT VERIFIED | Nowy CategorySelect web/native w DiscoverScreen zamiast LanguageSelect. Menu w układzie strony pod polem, scroll max 240, wybór zamyka listę; web listbox/combobox, klawiatura strzałki/Home/End, Enter/Space, Escape i outside/blur; native radio choices i Android Back. Test filtrów sprawdza brak dialogu i zamknięcie po wyborze. Typecheck i ESLint modułów PASS; Jest filtrów 4/4 PASS; Playwright EN/PL 390/1440 px 4/4 PASS: menu pod polem, brak modala, Escape/outside, wybór klawiaturą, filtrowanie, debounce i brak overflow. Log /tmp/soberity-category-dropdown-smoke.log. BRANDING/CHANGELOG zaktualizowane. | iOS/Android i dark runtime NOT VERIFIED: otworzyć Articles, rozwinąć kategorię, wybrać opcję, sprawdzić scroll i Back oraz duży font. Checkboxy/status bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — dropdown bez przesuwania kart | Poprawka, web PASS; native runtime NOT VERIFIED | CategorySelect web/native: menu absolutnie pod polem, warstwa ponad kartami; zIndex na pasku filtrów i polu kategorii. Zachowano wybór/klawiaturę/zamykanie i scroll. Typecheck, ESLint modułów i diff --check PASS; Jest 4/4 PASS; Playwright EN/PL 390/1440 px 4/4 PASS: identyczne położenie treści przed/po otwarciu, elementFromPoint potwierdza opcje nad treścią, klawiatura/wybór/debounce i brak overflow. Log /tmp/soberity-category-overlay-smoke.log. BRANDING/CHANGELOG zaktualizowane. | Runtime iOS/Android i dark NOT VERIFIED: sprawdzić otwarcie nad kartami, tap opcji, scroll listy kategorii i Android Back. Checkboxy/status bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — wskazówka przewijania kategorii | Implementacja i web PASS; native runtime NOT VERIFIED | CategorySelect web/native: oceaniczny tekst small, systemowy sans-serif na web, wybrana opcja 600/✓/surfaceAlt. Scroll viewport 200 px; stan przepełnienia z rzeczywistych pomiarów. Klikalny pasek More categories ↓ / Więcej kategorii ↓ zmienia się na Categories above ↑ / Kategorie wyżej ↑ na końcu i znika bez przepełnienia. EN/PL i dokumentacja/CHANGELOG uzupełnione. Typecheck, ESLint i diff --check PASS; Jest filtry 4/4 PASS; Playwright z 12 kategoriami EN/PL 390/1440 px 4/4 PASS: wskazówka, kliknięcie scrolla, stan na końcu, oceaniczny kolor, brak przesuwania treści, klawiatura i filtrowanie. Pierwszy smoke wykrył błędne zagnieżdżenie efektu pomiaru; poprawiono przed PASS. Log /tmp/soberity-category-scroll-smoke.log. | iOS/Android i dark runtime NOT VERIFIED; sprawdzić widoczność wskazówki, przewijanie dotykiem i tap paska oraz skalowanie fontu. Checkboxy/status iteracji bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I03 — scrollbar bez tekstowej wskazówki | Implementacja, web PASS; native runtime NOT VERIFIED | CategorySelect: usunięto przyciski More categories/Categories above i nieużywane klucze EN/PL. Web: stały scrollbar primary/surfaceAlt, przeciąganie i klawiatura (bez systemowego auto-hide); native: stały wizualny wskaźnik proporcjonalny do treści/viewportu/offsetu, bez przycisków i bez zasłaniania opcji. Oceaniczny tekst i wybrana opcja zachowane. BRANDING/CHANGELOG uzupełnione. Typecheck, ESLint i diff --check PASS; Jest 4/4 PASS; Playwright 12 kategorii EN/PL 390/1440 px 4/4 PASS: widoczność/kolor scrollbara, przeciąganie, brak przycisków, przewijanie kółkiem, brak przesuwania treści, klawiatura/wybór/debounce. Log /tmp/soberity-category-scrollbar-smoke.log; zrzuty /tmp/soberity-category-scrollbar-{en,pl}-{390,1440}.png. | Native runtime i dark NOT VERIFIED: sprawdzić widoczny wskaźnik i przewijanie dotykiem w Articles. Checkboxy/status bez zmian; następny krok P1-I03-V01/V02. |

| 2026-11-04 | P1-I04 — refaktor listy Quizzes | UI web zweryfikowane; iteracja IN_PROGRESS | Science layout, LearningScreen, nowy wspólny ui/Pagination i integracja DiscoverScreen, test LearningScreen, EN/PL. Ikona + oceaniczny nagłówek, bez powtórzenia tytułu/opisu/back button; stylowane No quizzes i brak paginacji przy empty. Pagination jak Articles, wspólny komponent, na dole strony. Typecheck/lint/diff --check PASS; Jest 6/6 PASS; Playwright syntetyczne API EN/PL × light/dark × 390/1440 px 8/8 PASS. BRANDING i CHANGELOG zaktualizowane. | Runtime iOS/Android i rzeczywisty przepływ quizu poza zakresem tej poprawki UI NOT VERIFIED. Otworzyć Quizzes na urządzeniach: empty/lista, paginacja, duży font i czytnik. Checkboxy/Finished bez zmian; następny krok P1-I04-V01/V02. |

| 2026-11-04 | P1-I04 — quiz jako wiersz Articles | Implementacja i web PASS; native NOT VERIFIED | Nowy QuizCard i integracja LearningScreen: listSurface, border 1 px, radius md, padding 12/gap 16; kwadrat Start Quiz 80 px w miejscu miniatury i tytuł/count po prawej. Primary/onPrimary, hover/pressed/focus; rozmiar kwadratu rośnie przy dużym fontScale. Nowy krótki label EN/PL, zachowana trasa start/resume. Typecheck/lint/diff --check PASS; Jest listy 2/2 PASS (empty/paging/start); Playwright EN/PL × light/dark × 390/1440 px 8/8 PASS: kwadrat, układ lewo/prawo, hover, empty/paging i brak overflow. Logi /tmp/soberity-quiz-card-{tests,smoke}.log, screenshoty /tmp/soberity-quiz-card-{en,pl}-{light,dark}-{390,1440}.png. BRANDING/CHANGELOG uzupełnione. | Runtime iOS/Android i duży font na urządzeniach NOT VERIFIED: sprawdzić kwadrat, długi tytuł, focus i otwieranie quizu. Checkboxy/Finished bez zmian; kolejny krok P1-I04-V01/V02. |

| 2026-11-04 | P1-I04 — wyniki quizów i restart backendu | Implementacja zweryfikowana częściowo; iteracja IN_PROGRESS | V10, LearningController/Service, QuizScreen/LearningScreen/QuizCard, EN/PL i tokeny. Wynik serwerowy i prywatny, idempotencja, ostatnia ukończona próba, zawsze dostępna powtórka, procent i kolory (<40 red, 40–79 orange, >=80 green; blue brak wyniku). Usunięcie learning/account czyści wyniki. Maven 13 unit + 27 IT PASS; Jest 12/12 PASS; web synthetic auth/API EN/PL light/dark mobile/desktop 8/8 PASS. Typecheck, lint i kontrast PASS. Na polecenie właściciela restart local API: V10 zastosowana, health 200/UP. BRANDING/API/README/CHANGELOG uzupełnione. | Native runtime i rzeczywisty Firebase + real API E2E NOT VERIFIED; sprawdzić ukończenie, ponowne otwarcie listy, wynik, retake i kasowanie danych na iOS/Android. Checkboxy/Finished bez zmian; następny krok P1-I04-V01/V02. |

| 2026-11-04 | P1-I04 — końcowa walidacja wyników | PASS; native nadal NOT VERIFIED | Dodatkowy QuizResultsApiIT 4/4 PASS: pełne payloady z błędnym pytaniem/opcją/duplikatami oraz idempotentny retry starej próby nie usuwa bieżącego progressu retake. Bez ponownego pakowania działającego backendu. Log /tmp/soberity-quiz-results-validation-tests.log. Poprzedni zestaw 13 unit + 27 IT, klient 12/12 i web 8/8 pozostają PASS. Zachowanie wszystkich istniejących kluczy tłumaczeń Articles potwierdzone. Dokumentacja ujednolicona. | Pierwsza próba dodatkowych testów miała timeout automatycznego review; ponowienie dozwolone i zakończone PASS. Brak blokera implementacji. Native/pełne P1-I04-V01/V02 nadal otwarte; bez zmiany Finished/DONE. |

| 2026-11-04 | P1-I04 — menu i kategorie quizów | IN_PROGRESS / NOT VERIFIED | SideMenu, navigation, useAppHeaderOptions, LearningScreen, QuizCategoryGrid, SettingsIcon, FlashcardsScreen: rozwijana sekcja Science, wyśrodkowane oceaniczne etykiety i dekoracyjne ikony, powrót z kategorii strzałką nagłówka, usunięcie Wróć do nauki. | Testy i dodatkowa weryfikacja pominięte na polecenie właściciela; web/iOS/Android NOT VERIFIED. Bez zaliczenia checkboxów i wpisu CHANGELOG; kolejny krok: ręczny odbiór P1-I04 przez właściciela. |

| 2026-11-04 | P1-I04 — dopracowanie kart kategorii | IN_PROGRESS / NOT VERIFIED | QuizCategoryGrid: cieńsza ramka, radius xl, delikatny okrąg w narożniku, hover i pressed; mniejsze ikony przesunięte bliżej prawego dolnego rogu w osobnym obszarze pod tekstem, rezerwując odstęp również przy zawijaniu etykiet. | Bez testów i dodatkowej weryfikacji na polecenie właściciela. Web/iOS/Android NOT VERIFIED; CHANGELOG bez wpisu do ręcznego odbioru. Kolejny krok: odbiór P1-I04. |

| 2026-11-04 | P1-I04 — nakładanie kart kategorii | IN_PROGRESS / NOT VERIFIED | QuizCategoryGrid: usunięto aspectRatio kolidujące z minHeight na wąskich kolumnach; szerokość pozostaje ograniczona do komórki, minWidth 0 i flex 1 zachowują wyrównanie kart w rzędzie. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; web/iOS/Android NOT VERIFIED. CHANGELOG odroczony do odbioru; kolejny krok: ręczna weryfikacja P1-I04. |

| 2026-11-04 | P1-I04 — bardziej kompaktowe karty kategorii | IN_PROGRESS / NOT VERIFIED | QuizCategoryGrid: minimalna wysokość 160 zamiast 208, mniejsze odstępy, obszar dekoracji 48 i ikony 48; zachowana przestrzeń między tekstem a ikonami oraz możliwość wzrostu z treścią. | Testy i dodatkowa weryfikacja pominięte na polecenie właściciela. CHANGELOG odroczony do odbioru; kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — uproszczony quiz i automatyczny zapis | IN_PROGRESS / NOT VERIFIED | QuizScreen: bez przycisku powrotu i opisów pod tytułem, bez ProgressControl; automatyczne przywracanie i saveProgress:true dla zalogowanych, goście bez zapisu, zachowane błędy i ukończenie. README i LEARNING_API uaktualnione. | Bez testów/buildów/typecheck/lint i dodatkowej weryfikacji na polecenie właściciela. Web/iOS/Android NOT VERIFIED; checkboxy/Finished bez zmian, CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — rozdzielenie błędu quizu i postępu | IN_PROGRESS / NOT VERIFIED | QuizScreen: błąd prywatnego odczytu postępu nie ukrywa dostępnego quizu; osobny komunikat EN/PL i ponowienie. Odpowiedzi zablokowane do przywrócenia postępu, bez cichego wyłączenia automatycznego zapisu i nadpisywania danych. | Przyczyna błędu prywatnego API niepotwierdzona bez logów runtime. Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I04, przy utrzymującym się błędzie diagnostyka odpowiedzi API postępu. |

| 2026-11-04 | P1-I04 — ciche pominięcie błędu przywracania | IN_PROGRESS / NOT VERIFIED | Na polecenie właściciela usunięto komunikat błędu przywracania i blokadę odpowiedzi z QuizScreen oraz nieużywany klucz EN/PL. Gdy odczyt wcześniejszego postępu zawiedzie, quiz zaczyna się normalnie; automatyczny zapis zatwierdzonych odpowiedzi nadal aktywny, błędy zapisu nadal widoczne. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem. CHANGELOG odroczony do odbioru; kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — nowy interaktywny widok quizu | IN_PROGRESS / NOT VERIFIED | QuizScreen: panel pytania Ocean, pasek rzeczywistego postępu, typ pytania i licznik EN/PL, kafelki odpowiedzi z literami/check i hover/pressed/focus, jawne poprawne odpowiedzi, wydzielone wyjaśnienia i źródła, jeden kontekstowy przycisk sprawdź/dalej/zakończ oraz wynik w pierścieniu i powtórka. Zachowano automatyczny zapis, brak komunikatu błędu przywracania i brak zbędnego opisu/powrotu. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; web/iOS/Android NOT VERIFIED. Checkboxy i Finished bez zmian; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — naprawa payloadu Finish | IN_PROGRESS / NOT VERIFIED | Istniejący log backendu potwierdza HTTP 400 przy complete: Cannot map null into type boolean. Completion współdzieli Answer DTO wymagające saveProgress, którego brakowało w kliencie. QuizScreen przekazuje jawne saveProgress:false dla każdego elementu completion; endpoint nadal zapisuje wynik i czyści postęp. LEARNING_API uzupełnione; bez zmiany backendu i restartu. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; naprawa runtime NOT VERIFIED, CHANGELOG odroczony. Kolejny krok: ponowienie Finish w P1-I04. |

| 2026-11-04 | P1-I04 — Odkryj quizy po ukończeniu | IN_PROGRESS / NOT VERIFIED | QuizScreen: pod Powtórz quiz dodano drugorzędny przycisk Odkryj quizy / Discover quizzes prowadzący do /science/quizzes; tłumaczenia EN/PL. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — nawigacja przed wyjaśnieniem | IN_PROGRESS / NOT VERIFIED | QuizScreen: blok Sprawdź/Dalej/Zakończ i poprzednie pytanie przeniesiony bezpośrednio pod odpowiedzi, przed wyjaśnienie i źródła; rozwinięcie informacji zwrotnej nie odsuwa przycisku na dół. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — oceaniczny tytuł i pill kategorii | IN_PROGRESS / NOT VERIFIED | QuizCard: tytuł primary niezależnie od wyniku, również przy 100%; kategoria jako pill primary/onPrimary w stylu Events, przy cover tytuł z podkładem surface. Status ramki/tła/wyniku zachowany; BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — wynik w prawym dolnym rogu karty | IN_PROGRESS / NOT VERIFIED | QuizCard: usunięto pill wyniku; kompaktowy tekst Wynik: X% (caption/600), wyrównany do prawej na dole treści, z zachowaniem koloru statusu. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — usunięcie kategorii z kart quizów | IN_PROGRESS / NOT VERIFIED | QuizCard: usunięto pill kategorii i nieużywane style; kategorie pozostają na dedykowanych ekranach. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — bogatszy układ karty quizu | IN_PROGRESS / NOT VERIFIED | QuizCard: ikona pytajnika w oceanicznym kafelku, tytuł i liczba pytań obok; separator, akcja Start/Powtórz ze strzałką po lewej i wynik po prawej na dole. Cała karta klikalna, bez kategorii i pill wyniku. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — dostęp do lokalnego web 8082 | IN_PROGRESS / NOT VERIFIED | Diagnostyka zgłoszenia właściciela: HTML i bundle na 8082 zwróciły HTTP 200. Zrestartowano wyłącznie instancję Expo 8082 z --clear; Metro zgłasza Waiting on http://localhost:8082. | Przyczyna objawu w przeglądarce niepotwierdzona; odbiór przez właściciela po pełnym odświeżeniu. Bez testów/regresji i wpisu CHANGELOG (operacja lokalnego developmentu). Instancja uruchomiona w CI mode, bez automatycznego reloadu. |

| 2026-11-04 | P1-I04 — przywrócenie lokalnego backendu i sesji | IN_PROGRESS / NOT VERIFIED | Zgłoszenie We cannot confirm your session: istniejący log wskazuje ClassNotFoundException/NoClassDefFoundError Spring/Tomcat w starym procesie. Uruchomiono scripts/start-local-backend.mjs: Maven package -DskipTests BUILD SUCCESS, lokalny backend uruchomiony na 8090 (Started SoberityBackendApplication). | Testów i dodatkowej weryfikacji nie uruchamiano. Potwierdzenie sesji w przeglądarce do ponowienia przez właściciela. CHANGELOG bez wpisu: przywrócenie środowiska lokalnego. |

| 2026-11-04 | P1-I04 — uporządkowanie karty quizu z obrazem | IN_PROGRESS / NOT VERIFIED | QuizCard: obraz jako osobny górny panel cover 144 px, spójna powierzchnia treści poniżej, usunięte scrim i przypadkowe białe podkłady tytułu/akcji/wyniku. Oceaniczny tytuł i kolory wyników zachowane; cieńsza ramka/radius lg. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; web/iOS/Android NOT VERIFIED. CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — miniatura quizu zamiast pytajnika | IN_PROGRESS / NOT VERIFIED | QuizCard: przesłany obraz w kafelku 56 × 56 obok tytułu, zamiast ikony; brak/błąd zdjęcia pokazuje pytajnik. Usunięto oddzielny górny cover. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony do odbioru. Kolejny krok: ręczny odbiór P1-I04. |

| 2026-11-04 | P1-I04 — odbiór i zamknięcie | DONE; T01–T04, V01–V02 zaznaczone | Właściciel uznał fiszki i quizy za zakończone na teraz i wyraźnie polecił zaznaczyć wszystkie punkty. PHASES: status, Finished 2026-11-04, checklista, licznik Phase 1 4/7 i aktualny punkt pracy; CHANGELOG: końcowy zakres. Bez nowych testów lub dodatkowej weryfikacji agenta; historyczne ograniczenia i wyniki zachowane. | Brak zgłoszonych blokerów odbioru P1-I04. Nie podano nowej macierzy platform i nie zadeklarowano nowych PASS. P1-I03 i bramka fazy nadal otwarte; P1-I05 TODO, wyłącznie na kolejne polecenie. |

| 2026-11-04 | P1-I05 — Weekly Science Drop & publishing cadence | IN_PROGRESS; T01–T04 zaimplementowane, NOT VERIFIED | V12 discovery_issue/audit/guard, discovery service/controller/scheduler, reguły public GET; karta i czytnik RN Home/Articles, panel redakcji web i trasy, EN/PL. Niezależna recenzja, terminy UTC/IANA, slot tygodniowy, zabezpieczony scheduler, aktualność dowodów i fallback. Kontrakt/odbiór w WEEKLY_SCIENCE_API.md; README/BRANDING/aktualny punkt pracy uzupełnione. | Zgodnie z poleceniem bez testów i dodatkowej weryfikacji, bez buildów/migracji/restartów. V12 do lokalnej aktywacji; wszystkie checkboxy otwarte, Finished —, bez wpisu CHANGELOG do odbioru. P1-I03 nadal otwarte; P1-I06 nierozpoczęte. |

| 2026-11-04 | P1-I05 — lokalna aktywacja Science Drop | IN_PROGRESS; V12 zastosowana | Na wyraźne polecenie właściciela uruchomiono scripts/start-local-backend.mjs z pominięciem testów: BUILD SUCCESS, Flyway Successfully applied 1 migration, schema v12; Tomcat 8090 i Started SoberityBackendApplication. Log /private/tmp/soberity-weekly-backend-start.log. | Bez dodatkowych testów i weryfikacji endpointów/UI. Brak seedowanych materiałów; właściciel odświeża aplikację i wykonuje odbiór P1-I05. Checkboxy/Finished bez zmian, CHANGELOG bez wpisu do odbioru funkcjonalności. |

| 2026-11-04 | P1-I05 — nagłówek w stylu chapter | IN_PROGRESS / NOT VERIFIED | WeeklyScienceCard: zastąpiono nagłówek z ikoną globu wspólnym ChapterHeading, spójnym z pozostałymi sekcjami Home/Articles. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — ikony nagłówków sekcji | IN_PROGRESS / NOT VERIFIED | ChapterHeading: opcjonalna dekoracyjna ikona 22 px/primary przed tytułem. SettingsIcon: kalendarz, książka, kolba; przypisanie ikon spotlight/events/publications/Science Drop. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — blokada wejścia Checking your session | IN_PROGRESS / NOT VERIFIED | Konieczna poprawka dostępu: AuthStatusContext ma limit pierwszego zdarzenia Firebase 15 s i operacji tokenu SDK 10 s. Retry ponownie subskrybuje odczyt sesji, bez uznawania niepotwierdzonego użytkownika za zalogowanego; zachowane sekwencje ignorowania starych odpowiedzi i cleanup timerów. Backend w istniejących logach obsługuje żądania. | Przyczyna konkretnego zawieszenia SDK niepotwierdzona bez diagnostyki przeglądarki. Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ponowne otwarcie web i ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — ponowne uruchomienie web po poprawce sesji | IN_PROGRESS / NOT VERIFIED | Zrestartowano wyłącznie Expo 8082 bez CI mode, z --clear i włączonym watch. Metro zgłasza Web Bundled (7170 ms) i SSR Bundled; poprawka timeout/retry sesji wczytana przez nową instancję. | Bez testów i dodatkowej weryfikacji przeglądarki; potwierdzenie wejścia przez właściciela nadal potrzebne. CHANGELOG odroczony; P1-I05 pozostaje otwarte. |

| 2026-11-04 | P1-I05 — uproszczenie do krótkiego newsa | IN_PROGRESS / NOT VERIFIED | Na wyraźne polecenie właściciela formularz jak artykuł + data/godzina: Tiptap, źródła HTTPS, zapis/edycja częściowego szkicu, automatyczny adres/teaser/przegląd; bez obowiązkowej karty EvidenceClaim. V13 NEWS/EVIDENCE, API POST/PUT news i DB guard, niezależna recenzja nadal wymagana; czytnik/karta rozróżniają tryby bez fikcyjnej pewności dowodów. ADR-008, API/README/BRANDING/EN/PL uzupełnione. | Bez testów i dodatkowej weryfikacji na polecenie właściciela. Wymagana lokalna aktywacja V13; odbiór P1-I05 pozostaje otwarty, CHANGELOG odroczony. |

| 2026-11-04 | P1-I05 — aktywacja uproszczonego edytora | IN_PROGRESS; V13 zastosowana | Lokalny helper package -DskipTests: BUILD SUCCESS; Flyway Successfully applied 1 migration, schema v13; Tomcat 8090 i Started SoberityBackendApplication. Log /private/tmp/soberity-weekly-news-backend-start.log. | Bez testów i dodatkowej weryfikacji API/UI. Właściciel odświeża /editorial-weekly i zapisuje szkic; pełny odbiór P1-I05 nadal otwarty. CHANGELOG bez wpisu do odbioru. |

| 2026-11-04 | P1-I05 — Opublikuj i Zaplanuj | IN_PROGRESS / NOT VERIFIED | Na wyraźną zgodę właściciela V14 i API decyzji PUBLISH/SCHEDULE dla własnych NEWS DRAFT/IN_REVIEW, z obowiązkową treścią/źródłami. Publikacja od razu według zegara DB; harmonogram wymaga przyszłej daty. Pochodzenie AUTHOR/REVIEWED w publicznych projekcjach, uczciwe etykiety kart/czytnika; opcjonalna recenzja zachowana, starsze EVIDENCE bez osłabienia. UI i EN/PL, ADR-008/API/README uzupełnione. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; checkboxy/Finished bez zmian, CHANGELOG odroczony do odbioru. Następny krok: aktywacja V14 i ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — aktywacja Opublikuj/Zaplanuj | IN_PROGRESS; V14 zastosowana | Lokalny helper package -DskipTests BUILD SUCCESS; Flyway schema v14; Tomcat 8090 i Started SoberityBackendApplication. Log /private/tmp/soberity-weekly-publication-backend-start.log. | Bez testów i dodatkowej weryfikacji endpointów/UI; nie publikowano żadnego newsa. Ręczny odbiór P1-I05 przez właściciela; CHANGELOG odroczony. |

| 2026-11-04 | P1-I05 — Science Drop pierwszy na Home | IN_PROGRESS / NOT VERIFIED | WelcomeScreen: WeeklyScienceCard przed Today’s spotlight. DiscoverScreen compact bez kopii Science Drop; pełne Articles zachowuje kartę tygodnia. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — Artykuł tygodnia zamiast osobnego Science Drop | IN_PROGRESS / NOT VERIFIED | Na decyzję właściciela V15 weekly_article_feature/audit, nowy serwis i API selekcji, karta oparta na istniejącym artykule i zwykłym czytniku. Panel wybiera opublikowany ARTICLE teraz/od terminu, zmienia/usuwa wyróżnienie; EN/PL i historia wcześniejszych treści do odczytu. Stare write API 410, historyczny scheduler wyłączony bez usuwania danych; ADR-009 i docs/tracker uzupełnione. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; wymaga aktywacji V15. Checkboxy/Finished otwarte, CHANGELOG odroczony. P1-I06 nierozpoczęte. |

| 2026-11-04 | P1-I05 — aktywacja Artykułu tygodnia | IN_PROGRESS; V15 zastosowana | Lokalny helper package -DskipTests BUILD SUCCESS; Flyway schema v15; Tomcat 8090 i Started SoberityBackendApplication. Log /private/tmp/soberity-weekly-article-backend-start.log. | Bez testów i dodatkowej weryfikacji API/UI. Nie wybrano/nie opublikowano treści za właściciela. Ręczny odbiór P1-I05 otwarty; CHANGELOG odroczony. |

| 2026-11-04 | P1-I05 — karta tygodnia jak Latest publications | IN_PROGRESS / NOT VERIFIED | Wspólny PostPublicationCard dla WeeklyScienceCard i postów DiscoverScreen: ten sam list layout, miniatura, tytuł Ocean, kategoria EN/PL i data. Usunięto osobny teaser/CTA i pionowy cover tygodnia; fallback, loading/error/empty oraz link do artykułu zachowane. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — Home bez Latest publications, naturalniejszy weekly feature | IN_PROGRESS / NOT VERIFIED | WelcomeScreen bez kompaktowego DiscoverScreen i jego sekcji Latest publications. WeeklyScienceCard używa wariantu featured wspólnej karty: brak widocznej ramki/pastelowego pudełka, większa miniatura, tytuł h3/Ocean, spokojna kategoria i data zamiast pill, większe odstępy. Pozostałe Articles bez zmiany wariantu. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — klikalność weekly feature | IN_PROGRESS / NOT VERIFIED | PublicationCard featured: widoczna ramka border i padding16; PostPublicationCard featured: akcja Czytaj artykuł/Read article z chevronem w primary. Cała karta jednym linkiem, bez dodatkowego przycisku w linku. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — błękitny panel pod miniaturą | IN_PROGRESS / NOT VERIFIED | PostPublicationCard featured: pełnowysokościowa lewa kolumna surfaceAlt jak Today’s spotlight, zdjęcie wyśrodkowane z padding12; panel tekstu padding16. Wariant list Articles bez zmian. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — editorial Weekly Science Drop redesign | IN_PROGRESS / NOT VERIFIED | FeaturedArticleCard + PostPublicationCard featured delegation, PublicationCard featured: vertical 16:9 cover, radius16, subtle 1px theme border, dark h2 headline max3 lines, localized category/publication date, dynamic summary max2 lines and footer with estimated reading time + Read article arrow. Missing/failed image fallback, whole-card real link, focus/hover/press, active theme tokens. SettingsIcon arrowUpRight and EN/PL; BRANDING updated. Other Home sections and standard article list/API unchanged. | No tests, build/lint/typecheck, browser/simulator or additional verification run, per owner instruction. Web/iOS/Android/light/dark/a11y NOT VERIFIED. No new dependencies or generated/hardcoded article content. CHANGELOG deferred until acceptance. Next: owner manual acceptance of P1-I05. |

| 2026-11-04 | P1-I05 — oznaczenie artykułu tygodnia na liście | IN_PROGRESS / NOT VERIFIED | DiscoverScreen bez sekcji WeeklyScienceCard; niezależny odczyt bieżącego wyboru oznacza wyłącznie pasujący PostPublicationCard pill na górnym prawym obrysie. PublicationCard badge: primary/onPrimary, dynamiczna wysokość/odstępy, etykieta dostępności, jedna akcja całej karty; Home bez zmian. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — autorski preview i kompaktowa karta tygodnia | IN_PROGRESS / NOT VERIFIED | V16 preview_content w wersji artykułu, walidacja max280, public/private projekcje i zapis previewContent; edytor Articles EN/PL z polem/opisem/licznikiem i przywracaniem wartości. Karty Home/Articles pokazują wyłącznie autorski preview do2 linii, bez ekstrakcji body. Weekly: grafika16:7.5, padding16/gap8, tytuł2 linie i ciaśniejsza stopka. README/BRANDING uzupełnione. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; wymaga aktywacji V16. Nie wpisano przykładowych twierdzeń zdrowotnych, brak wpisu CHANGELOG do odbioru. Kolejny krok: lokalna aktywacja i ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — aktywacja preview artykułu | IN_PROGRESS; V16 zastosowana | Lokalny helper package -DskipTests BUILD SUCCESS, Flyway schema v16, Tomcat8090 i Started SoberityBackendApplication. Log /private/tmp/soberity-article-preview-backend-start.log. | Bez testów i dodatkowej weryfikacji API/UI. Właściciel uzupełnia Tekst podglądu i publikuje nową wersję artykułu; zapis szkicu nie zmienia publicznego preview. CHANGELOG odroczony; P1-I05 do ręcznego odbioru. |

| 2026-11-04 | P1-I05 — gwiazdka z popover zamiast tekstowego pill | IN_PROGRESS / NOT VERIFIED | PublicationCard badge: pill z SettingsIcon star, osobny IconHint poza linkiem. Tooltip EN/PL hover/focus/tap, target48×44, Escape/blur, brak nawigacji po kliknięciu gwiazdy, popover przy prawym obrysie poniżej przycisku. Wspólny IconHint rozszerzony o wariant pill i obsługę focus; BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — spójne obrysy Home i uproszczone Articles | IN_PROGRESS / NOT VERIFIED | PublicationCard featured używa colors.border jak Today’s spotlight i karta Events; zachowany focusRing. PostPublicationCard list bez preview/opisu i dodatkowej etykiety recenzji, z tytułem/kategorią/datą; Home featured nadal wyświetla zapisany preview, gwiazdka tygodnia zachowana. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji na polecenie właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — zlecona animacja podglądu biletu Home | IN_PROGRESS / NOT VERIFIED | Mała korekta Home na wyraźne polecenie właściciela, bez startu Phase2: EventTicketPreview dzieli zdjęcie na główną część/odcinek, jednorazowe odsunięcie/obrót/powrót po przewinięciu i widoczności. Screen opcjonalnie raportuje viewport bez rerenderów na każdy scroll; WelcomeScreen wykrywa widoczność tylko pierwszego biletu, próg60%/180ms. RN Animated, reduced motion i cleanup, bez nowych zależności. Branding uzupełniony, preview eventu pozostaje jawnym podglądem. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; web/native/reduced-motion NOT VERIFIED. CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05 i korekty Home. |

| 2026-11-04 | P1-I05 — bez Back to Discover, wolniejsze naderwanie biletu | IN_PROGRESS / NOT VERIFIED | ArticleScreen i LearningScreen bez przycisku Back to Discover; usunięto nieużywany router z czytnika. EventTicketPreview: sekwencja650ms oderwanie +900ms pauza +800ms powrót; zachowana jednorazowość i reduced motion. BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | P1-I05 — animacja biletu 1,5 s | IN_PROGRESS / NOT VERIFIED | EventTicketPreview:400ms oderwanie +600ms pauza +500ms powrót =1500ms; BRANDING uzupełniony. | Bez testów i dodatkowej weryfikacji zgodnie z poleceniem właściciela; CHANGELOG odroczony. Kolejny krok: ręczny odbiór P1-I05. |

| 2026-11-04 | Plan — usunięcie iteracji Weekly Science Drop | Iteracja usunięta z planu na polecenie właściciela | PHASES.md: usunięto sekcję i checklistę P1-I05, poprawiono licznik Phase1 do4/6 i łącznie17/78, zakres fazy, zależności P1-I06/P3-I04 oraz aktualny punkt pracy. ID nie jest ponownie używane; historyczne wpisy i kod aplikacji zachowane. | Bez testów i dodatkowej weryfikacji; CHANGELOG bez wpisu, wyłącznie zmiana planu. Następna praca tylko na polecenie właściciela. |

| 2026-11-04 | P2-I00 — start Sober Events; Myth Battle odłożone | IN_PROGRESS / NOT VERIFIED | Na wyraźne polecenie właściciela P1-I06 oznaczono PARKED (TODO, bez zaliczania bramki) i rozpoczęto tylko P2-I00. Polityka/taksonomia/organizatorzy/źródła/retencja/moderacja w docs/policies, klasa EventPolicy z enumami i reason codes/przejściami, scenariusze nieuruchomione, README backendu i ADR-010. | Bez testów i dodatkowej weryfikacji; bez kompilacji, migracji/restartów i API/UI. Checkboxy/Finished pozostają otwarte; CHANGELOG odroczony. Następna P2-I01 dopiero po kolejnym poleceniu; bramki Phase 0/1 nadal otwarte. |

| 2026-11-04 | P2-I01 — model danych i API wydarzeń | IN_PROGRESS / NOT VERIFIED | Na polecenie właściciela rozpoczęto dokładnie P2-I01. V17, model wersjonowany, ACL członkostwa/moderatorów, niezależne review i publikacja, publiczny katalog z filtrami/paginacją/geo, UTC+IANA, walidacja i normalizacja obrazów, integracja usuwania kont; kontrakt backend/EVENTS_API.md. | Bez testów/buildów/dodatkowej weryfikacji, uruchomienia migracji/restartu. T01–T04/V01 i Finished otwarte. CHANGELOG odroczony. P2-I02/P2-I03 nierozpoczęte; P2-I00 nie jest automatycznie zaliczone. |

| 2026-11-04 | P2-I02 — discovery wydarzeń web/mobile | IN_PROGRESS / NOT VERIFIED | Wspólny katalog /events, filtry miasto/region/data/kategoria/cena/accessibility, strict/friendly, sortowanie i paginacja, karty z datami/strefą/ceną, EN/PL Ocean, opcjonalny promień/ręczny punkt i jednorazowa geolokalizacja web; API region/sort. backend/EVENT_DISCOVERY.md z zakresem i odbiorem. | Na polecenie właściciela bez testów/buildów/dodatkowej weryfikacji/aktywacji V17/restartów. T01–T04/V01 otwarte. GPS native automatyczny niedostarczony; współrzędne ręczne bez uprawnień. P2-I03 nierozpoczęte; CHANGELOG odroczony. |

| 2026-11-04 | P2-I03 — szczegóły, checkout zewnętrzny i linki | IN_PROGRESS / NOT VERIFIED | Szczegóły /events/{UUID}, całe karty jako link, publiczny organizator, stany anulowania/zakończenia, HTTPS i domena przed wyjściem, rewalidacja celu, eksport ICS z UTC/escaping/folding, istniejący native scheme, runtime metadata i minimum SEO w EVENT_DETAIL.md. Korekta pill Articles: mniejsza gwiazdka i tło przy zachowaniu target48×44. | Zgodnie z poleceniem bez testów/buildów/weryfikacji/API/UI/migracji/restartów. T01–T04/V01/V02 otwarte; zależności niezaliczone. Produkcyjne SEO/universal links i natywny import wymagają odbioru. CHANGELOG odroczony; P2-I04 nierozpoczęte. |

| 2026-11-04 | Articles — oznaczenie tygodnia bez zmiany wymiarów karty | NOT VERIFIED | Usunięto dodatkowy marginTop i paddingTop zależne od gwiazdki w PublicationCard. Badge pozostaje absolutną nakładką przy górnym prawym obrysie, lekko nad treścią; wspólny padding kart12, target i popover zachowane. | Bez testów i dodatkowej weryfikacji na polecenie właściciela. Status P2-I03 bez zmian; CHANGELOG odroczony do odbioru. |
