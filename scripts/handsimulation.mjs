import {
  loadXMLDoc,
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

    // Enhanced hand analysis
    const handCards = [...spells, ...lands];
    analyzeHand(handCards, cardInfo, totalLandsInDeck);

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

  // Clear previous hands and add the new container
  const sectionHand = document.getElementById('section_hand');
  sectionHand.innerHTML = ''; // Clear all previous hands
  sectionHand.appendChild(container);
  // Highlight the current hand container
  container.style.backgroundColor = '#fbf4af';
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
  cardElement.classList.add('card-item'); // You can style this class in CSS

  // Create a wrapper for the card layout
  const cardWrapper = document.createElement('div');
  cardWrapper.classList.add('card-wrapper');

  // Create a card image element
  const cardImage = createCardImage(card);
  cardImage.classList.add('card-image');
  cardWrapper.appendChild(cardImage);

  // Create info section to the right of the image
  const cardInfoDiv = document.createElement('div');
  cardInfoDiv.classList.add('card-info');

  // Get card data
  const cardData = cardInfo[card] || {};
  const cardDatabaseEntry = cardDatabase[card] || {};

  // Add casting cost
  const castingCost = document.createElement('div');
  castingCost.classList.add('card-casting-cost');
  const cmc = cardDatabaseEntry.cmc !== undefined ? cardDatabaseEntry.cmc : 'N/A';
  castingCost.textContent = `CMC: ${cmc}`;
  cardInfoDiv.appendChild(castingCost);

  // Add card type
  const cardType = document.createElement('div');
  cardType.classList.add('card-type');
  const type = cardData.type || 'Unknown';
  cardType.textContent = `Type: ${type}`;
  cardInfoDiv.appendChild(cardType);

  // Add counters section (placeholder for now)
  const counters = document.createElement('div');
  counters.classList.add('card-counters');
  counters.textContent = 'Counters: 0';
  cardInfoDiv.appendChild(counters);

  cardWrapper.appendChild(cardInfoDiv);
  cardElement.appendChild(cardWrapper);

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

// Enhanced Hand Analysis Functions
let handChart = null;

function analyzeHand(handCards, cardInfo, totalLandsInDeck) {
  console.log('Analyzing hand:', handCards);

  // Calculate hand statistics
  const handStats = calculateHandStatistics(handCards, cardInfo);

  // Evaluate hand quality
  const handQuality = evaluateHandQuality(handStats, totalLandsInDeck);

  // Update UI with analysis
  updateHandAnalysisUI(handQuality, handStats);

  // Create hand mana curve chart
  createHandManaCurveChart(handStats.manaCurve);
}

function calculateHandStatistics(handCards, cardInfo) {
  const stats = {
    totalCards: handCards.length,
    lands: 0,
    creatures: 0,
    spells: 0,
    artifacts: 0,
    manaCurve: {},
    colors: { W: 0, U: 0, B: 0, R: 0, G: 0 },
    averageCMC: 0,
    hasEarlyPlay: false,
    hasWinCondition: false
  };

  let totalCMC = 0;
  let nonLandCards = 0;

  handCards.forEach(cardName => {
    const card = cardInfo[cardName];
    if (!card) return;

    const type = (card.type || '').toLowerCase();

    // Count by type
    if (type.includes('land')) {
      stats.lands++;
    } else if (type.includes('creature')) {
      stats.creatures++;
      nonLandCards++;
    } else if (type.includes('artifact')) {
      stats.artifacts++;
      nonLandCards++;
    } else {
      stats.spells++;
      nonLandCards++;
    }

    // Calculate CMC and mana curve
    const cmc = getCardManaCost(cardName);
    if (cmc !== null) {
      totalCMC += cmc;
      stats.manaCurve[cmc] = (stats.manaCurve[cmc] || 0) + 1;

      // Check for early plays (CMC 1-2)
      if (cmc <= 2 && !type.includes('land')) {
        stats.hasEarlyPlay = true;
      }
    }

    // Count colors based on card name
    const colors = getCardColors(cardName);
    colors.forEach(color => {
      stats.colors[color] += 1;
    });

    // Check for win conditions (creatures with power >= 3, or powerful spells)
    if (type.includes('creature') || type.includes('planeswalker')) {
      stats.hasWinCondition = true;
    }
  });

  if (nonLandCards > 0) {
    stats.averageCMC = (totalCMC / nonLandCards).toFixed(1);
  }

  return stats;
}

function evaluateHandQuality(stats, _totalLandsInDeck) {
  let score = 0;
  const issues = [];
  const strengths = [];

  // Land count evaluation (most important)
  if (stats.lands >= 2 && stats.lands <= 4) {
    score += 40;
    strengths.push(`Good land count (${stats.lands})`);
  } else if (stats.lands === 1 || stats.lands === 5) {
    score += 20;
    issues.push(`Questionable land count (${stats.lands})`);
  } else {
    score -= 20;
    issues.push(`Poor land count (${stats.lands})`);
  }

  // Early plays evaluation
  if (stats.hasEarlyPlay) {
    score += 20;
    strengths.push('Has early plays');
  } else {
    score -= 10;
    issues.push('No early plays');
  }

  // Win condition evaluation
  if (stats.hasWinCondition) {
    score += 15;
    strengths.push('Has win conditions');
  } else {
    score -= 15;
    issues.push('No clear win conditions');
  }

  // Mana curve evaluation
  if (stats.averageCMC <= 3) {
    score += 15;
    strengths.push('Good mana curve');
  } else if (stats.averageCMC > 5) {
    score -= 10;
    issues.push('High mana curve');
  }

  // Spell/creature balance
  const nonLands = stats.totalCards - stats.lands;
  if (nonLands >= 3 && nonLands <= 5) {
    score += 10;
    strengths.push('Good threat density');
  }

  // Determine overall quality
  let quality, recommendation, color;
  if (score >= 60) {
    quality = 'Excellent';
    recommendation = 'KEEP - This is a strong opening hand';
    color = '#22c55e'; // Green
  } else if (score >= 40) {
    quality = 'Good';
    recommendation = 'KEEP - This hand has good potential';
    color = '#3b82f6'; // Blue
  } else if (score >= 20) {
    quality = 'Questionable';
    recommendation = 'CONSIDER - Think carefully about keeping this hand';
    color = '#f59e0b'; // Yellow
  } else {
    quality = 'Poor';
    recommendation = 'MULLIGAN - This hand is likely too weak';
    color = '#ef4444'; // Red
  }

  return {
    quality,
    recommendation,
    color,
    score,
    issues,
    strengths
  };
}

function updateHandAnalysisUI(handQuality, _handStats) {
  // Update hand quality indicator
  const qualityIndicator = document.getElementById('hand-quality-indicator');
  if (qualityIndicator) {
    qualityIndicator.textContent = `Hand Quality: ${handQuality.quality} (Score: ${handQuality.score})`;
    qualityIndicator.style.backgroundColor = handQuality.color;
    qualityIndicator.style.color = 'white';
  }

  // Update mulligan recommendation
  const recommendationDiv = document.getElementById('mulligan-recommendation');
  if (recommendationDiv) {
    let recommendationHTML = `<strong>Recommendation:</strong> ${handQuality.recommendation}<br/>`;

    if (handQuality.strengths.length > 0) {
      recommendationHTML += `<br/><strong>✓ Strengths:</strong> ${handQuality.strengths.join(', ')}<br/>`;
    }

    if (handQuality.issues.length > 0) {
      recommendationHTML += `<br/><strong>⚠ Issues:</strong> ${handQuality.issues.join(', ')}`;
    }

    recommendationDiv.innerHTML = recommendationHTML;
  }
}

function createHandManaCurveChart(manaCurveData) {
  const canvas = document.getElementById('handManaCurveChart');
  const placeholder = document.getElementById('handCurvePlaceholder');

  console.log('Creating hand mana curve chart with data:', manaCurveData);

  if (!canvas) {
    console.log('Canvas not found for hand mana curve');
    return;
  }

  if (!manaCurveData || Object.keys(manaCurveData).length === 0) {
    console.log('No mana curve data available');
    return;
  }

  // Prepare data for chart (0-7+ mana costs)
  const data = [];
  const labels = [];
  for (let i = 0; i <= 7; i++) {
    if (i === 7) {
      // Aggregate 7+ costs
      let count = 0;
      Object.keys(manaCurveData).forEach(cost => {
        if (parseInt(cost) >= 7) {
          count += manaCurveData[cost];
        }
      });
      data.push(count);
      labels.push('7+');
    } else {
      data.push(manaCurveData[i] || 0);
      labels.push(i.toString());
    }
  }

  console.log('Chart data prepared:', { labels, data });

  // Destroy existing chart
  if (handChart) {
    handChart.destroy();
  }

  // Show canvas, hide placeholder
  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  // Create new chart
  if (typeof globalThis.Chart !== 'undefined') {
    handChart = new globalThis.Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cards in Hand',
        data: data,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Current Hand Mana Curve',
          color: '#333',
          font: {
            size: 14
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(7, Math.max(...data) + 1), // Ensure proper scale
          ticks: {
            stepSize: 1,
            color: '#666',
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#666',
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });

    console.log('Hand chart created successfully:', handChart);
  } else {
    console.warn('Chart.js library not available for hand chart');
    placeholder.textContent = 'Chart.js library not loaded';
    placeholder.style.display = 'block';
    canvas.style.display = 'none';
  }
}

// Card database with mana costs and colors for common cards
const cardDatabase = {
  'Goblin Welder': { cmc: 1, colors: ['R'] },
  'Bottle Gnomes': { cmc: 3, colors: [] },
  'Junk Diver': { cmc: 3, colors: [] },
  'Ticking Gnomes': { cmc: 4, colors: [] },
  'Rusting Golem': { cmc: 4, colors: [] },
  'Karn, Silver Golem': { cmc: 5, colors: [] },
  'Shard Phoenix': { cmc: 5, colors: ['R'] },
  'Covetous Dragon': { cmc: 5, colors: ['R'] },
  'Crater Hellion': { cmc: 6, colors: ['R'] },
  'Shivan Hellkite': { cmc: 7, colors: ['R'] },
  'Lightning Bolt': { cmc: 1, colors: ['R'] },
  'Pyroclasm': { cmc: 2, colors: ['R'] },
  'Incinerate': { cmc: 2, colors: ['R'] },
  'Disintegrate': { cmc: 1, colors: ['R'] },
  'Obliterate': { cmc: 8, colors: ['R'] },
  'Pyrokinesis': { cmc: 6, colors: ['R'] },
  'Jeweled Amulet': { cmc: 0, colors: [] },
  'Temporal Aperture': { cmc: 2, colors: [] },
  'Worn Powerstone': { cmc: 3, colors: [] },
  'Thran Dynamo': { cmc: 4, colors: [] },
  "Nevinyrral's Disk": { cmc: 4, colors: [] },
  'Mana Web': { cmc: 3, colors: [] },
  'Snake Basket': { cmc: 4, colors: [] },
  'Predator, Flagship': { cmc: 5, colors: [] },
  'Serrated Arrows': { cmc: 4, colors: [] },
  'Rejuvenation Chamber': { cmc: 3, colors: [] }
};

function getCardManaCost(cardName) {
  const cardData = cardDatabase[cardName];
  return cardData ? cardData.cmc : null;
}

function getCardColors(cardName) {
  const cardData = cardDatabase[cardName];
  return cardData ? cardData.colors : [];
}

