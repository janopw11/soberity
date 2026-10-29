# Soberity — instrukcje repozytorium dla Codex

## 1. Cel projektu i dokumenty obowiązujące

Soberity to międzynarodowa aplikacja web/iOS/Android promująca życie bez alkoholu na podstawie rzetelnych badań naukowych. **Edukacja (Science) oraz wydarzenia i społeczność (Community/Events) są równorzędnymi filarami produktu**. Szczególne znaczenie mają sober parties i sober raves, uzupełniane o inne bezalkoholowe aktywności.

Przed planowaniem lub implementacją zapoznaj się z poniższymi plikami w katalogu głównym repozytorium:

1. [`Soberity_raport_produktowo_techniczny.md`](./Soberity_raport_produktowo_techniczny.md) — **główne źródło wymagań**: misja, funkcje, architektura, dane, API, bezpieczeństwo i kierunek rozwoju. Czytaj odpowiednie rozdziały w całości przed pracą nad danym modułem.
2. [`PHASES.md`](./PHASES.md) — **plan wykonania i tracker postępu**: fazy 0–9 rozbite na iteracje `P0-I00` itd., zależności, checklisty, testy, kryteria akceptacji i dziennik implementacji. To z niego wybierasz kolejne zadania i do niego wpisujesz wyniki.
3. [`CHANGELOG.md`](./CHANGELOG.md) — **historia ukończonych zmian z datami**: zwięzłe podsumowanie większych funkcjonalności, napraw i kamieni milowych; nie jest miejscem na codzienną listę commitów ani zadania planowane.
4. `AGENTS.md` (ten plik) — **stałe zasady pracy agenta**. Nie kopiuj tu szczegółowych zadań z `PHASES.md`.

W razie rozbieżności między dokumentami, kodem i bieżącym poleceniem użytkownika: sprawdź stan repozytorium, opisz konflikt i poproś o decyzję zamiast po cichu zmieniać założenia. Nie traktuj samej checklisty jako dowodu istnienia funkcji.

## 2. Podstawowe zasady produktu — niepodlegające kompromisom

- **Science First, Evidence Always**: każde twierdzenie zdrowotne, fiszka, quiz, mapa, symulator lub odpowiedź AI musi mieć weryfikowalne źródła i poprawnie prezentować poziom pewności. Nie przedstawiaj korelacji jako przyczynowości ani szacunków jako indywidualnej diagnozy.
- Produkt **aktywnie zachęca do rezygnacji z alkoholu**, ale komunikacja pozostaje rzetelna, wspierająca i bez zawstydzania użytkowników. Nie projektuj mechanik karzących za przerwanie abstynencji.
- Produkt nie zastępuje terapii, diagnostyki ani pomocy medycznej. Nie wprowadzaj nieuzasadnionych symulacji „procentu uszkodzenia mózgu” po konkretnej dawce.
- Projektuj międzynarodowo: od początku uwzględniaj tłumaczenia (minimum `en`/`pl`), strefy czasowe, regiony, dostępność i późniejsze różne waluty.
- Zbieraj minimum danych osobowych. Nie zapisuj sekretów, surowych tokenów Firebase, haseł ani kluczy serwisowych w kodzie lub repozytorium.

## 3. Uzgodniony kierunek techniczny

- **Klient:** React Native + Expo + Expo Router + TypeScript; uruchamiany na web, iOS i Androidzie. Jeden współdzielony produkt, z kodem specyficznym dla platformy tam, gdzie jest to konieczne.
- **Backend:** Java 21 LTS + Spring Boot, początkowo **modularny monolit**, REST/OpenAPI, Spring Security, JPA, PostgreSQL i migracje Flyway.
- **Tożsamość:** Firebase Authentication, weryfikacja Firebase ID tokenów przez backend; rozdziel odpowiedzialność Firebase (tożsamość) i PostgreSQL (profil i dane aplikacji).
- **Lokalny development:** Docker Compose dla usług backendowych, testy jednostkowe i integracyjne; nie dodawaj mikroserwisów, Kafki ani Kubernetes bez potwierdzonej potrzeby i zgody.
- Zgodność wersji bibliotek, konkretne komendy i architekturę katalogów weryfikuj w aktualnym repozytorium, nie zakładaj, że przykłady z planu są już zaimplementowane.

## 4. Zasady realizacji faz i iteracji

1. **Zacznij od Phase 0** w `PHASES.md`, chyba że użytkownik wyraźnie wskaże inne zadanie. Phase 0 obejmuje projekt, Expo web/iOS/Android, backend, Firebase Auth, potwierdzenie e-maila, reset/zmianę hasła i profil.
2. Na początku sesji: przeczytaj `AGENTS.md`, istotne części raportu i aktualną fazę w `PHASES.md`; sprawdź stan kodu i `git status`. Przed większą zmianą przedstaw krótki plan, zależności i sposób weryfikacji.
3. Realizuj **dokładnie jedną iterację agentową na polecenie** (`P{phase}-I{iteration}`, np. `P0-I06`). Przed jej startem przedstaw plan i zależności. **Nie rozpoczynaj następnej iteracji ani fazy bez mojego polecenia/akceptacji**, nawet gdy ukończysz pracę wcześniej. Nie oznaczaj zależności jako ukończonych na podstawie samej checklisty.
4. Po **faktycznym zakończeniu i weryfikacji** zadania zmień `- [ ]` na `- [x]` w `PHASES.md`. Zadanie nieprzetestowane, częściowe albo zablokowane nie może być oznaczone jako zakończone.
5. Po sesji aktualizuj w `PHASES.md`: **status bieżącej iteracji**, ID wykonanych checkboxów, datę rozpoczęcia/ukończenia (tylko rzeczywistą), dowody testów, bieżący wskaźnik pracy, dziennik sesji i ewentualnie status fazy. Iteracja ma status `DONE` dopiero po spełnieniu własnego Definition of Done; bramka fazy wymaga osobnej weryfikacji. Nie zmieniaj historii wykonania na fikcyjną.
6. **Prowadź `CHANGELOG.md`:** po zweryfikowaniu znaczącej funkcjonalności, większej naprawy lub zestawu zmian dopisz krótki wpis pod datą faktycznego ukończenia (`YYYY-MM-DD`). Łącz drobne zmiany w sensowne grupy; **nie dokumentuj każdego małego commita**. Przy zamknięciu każdej fazy zweryfikuj, czy jej istotne rezultaty znalazły się w changelogu. Nie wpisuj planów ani niepotwierdzonych testami osiągnięć.
7. Jeżeli brakuje dostępu do Firebase Console, macOS/Xcode, symulatora lub emulatora Androida, oznacz odpowiedni krok jako **BLOCKED / NOT VERIFIED** i podaj właścicielowi projektu dokładne czynności do wykonania. Nie twierdź, że test przeszedł, jeśli go nie uruchomiono.
8. Istotne zmiany architektoniczne zapisz w `docs/adr/` po uzgodnieniu. Nie nadpisuj głównego raportu produktowego bez prośby albo zatwierdzonej aktualizacji wymagań.
9. Nie wykonuj deploymentu, operacji na produkcyjnych danych, płatności ani publikacji w sklepach i nie wprowadzaj destrukcyjnych zmian bez jednoznacznej zgody. Commit/push wykonuj zgodnie z poleceniem użytkownika.

## 5. Standard jakości i format odpowiedzi

- W kodzie stosuj spójne nazewnictwo, walidację danych, obsługę błędów, testy i czytelne logowanie bez wycieku danych wrażliwych.
- Przy zmianach klienta sprawdź web oraz, jeśli środowisko pozwala, iOS Simulator i Android Emulator; zapisz, **co rzeczywiście uruchomiono**, a czego nie.
- Przy zmianach API sprawdź autoryzację, uprawnienia i niezgodności kontraktów. Nie wstawiaj atrap sugerujących działającą funkcję.
- Na koniec każdej sesji krótko podsumuj: **wykonane zadania**, **zmienione pliki**, **wyniki testów**, **blokery**, **aktualizacja `CHANGELOG.md` (lub powód braku wpisu)** i **następny krok / identyfikator iteracji `P#-I##` z `PHASES.md`**.

**Zasada nadrzędna:** raport definiuje *co i dlaczego* budujemy; `PHASES.md` definiuje *kiedy, jak i z jakim dowodem ukończenia*; `CHANGELOG.md` podsumowuje *co faktycznie ukończono i kiedy*; `AGENTS.md` definiuje *jak Codex ma pracować*.
