// config.mjs

// Initialize xmlDoc as undefined
export let xmlDoc = undefined;

// Function to load an XML file
export async function loadXMLDoc(xmlFile) {
    try {
        // Create a Fetch API request to load the XML file.
        const response = await fetch(xmlFile);

        if (!response.ok) {
            // Handle failed request with a meaningful error message
            throw new Error('Failed to load the requested file.');
        }

        // Parse the XML response into a document.
        const xmlText = await response.text();
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Return the parsed XML document
        return xmlDoc;
    } catch (error) {
        // Handle errors gracefully and provide user feedback
        console.error(error);
        window.alert('Unable to load the requested file. Please check your internet connection and try again.');
    }
}

// Function to get the selected item from a form
export function getSelectedItem() {
    // Get the number of options in the select element
    const numberOfOptions = document.formDecks.selectDeck.length;

    // Initialize variables
    let selectedItem = "none";

    // Loop through the options to find the selected one
    for (let i = 0; i < numberOfOptions; i++) {
        if (document.formDecks.selectDeck[i].selected) {
            // Set selectedItem to the value of the selected option
            selectedItem = document.formDecks.selectDeck[i].value;
        }
    }

    // Return the selected item (or "none" if nothing is selected)
    return selectedItem;
}
