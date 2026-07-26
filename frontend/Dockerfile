# syntax=docker/dockerfile:1.7
FROM node:20.18.1-alpine3.20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
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
RUN chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/conf.d /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/healthz || exit 1
