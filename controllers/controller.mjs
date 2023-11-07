// controller.js

import { loadXMLDoc, xmlDoc } from '../scripts/config.mjs'; // Import the loadXMLDoc function
import multer from 'multer';

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
    const { username, password } = req.body; // Replace with your authentication logic
  
    if (username === 'testuser' && password === 'testpassword') {
      req.session.user = username; // Store user data in the session
      res.redirect('/dashboard'); // Redirect to the dashboard or another page
    } else {
      res.redirect('/login'); // Redirect back to login in case of authentication failure
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
  
  
  // New route for processing deck creation
  app.post('/create-deck', upload.single('XMLFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
  
      // Access the uploaded file's content (in this case, as a buffer)
      const XMLFileBuffer = req.file.buffer;
  
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