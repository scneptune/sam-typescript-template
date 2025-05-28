/**
 * You should only need this once, whenever we get new email assets from marketing they use Freemarker,
 * this does a cleanup pass to remove the Freemarker syntax and convert to Handlebars which AWS SES likes.
 */

const fs = require('fs/promises');
const path = require('path'); // Include the 'path' module for file path operations
const prettier = require('prettier');

// Convert Freemarker syntax to Handlebars syntax
function convertFreemarkerToHandlebars(freemarkerTemplate) {
	let handlebarsTemplate = freemarkerTemplate;

	// Replace Freemarker comments
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#--(.*?)--\]/gs,
		'{{!--$1--}}',
	);

	handlebarsTemplate = handlebarsTemplate.replace(
		/\[@trackurl[^\]]*\](.*?)\[\/\@trackurl\]/gs,
		'$1',
	);

	// Replace Freemarker settings
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#setting(.*?)\]/g,
		'{{!-- Setting: $1 --}}',
	);

	// Replace Freemarker assignments
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#assign(.*?)\]\[\/\#assign\]/g,
		'{{!-- Assign: $1 --}}',
	);

	// Replace Freemarker contentmap
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#contentmap(.*?)\]/g,
		'{{!-- Contentmap: $1 --}}',
	);

	// Replace Freemarker if conditions
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#if(.*?)\]/g,
		'{{#if $1}}',
	);
	handlebarsTemplate = handlebarsTemplate.replace(/\[\#else\]/g, '{{else}}');
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[\#elseif(.*?)\]/g,
		'{{else if $1}}',
	);
	// Fix for closing Freemarker if statements
	handlebarsTemplate = handlebarsTemplate.replace(/\[\/\#if\]/g, '{{/if}}');

	// Replace Freemarker variables
	handlebarsTemplate = handlebarsTemplate.replace(/\$\{(.*?)\}/g, '{{ $1 }}');

	// Replace custom function @trackurl
	handlebarsTemplate = handlebarsTemplate.replace(
		/\[@trackurl(.*?)\]\[\/\@trackurl\]/g,
		'{{trackurl $1}}',
	);

	return handlebarsTemplate;
}

function prettifyHandlebarsTemplate(handlebarsTemplate) {
	return prettier.format(handlebarsTemplate, {
		parser: 'html',
		plugins: [require('prettier/parser-html')],
		htmlWhitespaceSensitivity: 'ignore',
	});
}

// Main function to handle file processing
async function main() {
	const inputFilePath = process.argv[2]; // Get input file path from command line

	if (!inputFilePath) {
		console.error('Please provide an input file path.');
		process.exit(1);
	}

	try {
		// Read input file
		const freemarkerTemplate = await fs.readFile(inputFilePath, 'utf8');
		// Convert
		const handlebarsTemplate =
			convertFreemarkerToHandlebars(freemarkerTemplate);
		const prettyTemplate = prettifyHandlebarsTemplate(handlebarsTemplate);
		// Generate output file path with .hbs extension
		const outputFilePath = inputFilePath.replace(/\.[^/.]+$/, '.hbs');

		// Write the converted content to the output file
		await fs.writeFile(outputFilePath, prettyTemplate);
		console.log(`Converted file saved as: ${outputFilePath}`);
	} catch (error) {
		console.error('Error:', error.message);
	}
}

main();
