# Współdzielone pakiety

Prywatne szkielety TypeScript: `api-client`, `design-tokens`, `shared-utils`.
Każdy ma lint, typecheck i build. Puste moduły służą wyłącznie weryfikacji
konfiguracji kompilatora; nie eksportują atrap funkcji produktu.

Kontrakty API powstaną z OpenAPI, tokeny UI w P0-I03, a utils dopiero wraz
z rzeczywistym użyciem. Zależności między pakietami dodawać przez `workspace:*`.
