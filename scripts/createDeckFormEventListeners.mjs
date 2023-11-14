import { convertToXml, loadFromXml, deleteCardInDeck } from "./decks.mjs";
import {
    loadXMLDoc,
    xmlDoc,
    getCardDetails,
    fetchCardInformation,
    displaySuggestions,
    createCardInputFields,
    readXmlFile,
    parseXml
} from "./config.mjs";


// Function to handle the file selection and initiation of file processing
const handleFileSelection = () => {
    const fileInput = document.getElementById('xmlFile');
    const selectedFile = fileInput.files[0];
    if (selectedFile) {
        processXMLFile(selectedFile);
    }
};

// Function to read the XML file and start the processing
const processXMLFile = async (file) => {
    try {
        const xmlText = await readXmlFile(file);
        if (!xmlText) {
            throw new Error("Failed to read XML file.");
        }

        const xmlDoc = parseXml(xmlText);
        processXmlData(xmlDoc);
    } catch (error) {
        handleProcessingError(error);
    }
};

const extractDeckName = (xmlDoc) => {
    try {
        const deckNameElement = xmlDoc.querySelector("Decklist");
        if (!deckNameElement) {
            throw new Error("No deck information found in the XML file.");
        }

        const deckName = deckNameElement.getAttribute("Deck");
        if (!deckName) {
            throw new Error("No deck name found in the XML file.");
        }

        return deckName;
    } catch (error) {
        handleProcessingError(error);
        // Or you could return or handle the error in a way that suits your application
    }
};

const processXmlData = (xmlDoc) => {
    try {
        const deckName = extractDeckName(xmlDoc);
        updateDeckNameUI(deckName);

        const cardElements = getCardElements(xmlDoc);

        processCardDetails(cardElements)
            .catch((error) => {
                handleProcessingError(error);
            });
    } catch (error) {
        handleProcessingError(error);
    }
};


const updateDeckNameUI = (deckName) => {
    document.querySelector("input[name='deckName']").value = deckName;
};

const getCardElements = (xmlDoc) => {
    const cardElements = xmlDoc.querySelectorAll("Card");
    if (!cardElements.length) {
        throw new Error("No card information found in the XML file.");
    }
    return cardElements;
};

const processCardDetails = (cardElements) => {
    clearCardInputs();
    return fetchAndUpdateCardDetails(cardElements)
        .then((cardDetailsMap) => {
            if (!cardDetailsMap || Object.keys(cardDetailsMap).length === 0) {
                throw new Error("Failed to fetch card details.");
            }
            createCardInputFields(cardDetailsMap);
        });
};


// Function to handle errors during processing and display messages
const handleProcessingError = (error) => {
    console.error("Error processing XML file:", error);
    // Display an error message to the user, e.g., show an alert or update a status message on the UI
};


// Main function to handle the download event
const handleDownload = () => {
    const deckData = gatherDeckData(); // Collect data for the deck
    if (!deckData) return; // Exit if data collection fails

    const xmlString = convertToXml(deckData); // Convert deck data to XML
    downloadXml(xmlString, deckData.deckName); // Initiate download
};

// Function to handle adding a card
const handleAddCard = async () => {
    const dropdown = document.querySelector("select"); // Assuming there's only one dropdown on the page
    const selectedOption = dropdown.options[dropdown.selectedIndex].value;
    let cardDetailsMap = {};
    try {
        // Fetch card details (type and cost) based on the selected item
        const cardDetails = await getCardDetails(selectedOption);

        // Validate selected item and fetched cardDetails
        if (selectedOption.trim() && cardDetails) {
            //cardCount++; // Increment the card count

            // Create a single entry in the cardDetailsMap for the newly added card
            const newCardDetails = {
                cardType: cardDetails.cardType,
                cardCost: cardDetails.cardCost,
                rulesText: cardDetails.rulesText,
                cardImageUrl: cardDetails.cardImageUrl,
                quantity: 1, // Initial quantity for the newly added card
            };

            // Update or add the new card details to the map
            cardDetailsMap[selectedOption] = newCardDetails;

            // Call the function to create the card input fields with the updated card details map
            createCardInputFields(cardDetailsMap);
        }
    } catch (error) {
        // Handle any errors that occur during the fetch or processing
        console.error("Error fetching card details: " + error.message);
    }
};

const fetchCardSuggestions = async (inputName) => {
    if (inputName.length < 3) {
        // Avoid making API requests for very short inputs
        return;
    }

    // Make a request to the Scryfall API for card name suggestions
    const apiUrl = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(inputName)}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
        const suggestions = await response.json();
        return suggestions;
    }
    return null; // Handle non-successful response if needed
};

const handleInput = async (event) => {
    const input = event.target;
    const inputName = input.value.trim();

    const suggestions = await fetchCardSuggestions(inputName);
    if (suggestions) {
        // Display the suggestions in a dropdown or list
        displaySuggestions(suggestions);
    }
};

// Function to gather deck data from input fields
const gatherDeckData = () => {
    const deckNameInput = document.querySelector("input[name='deckName']");
    if (!deckNameInput) {
        console.error("Missing deck name input");
        return null;
    }

    const deckData = {
        deckName: deckNameInput.value,
        designGoal: 'a',
        cards: [],
    };

    let i = 0;
    while (true) {
        const cardData = gatherCardData(i);
        if (cardData) {
            deckData.cards.push(cardData); // Add valid card data
            i++;
        } else {
            break; // Break the loop if no more card data is found
        }
    }

    return deckData;
};


// Function to collect card data for a specific index
const gatherCardData = (index) => {
    const nameInput = document.querySelector(`input[name='cardName${index}']`);
    const quantityValue = document.querySelector(`.quantity-value[data-index="${index}"]`);
    const typeInput = document.querySelector(`input[name='cardType${index}']`);
    const costInput = document.querySelector(`input[name='cardCost${index}']`);
    const rulesTextInput = document.querySelector(`textarea[name='cardRulesText${index}']`);

    // Validate and process card data
    if (!nameInput) {
        return null;
    }

    const quantity = parseInt(quantityValue.textContent, 10);
    if (isNaN(quantity)) {
        console.error(`Invalid quantity for card ${index}`);
        return null;
    }

    return {
        name: nameInput.value,
        quantity,
        type: typeInput ? typeInput.value : '', // Check if typeInput exists
        cost: costInput ? costInput.value : '', // Check if costInput exists
        rulesText: rulesTextInput ? rulesTextInput.value : '', // Check if rulesTextInput exists
    };
};

const downloadXml = (xmlString, deckName) => {
    const blob = new Blob([xmlString], { type: "text/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deckName}.xml`;
    a.click();
};


const clearCardInputs = () => {
    cardInputsContainer.innerHTML = '';
};

const fetchAndUpdateCardDetails = async (cardElements) => {
    const cardDetailsMap = {};
    for (const card of cardElements) {
        const name = card.querySelector("Name")?.textContent || "";
        const quantity = card.querySelector("Quantity")?.textContent || 0;
        const cardType = card.querySelector("Type")?.textContent || "";
        const cardCost = card.querySelector("Cost")?.textContent || "";
        const rulesText = card.querySelector("RulesText")?.textContent || "";
        const cardImageUrl = card.querySelector("cardImageUrl")?.textContent || "";

        if (!cardType || !cardCost || !rulesText || !cardImageUrl) {
            try {
                const cardDetails = await getCardDetails(name);
                if (cardDetails) {
                    cardDetailsMap[name] = { ...cardDetails, quantity };
                    console.log('cardDetailsMap:',cardDetailsMap[name]);
                } else {
                    cardDetailsMap[name] = {
                        quantity,
                        cardType,
                        cardCost,
                        rulesText,
                        cardImageUrl,
                    };
                }
            } catch (error) {
                console.error(`Failed to fetch details for card: ${name}`, error);
            }
        } else {
            cardDetailsMap[name] = {
                quantity,
                cardType,
                cardCost,
                rulesText,
                cardImageUrl,
            };
        }
    }
    return cardDetailsMap;
};


export function loadEventListeners() {
    let cardCount = 0;
    document.addEventListener("DOMContentLoaded", () => {
        const cardInputsContainer = document.getElementById("cardInputsContainer");
        const suggestionsContainer = document.getElementById("suggestionsContainer");
  
        const downloadDeckButton = document.getElementById("downloadDeckButton");
        downloadDeckButton.addEventListener("click", handleDownload);
  
        const loadXMLFileButton = document.getElementById("loadXMLFileButton");
        const xmlFileInput = document.getElementById("xmlFile");
        
        loadXMLFileButton.addEventListener("click", () => {
            xmlFileInput.click(); // Trigger the file input on button click
        });
        
        xmlFileInput.addEventListener("change", handleFileSelection); // Use the unified file selection handler
        
        // Assuming you have a select element with the name 'selectDeck'
        const selectDeck = document.querySelector('select[name="selectDeck"]');

        // Function to trigger startListDeck when a deck is selected
        selectDeck.addEventListener('change', async () => {
            const selectedDeck = selectDeck.value; // Get the selected deck value
            await loadXMLDoc(selectedDeck);
            processXmlData(xmlDoc);
            //await startListDeck(selectedDeck); // Trigger the function with the selected deck
        });


        // Upload XML File Event Listener
        //const xmlFileInput = document.getElementById("xmlFile");
        //xmlFileInput.addEventListener("change", handleFileSelection);
  
        // An event listener for card name input suggestions
        const cardNameInput = document.getElementById("lookupCardName");
        cardNameInput.addEventListener("input", handleInput);
  
         // addCard event listener
        const addCardButton = document.getElementById("addCardButton");
        addCardButton.addEventListener("click", handleAddCard);
    });
}

export { gatherDeckData, gatherCardData, downloadXml, handleDownload };