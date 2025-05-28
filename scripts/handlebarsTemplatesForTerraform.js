const fs = require('fs/promises');
const cheerio = require('cheerio');

async function parseHtmlToText(htmlContent) {
	const cherioParse = cheerio.load(htmlContent);
	return cherioParse('body').text().trim().replace(/\s\s+/g, ' ');
}

async function processTemplate(templateName, destination, outputType) {
	const htmlContent = await fs.readFile(templateName, 'utf8');
	const textPart = await parseHtmlToText(htmlContent);

	if (outputType === 'json') {
		const jsonContent = JSON.parse(await fs.readFile(destination, 'utf8'));
		jsonContent.Template = {
			...jsonContent.Template,
			HtmlPart: htmlContent,
			TextPart: textPart,
		};
		await fs.writeFile(destination, JSON.stringify(jsonContent, null, 4));
	} else {
		await fs.writeFile(`${destination}.html`, htmlContent);
		await fs.writeFile(`${destination}.txt`, textPart);
	}
}

async function main() {
	if (process.argv.length !== 5) {
		console.log(
			'Usage: node script.js <template_file> <destination> <output_type>',
		);
		process.exit(1);
	}

	const templateFile = process.argv[2];
	const destination = process.argv[3];
	const outputType = process.argv[4]; // Either 'json' or 'files'

	await processTemplate(templateFile, destination, outputType);
}

main();
