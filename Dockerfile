# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite nhúng biến VITE_* vào bundle lúc build: đặt địa chỉ backend/Jaeger mà TRÌNH DUYỆT của
# người xem gọi được, vd docker compose build --build-arg VITE_API_BASE_URL=http://10.0.0.5:8000
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_JAEGER_URL=http://localhost:16686
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_JAEGER_URL=$VITE_JAEGER_URL
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
