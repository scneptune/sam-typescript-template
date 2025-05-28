/* eslint-disable @typescript-eslint/ban-ts-comment */
const express = require('express');
const { create } = require('express-handlebars');
const { join } = require('path');
const { readdirSync, readFileSync } = require('fs');
const socketIO = require('socket.io');
const { createServer } = require('http');
const { watch } = require('chokidar');
const { SafeString } = require('handlebars');

const app = express();
const port = 9494;
const server = createServer(app);
const io = socketIO(server);

const hbs = create({
	helpers: {
		injectScript() {
			return new SafeString(
				`<script src="/socket.io/socket.io.js"></script>
         <script>
           const socket = io();
           socket.on('file-change', (data) => {
             console.log('File changed:', data);
             location.reload();
           });
         </script>`,
			);
		},
	},
	extname: '.hbs',
	defaultLayout: false,
	debug: true,
	runtimeOptions: {
		allowCallsToHelperMissing: false,
	},
});

// @ts-ignore
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', join(__dirname, '../src/email_templates/'));

// Socket.io for live reloading
io.on('connection', (socket) => {
	console.log('a user connected');
});

// Watch for file changes
watch('src/email_templates').on('all', (event, path) => {
	io.emit('file-change', { event, path });
});

// Dynamically list and serve all handlebars templates
app.get('/', (req, res) => {
	const templatesDir = join(__dirname, '../src/email_templates');
	const templates = readdirSync(templatesDir).filter((file) =>
		file.endsWith('.hbs'),
	);

	// Render a page with links to each template
	res.json({ templates });
});

app.get('/email/:name', (req, res) => {
	// load in dummy data from the json file with the same name as the template but with the postfix '-sample.json'
	const data = JSON.parse(
		readFileSync(
			join(__dirname, `../src/email_templates/${req.params.name}-sample.json`),
		),
	);

	res.render(req.params.name, data);
});

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
