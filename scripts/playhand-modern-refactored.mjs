/**
 * Modern Hand Simulator - Refactored & Modularized
 * Features: Deck integration, hand simulation, battlefield management, modern animations, card images
 *
 * REFACTORED: Now uses modular architecture for better maintainability
 */

import { CardImageService } from '/src/services/cardImageService.mjs';
import { loadXMLDoc, getCardNameXML } from './config.mjs';
import { GameState } from './modules/game-state.mjs';
import { CardMechanics, DFC_DATABASE } from './modules/card-mechanics.mjs';
import { UIManager } from './modules/ui-updates.mjs';
import { EnhancedCombatManager } from './modules/combat-enhanced.mjs';
import { CoreMethods } from './modules/core-methods.mjs';
import { LibraryModals } from './modules/library-modals.mjs';
import { TriggeredAbilities } from './modules/triggered-abilities.mjs';
import { Fetchlands } from './modules/fetchlands.mjs';
import { OpponentMethods } from './modules/opponent-methods.mjs';
import { ContextMenus } from './modules/context-menus.mjs';
import { Planeswalker } from './modules/planeswalker.mjs';
import { Adventure } from './modules/adventure.mjs';
import { Delirium } from './modules/delirium.mjs';

class ModernHandSimulator {
  constructor() {
    // API and theme
    this.apiBase = '/api/v1';
    this.currentDeck = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';

    // Initialize modular systems
    this.gameState = new GameState();
    this.cardMechanics = new CardMechanics(this.gameState);
    this.delirium = new Delirium(this.gameState);
    this.uiManager = new UIManager(this.gameState, this.cardMechanics, this.delirium);
    this.combatManager = new EnhancedCombatManager(this.gameState, this.cardMechanics, this.uiManager);

    // Connect uiManager back to gameState for game log updates
    this.gameState.uiManager = this.uiManager;

    // Legacy compatibility - create proxies to old properties
    this.createLegacyProxies();

    // Sorted hand order for keyboard shortcuts
    this.sortedHandOrder = [];
    this.sortedOpponentHandOrder = [];

    // Predefined decks
    this.predefinedDecks = [
      './xml/BigRedMachine.xml',
      './xml/Stasis.xml',
      './xml/ZombieRenewal.xml',
      './xml/Rith.xml',
      './xml/BlackRack.xml',
      './decks/classic/goblins.xml',
      './decks/classic/dredge.xml',
      './decks/classic/trix.xml',
      './decks/classic/landstill.xml',
      './decks/classic/hightide.xml'
    ];

    // Initialize enhanced UI features
    this.soundsEnabled = localStorage.getItem('mtg-sounds-enabled') !== 'false';

    this.playerTargetClickListener = this.playerTargetClickListener.bind(this);
    this.detectLayoutMode();
    this.init();
  }

  // Create legacy proxies for backward compatibility
  createLegacyProxies() {
    // Proxy player state properties
    Object.defineProperty(this, 'library', {
      get: () => this.gameState.player.library,
      set: (val) => { this.gameState.player.library = val; }
    });
    Object.defineProperty(this, 'hand', {
      get: () => this.gameState.player.hand,
      set: (val) => { this.gameState.player.hand = val; }
    });
    Object.defineProperty(this, 'battlefield', {
      get: () => this.gameState.player.battlefield,
      set: (val) => { this.gameState.player.battlefield = val; }
    });
    Object.defineProperty(this, 'graveyard', {
      get: () => this.gameState.player.graveyard,
      set: (val) => { this.gameState.player.graveyard = val; }
    });
    Object.defineProperty(this, 'exile', {
      get: () => this.gameState.player.exile,
      set: (val) => { this.gameState.player.exile = val; }
    });
    Object.defineProperty(this, 'gameStats', {
      get: () => this.gameState.player.gameStats,
      set: (val) => { this.gameState.player.gameStats = val; }
    });
    Object.defineProperty(this, 'manaPool', {
      get: () => this.gameState.player.manaPool,
      set: (val) => { this.gameState.player.manaPool = val; }
    });

    // Proxy opponent state
    Object.defineProperty(this, 'opponent', {
      get: () => this.gameState.opponent,
      set: (val) => { this.gameState.opponent = val; }
    });

    // Proxy game state properties
    Object.defineProperty(this, 'turnState', {
      get: () => this.gameState.turnState,
      set: (val) => { this.gameState.turnState = val; }
    });
    Object.defineProperty(this, 'combatState', {
      get: () => this.gameState.combatState,
      set: (val) => { this.gameState.combatState = val; }
    });
    Object.defineProperty(this, 'stack', {
      get: () => this.gameState.stack,
      set: (val) => { this.gameState.stack = val; }
    });
    Object.defineProperty(this, 'targetingMode', {
      get: () => this.gameState.targetingMode,
      set: (val) => { this.gameState.targetingMode = val; }
    });

    // Proxy DFC database
    Object.defineProperty(this, 'dfcDatabase', {
      get: () => DFC_DATABASE
    });
  }

  detectLayoutMode() {
    this.isTwoPlayerMode = window.innerWidth >= 1400;

    window.addEventListener('resize', () => {
      const newMode = window.innerWidth >= 1400;
      if (newMode !== this.isTwoPlayerMode) {
        this.isTwoPlayerMode = newMode;
        this.updateLayoutMode();
      }
    });

    setTimeout(() => {
      this.initializeEnhancedUI();
    }, 100);
  }

  updateLayoutMode() {
    const twoPlayerLayout = document.querySelector('.two-player-layout');
    const singlePlayerLayout = document.querySelector('.single-player-layout');

    if (this.isTwoPlayerMode) {
      if (twoPlayerLayout) twoPlayerLayout.style.display = 'grid';
      if (singlePlayerLayout) singlePlayerLayout.style.display = 'none';
      this.uiManager.showToast('Switched to two-player layout', 'info');
    } else {
      if (twoPlayerLayout) twoPlayerLayout.style.display = 'none';
      if (singlePlayerLayout) singlePlayerLayout.style.display = 'block';
      this.uiManager.showToast('Switched to single-player layout', 'info');
    }

    this.updateUI();
    this.uiManager.updateTurnDisplay();
  }

  async init() {
    this.setupTheme();

    setTimeout(() => {
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.populatePredefinedDecks();
      this.setupZoneTabs();
      // Don't show empty state - default deck will load automatically
      this.loadDefaultDeck();
    }, 500);
  }

  async loadDefaultDeck() {
    // Load opponent deck after a delay to ensure proper initialization
    setTimeout(async () => {
      await this.loadDefaultOpponentDeckFromStorage();
      this.updateOpponentDeckSelectorLabels();
    }, 1500);

    // Don't load if already loaded
    if (this.currentDeck) return;

    // Try to load saved default deck from localStorage
    const savedDefault = localStorage.getItem('mtg_default_deck');

    if (savedDefault) {
      try {
        await this.loadDeck(savedDefault);
        return;
      } catch (error) {
        console.error('Failed to load saved default:', error);
      }
    }

    // Fallback: load affinity if no default was saved or loading failed
    this.loadDeck('./decks/classic/affinity.xml');
  }

  setupTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.setupTheme();
    this.uiManager.showToast(`Switched to ${this.currentTheme} theme`, 'info');
  }

  toggleMobileMenu() {
    document.body.classList.toggle('mobile-sidebar-open');
  }

  // Delegate methods to appropriate modules
  showToast(message, type = 'info') {
    return this.uiManager.showToast(message, type);
  }

  updateUI() {
    return this.uiManager.updateAll();
  }

  updateTurnDisplay() {
    return this.uiManager.updateTurnDisplay();
  }

  showLoadingState() {
    return this.uiManager.showLoadingState();
  }

  showEmptyState() {
    return this.uiManager.showEmptyState();
  }

  showGameContent() {
    return this.uiManager.showGameContent();
  }

  showErrorState(message) {
    return this.uiManager.showErrorState(message);
  }

  // Combat delegation
  initializeCombat() {
    return this.combatManager.initializeCombat();
  }

  advanceCombatStep() {
    return this.combatManager.advanceCombatStep();
  }

  toggleAttacker(cardId) {
    return this.combatManager.toggleAttacker(cardId);
  }

  finalizeDeclareAttackers() {
    return this.combatManager.finalizeDeclareAttackers();
  }

  // Mana value parsing delegation
  parseManaValue(cost) {
    return this.cardMechanics.parseManaValue(cost);
  }

  // NOTE: The rest of the methods from the original file will remain here temporarily
  // for backward compatibility. They should gradually be moved to appropriate modules.

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Quick deck selector
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      quickDeckSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.loadPredefinedDeck(e.target.value);
        }
      });
    }

    // Opponent deck selector
    const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
    if (opponentDeckSelect) {
      opponentDeckSelect.addEventListener('change', async (e) => {
        if (e.target.value) {
          await this.loadOpponentDeck(e.target.value);
        }
      });
    }

    // Deck selection events
    document.addEventListener('deckSelected', (e) => {
      this.loadPredefinedDeck(e.detail.deckPath);
    });

    // File upload
    const loadXMLButton = document.getElementById('loadXMLFileButton');
    const xmlFile = document.getElementById('xmlFile');
    if (loadXMLButton && xmlFile) {
      loadXMLButton.addEventListener('click', () => xmlFile.click());
      xmlFile.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // End turn button
    const endTurnButton = document.getElementById('endTurnButton');
    if (endTurnButton) {
      endTurnButton.addEventListener('click', () => this.endTurn());
    }

    // Test counters button
    const testCountersButton = document.getElementById('testCountersButton');
    if (testCountersButton) {
      testCountersButton.addEventListener('click', () => this.testCountersFeature());
    }

    // Sort hand dropdown
    const sortHandDropdown = document.querySelectorAll('[data-sort-mode]');
    sortHandDropdown.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const sortMode = e.target.getAttribute('data-sort-mode');
        const player = e.target.getAttribute('data-player') || 'player';

        if (player === 'opponent') {
          this.sortOpponentHand(sortMode);
        } else {
          this.sortHand(sortMode);
        }

        // Close dropdown after selection
        const dropdownMenu = e.target.closest('.dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.remove('show');
        }
      });
    });

    // Initialize sort button text from saved preference
    const savedSortMode = localStorage.getItem('mtg-hand-sort-mode') || 'lands-first';
    const savedOpponentSortMode = localStorage.getItem('mtg-opponent-hand-sort-mode') || 'lands-first';
    const modeLabels = {
      'hands-first': '🔄 Spells First',
      'lands-first': '🔄 Lands First',
      'cmc': '🔄 By Mana Value',
      'type': '🔄 By Type',
      'name': '🔄 Alphabetical'
    };

    const sortButton = document.getElementById('sortHandButton');
    if (sortButton) {
      sortButton.textContent = modeLabels[savedSortMode] || modeLabels['hands-first'];

      // Manual dropdown toggle (fallback if Bootstrap isn't working)
      sortButton.addEventListener('click', (e) => {
        const dropdownMenu = sortButton.nextElementSibling;
        if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
          dropdownMenu.classList.toggle('show');
        }
      });
    }

    const sortOpponentButton = document.getElementById('sortOpponentHandButton');
    if (sortOpponentButton) {
      sortOpponentButton.textContent = modeLabels[savedOpponentSortMode] || modeLabels['hands-first'];

      // Manual dropdown toggle
      sortOpponentButton.addEventListener('click', (e) => {
        const dropdownMenu = sortOpponentButton.nextElementSibling;
        if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
          dropdownMenu.classList.toggle('show');
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      const soundText = this.soundsEnabled ? '🔊 Sounds: On' : '🔇 Sounds: Off';
      soundToggle.textContent = soundText;
    }

    // Card preview modal close button
    const closeCardPreview = document.getElementById('closeCardPreview');
    const cardPreviewModal = document.getElementById('cardPreviewModal');
    if (closeCardPreview) {
      closeCardPreview.addEventListener('click', () => this.hideCardPreview());
    }

    // Also close modal when clicking on the backdrop
    if (cardPreviewModal) {
      cardPreviewModal.addEventListener('click', (e) => {
        if (e.target === cardPreviewModal) {
          this.hideCardPreview();
        }
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Prevent shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Number keys (1-7) - Play card from hand by position
      if (e.key >= '1' && e.key <= '7') {
        const position = parseInt(e.key) - 1; // Convert to 0-indexed
        this.playCardByPosition(position);
        return;
      }

      // D - Draw card
      if (e.key === 'd' || e.key === 'D') {
        this.drawCard();
      }

      // M - Mulligan
      if (e.key === 'm' || e.key === 'M') {
        this.mulligan();
      }

      // T - End turn
      if (e.key === 't' || e.key === 'T') {
        this.endTurn();
      }

      // U - Undo
      if (e.key === 'u' || e.key === 'U') {
        this.undo();
      }

      // ? - Show keyboard help
      if (e.key === '?') {
        this.showKeyboardHelp();
      }
    });
  }

  setupZoneTabs() {
    // Zone tab functionality
    const zoneTabs = document.querySelectorAll('[data-zone-tab]');
    zoneTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const zoneName = tab.getAttribute('data-zone-tab');
        this.switchZone(zoneName);
      });
    });
  }

  switchZone(zoneName) {
    // Update active tab
    document.querySelectorAll('[data-zone-tab]').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-zone-tab') === zoneName);
    });

    // Show appropriate zone content
    document.querySelectorAll('[data-zone-content]').forEach(content => {
      content.style.display = content.getAttribute('data-zone-content') === zoneName ? 'block' : 'none';
    });
  }

  populatePredefinedDecks() {
    const select = document.getElementById('preDefinedDecks');
    if (!select) return;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a deck...';
    select.appendChild(defaultOption);

    this.predefinedDecks.forEach(deckPath => {
      const deckName = deckPath.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
      const option = document.createElement('option');
      option.value = deckPath;
      option.textContent = deckName;
      select.appendChild(option);
    });
  }

  // NOTE: Remaining methods still needed from original file - these are stubs for now

  // Life management
  changeLife(amount) {
    this.gameState.player.gameStats.life += amount;
    this.uiManager.updateLifeDisplay('player');
    this.gameState.addToGameLog(`Life changed by ${amount} (now ${this.gameState.player.gameStats.life})`, 'life');
  }

  setLife(amount) {
    this.gameState.player.gameStats.life = amount;
    this.uiManager.updateLifeDisplay('player');
    this.gameState.addToGameLog(`Life set to ${amount}`, 'life');
  }

  changeOpponentLife(amount) {
    this.gameState.opponent.gameStats.life += amount;
    this.uiManager.updateLifeDisplay('opponent');
    this.gameState.addToGameLog(`Opponent life changed by ${amount} (now ${this.gameState.opponent.gameStats.life})`, 'life');
  }

  setOpponentLife(amount) {
    this.gameState.opponent.gameStats.life = amount;
    this.uiManager.updateLifeDisplay('opponent');
    this.gameState.addToGameLog(`Opponent life set to ${amount}`, 'life');
  }

  // Pass turn
  passTurn() {
    this.endTurn();
  }

  // Token creation
  async createToken(name, type, owner = 'player', options = {}) {
    // Create a token card object
    const token = {
      id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      type: type,
      cost: '0',
      isToken: true,
      tapped: options.tapped || false,
      power: options.power,
      toughness: options.toughness
    };

    // Parse P/T from name if it's a creature token
    const ptMatch = name.match(/(\d+)\/(\d+)/);
    if (ptMatch) {
      token.power = ptMatch[1];
      token.toughness = ptMatch[2];
    }

    // Fetch token image from Scryfall with token-specific search
    try {
      const imageUrl = await this.fetchTokenImage(name);
      if (imageUrl) {
        token.imageUrl = imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to fetch token image for ${name}:`, error);
    }

    // Determine where to put the token
    const targetPlayer = this.gameState.getPlayerState(owner);

    if (type.toLowerCase().includes('creature')) {
      targetPlayer.battlefield.creatures.push(token);
    } else {
      targetPlayer.battlefield.others.push(token);
    }

    this.gameState.addToGameLog(`Created ${name} token for ${owner}`, 'action');
    this.uiManager.showToast(`Created ${name} token`, 'success');

    // Update battlefield display
    this.uiManager.updateZoneDisplay('battlefield', owner);
  }

  async fetchTokenImage(tokenName) {
    // Static token images for common tokens
    const staticTokens = {
      'Blood': 'https://cards.scryfall.io/normal/front/f/9/f9ed3uter-crimson-vow.jpg',
      'Clue': 'https://cards.scryfall.io/normal/front/3/9/39da4c95-167d-4536-bb16-70f8d2dabc80.jpg',
      'Treasure': 'https://cards.scryfall.io/normal/front/5/f/5f95c6e6-c6ac-4d85-aa4c-d4d60cdcc797.jpg',
      'Food': 'https://cards.scryfall.io/normal/front/b/0/b0a9b01f-21e8-4f89-a24b-ca5b6a85d87d.jpg',
      'Map': 'https://cards.scryfall.io/normal/front/f/4/f484e3f7-3846-4f96-8bdb-47c6c8b75e5d.jpg',
      'Powerstone': 'https://cards.scryfall.io/normal/front/0/4/04c8f2a9-0986-4e8a-9a57-c9548fefbf58.jpg'
    };

    // Check static tokens first
    if (staticTokens[tokenName]) {
      return staticTokens[tokenName];
    }

    try {
      // Extract creature type from token name (e.g., "1/1 Soldier" -> "Soldier")
      let searchTerm = tokenName;
      let colors = '';
      const creatureMatch = tokenName.match(/\d+\/\d+\s+(.+)/);
      if (creatureMatch) {
        searchTerm = creatureMatch[1]; // Just the creature type

        // Add color context for better matching
        if (searchTerm.toLowerCase().includes('soldier') || searchTerm.toLowerCase().includes('angel')) {
          colors = 'c:white';
        } else if (searchTerm.toLowerCase().includes('zombie') || searchTerm.toLowerCase().includes('demon')) {
          colors = 'c:black';
        } else if (searchTerm.toLowerCase().includes('goblin') || searchTerm.toLowerCase().includes('dragon')) {
          colors = 'c:red';
        } else if (searchTerm.toLowerCase().includes('elf') || searchTerm.toLowerCase().includes('beast')) {
          colors = 'c:green';
        } else if (searchTerm.toLowerCase().includes('spirit')) {
          colors = '(c:blue OR c:white)';
        }
      }

      // Query Scryfall for token images
      const searchQuery = encodeURIComponent(`${searchTerm} is:token ${colors}`.trim());
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${searchQuery}&order=released&dir=desc`);

      if (!response.ok) {
        throw new Error(`Scryfall token search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Try to find a token that matches the power/toughness if specified
        if (creatureMatch) {
          const [fullPT] = tokenName.match(/(\d+)\/(\d+)/);
          const bestMatch = data.data.find(card => {
            const ptMatch = card.power && card.toughness &&
                           `${card.power}/${card.toughness}` === fullPT;
            return ptMatch;
          });

          if (bestMatch && bestMatch.image_uris?.normal) {
            return bestMatch.image_uris.normal;
          }
        }

        // Otherwise use the first result
        if (data.data[0].image_uris?.normal) {
          return data.data[0].image_uris.normal;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to fetch token image for ${tokenName}:`, error);
      return null;
    }
  }

  // Opponent deck methods are now in core-methods.mjs

  shuffleOpponentLibrary() {
    this.gameState.shuffleLibrary('opponent');
    this.uiManager.showToast('Opponent library shuffled', 'success');
  }

  shuffleLibrary() {
    this.gameState.shuffleLibrary('player');
    this.playSound('shuffle');
    this.uiManager.showToast('Library shuffled', 'success');
  }

  viewTopCard() {
    // View just the top card
    if (!this.gameState?.player?.library || this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      return;
    }
    const topCard = this.gameState.player.library[this.gameState.player.library.length - 1];
    this.uiManager.showToast(`Top card: ${topCard.name}`, 'info');
  }

  ponder() {
    this.showPonderInterface(3, 'Ponder', {
      canShuffle: true,
      drawAfter: 1,
      description: 'Look at the top three cards of your library, then put them back in any order. You may shuffle your library. Draw a card.'
    });
  }

  brainstorm() {
    // Draw 3 cards
    for (let i = 0; i < 3; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.hand.push(card);
        this.gameState.player.gameStats.cardsDrawn++;
      }
    }
    this.autoSortHand();
    this.uiManager.updateZoneDisplay('hand', 'player');
    this.uiManager.updateHandCountDisplay('player');

    // Delay to allow UI to update with new cards
    setTimeout(() => {
      this.showPutBackInterface(2, 'Brainstorm', {
        description: 'Draw three cards, then put two cards from your hand on top of your library in any order.'
      });
    }, 100);
  }

  evolvingWilds() {
    this.uiManager.showToast('Evolving Wilds - Search for basic land (not yet implemented)', 'warning');
    // TODO: Implement tutor interface for basic lands
  }

  cultivate() {
    this.uiManager.showToast('Cultivate - Search for 2 basics: 1 to battlefield, 1 to hand (not yet implemented)', 'warning');
    // TODO: Implement tutor interface for ramp
  }

  showScryInterface(amount, source, options) {
    this.uiManager.showToast(`Scry ${amount} - View top ${amount} cards (not yet implemented)`, 'warning');
    // TODO: Implement scry UI
  }

  // Additional useful library manipulation methods

  drawCards(count = 1) {
    // Draw multiple cards at once
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.hand.push(card);
        this.gameState.player.gameStats.cardsDrawn++;
        drawn.push(card.name);
      }
    }
    if (drawn.length > 0) {
      this.autoSortHand();
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.updateHandCountDisplay('player');
      this.uiManager.showToast(`Drew ${drawn.length} card(s): ${drawn.join(', ')}`, 'success');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  }

  millCards(count = 1) {
    // Mill cards from library to graveyard
    const milled = [];
    for (let i = 0; i < count; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.graveyard.push(card);
        milled.push(card.name);
      }
    }
    if (milled.length > 0) {
      this.uiManager.updateZoneDisplay('graveyard', 'player');
      this.uiManager.updateZoneCounts();
      this.uiManager.showToast(`Milled ${milled.length} card(s): ${milled.join(', ')}`, 'info');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  }

  viewTopCards(count = 3) {
    // Peek at top N cards of library
    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      return;
    }
    const topCards = this.gameState.player.library.slice(-Math.min(count, this.gameState.player.library.length)).reverse();
    const cardNames = topCards.map(c => c.name).join(', ');
    this.uiManager.showToast(`Top ${topCards.length} card(s): ${cardNames}`, 'info');
  }

  putOnTopOfLibrary(cardName) {
    // Put a card from hand on top of library
    const cardIndex = this.gameState.player.hand.findIndex(c => c.name === cardName);
    if (cardIndex !== -1) {
      const card = this.gameState.player.hand.splice(cardIndex, 1)[0];
      this.gameState.player.library.push(card);
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.showToast(`Put ${card.name} on top of library`, 'success');
    }
  }

  putOnBottomOfLibrary(cardName) {
    // Put a card from hand on bottom of library
    const cardIndex = this.gameState.player.hand.findIndex(c => c.name === cardName);
    if (cardIndex !== -1) {
      const card = this.gameState.player.hand.splice(cardIndex, 1)[0];
      this.gameState.player.library.unshift(card); // Add to beginning (bottom)
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.showToast(`Put ${card.name} on bottom of library`, 'success');
    }
  }

  tutorToHand() {
    // Simple tutor - show library and pick a card to hand
    this.uiManager.showToast('Tutor - Search library for a card (opens library view)', 'info');
    this.showLibraryModal('player');
    // TODO: Add click handler to move clicked card to hand
  }

  tutorToTop() {
    // Tutor to top of library
    this.uiManager.showToast('Vampiric Tutor - Search library and put card on top (opens library view)', 'info');
    this.showLibraryModal('player');
    // TODO: Add click handler to move clicked card to top
  }

  exile1FromTop() {
    // Exile top card (like Thought Scour, etc.)
    if (this.gameState.player.library.length > 0) {
      const card = this.gameState.player.library.pop();
      this.gameState.player.exile.push(card);
      this.uiManager.updateZoneDisplay('exile', 'player');
      this.uiManager.showToast(`Exiled ${card.name} from top of library`, 'info');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  }

  surveil(count = 1) {
    this.showSurveilInterface(count, 'Surveil');
  }

  // Quick setup
  // quickTwoPlayerSetup is now provided by OpponentMethods mixin

  undo() {
    this.uiManager.showToast('Undo - needs implementation', 'warning');
  }

  showKeyboardHelp() {
    this.uiManager.showToast('Keyboard shortcuts: D=Draw, M=Mulligan, T=End Turn, ?=Help', 'info');
  }

  testCountersFeature() {
    this.uiManager.showToast('Test counters - needs implementation', 'info');
  }

  // Player deck default management
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
  }

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
  }

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

  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    localStorage.setItem('mtg-sounds-enabled', this.soundsEnabled);
    this.uiManager.showToast(`Sounds ${this.soundsEnabled ? 'enabled' : 'disabled'}`, 'info');

    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      const soundText = this.soundsEnabled ? '🔊 Sounds: On' : '🔇 Sounds: Off';
      soundToggle.textContent = soundText;
    }
  }

  playSound(soundType) {
    if (!this.soundsEnabled) return;

    // Initialize audio context on first use
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (soundType) {
      case 'shuffle':
        // Shuffle sound - quick swoosh with multiple tones
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.frequency.setValueAtTime(200 - i * 50, now + i * 0.03);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.1 + i * 0.03);
          gain.gain.setValueAtTime(0.1, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 + i * 0.03);

          osc.start(now + i * 0.03);
          osc.stop(now + 0.15 + i * 0.03);
        }
        break;

      case 'draw':
        const oscDraw = ctx.createOscillator();
        const gainDraw = ctx.createGain();
        oscDraw.connect(gainDraw);
        gainDraw.connect(ctx.destination);
        oscDraw.frequency.setValueAtTime(400, now);
        oscDraw.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainDraw.gain.setValueAtTime(0.15, now);
        gainDraw.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscDraw.start(now);
        oscDraw.stop(now + 0.1);
        break;

      case 'play':
        const oscPlay = ctx.createOscillator();
        const gainPlay = ctx.createGain();
        oscPlay.connect(gainPlay);
        gainPlay.connect(ctx.destination);
        oscPlay.frequency.setValueAtTime(300, now);
        oscPlay.frequency.setValueAtTime(400, now + 0.05);
        gainPlay.gain.setValueAtTime(0.2, now);
        gainPlay.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscPlay.start(now);
        oscPlay.stop(now + 0.15);
        break;

      case 'success':
        const oscSuccess = ctx.createOscillator();
        const gainSuccess = ctx.createGain();
        oscSuccess.connect(gainSuccess);
        gainSuccess.connect(ctx.destination);
        oscSuccess.frequency.setValueAtTime(523, now);
        oscSuccess.frequency.setValueAtTime(659, now + 0.08);
        oscSuccess.frequency.setValueAtTime(784, now + 0.16);
        gainSuccess.gain.setValueAtTime(0.15, now);
        gainSuccess.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        oscSuccess.start(now);
        oscSuccess.stop(now + 0.25);
        break;

      default:
        const oscDefault = ctx.createOscillator();
        const gainDefault = ctx.createGain();
        oscDefault.connect(gainDefault);
        gainDefault.connect(ctx.destination);
        oscDefault.frequency.setValueAtTime(440, now);
        gainDefault.gain.setValueAtTime(0.1, now);
        gainDefault.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscDefault.start(now);
        oscDefault.stop(now + 0.1);
    }
  }

  initializeEnhancedUI() {
    // Enhanced UI features initialization
    // Most features are handled by modern-ui.mjs and event listeners
    console.log('Enhanced UI initialized');
  }

  async loadDefaultOpponentDeckFromStorage() {
    return await this.tryLoadDefaultOpponentDeck();
  }

  updateOpponentDeckSelectorLabels() {
    const defaultDeck = localStorage.getItem('mtg_default_opponent_deck');
    if (!defaultDeck) return;

    const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
    const opponentDeckSelectModal = document.getElementById('opponentDeckSelectModal');

    [opponentDeckSelect, opponentDeckSelectModal].forEach(select => {
      if (select) {
        Array.from(select.options).forEach(option => {
          if (option.value === defaultDeck) {
            if (!option.textContent.includes('⭐')) {
              option.textContent = `⭐ ${option.textContent}`;
            }
          } else {
            option.textContent = option.textContent.replace('⭐ ', '');
          }
        });
      }
    });
  }

  playerTargetClickListener(event) {
    console.log('playerTargetClickListener - stub method, needs implementation from original');
    // TODO: Copy implementation from original file
  }

  async showCardPreview(cardName) {
    const modal = document.getElementById('cardPreviewModal');
    const previewCardName = document.getElementById('previewCardName');
    const previewCardImage = document.getElementById('previewCardImage');
    const previewCardInfo = document.getElementById('previewCardInfo');

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) {
      console.error('Missing modal elements for card preview');
      return;
    }

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';

    // Clear and set loading message (XSS-safe)
    previewCardInfo.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-center text-muted';
    loadingDiv.textContent = 'Loading card details...';
    previewCardInfo.appendChild(loadingDiv);

    // Ensure modal is visible with high z-index
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    modal.classList.add('fade-in');

    // Check if modal content needs show class for visibility
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.add('show');
      // Force visible styles as fallback
      modalContent.style.opacity = '1';
      modalContent.style.transform = 'scale(1) translateY(0)';
    }

    // Force visible background
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.opacity = '1';

    try {
      // Get high-quality image and card data
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'large');
      const cached = CardImageService.CARD_CACHE.get(`${cardName}-large`);

      // Update image
      previewCardImage.src = imageUrl;
      previewCardImage.style.display = 'block';

      // Update card info (XSS-safe)
      previewCardInfo.innerHTML = '';

      if (cached?.cardData) {
        const cardData = cached.cardData;

        // Type line
        const typeDiv = document.createElement('div');
        typeDiv.className = 'mb-2';
        const typeStrong = document.createElement('strong');
        typeStrong.textContent = 'Type: ';
        typeDiv.appendChild(typeStrong);
        typeDiv.appendChild(document.createTextNode(cardData.type_line || 'Unknown'));
        previewCardInfo.appendChild(typeDiv);

        // Mana cost
        if (cardData.mana_cost) {
          const costDiv = document.createElement('div');
          costDiv.className = 'mb-2';
          const costStrong = document.createElement('strong');
          costStrong.textContent = 'Mana Cost: ';
          costDiv.appendChild(costStrong);
          costDiv.appendChild(document.createTextNode(cardData.mana_cost));
          previewCardInfo.appendChild(costDiv);
        }

        // Colors
        if (cardData.colors && cardData.colors.length > 0) {
          const colorsDiv = document.createElement('div');
          colorsDiv.className = 'mb-2';
          const colorsStrong = document.createElement('strong');
          colorsStrong.textContent = 'Colors: ';
          colorsDiv.appendChild(colorsStrong);
          colorsDiv.appendChild(document.createTextNode(cardData.colors.join(', ')));
          previewCardInfo.appendChild(colorsDiv);
        }
      } else {
        const mutedDiv = document.createElement('div');
        mutedDiv.className = 'text-muted';
        mutedDiv.textContent = 'Card details will be available after the image loads.';
        previewCardInfo.appendChild(mutedDiv);
      }
    } catch (error) {
      console.error('Error showing card preview:', error);
      previewCardInfo.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-danger';
      errorDiv.textContent = 'Failed to load card details';
      previewCardInfo.appendChild(errorDiv);
    }
  }

  hideCardPreview() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) {
      modal.classList.remove('fade-in');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }

  showHandCardMenu(event, cardId) {
    console.log('=== showHandCardMenu called ===');
    console.log('cardId:', cardId);
    event.preventDefault();

    // Search both hands to find the card
    let currentHand = this.hand;
    let cardIndex = currentHand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    // If not found in player hand, try opponent hand
    if (cardIndex === -1) {
      currentHand = this.opponent.hand;
      cardIndex = currentHand.findIndex((card, idx) => {
        const actualCardId = card.id || `${card.name}_${idx}`;
        return actualCardId === cardId;
      });
    }

    if (cardIndex === -1) {
      console.log('Card not found in either hand');
      return;
    }

    const card = currentHand[cardIndex];

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'hand-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000000;
      min-width: 140px;
    `;

    const cardType = this.uiManager.getCardMainType(card.type || '').toLowerCase();
    const isLand = cardType === 'land';

    // Create menu items using DOM methods (XSS-safe)
    const playItem = this.createHandMenuItem(
      `⚔️ ${isLand ? 'Play Land' : 'Cast Spell'}`,
      () => this.playCardDirectly(cardId, event)
    );
    menu.appendChild(playItem);

    const graveyardItem = this.createHandMenuItem('🪦 To Graveyard', () => this.moveHandCardToGraveyard(cardId));
    menu.appendChild(graveyardItem);

    const exileItem = this.createHandMenuItem('🚫 Exile', () => this.moveHandCardToExile(cardId));
    menu.appendChild(exileItem);

    const libraryItem = this.createHandMenuItem('📚 To Library', () => this.moveHandCardToLibrary(cardId));
    menu.appendChild(libraryItem);

    const viewItem = this.createHandMenuItem('👁️ View Card', () => this.showCardPreview(card.name));
    menu.appendChild(viewItem);

    document.body.appendChild(menu);

    // Remove menu when clicking elsewhere
    const removeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      }
    };

    setTimeout(() => document.addEventListener('click', removeMenu), 100);
  }

  /**
   * Create hand menu item element (XSS-safe)
   */
  createHandMenuItem(text, clickHandler) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.textContent = text;

    if (clickHandler) {
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        clickHandler();
        // Remove menu
        const menu = div.closest('.hand-context-menu');
        if (menu) menu.remove();
      });
    }

    return div;
  }

  moveHandCardToGraveyard(cardId) {
    console.log('=== moveHandCardToGraveyard called ===');
    console.log('Looking for cardId:', cardId);
    console.log('Current hand:', this.hand);

    // Find card in hand
    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      console.log(`  Checking card ${idx}: actualCardId="${actualCardId}" vs cardId="${cardId}"`);
      return actualCardId === cardId;
    });

    console.log('Found at index:', cardIndex);

    if (cardIndex === -1) {
      console.error('Card not found in hand');
      console.error('Searched for:', cardId);
      console.error('Hand cards:', this.hand.map((c, i) => c.id || `${c.name}_${i}`));
      return;
    }

    const card = this.hand.splice(cardIndex, 1)[0];
    this.graveyard.push(card);

    this.uiManager.showToast(`${card.name} moved to graveyard`, 'info');
    this.uiManager.updateAll();
  }

  moveHandCardToExile(cardId) {
    console.log('moveHandCardToExile:', cardId);

    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex === -1) {
      console.error('Card not found in hand');
      return;
    }

    const card = this.hand.splice(cardIndex, 1)[0];
    this.exile.push(card);

    this.uiManager.showToast(`${card.name} exiled`, 'info');
    this.uiManager.updateAll();
  }

  moveHandCardToLibrary(cardId) {
    console.log('=== moveHandCardToLibrary called ===');
    console.log('Looking for cardId:', cardId);
    console.log('Current hand:', this.hand);
    console.log('Library before:', this.library.length);

    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      console.log(`  Checking card ${idx}: actualCardId="${actualCardId}" vs cardId="${cardId}"`);
      return actualCardId === cardId;
    });

    console.log('Found at index:', cardIndex);

    if (cardIndex === -1) {
      console.error('Card not found in hand');
      console.error('Searched for:', cardId);
      console.error('Hand cards:', this.hand.map((c, i) => c.id || `${c.name}_${i}`));
      return;
    }

    const card = this.hand.splice(cardIndex, 1)[0];
    this.library.push(card);

    console.log('Card moved:', card.name);
    console.log('Library after:', this.library.length);

    this.uiManager.showToast(`${card.name} moved to library`, 'info');
    this.uiManager.updateAll();
  }

  playCardDirectly(cardId, event) {
    console.log('=== playCardDirectly called ===');
    console.log('cardId:', cardId);
    console.log('event:', event);

    // Prevent any event bubbling
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Determine which player is playing the card
    if (cardId && cardId.startsWith('opponent_')) {
      this.playOpponentCardDirectly(cardId, event);
    } else {
      this.playPlayerCardDirectly(cardId, event);
    }
  }

  playPlayerCardDirectly(cardId, _event) {
    console.log('Playing player card:', cardId);
    console.log('Current hand:', this.hand);

    // Find the card in hand by ID - handle both actual IDs and generated IDs
    const cardIndex = this.hand.findIndex((card, index) => {
      const actualCardId = card.id || `${card.name}_${index}`;
      return actualCardId === cardId;
    });

    if (cardIndex === -1) {
      console.error('Card not found in hand:', cardId);
      return;
    }

    const card = this.hand[cardIndex];
    console.log('Found card:', card);

    // Check for delve
    if (this.delirium.hasDelve(card)) {
      const genericCost = this.cardMechanics.getGenericManaCost(card.cost);

      this.delirium.startDelveSelection(card, genericCost, (reduction, exiledCards) => {
        // After delve selection, play the card
        this.playCard(card);

        // Remove from hand
        this.hand.splice(cardIndex, 1);

        // Update displays
        this.uiManager.updateZoneDisplay('hand', 'player');
        this.uiManager.updateZoneDisplay('battlefield', 'player');
        this.uiManager.updateZoneDisplay('graveyard', 'player');
        this.uiManager.updateZoneDisplay('exile', 'player');
        this.updateUI();

        if (reduction > 0) {
          this.uiManager.showToast(`Played ${card.name} (Delved ${reduction} cards)`, 'success');
        } else {
          this.uiManager.showToast(`Played ${card.name}`, 'success');
        }

        // Check for cascade AFTER playing the card
        if (this.cardMechanics.hasCascade(card)) {
          setTimeout(() => this.showCascadeInterface(card, 'player'), 100);
        }
      });
    } else {
      // Play the card normally
      this.playCard(card);

      // Remove from hand
      this.hand.splice(cardIndex, 1);

      // Update displays
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.updateZoneDisplay('battlefield', 'player');
      this.updateUI();

      this.uiManager.showToast(`Played ${card.name}`, 'success');

      // Check for cascade AFTER playing the card
      if (this.cardMechanics.hasCascade(card)) {
        setTimeout(() => this.showCascadeInterface(card, 'player'), 100);
      }
    }
  }

  playCardByPosition(position) {
    // Play card from hand by its visual position (number in corner)
    // Use active player from turn state
    const activePlayer = this.gameState.turnState?.activePlayer || 'player';
    const hand = activePlayer === 'player' ? this.gameState.player.hand : this.gameState.opponent.hand;
    const playerLabel = activePlayer === 'player' ? 'Player 1' : 'Player 2';

    if (position < 0 || position >= hand.length) {
      this.uiManager.showToast(`${playerLabel}: No card at position ${position + 1}`, 'warning');
      return;
    }

    const card = hand[position];
    if (!card) {
      this.uiManager.showToast(`${playerLabel}: No card at position ${position + 1}`, 'warning');
      return;
    }

    // Get the card's ID for the appropriate play function
    const cardId = card.id || `${card.name}_${position}`;

    if (activePlayer === 'player') {
      this.playCardDirectly(cardId);
    } else {
      this.playOpponentCardDirectly(cardId);
    }
  }

  playOpponentCardDirectly(cardId, _event) {
    // Find the card in opponent's hand
    const cardIndex = this.opponent.hand.findIndex(card => card.id === cardId);

    if (cardIndex !== -1) {
      const card = this.opponent.hand[cardIndex];
      this.playCard(card);
      this.opponent.hand.splice(cardIndex, 1);

      this.uiManager.updateZoneDisplay('hand', 'opponent');
      this.uiManager.updateZoneDisplay('battlefield', 'opponent');
      this.updateUI();

      this.uiManager.showToast(`Opponent played ${card.name}`, 'info');
    }
  }

  playCard(card) {
    const cardType = this.getCardMainType(card.type);

    // Determine which player's zones to use based on the card's owner
    const isOpponentCard = card.id && card.id.startsWith('opponent_');
    const playerState = isOpponentCard ? this.opponent : this.gameState.player;
    const battlefield = isOpponentCard ? this.opponent.battlefield : this.battlefield;
    const graveyard = isOpponentCard ? this.opponent.graveyard : this.graveyard;

    if (cardType === 'Land') {
      battlefield.lands.push(card);
      if (playerState.gameStats) playerState.gameStats.landsPlayed++;

      // Check if this is a fetchland and auto-fetch dual land if available
      if (this.isFetchland(card.name)) {
        setTimeout(() => this.autoFetchDualOrPrompt(card), 100);
      }
    } else if (cardType === 'Instant' || cardType === 'Sorcery') {
      // Instants and sorceries go directly to graveyard after being cast
      graveyard.push(card);
      if (playerState.gameStats) playerState.gameStats.spellsCast++;

      this.uiManager.updateZoneDisplay('graveyard', isOpponentCard ? 'opponent' : 'player');
      const playerName = isOpponentCard ? 'Opponent' : 'Player';
      this.uiManager.showToast(`${playerName}'s ${card.name} resolves and goes to graveyard`, 'info');
    } else if (cardType === 'Creature') {
      battlefield.creatures.push(card);
      if (playerState.gameStats) playerState.gameStats.spellsCast++;
    } else {
      // Artifacts, enchantments, planeswalkers, etc. stay on battlefield
      battlefield.others.push(card);
      if (playerState.gameStats) playerState.gameStats.spellsCast++;

      // Initialize planeswalker with loyalty counters
      if (this.cardMechanics.isPlaneswalker(card)) {
        this.initializePlaneswalker(card);
      }
    }
  }

  getCardMainType(typeString) {
    if (!typeString) return 'Other';
    const type = typeString.toLowerCase();
    if (type.includes('creature')) return 'Creature';
    if (type.includes('land')) return 'Land';
    if (type.includes('instant')) return 'Instant';
    if (type.includes('sorcery')) return 'Sorcery';
    if (type.includes('artifact')) return 'Artifact';
    if (type.includes('enchantment')) return 'Enchantment';
    if (type.includes('planeswalker')) return 'Planeswalker';
    return 'Other';
  }

  sortHand(mode = 'lands-first') {
    const hand = this.gameState.player.hand;

    if (hand.length === 0) {
      this.uiManager.showToast('No cards in hand to sort', 'warning');
      return;
    }

    // Save preference
    localStorage.setItem('mtg-hand-sort-mode', mode);

    // Update button text
    const sortButton = document.getElementById('sortHandButton');
    const modeLabels = {
      'hands-first': '🔄 Spells First',
      'lands-first': '🔄 Lands First',
      'cmc': '🔄 By Mana Value',
      'type': '🔄 By Type',
      'name': '🔄 Alphabetical'
    };
    if (sortButton) {
      sortButton.textContent = modeLabels[mode] || modeLabels['hands-first'];
    }

    hand.sort((a, b) => {
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);
      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      switch(mode) {
        case 'hands-first':
          // Non-lands first (sorted by CMC), then lands (sorted by name)
          const aIsLand = aType === 'Land';
          const bIsLand = bType === 'Land';

          if (aIsLand !== bIsLand) {
            return aIsLand ? 1 : -1; // Non-lands come first (lands=1 means later)
          }

          if (!aIsLand && !bIsLand) {
            // Both are non-lands, sort by CMC then name
            if (aCost !== bCost) return aCost - bCost;
            return a.name.localeCompare(b.name);
          }

          // Both are lands, sort by name
          return a.name.localeCompare(b.name);

        case 'lands-first':
          // Lands first, then by card type, then by cost
          const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'cmc':
          // Sort by mana cost (lands at end), then by name
          const aIsLandCMC = aType === 'Land';
          const bIsLandCMC = bType === 'Land';

          // Put lands at the end
          if (aIsLandCMC !== bIsLandCMC) {
            return aIsLandCMC ? 1 : -1;
          }

          // For non-lands, sort by CMC
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'type':
          // Sort by card type, then by cost
          const typeOrderFull = { 'Creature': 0, 'Artifact': 1, 'Enchantment': 2, 'Planeswalker': 3, 'Sorcery': 4, 'Instant': 5, 'Land': 6 };
          if (typeOrderFull[aType] !== typeOrderFull[bType]) {
            return (typeOrderFull[aType] || 7) - (typeOrderFull[bType] || 7);
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'name':
          // Sort alphabetically by name
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });

    this.uiManager.updateZoneDisplay('hand', 'player');

    const toastMessages = {
      'hands-first': 'Hand sorted: Spells first by mana value, then lands',
      'lands-first': 'Hand sorted: Lands first, then by type',
      'cmc': 'Hand sorted by mana value',
      'type': 'Hand sorted by card type',
      'name': 'Hand sorted alphabetically'
    };
    this.uiManager.showToast(toastMessages[mode] || toastMessages['hands-first'], 'info');
  }

  sortOpponentHand(mode = 'lands-first') {
    const hand = this.gameState.opponent.hand;

    if (hand.length === 0) {
      this.uiManager.showToast('No cards in opponent hand to sort', 'warning');
      return;
    }

    // Save preference
    localStorage.setItem('mtg-opponent-hand-sort-mode', mode);

    // Update button text
    const sortButton = document.getElementById('sortOpponentHandButton');
    const modeLabels = {
      'hands-first': '🔄 Spells First',
      'lands-first': '🔄 Lands First',
      'cmc': '🔄 By Mana Value',
      'type': '🔄 By Type',
      'name': '🔄 Alphabetical'
    };
    if (sortButton) {
      sortButton.textContent = modeLabels[mode] || modeLabels['hands-first'];
    }

    hand.sort((a, b) => {
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);
      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      switch(mode) {
        case 'hands-first':
          const aIsLand = aType === 'Land';
          const bIsLand = bType === 'Land';
          if (aIsLand !== bIsLand) return aIsLand ? 1 : -1;
          if (!aIsLand && !bIsLand) {
            if (aCost !== bCost) return aCost - bCost;
            return a.name.localeCompare(b.name);
          }
          return a.name.localeCompare(b.name);

        case 'lands-first':
          const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;
          if (aOrder !== bOrder) return aOrder - bOrder;
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'cmc':
          const aIsLandCMC = aType === 'Land';
          const bIsLandCMC = bType === 'Land';
          if (aIsLandCMC !== bIsLandCMC) return aIsLandCMC ? 1 : -1;
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'type':
          const typeOrderFull = { 'Creature': 0, 'Artifact': 1, 'Enchantment': 2, 'Planeswalker': 3, 'Sorcery': 4, 'Instant': 5, 'Land': 6 };
          const aOrderFull = typeOrderFull[aType] !== undefined ? typeOrderFull[aType] : 7;
          const bOrderFull = typeOrderFull[bType] !== undefined ? typeOrderFull[bType] : 7;
          if (aOrderFull !== bOrderFull) return aOrderFull - bOrderFull;
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'name':
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });

    this.uiManager.updateZoneDisplay('hand', 'opponent');

    const toastMessages = {
      'hands-first': 'Player 2 hand sorted: Spells first by mana value, then lands',
      'lands-first': 'Player 2 hand sorted: Lands first, then by type',
      'cmc': 'Player 2 hand sorted by mana value',
      'type': 'Player 2 hand sorted by card type',
      'name': 'Player 2 hand sorted alphabetically'
    };
    this.uiManager.showToast(toastMessages[mode] || toastMessages['hands-first'], 'info');
  }

  autoSortHand() {
    // Automatically sort hand based on saved preference
    const savedMode = localStorage.getItem('mtg-hand-sort-mode') || 'lands-first';
    const hand = this.gameState.player.hand;

    if (hand.length === 0) return;

    hand.sort((a, b) => {
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);
      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      switch(savedMode) {
        case 'hands-first':
          const aIsLand = aType === 'Land';
          const bIsLand = bType === 'Land';
          if (aIsLand !== bIsLand) return aIsLand ? 1 : -1;
          if (!aIsLand && !bIsLand) {
            if (aCost !== bCost) return aCost - bCost;
            return a.name.localeCompare(b.name);
          }
          return a.name.localeCompare(b.name);

        case 'lands-first':
          const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'cmc':
          const aIsLandCMC2 = aType === 'Land';
          const bIsLandCMC2 = bType === 'Land';
          if (aIsLandCMC2 !== bIsLandCMC2) {
            return aIsLandCMC2 ? 1 : -1;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'type':
          const typeOrderFull = { 'Creature': 0, 'Artifact': 1, 'Enchantment': 2, 'Planeswalker': 3, 'Sorcery': 4, 'Instant': 5, 'Land': 6 };
          const aOrderFull = typeOrderFull[aType] !== undefined ? typeOrderFull[aType] : 7;
          const bOrderFull = typeOrderFull[bType] !== undefined ? typeOrderFull[bType] : 7;
          if (aOrderFull !== bOrderFull) {
            return aOrderFull - bOrderFull;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'name':
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });
  }

  autoSortOpponentHand() {
    // Automatically sort opponent hand based on saved preference
    const savedMode = localStorage.getItem('mtg-opponent-hand-sort-mode') || 'lands-first';
    const hand = this.gameState.opponent.hand;

    if (hand.length === 0) return;

    hand.sort((a, b) => {
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);
      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      switch(savedMode) {
        case 'hands-first':
          const aIsLand = aType === 'Land';
          const bIsLand = bType === 'Land';
          if (aIsLand !== bIsLand) return aIsLand ? 1 : -1;
          if (!aIsLand && !bIsLand) {
            if (aCost !== bCost) return aCost - bCost;
            return a.name.localeCompare(b.name);
          }
          return a.name.localeCompare(b.name);

        case 'lands-first':
          const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'cmc':
          const aIsLandCMC2 = aType === 'Land';
          const bIsLandCMC2 = bType === 'Land';
          if (aIsLandCMC2 !== bIsLandCMC2) {
            return aIsLandCMC2 ? 1 : -1;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'type':
          const typeOrderFull = { 'Creature': 0, 'Artifact': 1, 'Enchantment': 2, 'Planeswalker': 3, 'Sorcery': 4, 'Instant': 5, 'Land': 6 };
          const aOrderFull = typeOrderFull[aType] !== undefined ? typeOrderFull[aType] : 7;
          const bOrderFull = typeOrderFull[bType] !== undefined ? typeOrderFull[bType] : 7;
          if (aOrderFull !== bOrderFull) {
            return aOrderFull - bOrderFull;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);

        case 'name':
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });
  }

  executeDiscard(targetPlayer, amount = 1, mode = 'random') {
    console.log('executeDiscard called with:', { targetPlayer, amount, mode });

    const discardCount = parseInt(amount) || 1;
    const playerState = targetPlayer === 'player' ? this : this.opponent;
    const playerName = targetPlayer === 'player' ? 'You' : 'Opponent';

    if (!playerState.hand || playerState.hand.length === 0) {
      this.uiManager.showToast(`${playerName} has no cards to discard.`, 'warning');
      return;
    }

    const cardsToDiscard = [];
    if (mode === 'random') {
      for (let i = 0; i < discardCount && playerState.hand.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * playerState.hand.length);
        const discarded = playerState.hand.splice(randomIndex, 1)[0];
        cardsToDiscard.push(discarded);
        playerState.graveyard.push(discarded);
      }
    }

    // Update UI
    this.uiManager.updateZoneDisplay('hand', targetPlayer);
    this.uiManager.updateZoneDisplay('graveyard', targetPlayer);
    this.updateUI();

    // Show modal with discarded cards
    if (cardsToDiscard.length > 0) {
      this.showDiscardedCardsModal(cardsToDiscard, playerName);
    }

    this.uiManager.showToast(`${playerName} discarded ${cardsToDiscard.length} card(s) at random.`, 'success');
  }

  showDiscardedCardsModal(cards, playerName) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    // Create modal content using DOM methods (XSS-safe)
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'max-width: 500px; background: var(--bg-primary); color: var(--text-primary); padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';

    const title = document.createElement('h3');
    title.style.cssText = 'color: var(--error); margin-top: 0;';
    title.textContent = '💀 Cards Discarded';
    contentDiv.appendChild(title);

    const description = document.createElement('p');
    description.style.cssText = 'margin: 10px 0;';
    const playerStrong = document.createElement('strong');
    playerStrong.textContent = playerName;
    description.appendChild(playerStrong);
    description.appendChild(document.createTextNode(` discarded ${cards.length} card${cards.length > 1 ? 's' : ''} at random:`));
    contentDiv.appendChild(description);

    const cardListDiv = document.createElement('div');
    cardListDiv.style.cssText = 'margin: 15px 0;';

    cards.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = 'padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin: 4px; background: var(--bg-secondary);';

      const cardName = document.createElement('strong');
      cardName.textContent = card.name;
      cardDiv.appendChild(cardName);

      if (card.type) {
        const typeDiv = document.createElement('div');
        typeDiv.style.cssText = 'font-size: 0.9em; color: var(--text-secondary);';
        typeDiv.textContent = card.type;
        cardDiv.appendChild(typeDiv);
      }

      if (card.cost) {
        const costDiv = document.createElement('div');
        costDiv.style.cssText = 'font-size: 0.85em; color: var(--primary);';
        costDiv.textContent = card.cost;
        cardDiv.appendChild(costDiv);
      }

      cardListDiv.appendChild(cardDiv);
    });

    contentDiv.appendChild(cardListDiv);

    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary';
    okButton.style.cssText = 'width: 100%; margin-top: 10px;';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => modal.remove());
    contentDiv.appendChild(okButton);

    modal.appendChild(contentDiv);
    document.body.appendChild(modal);

    // Auto-close after 4 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 4000);
  }

  showLibraryModal(player = 'player') {
    console.log('showLibraryModal called for:', player);
    const library = player === 'player' ? this.library : this.opponent.library;
    console.log('Library cards:', library?.length);
    const title = player === 'player' ? '📚 Library' : '📚 Opponent Library';
    console.log('Calling showSimpleModal with:', title, library?.length, 'cards');
    this.showSimpleModal(`${player}-library`, library, title);
  }

  showGraveyardModal() {
    console.log('showGraveyardModal called');
    this.showSimpleModal('graveyard', this.graveyard, '🪦 Graveyard');
  }

  showExileModal() {
    console.log('showExileModal called');
    this.showSimpleModal('exile', this.exile, '🚫 Exile');
  }

  showOpponentGraveyardModal() {
    this.showSimpleModal('opponent-graveyard', this.opponent.graveyard, '🪦 Opponent Graveyard');
  }

  showOpponentExileModal() {
    this.showSimpleModal('opponent-exile', this.opponent.exile, '🚫 Opponent Exile');
  }

  async showSimpleModal(modalId, cards, title) {
    console.log(`showSimpleModal called: ${modalId}, cards: ${cards.length}`);

    // Remove any existing modal with this ID
    const existingModal = document.getElementById(`simple-modal-${modalId}`);
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = `simple-modal-${modalId}`;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #ffffff;
      color: #000000;
      border-radius: 8px;
      max-width: 95%;
      max-height: 90%;
      overflow: hidden;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    // Header (XSS-safe)
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 10px;
    `;

    const titleH3 = document.createElement('h3');
    titleH3.style.cssText = 'margin: 0; color: #000;';
    titleH3.textContent = `${title} (${cards.length} cards)`;
    header.appendChild(titleH3);

    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.style.cssText = 'background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 18px; font-weight: bold;';
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => modal.remove());
    header.appendChild(closeButton);

    // Cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      overflow-y: auto;
      padding: 10px;
    `;

    if (cards.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'text-align: center; color: var(--text-secondary); padding: 40px; grid-column: 1 / -1;';
      emptyDiv.textContent = 'No cards in this zone';
      cardsContainer.appendChild(emptyDiv);
    } else {
      // Show cards in reverse order (most recent first)
      const orderedCards = [...cards].reverse();

      orderedCards.forEach((card, index) => {
        const originalIndex = cards.findIndex(c => c === card);
        const cardId = card.id || `${card.name}_${originalIndex}`;
        const orderNumber = cards.length - index;

        const zoneCard = this.createZoneCardElement(card, cardId, orderNumber);
        cardsContainer.appendChild(zoneCard);
      });

      // Load images for modal cards
      setTimeout(() => {
        this.uiManager.loadCardImages(cardsContainer);
        this.uiManager.attachCardEventListeners(cardsContainer);
      }, 100);
    }

    modalContent.appendChild(header);
    modalContent.appendChild(cardsContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Create a zone card element (XSS-safe)
   */
  createZoneCardElement(card, cardId, orderNumber) {
    const zoneCard = document.createElement('div');
    zoneCard.className = 'zone-card';
    zoneCard.setAttribute('data-card-id', cardId);
    zoneCard.setAttribute('data-card-name', card.name);
    zoneCard.draggable = true;
    zoneCard.style.cssText = 'position: relative; cursor: grab; width: 100px; min-width: 100px; flex-shrink: 0;';

    // Order number badge
    if (orderNumber) {
      const orderBadge = document.createElement('div');
      orderBadge.style.cssText = 'position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.8); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;';
      orderBadge.textContent = orderNumber;
      zoneCard.appendChild(orderBadge);
    }

    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image-container';
    imageContainer.style.cssText = 'width: 100%; height: 140px;';

    const img = document.createElement('img');
    img.className = 'card-image-lazy';
    img.setAttribute('data-card-name', card.name);
    img.alt = card.name;
    img.loading = 'lazy';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    imageContainer.appendChild(img);

    const placeholder = document.createElement('div');
    placeholder.className = 'loading-placeholder';
    placeholder.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    placeholder.textContent = '🎴';
    imageContainer.appendChild(placeholder);

    cardContent.appendChild(imageContainer);

    // Card info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    cardInfo.style.cssText = 'padding: 4px;';

    const cardName = document.createElement('div');
    cardName.className = 'card-name';
    cardName.style.cssText = 'font-size: 0.75rem; font-weight: 600;';
    cardName.textContent = card.name;
    cardInfo.appendChild(cardName);

    const cardDetails = document.createElement('div');
    cardDetails.className = 'card-details';
    cardDetails.style.cssText = 'font-size: 0.7rem;';

    const cardCost = document.createElement('div');
    cardCost.className = 'card-cost';
    cardCost.textContent = card.cost || '0';
    cardDetails.appendChild(cardCost);

    const cardType = document.createElement('div');
    cardType.className = 'card-type';
    cardType.textContent = this.uiManager.getCardMainType(card.type || 'Unknown');
    cardDetails.appendChild(cardType);

    cardInfo.appendChild(cardDetails);
    cardContent.appendChild(cardInfo);
    zoneCard.appendChild(cardContent);

    return zoneCard;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeJs(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}

// Mixin core methods, library modals, triggered abilities, fetchlands, opponent methods, and context menus into the class
Object.assign(ModernHandSimulator.prototype, CoreMethods);
Object.assign(ModernHandSimulator.prototype, LibraryModals);
Object.assign(ModernHandSimulator.prototype, TriggeredAbilities);
Object.assign(ModernHandSimulator.prototype, Fetchlands);
Object.assign(ModernHandSimulator.prototype, OpponentMethods);
Object.assign(ModernHandSimulator.prototype, ContextMenus);
Object.assign(ModernHandSimulator.prototype, Planeswalker);
Object.assign(ModernHandSimulator.prototype, Adventure);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.handSimulator = new ModernHandSimulator();
  });
} else {
  window.handSimulator = new ModernHandSimulator();
}

export { ModernHandSimulator };
