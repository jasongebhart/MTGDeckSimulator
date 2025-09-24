// controller.js

import { loadXMLDoc, xmlDoc } from '../scripts/config.mjs'; // Import the loadXMLDoc function
import multer from 'multer';

// Security validation functions
function isValidXML(xmlText) {
  try {
    // Basic XML structure validation
    if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
      return false;
    }

    // Basic validation - check for proper XML tags
    const hasOpeningTag = xmlText.includes('<');
    const hasClosingTag = xmlText.includes('>');

    return hasOpeningTag && hasClosingTag;
  } catch (error) {
    return false;
  }
}

function containsXXEPatterns(xmlText) {
  const xxePatterns = [
    /<!ENTITY/i,                    // Entity declarations
    /<!DOCTYPE.*\[/i,              // DOCTYPE with internal subset
    /SYSTEM\s+["\']file:/i,        // External file references
    /SYSTEM\s+["\']http/i,         // External HTTP references
    /SYSTEM\s+["\']ftp/i,          // External FTP references
    /PUBLIC\s+.*SYSTEM/i,          // Public external references
    /&#x[0-9a-fA-F]+;/,           // Hex character references (potential bypass)
    /&#[0-9]+;/                    // Decimal character references (potential bypass)
  ];

  return xxePatterns.some(pattern => pattern.test(xmlText));
}

// Function to set up routes for the Express app
export function setupRoutes(app) {
  // Define routes and their handlers using an array of route objects
  const routes = [
    { path: '/', template: 'decks' },
    { path: '/login', template: 'login' },
    { path: '/logout', template: 'logout' },
    { path: '/decks', template: 'decks' },
    { path: '/playhand', template: 'playhand' },
    { path: '/handsimulation', template: 'handsimulation' },
    { path: '/alldecks', template: 'alldecks' },
    { path: '/create-deck-form', template: 'create-deck-form' },
  ];

  // Set up the routes using a loop
  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.render(route.template); // Render the specified template
    });
  });

  const storage = multer.memoryStorage(); // Store the uploaded file in memory
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1 * 1024 * 1024, // 5 MB maximum file size
    },
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['xml'];
    
      // Get the file extension by splitting the original file name
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true); // File is allowed
      } else {
        cb(new Error('Invalid file type. Only .xml files are allowed.'), false);
      }
    },
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Use environment variables for credentials in production
    const validUsername = process.env.APP_USERNAME || 'admin';
    const validPassword = process.env.APP_PASSWORD || 'change-me-in-production';

    // In production, use proper password hashing (bcrypt)
    if (username === validUsername && password === validPassword) {
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      // Add rate limiting and logging for failed attempts in production
      console.log(`Failed login attempt for username: ${username} from IP: ${req.ip}`);
      res.redirect('/login?error=invalid');
    }
  });

  
  app.get('/dashboard', (req, res) => {
    if (req.session.user) {
      // User is logged in, and you can access their session data
      const username = req.session.user;
      res.render('dashboard', { username }); // Render the dashboard with user-specific data
    } else {
      // User is not logged in, redirect to the login page
      //const username = 'testuser';
      //res.render('dashboard', { username });
      res.redirect('/login');
    }
  });
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Session has been destroyed.');
      }
      res.redirect('/login'); // Redirect to the login page after logout
    });
  });
  
  
  // Authentication middleware
  const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // New route for processing deck creation - now requires authentication
  app.post('/create-deck', requireAuth, upload.single('XMLFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }

      // Access the uploaded file's content (in this case, as a buffer)
      const XMLFileBuffer = req.file.buffer;
      const xmlText = XMLFileBuffer.toString('utf8');

      // Validate XML content for security
      if (!isValidXML(xmlText)) {
        return res.status(400).send('Invalid XML format.');
      }

      // Check for XXE attack patterns
      if (containsXXEPatterns(xmlText)) {
        console.log(`Potential XXE attack detected from IP: ${req.ip}`);
        return res.status(400).send('XML contains forbidden content.');
      }

      // Process the uploaded file content (XMLFileBuffer) as needed
      console.log('Original file name:', req.file.originalname);
      console.log('File size:', req.file.size, 'bytes');

  
      // Your custom processing code here
  
      // Send a success status code (201) back to the client
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing the deck creation request.');
    }
  });

  
}