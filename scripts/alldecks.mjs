import { loadXMLDoc, xmlDoc } from './config.mjs';
//var xmlDoc;
//var xmlFile;

const mtgDeck = [
  './xml/BigRedMachine.xml',
  './xml/Stasis.xml',
  './xml/ZombieRenewal.xml',
  './xml/Rith.xml',
  './xml/BlackRack.xml',
  './xml/BlackDread.xml',
  './xml/Brood.xml',
  './xml/CharredDiscard.xml',
  './xml/Classic.xml',
  './xml/CreepingChill.xml',
  './xml/FireandIce.xml',
  './xml/GreenWaste.xml',
  './xml/GreenWasteOrder.xml',
  './xml/GreenWasteSakura.xml',
  './xml/Ixalan_Cannons_RedBlue.xml',
  './xml/Ixalan_Green_White.xml',
  './xml/JeskaiPioneer.xml',
  './xml/Dimir_Inverter.xml',
  './xml/JunkDiver.xml',
  './xml/KindofBlue.xml',
  './xml/Lumberjack.xml',
  './xml/MantisRiderPioneer.xml',
  './xml/Napoleon.xml',
  './xml/Nishoba.xml',
  './xml/Outpost.xml',
  './xml/PatriotBlock.xml',
  './xml/Pernicious.xml',
  './xml/Plum.xml',
  './xml/PlumGoneBlock.xml',
  './xml/RayneForest.xml',
  './xml/RedPatrol.xml',
  './xml/affinity.xml',
  './xml/hightide.xml',
  './xml/oath.xml',
  './xml/trix.xml',
  './xml/belcher.xml',
  './xml/counterbalance.xml',
  './xml/dredge.xml',
  './xml/goblins.xml',
  './xml/landstill.xml',
  './xml/BloodBraidElf.xml',
  './xml/BloodBraidEnchantress.xml',
  './xml/Patriot.xml',
  './xml/WelderGamble.xml',
  './xml/CloudpostWelder.xml',
  './xml/Welder.xml',
  './xml/TronTate.xml',
];

export async function startCompareDecks() {
  try {
    const len = mtgDeck.length;

    for (let i = 0; i < len; i++) {
      const xmlFile = mtgDeck[i];
      await loadXMLDoc(xmlFile);
      displayDeckComparison();
    }
  } catch (error) {
    console.error(error);
    window.alert('An error occurred while comparing decks.');
  }
}

async function _loadXMLDoc(XMLFile) {
  try {
    // Create a Fetch API request to load the XML file.
    const response = await fetch(XMLFile);

    if (!response.ok) {
      throw new Error('Failed to load the requested file.');
    }

    // Parse the XML response into a document.
    const xmlText = await response.text(); // Use a different variable name
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(xmlText, 'text/xml'); // Parse the XML
  } catch (error) {
    console.error(error);
    window.alert('Unable to load the requested file.');
  }
}

// This returns a string with everything but the digits removed.
function getConvertedCost(currentCost) {
  const arrConvertedCost = new Array(2);
  let intColorless = currentCost.replace(/[^\d]/g, '');
  let lenintColorless;
  if (intColorless.length > 0) {
    lenintColorless = intColorless.length;
  } else {
    lenintColorless = 0;
    intColorless = 0;
  }

  const totStrLength = currentCost.length;
  const intConvertedCost =
    parseInt(intColorless) + (parseInt(totStrLength) - parseInt(lenintColorless));
  arrConvertedCost[0] = intConvertedCost;
  arrConvertedCost[1] = intColorless;
  return arrConvertedCost;
}

function displayDeckComparison() {
  const deckList = xmlDoc.getElementsByTagName('Decklist')[0];
  const deckListName = deckList.getAttribute('Deck');
  const uniqueCards = deckList.getElementsByTagName('Name').length;
  const deckStatistics = calculateDeckStatistics(deckList);

  createDeckComparisonTable(deckListName, deckStatistics);
}

function calculateDeckStatistics(deckList) {
  const stats = {
    landCount: 0,
    creatureCount: 0,
    instantCount: 0,
    sorceryCount: 0,
    enchantmentCount: 0,
    artifactCount: 0,
    deckSize: 0,
    totalConvertedCost: 0,
  };

  for (let i = 0; i < deckList.children.length; i++) {
    const card = deckList.children[i];
    const currentQuantity = parseInt(card.querySelector('Quantity')?.textContent || 0);
    const currentTypeElement = card.querySelector('Type');
    const currentCost = card.querySelector('Cost')?.textContent || 'NA';

    if (currentTypeElement) {
      const currentType = currentTypeElement.textContent;
      // Use regular expressions to check for "Land" or "Creature" keywords
      if (/Land/i.test(currentType)) {
        stats.landCount += currentQuantity;
      } else if (/Creature/i.test(currentType)) {
        stats.creatureCount += currentQuantity;
      } else {
        switch (currentType) {
          case 'Instant':
            stats.instantCount += currentQuantity;
            break;
          case 'Sorcery':
            stats.sorceryCount += currentQuantity;
            break;
          case 'Enchantment':
            stats.enchantmentCount += currentQuantity;
            break;
          case 'Artifact':
            stats.artifactCount += currentQuantity;
            break;
        }
      }
    }

    stats.deckSize += currentQuantity;

    if (currentCost !== 'NA') {
      const convertedCost = getConvertedCost(currentCost);
      stats.totalConvertedCost += parseInt(convertedCost) * currentQuantity;
    }
  }

  return stats;
}

function __calculateDeckStatistics(deckList) {
  const stats = {
    landCount: 0,
    creatureCount: 0,
    instantCount: 0,
    sorceryCount: 0,
    enchantmentCount: 0,
    artifactCount: 0,
    deckSize: 0,
    totalConvertedCost: 0,
  };

  for (let i = 0; i < deckList.children.length; i++) {
    const card = deckList.children[i];
    const currentQuantity = parseInt(card.querySelector('Quantity')?.textContent || 0);
    const currentTypeElement = card.querySelector('Type');
    const currentCost = card.querySelector('Cost')?.textContent || 'NA';

    if (currentTypeElement) {
      const currentType = currentTypeElement.textContent;
      switch (currentType) {
        case 'Land':
          stats.landCount += currentQuantity;
          break;
        case 'Creature':
          stats.creatureCount += currentQuantity;
          break;
        case 'Instant':
          stats.instantCount += currentQuantity;
          break;
        case 'Sorcery':
          stats.sorceryCount += currentQuantity;
          break;
        case 'Enchantment':
          stats.enchantmentCount += currentQuantity;
          break;
        case 'Artifact':
          stats.artifactCount += currentQuantity;
          break;
      }
    }

    stats.deckSize += currentQuantity;

    if (currentCost !== 'NA') {
      const convertedCost = getConvertedCost(currentCost);
      stats.totalConvertedCost += parseInt(convertedCost) * currentQuantity;
    }
  }

  return stats;
}

function createDeckComparisonTable(deckName, stats) {
  const table = document.getElementById('tblDeckList');
  const row = document.createElement('tr');

  // Add table cells with deck statistics
  appendTableCell(row, deckName);
  appendTableCell(row, stats.deckSize);
  appendTableCell(row, stats.totalConvertedCost);
  appendTableCell(row, stats.landCount);
  appendTableCell(row, stats.creatureCount);
  appendTableCell(row, stats.instantCount);
  appendTableCell(row, stats.sorceryCount);
  appendTableCell(row, stats.enchantmentCount);
  appendTableCell(row, stats.artifactCount);

  const tbody = document.createElement('tbody');
  tbody.appendChild(row);

  table.appendChild(tbody);
  table.setAttribute('border', '2');
}

function appendTableCell(row, content) {
  const cell = document.createElement('td');
  cell.appendChild(document.createTextNode(content));
  row.appendChild(cell);
}
