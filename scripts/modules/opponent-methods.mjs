/**
 * Opponent Methods Module
 * Handles opponent deck loading, game state, and interactions
 */

import { loadXMLDoc, getCardNameXML } from '../config.mjs';

export const OpponentMethods = {
  /**
   * Load opponent deck from XML file
   */
  async loadOpponentDeck(deckPath) {
    if (!deckPath) {
      return;
    }

    try {
      console.log('Loading opponent deck:', deckPath);
      const xmlDoc = await loadXMLDoc(deckPath);
      console.log('XML loaded for opponent, processing...', xmlDoc);

      // Extract deck information using the same method as player deck
      const deckInformation = getCardNameXML(xmlDoc);

      if (!deckInformation || !deckInformation.cardNames) {
        throw new Error('Invalid opponent deck format');
      }

      // Set opponent deck in game state
      this.gameState.opponent.currentDeck = {
        cardNames: deckInformation.cardNames,
        cardInfo: deckInformation.cardInfo
      };
      this.gameState.opponent.deckName = this.extractDeckName(xmlDoc, deckPath);
      this.gameState.opponent.deckPath = deckPath;

      // Reset opponent game state when loading new deck (but preserve deck info)
      this.resetOpponentGameState();

      // Set library after reset - create proper card objects
      this.gameState.opponent.library = deckInformation.cardNames.map((cardName, index) => ({
        name: cardName,
        id: `opponent_${cardName}_${index}_${Date.now()}`,
        cost: deckInformation.cardInfo[cardName]?.cost || '0',
        type: deckInformation.cardInfo[cardName]?.type || 'Unknown',
        rulesText: deckInformation.cardInfo[cardName]?.rulesText || '',
        tapped: false,
        counters: {}
      }));

      this.shuffleOpponentLibrary();
      this.uiManager.updateAll();

      console.log('Opponent deck loaded successfully');
      console.log('Opponent library size:', this.gameState.opponent.library.length);
      console.log('First few cards:', this.gameState.opponent.library.slice(0, 3));

      // Check if this is the default opponent deck
      const isDefault = localStorage.getItem('mtg_default_opponent_deck') === deckPath;
      const message = isDefault
        ? `Player 2 loaded: ${this.gameState.opponent.deckName} ⭐ (Default)`
        : `Player 2 loaded: ${this.gameState.opponent.deckName}`;

      this.uiManager.showToast(message, 'success');

      // Update opponent deck selector labels
      this.updateOpponentDeckSelectorLabels();

      // Update UI to show opponent deck name
      this.uiManager.updateOpponentDeckSelector(deckPath, this.gameState.opponent.deckName);

      // Enable the default buttons now that a deck is loaded
      const setDefaultBtn = document.getElementById('setOpponentDefaultBtn');
      const clearDefaultBtn = document.getElementById('clearOpponentDefaultBtn');
      const setDefaultBtnModal = document.getElementById('setOpponentDefaultBtnModal');
      const clearDefaultBtnModal = document.getElementById('clearOpponentDefaultBtnModal');

      if (setDefaultBtn) setDefaultBtn.disabled = false;
      if (clearDefaultBtn) clearDefaultBtn.disabled = false;
      if (setDefaultBtnModal) setDefaultBtnModal.disabled = false;
      if (clearDefaultBtnModal) clearDefaultBtnModal.disabled = false;

    } catch (error) {
      console.error('Error loading opponent deck:', error);
      this.uiManager.showToast(`Failed to load opponent deck: ${error.message}`, 'error');
      throw error;
    }
  },

  /**
   * Reset opponent game state
   */
  resetOpponentGameState() {
    const opponent = this.gameState.opponent;

    opponent.hand = [];
    opponent.battlefield = { lands: [], creatures: [], others: [] };
    opponent.graveyard = [];
    opponent.exile = [];
    opponent.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      mulligans: 0,
      life: 20
    };
    opponent.selectedCards.clear();
    opponent.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  },

  /**
   * Shuffle opponent library
   */
  shuffleOpponentLibrary() {
    const library = this.gameState.opponent.library;
    for (let i = library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [library[i], library[j]] = [library[j], library[i]];
    }
    this.uiManager.showToast('Opponent library shuffled', 'info');
  },

  /**
   * Set opponent deck as default
   */
  setOpponentDeckAsDefault() {
    if (!this.gameState.opponent.deckPath) {
      this.uiManager.showToast('No Player 2 deck loaded to set as default', 'warning');
      return;
    }

    localStorage.setItem('mtg_default_opponent_deck', this.gameState.opponent.deckPath);
    this.uiManager.showToast(`${this.gameState.opponent.deckName} set as default Player 2 deck ⭐`, 'success');
    this.updateOpponentDeckSelectorLabels();
  },

  /**
   * Clear default opponent deck
   */
  clearDefaultOpponentDeck() {
    const hadDefault = localStorage.getItem('mtg_default_opponent_deck');
    localStorage.removeItem('mtg_default_opponent_deck');

    if (hadDefault) {
      this.uiManager.showToast('Default Player 2 deck cleared', 'info');
      // Remove star from opponent deck selector options
      const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
      if (opponentDeckSelect) {
        Array.from(opponentDeckSelect.options).forEach(option => {
          option.textContent = option.textContent.replace('⭐ ', '');
        });
      }
    } else {
      this.uiManager.showToast('No default Player 2 deck set', 'warning');
    }
  },

  /**
   * Update opponent deck selector to show default deck with star
   */
  updateOpponentDeckSelectorLabels() {
    const defaultDeck = localStorage.getItem('mtg_default_opponent_deck');
    if (!defaultDeck) return;

    const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
    if (opponentDeckSelect) {
      Array.from(opponentDeckSelect.options).forEach(option => {
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
   * Try to load default opponent deck
   */
  async tryLoadDefaultOpponentDeck() {
    const defaultDeck = localStorage.getItem('mtg_default_opponent_deck');
    if (defaultDeck) {
      console.log('Found default opponent deck, loading:', defaultDeck);
      try {
        await this.loadOpponentDeck(defaultDeck);
        console.log('Default opponent deck loaded successfully');
        console.log('After load - opponent state:', {
          deckName: this.gameState.opponent.deckName,
          deckPath: this.gameState.opponent.deckPath,
          librarySize: this.gameState.opponent.library?.length
        });
        return true;
      } catch (error) {
        console.error('Failed to load default opponent deck:', error);
        return false;
      }
    } else {
      console.log('No default opponent deck found in localStorage');
    }
    return false;
  },

  /**
   * Quick two-player setup
   * Loads both decks and draws hands
   */
  async quickTwoPlayerSetup() {
    try {
      console.log('Starting quick two-player setup...');

      // Get selected decks from modal selectors (fallback to old selectors)
      const playerDeckSelect = document.getElementById('deckSelectModal') || document.getElementById('quickDeckSelect');
      const opponentDeckSelect = document.getElementById('opponentDeckSelectModal') || document.getElementById('opponentDeckSelectTop');

      if (!playerDeckSelect || !opponentDeckSelect) {
        this.uiManager.showToast('Please select decks using the 🎴 Decks button first', 'warning');
        return;
      }

      const playerDeck = playerDeckSelect.value;
      const opponentDeck = opponentDeckSelect.value;

      if (!playerDeck) {
        this.uiManager.showToast('Please select a deck for the player using the 🎴 Decks button', 'warning');
        return;
      }

      if (!opponentDeck) {
        this.uiManager.showToast('Please select a deck for the opponent using the 🎴 Decks button', 'warning');
        return;
      }

      // Load player deck first
      console.log('Loading player deck:', playerDeck);
      await this.loadDeck(playerDeck);
      console.log('Player deck loaded, drawing hand...');
      this.drawHand(7);

      // Load opponent deck AFTER player deck to avoid reset
      console.log('Loading opponent deck:', opponentDeck);
      await this.loadOpponentDeck(opponentDeck);
      console.log('Opponent deck loaded, drawing opponent hand...');
      this.drawOpponentHand(7);

      this.uiManager.showToast('Two-player setup complete! Switch between players to control each side.', 'success');

      console.log('Quick setup completed successfully');
    } catch (error) {
      console.error('Error during quick setup:', error);
      this.uiManager.showToast('Error setting up two-player game. Please try manual setup.', 'error');
    }
  },

  resetAndDrawOpponent7() {
    // Reset opponent and draw 7 cards (like New Game button)
    this.gameState.opponent.life = 20;
    this.gameState.opponent.gameStats.mulligans = 0;
    this.shuffleOpponentLibrary();
    this.drawOpponentHand(7);
    this.uiManager.showToast('Player 2: New game started!', 'success');
  }
};
