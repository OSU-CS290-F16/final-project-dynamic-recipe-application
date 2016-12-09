"use strict";

// Imports
const fs = require('fs');
const http = require('http');
const mongodb = require('mongodb');
const url = require('url');
const path = require('path');

// Where we will store our connection to MongoDB
let db, recipes;

// Load the templates
const templates = {};
['index', '404'].forEach(name => {
	// We are turning the html files into a str we can eval as a template
	let tmplstr = '`' + fs.readFileSync(`templates/${name}.html`).toString() + '`';
	templates[name] = tmplstr;
});

// Setup the tables
const tables = {};

// Store any session information in the form:
//   (session key): {session data}
const sessions = {};

// Port to listen on
const PORT = process.env.port || 80;

// Handle displaying common errors.
function errorDocument(response, error) {
	switch (error) {
		case 404:
		default:
		response.writeHead(404, "Not Found", {});
		response.end(
			eval(templates['404'])
		);
	}
}
function indexDocument(response){
	recipes.find({}, (error, cursor) => {
		if (error){
			console.error(new Error(error));
		}
		cursor.toArray((error, recipes) => {
			if (error) {
				console.error(new Error(error));
			}
			// template index uses: recipes
			response.writeHead(200, 'All good', {});
			response.end(
				eval(templates['index'])
			);
		});
	})
}
// function recipeAddDocument(response, error = false ){
// 	response.writeHead(200, 'All good', {});
// 	response.end(
// 		eval(templates['add-recipe'])
// 	);
// }
// function recipeDisplayDocument(response, id){
// 	recipesCollection.find({'id': id}, (error, cursor) => {
// 		cursor.forEach((recipe) => {
// 			response.writeHead(200, 'All good', {});
// 			response.end(
// 				eval(templates['recipe-display'])
// 			);
// 		})
// 	});
// }

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
	// {
	// 	// Add recipe page
	// 	methods: ["get"],
	// 	regex: [
	// 		/\/recipes\/add\//
	// 	],
	// 	handler: function(req, res, params) {
	// 		recipeAddDocument(res);
	// 	}
	// },
	{
		// Recipe pages
		methods: ["get"],
		regex: [
			/\/recipes\//
		],
		handler: function(req, res, params) {
			let [match, id] = params;
			indexDocument(res);
		}
	},
	{
		// Rest Api endpoint
		methods: ["get", "post", "put", "delete"],
		regex: [
			/\/api\/recipes\//
		],
		handler: function(req, res, params) {
			// Decrease the number of toLowerCase() statements
			req.method = req.method.toLowerCase();
			if (req.method == "get") {
				// This would be if I was requesting recipes over ajax later on.

				// recipesCollection.find({'id': data.id}, (error, cursor) => {
				// 	cursor.forEach(document => {
				// 		res.writeHead(200, "Successfully returning recipe", {});
				// 		res.end(JSON.stringify(document));
				// 	})
				// });
			} else if (req.method == "post") {
				stream2str(req, (str) => {
					let data = JSON.parse(str);
					if (data.id == "create") {
						delete data.id;
						data._id = mongodb.ObjectId();
						recipes.insert(data);
						res.writeHead(200, "Inserted Successfully", {});
						res.end();
					} else {
						data._id = data.id;
						delete data.id;
						recipes.update({'id': data.id}, data);
						res.writeHead(200, "Updated Successfully", {});
						res.end();
					}
				});
			} else if (req.method == "put") {
				console.error("Updating a recipe is not implemented.");
			} else { // Method = delete
				stream2str(req, (str) => {
					let data = JSON.parse(str);
					recipes.remove({_id: data.id});
					res.writeHead(200, "ok", {});
					res.end();
				});
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
			indexDocument(res);
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

// Connect to the database and start the server
// Database information
const DB_USERNAME = "cs290_casters",
	DB_USERPASS = "dZDPDyDZcNpzcDh",
	DB_HOST = "classmongo.engr.oregonstate.edu",
	DB_PORT = 27017,
	DB_NAME = "cs290_casters";

const mongoUrl = `mongodb://${DB_USERNAME ?
		`${DB_USERNAME}:${DB_USERPASS}@` : ''
	}${DB_HOST}:${DB_PORT}/${DB_NAME}`;
mongodb.MongoClient.connect(mongoUrl, (err, mongoDb) => {
	if (err){
		console.error(`Unable to connect to the database because ${err}`);
		return;
	} else {
		console.log(`Connected to the database`);
	}
	db = mongoDb;
	recipes = db.collection('recipes');
	server.listen(PORT);
	console.log(`Server listening on ${PORT}`);
});
