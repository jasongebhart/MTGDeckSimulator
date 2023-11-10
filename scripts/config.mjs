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

export function getCardNames() {
    const deckList = xmlDoc.getElementsByTagName("Decklist")[0];
    const cardInfo = extractCardInfo(deckList);
    const cardNames = buildCardNamesArray(cardInfo);

    return {
        cardNames,
        cardInfo
    };
}

export function extractCardInfo(deckList) {
    const cardInfo = {};

    for (const card of deckList.getElementsByTagName("Card")) {
        const name = card.getElementsByTagName("Name")[0].textContent;
        const quantity = parseInt(card.getElementsByTagName("Quantity")[0].textContent);
        const type = card.getElementsByTagName("Type")[0].textContent.toLowerCase();

        console.log("Name:", name);
        console.log("Quantity:", quantity);
        console.log("Type:", type);

        if (!cardInfo[name]) {
            cardInfo[name] = {
                quantity: 0,
                type: type,
            };
        }
        cardInfo[name].quantity += quantity;
    }
    const totalCardObjects = Object.keys(cardInfo).length;
    console.log("Total Card Objects:", totalCardObjects);

    const totalLands = Object.values(cardInfo).reduce((sum, card) => {
        return sum + (card.type === "land" ? card.quantity : 0);
    }, 0);
    
    console.log("Total Lands:", totalLands);
    return cardInfo;
}


export function isCardOfType(card, targetType) {
    if (targetType.toLowerCase() === "land" && card.type.toLowerCase().startsWith("basic land")) {
        return true;
    }
    return card.type.toLowerCase() === targetType.toLowerCase();
}

export function buildCardNamesArray(cardInfo) {
    const cardNames = [];

    for (const cardName in cardInfo) {
        const quantity = cardInfo[cardName].quantity;
        cardNames.push(...Array(quantity).fill(cardName)); // Push the name multiple times based on quantity
    }
    console.log("Deck Size:", cardNames.length);
    return cardNames;
}

export function createCardImage(cardDrawn, className) {
    var image = document.createElement("img");
    image.src = "/assets/MagicImages/" + cardDrawn + ".jpg";
    
    // Check if className is provided and not empty, then set it
    if (className && className.trim() !== "") {
        image.className = className;
    } else {
        // If className is not provided or empty, you can set a default class here
        image.className = "image-preview";
    }
    
    image.title = cardDrawn;
    image.style.cssText = 'display:block;text-align:center;';
    //image.alt="alt Hello";
    return image;
}

export function cardDraw(cardNames, cardInfo, cardsToDraw) {
    const initialDeckSize = cardNames.length; // Store the initial deck size
    const spells = [];
    const lands = [];
    console.log("card To Draw:", cardsToDraw);
    console.log("initialDeckSize in cardDraw:", initialDeckSize);

    for (let i = 0; i < cardsToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * (initialDeckSize - i)); // Use initialDeckSize here
        const drawnCard = cardNames.splice(randomIndex, 1)[0];
        const drawnType = cardInfo[drawnCard].type.toLowerCase();
        console.log("drawnCard:", drawnCard);
        console.log("drawnType:", drawnType);

        if (drawnType.toLowerCase() === "land" || drawnType.toLowerCase().startsWith("basic land")) {
            lands.push(drawnCard);
        } else {
            spells.push(drawnCard);
        }
    }

    return {
        spells,
        lands
    };
}


export function __cardDraw(cardNames, cardInfo, cardsToDraw) {
    const initialDeckSize = cardNames.length; // Store the initial deck size
    const spells = [];
    const lands = [];
    console.log("card To Draw:", cardsToDraw);
    console.log("initialDeckSize in cardDraw:", initialDeckSize);

    for (let i = 0; i < cardsToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * (initialDeckSize - i)); // Use initialDeckSize here
        const drawnCard = cardNames.splice(randomIndex, 1)[0];
        const drawnType = cardInfo[drawnCard].type.toLowerCase();
        console.log("drawnCard:", drawnCard);
        console.log("drawnType:", drawnType);

        if (drawnType === "land") {
            lands.push(drawnCard);
        } else {
            spells.push(drawnCard);
        }
    }

    return {
        spells,
        lands
    };
}

export function showLargerCard(cardName) {
    hideLargerCard()
    // Implement your logic to display the larger version of the card
    // This can be done by creating a modal or a separate container

    // Example: create a modal with the larger card image
    const largerCardImage = createCardImage(cardName);
    const modal = document.createElement("div");
    modal.classList.add("modal");

    // Add a close button to the modal (optional)
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.classList.add("close-button"); // Add a CSS class for styling

    // Add a click event listener to close the modal on button click
    closeButton.addEventListener("click", () => {
        hideLargerCard();
    });

    modal.appendChild(closeButton);
    modal.appendChild(largerCardImage);

    const Sidebar = document.getElementById("left-sidebar");
    Sidebar.appendChild(modal);
}

// Function to hide the larger card image
export function hideLargerCard(itemSelector) {
    console.log('item selector', itemSelector)
    const item = document.getElementById(itemSelector);
    if (item) {
        // Remove the larger card image from the container
        item.innerHTML = "";
    }
}

export async function _fetchCardInformation(index, cardName) {
    const cardTypeInput = document.querySelector(`input[name="cardType${index}"]`);
  
    // Use the Scryfall API function to get card details
    const cardDetails = await getCardDetails(cardName);
  
    // Update the card's type input with the fetched card type
    cardTypeInput.value = cardDetails.cardType;
  
    // You may also want to display the rules text somewhere
    // For example, you can create a new element to show the rules text
    const rulesTextElement = document.createElement("p");
    rulesTextElement.textContent = cardDetails.rulesText;
    // You can append this element wherever you want to display the rules text.
  }

  export async function fetchCardInformation(index, cardName) {
    // Use the Scryfall API function to get card details
    const cardDetails = await getCardDetails(cardName);
    // You'll need to implement this part to fetch card data from your API or source.
  
    // For demonstration purposes, let's assume you've received card data in the response.
    const cardData = {
      name: cardName,
      type: cardDetails.cardType, // Replace with the actual card type data
      cost: cardDetails.cardCost, // Replace with the actual card cost data
    };
  
    // Update the input fields with the fetched data
    document.querySelector(`input[name='cardType${index}']`).value = cardData.type;
    document.querySelector(`input[name='cardCost${index}']`).value = cardData.cost;
  }
  export async function __getCardDetails(cardName) {
    try {
      // Construct the Scryfall API URL with the card name as the search query
      const apiUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
  
      // Make a GET request to the API using the fetch API
      const response = await fetch(apiUrl);
  
      // Check if the request was successful
      if (response.ok) {
        const cardData = await response.json();
  
        // Check if the card exists
        if (cardData.object === 'card') {
          const cardType = cardData.type_line;
  
          // Handle double-sided or modal cards with multiple faces
          if (cardData.card_faces && cardData.card_faces.length > 0) {
            const rulesText = cardData.card_faces.map((face) => face.oracle_text).join('\n');
            const cardCost = cardData.card_faces[0].mana_cost || 'Unknown'; // You might need to handle the case where cost is not available
  
            // Extract the card image URL from the response
            const cardImageUrl = cardData.image_uris.normal || 'No image available';
  
            return { rulesText, cardType, cardCost, cardImageUrl };
          } else {
            const rulesText = cardData.oracle_text || 'No rules text available';
            const cardCost = cardData.mana_cost || 'Unknown'; // You might need to handle the case where cost is not available
  
            // Extract the card image URL from the response
            const cardImageUrl = cardData.image_uris.normal || 'No image available';
  
            return { rulesText, cardType, cardCost, cardImageUrl };
          }
        } else {
          return 'Card not found';
        }
      } else {
        return 'Request to Scryfall API failed';
      }
    } catch (error) {
      return 'Error: ' + error.message;
    }
  }

    
// Function to display the card name suggestions
export function displaySuggestions(suggestions) {
    console.log('displaySuggestions function is called'); // Log a message
    const suggestionsContainer = document.getElementById("suggestionsContainer");
    suggestionsContainer.innerHTML = ""; // Clear previous suggestions

    if (suggestions.data && Array.isArray(suggestions.data) && suggestions.data.length > 0) {
        const dropdown = document.createElement("select"); // Create a dropdown element

        suggestionsContainer.appendChild(dropdown); // Add the dropdown to the container

        suggestions.data.forEach((suggestion) => {
            const option = document.createElement("option"); // Create an option element
            option.value = suggestion;
            option.textContent = suggestion;
            dropdown.appendChild(option); // Add the option to the dropdown
        });

        
        dropdown.addEventListener("change", () => {
            cardNameInput.value = dropdown.value; // Set the input value to the selected option
            suggestionsContainer.style.display = "block"; // Hide the dropdown when an option is selected
        });

        suggestionsContainer.style.display = "block"; // Show the dropdown
    } else {
        suggestionsContainer.style.display = "none"; // Hide the container when no suggestions
    }
}

export async function getCardDetails(cardName) {
  try {
    // Construct the Scryfall API URL with the card name as the search query
    const apiUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;

    // Make a GET request to the API using the fetch API
    const response = await fetch(apiUrl);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error('Request to Scryfall API failed');
    }

    const cardData = await response.json();

    // Check if the card exists
    if (cardData.object !== 'card') {
      throw new Error('Card not found');
    }

    const cardType = cardData.type_line;

    // Handle double-sided or modal cards with multiple faces
    if (cardData.card_faces && cardData.card_faces.length > 0) {
      const rulesText = cardData.card_faces.map((face) => face.oracle_text).join('\n');
      const cardCost = cardData.card_faces[0].mana_cost || 'Unknown'; // You might need to handle the case where cost is not available

      // Extract the card image URL from the response
      const cardImageUrl = cardData.image_uris.normal || 'No image available';

      return { rulesText, cardType, cardCost, cardImageUrl };
    } else {
      const rulesText = cardData.oracle_text || 'No rules text available';
      const cardCost = cardData.mana_cost || 'Unknown'; // You might need to handle the case where cost is not available

      // Extract the card image URL from the response
      const cardImageUrl = cardData.image_uris.normal || 'No image available';

      return { rulesText, cardType, cardCost, cardImageUrl };
    }
  } catch (error) {
    // You can log the error for debugging purposes
    console.error('Error fetching card details:', error);

    // Instead of returning an error message, you can throw the error
    // and let the calling code handle it
    throw error;
  }
}


export function createCardInputFields(index, name, quantity, type, cost, rulesText, cardImageUrl) {
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-main';
       
    // Generate the card input fields HTML
    const cardInputFieldsHTML = `
      <div>
      <h2 class="card-title">
        <div class="custom-number-input">
        <span class="quantity-value" data-index="${index}">${quantity || 1}</span>
          <span class="quantity-increase-decrease">
            <button class="quantity-increase">+</button>
            <button class="quantity-decrease">-</button>
          </span>
          ${name}
          <span class="delete-icon" aria-label="Delete" onclick="deleteCardInDeck(this)"></span>
        </div>
      </h2>
      </div>
      <div class="card-info">
      <img src="${cardImageUrl}" alt="Card Image" name="cardImage${index}" class="card-image"> 
        <div class="card-info-left">
          <div class="label-input-group">
            <label for="cardName${index}">Name:</label>
            <input type="text" name="cardName${index}" value="${name}" required>
          </div>
        <div class="label-input-group">
          <label for="cardCost${index}">Cost:</label>
          <input type="text" name="cardCost${index}" value="${cost}" required>
        </div>
          <div class="label-input-group">
            <label for="cardType${index}">Type:</label>
            <input type="text" name="cardType${index}" value="${type}" required>
          </div>
        </div>
        <div class="card-info-right">
          <div class="label-input-group">
            <label for="cardRulesText${index}">Rules Text:</label>
            <textarea name="cardRulesText${index}" class="rulestext-input" placeholder="Enter card rules text" rows="3">${rulesText}</textarea>
          </div>
        </div>
      </div>
      <hr class="card-divider">
    `;
  
    // Set the card info container's innerHTML to the generated HTML
    cardInfo.innerHTML = cardInputFieldsHTML;
  
    const quantityIncreaseButton = cardInfo.querySelector('.quantity-increase');
    const quantityDecreaseButton = cardInfo.querySelector('.quantity-decrease');
    const quantityValueElement = cardInfo.querySelector('.quantity-value');

    quantityIncreaseButton.addEventListener('click', () => {
        // Increment the quantity value
        quantity = parseInt(quantityValueElement.textContent) + 1;
        quantityValueElement.textContent = quantity;
    });

    quantityDecreaseButton.addEventListener('click', () => {
        // Decrement the quantity value, but ensure it doesn't go below 1
        quantity = parseInt(quantityValueElement.textContent) - 1;
        if (quantity < 1) {
            quantity = 1;
        }
        quantityValueElement.textContent = quantity;
    });
    // Create the tooltiptext element
    const tooltiptextElement = document.createElement('span');
    tooltiptextElement.className = 'tooltiptext';
    tooltiptextElement.textContent = rulesText;
  
    // Append the tooltiptext element to the tooltip span
    const tooltip = cardInfo.querySelector('.tooltip');
   // tooltip.appendChild(tooltiptextElement);  
    // Append the card info container to the card inputs container
    cardInputsContainer.appendChild(cardInfo);
    
  }
  
  