# Historyczny przegląd UI — P0-I03A-T01

2026-11-01; przeniesiono z usuwanego v1. Odniesienia do starej propozycji
opisują jej ówczesny stan. Zatwierdzony rezultat: README.md i BRANDING.

## Przegląd istniejącego UI (T01)

- `WelcomeScreen.tsx`: tytuł, opis i informacja o etapie budowy; brak kompozycji
  pokazującej równorzędnie Science i Events. W propozycji dwa wejścia i dwie karty.
- `UnavailableScreen.tsx`: prawidłowy placeholder, bez docelowych kart treści.
  Makiety pokazują ich przyszły wygląd; nie zastępują placeholderów aplikacji.
- `Screen.tsx` i tokeny: użyteczna baza szerokości, odstępów, typografii i kolorów.
  Propozycja zachowuje paletę, font systemowy, skalę 4 pt, CTA 48 px i promienie.
- Menu: zachowano ukryty panel ☰ i osiem uzgodnionych pozycji z emoji, bez grup;
  pięć przyszłych sekcji jest nieaktywnych. To osobny prototyp HTML, nie test
  komponentu React Native `SideMenu`.
- Ilustracje: lokalne kompozycje CSS; na kartach wydarzeń demonstracyjne plakaty.
  Docelowe zdjęcia pochodzą od organizatorów z prawami do użycia, zgodnie z BRANDING.
- Zaległa weryfikacja natywna P0-I03: odczyt `simctl list devices booted` i
  `adb devices` 2026-11-01 potwierdził brak uruchomionych urządzeń. Test menu,
  VoiceOver/TalkBack i skalowania fontu pozostaje NOT VERIFIED. Uruchomić symulator
  i emulator, następnie sprawdzić osiem pozycji, nawigację, zamykanie i dostępność.
