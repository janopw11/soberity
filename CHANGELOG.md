## 2026-11-06

- Naprawiono panel wydarzeń administratora (P2-I04): używa API admina zamiast zablokowanego API organizatora. Dodawanie, edycja, bezpośrednia publikacja i usuwanie z potwierdzeniem nie wymagają konta ani weryfikacji organizatora. Globalny wybór kraj → miasto, opcjonalny koniec, rich opis, EN/PL i niezależny dostęp w Profilu. Zweryfikowano konto właściciela w development Firebase i nadano lokalny grant Events admin; backend zrestartowany bez nowych migracji. Backend: 34 unit/architecture i 13 IT PASS; web z kontrolowanym API: 10/10 desktop/mobile, EN/PL, light/dark PASS; lint/format PASS. Pełny typecheck blokuje wcześniejszy błąd SideMenu.tsx:163. Natywne runtime i pełny odbiór P2-I04 pozostają otwarte.

## 2026-11-05

- Lokalny backend: przywrócono API na `localhost:8090`, zgodnie z konfiguracją klienta, po błędzie „We can't confirm your session” spowodowanym brakiem procesu na tym porcie. Build aplikacji PASS; Flyway zastosował zaległe lokalne V17–V20. Readiness 200/UP, publiczny katalog 200, CORS dla web 8081 PASS, brak/niepoprawny token 401. Bez zmian kodu uwierzytelniania, kont użytkowników ani produkcji; sesja właściciela wymaga ponowienia w jego przeglądarce.
  Po ponownym wystąpieniu braku procesu uruchomiono helper backendu jako odłączony proces w tle; powtórzony build i kontrole readiness/katalog/CORS/401 PASS. Baza pozostała na V20, bez nowych migracji. Log: `/tmp/soberity-session-backend-detached.log`.

- P2-I02 — katalog wydarzeń z wyszukiwaniem nazwy/typu, globalnymi polami kraj–miasto po ID i datami uwzględniającymi DST; dobrowolna lokalizacja foreground w preferencjach i rzeczywiste pobliskie bilety Home. Bez zgody sekcja jest ukryta; empty/unavailable/error mają osobne stany i link do katalogu. Zgoda wyłącznie sesyjna, bez zapisu współrzędnych. Web EN/PL light/dark desktop/mobile 24/24, nowe unit 16/16, kontrast 2/2, typecheck, lint zmian, eksporty i build/runtime iOS PASS. Zamknięto na polecenie właściciela z pominięciem dalszych testów Androida; jego pełny przebieg pobliskich NOT VERIFIED. Wcześniejsze 14 błędów pełnych testów klienta i 4 błędy lint repo pozostają udokumentowane, bez nowych regresji w porównaniu z HEAD. Bez deploymentu ani migracji bazy aplikacji.

- P2-I01 — wdrożono backend pierwszego etapu Sober Events: globalne kraje/miasta GeoNames z aliasami EN/PL i importerem atomowych snapshotów (V19), katalog admina bez kont organizatorów (V20), API publikacji/usuwania z wersjami i audytem, filtry nazwa/typ/kraj–miasto/data oraz POST pobliskich wydarzeń z konfigurowalnym promieniem 100 km. Zachowano stare dane bez zgadywania lokalizacji; odłożone API organizatorów/moderacji zablokowano. Poprawna kontrola offsetów/DST, prywatne media do publikacji i ochrona współrzędnych przed URL/logami. Pełne Maven verify: 34 unit/architecture + 104 IT PASS na izolowanym PostgreSQL 17.11. Bez migracji bazy aplikacji, pełnego globalnego importu ani testów UI; instrukcje konfiguracji w backend/LOCATIONS_IMPORT.md.

- P2-I00 — ukończono politykę pierwszego etapu Sober Events: kwalifikacja bezalkoholowych wydarzeń, cykl publikacji/usunięcia przez admina, GeoNames jako źródło krajów/miast, domyślny promień 100 km, zgody lokalizacyjne oraz prywatność i retencja Joined. Dodano czyste reguły domenowe i scenariusze; Maven: 31 testów unit/architektury PASS, w tym 18 Events, oraz przegląd polityki. Bez wdrażania importera, API, migracji i UI; istniejące implementacje Events wymagają dostosowania w kolejnych iteracjach.

## 2026-11-04

- P1-I04 — Flashcards & quizzes: zamknięto pełną checklistę na podstawie odbioru i polecenia właściciela. Fiszki z recenzowanymi wyjaśnieniami i źródłami, quizy trzech typów, automatyczny zapis i wznowienie quizów, wyniki i powtórki. Dopracowano kategorie, miniatury kart, interaktywny przebieg z paskiem postępu i źródłami oraz ekran wyniku; usunięto błąd payloadu Finish. Bez nowych testów agenta przy zamknięciu; wcześniejsze dowody i ograniczenia platformowe zachowano w PHASES.md.

- Quizy: dodano zapis ukończonych wyników zalogowanego użytkownika w PostgreSQL (V10), prywatne API, serwerową ocenę, idempotentne ponowienia i możliwość powtórek. Karty pokazują ostatni procent: blue bez ukończenia, red <40%, orange 40–79%, green >=80%. Kasowanie danych/konta usuwa wyniki. Backend 13 unit + 27 IT, klient 12/12 i web EN/PL light/dark mobile/desktop 8/8 PASS; native NOT VERIFIED. Backend lokalny zrestartowany, V10 zastosowana, health 200/UP.

- Quizzes: nagłówek z ikoną i oceanicznym tytułem jak Articles, bez powtórzonego tytułu/opisu i Back to Discover. Pusta lista pokazuje tylko stylowane No quizzes / Brak quizów. Karty quizów mają styl listy Articles: błękitne tło, cienka zaokrąglona ramka, kwadratowy Start Quiz po lewej oraz tytuł/liczbę pytań po prawej. Wspólna paginacja Articles/Quizzes zachowuje stany i liczbę stron. Testy komponentów 6/6, typecheck/lint i web EN/PL × light/dark × mobile/desktop 8/8 PASS; runtime iOS/Android NOT VERIFIED.

- Articles: dodano wyszukiwanie fragmentu tytułu bez rozróżniania wielkości liter oraz dropdown kategorii EN/PL rozwijany pod polem jako nakładka nad kartami, bez modala i przesuwania listy. Oceaniczny tekst, wyróżnienie wybranej opcji i widoczny scrollbar ułatwiają wybór; bez dodatkowego przycisku „Więcej kategorii”. Filtry łączą się po stronie API przed paginacją; formularz ma debounce 500 ms i reset strony. Nagłówek Articles jest oceaniczny z ikoną, bez powtórzonego chapter; wyszukiwanie i select są w jednym, kompaktowym rzędzie (web: pola 40 px, mniejsze etykiety i tekst). Backend 13 unit + 23 IT, testy komponentu 4/4 i web smoke EN/PL mobile/desktop 4/4 PASS. Runtime iOS/Android i ciemny motyw formularza pozostają NOT VERIFIED.

- Jasny motyw Ocean: białe tło, jasnoniebieskie powierzchnie, granatowy tekst i oceaniczno-niebieskie akcje zastępują fiolet. Zapisany wybór `light` zachowany. Kontrast obu motywów 2/2, typecheck klienta/tokenów i lint tokenów PASS; render web/iOS/Android nowej jasnej palety NOT VERIFIED.

- Ciemny motyw: zastąpiono Śliwkę paletą Ocean inspirowaną zdjęciem właściciela — głęboki granat, niebieskie powierzchnie, cyjanowe akcje i chłodny jasny tekst. Wspólne tokeny obejmują istniejące ekrany; jasny motyw i zapisany wybór zachowane. Kontrast obu motywów 2/2, typecheck, web EN/PL desktop/mobile i klawiatura 2/2 PASS; nowy runtime iOS/Android NOT VERIFIED.

## 2026-11-03

- Panel redakcyjny: przebudowano `/editorial` na edytor blogowy Tiptap z formatowaniem, justowaniem, źródłami w stopce, tworzeniem kategorii, obrazami inline i okładką 1600×900. Uproszczono formularz i sterowanie; dodano wybór publikacji autora lub recenzji oraz uwagi recenzenta. UI EN/PL, desktop/mobile-web: 8/8 PASS na symulowanym API; klient 76/76, backend unit 13/13, check i eksporty PASS. V7 zastosowana lokalnie, odczytowy smoke API PASS; pełne nowe testy integracyjne pominięte na życzenie właściciela. Automatyczne tłumaczenia odroczone.

- P1-I02: dodano panel redakcyjny web EN/PL i prywatne API z rolami autora i recenzenta. Niezależne zatwierdzanie twierdzeń i całych artykułów, wersjonowanie, publikacja/wycofanie oraz nieedytowalna historia działań; poprawiono dostępność potwierdzeń recenzji na webie. Maven 81 testów, klient 76/76, Playwright na realnym lokalnym backendzie 8/8 oraz 2/2 scenariusze artykułów PASS; check i eksporty web/iOS/Android PASS. Panel web-only, nowe testy runtime natywnego nie były wykonywane.

- P1-I01: dodano publiczne API kategorii EN/PL, twierdzeń, artykułów i cytowań z filtrowaniem, paginacją i rewalidacją ETag. API ujawnia wyłącznie opublikowane treści, ukrywa artykuły zależne od wycofanej wersji twierdzenia i odmawia zapisów. Flyway V5 wymaga niezależnej recenzji wersji artykułu. Maven: 8 testów unit + 64 integracyjne PASS (14 nowych Science API); pnpm check PASS na izolowanym PostgreSQL 17.11.

- P1-I00: wdrożono model źródeł naukowych i wersjonowanych twierdzeń, cytowania, niezależne recenzje oraz politykę źródeł uwzględniającą The Lancet. Migracja Flyway chroni publikację przed brakiem źródeł/recenzji, samoakceptacją, nieuzasadnioną przyczynowością i nadpisaniem historii. Zweryfikowano migracje, upgrade V3→V4, JPA i współbieżność na izolowanym PostgreSQL 17.11; Maven 58 testów i pnpm check PASS.

- P0-I13: dodano zweryfikowane lokalnie workflow CI (frontend/backend/Gitleaks), profile EAS development/preview z kontrolą konfiguracji oraz konfigurację staging HTTPS, smoke, monitoring i bezpieczne skrypty backup/restore. Uaktualniono bootstrap/README i zapisano przegląd bezpieczeństwa. Testy web 24/24, klienta 71/71 i infrastruktury 10/10 PASS; staging, zdalne buildy/CI oraz pełna bramka Phase 0 pozostają nieodebrane.

- P0-I12: rozszerzono regresję web o przywracanie sesji, awarię API i ponowienie, edycję profilu, reauth, zmianę/reset hasła, usuwanie konta, deep linki i klawiaturę. Potwierdzono 24 scenariusze w przebiegu pełnym i poprawkowym oraz smoke Android Expo Go. Dodano lokalną macierz wyników z wersjami, dowodami i instrukcjami dokończenia; iterację zamknięto 2026-11-03 po potwierdzeniu przez właściciela samodzielnej, pozytywnej weryfikacji T01–T03. Historyczne ograniczenia testów agenta zachowano w raporcie.

- Home: dopracowano układ zgodnie z briefem premium/minimal: kompaktowy tagline, „Today's spotlight” i karta mapy w jasnym, redakcyjnym stylu z etykietą kategorii, niższym obrazem i subtelną strzałką; uproszczono nagłówki oraz zmniejszono ikony nawigacji. Usunięto mock Vienna Coffee Rave; ponieważ brak źródła wydarzeń, sekcja pokazuje pusty stan zamiast fikcyjnego karuzelowego wpisu. Nie dodano sekcji science z placeholderami. Testów/buildów nie uruchamiano.

- Home: wzmocniono akcent nagłówków sekcji: tytuły oraz krótkie linie po lewej są w `primary`, a długie linie po prawej pozostają neutralne. Testów/buildów nie uruchamiano.

- Home: zastąpiono kropki przy nagłówkach krótkimi liniami `border`, pasującymi do separatorów po prawej stronie tytułów. Testów/buildów nie uruchamiano.

- Home: usunięto numerację z nagłówków rozdziałowych i zastąpiono ją małą fioletową kropką; tytuły i linie prowadzące pozostają bez zmian. Testów/buildów nie uruchamiano.

- Home: zastąpiono chipy sekcji stylem redakcyjnych rozdziałów: numer 01–03, wyraźniejszy tytuł i cienka linia prowadząca. Kolory i kontrast pochodzą z tokenów obu motywów. Testów/buildów nie uruchamiano.

- Home: wystylizowano etykiety „Feature for today”, „Nearest events” i „Latest news” jako spójne, kompaktowe chipy z delikatnym obramowaniem, tłem `surfaceAlt` i fioletowym punktem akcentowym. Zachowano nagłówki dostępności oraz tokeny motywu. Testów/buildów nie uruchamiano.

- Home: podmieniono grafikę Coffee Rave na nową wersję właściciela, przyciętą do 880×453 px wokół filiżanki. Karta nadal pokazuje pełną filiżankę w górnym panelu z treścią poniżej. Testów/buildów nie uruchamiano.

- Home: zastąpiono ilustrację World Map nową, realistyczną grafiką mapy; przygotowano kadr 1020×525 px skupiony na mapie i podpięto go do górnego panelu karty. Panel treści bez zmian. Testów/buildów nie uruchamiano.

- Home: usunięto powitanie z nazwą użytkownika i dodano nad kartą mapy nagłówek „Feature for today” / „Propozycja na dziś”. Testów/buildów nie uruchamiano.

- Home: przycięto grafikę karty World Map tak, aby globus i pinezka zajmowały większość górnego panelu; podmieniono źródło na `world-map-earth.png` (1672×941). Panel tekstowy pozostał oddzielony poniżej. Testów/buildów nie uruchamiano.

- Home: dodano grafikę mapy świata jako górny panel kafla „Explore the world map”, z oddzielnym panelem tytułu/opisu/akcji według wzorca Coffee Rave. Asset: `world-map-preview.png` (1280×720). Testów/buildów nie uruchamiano.

- Home: po kolejnej korekcie Vienna Coffee Rave ma widoczny kadr ilustracji 16:9 z filiżanką w górnym panelu i osobny czytelny panel tekstu/akcji poniżej. Wysokość obrazu jest jawna, a layout nie nakłada treści na filiżankę. Testów/buildów nie uruchamiano.

- Home: poprawiono kafel Vienna Coffee Rave po zgłoszeniu błędnego dopasowania: obraz jest tłem zwartego banera 200 px, treść leży na nim, a tokenowy gradient zwiększa kontrast. Usunięto rozciąganie flex kafla. Testów/buildów nie uruchamiano.

- Home: dodano dostarczoną przez właściciela grafikę Coffee Rave (1280×720 PNG) jako tło kafla Vienna Coffee Rave; obraz jest przyciemniony pod treścią. Testów/buildów nie uruchamiano.

- Home: nagłówek „Dla Ciebie na dziś” zastąpiono spersonalizowanym powitaniem i wprowadzeniem do rekomendacji; nazwa pochodzi z profilu Firebase z fallbackiem na prefiks e-maila. Dodano tłumaczenia EN/PL. Testów/buildów nie uruchamiano.

- Home: usunięto nagłówek powitalny z nazwą użytkownika oraz niepotrzebne pobieranie nazwy profilu na tym ekranie. Testów/buildów nie uruchamiano.

- Home: kafle mapy świata i Vienna Coffee Rave otrzymały etykietę akcji oraz chevron, by sygnalizować docelową klikalność. Są semantycznie opisane jako niedostępne przyciski, bez akcji do nieistniejących ekranów. Testów/buildów nie uruchamiano.

- Home: usunięto ikony i etykiety „Sample/Przykład” z kafli. Tło zachęty do mapy świata ma uproszczony motyw mapy, a wydarzenie otrzymało dekorację przedstawiającą grupę ludzi. Testów/buildów nie uruchamiano na polecenie właściciela.

- Home: kafel „Dla Ciebie na dziś” pokazuje przykładową zachętę do sprawdzenia statystyk na mapie świata, a „Najbliższe wydarzenia” — Vienna Coffee Rave. Oba wpisy są oznaczone jako przykładowe; tekst jest zlokalizowany EN/PL. Testów/buildów nie uruchamiano na prośbę właściciela.

- Home: dodano subtelne, abstrakcyjne dekoracje SVG w kaflach „Dla Ciebie na dziś” i „Najbliższe wydarzenia”, inspirowane załączonym ekranem. Kolory pobierane z aktywnego motywu; tekst pozostaje na osobnej warstwie. Testów i buildów nie uruchamiano na polecenie właściciela.

- Zmieniono kolejność kafli: „Dla Ciebie na dziś” znajduje się teraz nad „Najbliższe wydarzenia”. Testów nie uruchamiano.
- Dopracowano typografię Home w ramach fontu systemowego: mocniejszy nagłówek imienia i tytuły kart, delikatne odstępy liter oraz czytelniejszy rytm metadanych. Bez zmiany fontu marki w pozostałych ekranach. Testów/buildów nie uruchamiano.
- Dalsze odświeżenie Home pod inspirację: powitanie ma czytelny układ „Welcome,” + imię; kafel pierwszego artykułu jest wizualnie wyróżniony, metadane mają lekką etykietę kategorii, a panele wydarzeń/rekomendacji używają miękkich pól ikon. Testów/buildów nie uruchamiano.
- Korekta układu Home: „Najbliższe wydarzenia” i „Dla Ciebie na dziś” są przed wiadomościami; widoczne są dwa wpisy i wyłączony przycisk demonstracyjny „Go to news” / „Przejdź do wiadomości”. Testów/buildów nie uruchamiano.
- Odświeżono wizualnie Home według nowej inspiracji: powitanie ma osobną hierarchię dwóch linii, każda wiadomość jest własnym zaokrąglonym kaflem z wyróżnionym pierwszym wpisem, a wydarzenia i rekomendacje mają większe, miękkie powierzchnie. Użyto wyłącznie zatwierdzonych tokenów. Testów/buildów nie uruchamiano.
- Na prośbę właściciela zmieniono Home na powitanie z imieniem profilu oraz kafle: najnowsze wiadomości, najbliższe wydarzenia i rekomendacje na dziś. Dwie sekcje pokazują komunikat o planowanej dostępności, bez sugerowania działającego katalogu. Testów i buildów nie uruchamiano na bieżące polecenie.

# Changelog

## 2026-11-02

- Strona główna: krótkie powitanie i lista czterech przykładowych artykułów
  inspirowana układem redakcyjnym Medium, z ilustracjami, datą, typem treści
  i czasem czytania. Wspólna dla gościa i zalogowanego, EN/PL, oba motywy;
  dane demonstracyjne oznaczone nad listą, bez niezweryfikowanych tez zdrowotnych.
  Sprawdzono web desktop/mobile (16 testów), Jest 66/66, `pnpm check`,
  eksport web/iOS/Android i render PL/Śliwka w Expo Go na iPhone 17 Pro / iOS 26.5.
  Android runtime i pełne testy czytników ekranu NOT VERIFIED.
  Późniejsza korekta właściciela: Home tylko dla zalogowanych, bez opisów
  pod nagłówkami i bez przycisków auth; osobny ekran wejściowy dla gości.
  Tej korekty nie testowano na wyraźne polecenie; powyższe wyniki dotyczą
  wcześniejszej wersji.

- P0-I10 (DONE 2026-11-02): ustawienia konta. Zmiana hasła i e-maila wymaga
  ponownego potwierdzenia hasła; nowy e-mail obowiązuje po otwarciu linku.
  Usunięcie czyści dane w PostgreSQL, zostawia znacznik blokujący ponowne
  utworzenie profilu (`409`), potem usuwa konto Firebase; przerwane usunięcie
  można dokończyć. Właściciel potwierdził działanie zmiany hasła, e-maila i
  usunięcia konta oraz brak dostępu do danych po usunięciu. `./mvnw clean verify`
  (3 unit + 33 IT), `pnpm check`, Jest 60/60 i eksport web PASS. iOS/Android NOT VERIFIED.
- Naprawiono błąd „Profile unavailable” na ekranie profilu: lokalny backend na
  porcie 8090 działał ze starego buildu (bez `/api/v1/me`). Zrestartowano go z
  aktualnego kodu, z Postgresem z `infra/compose`. Ten wpis dotyczy środowiska,
  nie kodu aplikacji.
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
