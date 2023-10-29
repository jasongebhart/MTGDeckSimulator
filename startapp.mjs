// Import required modules
import express from 'express';
import xmlbuilder from 'xmlbuilder';
import { setupRoutes } from './controllers/controller.mjs'; // Adjust the import path to match your file structure
import fs from 'fs';
import parser from 'xml2json';
import { loadXMLDoc, xmlDoc } from './scripts/config.mjs';

// Create an instance of Express
const app = express();

// Define a CSP policy that allows loading from localhost and a specific domain for the favicon
const cspHeader = "default-src 'self'; img-src 'self' http://localhost:3000;";


// Setup template engine
app.set('view engine', 'ejs');
// Set the port number
app.set('port', process.env.PORT || 3000);

// Static files
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use('/xml', express.static('xml'));

// Fire controllers
setupRoutes(app); // Use the imported setupRoutes function

// Listen on the port specified by the PORT environment variable
app.listen(app.get('port'), () => {
  console.log(`MTG Simulator listening at http://localhost:${app.get('port')}`);
});