const fs = require('node:fs/promises');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

async function buildLambda(fnName, handler, artifactsDir, cwd = __dirname) {
	const distDir = path.join(cwd, 'dist', fnName);
	// Install node modules if not present
	try {
		await fs.access('node_modules');
		await fs.access('node_modules/.bin');
		console.info("INFO: ✅ node_modules found, skipping 'npm ci'");
	} catch (err) {
		await execAsync('npm ci --cache ~/.npm --prefer-offline');
		console.info("INFO: 🛠️ node_modules installed via 'npm ci'");
	}

	try {
		await fs.access(distDir);
		await fs.rm(distDir, { recursive: true });
		console.info(`INFO: 🗑️ Deleted function dist directory at '${distDir}'`);
	} catch {
		console.info(`INFO: No existing function dist directory at '${distDir}'`);
	}
	// Create dist directory for the function
	await fs.mkdir(distDir, { recursive: true });
	console.info(`INFO: 🏗️ Recreated function dist directory at '${distDir}'`);

	// Write tsconfig file for the function

	const initialTsConfigFilePath = path.resolve(cwd, 'tsconfig.json');
	const handlerPathInclude = path.resolve(cwd, handler);
	const tsconfigContent = JSON.stringify(
		{
			extends: initialTsConfigFilePath,
			include: [handlerPathInclude],
			compilerOptions: {
				outDir: distDir,
			},
		},
		null,
		2,
	);
	const tsconfigPath = path.join(distDir, 'tsconfig-only-handler.json');
	await fs.writeFile(tsconfigPath, tsconfigContent);
	await fs.chmod(tsconfigPath, 0o777);
	console.info(
		`INFO: ⚙️ Created tsconfig file for function at '${tsconfigPath}'`,
	);

	const tscPath = path.join(cwd, 'node_modules', '.bin', 'tsc');
	// Run tsc to compile the function
	await execAsync(`npx ${tscPath} --build ${tsconfigPath}`);
	console.info(`INFO: 📦 Compiled function at '${distDir}'`);
	// Delete the tsconfig file
	try {
		await fs.access(tsconfigPath);
		await fs.unlink(tsconfigPath);
	} catch {
		console.info(
			`INFO: 🗑️ No tsconfig file found at '${path.join(
				distDir,
				'tsconfig-only-handler.json',
			)}'`,
		);
	}

	// Copy the output to the artifacts directory
	try {
		await fs.access(artifactsDir);
		await fs.rm(artifactsDir, { recursive: true });
		console.info(
			`INFO: 🗑️ Cleaned out existing artifacts directory at '${artifactsDir}'`,
		);
	} catch {
		console.info(`INFO: No existing artifacts directory at '${artifactsDir}'`);
	}
	await fs.mkdir(artifactsDir, { recursive: true });
	console.info(`INFO: 🏗️ Recreated artifacts directory at '${artifactsDir}'`);
	await execAsync(`cp -r ${distDir}/* ${artifactsDir}`);
	console.info(
		`INFO: 👯 Copied function to artifacts directory at '${artifactsDir}'`,
	);
	console.info(`SUCCESS: 🎆 Finished building function '${fnName}'`);
}

// Parse command line arguments
// Get the command line arguments
let args = process.argv.slice(2);
// Create an object to store the arguments
let argv = {};

// Loop over the arguments
for (let i = 0; i < args.length; i++) {
	// The argument name is the first element (remove '--' or '-')
	let argName = args[i].startsWith('--') ? args[i].slice(2) : args[i].slice(1);

	// Split on '=' if it exists, otherwise use the next argument as the value
	let splitIndex = argName.indexOf('=');
	let argValue = null;

	if (splitIndex !== -1) {
		argValue = argName.slice(splitIndex + 1);
		argName = argName.slice(0, splitIndex);
	} else if (args[i + 1] && !args[i + 1].startsWith('-')) {
		argValue = args[++i];
	}

	if (
		(argValue && argValue.startsWith('"') && argValue.endsWith('"')) ||
		(argValue.startsWith("'") && argValue.endsWith("'"))
	) {
		argValue = argValue.slice(1, -1);
	}

	// Add to the object
	argv[argName] = argValue;
}

// Check for 'help' flag
argv.fnName = argv.fnName || argv.fn;
argv.handler = argv.handler || argv.h;
argv.artifactsDir = argv.artifactsDir || argv.a;
argv.cwd = argv.cwd || argv.c;

if (
	[argv.fnName, argv.handler, argv.artifactsDir].some(
		(argValue) => argValue === undefined,
	)
) {
	console.error(
		'⛔️ Missing required arguments. Usage: node build-lambda.js --fnName=NAME --handler=HANDLER --artifactsDir=DIR',
	);
	argv.help = true;
}
// Check for 'help' flag
if (argv.help) {
	console.log(`
    Usage: node build-lambda.js [options]

    Options:
      --fnName, -fn    Name of the function to build
      --handler, -h    Path to the handler function
      --artifactsDir, -a  Path to the artifacts directory
      --cwd, -c  Path to the current working directory
  `);
	process.exit(0);
}

// Now you can use argv.fnName, argv.handler, and argv.artifactsDir

Promise.resolve(
	buildLambda(argv.fnName, argv.handler, argv.artifactsDir, argv.cwd).catch(
		(err) => {
			console.error('❌ An error occurred:', err);
			process.exit(1);
		},
	),
);
