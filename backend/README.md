# Backend

P0-I01 przygotowuje Maven Wrapper 3.9.16 oraz POM sprawdzający Java 21
i wersję Maven. `./mvnw --batch-mode verify` waliduje szkielet narzędziowy;
`packaging=pom` oznacza, że nie powstaje JAR i nie ma jeszcze testów Java.

P0-I04 doda Spring Boot 4.1.2, kod, moduły, PostgreSQL, Flyway i testy.
Zaakceptowany zestaw to Java 21, springdoc 3.2.0 i JUnit 6 zarządzany przez
BOM Boot. Nie ma endpointów, usługi ani polecenia uruchamiającego serwer.

`./mvnw` wymaga JDK 21 oraz curl lub wget i unzip przy pierwszym pobraniu.
Maven pobierany jest z Maven Central, z weryfikacją SHA-256 dystrybucji.
Na Windows dostępny jest `mvnw.cmd`; nie został przetestowany na Windows.
