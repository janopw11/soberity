# Menu Ocean — 2026-11-04

Wzorzec zaakceptowany przez właściciela: błękit ikon Home / Community.
Korekty: Science, Quizzes, Articles, Events, Brain Lab. Pozostałe ikony zachowują dostarczoną paletę.
Narzędzie: wbudowane image_gen (edycja istniejących PNG).

Prompt dla każdej ikony (image 1 = ikona docelowa; images 2–3 = Community i Home):

> Use case: precise-object-edit. Edit target: image 1 (menu icon). Images 2 and 3 are color reference only (Community and Home). Recolor image 1 to exactly the restrained ocean blue/teal gradient palette of references, approximately brighter #17A4CC to shadow #007EA5, not neon cyan, no purple. Keep original icon silhouette, recognizable internal symbols, white details and proportions, original layout and padding. Preserve subtle gradients and modeling but remove neon glows/noisy fringe. Transparent background, no backdrop rectangle, no added elements, no text. Single standalone icon, same visual weight as Community reference. Do not include the reference icons in output.

Oryginały zachowane. Nowe pliki aplikacji mają sufiks `ocean`. Runtime web/iOS/Android nieuruchamiany na polecenie właściciela.

## Ikony nagłówka: menu i profil

Dodatkowe cztery edycje: menu/profile × light/dark. Referencją dla każdej jest odpowiedni plik `soberity-logo-{light,dark}.png`. Pliki docelowe: `apps/consumer/assets/images/{menu,profile}-icon-ocean-{light,dark}.png`.

Prompt (podstawienie nazwy ikony i motywu):

> Use case: precise-object-edit. Image 1 is the edit target: menu/profile icon. Image 2 is the exact Soberity logo color reference for light/dark mode. Recolor ONLY the blue circular disc in image 1 to the restrained blue/cyan gradient of image 2, matching its brightness and saturation closely, without the excessively dark navy or bright neon patches of the original. Keep pure white three rounded hamburger bars / head and shoulders silhouette unchanged. Preserve the exact circular shape, proportions, symbol, layout and padding. Transparent outside the circular icon. No new elements, no glow, no text, no logo drawn inside the icon. Keep the white symbol fully opaque and crisp. Output one standalone icon.
