# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Gunakan npm install agar dependensi biner (Rollup & ESBuild) terinstal sesuai arsitektur Linux ARM64 (aarch64)
RUN npm install

COPY . .

# Build Vite SPA
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
