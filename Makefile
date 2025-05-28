.PHONY: build-all build-lambda-common build-lambdas watch-lambdas build-layers

BASE_ARTIFACTS_DIR = $(shell echo "$(ARTIFACTS_DIR)" | sed 's|\(.*/\.aws-sam/build\)/.*|\1|')

LAMBDA_FUNCTIONS := authenticatorFunction helloWorldFunction

build-all: $(addprefix build-,$(LAMBDA_FUNCTIONS))

build-lambda-common:
	NODE_ENV=production node scripts/build.js --baseArtifactsDir "$(BASE_ARTIFACTS_DIR)" --fnName $(FN_NAME) --handler $(HANDLER)

define lambda_target
build-$(1):
	@echo "Building function $(1)..."
	NODE_ENV=production node scripts/build.js --baseArtifactsDir "$(BASE_ARTIFACTS_DIR)" --fnName $(1) --handler "src/handlers/$(shell echo $(1) | sed 's/Function//').ts"
endef

$(foreach func,$(LAMBDA_FUNCTIONS),$(eval $(call lambda_target,$(func))))

build-lambdas:
	@echo "Building Lambda functions using esbuild..."
	mkdir -p "$(BASE_ARTIFACTS_DIR)"
	@echo "Building Lambda functions in $(BASE_ARTIFACTS_DIR)"
	NODE_ENV=production node scripts/build.js --baseArtifactsDir "$(BASE_ARTIFACTS_DIR)"

watch-lambdas:
	@echo "Watching Lambda functions using esbuild..."
	mkdir -p "$(BASE_ARTIFACTS_DIR)"
	NODE_ENV=development node scripts/watch.js --baseArtifactsDir "$(BASE_ARTIFACTS_DIR)"

build-RuntimeDependenciesLayer:
	@echo "Building RuntimeDependenciesLayer... $(BASE_ARTIFACTS_DIR)/nodejs"
	mkdir -p $(ARTIFACTS_DIR)/nodejs
	cp package.json package-lock.json $(ARTIFACTS_DIR)/nodejs
	npm ci --production --prefix $(ARTIFACTS_DIR)/nodejs
	# Optionally remove package files after install if not needed in the layer
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" "$(ARTIFACTS_DIR)/nodejs/package-lock.json"

build-layers: build-RuntimeDependenciesLayer


