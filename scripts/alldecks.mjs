import { loadXMLDoc, xmlDoc } from './config.mjs';
//var xmlDoc;
//var xmlFile;

const mtgDeck = [
  './xml/BigRedMachine.xml',
  './xml/MulchandLoam.xml',
  './xml/BlackRack.xml',
  './xml/BlackDread.xml',
  './xml/BloodBraidElf.xml',
  './xml/BloodBraidEnchantress.xml',
  './xml/Brood.xml',
  './xml/CharredDiscard.xml',
  './xml/Classic.xml',
  './xml/CreepingChill.xml',
  './xml/Dimir_Inverter.xml',
  './xml/FireandIce.xml',
  './xml/GreenWaste.xml',
  './xml/GreenWasteOrder.xml',
  './xml/GreenWasteTomorrow.xml',
  './xml/GreenWasteSakura.xml',
  './xml/WelderGamble.xml',
  './xml/CloudpostWelder.xml',
  './xml/JunkDiver.xml',
  './xml/JeskaiPioneer.xml',
  './xml/KindofBlue.xml',
  './xml/IxalanCannons.xml',
  './xml/Ixalan_BlackRedBlue.xml',
  './xml/Ixalan_Cannons_RedBlue.xml',
  './xml/Ixalan_Green_White.xml',
  './xml/Lumberjack.xml',
  './xml/Brothers_War/Limited-BrothersWar.xml',
  './xml/Napoleon.xml',
  './xml/Nishoba.xml',
  './xml/Outpost.xml',
  './xml/PatriotBlock.xml',
  './xml/Patriot.xml',
  './xml/Pernicious.xml',
  './xml/Plum.xml',
  './xml/PlumGoneBlock.xml',
  './xml/RayneForest.xml',
  './xml/RedPatrol.xml',
  './xml/Rith.xml',
  './xml/Stasis.xml',
  './xml/TronTate.xml',
  './xml/Welder.xml',
  './xml/ZombieRenewal.xml',
  './xml/affinity.xml',
  './xml/hightide.xml',
  './xml/oath.xml',
  './xml/trix.xml',
  './xml/belcher.xml',
  './xml/counterbalance.xml',
  './xml/dredge.xml',
  './xml/goblins.xml',
  './xml/landstill.xml',
  './xml/crimson_vow/Limited-Red.xml',
  './xml/legacy/Elves.xml',
  './xml/legacy/Red-Delver.xml',
  './xml/crimson_vow/Limited-RedGreen.xml',
  './xml/crimson_vow/Limited-GreenBlack.xml',
  './xml/crimson_vow/Limited-WhiteSplash.xml',
  './xml/crimson_vow/Limited-GreenBlue.xml',
  './xml/crimson_vow/Limited-GreenWhite.xml',
  './xml/MantisRiderPioneer.xml'
];

// Store all deck data for sorting
let allDecksData = [];
let currentSortColumn = 'name';
let currentSortDirection = 'asc';

export async function startCompareDecks() {
  try {
    // Clear previous data
    allDecksData = [];

    const len = mtgDeck.length;

    for (let i = 0; i < len; i++) {
      const xmlFile = mtgDeck[i];
      await loadXMLDoc(xmlFile);
      displayDeckComparison();
    }

    // After all data is loaded, render the sorted table
    renderSortedTable();
    setupTableSorting();
    setupSearch();
    updateLibraryStats();
  } catch (error) {
    console.error(error);
    window.alert('An error occurred while comparing decks.');
  }
}


// Parse MTG mana cost and return converted mana cost
function getConvertedCost(currentCost) {
  const arrConvertedCost = new Array(2);

  if (!currentCost || currentCost === 'NA') {
    arrConvertedCost[0] = 0;
    arrConvertedCost[1] = 0;
    return arrConvertedCost;
  }

  let totalCost = 0;
  let colorlessCost = 0;

  // Extract all mana symbols between braces: {3}, {R}, {W}, etc.
  const manaSymbols = currentCost.match(/\{[^}]+\}/g) || [];

  manaSymbols.forEach(symbol => {
    const content = symbol.slice(1, -1); // Remove { and }

    // Check if it's a numeric cost (colorless mana)
    if (/^\d+$/.test(content)) {
      const numericCost = parseInt(content);
      totalCost += numericCost;
      colorlessCost += numericCost;
    }
    // Handle colored mana symbols (W, U, B, R, G, C) and other symbols
    else if (['W', 'U', 'B', 'R', 'G', 'C'].includes(content.toUpperCase()) ||
             content === 'X' || content === 'Y' || content === 'Z') {
      totalCost += (content === 'X' || content === 'Y' || content === 'Z') ? 0 : 1;
    }
    // Handle hybrid costs like {W/U}, {2/W}, etc. - count as 1
    else if (content.includes('/')) {
      totalCost += 1;
    }
    // Handle other special symbols - count as 1
    else {
      totalCost += 1;
    }
  });

  arrConvertedCost[0] = totalCost;
  arrConvertedCost[1] = colorlessCost;
  return arrConvertedCost;
}

function displayDeckComparison() {
  const deckList = xmlDoc.getElementsByTagName('Decklist')[0];
  const deckListName = deckList.getAttribute('Deck');
  const deckStatistics = calculateDeckStatistics(deckList);

  // Store deck data for sorting instead of immediately creating table rows
  allDecksData.push({
    name: deckListName,
    cards: deckStatistics.deckSize,
    cost: deckStatistics.totalConvertedCost,
    lands: deckStatistics.landCount,
    creatures: deckStatistics.creatureCount,
    instants: deckStatistics.instantCount,
    sorceries: deckStatistics.sorceryCount,
    enchantments: deckStatistics.enchantmentCount,
    artifacts: deckStatistics.artifactCount
  });
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


// Render the sorted table
function renderSortedTable() {
  // Just render all data using the filtered function
  renderFilteredTable(allDecksData);

  // Hide loading state and show table
  const loadingState = document.getElementById('loadingState');
  const tableContainer = document.getElementById('tableViewContainer');
  if (loadingState) loadingState.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'block';
}

// Setup table sorting event listeners
function setupTableSorting() {
  const sortableHeaders = document.querySelectorAll('.sortable');

  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');

      if (currentSortColumn === column) {
        // Toggle sort direction
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // New column, default to ascending
        currentSortColumn = column;
        currentSortDirection = 'asc';
      }

      renderSortedTable();
    });
  });
}

// Update sort indicators in table headers
function updateSortIndicators() {
  const sortableHeaders = document.querySelectorAll('.sortable');

  sortableHeaders.forEach(header => {
    const column = header.getAttribute('data-column');
    const indicator = header.querySelector('.sort-indicator');

    header.classList.remove('active');

    if (column === currentSortColumn) {
      header.classList.add('active');
      if (indicator) {
        indicator.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
      }
    } else {
      if (indicator) {
        indicator.textContent = '↕️';
      }
    }
  });
}

// Update library statistics
function updateLibraryStats() {
  const totalDecks = allDecksData.length;
  const avgCards = totalDecks > 0 ? Math.round(allDecksData.reduce((sum, deck) => sum + deck.cards, 0) / totalDecks) : 0;
  const totalValue = allDecksData.reduce((sum, deck) => sum + deck.cost, 0);

  // Find most common card type
  const typeCounts = {
    creatures: allDecksData.reduce((sum, deck) => sum + deck.creatures, 0),
    instants: allDecksData.reduce((sum, deck) => sum + deck.instants, 0),
    sorceries: allDecksData.reduce((sum, deck) => sum + deck.sorceries, 0),
    enchantments: allDecksData.reduce((sum, deck) => sum + deck.enchantments, 0),
    artifacts: allDecksData.reduce((sum, deck) => sum + deck.artifacts, 0)
  };

  const mostCommonType = Object.keys(typeCounts).reduce((a, b) =>
    typeCounts[a] > typeCounts[b] ? a : b
  );

  // Update DOM elements
  const totalDecksEl = document.getElementById('totalDecks');
  const avgCardsEl = document.getElementById('avgCards');
  const totalValueEl = document.getElementById('totalValue');
  const mostCommonTypeEl = document.getElementById('mostCommonType');

  if (totalDecksEl) totalDecksEl.textContent = totalDecks;
  if (avgCardsEl) avgCardsEl.textContent = avgCards;
  if (totalValueEl) totalValueEl.textContent = totalValue;
  if (mostCommonTypeEl) mostCommonTypeEl.textContent = mostCommonType.charAt(0).toUpperCase() + mostCommonType.slice(1);
}

// Placeholder functions for deck actions - make globally accessible
window.playDeck = function(deckName) {
  window.location.href = `/playhand-modern?deck=${encodeURIComponent(deckName)}`;
};

window.viewDeck = function(deckName) {
  window.location.href = `/decks-modern?deck=${encodeURIComponent(deckName)}`;
};

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('deckSearch');
  const searchBtn = document.getElementById('searchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
}

function handleSearch() {
  const searchTerm = document.getElementById('deckSearch')?.value.toLowerCase() || '';

  // Filter the data based on search term
  const filteredData = allDecksData.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm)
  );

  // Render filtered results
  renderFilteredTable(filteredData);
}

function renderFilteredTable(data) {
  const tableBody = document.getElementById('deckTableBody');
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = '';

  // Sort the filtered data
  const sortedData = [...data].sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];

    // Handle numeric columns
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle string columns
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (currentSortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Create table rows
  sortedData.forEach(deck => {
    const row = document.createElement('tr');

    // Add table cells with deck statistics
    appendTableCell(row, deck.name, 'deck-name');
    appendTableCell(row, deck.cards);
    appendTableCell(row, deck.cost);
    appendTableCell(row, deck.lands);
    appendTableCell(row, deck.creatures);
    appendTableCell(row, deck.instants);
    appendTableCell(row, deck.sorceries);
    appendTableCell(row, deck.enchantments);
    appendTableCell(row, deck.artifacts);

    // Add actions column
    const actionsCell = document.createElement('td');
    actionsCell.innerHTML = `
      <div class="deck-actions">
        <button class="btn btn-sm btn-primary" onclick="playDeck('${deck.name}')">Play</button>
        <button class="btn btn-sm btn-secondary" onclick="viewDeck('${deck.name}')">View</button>
      </div>
    `;
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });

  // Update sort indicators
  updateSortIndicators();

  // Show empty state if no results
  if (sortedData.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 10;
    emptyCell.textContent = 'No decks found matching your search.';
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '2rem';
    emptyCell.style.fontStyle = 'italic';
    emptyCell.style.color = 'var(--text-secondary)';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
  }
}

function appendTableCell(row, cellValue, className = '') {
  const cell = document.createElement('td');
  cell.textContent = cellValue;
  if (className) {
    cell.classList.add(className);
  }
  row.appendChild(cell);
}
