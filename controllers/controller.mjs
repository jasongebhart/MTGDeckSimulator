// controller.js
import { loadXMLDoc, xmlDoc } from '../scripts/config.mjs'; // Import the loadXMLDoc function

// Function to set up routes for the Express app
export function setupRoutes(app) {
  // Define routes and their handlers using an array of route objects
  const routes = [
    { path: '/decks', template: 'decks' },
    { path: '/playhand', template: 'playhand' },
    { path: '/handsimulation', template: 'handsimulation' },
    { path: '/alldecks', template: 'alldecks' }
  ];

  // Set up the routes using a loop
  routes.forEach(route => {
    app.get(route.path, (req, res) => {
      res.render(route.template); // Render the specified template
    });
  });

  // Handle a POST request to '/clicked'
  app.post('/clicked', async (req, res) => {
    try {
      const clickTime = new Date();
      const XMLFile = req.body.XMLFile;
  
      // Log the XMLFile and click information to the console
      console.log(XMLFile);
      console.log({ clickTime });

      await loadXMLDoc(XMLFile); // Wait for the async operation to complete
      console.log(xmlDoc);
      // Send a success status code (201) back to the client
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing the request.');
    }
  });
}