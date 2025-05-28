// scripts/build.js
// @ts-expect-error @typescript-eslint/no-var-requires
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { buildAll, buildFunction } = require('./esbuild.js');

// Define your Lambda functions here
// Ensure 'handler' paths are relative to the project root
const functions = [
	{
		name: 'authenticatorFunction',
		handler: 'src/handlers/authenticator.ts',
	},
	{
		name: 'helloWorldFunction',
		handler: 'src/handlers/helloworld.ts',
	},
];

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
	.option('baseArtifactsDir', {
		alias: 'd',
		description: 'The base directory for SAM build artifacts',
		type: 'string',
		demandOption: true, // Require this argument
	})
	.option('handler', {
		alias: 'h',
		description: 'Path to the handler function',
		type: 'string',
		demandOption: false, // Require this argument
	})
	.option('fnName', {
		alias: 'fn',
		description: 'Name of the function to build',
		type: 'string',
		demandOption: false, // Require this argument
	})
	.help()
	.alias('help', 'h').argv;

// --- Build Execution ---
async function main() {
	const baseArtifactsDir = path.resolve(argv.baseArtifactsDir); // Ensure absolute path
	console.log(`Using base artifacts directory: ${baseArtifactsDir}`);

	// Set NODE_ENV for esbuild config (minify, etc.)
	if (!process.env.NODE_ENV) {
		console.warn('NODE_ENV not set, defaulting to development.');
		process.env.NODE_ENV = 'development';
	}
	console.log(`Build environment: ${process.env.NODE_ENV}`);

	console.time('Total Build Time'); // Start timer

	try {
		if (!argv.fnName && !argv.handler) {
			// Build all functions if no specific function is specified
			console.log('Building all functions...');
			await buildAll(functions, baseArtifactsDir);
		} else {
			console.log(
				`Building function ${argv.fnName} with handler ${argv.handler}...`,
			);
			if (!argv.handler && argv.fnName) {
				// If only function name is provided, find the corresponding handler
				const func = functions.find((f) => f.name === argv.fnName);
				console.info(
					`Function found: ${JSON.stringify(func)}`,
					argv.fnName,
					argv.handler,
				);
				if (!func) {
					throw new Error(`Function ${argv.fnName} not found.`);
				}
				argv.handler = func.handler; // Set the handler from the function list
			}
			await buildFunction(
				{
					name: argv.fnName,
					handler: argv.handler,
				},
				baseArtifactsDir,
			);
			console.log(
				`Built function ${argv.fnName} with handler ${argv.handler}.`,
			);
		}
		console.timeEnd('Total Build Time'); // End timer
		console.log('✅ Build process completed successfully.');
		process.exit(0); // Success
	} catch (error) {
		console.timeEnd('Total Build Time'); // End timer even on failure
		console.error('❌ Build process failed:', error);
		process.exit(1); // Failure
	}
}

main();
