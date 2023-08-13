//var express = require('express');
const express = require('express');

var controller = require('./controllers/controller.js');
var fs = require('fs');
var parser = require('xml2json');

var app = express();

//setup template engine
app.set('view engine', 'ejs');

// static files
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use('/xml', express.static('xml'));

//fire controllers
controller(app);

// Listen to port
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
