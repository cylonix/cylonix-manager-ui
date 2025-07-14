# Copyright (c) EZBLOCK INC. & AUTHORS
# SPDX-License-Identifier: BSD-3-Clause

# build stage
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# autorun scripts goes to /docker-entrypoint.d
COPY entrypoint.sh /docker-entrypoint.d
COPY lb.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]