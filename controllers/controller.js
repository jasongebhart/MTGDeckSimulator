// controller.js

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
  app.post('/clicked', (req, res) => {
    const clickTime = new Date();
    const XMLFile = req.body.XMLFile;

    // Log the XMLFile and click information to the console
    console.log(XMLFile);
    console.log({ clickTime });

    // Send a success status code (201) back to the client
    res.sendStatus(201);
  });
}

