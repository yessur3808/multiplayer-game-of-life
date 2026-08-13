.DEFAULT_GOAL := help

NPM := npm
COMPOSE := docker compose

.PHONY: help install up up-detached down docker-build logs ps \
	test test-client test-server lint build build-client build-server check

help:
	@printf '%s\n' \
		'make install       Install client and server dependencies' \
		'make up            Build and run the complete Docker stack' \
		'make up-detached   Build and run the Docker stack in the background' \
		'make down          Stop and remove the Docker stack' \
		'make docker-build  Build both Docker images' \
		'make logs          Follow Docker service logs' \
		'make ps            Show Docker service status' \
		'make test          Run client and server tests' \
		'make test-client   Run client tests' \
		'make test-server   Run server tests' \
		'make lint          Lint the client' \
		'make build         Build the client and server' \
		'make check         Run all tests, lint, and builds'

install:
	$(NPM) --prefix server ci
	$(NPM) --prefix client ci

up:
	$(COMPOSE) up --build

up-detached:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

docker-build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs --follow

ps:
	$(COMPOSE) ps

test: test-server test-client

test-client:
	$(NPM) --prefix client test

test-server:
	$(NPM) --prefix server test

lint:
	$(NPM) --prefix client run lint

build: build-server build-client

build-client:
	$(NPM) --prefix client run build

build-server:
	$(NPM) --prefix server run build

check: test lint build

