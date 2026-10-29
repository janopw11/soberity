---
name: progress
description: Pokaż aktualny postęp wdrożenia Soberity na podstawie PHASES.md. Używaj, gdy użytkownik prosi o progress, status roadmapy, status iteracji i faz, co ukończono, co trwa lub co jest zablokowane. Odczyt wyłącznie; nie zmieniaj plików ani statusów.
---

# Soberity — Progress (tylko odczyt)

## Cel

Na prośbę użytkownika pokaż **wszystkie iteracje** Soberity pogrupowane po fazach z aktualnym statusem (`TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`) zapisanym w `PHASES.md`. Na początku pokaż liczby dla całego projektu i każdej fazy.

## Instrukcja

1. Zlokalizuj repozytorium i `PHASES.md`. Stan iteracji bierz **z poszczególnych sekcji `## P#-I##`**, nie z tabeli zbiorczej (może być nieaktualna). Nie wyciągaj statusów z samych checkboxów, kodu ani `CHANGELOG.md`.
2. Uruchom skrypt dołączony do tego skilla (standardowy Python, bez zależności):

   ```bash
   python3 .agents/skills/progress/scripts/report_progress.py
   ```

   Jeśli Codex pracuje z podkatalogu, użyj bezwzględnej ścieżki do skryptu lub przejdź do root repozytorium. Skrypt odszuka `PHASES.md` idąc w górę od bieżącego katalogu. Możesz przekazać `--file /path/to/PHASES.md`.
3. W odpowiedzi pokaż **pełny wynik raportu**: podsumowanie faz, a niżej wszystkie iteracje w kolejności `P0-I00 ... P9-I06`. Nie ucinaj iteracji `TODO` tylko dlatego, że jest ich dużo. Jeśli użytkownik poprosi wyłącznie o podsumowanie, dodaj `--summary`.
4. Dodatkowe możliwości: `--phase 0` dla szczegółów jednej fazy, `--status BLOCKED` lub `--status IN_PROGRESS` do filtrowania, `--json` dla danych maszynowych. Nie filtruj domyślnie.
5. Tłumacz statusy: `TODO` → **TODO**; `IN_PROGRESS` → **W TOKU**; `BLOCKED` → **ZABLOKOWANA**; `DONE` → **WYKONANA**. Gdy status jest nieznany albo niezgodny z innymi zapisami, zgłoś to zamiast zgadywać.
6. Podkreśl, że raport pokazuje **stan zapisany w dokumentacji**, nie niezależne potwierdzenie wykonania. Nie deklaruj, że faza została zamknięta tylko dlatego, że wszystkie iteracje mają `DONE` — zamknięcie fazy wymaga osobnego Gate/akceptacji.
7. **Nie edytuj** `PHASES.md`, `AGENTS.md`, `CHANGELOG.md` ani innych plików. Nie rozpoczynaj implementacji ani testów aplikacji w ramach tego skilla.

## Przykłady wywołań w Codex

- `$progress` — pełna lista iteracji i ich statusów.
- `$progress pokaż tylko Phase 0` — szczegóły fazy 0.
- `$progress pokaż tylko zablokowane iteracje` — tylko `BLOCKED`.

W obecnym Codex skille można wybrać przez `/skills` lub wywołać przez `$progress`. Dosłowne `/progress` nie jest repozytoryjnym skrótem do skilla.
