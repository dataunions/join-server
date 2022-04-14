LANG = en_US.UTF-8
SHELL := /bin/bash
.SHELLFLAGS := --norc --noprofile -e -u -o pipefail -c
.DEFAULT_GOAL := test
#PATH := $(shell pwd)/node_modules/.bin:$(PATH)

nvm_brew = /usr/local/opt/nvm/nvm.sh
ifneq ("$(wildcard $(nvm_brew))", "")
	nvm_sh = $(nvm_brew)
endif
nvm_default = $(HOME)/.nvm/nvm.sh
ifneq ("$(wildcard $(nvm_default))", "")
	nvm_sh = $(nvm_default)
endif
node_version = $(shell cat .nvmrc)
define npm
	@$(eval args=$(1))
	bash -e -o pipefail -l -c "source $(nvm_sh) && nvm exec $(node_version) npm $(args)"
endef
define node
	@$(eval args=$(1))
	bash -e -o pipefail -l -c "source $(nvm_sh) && nvm exec $(node_version) node $(args)"
endef

node_modules: ## Run 'npm ci' if directory doesn't exist
	$(call npm, ci)

.PHONY: npm-ci
npm-ci: node_modules ## Run npm ci

.PHONY: npm-install
npm-install: ## Run npm install
	$(call npm, install)

.PHONY: npm-publish
npm-publish: ## Run npm publish
	$(call npm, publish . --access private)

.PHONY: npm-pack
npm-pack: ## Run npm pack
	$(call npm, pack)

.PHONY: npm-test
npm-test: node_modules ## Run npm test
	$(call npm, test)

NODE_BIN:=$(shell pwd)/node_modules/.bin
.PHONY: eslint
eslint: ## Run eslint
	$(call node, $(NODE_BIN)/eslint --config .eslintrc.js --ext .js .)

.PHONY: eslint-fix
eslint-fix: ## Run eslint with fix options
	$(call node, $(NODE_BIN)/eslint --config .eslintrc.js --ext .js --fix .)

.PHONY: test
test: ## Run all tests
	$(MAKE) -f Makefile test-unit

.PHONY: test-unit
test-unit: ## Run all unit tests
	$(call node, $(NODE_BIN)/mocha --recursive --check-leaks test)

DOCKER_NETWORK:=dujsnet
.PHONY: docker-setup
docker-setup: ## Setup Docker environment
	docker network create $(DOCKER_NETWORK)

.PHONY: docker-clean
docker-clean: ## Clean Docker environment
	docker network rm $(DOCKER_NETWORK)

MONGO_VERSION:=5.0.7-focal
MONGO_USERNAME:=root
MONGO_PASSWORD:=example
MONGO_DATABASE:=dujsdb
.PHONY: run-mongo
run-mongo: ## Run mongo
	-docker run \
		--interactive \
		--tty \
		--name mongo \
		--hostname mongo \
		--network $(DOCKER_NETWORK) \
		--rm \
		--env MONGO_INITDB_ROOT_USERNAME=$(MONGO_USERNAME) \
		--env MONGO_INITDB_ROOT_PASSWORD=$(MONGO_PASSWORD) \
		--env MONGO_INITDB_DATABASE=$(MONGO_DATABASE) \
		--publish 27017:27017/tcp \
		mongo:$(MONGO_VERSION)

.PHONY: run-mongo-cli
run-mongo-cli: ## Run mongo cli
	-docker run \
		--interactive \
		--tty \
		--name mongo-cli \
		--hostname mongo-cli \
		--network $(DOCKER_NETWORK) \
		--rm \
		mongo:$(MONGO_VERSION) \
		mongo \
		--host mongo \
        -u $(MONGO_USERNAME) \
        -p $(MONGO_PASSWORD) \
        --authenticationDatabase admin \
        $(MONGO_DATABASE)

.PHONY: run
run: export MONGODB_URI=mongodb://$(MONGO_USERNAME):$(MONGO_PASSWORD)@localhost:27017/
run: export HTTP_PORT=8787
run: export NODE_ENV=development
run: export LOG_LEVEL=trace
run: ## Run Data Union Join Server
	$(call node, src/cmd/duj-srv/main.js)

.PHONY: clean
clean: ## Remove generated files
	$(RM) -r \
		node_modules

.PHONY: help
help: ## Show Help
	@grep -E '^[a-zA-Z0-9_\-\/]+%?:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-20s %s\n", $$1, $$2}' | sort
