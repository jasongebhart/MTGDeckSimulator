/**
 * Core Methods Module
 * Contains deck loading, card drawing, mulligan, and turn management
 * These can be mixed into the main ModernHandSimulator class
 */

import { loadXMLDoc, getCardNameXML } from '../config.mjs';
import { DFC_DATABASE } from './card-mechanics.mjs';

export const CoreMethods = {
  // ===== DECK LOADING =====

  async loadPredefinedDeck(deckPath) {
    if (!deckPath) {
      this.uiManager.showEmptyState();
      return;
    }

    // Prevent loading the same deck multiple times
    if (this.currentDeck && this.currentDeck.source === deckPath) {
      console.log('Deck already loaded, skipping');
      return;
    }

    await this.loadDeck(deckPath);
  },

  async loadDeck(deckPath, saveAsDefault = false) {
    try {
      console.log('Loading deck:', deckPath);
      this.uiManager.showLoadingState();

      const xmlDoc = await loadXMLDoc(deckPath);
      console.log('XML loaded, processing...');

      await this.processDeckXML(xmlDoc, deckPath);
      console.log('Deck processing completed');

      // Analyze deck abilities
      this.analyzeDeckAbilities();

      // Save as default if requested
      if (saveAsDefault) {
        this.saveDefaultDeck(deckPath);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
      this.uiManager.showErrorState('Failed to load deck. Please try again.');
    }
  },

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      await this.processDeckXML(xmlDoc, file.name);
    } catch (error) {
      console.error('Error loading file:', error);
      this.uiManager.showToast('Error loading deck file', 'error');
    } finally {
      event.target.value = '';
    }
  },

  async processDeckXML(xmlDoc, source) {
    try {
      console.log('processDeckXML called with source:', source);

      // Extract deck information
      const deckInformation = getCardNameXML(xmlDoc);
      console.log('Deck information extracted:', {
        cardCount: deckInformation?.cardNames?.length,
        hasCardInfo: !!deckInformation?.cardInfo
      });

      if (!deckInformation || !deckInformation.cardNames) {
        throw new Error('Invalid deck format');
      }

      // Set current deck
      this.currentDeck = {
        name: this.extractDeckName(xmlDoc, source),
        cards: deckInformation.cardNames,
        cardInfo: deckInformation.cardInfo,
        totalCards: deckInformation.cardNames.length,
        source: source
      };
      console.log('Current deck set:', this.currentDeck.name, 'Total cards:', this.currentDeck.totalCards);

      // Reset game state FIRST (clears everything)
      this.resetGameState();

      // THEN initialize library with full card objects
      this.gameState.player.library = deckInformation.cardNames.map((cardName, index) => ({
        name: cardName,
        id: `${cardName}_${index}_${Date.now()}`,
        cost: deckInformation.cardInfo[cardName]?.cost || '0',
        type: deckInformation.cardInfo[cardName]?.type || 'Unknown',
        rulesText: deckInformation.cardInfo[cardName]?.rulesText || '',
        text: deckInformation.cardInfo[cardName]?.rulesText || '',
        tapped: false,
        counters: {}
      }));

      console.log('Library initialized with', this.gameState.player.library.length, 'cards');

      this.gameState.shuffleLibrary('player');
      console.log('Library shuffled, new length:', this.gameState.player.library.length);

      this.uiManager.showGameContent();
      this.updateDeckSize();
      this.updateDeckSelector(source);

      // Enable default deck buttons
      const setBtn = document.getElementById('setPlayer1DefaultBtnModal');
      const clearBtn = document.getElementById('clearPlayer1DefaultBtnModal');
      if (setBtn) setBtn.disabled = false;
      if (clearBtn) clearBtn.disabled = false;

      // Check if default deck
      const isDefault = this.isDefaultDeck(source);
      const message = isDefault
        ? `Loaded deck: ${this.currentDeck.name} ⭐ (Default)`
        : `Loaded deck: ${this.currentDeck.name}`;

      this.uiManager.showToast(message, 'success');

    } catch (error) {
      console.error('Error processing deck:', error);
      this.uiManager.showErrorState('Failed to process deck. Please check the file format.');
    }
  },

  extractDeckName(xmlDoc, source) {
    const deckNameElement = xmlDoc.querySelector('deck name, deckname, title');
    if (deckNameElement) {
      return deckNameElement.textContent.trim();
    }

    if (typeof source === 'string') {
      return source.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
    }

    return 'Custom Deck';
  },

  resetGameState() {
    this.gameState.player.hand = [];
    this.gameState.player.battlefield = { lands: [], creatures: [], others: [] };
    this.gameState.player.graveyard = [];
    this.gameState.player.exile = [];
    this.gameState.player.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0,
      life: 20
    };
    this.gameState.player.selectedCards.clear();
    this.gameState.player.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

    // Reset turn state
    this.gameState.turnState = {
      activePlayer: 'player',
      phase: 'main1',
      step: 'main',
      priority: 'player',
      turnNumber: 1,
      isFirstTurn: true
    };

    // Reset combat state
    this.gameState.combatState = {
      step: 'none',
      attackers: [],
      blockers: [],
      combatDamage: [],
      isSelectingAttackers: false,
      isSelectingBlockers: false
    };
  },

  // ===== CARD DRAWING =====

  resetAndDraw7() {
    // Full reset: shuffle, reset life, clear zones, draw 7
    if (!this.currentDeck) {
      this.uiManager.showToast('No deck loaded. Please select a deck first.', 'warning');
      return;
    }

    // Reset life
    this.gameState.player.gameStats.life = 20;

    // Clear all zones
    this.gameState.player.hand = [];
    this.gameState.player.battlefield = { lands: [], creatures: [], others: [] };
    this.gameState.player.graveyard = [];
    this.gameState.player.exile = [];

    // Rebuild library from deck with full card objects
    this.gameState.player.library = this.currentDeck.cards.map((cardName, index) => ({
      name: cardName,
      id: `${cardName}_${index}_${Date.now()}`,
      cost: this.currentDeck.cardInfo[cardName]?.cost || '0',
      type: this.currentDeck.cardInfo[cardName]?.type || 'Unknown',
      rulesText: this.currentDeck.cardInfo[cardName]?.rulesText || '',
      text: this.currentDeck.cardInfo[cardName]?.rulesText || '',
      tapped: false,
      counters: {}
    }));

    this.gameState.shuffleLibrary('player');

    // Reset stats
    this.gameState.player.gameStats.cardsDrawn = 0;
    this.gameState.player.gameStats.mulligans = 0;
    this.gameState.player.gameStats.landsPlayed = 0;
    this.gameState.player.gameStats.spellsCast = 0;

    // Draw 7
    this.drawHand(7);

    this.uiManager.showToast('New game started - shuffled and drew 7 cards', 'success');
    this.playSound('shuffle');
  },

  drawHand(handSize = 7) {
    console.log('=== drawHand called ===', 'handSize:', handSize);

    if (this.gameState.activePlayer === 'opponent') {
      return this.drawOpponentHand(handSize);
    }

    if (!this.currentDeck) {
      this.uiManager.showToast('No deck loaded. Please select a deck first.', 'warning');
      return;
    }

    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty. Cannot draw cards.', 'warning');
      return;
    }

    this.uiManager.showGameContent();

    // Clear current hand
    this.gameState.player.hand = [];
    this.gameState.player.selectedCards.clear();

    // Draw cards
    const actualHandSize = Math.min(handSize, this.gameState.player.library.length);
    for (let i = 0; i < actualHandSize; i++) {
      this.drawCard(false);
    }

    this.autoSortHand();
    this.updateHandDisplay();
    this.uiManager.showToast(`Drew ${actualHandSize} cards`, 'success');
  },

  drawCard(showAnimation = true) {
    console.log('drawCard called');

    const library = this.gameState.player.library;
    const hand = this.gameState.player.hand;
    const gameStats = this.gameState.player.gameStats;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      return;
    }

    const card = library.pop();

    // Mark as recently drawn and auto-clear after 7 seconds
    card.recentlyDrawn = true;
    setTimeout(() => {
      card.recentlyDrawn = false;
      this.updateHandDisplay();
    }, 7000);

    hand.push(card);
    gameStats.cardsDrawn++;

    this.gameState.addToGameLog(`Drew ${card.name}`, 'draw');

    if (showAnimation) {
      this.updateHandDisplay();

      setTimeout(() => {
        const handContainer = document.getElementById('handContainer');
        if (handContainer) {
          const lastCard = handContainer.lastElementChild;
          if (lastCard) {
            lastCard.classList.add('card-draw-animation');
          }
        }
      }, 10);
    }

    this.updateDeckSize();
    this.uiManager.updateHandCountDisplay('player');
  },

  drawOpponentCard() {
    if (this.gameState.opponent.library.length === 0) {
      this.uiManager.showToast('Opponent library is empty!', 'warning');
      return;
    }

    const card = this.gameState.opponent.library.pop();

    // Mark as recently drawn and auto-clear after 7 seconds
    card.recentlyDrawn = true;
    setTimeout(() => {
      card.recentlyDrawn = false;
      this.updateOpponentHandDisplay();
    }, 7000);

    this.gameState.opponent.hand.push(card);
    this.gameState.opponent.gameStats.cardsDrawn++;

    this.gameState.addToGameLog('Opponent drew a card', 'draw');
    this.autoSortOpponentHand();
    this.updateOpponentHandDisplay();
    this.uiManager.updateHandCountDisplay('opponent');
  },

  drawOpponentHand(handSize = 7) {
    if (!this.gameState.opponent.library || this.gameState.opponent.library.length === 0) {
      this.uiManager.showToast('Opponent has no deck loaded', 'warning');
      return;
    }

    this.gameState.opponent.hand = [];
    this.gameState.opponent.selectedCards.clear();

    const actualHandSize = Math.min(handSize, this.gameState.opponent.library.length);
    for (let i = 0; i < actualHandSize; i++) {
      const card = this.gameState.opponent.library.pop();
      this.gameState.opponent.hand.push(card);
    }

    this.gameState.opponent.gameStats.cardsDrawn += actualHandSize;
    this.autoSortOpponentHand();
    this.updateOpponentHandDisplay();
    this.uiManager.showToast(`Opponent drew ${actualHandSize} cards`, 'success');
  },

  // ===== MULLIGAN =====

  mulligan() {
    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty. Cannot mulligan.', 'warning');
      return;
    }

    // Put cards back
    this.gameState.player.library.push(...this.gameState.player.hand);
    this.gameState.shuffleLibrary('player');
    this.gameState.player.hand = [];
    this.gameState.player.selectedCards.clear();

    // Track mulligans
    this.gameState.player.gameStats.mulligans++;

    // Draw new hand (1 fewer card per mulligan)
    const handSize = Math.max(0, 7 - this.gameState.player.gameStats.mulligans);
    for (let i = 0; i < Math.min(handSize, this.gameState.player.library.length); i++) {
      this.drawCard(false);
    }

    this.autoSortHand();
    this.updateHandDisplay();
    this.uiManager.showToast(`Mulligan ${this.gameState.player.gameStats.mulligans}`, 'info');
  },

  mulliganOpponent() {
    if (!this.gameState.opponent.library || this.gameState.opponent.library.length === 0) {
      this.uiManager.showToast('Opponent has no deck loaded', 'warning');
      return;
    }

    this.gameState.opponent.library.push(...this.gameState.opponent.hand);
    this.gameState.shuffleLibrary('opponent');
    this.gameState.opponent.hand = [];
    this.gameState.opponent.selectedCards.clear();
    this.gameState.opponent.gameStats.mulligans++;

    const handSize = Math.max(0, 7 - this.gameState.opponent.gameStats.mulligans);
    this.drawOpponentHand(handSize);
    this.uiManager.showToast(`Opponent mulligan ${this.gameState.opponent.gameStats.mulligans}`, 'info');
  },

  redrawHand() {
    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty. Cannot redraw cards.', 'warning');
      return;
    }

    this.gameState.player.library.push(...this.gameState.player.hand);
    this.gameState.shuffleLibrary('player');
    this.gameState.player.hand = [];
    this.gameState.player.selectedCards.clear();

    const handSize = Math.min(7, this.gameState.player.library.length);
    for (let i = 0; i < handSize; i++) {
      this.drawCard(false);
    }

    this.autoSortHand();
    this.updateHandDisplay();
    this.uiManager.showToast(`Redrew ${handSize} cards (no penalty)`, 'success');
  },

  redrawOpponentHand() {
    if (!this.gameState.opponent.library || this.gameState.opponent.library.length === 0) {
      this.uiManager.showToast('Opponent has no deck loaded', 'warning');
      return;
    }

    this.gameState.opponent.library.push(...this.gameState.opponent.hand);
    this.gameState.shuffleLibrary('opponent');
    this.drawOpponentHand(7);
    this.uiManager.showToast('Opponent redrew 7 cards (no penalty)', 'success');
  },

  // ===== TURN MANAGEMENT =====

  endTurn() {
    console.log('Ending turn for:', this.gameState.turnState.activePlayer);

    // Clear mana pool
    this.gameState.clearManaPool(this.gameState.turnState.activePlayer);

    // Reset lands played for next turn
    const currentPlayer = this.gameState.getCurrentPlayer();
    currentPlayer.gameStats.landsPlayed = 0;

    // Switch active player
    this.gameState.switchActivePlayer();
    this.gameState.turnState.turnNumber++;
    this.gameState.turnState.phase = 'beginning';
    this.gameState.turnState.step = 'untap';
    this.gameState.turnState.isFirstTurn = false;

    this.gameState.addToGameLog(
      `Turn ${this.gameState.turnState.turnNumber} - ${this.gameState.turnState.activePlayer}'s turn`,
      'turn'
    );

    // Execute beginning phase
    this.executeBeginningPhase();
    this.uiManager.updateTurnDisplay();
    this.uiManager.updateActivePlayerHighlight();
  },

  executeBeginningPhase() {
    this.executeUntapStep();
    this.executeUpkeepStep();
    this.executeDrawStep();
  },

  executeUntapStep() {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Untap all permanents
    ['lands', 'creatures', 'others'].forEach(zone => {
      currentPlayer.battlefield[zone].forEach(card => {
        if (this.cardMechanics.isTapped(card)) {
          this.cardMechanics.untap(card);
        }
        // Clear summoning sickness
        if (card.summoningSickness) {
          card.summoningSickness = false;
        }
      });
    });

    this.gameState.addToGameLog('Untap step', 'phase');
    this.updateBattlefieldDisplay();
  },

  executeUpkeepStep() {
    this.gameState.addToGameLog('Upkeep step', 'phase');
    // Check for upkeep triggers (Delver, etc.)
    this.checkDelverTriggers();
  },

  executeDrawStep() {
    // Skip draw on first turn (optional rule)
    if (!this.gameState.turnState.isFirstTurn || this.gameState.turnState.turnNumber > 1) {
      if (this.gameState.turnState.activePlayer === 'player') {
        this.drawCard();
      } else {
        this.drawOpponentCard();
      }
    }

    this.gameState.turnState.phase = 'main1';
    this.gameState.turnState.step = 'main';
    this.gameState.addToGameLog('Main phase 1', 'phase');
    this.uiManager.updateTurnDisplay();
  },

  advancePhase() {
    console.log('Advancing phase from:', this.gameState.turnState.phase);

    // Clear mana pool when leaving phases
    if (this.gameState.turnState.phase === 'main1' || this.gameState.turnState.phase === 'combat') {
      this.gameState.clearManaPool(this.gameState.turnState.activePlayer);
    }

    switch (this.gameState.turnState.phase) {
      case 'beginning':
        this.gameState.turnState.phase = 'main1';
        this.gameState.turnState.step = 'main';
        break;
      case 'main1':
        this.combatManager.initializeCombat();
        break;
      case 'combat':
        this.gameState.turnState.phase = 'main2';
        this.gameState.turnState.step = 'main';
        break;
      case 'main2':
        this.gameState.turnState.phase = 'end';
        this.gameState.turnState.step = 'end';
        break;
      case 'end':
        this.endTurn();
        return;
    }

    this.gameState.addToGameLog(`${this.gameState.turnState.phase} phase`, 'phase');
    this.uiManager.updateTurnDisplay();
  },

  // === HELPER METHODS ===

  checkDelverTriggers() {
    // Delver triggers are now handled by TriggeredAbilities module
    // This method is called from executeUpkeepStep() and delegates to the mixin
    if (typeof this.triggerDelverReveal === 'function') {
      // Call the TriggeredAbilities version
      const activePlayer = this.gameState.turnState.activePlayer === 'player'
        ? this.gameState.player
        : this.gameState.opponent;
      const battlefield = activePlayer.battlefield;

      const delvers = battlefield.creatures.filter(card => {
        const cardName = (card.name || '').toLowerCase();
        const currentFace = (card.currentFace || card.name).toLowerCase();
        return cardName === 'delver of secrets' && currentFace === 'delver of secrets';
      });

      delvers.forEach((delver) => {
        this.triggerDelverReveal(delver);
      });
    }
  },

  updateHandDisplay() {
    this.uiManager.updateZoneDisplay('hand', 'player');
  },

  updateOpponentHandDisplay() {
    this.uiManager.updateZoneDisplay('hand', 'opponent');
  },

  updateBattlefieldDisplay() {
    this.uiManager.updateZoneDisplay('battlefield', 'player');
    this.uiManager.updateZoneDisplay('battlefield', 'opponent');
  },

  updateDeckSize() {
    const deckSizeElements = document.querySelectorAll('[id*="deckSize"], [id*="libraryCount"]');
    deckSizeElements.forEach(el => {
      el.textContent = this.gameState.player.library.length;
    });
  },

  updateDeckSelector(deckPath) {
    if (!this.currentDeck) return;
    this.uiManager.updateDeckSelector(deckPath, this.currentDeck.name);
  },

  saveDefaultDeck(deckPath) {
    localStorage.setItem('mtg_default_deck', deckPath);
  },

  isDefaultDeck(deckPath) {
    return localStorage.getItem('mtg_default_deck') === deckPath;
  },

  setPlayer1DeckAsDefault() {
    if (!this.currentDeck || !this.currentDeck.source) {
      this.uiManager.showToast('No Player 1 deck loaded to set as default', 'warning');
      return;
    }

    localStorage.setItem('mtg_default_deck', this.currentDeck.source);
    this.uiManager.showToast(`${this.currentDeck.name} set as default Player 1 deck ⭐`, 'success');

    // Enable/disable buttons
    const setBtn = document.getElementById('setPlayer1DefaultBtnModal');
    const clearBtn = document.getElementById('clearPlayer1DefaultBtnModal');
    if (setBtn) setBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
  },

  clearDefaultPlayer1Deck() {
    const hadDefault = localStorage.getItem('mtg_default_deck');
    localStorage.removeItem('mtg_default_deck');

    if (hadDefault) {
      this.uiManager.showToast('Default Player 1 deck cleared', 'info');
    } else {
      this.uiManager.showToast('No default Player 1 deck set', 'warning');
    }
  },

  analyzeDeckAbilities() {
    // Stub for deck ability analysis
    console.log('Analyzing deck abilities...');
  },

  // ===== OPPONENT DECK LOADING =====

  async loadOpponentDeck(deckPath) {
    if (!deckPath) {
      return;
    }

    try {
      console.log('Loading opponent deck:', deckPath);
      const xmlDoc = await loadXMLDoc(deckPath);
      console.log('XML loaded for opponent, processing...', xmlDoc);

      // Extract deck information
      const deckInformation = getCardNameXML(xmlDoc);

      if (!deckInformation || !deckInformation.cardNames) {
        throw new Error('Invalid opponent deck format');
      }

      // Set opponent deck
      this.gameState.opponent.currentDeck = {
        cardNames: deckInformation.cardNames,
        cardInfo: deckInformation.cardInfo
      };
      this.gameState.opponent.deckName = this.extractDeckName(xmlDoc, deckPath);
      this.gameState.opponent.deckPath = deckPath;

      console.log('Opponent deck set:', this.gameState.opponent.deckName);

      // Reset opponent game state (but preserve deck info)
      this.resetOpponentGameState();

      // Set library after reset - create proper card objects
      this.gameState.opponent.library = deckInformation.cardNames.map((cardName, index) => ({
        name: cardName,
        id: `opponent_${cardName}_${index}_${Date.now()}`,
        cost: deckInformation.cardInfo[cardName]?.cost || '0',
        type: deckInformation.cardInfo[cardName]?.type || 'Unknown',
        rulesText: deckInformation.cardInfo[cardName]?.rulesText || '',
        text: deckInformation.cardInfo[cardName]?.rulesText || '',
        tapped: false,
        counters: {}
      }));

      console.log('Opponent library initialized with', this.gameState.opponent.library.length, 'cards');

      this.gameState.shuffleLibrary('opponent');
      this.updateOpponentUI();

      // Check if this is the default opponent deck
      const isDefault = localStorage.getItem('mtg_default_opponent_deck') === deckPath;
      const message = isDefault
        ? `Opponent loaded: ${this.gameState.opponent.deckName} ⭐ (Default)`
        : `Opponent loaded: ${this.gameState.opponent.deckName}`;

      this.uiManager.showToast(message, 'success');

      // Update opponent deck selector labels
      this.updateOpponentDeckSelectorLabels();

    } catch (error) {
      console.error('Error loading opponent deck:', error);
      this.uiManager.showToast(`Failed to load opponent deck: ${error.message}`, 'error');
    }
  },

  resetOpponentGameState() {
    this.gameState.opponent.hand = [];
    this.gameState.opponent.battlefield = { lands: [], creatures: [], others: [] };
    this.gameState.opponent.graveyard = [];
    this.gameState.opponent.exile = [];
    this.gameState.opponent.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      mulligans: 0,
      life: 20
    };
    this.gameState.opponent.selectedCards.clear();
    this.gameState.opponent.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  },

  updateOpponentUI() {
    this.uiManager.updateZoneDisplay('hand', 'opponent');
    this.uiManager.updateZoneDisplay('battlefield', 'opponent');
    this.uiManager.updateLifeDisplay('opponent');
    this.uiManager.updateHandCountDisplay('opponent');
  },

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

  setOpponentDeckAsDefault() {
    const deckPath = this.gameState.opponent.deckPath;
    if (!deckPath) {
      this.uiManager.showToast('No opponent deck loaded', 'warning');
      return;
    }

    localStorage.setItem('mtg_default_opponent_deck', deckPath);
    this.uiManager.showToast(`${this.gameState.opponent.deckName} set as default opponent deck ⭐`, 'success');
    this.updateOpponentDeckSelectorLabels();
  },

  clearDefaultOpponentDeck() {
    const hadDefault = localStorage.getItem('mtg_default_opponent_deck');
    localStorage.removeItem('mtg_default_opponent_deck');

    if (hadDefault) {
      this.uiManager.showToast('Default opponent deck cleared', 'info');

      // Remove star from opponent deck selector options
      const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
      if (opponentDeckSelect) {
        Array.from(opponentDeckSelect.options).forEach(option => {
          option.textContent = option.textContent.replace('⭐ ', '');
        });
      }
    } else {
      this.uiManager.showToast('No default opponent deck set', 'warning');
    }
  },

  async loadDefaultOpponentDeckFromStorage() {
    const defaultDeck = localStorage.getItem('mtg_default_opponent_deck');
    console.log('loadDefaultOpponentDeckFromStorage called, found:', defaultDeck);

    if (defaultDeck) {
      try {
        await this.loadOpponentDeck(defaultDeck);
        console.log('Default opponent deck loaded successfully');
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

  // ===== CARD TRANSFORMATION =====

  transformCard(cardId) {
    console.log(`Attempting to transform card: ${cardId}`);

    // Find the card in all zones
    let card = null;
    let zone = null;
    let playerName = null;

    // Check player battlefield
    for (const zoneType of ['lands', 'creatures', 'others']) {
      const found = this.gameState.player.battlefield[zoneType].find(c => (c.id || `${c.name}_0`) === cardId);
      if (found) {
        card = found;
        zone = 'player_battlefield';
        playerName = 'player';
        break;
      }
    }

    // Check opponent battlefield
    if (!card) {
      for (const zoneType of ['lands', 'creatures', 'others']) {
        const found = this.gameState.opponent.battlefield[zoneType].find(c => (c.id || `${c.name}_0`) === cardId);
        if (found) {
          card = found;
          zone = 'opponent_battlefield';
          playerName = 'opponent';
          break;
        }
      }
    }

    if (!card) {
      console.error('Card not found for transform:', cardId);
      return;
    }

    const dfcData = this.getDFCData(card.name);
    if (!dfcData) {
      console.error('Card is not a DFC:', card.name);
      return;
    }

    // Determine which face to transform to
    const currentName = card.currentFace || card.name;
    const isOnFrontFace = currentName.toLowerCase() === dfcData.frontFace.toLowerCase();

    if (isOnFrontFace) {
      // Transform to back face
      card.currentFace = dfcData.backFace;
      card.transformed = true;
      this.gameState.addToGameLog(playerName === 'player' ? 'You' : 'Opponent', `Transform ${dfcData.frontFace} → ${dfcData.backFace}`, 'manual');
      this.uiManager.showToast(`${dfcData.frontFace} transformed into ${dfcData.backFace}!`, 'success');
    } else if (dfcData.canTransformBack) {
      // Transform back to front face
      card.currentFace = dfcData.frontFace;
      card.transformed = false;
      this.gameState.addToGameLog(playerName === 'player' ? 'You' : 'Opponent', `Transform ${dfcData.backFace} → ${dfcData.frontFace}`, 'manual');
      this.uiManager.showToast(`${dfcData.backFace} transformed back into ${dfcData.frontFace}!`, 'success');
    } else {
      this.uiManager.showToast(`${card.name} cannot transform back`, 'warning');
      return;
    }

    // Update displays
    this.uiManager.updateZoneDisplay('battlefield', playerName);
    this.uiManager.updateAll();
  },

  // Get DFC data from card-mechanics module
  getDFCData(cardName) {
    return DFC_DATABASE[cardName.toLowerCase()];
  },

  // ===== QUICK ACTIONS =====

  untapAll() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    let untappedCount = 0;

    ['lands', 'creatures', 'others'].forEach(zone => {
      currentPlayer.battlefield[zone].forEach(card => {
        if (this.cardMechanics.isTapped(card)) {
          this.cardMechanics.untap(card);
          untappedCount++;
        }
      });
    });

    if (untappedCount > 0) {
      this.uiManager.showToast(`Untapped ${untappedCount} permanent${untappedCount !== 1 ? 's' : ''}`, 'success');
      this.updateBattlefieldDisplay();
      this.gameState.addToGameLog(`Untapped all permanents (${untappedCount})`, 'manual');
    } else {
      this.uiManager.showToast('No tapped permanents to untap', 'info');
    }
  }
};
