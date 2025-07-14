# Copyright (c) EZBLOCK INC. & AUTHORS
# SPDX-License-Identifier: BSD-3-Clause

.PHONY: build docker
RELEASE?=v2.0
VERSION:=$(shell git describe --tags --exact-match 2> /dev/null || \
				git rev-parse --short HEAD || echo "unknown")

dev:
	npm install
	npm run dev

version:
	node ./versionBuild.js  VERSION=${VERSION} RELEASE_TAG=${RELEASE_TAG}

build:
	node ./versionBuild.js  VERSION=${VERSION} RELEASE_TAG=${RELEASE_TAG}
	npm cache clean -f
	npm install
	npm run build

report:
	npm install
	npm run build --report

generate: supervisor-api manager-api headscale-api

supervisor-api:
	@echo "Generating supervisor api code"
	./openapi/scripts/client.sh                               \
		openapi/supervisor/openapi-2.0.yaml                   \
		src/clients/supervisor                                \
		supervisor                                            \
		1.0.0                                                 \
		typescript-axios                                      \
		--additional-properties=modelPropertyNaming=camelCase
	@echo "\033[0;32mGenerated supervisor api client successfully\033[0m"

manager-api:
	@echo "Generating manager api code"
	./openapi/scripts/client.sh                               \
		openapi/manager/openapi-3.0.yaml                      \
		src/clients/manager                                   \
		manager                                               \
		1.0.0                                                 \
		typescript-axios                                      \
		--additional-properties=modelPropertyNaming=camelCase
	@echo "\033[0;32mGenerated manager api client successfully\033[0m"

headscale-api:
	@echo "Generating headscale api code"
	./openapi/scripts/client.sh                                \
		openapi/manager/headscale.swagger.json                 \
		src/clients/headscale                                  \
		headscale                                              \
		1.0.0                                                  \
		typescript-axios                                       \
		--additional-properties=modelPropertyNaming=camelCase
	@echo "\033[0;32mGenerated headscale api client successfully\033[0m"

docker:
	docker build .                         \
		-f Dockerfile                      \
		--network host                     \
		--build-arg VERSION=${VERSION}     \
		--build-arg RELEASE_TAG=${RELEASE} \
		-t cylonix/cylonix-manager-ui:${VERSION}      \
		-t cylonix/cylonix-manager-ui:${RELEASE}      \
		-t cylonix/cylonix-manager-ui:latest
