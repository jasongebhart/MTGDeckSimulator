/**
 * Fetchlands Module
 * Handles automatic fetchland activation, land searching, and mana base analysis
 */

export const Fetchlands = {
  // Main auto-fetch logic
  autoFetchDualOrPrompt(fetchlandCard) {
    const types = this.getFetchlandTypes(fetchlandCard.name);
    if (types.length === 0) return;

    const currentPlayer = this.getCurrentPlayer();
    const dualLands = this.getAvailableDualLands(currentPlayer.library, types);

    // If a dual land is available, auto-fetch it
    if (dualLands.length > 0) {
      const dualLand = dualLands[0]; // Take first dual land
      this.quickFetchSpecificLand(dualLand.id, fetchlandCard.name, true); // true = silent mode
      this.uiManager.showToast(`Auto-fetched ${dualLand.name} (right-click fetchland for other options)`, 'success');
    } else {
      // No dual land available, show normal fetchland selection
      this.showFetchlandQuickSelect(fetchlandCard, { fromPlay: true });
    }
  },

  // Fetchland quick select modal
  showFetchlandQuickSelect(fetchlandCard, options = {}) {
    const types = this.getFetchlandTypes(fetchlandCard.name);
    if (types.length === 0) return;

    // Get available lands in library
    const currentPlayer = this.getCurrentPlayer();
    const availableLands = this.getAvailableLandsInLibrary(currentPlayer.library, types);

    // Get dual lands that match these colors
    const dualLands = this.getAvailableDualLands(currentPlayer.library, types);

    // Remove any existing fetchland popup
    document.getElementById('fetchlandQuickSelect')?.remove();

    const popup = document.createElement('div');
    popup.id = 'fetchlandQuickSelect';
    popup.className = 'fetchland-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      color: #000000;
      border: 2px solid #667eea;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      text-align: center;
      min-width: 350px;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      animation: fetchlandSlideIn 0.2s ease-out;
    `;

    // Create dual land buttons (show first if available)
    let dualLandButtons = '';
    if (dualLands.length > 0) {
      dualLandButtons = `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #000000; margin-bottom: 8px;">Dual Lands:</div>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
            ${dualLands.map(land => `
              <button onclick="window.handSimulator.quickFetchSpecificLand('${this.escapeJs(land.id)}', '${this.escapeJs(fetchlandCard.name)}')"
                      style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${land.name}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Create smart type buttons based on what's actually available
    const typeButtons = types.map(type => {
      const count = availableLands[type] || 0;
      const isAvailable = count > 0;
      const buttonStyle = isAvailable ?
        'background: #28a745; color: white; cursor: pointer;' :
        'background: #6c757d; color: #ccc; cursor: not-allowed;';

      return `<button onclick="${isAvailable ? `window.handSimulator.quickFetchBasic('${type}', '${this.escapeJs(fetchlandCard.name)}')` : 'void(0)'}"
               style="${buttonStyle} border: none; padding: 12px 20px; margin: 5px; border-radius: 6px; font-size: 14px; min-width: 110px; position: relative;"
               ${!isAvailable ? 'disabled' : ''}
               title="${count} available in library">
         ${this.getBasicLandIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}
         ${count > 0 ? `<span style="position: absolute; top: 2px; right: 6px; background: rgba(255,255,255,0.8); color: #333; border-radius: 10px; padding: 1px 4px; font-size: 10px; font-weight: bold;">${count}</span>` : ''}
       </button>`;
    }).join('');

    // Mana base analysis
    const manaBaseInfo = this.analyzeManaBase();
    const suggestions = this.getFetchSuggestions(availableLands, manaBaseInfo);

    popup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #000000;">🏞️ ${fetchlandCard.name}</h3>
        ${options.fromRightClick ? '<span style="margin-left: 10px; font-size: 12px; color: #666;">(Right-click)</span>' : ''}
      </div>

      ${suggestions ? `<div style="background: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 15px; font-size: 12px; color: #374151;">
        💡 ${suggestions}
      </div>` : ''}

      ${dualLandButtons}

      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; font-weight: bold; color: #000000; margin-bottom: 8px;">Basic Lands:</div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
          ${typeButtons}
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
        <button onclick="window.handSimulator.closeFetchlandQuickSelect()"
                style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ❌ Cancel
        </button>
      </div>

      <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
        💡 Tip: Right-click any fetchland for quick access
      </div>
    `;

    document.body.appendChild(popup);

    // Add CSS animation if not already added
    if (!document.getElementById('fetchlandAnimationStyles')) {
      const style = document.createElement('style');
      style.id = 'fetchlandAnimationStyles';
      style.textContent = `
        @keyframes fetchlandSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .fetchland-popup button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.1s ease;
        }
      `;
      document.head.appendChild(style);
    }
  },

  closeFetchlandQuickSelect() {
    document.getElementById('fetchlandQuickSelect')?.remove();
  },

  // Quick fetch a specific land by ID (for dual lands)
  quickFetchSpecificLand(landId, fetchlandName, silent = false) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const battlefield = currentPlayer.battlefield;

    // Find the specific land by ID
    const landIndex = library.findIndex(card => card.id === landId);
    if (landIndex === -1) {
      this.uiManager.showToast('Land not found in library', 'error');
      return;
    }

    const land = library[landIndex];

    // Pay life cost for fetchlands
    const lifeCost = this.getFetchlandLifeCost(fetchlandName);
    if (lifeCost > 0) {
      currentPlayer.life -= lifeCost;
      this.gameState.addToGameLog(`Pay ${lifeCost} life for ${fetchlandName}`, 'info');
    }

    // Sacrifice the fetchland
    const fetchlandIndex = battlefield.lands.findIndex(l => l.name === fetchlandName);
    if (fetchlandIndex >= 0) {
      const sacrificedFetchland = battlefield.lands.splice(fetchlandIndex, 1)[0];
      const graveyard = this.gameState.turnState.activePlayer === 'player' ? this.gameState.player.graveyard : this.gameState.opponent.graveyard;
      graveyard.push(sacrificedFetchland);
      this.gameState.addToGameLog(`Sacrifice ${fetchlandName}`, 'info');
    }

    // Remove land from library
    library.splice(landIndex, 1);

    // Determine if it enters tapped
    const shouldEnterTapped = this.fetchlandProducesTaskedLands(fetchlandName);
    if (shouldEnterTapped) {
      land.tapped = true;
    }

    // Add to battlefield
    battlefield.lands.push(land);

    // Shuffle library
    this.shuffleArray(library);

    if (!silent) {
      this.gameState.addToGameLog(`${fetchlandName}: Found ${land.name}`, 'success');
      this.uiManager.showToast(`Fetched ${land.name}${shouldEnterTapped ? ' (tapped)' : ''}`, 'success');
    }

    // Update displays
    this.closeFetchlandQuickSelect();
    this.uiManager.updateZoneDisplay('battlefield', this.gameState.turnState.activePlayer);
    this.uiManager.updateZoneDisplay('graveyard', this.gameState.turnState.activePlayer);
    this.uiManager.updateZoneCounts();
    this.uiManager.updateLifeDisplay(this.gameState.turnState.activePlayer);
  },

  // Quick fetch a basic land by type
  quickFetchBasic(basicType, fetchlandName) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;

    // Find a basic land of the specified type in library
    const targetLand = library.find(card => {
      return this.isLandOfType(card, basicType) && this.isBasicLand(card.name);
    });

    if (!targetLand) {
      this.uiManager.showToast(`No ${basicType} found in library`, 'warning');
      return;
    }

    // Find the fetchland on battlefield by name AND sacrifice it
    const fetchlandIndex = currentPlayer.battlefield.lands.findIndex(land => land.name === fetchlandName);
    if (fetchlandIndex === -1) {
      this.uiManager.showToast(`${fetchlandName} not found on battlefield`, 'error');
      return;
    }

    // Pay the life cost
    const lifeCost = this.getFetchlandLifeCost(fetchlandName);
    if (lifeCost > 0) {
      currentPlayer.life -= lifeCost;
      this.gameState.addToGameLog(`Pay ${lifeCost} life for ${fetchlandName}`, 'info');
    }

    // Sacrifice the fetchland to graveyard
    const fetchland = currentPlayer.battlefield.lands.splice(fetchlandIndex, 1)[0];
    currentPlayer.graveyard.push(fetchland);

    // Remove the found land from library
    const libraryIndex = library.findIndex(card => card.id === targetLand.id);
    if (libraryIndex !== -1) {
      library.splice(libraryIndex, 1);
    }

    // Put the land onto battlefield - tapped status depends on fetchland type
    const shouldEnterTapped = this.fetchlandProducesTaskedLands(fetchlandName);
    targetLand.tapped = shouldEnterTapped;
    currentPlayer.battlefield.lands.push(targetLand);

    // Shuffle library
    this.shuffleArray(library);

    // Close the fetchland popup
    this.closeFetchlandQuickSelect();

    // Log the action
    const tappedStatus = shouldEnterTapped ? 'enters tapped' : 'enters untapped';
    this.gameState.addToGameLog(`${fetchlandName} fetches ${targetLand.name} (${tappedStatus})`, 'success');

    // Update displays
    this.uiManager.updateZoneDisplay('battlefield', this.gameState.turnState.activePlayer);
    this.uiManager.updateZoneDisplay('graveyard', this.gameState.turnState.activePlayer);
    this.uiManager.updateZoneCounts();
    this.uiManager.updateLifeDisplay(this.gameState.turnState.activePlayer);

    const lifeCostText = lifeCost > 0 ? `, paid ${lifeCost} life` : '';
    this.uiManager.showToast(`Fetched ${targetLand.name} with ${fetchlandName} (${tappedStatus}${lifeCostText})`, 'success');
  },

  // Helper functions
  getCurrentPlayer() {
    return this.gameState.turnState.activePlayer === 'player' ? this.gameState.player : this.gameState.opponent;
  },

  isFetchland(cardName) {
    const name = cardName.toLowerCase();
    const fetchlands = [
      'flooded strand', 'polluted delta', 'bloodstained mire', 'wooded foothills', 'windswept heath',
      'scalding tarn', 'verdant catacombs', 'arid mesa', 'misty rainforest', 'marsh flats',
      'prismatic vista', 'evolving wilds', 'terramorphic expanse'
    ];
    return fetchlands.includes(name);
  },

  getFetchlandTypes(cardName) {
    const name = cardName.toLowerCase();
    const fetchlandMap = {
      'flooded strand': ['plains', 'island'],
      'polluted delta': ['island', 'swamp'],
      'bloodstained mire': ['swamp', 'mountain'],
      'wooded foothills': ['mountain', 'forest'],
      'windswept heath': ['forest', 'plains'],
      'scalding tarn': ['island', 'mountain'],
      'verdant catacombs': ['swamp', 'forest'],
      'arid mesa': ['plains', 'mountain'],
      'misty rainforest': ['forest', 'island'],
      'marsh flats': ['plains', 'swamp'],
      'prismatic vista': ['plains', 'island', 'swamp', 'mountain', 'forest'],
      'evolving wilds': ['plains', 'island', 'swamp', 'mountain', 'forest'],
      'terramorphic expanse': ['plains', 'island', 'swamp', 'mountain', 'forest']
    };
    return fetchlandMap[name] || [];
  },

  getFetchlandLifeCost(fetchlandName) {
    const name = fetchlandName.toLowerCase();

    // True fetchlands cost 1 life
    const trueFetchlands = [
      'flooded strand', 'polluted delta', 'bloodstained mire', 'wooded foothills', 'windswept heath',
      'scalding tarn', 'verdant catacombs', 'arid mesa', 'misty rainforest', 'marsh flats'
    ];

    if (trueFetchlands.includes(name)) {
      return 1;
    }

    // Free fetchlands
    const freeFetchlands = [
      'evolving wilds', 'terramorphic expanse', 'prismatic vista'
    ];

    if (freeFetchlands.includes(name)) {
      return 0;
    }

    // Default to 1 life for unknown fetchlands
    return 1;
  },

  fetchlandProducesTaskedLands(fetchlandName) {
    const name = fetchlandName.toLowerCase();

    // True fetchlands (fast fetchlands) produce UNTAPPED lands
    const trueFetchlands = [
      'flooded strand', 'polluted delta', 'bloodstained mire', 'wooded foothills', 'windswept heath',
      'scalding tarn', 'verdant catacombs', 'arid mesa', 'misty rainforest', 'marsh flats'
    ];

    if (trueFetchlands.includes(name)) {
      return false; // Lands enter untapped
    }

    // Slow fetchlands produce TAPPED lands
    const slowFetchlands = [
      'evolving wilds', 'terramorphic expanse', 'prismatic vista'
    ];

    if (slowFetchlands.includes(name)) {
      return true; // Lands enter tapped
    }

    // Default to tapped for unknown fetchlands
    return true;
  },

  getAvailableDualLands(library, types) {
    const dualLands = [];

    library.forEach(card => {
      const cardName = card.name.toLowerCase();
      const cardType = (card.type_line || card.type || '').toLowerCase();

      if (!cardType.includes('land')) return;

      const isDualLand = !this.isBasicLand(card.name) &&
                         (cardName.includes('volcanic') || cardName.includes('tropical') ||
                          cardName.includes('underground') || cardName.includes('badlands') ||
                          cardName.includes('bayou') || cardName.includes('savannah') ||
                          cardName.includes('scrubland') || cardName.includes('taiga') ||
                          cardName.includes('tundra') || cardName.includes('plateau'));

      if (isDualLand) {
        const producesRightColors = types.some(type => this.isLandOfType(card, type));
        if (producesRightColors) {
          dualLands.push(card);
        }
      }
    });

    return dualLands;
  },

  getAvailableLandsInLibrary(library, types) {
    const available = {};
    types.forEach(type => {
      available[type] = library.filter(card => this.isLandOfType(card, type)).length;
    });
    return available;
  },

  isBasicLand(cardName) {
    const name = cardName.toLowerCase();
    const basicLands = ['plains', 'island', 'swamp', 'mountain', 'forest'];
    return basicLands.includes(name);
  },

  isLandOfType(card, basicType) {
    if (!card.type || !card.type.toLowerCase().includes('land')) {
      return false;
    }

    const cardName = card.name.toLowerCase();

    // Check for exact basic land names first
    if (cardName === basicType) {
      return true;
    }

    // Handle dual lands by checking if they produce the right color
    // This uses the card mechanics methods
    if (typeof this.cardMechanics !== 'undefined') {
      switch (basicType) {
        case 'plains':
          return cardName.includes('plains') || cardName.includes('tundra') ||
                 cardName.includes('scrubland') || cardName.includes('savannah') ||
                 cardName.includes('plateau');
        case 'island':
          return cardName.includes('island') || cardName.includes('volcanic island') ||
                 cardName.includes('underground sea') || cardName.includes('tropical island') ||
                 cardName.includes('tundra');
        case 'swamp':
          return cardName.includes('swamp') || cardName.includes('underground sea') ||
                 cardName.includes('badlands') || cardName.includes('bayou') ||
                 cardName.includes('scrubland');
        case 'mountain':
          return cardName.includes('mountain') || cardName.includes('volcanic island') ||
                 cardName.includes('badlands') || cardName.includes('taiga') ||
                 cardName.includes('plateau');
        case 'forest':
          return cardName.includes('forest') || cardName.includes('taiga') ||
                 cardName.includes('bayou') || cardName.includes('savannah') ||
                 cardName.includes('tropical island');
      }
    }

    return false;
  },

  getBasicLandIcon(type) {
    const icons = {
      'plains': '☀️',
      'island': '🌊',
      'swamp': '🌑',
      'mountain': '⛰️',
      'forest': '🌲'
    };
    return icons[type] || '🏞️';
  },

  analyzeManaBase() {
    const battlefield = this.gameState.player.battlefield;
    const lands = battlefield.lands;
    const manaBase = {
      white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0
    };

    lands.forEach(land => {
      const name = land.name.toLowerCase();
      // Simple color detection based on land name
      if (name.includes('plains') || name.includes('tundra') || name.includes('scrubland') ||
          name.includes('savannah') || name.includes('plateau')) manaBase.white++;
      if (name.includes('island') || name.includes('volcanic') || name.includes('underground') ||
          name.includes('tropical') || name.includes('tundra')) manaBase.blue++;
      if (name.includes('swamp') || name.includes('underground') || name.includes('badlands') ||
          name.includes('bayou') || name.includes('scrubland')) manaBase.black++;
      if (name.includes('mountain') || name.includes('volcanic') || name.includes('badlands') ||
          name.includes('taiga') || name.includes('plateau')) manaBase.red++;
      if (name.includes('forest') || name.includes('taiga') || name.includes('bayou') ||
          name.includes('savannah') || name.includes('tropical')) manaBase.green++;
    });

    return manaBase;
  },

  getFetchSuggestions(availableLands, manaBase) {
    const totalLands = Object.values(manaBase).reduce((a, b) => a + b, 0);
    if (totalLands === 0) return 'Consider your mana curve when choosing';

    const colors = ['white', 'blue', 'black', 'red', 'green'];
    const landTypes = ['plains', 'island', 'swamp', 'mountain', 'forest'];
    let suggestion = '';

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const landType = landTypes[i];
      const count = availableLands[landType] || 0;

      if (count > 0 && manaBase[color] === 0) {
        suggestion = `Consider ${landType} - you have no ${color} sources`;
        break;
      }
    }

    return suggestion || null;
  },

  // Utility method
  escapeJs(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  },

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
};
