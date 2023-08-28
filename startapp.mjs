// Import required modules
import express from 'express';
import { setupRoutes } from './controllers/controller.mjs'; // Adjust the import path to match your file structure
import fs from 'fs';
import parser from 'xml2json';
import { loadXMLDoc, xmlDoc } from './scripts/config.mjs';

// Create an instance of Express
const app = express();

// Setup template engine
app.set('view engine', 'ejs');

// Static files
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use('/xml', express.static('xml'));

// Fire controllers
setupRoutes(app); // Use the imported setupRoutes function

// Listen to port
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});