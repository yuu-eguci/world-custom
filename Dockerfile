# syntax=docker/dockerfile:1

# 依存パッケージをインストールします。 dev サービスもこのステージを使います。
FROM node:26.13.1-trixie-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# src/ の TypeScript を js/active.js ・ js/map-active.js にビルドします。
FROM deps AS build
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src
RUN npm run build

# 静的ファイルだけを nginx で配信します。
FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
LABEL org.opencontainers.image.source="https://github.com/yuu-eguci/world-custom"
WORKDIR /usr/share/nginx/html
COPY *.html style.css favicon.ico ./
COPY css ./css
COPY fonts ./fonts
COPY img ./img
COPY vendor ./vendor
COPY js/bootstrap.min.js js/plugins.js js/popper.min.js ./js/
COPY js/jquery ./js/jquery
COPY --from=build /app/js/active.js /app/js/map-active.js ./js/
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=10 \
  CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/index.html"]

# Playwright で e2e テストを実行します。
FROM mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579 AS e2e
WORKDIR /app
RUN chown pwuser:pwuser /app
USER pwuser
COPY --chown=pwuser:pwuser package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY --chown=pwuser:pwuser tsconfig.json tsconfig.node.json playwright.config.ts ./
COPY --chown=pwuser:pwuser e2e ./e2e
CMD ["npm", "run", "e2e"]
