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
		await rebuildLambda(filePath);
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

const MAX_RETRIES = 3; // Maximum number of retries per handler
const retryDelays = [1000, 10000, 30000]; // Delays between retries, in milliseconds

async function rebuildLambda(filePath) {
	let handlersQueue = handlers.map((handler) => ({ ...handler, retries: 0 }));

	do {
		const handler = handlersQueue.shift(); // Pop the first handler off the queue

		try {
			await execBuildLambda(handler.args);
			console.log(`🛠️ Successfully built ${handler.args.fnName}`);
		} catch (error) {
			console.error(`Error building ${handler.args.fnName}: ${error}`);
			if (handler.retries < MAX_RETRIES) {
				console.log(
					`Retrying ${handler.args.fnName} (Attempt ${
						handler.retries + 1
					} of ${MAX_RETRIES})`,
				);
				await new Promise((resolve) =>
					setTimeout(resolve, retryDelays[handler.retries]),
				); // Delay before retry
				handler.retries++;
				handlersQueue.push(handler); // Push the handler back onto the queue for retry
			} else {
				console.error(
					`Failed to build ${handler.args.fnName} after ${MAX_RETRIES} attempts`,
				);
			}
		}
	} while (handlersQueue.length > 0); // Continue while there are handlers in the queue
	console.log('\n \n 👍 All handlers rebuilt successfully 👍 \n \n');
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
