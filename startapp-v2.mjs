/**
 * MTG Simulator - Modernized Application Entry Point
 * Features: Modular architecture, proper error handling, structured APIs
 */

import express from 'express';
import session from 'express-session';
import router from './src/routes/index.mjs';
import { errorHandler } from './src/middleware/errorHandler.mjs';

// Create Express application
const app = express();

// Security headers middleware
const cspHeader =
  "default-src 'self'; img-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session configuration
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

// Template engine
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3002); // Different port to avoid conflict

// Static files
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use('/xml', express.static('xml'));

// API routes
app.use('/', router);

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Start server
app.listen(app.get('port'), () => {
  console.log(`🃏 MTG Simulator v2 (Modernized) listening at http://localhost:${app.get('port')}`);
  console.log(`📚 API Documentation: http://localhost:${app.get('port')}/api/v1`);
  console.log(`🔧 Features: Modular architecture, error handling, validation`);
});