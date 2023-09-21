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

