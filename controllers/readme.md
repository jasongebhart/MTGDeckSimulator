## controller.js

Thie Node application is launched via 
```
node .\startapp.mjs
```
The startapp.mjs loads the routes from the controller.
```
import { setupRoutes } from './controllers/controller.mjs'; 
```
This code defines routes and handlers for your Express application. It handles various actions, including handling XML file uploads and deck creation.


### Importing Modules: 
Import necessary functions and objects from your `config.mjs` and other modules.
```
import { loadXMLDoc, xmlDoc } from '../scripts/config.mjs';
 ```

### Route Definition: 
Define an array of route objects, each specifying a path and the corresponding template to render.
```
  const routes = [
    { path: '/', template: 'decks' },
    { path: '/decks', template: 'decks' },
    { path: '/playhand', template: 'playhand' },
    { path: '/handsimulation', template: 'handsimulation' },
    { path: '/alldecks', template: 'alldecks' },
    { path: '/create-deck-form', template: 'create-deck-form' },
  ];
```
### Route Handling: 
Using a loop, set up the defined routes and their handlers. These routes include rendering templates.
```
  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.render(route.template); // Render the specified template
    });
  });
```
### Handling POST Requests:
 For the `/create-deck` route, handle POST requests for deck creation. This is where you can process the form data, create an XML structure, save it to a file, and add appropriate validation and error handling. You also send a success status code (201) to the client in case of a successful deck creation or handle errors.

### **Deck Creation Form**:
A route, `/create-deck-form`, which renders a template for a deck creation form.

### **Deck Creation Handling**:


