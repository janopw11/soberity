# Soberity — zatwierdzony wzorzec UI P0-I03A

**Akceptacja właściciela: 2026-11-01.** Układ v4, dwa motywy:

- **Domyślny ciemny:** jaśniejsza Śliwka (`plum-soft`).
- **Alternatywny jasny:** wcześniejszy fioletowo-biały (`violet`).

[Wzorzec z przełącznikiem](index.html?screen=home&lang=pl) ·
[Porównanie obu motywów](review.html).

HTML działa lokalnie, także bez serwera. Jest referencją dla implementacji,
nie aplikacją Expo. Domyślnie otwiera się Śliwka; wybór w tej referencji jest
przekazywany w URL. Właściwa aplikacja ma zapamiętywać wybór lokalnie.

## Obowiązujący zakres projektu

Home: krótkie powitanie i najnowsze publikacje naukowe, typ artykuł/badanie,
data publikacji, filtry i otwieranie całego wpisu. Bez eventów na Home i bez
CTA „Czytaj podgląd”. Science i Events są osobnymi sekcjami menu ośmiu pozycji.
Nagłówki są mniejsze, z akcentem fioletowym/lawendowym. Ilustracje mają spójny styl.

Specyfikacja: **`docs/BRANDING.md`**, jedyne repozytoryjne źródło zasad UI.
Wartości obu zatwierdzonych palet: `palettes.json`. `palettes.js` stosuje je
w referencji i przemalowuje dekoracyjne SVG. Treści, daty i wydarzenia są
przykładowe; źródła/wyniki naukowe i funkcje Phase 1/2 nie zostały wdrożone.

## Stan implementacji

P0-I03A-T03/T05: zakończone — akceptacja i zasady zapisane.
T04 i V01–V03 pozostają otwarte: wspólne tokeny aplikacji, dostępny przełącznik,
zapamiętywanie wyboru, stany komponentów, istniejące ekrany i testy platform.
Akceptacja projektu nie oznacza ukończenia iteracji ani działającego dark mode
w aplikacji. Logo nadal tekstowe, font systemowy.

## Dowody i sprzątanie

Na polecenie właściciela usunięto siedem katalogów roboczych:
`P0-I03A-v1`, `P0-I03A-v2`, `P0-I03A-v3`, `P0-I03A-v4`, `P0-I03A-colors`,
`P0-I03A-dark`, `P0-I03A-plum` z `design/previews/`.

W tym katalogu zachowano kompletne źródła zatwierdzonej referencji, cztery SVG,
cztery aktualne screenshoty PL, skrypt i wyniki kontroli. Audyt T01: `audit.md`.
W `history/` pozostały małe raporty historycznych testów. Wpisy dziennika
PHASES.md zachowują historyczne nazwy; nie odwołują się do bieżących artefaktów.

Aktualna weryfikacja: [verification.txt](verification.txt).

- Chromium: 8 wariantów (dwa motywy × EN/PL × desktop/mobile), PASS.
- Tokeny i właściwy schemat dark/light, ilustracje, filtry, panel lektury,
  fokus, przełączanie języka, nawigacja z zachowaniem motywu, overflow: PASS.
- 20 par kontrastu: tekst min. 4.5:1, focus min. 3:1: PASS. Test wybranych
  tokenów nie jest pełnym audytem WCAG wszystkich stanów aplikacji.
- Lokalny HTML bez serwera: PASS. ESLint/Prettier/składnia/diff: PASS.
- Runtime iOS/Android i pełne czytniki ekranu: NOT VERIFIED.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory design/reference/P0-I03A
node design/reference/P0-I03A/verify.mjs
```
