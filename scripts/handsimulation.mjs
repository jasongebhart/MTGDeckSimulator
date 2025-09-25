import {
  loadXMLDoc,
  xmlDoc,
  getSelectedItem,
  createCardImage,
  cardDraw,
  getCardNameXML,
  hideLargerCard,
  isCardOfType,
  //displayHandNew
  // extractCardInfo
  // buildCardNamesArray
} from './config.mjs';
export let cardNames = [];
export let cardInfo = {};
let totalHands = 0;
let totalMulligans = 0;

export async function startHandDraw() {
  try {
    const selectedXMLFile = getSelectedItem();

    // Load XML data for the selected deck
    const deckData = await loadXMLDoc(selectedXMLFile);

    // Build Deck Information Object
    const deckInformation = getCardNameXML(deckData);

    // Assign deck information to global variables
    // cardNames is an array of card names.
    // CardInfo represents the structure of the deck in an object.
    // cardInfo[name] = {
    //	quantity: 0,
    //	type: type,
    // };
    cardNames = deckInformation.cardNames;
    cardInfo = deckInformation.cardInfo;
    const totalLandsInDeck = countCardsByType(cardInfo, 'land');

    console.log('Deck Size:', cardNames.length); // Total number of cards
    console.log('Populated cardNames:', cardNames); // Array of card names
    console.log('Total Lands', totalLandsInDeck); // Array of card names

    // Simulate card draw
    const cardsToDraw = 7;
    const handInformation = cardDraw(cardNames, cardInfo, cardsToDraw);
    const { spells, lands } = handInformation;

    // Display hand and update deck size
    createHandSection(spells, lands);

    totalHands++;
    const xmlString = await loadXMLDoc('./xml/mulligan.xml');
    const expectedMulliganRate = getMulliganRate(xmlString, totalLandsInDeck);
    const formattedMulliganRate = formatPercentage(expectedMulliganRate);

    console.log(`Formatted Mulligan Rate: ${formattedMulliganRate}`);

    const mulliganPercentage = calculateMulliganPercentage();

    updateValues(
      totalLandsInDeck,
      formattedMulliganRate,
      totalHands,
      totalMulligans,
      mulliganPercentage
    );

    // Fetch and display mulligan statistics
    //getMulliganStats();
  } catch (error) {
    console.error(error);
    window.alert('An error occurred while processing the simulation.');
  }
}

function countCardsByType(cardInfo, targetType) {
  let total = 0;

  for (const cardName in cardInfo) {
    const card = cardInfo[cardName];
    if (isCardOfType(card, targetType)) {
      total += card.quantity;
    }
  }

  console.log(`${targetType}: ${total}`);
  return total;
}

function getDeckName() {
  const deckListName = xmlDoc.getElementsByTagName('Decklist')[0].getAttribute('Deck');
  return deckListName;
}

function createTotalsContainer(lands, spells) {
  const totalsContainer = document.createElement('div');
  totalsContainer.classList.add('lands-spells-container');

  const totalLandsElement = document.createElement('div');
  totalLandsElement.textContent = `Total Lands: ${lands.length}`;

  const totalSpellsElement = document.createElement('div');
  totalSpellsElement.textContent = `Total Spells: ${spells.length}`;

  totalsContainer.appendChild(totalLandsElement);
  totalsContainer.appendChild(totalSpellsElement);

  return totalsContainer;
}

function createOnTheDrawSection(spells, lands) {
  const container = document.createElement('div'); // Create a container div
  container.classList.add('onthedraw'); // Apply CSS styling to the container

  // Create elements for lands and spells in the hand
  const landsHandElement = document.createElement('section');
  landsHandElement.id = 'section_lands'; // Assign an ID to the lands section
  landsHandElement.classList.add('flex');

  const spellsHandElement = document.createElement('section');
  spellsHandElement.id = 'section_spells'; // Assign an ID to the spells section
  spellsHandElement.classList.add('flex');

  // Populate lands and spells elements for the hand (4 cards for "On The Draw")
  for (let i = 0; i < spells.length; i++) {
    const cardDrawn = spells[i];
    createCard(cardDrawn, spellsHandElement);
  }
  for (let i = 0; i < lands.length; i++) {
    const cardDrawn = lands[i];
    createCard(cardDrawn, landsHandElement);
  }

  // Append lands and spells elements for "On The Draw" to the section
  container.appendChild(landsHandElement);
  container.appendChild(spellsHandElement);

  // Create totals container
  const totalsContainer = createTotalsContainer(lands, spells);

  // Append the totals container to the line
  container.appendChild(totalsContainer);

  // Return the section element containing "On The Draw" cards
  return container;
}

function createHandSection(spells, lands) {
  const container = document.createElement('div'); // Create a container div
  container.classList.add('hand-container'); // Apply CSS styling to the container

  const line = document.createElement('div');
  line.classList.add('hand-line'); // You can style this class in CSS

  // Create elements for lands and spells in the hand
  const landsHandElement = document.createElement('section');
  landsHandElement.id = 'section_lands'; // Assign an ID to the lands section
  landsHandElement.classList.add('flex');

  const spellsHandElement = document.createElement('section');
  spellsHandElement.id = 'section_spells'; // Assign an ID to the spells section
  spellsHandElement.classList.add('flex');

  // Populate lands and spells elements for the hand (7 cards)
  for (let i = 0; i < spells.length; i++) {
    const cardDrawn = spells[i];
    createCard(cardDrawn, spellsHandElement);
  }
  for (let i = 0; i < lands.length; i++) {
    const cardDrawn = lands[i];
    createCard(cardDrawn, landsHandElement);
  }
  if (lands.length < 2) {
    totalMulligans++;
  }
  // Append lands and spells elements for the hand to the line
  line.appendChild(landsHandElement);
  line.appendChild(spellsHandElement);
  container.appendChild(line);

  // Create totals container
  const totalsContainer = createTotalsContainer(lands, spells);

  // Append the totals container to the line
  container.appendChild(totalsContainer);

  // Simulate On The Draw
  const theDraw = cardDraw(cardNames, cardInfo, 4);
  // Display hand and update deck size
  const onthedraw = createOnTheDrawSection(theDraw.spells, theDraw.lands);
  container.appendChild(onthedraw);

  // Append the container to the appropriate parent element
  const sectionHand = document.getElementById('section_hand');
  sectionHand.appendChild(container);
  sectionHand.insertBefore(container, sectionHand.firstChild);
  // Highlight the first child element
  const firstHandContainer = sectionHand.querySelector('.hand-container:first-child');
  if (firstHandContainer) {
    firstHandContainer.style.backgroundColor = '#fbf4af';
  }

  // Select all elements with the class "hand-container"
  const handContainers = document.querySelectorAll('.hand-container');

  // Remove the background color from elements that are no longer the first child
  handContainers.forEach(container => {
    if (container !== container.parentNode.firstChild) {
      container.style.backgroundColor = ''; // Remove the background color
    }
  });
}

function calculateMulliganPercentage() {
  if (totalHands === 0) {
    return 0;
  }
  const percentage = (totalMulligans / totalHands) * 100;
  return percentage;
}

// Function to update the HTML elements with the calculated values
function updateValues(
  totalLandsInDeck,
  formattedMulliganRate,
  totalHands,
  totalMulligans,
  mulliganPercentage
) {
  const totalLandsInDeckElement = document.getElementById('totalLandsInDeck');
  const currentMulliganRateElement = document.getElementById('currentMulliganRate');
  const handsValueElement = document.getElementById('TotalHandsDrawn');
  const mulligansValueElement = document.getElementById('TotalMulligans');
  const mulliganPercentageValueElement = document.getElementById('MulliganPercentage');

  totalLandsInDeckElement.textContent = totalLandsInDeck;
  currentMulliganRateElement.textContent = formattedMulliganRate;
  handsValueElement.textContent = totalHands;
  mulligansValueElement.textContent = totalMulligans;
  mulliganPercentageValueElement.textContent = `${mulliganPercentage.toFixed(0)}%`;
}

function createCard(card, parentElement) {
  // Create card element and set attributes/content based on card data
  const cardElement = document.createElement('div');
  cardElement.classList.add('card'); // You can style this class in CSS

  // Create a card image element
  const cardImage = createCardImage(card); // Assuming createCardImage is a function that returns an image element
  cardElement.appendChild(cardImage);

  // Append the card element to the appropriate parent element
  parentElement.appendChild(cardElement);

  // Call setupCardHoverBehavior to add hover behavior to this card
  setupCardHoverBehavior(cardElement, card);
}

function getMulliganRate(xmlDoc, totalLands) {
  // Find the "Land" elements in the XML document
  const landElements = xmlDoc.getElementsByTagName('Land');

  // Log the input parameter for debugging
  console.log('getMulliganRate parameter totalLands:', totalLands);

  // Iterate through the "Land" elements
  for (let i = 0; i < landElements.length; i++) {
    const landElement = landElements[i];
    const quantityElement = landElement.getElementsByTagName('Quantity')[0];
    const zeroElement = landElement.getElementsByTagName('Zero')[0];
    const oneElement = landElement.getElementsByTagName('One')[0];

    // Check if all required elements are found within the current "Land" element
    if (quantityElement && zeroElement && oneElement) {
      // Extract the quantity of land from the "Quantity" element
      const intLandQuantity = parseInt(quantityElement.textContent);

      // Check if the extracted quantity matches the desired totalLands
      if (intLandQuantity === totalLands) {
        // Extract the values of "Zero" and "One" elements and calculate the mulliganRate
        const intZero = parseFloat(zeroElement.textContent);
        const intOne = parseFloat(oneElement.textContent);
        const mulliganRate = intZero + intOne;

        // Return the calculated mulliganRate
        console.log('mulliganRate:', mulliganRate);
        return mulliganRate;
      }
    }
  }

  // If mulligan rate is not found for the specified totalLands, return an error message
  return `Mulligan rate not found for ${totalLands} lands.`;
}

export async function startMulliganCheck() {
  try {
    const mulliganXml = await loadXMLDoc('./xml/mulligan.xml');
    if (mulliganXml) {
      displayMulliganChart(mulliganXml);
    } else {
      // Handle the case where loading the XML failed
      console.error('Failed to load mulligan data.');
    }
  } catch (error) {
    // Handle any other unexpected errors
    console.error('An error occurred while processing mulligan data:', error);
  }
}

function displayMulliganChart(mulliganXml) {
  // Get the Mulligan element from the XML
  const mulliganList = mulliganXml.getElementsByTagName('Mulligan')[0];

  // Define the elements and their corresponding IDs
  const mulliganElements = [
    'Nineteen',
    'Twenty',
    'TwentyOne',
    'TwentyTwo',
    'TwentyThree',
    'TwentyFour',
    'TwentyFive',
    'TwentySix',
    'TwentySeven',
    'TwentyEight',
    'TwentyNine',
    'Thirty',
  ];

  // Calculate the array length once
  const numElements = mulliganElements.length;

  // Iterate through the mulliganElements array
  for (let j = 0; j < numElements; j++) {
    const elementId = mulliganElements[j];
    const tdElement = document.getElementById(elementId);

    if (tdElement) {
      // Retrieve Zero and One values
      const zeroData = mulliganList.getElementsByTagName('Zero')[j].firstChild.data;
      const oneData = mulliganList.getElementsByTagName('One')[j].firstChild.data;

      console.log(`Zero data: "${zeroData}", One data: "${oneData}"`);

      const zeroValue = parseFloat(zeroData);
      const oneValue = parseFloat(oneData);

      // Calculate total percentage
      const totalPercentage = zeroValue + oneValue;

      // Set the inner HTML of the corresponding TD element
      tdElement.textContent = formatPercentage(totalPercentage);
    }
  }
}

function formatPercentage(number) {
  if (typeof number !== 'number' || isNaN(number)) {
    // Check if the input is not a valid number
    return 'Invalid Input';
  }

  // Multiply by 100 to convert to a percentage and use toFixed(0) for rounding to the nearest integer
  return `${(number * 1).toFixed(0)}%`;
}

function setupCardHoverBehavior(carddiv, cardName) {
  const hoverSpot = document.createElement('div');
  hoverSpot.classList.add('hover-spot');

  // Function to show the hover spot
  function showHoverSpot() {
    hoverSpot.style.display = 'block';
    carddiv.style.backgroundColor = '#f0f0f0'; // Change card background color on hover
  }

  // Function to hide the hover spot
  function hideHoverSpot() {
    hoverSpot.style.display = 'none';
    carddiv.style.backgroundColor = ''; // Reset card background color on mouse leave
  }

  // Add event listeners to show/hide the hover spot
  carddiv.addEventListener('mouseenter', showHoverSpot);
  carddiv.addEventListener('mouseleave', hideHoverSpot);

  // Add event listener to the card to show the larger image on hover
  carddiv.addEventListener('mouseenter', () => {
    // Call the function to show the larger card image
    showLargerCard(cardName);
  });

  carddiv.addEventListener('mouseleave', () => {
    // Hide the larger card image when the mouse leaves the card
    hideLargerCard('right-sidebar-hover-image');
  });

  // Append the hover spot to the card item
  carddiv.appendChild(hoverSpot);
}

export function showLargerCard(cardName) {
  // Get the right-sidebar-larger-card container
  const rightSidebarLargerCardContainer = document.getElementById('right-sidebar-hover-image');

  // Clear any previous content by creating a new container
  const newContentContainer = document.createElement('div');

  // Implement your logic to display the larger version of the card
  // This can be done by creating an image element for the larger card
  const largerCardImage = createCardImage(cardName);

  // Append the larger card image to the new content container
  newContentContainer.appendChild(largerCardImage);

  // Replace the old content with the new content
  //rightSidebarLargerCardContainer.innerHTML = "";
  rightSidebarLargerCardContainer.appendChild(newContentContainer);
}

// Usage:
// Pass the card div and cardName to the function to set up hover behavior
//const carddiv = document.getElementById("your-card-div-id");
//const cardName = "Card Name"; // Replace with the actual card name
//setupCardHoverBehavior(carddiv, cardName);
//
