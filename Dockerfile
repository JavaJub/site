# Build the static Astro site, then serve it with Caddy (TLS + /api reverse proxy).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# PUBLIC_API_BASE stays empty → the site calls same-origin /api (proxied by Caddy).
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
