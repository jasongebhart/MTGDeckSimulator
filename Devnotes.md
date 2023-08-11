In a Node.js web application, refreshing the app to apply new CSS styles typically involves making changes to your CSS files and then restarting the Node.js server. Here's a step-by-step guide on how to refresh your Node.js app to use the new CSS:

1. **Update CSS Files**: Make the necessary changes to your CSS files, updating the styles as desired.

2. **Restart Node.js Server**:
   - If you're using a development environment, you can manually stop the Node.js server by pressing `Ctrl + C` in the terminal where the server is running.
   - After stopping the server, start it again by running the command you used to start it initially. For example:
     ```
     node app.js
     ```
     Replace `app.js` with the name of your main server file.

3. **Clear Browser Cache**: Browsers often cache CSS files to improve performance. Sometimes, you might need to clear your browser's cache to see the updated styles. You can do this by:
   - Pressing `Ctrl + Shift + R` (or `Cmd + Shift + R` on macOS) to force a hard refresh of the page.
   - Clearing the cache from your browser's settings.

4. **Check the Changes**: After refreshing the app and clearing the cache, open your web application in the browser and check if the new CSS styles are applied.

5. **Automate the Process**: In a production environment, you might want to automate the process of updating CSS without manual server restarts. Tools like `nodemon` can help automatically restart your Node.js server when code changes are detected. To install `nodemon`, run:
   ```
   npm install -g nodemon
   ```
   Then, start your app using `nodemon`:
   ```
   nodemon app.js
   ```

Remember that this process is specific to development environments or small-scale applications. In a production environment, you would typically use a build process to generate optimized CSS files and serve them using a web server (like Nginx or Apache) alongside your Node.js app. This allows for better performance and caching control.

Always ensure you have a proper deployment strategy when making changes to your app's code and assets in a production environment.