# Consumer — P0-I03

Jeden klient Expo SDK 58, React Native 0.88, React 19.3 i Expo Router, z
podstawowym design systemem (`@soberity/design-tokens` + `src/ui`), routingiem
na kontraktach `public` / `verification-pending` / `authenticated` (Expo
Router `Stack.Protected`) i i18n en/pl (i18next + react-i18next, domyślny en).
Logowanie, rejestracja i weryfikacja e-maila korzystają z Firebase, a backend
potwierdza sesję i `email_verified` przed dostępem do strefy prywatnej. Dla
gościa `/account` i `/verification-pending` przekierowują na stronę główną bez
ujawniania prywatnej treści. Ekran powitalny prowadzi do `/science`, `/events`;
wszystkie obszary jasno informują o niedostępności. Nieznana trasa pozwala
wrócić na start.

## Komendy z katalogu głównego

| Komenda po `pnpm --filter @soberity/consumer` | Działanie                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `web`                                         | Metro i przeglądarka                                                           |
| `ios`                                         | prebuild, CocoaPods, build i uruchomienie development client w Xcode Simulator |
| `android`                                     | prebuild, Gradle, build i uruchomienie development client na Androidzie        |
| `start`                                       | Metro dla wcześniej zainstalowanego development client                         |
| `build`                                       | statyczny eksport web do `apps/consumer/dist`                                  |
| `export:native`                               | bundlowanie JS/assets iOS i Android do `dist/native`; nie tworzy IPA/APK       |
| `test:web`                                    | Playwright Chromium desktop i mobilny viewport; własny serwer na 8091          |
| `test:unit`                                   | Jest (`jest-expo` + Testing Library) dla komponentów UI i `AuthStatusContext`  |

Najpierw `pnpm install --frozen-lockfile`. Testy web wymagają pobrania przeglądarki:
`pnpm --filter @soberity/consumer exec playwright install chromium`.
Port Metro domyślnie 8081; gdy zajęty, podaj np. `start --port 8082`.
Nie uruchamiaj dwóch serwerów testowych na tym samym porcie.

## Expo Go a development build

Expo Go (`pnpm --filter @soberity/consumer exec expo start --go`) pozwala
sprawdzić obecne ekrany i routing bez własnego buildu natywnego. Wymaga
wersji zgodnej z SDK 58. Nie potwierdza konfiguracji własnego binary,
uprawnień ani przyszłych integracji natywnych Firebase.

Development build zawiera `expo-dev-client` i własne moduły natywne.
`ios` / `android` generują ignorowane katalogi natywne z `app.json`.
Po zmianie zależności natywnej lub konfiguracji pluginów przebuduj aplikację.
Identyfikator developerski: `com.soberity.app.dev`, schemat `soberity-dev`.
Expo Go używa linków `exp://HOST:PORT/--/science`; development build
obsługuje schemat aplikacji (np. `soberity-dev:///science`). Nie jest to
release ani publikacja w sklepie.

iOS wymaga macOS, Xcode z runtime Simulator i CocoaPods. Android wymaga
JDK 21, Android SDK/Build Tools zgodnych z wygenerowanym projektem,
platformy SDK 37 i działającego AVD; skonfiguruj je w Android Studio → SDK
Manager / Device Manager. Obraz AVD API 37 nie zastępuje platformy SDK 37
potrzebnej Gradle. Uruchom AVD przed `android`.

## Host API

`EXPO_PUBLIC_API_URL` pozostaje publicznym szablonem dla przyszłego klienta
API. Obecna aplikacja go nie używa i nie uruchamia backendu.

Expo Go i emulatory nie potwierdzają dostarczenia produkcyjnej wiadomości ani
allow-listy Firebase. Do pełnej weryfikacji potrzebny jest rzeczywisty projekt
dev Firebase, dostarczony e-mail oraz build web/natywny z deep linkiem.

| Klient lokalny      | Adres przyszłego backendu                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| Web na komputerze   | `http://localhost:8080` (backend musi dopuścić origin web przez CORS)        |
| iOS Simulator       | `http://localhost:8080`                                                      |
| Android Emulator    | `http://10.0.2.2:8080` (localhost wskazuje emulator)                         |
| Fizyczny telefon    | `http://ADRES_LAN_KOMPUTERA:8080`; ta sama sieć, firewall i nasłuch backendu |
| Staging / produkcja | publiczny adres HTTPS właściwego środowiska                                  |

Port API 8080 jest niezależny od Metro. Adres LAN nie może zawierać sekretów.
Nie umieszczaj poświadczeń w `EXPO_PUBLIC_*`. Dostęp HTTP na natywnych
urządzeniach wymaga osobnej weryfikacji konfiguracji transportu przy
podłączaniu API; obecny smoke test nie testuje sieci backendu.

Wyniki i ograniczenia: [PHASES.md](../../PHASES.md). Lokalne screenshoty i
raporty w ignorowanym `docs/testing/` nie są wymagane do uruchomienia klona.

## Weryfikacja e-maila

Rejestracja od razu wysyła wiadomość weryfikacyjną Firebase. Ekran
`verification-pending` umożliwia ponowne wysłanie po 60-sekundowym lokalnym
limicie oraz odświeżenie użytkownika i tokena przed ponownym sprawdzeniem
backendu. Trasa action linku `/verify-email` obsługuje parametr `oobCode`,
kody nieważne i wygasłe, a backend pozostaje źródłem prawdy i zwraca
403 do czasu otrzymania tokena z `email_verified=true`.

Adresy akcji e-maili ustawia się w konsoli Firebase (Authentication → Templates
→ Customize action URL), a nie w aplikacji. Dla weryfikacji wskaż trasę
`/verify-email`. Zmienna `EXPO_PUBLIC_FIREBASE_EMAIL_CONTINUE_URL` to `continueUrl`
przesyłany z mailem; powinna być autoryzowanym adresem, np. `https://HOST/sign-in`.

Expo Go i emulatory nie potwierdzają dostarczenia produkcyjnej wiadomości ani
allow-listy Firebase. Do pełnej weryfikacji potrzebny jest rzeczywisty projekt
dev Firebase, dostarczony e-mail oraz build web/natywny z deep linkiem.

## Reset hasła i sesja

Ekran logowania prowadzi do `/forgot-password`. Odpowiedź po wysłaniu jest taka
sama dla każdego adresu, także nieistniejącego, aby nie ujawniać kont.
Link z e-maila otwiera `/reset-password`: kod jest sprawdzany przed pokazaniem
formularza, a wygasły, nieprawidłowy lub niedostępny offline kod ma własny
komunikat i ponowienie.

Konfiguracja w konsoli Firebase: szablon „Password reset” → Customize action URL
→ `https://HOST/reset-password` (adres na autoryzowanej domenie, Authentication →
Settings → Authorized domains). `EXPO_PUBLIC_FIREBASE_PASSWORD_RESET_CONTINUE_URL`
to opcjonalny `continueUrl`, np. `https://HOST/sign-in`.

Bez własnej domeny zostaw domyślny handler Firebase (bez zmian w konsoli).
Test lokalny: wyślij reset z `/forgot-password`, ustaw hasło przez link z maila
(strona Firebase), a potem sprawdź nasz ekran, podając w `http://localhost:8081/reset-password?oobCode=KOD`
`oobCode` z tego samego linku. Kod jest jednorazowy, więc do drugiego testu weź
świeży mail.

Sesja jest przywracana przez Firebase po restarcie i potwierdzana przez backend.
Wylogowanie czyści stan lokalnie od razu, a późne odpowiedzi poprzedniej sesji
są ignorowane. Testy automatyczne nie zastępują ręcznej weryfikacji prawdziwego
maila na web i na urządzeniach.
