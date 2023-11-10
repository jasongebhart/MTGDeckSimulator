import { convertToXml, loadFromXml, deleteCardInDeck } from "./decks.mjs";
import {
  getCardDetails,
  fetchCardInformation,
  displaySuggestions,
  createCardInputFields,
} from "./config.mjs";

// Main function to handle the download event
const handleDownload = () => {
    const deckData = gatherDeckData(); // Collect data for the deck
    if (!deckData) return; // Exit if data collection fails

    const xmlString = convertToXml(deckData); // Convert deck data to XML
    downloadXml(xmlString, deckData.deckName); // Initiate download
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

    // Collect card data
    for (let i = 1; i <= cardCount; i++) {
        const cardData = gatherCardData(i);
        if (cardData) deckData.cards.push(cardData); // Add valid card data
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
    if (!nameInput || !quantityValue) {
        console.error(`Missing required data for card ${index}`);
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


// Function to download XML
const downloadXml = (xmlString, deckName) => {
    const blob = new Blob([xmlString], { type: "text/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deckName}.xml`;
    a.click();
};

// Helper functions

const readXmlFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsText(file);
    });
};

const parseXml = (xmlText) => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, 'text/xml');
};

const clearCardInputs = () => {
    cardInputsContainer.innerHTML = '';
};

// Within the event listener
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




const getCardDataFromXml = (card) => {
    const name = card.querySelector("Name")?.textContent || "";
    const quantity = card.querySelector("Quantity")?.textContent || 0;
    const cardType = card.querySelector("Type")?.textContent || "";
    const cardCost = card.querySelector("Cost")?.textContent || "";
    const rulesText = card.querySelector("RulesText")?.textContent || "";
    const cardImageUrl = card.querySelector("cardImageUrl")?.textContent || "";

    return { name, quantity, cardType, cardCost, rulesText, cardImageUrl };
};



export function loadEventListeners() {
    let cardCount = 0;
    document.addEventListener("DOMContentLoaded", () => {
    const cardInputsContainer = document.getElementById("cardInputsContainer");
    const suggestionsContainer = document.getElementById("suggestionsContainer");

        // Add an event listener for card name input
        document.addEventListener("input", (event) => {
            const input = event.target;
            if (input.type === "text" && input.name && input.name.startsWith("cardName")) {
            const match = input.name.match(/\d+/);
            if (match) {
                const index = parseInt(match[0], 10);
                fetchCardInformation(index, input.value);
            }
            }
        });
    
        const downloadDeckButton = document.getElementById("downloadDeckButton");
        downloadDeckButton.addEventListener("click", handleDownload);
  
        // "Upload and Load XML File" Event Listener
        const xmlFileInput = document.getElementById("xmlFile");
        xmlFileInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;
        
            const xmlText = await readXmlFile(file);
            if (!xmlText) return;
        
            const xmlDoc = parseXml(xmlText);
        
            const deckName = xmlDoc.querySelector("Decklist").getAttribute("Deck");
            document.querySelector("input[name='deckName']").value = deckName;
        
            const cardElements = xmlDoc.querySelectorAll("Card");
        
            clearCardInputs(); // Clear existing card inputs
            cardCount = 0; // Reset card count
            const cardDetailsMap = await fetchAndUpdateCardDetails(cardElements);
        
            cardElements.forEach((card) => {
                const name = card.querySelector("Name")?.textContent || "";
                const quantity = card.querySelector("Quantity")?.textContent || 0;
                
                const updatedValues = cardDetailsMap[name] || getCardDataFromXml(card);
        
                createCardInputFields(cardDetailsMap);
            });
        });
  
        // find the input field for card name suggestions
        const cardNameInput = document.getElementById("lookupCardName");
    
        // Add an event listener to the card name input for suggestions
        cardNameInput.addEventListener("input", async (event) => {
            const input = event.target;
            const inputName = input.value.trim();
        
            if (inputName.length < 3) {
                // Avoid making API requests for very short inputs
                return;
            }
        
            // Make a request to the Scryfall API for card name suggestions
            const apiUrl = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(inputName)}`;
            const response = await fetch(apiUrl);
        
            if (response.ok) {
                const suggestions = await response.json();
        
                // Display the suggestions in a dropdown or list
                displaySuggestions(suggestions, cardCount);
            }
        });
  
        // Add an event listener to the "Add Card" button
        const addCardButton = document.getElementById("addCardButton");       
        // Initial setup to hold card details
        let cardDetailsMap = {};
        // Your addCard event listener
        addCardButton.addEventListener("click", async () => {
            const dropdown = document.querySelector("select"); // Assuming there's only one dropdown on the page
            const selectedOption = dropdown.options[dropdown.selectedIndex].value;
            
            try {
                // Fetch card details (type and cost) based on the selected item
                const cardDetails = await getCardDetails(selectedOption);

                // Check if the selected item is not empty and cardDetails exist
                if (selectedOption.trim() !== '' && cardDetails) {
                    cardCount++; // Increment the card count

                    // Create a single entry in the cardDetailsMap for the newly added card
                    cardDetailsMap[selectedOption] = {
                        cardType: cardDetails.cardType,
                        cardCost: cardDetails.cardCost,
                        rulesText: cardDetails.rulesText,
                        cardImageUrl: cardDetails.cardImageUrl,
                        quantity: 1, // Initial quantity for the newly added card
                    };

                    // Call the function to create the card input fields with the new card details map
                    createCardInputFields(cardDetailsMap);
                }
            } catch (error) {
                // Handle any errors that occur during the fetch or processing
                console.error("Error fetching card details: " + error.message);
            }
        });

    });
}

export { gatherDeckData, gatherCardData, downloadXml, handleDownload };