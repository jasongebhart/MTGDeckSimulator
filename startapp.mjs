// Import required modules
import express from 'express';
import session from 'express-session';

import xmlbuilder from 'xmlbuilder';
import { setupRoutes } from './controllers/controller.mjs'; // Adjust the import path to match your file structure
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { loadXMLDoc, xmlDoc } from './scripts/config.mjs';

// Create an instance of Express
const app = express();

// Secure CSP policy
const cspHeader =
  "default-src 'self'; connect-src 'self' https://api.scryfall.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration - use environment variable for secret
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'development-only-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Setup template engine
app.set('view engine', 'ejs');
// Set the port number
app.set('port', process.env.PORT || 3001);

// Static files
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use('/xml', express.static('xml'));
app.use('/src', express.static('src'));
app.use('/decks', express.static('decks'));

// Fire controllers
setupRoutes(app); // Use the imported setupRoutes function

// Listen on the port specified by the PORT environment variable
app.listen(app.get('port'), () => {
  console.log(`MTG Simulator listening at http://localhost:${app.get('port')}`);
});
