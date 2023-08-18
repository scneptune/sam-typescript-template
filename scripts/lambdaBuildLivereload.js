const chokidar = require('chokidar');
const { exec: execCb } = require('child_process');
const util = require('util');
const path = require('path');

const execAsync = util.promisify(execCb);

const functionHandlerMapping = {
	authenticatorFunction: 'src/handlers/authenticator.ts',
	helloWorldFunction: 'src/handlers/helloworld.ts',
};

const handlers = Object.entries(functionHandlerMapping).map(
	([fnName, handler]) => {
		const relativeCWD = path.join(__dirname, '../');
		return {
			path: handler,
			args: {
				fnName,
				handler,
				artifactsDir: path.resolve(relativeCWD, `.aws-sam/build/${fnName}`),
				cwd: path.resolve(relativeCWD),
			},
		};
	},
);

// Initialize watcher
const watcher = chokidar.watch('src/**/*', {
	ignored: /(^|[\/\\])\../, // ignore dotfiles
	persistent: true,
});

watcher.on('ready', () => {
	console.log(
		`👓 Watching for files in [${handlers
			.map((handler) => handler.path)
			.join(', ')}] and src/**/* 👓`,
	);
});

watcher.on('change', async (filePath) => {
	try {
		await formatFile(filePath);
		await lintFile(filePath);
		await buildLambda(filePath);
	} catch (error) {
		console.error(`Error occurred: ⛔️ ${error.message}`);
	}
});

async function formatFile(filePath) {
	const { stdout } = await execAsync(
		`prettier --config .prettierrc --write ${filePath}`,
	);
	console.log(`📝 Formatted: ✅ ${filePath}`);
	return stdout;
}

async function lintFile(filePath) {
	const { stdout } = await execAsync(`eslint --quiet --fix ${filePath}`);
	console.log(`📝 Linted: ✅  ${filePath}`);
	return stdout;
}

async function buildLambda(filePath) {
	if (filePath.startsWith('src/handlers')) {
		const handler = handlers.find((handler) => handler.path === filePath);
		if (handler) {
			console.log(
				`🛠️ ▶️ Handler file ${filePath} changed, running build-lambda.js for ${handler.args.fnName}`,
			);
			return execBuildLambda(handler.args);
		}
	} else {
		console.log(
			`🛠️ 🔁 Non-handler file ${filePath} changed, running build-lambda.js for all functions`,
		);
		for (const handler of handlers) {
			await execBuildLambda(handler.args);
		}
	}
}

async function execBuildLambda(args) {
	let argsString = Object.entries(args)
		.map(([key, value]) => `--${key}='${value}'`)
		.join(' ');
	console.info(argsString, 'argsString');
	const { stdout } = await execAsync(
		`node scripts/lambdaBuild.js ${argsString}`,
	);

	console.log(`🛠️ Build Lambda STDOUT: ${stdout}`);
	return stdout;
}

// Path: lambdaBuild.js
