// scripts/watch.js
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { watchMode } = require('./esbuild.config');

// Define your Lambda functions (same as in build.js)
const functions = [
	{
		name: 'authenticatorFunction',
		handler: 'src/handlers/authenticator.ts',
	},
	{
		name: 'helloWorldFunction',
		handler: 'src/handlers/helloWorld.ts',
	},
];

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
	.option('baseArtifactsDir', {
		alias: 'd',
		description: 'The base directory for SAM build artifacts',
		type: 'string',
		demandOption: true,
	})
	.help()
	.alias('help', 'h').argv;

// --- Watch Mode Execution ---
async function main() {
	const baseArtifactsDir = path.resolve(argv.baseArtifactsDir);
	console.log(
		`Starting watch mode. Using base artifacts directory: ${baseArtifactsDir}`,
	);

	// Set NODE_ENV for esbuild config (usually development for watch)
	process.env.NODE_ENV = 'development';
	console.log(`Watch environment: ${process.env.NODE_ENV}`);

	try {
		await watchMode(functions, baseArtifactsDir);
		// watchMode contains an infinite promise, so this won't be reached unless it fails early.
	} catch (error) {
		console.error('❌ Failed to initialize watch mode:', error);
		process.exit(1);
	}
}

main();
