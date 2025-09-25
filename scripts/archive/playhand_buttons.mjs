import { loadXMLDoc, xmlDoc } from './config.mjs';
export let cardNames = [];
export let cardInfo = {};
//var cardNames = [];
export var allcardTypes = [
  'Creatures',
  'Lands',
  'Spells',
  'Enchantments',
  'Artifacts',
  'Planeswalkers',
  'Sorceries',
  'Instants',
  'Tribal',
  'Basic Land',
  'Legendary Land',
  'Legendary Creature',
  'Legendary Artifact',
  'Legendary Enchantment',
  'Legendary Planeswalker',
  'Legendary Sorcery',
  'Snow Land',
  'Snow Creature',
  'Snow Artifact',
  'Snow Enchantment',
  'Snow Instant',
  'Snow Sorcery',
  'Snow Tribal',
  'Snow Planeswalker',
  'Snow Legendary Land',
  'Snow Legendary Creature',
  'Snow Legendary Artifact',
  'Snow Legendary Enchantment',
  'Snow Legendary Planeswalker',
  'Snow Legendary Sorcery',
  'Snow Basic Land',
  'Snow Legendary Snow Creature',
  'Snow Legendary Snow Artifact',
  'Snow Legendary Snow Enchantment',
  'Snow Legendary Snow Planeswalker',
  'Snow Legendary Snow Sorcery',
  'Snow Legendary Snow Basic Land',
  'Snow Legendary Snow Legendary Creature',
  'Snow Legendary Snow Legendary Artifact',
  'Snow Legendary Snow Legendary Enchantment',
  'Snow Legendary Snow Legendary Planeswalker',
  'Snow Legendary Snow Legendary Sorcery',
  'Snow Legendary Snow Legendary Basic Land',
];
export var basiccardTypes = ['Creatures', 'Land', 'Spells'];
let deckSize;

// Function to start simulating hand draw
export async function startSimulateHandDraw() {
  try {
    const selectedXMLFile = getSelectedItem();

    // Clear sections
    clearGameSections();

    // Load XML data
    await loadXMLDoc(selectedXMLFile); // Await the async function

    // Retrieve deck information
    const deckInformation = getCardNames();

    // Assign deck information to global variables
    cardNames = deckInformation.cardNames;
    cardInfo = deckInformation.cardInfo;

    //const { cardNames, cardInfo } = deckInformation;
    console.log('Deck Size:', cardNames.length); // Total number of cards
    console.log('Populated cardNames:', cardNames); // Array of card names

    // Simulate card draw
    const cardsToDraw = 7;
    const handInformation = cardDraw(cardNames, cardInfo, cardsToDraw);
    const { spells, lands } = handInformation;

    // Display hand and update deck size
    displayHandAndDeck(spells, lands, cardNames);
  } catch (error) {
    console.error(error);
    window.alert('An error occurred while loading XML data.');
  }
}

// Clear the library section before populating
export function startLibrarySearch(cardType) {
  // Check if the section with the specified ID exists
  if (document.getElementById('section_library-content')) {
    // If it exists, then delete it
    deleteSection('section_library-content');
  } else {
    // If it doesn't exist, you can handle it accordingly or log a message
    console.log("The section 'section_library-content' does not exist.");
  }

  //deleteSection("librarypopup");

  // Define the card types and their corresponding buttons
  const cardTypes = {
    Spells: ['instant', 'sorcery'],
    Creatures: ['creature'],
    Planeswalkers: ['planeswalker'],
    Artifacts: ['artifact'],
    Enchantments: ['enchantment'],
    Land: ['land'],
  };

  const selectedCardTypes = cardTypes[cardType];

  if (!selectedCardTypes) {
    console.error('Invalid card type:', cardType);
    return;
  }

  console.log('Looking for card types:', selectedCardTypes.join(', '));

  const filteredCards = filterCardsByTypesAndNames(cardInfo, selectedCardTypes);
  console.log('filteredCards:', filteredCards.length);
  // Check if any cards of the specified type were found
  if (!filteredCards || Object.keys(filteredCards).length === 0) {
    console.log(`No cards of the type ${selectedCardTypes}were found`);
    //displayNoCardsFoundMessage(selectedCardTypes);
    //const libraryPopup = document.getElementById("libraryPopup");
    // Clear the content by removing all child nodes
    //libraryPopup.innerHTML = '';
    //.style.display = "none"; // Hide the popup
    //deleteSection("libraryPopup");
    //closePopup("libraryPopup");
    displayNoCardsMessage(document.getElementById('libraryPopup'));
    libraryPopup.style.display = 'flex';
    return;
  } else {
    // Create card items in the library section
    for (const cardName in filteredCards) {
      const card = cardName; // Access the card info from cardInfo
      console.log('name:', cardName);
      const toLocation = 'library';
      const fromLocation = 'librarypopup';
      //createCardItemInPopup(cardName, toLocation, fromLocation); // Pass the libraryPopup as the container
      createCardInPopup(cardName, toLocation, fromLocation);
    }
    libraryPopup.style.display = 'flex'; // Show the popup
  }
}

// Helper function to filter cards based on types and cardNames

function openLibraryPopup() {
  // Get the existing libraryPopup element
  const libraryPopup = document.getElementById('libraryPopup');

  // Check if the section with the specified ID exists
  if (document.getElementById('section_library-content')) {
    // If it exists, then delete it
    deleteSection('section_library-content');
  } else {
    // If it doesn't exist, you can handle it accordingly or log a message
    console.log("The section 'section_library-content' does not exist.");
  }

  // Create a close button for the popup
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => {
    // Close the popup when the close button is clicked
    libraryPopup.style.display = 'none'; // Hide the popup
  });

  // Create card items in the popup
  cardNames.forEach(cardName => {
    const toLocation = 'library';
    const fromLocation = 'librarypopup';
    createCardInPopup(cardName, toLocation, fromLocation);
  });
  libraryPopup.appendChild(closeButton);
  // Show the libraryPopup and adjust its size
  libraryPopup.style.display = 'flex'; // Display the popup
}

// Modify viewEntireLibrary to open the popup
export function viewEntireLibrary() {
  // Open the popup with card images
  openLibraryPopup();

  // Update the deck size
  setDeckSize(cardNames.length);
}

function filterCardsByTypesAndNames(cardInfo, cardTypes) {
  const filteredCards = {};

  for (const cardName of cardNames) {
    if (cardInfo.hasOwnProperty(cardName)) {
      const card = cardInfo[cardName];
      if (cardTypes.includes(card.type)) {
        filteredCards[cardName] = card;
      }
    }
  }

  return filteredCards;
}

export function startDrawOneCard(cardNames, cardInfo) {
  //deleteSection("section_library");
  const cardsToDraw = 1;
  const handInformation = cardDraw(cardNames, cardInfo, 1);
  const { spells, lands } = handInformation;
  console.log('Spells:', spells);
  displayHand(spells, lands);
  setDeckSize(cardNames.length);
}

function clearGameSections() {
  const sectionIdsToClear = [
    'section_spells',
    'section_lands',
    'section_battlefield_cards',
    'section_graveyard',
  ];

  sectionIdsToClear.forEach(sectionId => {
    if (document.getElementById(sectionId)) {
      deleteSection(sectionId);
    }
  });
}

function displayHandAndDeck(hand, lands, cardNames) {
  displayHand(hand, lands);
  setDeckSize(cardNames.length);
}

function deleteSection(secDelete) {
  document.getElementById(secDelete).textContent = '';
}

function setDeckSize(deckSize) {
  document.getElementById('deckSize').innerHTML = `(${deckSize})`;
}

function getSelectedItem() {
  const len = document.formDecks.selectDeck.length;
  let i = 0;
  let XMLFile = 'none';
  for (i = 0; i < len; i++) {
    if (document.formDecks.selectDeck[i].selected) {
      XMLFile = document.formDecks.selectDeck[i].value;
    }
  }
  return XMLFile;
}

function extractCardInfo(deckList) {
  const cardInfo = {};

  for (const card of deckList.getElementsByTagName('Card')) {
    const name = card.getElementsByTagName('Name')[0].textContent;
    const quantity = parseInt(card.getElementsByTagName('Quantity')[0].textContent);
    const type = card.getElementsByTagName('Type')[0].textContent.toLowerCase();

    console.log('Name:', name);
    console.log('Quantity:', quantity);
    console.log('Type:', type);

    if (!cardInfo[name]) {
      cardInfo[name] = {
        quantity: 0,
        type: type,
      };
    }
    cardInfo[name].quantity += quantity;
  }
  const totalCardObjects = Object.keys(cardInfo).length;
  console.log('Total Card Objects:', totalCardObjects);

  const totalLands = Object.values(cardInfo).reduce((sum, card) => {
    return sum + (card.type === 'land' ? card.quantity : 0);
  }, 0);

  console.log('Total Lands:', totalLands);
  return cardInfo;
}

function buildCardNamesArray(cardInfo) {
  const cardNames = [];

  for (const cardName in cardInfo) {
    const quantity = cardInfo[cardName].quantity;
    cardNames.push(...Array(quantity).fill(cardName)); // Push the name multiple times based on quantity
  }
  console.log('Deck Size:', cardNames.length);
  return cardNames;
}

function getCardNames() {
  const deckList = xmlDoc.getElementsByTagName('Decklist')[0];
  const cardInfo = extractCardInfo(deckList);
  const cardNames = buildCardNamesArray(cardInfo);

  return {
    cardNames,
    cardInfo,
  };
}

function cardDraw(cardNames, cardInfo, cardsToDraw) {
  const initialDeckSize = cardNames.length; // Store the initial deck size
  const spells = [];
  const lands = [];
  console.log('card To Draw:', cardsToDraw);
  console.log('initialDeckSize in cardDraw:', initialDeckSize);

  for (let i = 0; i < cardsToDraw; i++) {
    const randomIndex = Math.floor(Math.random() * (initialDeckSize - i)); // Use initialDeckSize here
    const drawnCard = cardNames.splice(randomIndex, 1)[0];
    const drawnType = cardInfo[drawnCard].type.toLowerCase();
    console.log('drawnCard:', drawnCard);
    console.log('drawnType:', drawnType);

    if (drawnType === 'land') {
      lands.push(drawnCard);
    } else {
      spells.push(drawnCard);
    }
  }

  return {
    spells,
    lands,
  };
}

function displayHand(spells, lands) {
  for (let i = 0; i < spells.length; i++) {
    const cardDrawn = spells[i];
    const toLocation = 'spells';
    const fromLocation = 'none';
    createCardAtSection(cardDrawn, toLocation, fromLocation);
  }

  for (let i = 0; i < lands.length; i++) {
    const cardDrawn = lands[i];
    const toLocation = 'lands';
    const fromLocation = 'none';
    createCardAtSection(cardDrawn, toLocation, fromLocation);
  }
}

export function startLibraryDrawAll() {
  // Check if the section with the specified ID exists
  if (document.getElementById('section_library-content')) {
    // If it exists, then delete it
    deleteSection('section_library-content');
  } else {
    // If it doesn't exist, you can handle it accordingly or log a message
    console.log("The section 'section_library-content' does not exist.");
  }

  // Loop through each card in cardNames and create a small image
  cardNames.forEach(cardName => {
    const toLocation = 'library-content';
    const fromLocation = 'library-content';
    createCardAtSection(cardName, toLocation, fromLocation);
  });

  // Update the deck size
  setDeckSize(cardNames.length);
}

function searchLibraryAll() {
  let arrlibraryAll = new Array();
  arrlibraryAll = cardNames.slice(0);

  //Simulate card drawing;
  let cardDrawn = '';
  const randomnumber = Math.floor(Math.random() * deckSize);
  //If the library Size is 60 then the randomnumber will equal a number from 0 to 59
  cardDrawn = arrlibraryAll[randomnumber];
  console.log('cardDrawn:', cardDrawn);
  return cardDrawn;
}

function addToBattlefieldFromGraveyard(cardNames, cardDrawn) {
  //Remove card from hand and add to card effect draw
  //alert(cardDrawn);
  const toLocation = 'battlefield_content';
  const FromLocation = 'graveyard';
  createCardAtSection(cardDrawn, toLocation, FromLocation);
  //deleteCellFromGraveyard(cardDrawn);
  return;
}

function addToBattlefieldFromSpells(cardNames, cardDrawn) {
  //alert(cardDrawn);
  //Remove card from hand and add to card effect draw
  const toLocation = 'battlefield_content';
  const FromLocation = 'spells';
  createCardAtSection(cardDrawn, toLocation, FromLocation);
  //deleteCellFromHand(cardDrawn);
  return;
}

function addToBattlefieldFromLand(cardNames, cardDrawn) {
  //alert(cardDrawn);
  //Remove card from hand and add to card effect draw
  const toLocation = 'battlefield_content';
  const FromLocation = 'lands';
  createCardAtSection(cardDrawn, toLocation, FromLocation);
  //deleteCellFromHand(cardDrawn);
  return;
}

function addToHand(cardNames, cardDrawn) {
  const index = cardNames.indexOf(cardDrawn);

  if (index !== -1) {
    deckSize -= 1; // Decrease deck size
    // Remove card from library
    cardNames.splice(index, 1);
    addToHandFromLibrary(cardDrawn);
    // Optionally, update UI elements
    deleteSection('section_library');
    setDeckSize(cardNames.length);
  }
}

function addToHandFromLibrary(cardDrawn) {
  //alert(intDrawTypes);
  cardDrawn = cardDrawn.replace(/,\s*$/, '');
  //cardDrawn = cardDrawn.replace(',','');
  var cardDrawn = new String(cardDrawn);
  const toLocation = 'spells';
  const FromLocation = 'library';
  createCardAtSection(cardDrawn, toLocation, FromLocation);
  return;
}

function removeCardFromLocation(cardDrawn, FromLocation) {
  switch (FromLocation) {
    case 'Hand':
      deleteCardFromHand(cardDrawn);
      break;

    case 'spells':
      deleteCardFromSpells(cardDrawn);
      break;

    case 'lands':
      deleteCardFromLands(cardDrawn);
      break;

    case 'battlefield_content':
      deleteCardFromBattlefield(cardDrawn);
      break;

    case 'graveyard':
      deleteCardFromGraveyard(cardDrawn);
      break;

    case 'library':
      //deleteCardFromLibrary(cardDrawn);
      break;

    default:
  }
}

function createCardImage(cardDrawn, className) {
  const image = document.createElement('img');
  image.src = `/assets/MagicImages/${cardDrawn}.jpg`;

  // Check if className is provided and not empty, then set it
  if (className && className.trim() !== '') {
    image.className = className;
  } else {
    // If className is not provided or empty, you can set a default class here
    image.className = 'image-preview';
  }

  image.title = cardDrawn;
  image.style.cssText = 'display:block;text-align:center;';
  //image.alt="alt Hello";
  return image;
}

function createCardAtSection(cardName, toLocation, fromLocation) {
  if (fromLocation !== 'none') {
    //deleteCard(cardName, fromLocation);
  }
  return createCardItem(cardName, toLocation);
}

function getSectionFromCardId(cardId) {
  // Split the cardId by underscores to get the parts
  const parts = cardId.split('_');
  console.log('parts:', parts);
  // The section information is typically in the second part of the ID
  // (e.g., div1_hand_cardName => "hand")
  if (parts.length >= 2) {
    return parts[1];
  }

  // Return null if the ID format doesn't match expectations
  return null;
}

function moveCard(cardDrawn, toLocation, fromLocation) {
  // Determine the destination section based on the 'toLocation' parameter
  let destinationSection;

  if (toLocation === 'hand') {
    // Lookup the card type from the global 'cardInfo'
    const card = cardInfo[cardDrawn];

    // Check if the card type exists and proceed accordingly
    if (card) {
      //if (card.type === "Instant" || card.type === "Sorcery") {
      console.log('card type:', card.type);
      if (card.type === 'land') {
        destinationSection = 'lands';
      } else {
        destinationSection = 'spells';
      }
    } else {
      console.error(`Card "${cardDrawn}" not found in cardInfo.`);
      return;
    }
  } else {
    // Handle other locations if needed
    destinationSection = toLocation;
  }

  if (!destinationSection) {
    console.error(`Destination section "${toLocation}" not found.`);
    return;
  }

  // Remove card from 'fromLocation' and add to 'destinationSection'
  console.log('cardDrawn:', cardDrawn);
  console.log('fromLocation:', fromLocation);
  if (fromLocation === 'library') {
    // Remove the card from 'cardNames' by name
    const cardIndex = cardNames.indexOf(cardDrawn);
    if (cardIndex !== -1) {
      cardNames.splice(cardIndex, 1);
      console.log(`Card "${cardDrawn}" removed from 'cardNames'.`);
      setDeckSize(cardNames.length);
    } else {
      console.error(`Card "${cardDrawn}" not found in 'cardNames'.`);
    }
  }

  // Create the card element in the destination section
  createCardAtSection(cardDrawn, destinationSection);

  // Delete the card from the 'fromLocation' (if not library)
  if (fromLocation !== 'library') {
    deleteCard(cardDrawn, fromLocation);
  }
}

function deleteCard(cardDrawn, location) {
  console.log('cardDrawn:', cardDrawn);
  console.log('location:', location);
  const card = document.getElementById(`div1_${location}_${cardDrawn}`);

  if (card) {
    card.remove();
  } else {
    console.warn(`Card ${cardDrawn} not found in ${location}.`);
  }
}

function createCardItem(cardName, toLocation) {
  const section = document.getElementById(`section_${toLocation}`);
  if (!section) {
    console.error(`Section "${toLocation}" not found.`);
    return;
  }

  const carddiv = document.createElement('div');
  carddiv.id = `div1_${toLocation}_${cardName}`;
  carddiv.classList.add('card');

  // Create a card image element
  const cardimage = createCardImage(cardName);
  const fromsection = getSectionFromCardId(carddiv.id);
  cardimage.addEventListener('click', () => {
    // When the card is clicked, move it to the battlefield
    moveCard(cardName, 'battlefield-content', fromsection);
  });
  carddiv.appendChild(cardimage);

  // Create a container for the hover spot
  const hoverSpot = createHoverSpot();

  // Define menu options
  const menuOptions = [
    { label: 'Move to Hand', action: 'hand' },
    { label: 'Move to Graveyard', action: 'graveyard' },
    { label: 'Move to Exile', action: 'exile' },
    { label: 'Move to Library', action: 'library' },
    { label: 'Move to Battlefield', action: 'battlefield-content' },
    { label: 'Preview', action: 'preview' },
  ];

  // Create menu options and event listeners
  menuOptions.forEach(({ label, action }) => {
    const option = createHoverMenuOption(label, action);

    option.addEventListener('mouseenter', () => {
      option.style.backgroundColor = '#ddd';
    });

    option.addEventListener('mouseleave', () => {
      option.style.backgroundColor = '';
    });
    // Add a click event listener to show the larger card on click
    option.addEventListener('click', () => {
      // For other actions, move the card
      const section = getSectionFromCardId(carddiv.id);
      moveCard(cardName, action, section);
    });
    hoverSpot.appendChild(option);
  });

  // Hide the hover spot initially
  hoverSpot.style.display = 'none';

  // Add event listener to the card to show/hide the hover spot
  carddiv.addEventListener('mouseenter', () => {
    hoverSpot.style.display = 'block';
    carddiv.style.backgroundColor = '#f0f0f0'; // Change card background color on hover
  });

  carddiv.addEventListener('mouseleave', () => {
    hoverSpot.style.display = 'none';
    carddiv.style.backgroundColor = ''; // Reset card background color on mouse leave
  });

  // Add event listener to the card to show the larger image on hover
  carddiv.addEventListener('mouseenter', () => {
    // Call the function to show the larger card image
    showLargerCard(cardName);
  });

  carddiv.addEventListener('mouseleave', () => {
    // Hide the larger card image when the mouse leaves the card
    hideLargerCard();
  });

  // Append the hover spot to the card item
  carddiv.appendChild(hoverSpot);

  // Append the card item to the section
  section.appendChild(carddiv);
}

// Helper function to create a hover menu option
function createHoverMenuOption(label, action) {
  const option = document.createElement('div');
  option.classList.add('hover-menu-option');
  option.textContent = label;
  option.setAttribute('data-action', action);
  return option;
}

function createHoverSpot() {
  const hoverSpot = document.createElement('div');
  hoverSpot.classList.add('hover-spot');
  // Define width and height here if needed
  return hoverSpot;
}

// Function to show the larger card image
function showLargerCard(cardName) {
  hideLargerCard();
  // Implement your logic to display the larger version of the card
  // This can be done by creating a modal or a separate container

  // Example: create a modal with the larger card image
  const largerCardImage = createCardImage(cardName);
  const modal = document.createElement('div');
  modal.classList.add('modal');

  // Add a close button to the modal (optional)
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.classList.add('close-button'); // Add a CSS class for styling

  // Add a click event listener to close the modal on button click
  closeButton.addEventListener('click', () => {
    hideLargerCard();
  });

  modal.appendChild(closeButton);
  modal.appendChild(largerCardImage);

  // Append the modal to the body
  document.body.appendChild(modal);
}

// Function to hide the larger card image
function hideLargerCard() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove(); // Remove the modal from the DOM
  }
}

// Function to generate the source for the larger card image
function getLargerCardImageSrc(cardName) {
  // Implement your logic to get the source for the larger card image
  // Return the URL of the larger card image based on the cardName
  return `/path/to/larger/card/images/${cardName}.jpg`;
}

function closePopup(container) {
  const popupContainer = document.getElementById(container);

  // Hide the popup
  popupContainer.style.display = 'none';
}

// Step 1: Create a popup container element
const libraryPopup = document.getElementById('libraryPopup');

// Step 2: Modify the createCardAtSection function
function createCardInPopup(cardName, toLocation, fromLocation) {
  if (fromLocation !== 'none') {
    removeCardFromLocation(cardName, fromLocation);
  }
  return createCardItemInPopup(cardName, toLocation, libraryPopup); // Pass the libraryPopup as the container
}

function displayNoCardsMessage(container) {
  // Create a message element
  const message = document.createElement('p');
  message.textContent = 'No cards found.';

  // Append the message to the container (popup)
  container.appendChild(message);
}

function createCardItemInPopup(cardName, toLocation, container) {
  console.log('cardName', cardName);
  console.log('toLocation', toLocation);

  const carddiv = document.createElement('div');
  carddiv.id = `div1_${toLocation}_${cardName}`;
  carddiv.classList.add('card');

  // Create a card image element
  const cardimage = createCardImage(cardName, 'image-large');
  const fromsection = getSectionFromCardId(carddiv.id);
  cardimage.addEventListener('click', () => {
    // When the card is clicked, move it to the battlefield
    moveCard(cardName, 'battlefield-content', fromsection);
    // Remove the popup from the DOM
    //removePopup(container);
    closePopup('libraryPopup');
  });
  carddiv.appendChild(cardimage);

  // Define menu options
  const menuOptions = [
    { label: 'Move to Hand', action: 'hand' },
    { label: 'Move to Graveyard', action: 'graveyard' },
    { label: 'Move to Exile', action: 'exile' },
    { label: 'Move to Library', action: 'library' },
    { label: 'Move to Battlefield', action: 'battlefield-content' },
    { label: 'Preview', action: 'preview' },
  ];

  // Create a container for the hover menu
  const hoverMenu = document.createElement('div');
  hoverMenu.classList.add('hover-menu');

  // Create menu options and event listeners
  menuOptions.forEach(({ label, action }) => {
    const option = createHoverMenuOption(label, action);

    option.addEventListener('mouseenter', () => {
      option.style.backgroundColor = '#ddd';
    });

    option.addEventListener('mouseleave', () => {
      option.style.backgroundColor = '';
    });

    option.addEventListener('click', () => {
      // For other actions, move the card
      const section = getSectionFromCardId(carddiv.id);
      moveCard(cardName, action, section);
    });

    hoverMenu.appendChild(option);
  });

  // Hide the hover menu initially
  hoverMenu.style.display = 'none';

  // Add event listener to the card to show/hide the hover menu
  carddiv.addEventListener('mouseenter', () => {
    hoverMenu.style.display = 'block';
    carddiv.style.backgroundColor = '#f0f0f0'; // Change card background color on hover
  });

  carddiv.addEventListener('mouseleave', () => {
    hoverMenu.style.display = 'none';
    carddiv.style.backgroundColor = ''; // Reset card background color on mouse leave
  });

  // Add event listener to the card to show the larger image on hover
  carddiv.addEventListener('mouseenter', () => {
    // Call the function to show the larger card image
    showLargerCard(cardName);
  });

  carddiv.addEventListener('mouseleave', () => {
    // Hide the larger card image when the mouse leaves the card
    hideLargerCard();
  });

  carddiv.appendChild(cardimage);
  carddiv.appendChild(hoverMenu);

  container.appendChild(carddiv); // Append the card info to the container (popup)
}
