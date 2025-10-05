/**
 * Deck Loading Module
 * Handles all deck loading, file upload, and deck management operations
 */

export const DeckLoader = {
  /**
   * Load the default deck from storage or fallback
   */
  async loadDefaultDeck() {
    console.log('[DECK-LOADER] loadDefaultDeck called');
    // Load opponent deck after a delay to ensure proper initialization
    setTimeout(async () => {
      await this.loadDefaultOpponentDeckFromStorage();
      this.updateOpponentDeckSelectorLabels();
    }, 1500);

    // Don't load if already loaded
    if (this.currentDeck) {
      console.log('[DECK-LOADER] Deck already loaded, skipping');
      return;
    }

    // Try to load saved default deck from localStorage
    const savedDefault = localStorage.getItem('mtg_default_deck');

    if (savedDefault) {
      try {
        await this.loadDeck(savedDefault);
        return;
      } catch (error) {
        console.error('Failed to load saved default:', error);
        // Clear invalid default
        localStorage.removeItem('mtg_default_deck');
      }
    }

    // Fallback: load affinity if no default was saved or loading failed
    try {
      await this.loadDeck('./decks/classic/affinity.xml');
    } catch (fallbackError) {
      console.error('Failed to load fallback deck:', fallbackError);
      // Show game content anyway with empty deck
      this.showGameContent();
      this.uiManager.showToast('No deck loaded - please select a deck', 'warning');
    }
  },

  /**
   * Populate the predefined decks dropdown
   */
  populatePredefinedDecks() {
    // Find all deck selector elements
    const selectors = [
      document.getElementById('preDefinedDecks'),
      document.getElementById('deckSelectModal'),
      document.getElementById('opponentDeckSelectModal')
    ].filter(el => el !== null);

    if (selectors.length === 0) {
      console.log('No deck selector elements found');
      return;
    }

    selectors.forEach(select => {
      // Clear existing options
      select.innerHTML = '';

      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a deck...';
      select.appendChild(defaultOption);

      // Add all decks from server
      this.predefinedDecks.forEach(deckPath => {
        const deckName = deckPath.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
        const option = document.createElement('option');
        option.value = deckPath;
        option.textContent = deckName;
        select.appendChild(option);
      });
    });

    console.log(`Populated ${selectors.length} deck selector(s) with ${this.predefinedDecks.length} decks`);
  },

  /**
   * Handle file upload from input
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.showLoadingState();

    try {
      const formData = new FormData();
      formData.append('deckFile', file);

      const response = await fetch(`${this.apiBase}/decks/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload deck');
      }

      const result = await response.json();

      if (result.success) {
        this.currentDeck = result.data.deck;
        this.currentDeck.source = file.name;
        this.loadDeckData(result.data);
        this.showGameContent();
        this.uiManager.showToast(`Loaded ${this.currentDeck.name}`, 'success');
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error uploading deck:', error);
      this.showErrorState(`Failed to load deck: ${error.message}`);
      this.uiManager.showToast('Failed to load deck file', 'error');
    }
  },

  /**
   * Load a predefined deck by path
   */
  async loadPredefinedDeck(deckPath) {
    await this.loadDeck(deckPath);
  },

  /**
   * Load deck from API endpoint
   */
  async loadDeck(deckPath) {
    this.showLoadingState();

    try {
      // Extract just the filename - backend will search subdirectories
      const filename = deckPath.split('/').pop();
      console.log('[DECK-LOADER] Loading deck:', filename);
      const response = await fetch(`${this.apiBase}/decks/${filename}`);

      if (!response.ok) {
        throw new Error('Deck not found');
      }

      const result = await response.json();

      if (result.success) {
        this.currentDeck = result.data.deck;
        this.currentDeck.source = deckPath;
        this.loadDeckData(result.data);
        this.showGameContent();
        this.uiManager.showToast(`Loaded ${this.currentDeck.name}`, 'success');

        // Update deck selector to show current selection
        const quickDeckSelect = document.getElementById('quickDeckSelect');
        if (quickDeckSelect) {
          quickDeckSelect.value = deckPath;
        }
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading deck:', error);
      this.showErrorState(`Failed to load deck: ${error.message}`);
      this.uiManager.showToast('Failed to load deck', 'error');
      throw error; // Rethrow so caller knows it failed
    }
  },

  /**
   * Load deck data into game state
   */
  loadDeckData(data) {
    console.log('[DECK-LOADER] loadDeckData called with:', data);
    const { deck } = data;

    // Reset game state for new deck
    console.log('[DECK-LOADER] Calling resetState()');
    this.gameState.resetState();
    console.log('[DECK-LOADER] resetState() completed');

    // Build library from cards
    deck.cards.forEach(card => {
      for (let i = 0; i < card.quantity; i++) {
        this.gameState.player.library.push({
          id: `${card.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: card.name,
          cost: card.cost,
          type: card.type,
          text: card.text
        });
      }
    });

    // Shuffle and draw opening hand
    this.gameState.shuffleLibrary('player');
    this.drawOpeningHand();

    // Update all UI
    this.updateUI();
    this.uiManager.updateTurnDisplay();

    // Enable "Set as Default" button
    const setBtn = document.getElementById('setPlayer1DefaultBtnModal');
    const clearBtn = document.getElementById('clearPlayer1DefaultBtnModal');
    if (setBtn) setBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
  },

  /**
   * Draw opening hand (7 cards)
   */
  drawOpeningHand() {
    const handSize = 7;
    for (let i = 0; i < handSize; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.hand.push(card);
      }
    }
    this.autoSortHand();
    this.uiManager.updateZoneDisplay('hand', 'player');
    this.uiManager.updateHandCountDisplay('player');
    this.gameState.addToGameLog('Drew opening hand of 7 cards', 'draw');
  },

  /**
   * Mulligan - shuffle hand back and draw one less
   */
  mulligan() {
    const currentHandSize = this.gameState.player.hand.length;
    if (currentHandSize === 0) {
      this.uiManager.showToast('No cards to mulligan', 'warning');
      return;
    }

    // Return hand to library
    while (this.gameState.player.hand.length > 0) {
      const card = this.gameState.player.hand.pop();
      this.gameState.player.library.push(card);
    }

    // Shuffle
    this.gameState.shuffleLibrary('player');

    // Draw one less card (minimum 1)
    const newHandSize = Math.max(1, currentHandSize - 1);
    for (let i = 0; i < newHandSize; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.hand.push(card);
      }
    }

    this.autoSortHand();
    this.uiManager.updateZoneDisplay('hand', 'player');
    this.uiManager.updateHandCountDisplay('player');
    this.gameState.addToGameLog(`Mulliganed to ${newHandSize} cards`, 'draw');
    this.uiManager.showToast(`Mulliganed to ${newHandSize} cards`, 'info');
  },

  /**
   * Set current deck as default for auto-loading
   */
  setCurrentDeckAsDefault() {
    console.log('setCurrentDeckAsDefault called, currentDeck:', this.currentDeck);
    if (!this.currentDeck || !this.currentDeck.source) {
      console.log('No deck loaded or no source');
      this.uiManager.showToast('No deck loaded', 'warning');
      return;
    }
    console.log('Saving default deck:', this.currentDeck.source);
    this.saveDefaultDeck(this.currentDeck.source);

    // Update the deck selector to show the star
    this.updateDeckSelectorLabels();
    this.uiManager.showToast(`${this.currentDeck.name} set as default deck ⭐`, 'success');
  },

  /**
   * Save default deck to localStorage
   */
  saveDefaultDeck(deckPath) {
    localStorage.setItem('mtg_default_deck', deckPath);
  },

  /**
   * Update deck selector labels to show default with star
   */
  updateDeckSelectorLabels() {
    const defaultDeck = localStorage.getItem('mtg_default_deck');
    if (!defaultDeck) return;

    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      Array.from(quickDeckSelect.options).forEach(option => {
        if (option.value === defaultDeck) {
          if (!option.textContent.includes('⭐')) {
            option.textContent = `⭐ ${option.textContent}`;
          }
        } else {
          option.textContent = option.textContent.replace('⭐ ', '');
        }
      });
    }
  },

  /**
   * Clear default deck setting
   */
  clearDefaultDeck() {
    const hadDefault = localStorage.getItem('mtg_default_deck');
    localStorage.removeItem('mtg_default_deck');

    if (hadDefault) {
      this.uiManager.showToast('Default deck cleared', 'info');
      this.updateDeckSelectorLabels();
    } else {
      this.uiManager.showToast('No default deck set', 'warning');
    }
  }
};
