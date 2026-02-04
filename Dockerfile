# Copyright (c) EZBLOCK INC. & AUTHORS
# SPDX-License-Identifier: BSD-3-Clause

# build stage
FROM node:24.13.0 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# auto-run scripts goes to /docker-entrypoint.d
COPY entrypoint.sh /docker-entrypoint.d
COPY lb.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]