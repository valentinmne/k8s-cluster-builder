const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const api = require('./api');
const app = express();// body parsing middleware
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));// all routes are falling back into api.js
app.use('/', api);// HTTP port setting
const port = process.env.PORT || '7000';
app.set('port', port);// HTTP server creation
const server = http.createServer(app);// listening all incoming requests on the set port
server.listen(port, () => console.log(`backend running on port:${port}`));
