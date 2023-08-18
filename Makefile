.PHONY: build-RuntimeDependenciesLayer build-lambda-common
.PHONY: build-helloWorldFunction | build-authenticatorFunction

build-authenticatorFunction:
	$(MAKE) FN_NAME=authenticatorFunction HANDLER=src/handlers/authenticator.ts build-lambda-common

build-helloWorldFunction:
	$(MAKE) FN_NAME=helloWorldFunction HANDLER=src/handlers/helloworld.ts build-lambda-common

build-lambda-common:
	node scripts/lambdaBuild.js --fnName ${FN_NAME} --handler ${HANDLER} --artifactsDir "$(ARTIFACTS_DIR)/" --cwd $(PWD)

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" # to avoid rebuilding when changes doesn't relate to dependencies


