# Lokalne usługi

Docker Compose uruchamia PostgreSQL 17 i backend Spring Boot (P0-I04).
Stos nie zawiera Kafki, Kubernetes ani mikroserwisów.

## Przygotowanie

1. Skopiuj szablon: `cp infra/compose/.env.example infra/compose/.env`
   (plik `.env` jest ignorowany przez Git).
2. Ustaw `SOBERITY_DB_PASSWORD` na wartość lokalną. Nie commituj jej.
3. Jeśli port 5432 jest zajęty, zmień `SOBERITY_POSTGRES_PORT`.

## Uruchomienie

```bash
docker compose -f infra/compose/compose.yml up -d --build
docker compose -f infra/compose/compose.yml ps
```

Backend nasłuchuje tylko na `127.0.0.1` pod portem losowym hosta; sprawdź go
poleceniem `docker compose -f infra/compose/compose.yml port backend 8080`.
Probes: `/actuator/health/liveness` i `/actuator/health/readiness`.

Wiele replik: `docker compose -f infra/compose/compose.yml up -d --scale backend=2`.

## Zatrzymanie

```bash
docker compose -f infra/compose/compose.yml down        # zachowuje dane
docker compose -f infra/compose/compose.yml down -v     # usuwa wolumen postgres-data
```

Wolumen `postgres-data` przechowuje wyłącznie dane PostgreSQL; kontener backendu
jest bezstanowy.
