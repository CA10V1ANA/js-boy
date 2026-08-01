# syntax=docker/dockerfile:1.7
# Vite 8 requires Node 20.19+ (or 22.12+). Alpine uses the musl native binding.
FROM node:22.12.0-alpine3.20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm can omit platform-specific optional packages when the lockfile was created
# on another operating system. Install the required Alpine binding explicitly.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=optional --no-audit --no-fund \
    && npm install --no-save --package-lock=false --no-audit --no-fund \
        @rolldown/binding-linux-x64-musl@1.1.5
COPY . .
ARG VITE_API_URL=http://localhost:8080
ARG VITE_BUSINESS_PHONE
ARG VITE_BUSINESS_WHATSAPP
ARG VITE_BUSINESS_EMAIL
ARG VITE_BUSINESS_CITY
ARG VITE_BUSINESS_INSTAGRAM
ARG VITE_BUSINESS_HOURS
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BUSINESS_PHONE=$VITE_BUSINESS_PHONE
ENV VITE_BUSINESS_WHATSAPP=$VITE_BUSINESS_WHATSAPP
ENV VITE_BUSINESS_EMAIL=$VITE_BUSINESS_EMAIL
ENV VITE_BUSINESS_CITY=$VITE_BUSINESS_CITY
ENV VITE_BUSINESS_INSTAGRAM=$VITE_BUSINESS_INSTAGRAM
ENV VITE_BUSINESS_HOURS=$VITE_BUSINESS_HOURS
RUN npm run build

FROM nginx:1.27.3-alpine3.20
# The master process deliberately runs without root privileges. Keep its PID in
# /tmp and write logs to standard streams, both writable by the nginx user.
RUN sed -i \
        -e '/^user /d' \
        -e 's#^[[:space:]]*pid[[:space:]].*;#pid /tmp/nginx.pid;#' \
        -e 's#^[[:space:]]*error_log[[:space:]].*;#error_log /dev/stderr notice;#' \
        -e 's#^[[:space:]]*access_log[[:space:]].*;#access_log /dev/stdout main;#' \
        /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/conf.d /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
