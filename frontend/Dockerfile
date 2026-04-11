# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

COPY . .
RUN npm run build

# Production stage — serve static files with nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback — all routes serve index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
