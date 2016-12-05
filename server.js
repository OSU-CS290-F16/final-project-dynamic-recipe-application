"use strict";

// Imports
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const mysqlx = require('@mysql/xdevapi');
const url = require('url');
const path = require('path');

// Where we will store our connection to MySQL
let dbSession, schema;

// Setup the tables
const tables = {};

// Store any session information in the form:
//   (session key): {session data}
const sessions = {};

// Handy dandy little session functions
function userData(request) {
	let cookies = parseCookies(request);
	if (cookies && sessions.keys().includes(cookie["session"])) {
		return sessions[cookie["session"]];
	} else {
		return false;
	}
}
function isLoggedIn(request) {
	userData() ? true : false;
}
function parseCookies(request) {
	if (Object.keys(request.headers).map(key => key.toLowerCase()).includes('cookie')) {
		let cookiesText = request.headers[Object.keys(request.headers).find(item => item.toLowerCase() == "cookie")];
		let cookies = {};
		console.log(cookiesText);
		cookiesText.split(';').forEach(cookieText => {
			console.log(cookieText);
			let [cookieName, cookieValue] = cookieText.split('=');
			cookies[decodeURIComponent(cookieName)] = decodeURIComponent(cookieValue);
		});
		return cookies;
	} else {
		return false;
	}
}
function loggoutUser(request, res) {
	let cookies = parseCookies(request);
	if (cookies && cookies.session) {
		delete sessions[cookies.session];
	}
}
function loginUser(req, res) {
	return new Promise((resolve, reject) => {
		getPostData(req, postData => {
			if (postData.email) {
				tables["users"].select(['userid', 'email', 'password', 'pass_salt']).where(`email = ${postData}`).execute().then(result => {
					console.log(result);
				});
			} else {
				loginDocument(res, "No Email Entered.")
			}
		});
	});
}


// Port to listen on
const PORT = process.env.port || 80;

// Handle displaying common errors.
function errorDocument(response, error) {
	switch(error) {
		case 404:
		default:
		response.writeHead(404, "Not Foud", {});
		response.end(
`<html>
	<head>
		<title>404 - Not found</title>
	</head>
	<body>
	<h1>The file you were looking for wasn't found, sorry.</h1>
	</body>
</html>`
		);
	}
}
// Create a login page
function loginDocument(response, error = false) {
	if (error) {
		response.writeHead(403, error, {});
	} else {
		response.writeHead(200, 'All good', {});
	}
	response.end(
`<html>
	<head>
		<title>Recipe Box - Login</title>
	</head>
	<body>
		<form action="/login/" method="post">
			${ error ? '<p>' + error + '</p>' : ''}
			<h2>Login:</h2>
			<label>Email: <input name="email" type="text" /></label>
			<label>Password: <input name="password" type="password" /></label>
			<input type="submit" value="Login" />
		</form>
	</body>
</html>`
	);
}
function indexDocument(response, error = false){
	if(error){
		response.writeHead(403, error, {});	
	} else {
		response.writeHead(200, 'All good', {});
	}
	response.end(
	`<html>

<head>

  <meta charset="utf-8">
  <title>Dynamic Recipe Application</title>

  <!-- This is a 3rd-party stylesheet for Font Awesome: http://fontawesome.io/ -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css" media="screen">

  <!-- Latest compiled and minified CSS -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">


  <link rel="stylesheet" href="style.css" media="screen">

</head>

<body>

  <header>

    <!-- The <i> tag below includes the sticky note icon from Font Awesome -->
    <h1><a href="/"><i class="Header"></i> Dynamic Recipe Application</a></h1>

    <nav>
      <ul class="navbar-list">
        <li class="navbar-item"><a href="index.html">Home</a></li>
        <li class="navbar-item"><a href="add-recipe.html">Add Recipe</a></li>
        <li class="navbar-item navbar-right"><a href="#">Maybe Something else</a></li>
      </ul>
    </nav>

  </header>

  <main>



    <div class="Recipe">
      <h1>Recipe Name</h1>
      <p>
        Ingrediant Number 1
      </p>
      <p>
        Ingrediant Numbe 2
      </p>
      <p>
        AIngrediant Numbe 3
      </p>
      <p>
        AIngrediant Numbe 4
      </p>
      <p>
        Instruction
      </p>
    </div>

  </main>


  <footer>
    <div class="copyright">
      Copyright &copy; 2016 Oregon State Univeristy CS 290
    </div>
  </footer>

</body>


<script src="http://code.jquery.com/jquery-3.1.1.min.js" integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8=" crossorigin="anonymous"></script>

<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>

<script src="index.js"></script>

</html>`
	);
}
function addRecipePage(response, error = false ){
	
}
// Helper to read a stream into a string
function stream2str(stream, callback) {
	let str = "";
	stream.on('data', (chunk) => {
		str += chunk;
	});
	stream.on('end', () => {
		callback(str);
	});
}

// Function to get HTTP POST data out of a request
function getPostData(req, callback) {
	stream2str(req, str => {
		let entries = str.split('&');
		let data = {};
		entries.forEach(entry => {
			let [key, value] = entry.split('=');
			key = decodeURIComponent(key);
			value = decodeURIComponent(value);
			data[key] = value;
		});
		callback(data);
	});
}

// This is a bit like Express routing, except that it has no dependencies.
// The order here matters.
let patterns = [
	{
		// Static Files
		methods: ["get"],
		regex: [
			/(\/static\/)(.+)*/,
			/(\/js\/)(.+)*/,
			/(\/css\/)(.+)*/,
		],
		handler: function(req, res, params) {
			let [match, folder, file] = params;
			// path.normalize will hopefully make it so that people can't request files outside of the static directories.
			let fileAbsolute = process.cwd() + path.normalize(folder + file);
			if (fs.existsSync(fileAbsolute)) {
				let fileHandle = fs.createReadStream(fileAbsolute);
				fileHandle.on('open', () => {
					fileHandle.pipe(res);
				});
			} else {
				errorDocument(res, 404);
			}
		}
	},
	{
		// Recipe pages
		methods: ["get"],
		regex: [
			/\/recipes\/(.+)*/
		],
		handler: function(req, res, params) {

		}
	},
	{
		// Rest Api endpoint
		methods: ["get", "post", "put", "delete"],
		regex: [
			/\/api\/recipes\/(.+)/ // No camptures because we will be parsing it ourselves in the handler.
		],
		handler: function(req, res, params) {
			// Decrease the number of toLowerCase() statements
			req.method = req.method.toLowerCase();

			if (req.method == "get") {

			} else if (req.method == "post") {

			} else if (req.method == "put") {

			} else { // Method = delete

			}
		}
	},
	{
		// Login Page
		// methods: ["post", "get"],
		regex: [
			/\/login\//
		],
		handler: function(req, res, params) {
			let reqUrl = url.parse(req.url, true); // true=Parse query parameters
			if (reqUrl.query["logout"]) {
				sessionLogout(req);
			} else if (req.method.toLowerCase() == "post") {
				loginUser(req, res);
			} else {
				loginDocument(res);
			}
		}
	},
	{
		// Main Application Page
		methods: ["get"],
		regex: [
			/\//
		],
		handler: function(req, res, params) {
			res.writeHead(200, "We're good", {});
			res.end(
`
<h1>We all good!</h1>
`
			);
		}
	}
];

// Create our server.
let server = new http.Server();
server.on('request', (req, res) => {

	let reqUrl = url.parse(req.url);

	console.log(`New Request for ${req.url}`);

	for (let endpoint of patterns) {
		// skip if the method isn't correct
		if (endpoint.methods && !endpoint.methods.some(method => {
			return method.toLowerCase() == req.method.toLowerCase();
		})) {
			continue;
		}

		let params = false;
		for (let expr of endpoint.regex) {
			if ((params = expr.exec(reqUrl.pathname))) {
				console.log(` - Using ${expr} to handle it.`);
				break;
			}
		}
		if (params) {
			endpoint.handler(req, res, params);
			return;
		}
	}
	// If no handler is found, then we will use our default
	console.error(`Url ${req.url} and method ${req.method} doesn't have a route handler`);
	errorDocument(res, 404);
});

// Activate the server
mysqlx.getSession({
	host: "localhost",
	port: 33060,
	dbUser: "cs290fp",
	dbPassword: "javascript"
}).then( input => {
	dbSession = input; // This may not need to be global.  I'm not sure yet.

	console.log("Connected to the database sucessfully.")

	// Get the schema
	// Schema probably doesn't need to be global either.
	schema = dbSession.getSchema('cs290fp');
	schema.existsInDatabase().then((schemaIn) => {
		if (!schemaIn) {
			console.error(new Error("The cs290fp schema wasn't found in the database.  Have you run the db_setup.sql file sucessfully?"));
		} else {
			console.log("Schema appears in database, so chances are that the db_setup.sql file has been run.")
			// Setup the tables
			let tableNames = ["conversions", "ingredient_meta", "ingredients", "recipes", "units", "users"];
			let tablePromises = tableNames.map(key => {
				tables[key] = schema.getTable(key);
				return tables[key].existsInDatabase();
			});
			Promise.all(tablePromises).then(tableIn => {
				if (!tableIn) {
					console.error(new Error("At least one required table wasn't in the database.  Have you run the db_setup.sql file sucessfully?"));
				} else {
					// We are all good.
					console.log("All tables found in the database. db_setup.sql probably ran successfully.");

					console.log("Server listening on port: " + PORT);
					server.listen(PORT);
				}
			});
		}
	});
}).catch( error => {
	console.error(error);
})
