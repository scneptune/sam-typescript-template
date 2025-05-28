const { meta } = require('@typescript-eslint/parser');
const esbuild = require('esbuild');
const { copy, exists, mkdir } = require('fs-extra');
const path = require('node:path');

/**
 * Base esbuild configuration for Lambda functions.
 */
const baseBuildConfig = {
	bundle: true, // Bundle dependencies
	platform: 'node', // Target Node.js environment
	target: 'node18', // Specify Node.js 18 runtime
	format: 'cjs', // Output CommonJS modules
	minify: false, // Minify code in production
	packages: 'external', // Externalize packages
	metafile: true,
	sourcemap: true, // Generate source maps for debugging
	external: [
		'aws-sdk', // Provided by Lambda
		'@aws-sdk/*', // Provided by Lambda (v3 SDK)
	],
	logLevel: 'info', // Show build information
};

/**
 * Builds a single Lambda function.
 * @param {object} func - Function details { name, handler }
 * @param {string} baseArtifactsDir - The base directory for SAM build artifacts (e.g., .aws-sam/build)
 * @returns {Promise<esbuild.BuildResult>}
 */
async function buildFunction(func, baseArtifactsDir) {
	const { name: fnName, handler } = func;
	const outdir = path.join(baseArtifactsDir, fnName); // Output directly to the final SAM artifact directory
	const folderExists = await exists(outdir);
	if (!folderExists) {
		await mkdir(outdir, { recursive: true }); // Create the output directory if it doesn't exist
	}
	console.log(`Building ${fnName} from ${handler} to ${outdir}...`);

	// --- Special Handling: SamEmailsFunction Templates ---
	// If this is the SamEmailsFunction, copy its handlebars templates.
	if (fnName === 'SamEmailsFunction') {
		const templateSource = path.join(process.cwd(), 'src/email_templates');
		const templateDest = path.join(outdir, 'email_templates');
		try {
			console.log(
				`Copying email templates for ${fnName} to ${templateDest}...`,
			);
			await copy(templateSource, templateDest);
			console.log(`Successfully copied email templates for ${fnName}.`);
		} catch (error) {
			console.error(`Error copying email templates for ${fnName}:`, error);
			throw error; // Propagate error to stop the build
		}
	}
	// --- End Special Handling ---
	// Run esbuild
	return esbuild.build({
		...baseBuildConfig,
		entryPoints: [handler], // The entry point for the function
		outdir, // The output directory for this function
	});
}

/**
 * Builds all specified Lambda functions in parallel.
 * @param {Array<object>} functions - Array of function details [{ name, handler }]
 * @param {string} baseArtifactsDir - The base directory for SAM build artifacts
 * @returns {Promise<void>}
 */
async function buildAll(functions, baseArtifactsDir) {
	console.log(`Starting parallel build for ${functions.length} functions...`);
	const buildPromises = functions.map((func) =>
		buildFunction(func, baseArtifactsDir),
	);

	// Wait for all builds to complete
	await Promise.all(buildPromises);
	console.log('All functions built successfully.');
}

/**
 * Sets up watch mode for all specified functions for local development.
 * @param {Array<object>} functions - Array of function details [{ name, handler }]
 * @param {string} baseArtifactsDir - The base directory for SAM build artifacts
 * @returns {Promise<void>}
 */
async function watchMode(functions, baseArtifactsDir) {
	console.log(`Starting watch mode for ${functions.length} functions...`);

	for (const func of functions) {
		const { name: fnName, handler } = func;
		const outdir = path.join(baseArtifactsDir, fnName);

		// --- Special Handling for Watch Mode: Initial Template Copy ---
		// Ensure templates are copied initially when watch starts
		if (fnName === 'SamEmailsFunction') {
			const templateSource = path.join(process.cwd(), 'src/email_templates');
			const templateDest = path.join(outdir, 'email_templates');
			try {
				console.log(
					`Initial copy of email templates for ${fnName} in watch mode...`,
				);
				await copy(templateSource, templateDest, { overwrite: true }); // Overwrite ensures latest on start
			} catch (error) {
				console.error(
					`Error copying initial email templates for ${fnName}:`,
					error,
				);
				// Continue watching even if initial copy fails? Or throw? Let's log and continue.
			}
			// Note: This doesn't watch the template files themselves.
			// A more advanced setup could use 'chokidar' to watch templates and trigger copy/rebuild.
			// For simplicity, we copy initially. Re-running the watch command updates templates.
		}
		// --- End Special Handling ---

		try {
			// Create an esbuild context for incremental builds
			const ctx = await esbuild.context({
				...baseBuildConfig,
				entryPoints: [handler],
				outdir,
			});

			// Start the watcher
			await ctx.watch();
			console.log(`Watching ${fnName} (${handler})...`);
		} catch (error) {
			console.error(`Failed to start watch mode for ${fnName}:`, error);
			// Exit or continue with other watchers? Let's log and continue.
		}
	}

	console.log('Watch mode setup complete. Waiting for file changes...');
	// Keep the process running indefinitely for watch mode
	await new Promise(() => {});
}

module.exports = {
	buildFunction,
	buildAll,
	watchMode,
	// buildFunction is not exported as buildAll handles the loop
};
