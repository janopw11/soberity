# syntax=docker/dockerfile:1

FROM maven:3.9.16-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn --batch-mode -q dependency:go-offline
COPY src ./src
RUN mvn --batch-mode -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN groupadd --system soberity && useradd --system --gid soberity --no-create-home soberity
WORKDIR /app
COPY --from=build /workspace/target/soberity-backend.jar /app/soberity-backend.jar
USER soberity
EXPOSE 8080
# No default profile: the environment must select one (local, staging or production).
ENTRYPOINT ["java", "-jar", "/app/soberity-backend.jar"]
