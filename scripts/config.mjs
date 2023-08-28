// config.mjs
let xmlDoc = undefined; // Declare xmlDoc without assigning a value
  
export async function loadXMLDoc(xmlFile) {
    try {
        // Create a Fetch API request to load the XML file.
        const response = await fetch(xmlFile);
        
        if (!response.ok) {
            throw new Error('Failed to load the requested file.');
        }
        
        // Parse the XML response into a document.
        const xmlText = await response.text();
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        return xmlDoc;
    } catch (error) {
        console.error(error);
        window.alert('Unable to load the requested file.');
    }
}
export { xmlDoc }; // Export the xmlDoc variable