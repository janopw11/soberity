# Consumer — Expo web/iOS/Android

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

| Komenda po `pnpm --filter @soberity/consumer` | Działanie                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `web`                                         | Metro i przeglądarka                                                              |
| `ios`                                         | prebuild, CocoaPods, build i uruchomienie development client w Xcode Simulator    |
| `android`                                     | prebuild, Gradle, build i uruchomienie development client na Androidzie           |
| `start`                                       | Metro dla wcześniej zainstalowanego development client                            |
| `build`                                       | statyczny eksport web do `apps/consumer/dist`                                     |
| `export:native`                               | bundlowanie JS/assets iOS i Android do `dist/native`; nie tworzy IPA/APK          |
| `test:web`                                    | Firebase Auth emulator + Playwright Chromium desktop i mobile-web; serwer na 8091 |
| `test:unit`                                   | Jest (`jest-expo` + Testing Library) dla komponentów UI i `AuthStatusContext`     |

Najpierw `pnpm install --frozen-lockfile`. Testy web wymagają Docker Desktop i
pobranej przeglądarki: `pnpm --filter @soberity/consumer exec playwright install chromium`.
`pnpm --filter @soberity/consumer test:web` uruchamia lokalny emulator Firebase
Auth z projektem `demo-soberity` (bez połączenia z prawdziwym Firebase), a po
teście zatrzymuje go, jeśli uruchomił go sam skrypt. Testy używają stałych,
wyłącznie demonstracyjnych wartości klienta Firebase. API profilu jest
kontrolowanym fixture Playwright; backendowe migracje, weryfikacja tokenu i ACL
pozostają pokryte integracyjnymi testami Spring/Testcontainers. Nie jest
wymagany plik `.env`, konto dev ani dostarczenie prawdziwej wiadomości e-mail.
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

`EXPO_PUBLIC_API_URL` jest używany do weryfikacji sesji oraz operacji profilu i usuwania konta. Backend uruchom osobno; lokalny Compose przydziela losowy port hosta, odczytywany przez `docker compose -f infra/compose/compose.yml port backend 8080`. Wstaw ten port do konfiguracji klienta.

Expo Go i emulatory nie potwierdzają dostarczenia produkcyjnej wiadomości ani
allow-listy Firebase. Do pełnej weryfikacji potrzebny jest rzeczywisty projekt
dev Firebase, dostarczony e-mail oraz build web/natywny z deep linkiem.

| Klient lokalny      | Adres backendu (zastąp 8080 odczytanym portem)                               |
| ------------------- | ---------------------------------------------------------------------------- |
| Web na komputerze   | `http://localhost:8080` (backend musi dopuścić origin web przez CORS)        |
| iOS Simulator       | `http://localhost:8080`                                                      |
| Android Emulator    | `http://10.0.2.2:8080` (localhost wskazuje emulator)                         |
| Fizyczny telefon    | `http://ADRES_LAN_KOMPUTERA:8080`; ta sama sieć, firewall i nasłuch backendu |
| Staging / produkcja | publiczny adres HTTPS właściwego środowiska                                  |

Port API 8080 jest niezależny od Metro. Adres LAN nie może zawierać sekretów.
Nie umieszczaj poświadczeń w `EXPO_PUBLIC_*`. Dostęp HTTP na natywnych
urządzeniach wymaga osobnej weryfikacji konfiguracji transportu przy
podłączaniu API; testy web używające fixture API nie potwierdzają rzeczywistego połączenia z backendem.

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

## EAS development / preview (P0-I13)

`eas.json` zawiera development client i preview do dystrybucji wewnętrznej,
oraz osobne warianty iOS Simulator. Android otrzymuje APK. Profile nie
publikują do sklepów i nie uruchamiają EAS Update. Obecnie oba używają
`com.soberity.app.dev`, więc zastępują się na urządzeniu. Rozdzielenie
identyfikatorów i konfiguracja App/Universal Links wymaga własnej weryfikacji.

W katalogu `apps/consumer`, po utworzeniu przez właściciela projektu EAS:

```sh
eas login
eas init
```

Zapisz rzeczywiste `extra.eas.projectId`/owner dodane przez EAS. Nie wpisuj
fikcyjnego ID ani tokena do repo. Ustaw publiczne zmienne Firebase i API w
środowiskach EAS `development` oraz `preview`. Preview wymaga rzeczywistego
staging HTTPS oraz staging Firebase; nie ustawiaj w nim localhost, wartości
demo ani URL emulatora Auth. `.env` jest ignorowane; preview jawnie nie czyta
lokalnego dotenv. Sekrety serwisowe i signing keys zarządzane są poza repo. Hook `eas-build-pre-install` odrzuca preview bez kompletnej konfiguracji oraz HTTP/loopback API, demo Firebase i emulator Auth; nie weryfikuje istnienia projektu zdalnego.

Po przeglądzie zmian, commicie i odrębnej autoryzacji zdalnych buildów:

```sh
eas build --profile development-simulator --platform ios
eas build --profile development --platform android
eas build --profile preview-simulator --platform ios
eas build --profile preview --platform android
```

Dla fizycznego iPhone'a użyj `development` lub `preview` bez `-simulator`;
Apple wymaga odpowiedniego konta i podpisywania. Build chmurowy może zużywać
limity/środki, dlatego samo dodanie profili go nie uruchamia. Zapisz build IDs,
sprawdź instalację/launch oraz cały przepływ konta; bundle export nie jest
potwierdzeniem IPA/APK. Aktualne schematy profili:
[Expo EAS](https://docs.expo.dev/build/eas-json/),
[monorepo](https://docs.expo.dev/build-reference/build-with-monorepos/).

Wcześniejsze lokalne raporty i akceptacja właściciela P0-I12 są w
`docs/testing/phase-0-results.md`. Staging opisuje
[infra/staging/README.md](../../infra/staging/README.md).

## Editorial workspace (P1-I02)

`/editorial` is a web workspace for users with backend-managed AUTHOR or
REVIEWER grants. An entry appears in Account after editorial access is
confirmed; native clients show a web-only message. Role provisioning, workflow,
private API and isolated full-stack browser test setup are documented in
[EDITORIAL_API.md](../../backend/EDITORIAL_API.md).

The owner-approved blog editor update uses Tiptap, source links, dynamic categories and images; authors can publish directly or request review. Automatic translations are deferred. See [BLOG_EDITORIAL_API.md](../../backend/BLOG_EDITORIAL_API.md). The previous scientific workspace remains at `/editorial-evidence`.

### P1-I03 — Discover reading (implementation, not verified)

`/science` is a shared public route, available to guests and members. It has
separate catalogs for blog publications (`/api/v1/science/posts`), reviewed
science articles and Evidence cards. Reviewed catalogs use the selected EN/PL
locale and support topic filters and pagination. Blog content remains in its
original language; automatic translation is deferred.

Reading routes: `/science/post/{id}`, `/science/article/{id}` and
`/science/evidence/{id}`. The member Home latest section now reads published
blog posts rather than preview fixtures. Returning to a reading screen reloads
the public API so archived content is not retained as a local cached result.
The shared RN renderer reads canonical document JSON, never raw HTML; public
images use server media IDs, external links require HTTPS. Blog author/direct
publication and independent review have distinct labels. Structured Evidence
cards show certainty/rationale, scope, limitations, review dates and cited
source metadata (year/type/DOI/PMID). Plain blog source links do not imply a
structured scientific assessment.

No tests, lint, typecheck, builds, exports or runtime checks were run for this
iteration, at the owner's explicit request. Web/iOS/Android and accessibility
remain NOT VERIFIED. Manual entry: open `/science`, or use Science & Discover
in the menu; publish an article in `/editorial` to populate the blog catalog.
