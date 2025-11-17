# syntax=docker/dockerfile:1.6

###############################################
# Builder stage: install deps and compile app #
###############################################
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies separately for better caching
COPY package*.json ./
RUN npm ci

# Copy the remaining project files and build the static bundle
COPY . .
RUN npm run build

###############################################
# Runtime stage: serve static assets with Nginx #
###############################################
FROM nginx:1.27-alpine AS runtime

# Copy compiled Vite output into the default nginx directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
