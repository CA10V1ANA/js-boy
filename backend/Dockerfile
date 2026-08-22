# syntax=docker/dockerfile:1.7
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml ./
RUN --mount=type=cache,id=jsboy-backend-maven,target=/root/.m2 \
    mvn -B -ntp -DskipTests dependency:go-offline
COPY src ./src
RUN --mount=type=cache,id=jsboy-backend-maven,target=/root/.m2 \
    mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre-alpine
ARG APP_UID=10001
ARG APP_GID=10001

RUN apk add --no-cache su-exec \
    && addgroup -S -g "${APP_GID}" jsboy \
    && adduser -S -D -H -u "${APP_UID}" -G jsboy jsboy \
    && mkdir -p /var/lib/jsboy/proofs \
    && chown -R jsboy:jsboy /var/lib/jsboy

WORKDIR /app
COPY --from=build --chown=jsboy:jsboy /workspace/target/js-boy-api-*.jar app.jar
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER jsboy
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD wget --quiet --tries=1 --header="X-Forwarded-Proto: https" --spider http://localhost:8080/api/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
