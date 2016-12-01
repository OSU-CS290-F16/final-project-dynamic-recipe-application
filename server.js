"use strict";

// Imports
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const mysqlx = require('@mysql/xdevapi');
const url = require('url');
const path = require('path');

const templates = {
	"404": `
<html>
	<head><title>404 - Not found</title></head>
	<body>
		<h1>The file you were looking for wasn't found, sorry.</h1>
	</body>
</html>
`
}

// Store any session information in the form:
//   (session key): {session data}
const sessions = {};

// Port to listen on
const PORT = process.env.port || 80;

// Create our server.
let server = new http.Server();
server.on('request', (req, res) => {
	// Handle all of the url patterns and paramaters
	//  - Static folders
	let staticFiles = /(\/static\/.+)|(\/js\/.+)|(\/css\/.+)/g;
	let file = false;
	if (req.method.toUpperCase() == "GET" && (file = url.parse(req.url).pathname.match(staticFiles))) {
		file = file[0];
		// path.normalize will hopefully make it so that people can't request files outside of the static directories.
		let fileAbsolute = process.cwd() + path.normalize(file);
		if (fs.existsSync(fileAbsolute)) {
			let fileHandle = fs.createReadStream(fileAbsolute);
			fileHandle.on('open', () => {
				fileHandle.pipe(res);
			});
		} else {
			res.writeHead(404, "Not Found", {});
			res.end(templates["404"])
		}
	} else {
		res.writeHead(404, "Not Found", {});
		res.end(templates["404"])
	}
});


// Activate the server
server.listen(PORT)
