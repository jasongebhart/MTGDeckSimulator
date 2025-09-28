/**
 * Modern Hand Simulator - Powers the modernized MTG Hand Simulator interface
 * Features: Deck integration, hand simulation, battlefield management, modern animations, card images
 */

console.log('=== PLAYHAND-MODERN.MJS SCRIPT LOADING ===');
console.log('Document readyState:', document.readyState);
console.log('Current URL:', window.location.href);

import { CardImageService } from '/src/services/cardImageService.mjs';
import { loadXMLDoc, getCardNameXML } from './config.mjs';

console.log('playhand-modern.mjs imports loaded successfully');


class ModernHandSimulator {
  constructor() {
    this.apiBase = '/api/v1';
    this.currentDeck = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.library = [];
    this.hand = [];
    this.battlefield = { lands: [], creatures: [], others: [] };
    this.graveyard = [];
    this.exile = [];
    this.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0,
      life: 20
    };
    this.selectedCards = new Set();
    this.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

    // Turn Management System
    this.turnState = {
      activePlayer: 'player', // 'player' or 'opponent'
      phase: 'beginning', // 'beginning', 'main1', 'combat', 'main2', 'end'
      step: 'untap', // varies by phase
      priority: 'player', // who has priority
      turnNumber: 1,
      isFirstTurn: true
    };

    // Phase definitions with their steps
    this.phases = {
      beginning: ['untap', 'upkeep', 'draw'],
      main1: ['main'],
      combat: ['beginning-combat', 'declare-attackers', 'declare-blockers', 'combat-damage', 'end-combat'],
      main2: ['main'],
      end: ['end', 'cleanup']
    };

    // Opponent state
    this.opponent = {
      library: [],
      hand: [],
      battlefield: { lands: [], creatures: [], others: [] },
      graveyard: [],
      exile: [],
      gameStats: {
        cardsDrawn: 0,
        landsPlayed: 0,
        spellsCast: 0,
        mulligans: 0,
        life: 20
      },
      selectedCards: new Set(),
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      currentDeck: null,
      deckName: 'No Deck'
    };

    this.activePlayer = 'player'; // 'player' or 'opponent'
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

    // Visual debug indicator
    this.setDebugStatus('Constructor called');
    this.detectLayoutMode();
    this.init();
  }

  detectLayoutMode() {
    // Detect if we should use two-player layout based on screen size
    this.isTwoPlayerMode = window.innerWidth >= 1400;

    // Add event listener for window resize
    window.addEventListener('resize', () => {
      const newMode = window.innerWidth >= 1400;
      if (newMode !== this.isTwoPlayerMode) {
        this.isTwoPlayerMode = newMode;
        this.updateLayoutMode();
      }
    });

    // Initialize enhanced UI features
    this.soundsEnabled = localStorage.getItem('mtg-sounds-enabled') !== 'false';

    // Initialize enhanced UI after a short delay to ensure DOM is ready
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
      this.showToast('Switched to two-player layout', 'info');
    } else {
      if (twoPlayerLayout) twoPlayerLayout.style.display = 'none';
      if (singlePlayerLayout) singlePlayerLayout.style.display = 'block';
      this.showToast('Switched to single-player layout', 'info');
    }

    // Update both layouts with current data
    this.updateUI();
    this.updateTurnDisplay();
  }

  async init() {
    console.log('ModernHandSimulator init called');
    this.setupTheme();

    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      console.log('Setting up event listeners...');
      console.log('Document body:', document.body);
      console.log('All buttons with drawHandButton ID:', document.querySelectorAll('#drawHandButton'));
      console.log('All buttons:', document.querySelectorAll('button'));

      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.populatePredefinedDecks();
      this.setupZoneTabs();
      this.showEmptyState();

      // Load default deck after ensuring deck-selector is ready
      this.waitForDeckSelector();
    }, 500); // Increase delay
  }

  async waitForDeckSelector() {
    let attempts = 0;
    const maxAttempts = 20; // Wait up to 2 seconds

    const checkDeckSelector = () => {
      attempts++;
      console.log(`Attempt ${attempts}: Checking for deck selector...`);
      console.log('window.getSelectedDeck:', window.getSelectedDeck);

      if (window.getSelectedDeck && typeof window.getSelectedDeck === 'function') {
        console.log('Deck selector found, loading deck...');
        this.loadDefaultDeck();
      } else if (attempts < maxAttempts) {
        setTimeout(checkDeckSelector, 100);
      } else {
        console.log('Deck selector not found after maximum attempts, loading default deck directly');
        this.setDebugStatus('Loading default (no selector)');
        this.loadPredefinedDeck('./decks/classic/affinity.xml');
      }
    };

    checkDeckSelector();
  }

  loadDefaultDeck() {
    if (this.currentDeck) {
      this.setDebugStatus('Deck already loaded');
      return;
    }

    try {
      const selectedDeck = window.getSelectedDeck();
      console.log('Selected deck from selector:', selectedDeck);

      if (selectedDeck && selectedDeck !== '') {
        this.setDebugStatus(`Loading: ${  selectedDeck.split('/').pop()}`);
        this.loadPredefinedDeck(selectedDeck);
      } else {
        this.setDebugStatus('Loading default');
        this.loadPredefinedDeck('./decks/classic/affinity.xml');
      }
    } catch (error) {
      console.error('Error getting selected deck:', error);
      this.setDebugStatus('Loading default (error)');
      this.loadPredefinedDeck('./decks/classic/affinity.xml');
    }
  }

  setupTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

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

    // Expand deck selector button
    const expandDeckSelector = document.getElementById('expandDeckSelector');
    const expandedDeckSelector = document.getElementById('expandedDeckSelector');
    if (expandDeckSelector && expandedDeckSelector) {
      expandDeckSelector.addEventListener('click', () => {
        const isVisible = expandedDeckSelector.style.display !== 'none';
        expandedDeckSelector.style.display = isVisible ? 'none' : 'block';
        expandDeckSelector.textContent = isVisible ? '⋯' : '×';
        expandDeckSelector.title = isVisible ? 'More Decks' : 'Close';

        // Add click listeners to deck items when expanded
        if (!isVisible) {
          setTimeout(() => {
            const deckItems = expandedDeckSelector.querySelectorAll('.deck-item');
            deckItems.forEach(item => {
              item.addEventListener('click', () => {
                // Close the expanded selector immediately
                expandedDeckSelector.style.display = 'none';
                expandDeckSelector.textContent = '⋯';
                expandDeckSelector.title = 'More Decks';
              });
            });
          }, 100);
        }
      });
    }

    // Deck selection - Listen for deck selection events from the modern selector
    document.addEventListener('deckSelected', (e) => {
      this.loadPredefinedDeck(e.detail.deckPath);
    });

    // Fallback for legacy select element
    const preDefinedDecks = document.getElementById('preDefinedDecks');
    if (preDefinedDecks) {
      preDefinedDecks.addEventListener('change', (e) => this.loadPredefinedDeck(e.target.value));
    }

    // Also listen for changes on the hidden select from deck-selector.mjs
    const hiddenDeckSelect = document.getElementById('hiddenDeckSelect');
    if (hiddenDeckSelect) {
      hiddenDeckSelect.addEventListener('change', (e) => this.loadPredefinedDeck(e.target.value));
    }

    // File upload
    const loadXMLButton = document.getElementById('loadXMLFileButton');
    const xmlFile = document.getElementById('xmlFile');
    if (loadXMLButton && xmlFile) {
      loadXMLButton.addEventListener('click', () => xmlFile.click());
      xmlFile.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Hand controls
    const drawHandButton = document.getElementById('drawHandButton');
    console.log('drawHandButton element:', drawHandButton);
    if (drawHandButton) {
      console.log('Adding click listener to draw hand button');
      drawHandButton.addEventListener('click', () => {
        console.log('Draw hand button clicked!');
        this.drawHand();
      });
    } else {
      console.error('drawHandButton element not found!');
    }

    const drawCardButton = document.getElementById('drawCardButton');
    console.log('drawCardButton element:', drawCardButton);
    if (drawCardButton) {
      console.log('Adding click listener to draw card button');
      drawCardButton.addEventListener('click', () => {
        console.log('Draw card button clicked!');
        this.drawCard();
      });
    } else {
      console.error('drawCardButton element not found!');
    }

    const mulliganButton = document.getElementById('mulligan');
    console.log('mulliganButton element:', mulliganButton);
    if (mulliganButton) {
      console.log('Adding click listener to mulligan button');
      mulliganButton.addEventListener('click', () => {
        console.log('Mulligan button clicked!');
        this.mulligan();
      });
    } else {
      console.error('mulliganButton element not found!');
    }

    const endTurnButton = document.getElementById('endTurnButton');
    console.log('endTurnButton element:', endTurnButton);
    if (endTurnButton) {
      console.log('Adding click listener to end turn button');
      endTurnButton.addEventListener('click', () => {
        console.log('End turn button clicked');
        if (this.turnState.phase === 'end') {
          this.endTurn();
        } else {
          this.advancePhase();
        }
      });
    } else {
      console.error('endTurnButton element not found!');
    }

    const testCountersButton = document.getElementById('testCountersButton');
    console.log('testCountersButton element:', testCountersButton);
    if (testCountersButton) {
      console.log('Adding click listener to test counters button');
      testCountersButton.addEventListener('click', () => {
        console.log('Test counters button clicked');
        this.debugCounters();
      });
    } else {
      console.error('testCountersButton element not found!');
    }

    const sortHandButton = document.getElementById('sortHandButton');
    if (sortHandButton) {
      sortHandButton.addEventListener('click', () => this.sortHand());
    }


    // Library controls
    const viewLibraryButton = document.getElementById('viewLibraryButton');
    if (viewLibraryButton) {
      viewLibraryButton.addEventListener('click', () => this.showLibraryModal());
    }

    const shuffleLibraryButton = document.getElementById('shuffleLibraryButton');
    if (shuffleLibraryButton) {
      shuffleLibraryButton.addEventListener('click', () => {
        this.shuffleLibrary();
        this.showToast('Library shuffled', 'success');
      });
    }

    const closeLibraryModal = document.getElementById('closeLibraryModal');
    if (closeLibraryModal) {
      closeLibraryModal.addEventListener('click', () => this.hideLibraryModal());
    }

    // FAB button
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
      fabButton.addEventListener('click', () => this.showQuickActions());
    }

    // Card preview modal
    const closeCardPreview = document.getElementById('closeCardPreview');
    const cardPreviewModal = document.getElementById('cardPreviewModal');
    if (closeCardPreview && cardPreviewModal) {
      closeCardPreview.addEventListener('click', () => this.hideCardPreview());
      cardPreviewModal.addEventListener('click', (e) => {
        if (e.target === cardPreviewModal) this.hideCardPreview();
      });
    }

    // Graveyard modal
    const closeGraveyardModal = document.getElementById('closeGraveyardModal');
    const graveyardModal = document.getElementById('graveyardModal');
    if (closeGraveyardModal && graveyardModal) {
      closeGraveyardModal.addEventListener('click', () => this.hideZoneModal('graveyardModal'));
      graveyardModal.addEventListener('click', (e) => {
        if (e.target === graveyardModal) this.hideZoneModal('graveyardModal');
      });
    }

    // Exile modal
    const closeExileModal = document.getElementById('closeExileModal');
    const exileModal = document.getElementById('exileModal');
    if (closeExileModal && exileModal) {
      closeExileModal.addEventListener('click', () => this.hideZoneModal('exileModal'));
      exileModal.addEventListener('click', (e) => {
        if (e.target === exileModal) this.hideZoneModal('exileModal');
      });
    }

    // Responsive handling
    this.setupResponsiveHandling();
  }

  setupResponsiveHandling() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    const handleResponsive = (e) => {
      if (mobileMenuToggle) {
        if (e.matches) {
          mobileMenuToggle.classList.remove('d-none');
        } else {
          mobileMenuToggle.classList.add('d-none');
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    };

    mediaQuery.addListener(handleResponsive);
    handleResponsive(mediaQuery);
  }

  setupZoneTabs() {
    const zoneTabs = document.querySelectorAll('.zone-tab');
    zoneTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetZone = e.target.getAttribute('data-zone');
        this.switchZone(targetZone);
      });
    });
  }

  switchZone(zoneName) {
    console.log('Switching to zone:', zoneName);

    // Update tab appearance
    document.querySelectorAll('.zone-tab').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.querySelector(`[data-zone="${zoneName}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
      console.log('Tab updated for zone:', zoneName);
    } else {
      console.error('Zone tab not found:', zoneName);
    }

    // Switch zone content
    document.querySelectorAll('.zone-content').forEach(zone => zone.style.display = 'none');
    const targetZone = document.getElementById(`${zoneName}Zone`);
    if (targetZone) {
      targetZone.style.display = 'block';
      console.log('Zone content shown for:', zoneName);
      console.log('Zone element:', targetZone);
    } else {
      console.error('Zone content not found:', `${zoneName}Zone`);
    }
  }

  // Debug function to force show graveyard
  showGraveyardDebug() {
    console.log('=== GRAVEYARD DEBUG ===');
    console.log('Graveyard cards:', this.graveyard);

    // Check if graveyard zone exists
    const graveyardZone = document.getElementById('graveyardZone');
    console.log('Graveyard zone found:', !!graveyardZone);

    if (graveyardZone) {
      // Force display the graveyard cards
      this.updateGraveyardDisplay();
      this.switchZone('graveyard');
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.setupTheme();
    this.showToast(`Switched to ${this.currentTheme} theme`, 'info');
  }

  toggleMobileMenu() {
    document.body.classList.toggle('mobile-sidebar-open');
  }

  populatePredefinedDecks() {
    // Check if we have the modern deck selector (deck-selector.mjs handles this)
    const modernSelector = document.querySelector('.deck-selector-container');
    if (modernSelector) {
      // Modern selector is present, no need to populate anything
      // The deck-selector.mjs will handle deck selection
      return;
    }

    // Fallback to legacy select population
    const select = document.getElementById('preDefinedDecks');
    if (!select) return;

    // Add default option
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

  async loadPredefinedDeck(deckPath) {
    if (!deckPath) {
      this.showEmptyState();
      return;
    }

    // Prevent loading the same deck multiple times
    if (this.currentDeck && this.currentDeck.source === deckPath) {
      console.log('Deck already loaded, skipping');
      return;
    }

    await this.loadDeck(deckPath);
  }

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
      this.showToast('Error loading deck file', 'error');
    }
  }

  async loadDeck(deckPath) {
    try {
      console.log('Loading deck:', deckPath);
      this.setDebugStatus('Loading XML...');
      this.showLoadingState();
      console.log('Loading state shown, fetching XML...');
      const xmlDoc = await loadXMLDoc(deckPath);
      console.log('XML loaded, processing...', xmlDoc);
      this.setDebugStatus('Processing XML...');
      await this.processDeckXML(xmlDoc, deckPath);
      console.log('Deck processing completed');
    } catch (error) {
      console.error('Error loading deck:', error);
      this.setDebugStatus(`Error: ${  error.message}`);
      this.showErrorState('Failed to load deck. Please try again.');
    }
  }

  async processDeckXML(xmlDoc, source) {
    try {
      // Extract deck information using the config function
      const deckInformation = getCardNameXML(xmlDoc);

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

      // Initialize library with full card objects
      this.library = deckInformation.cardNames.map((cardName, index) => ({
        name: cardName,
        id: `${cardName}_${index}_${Date.now()}`,
        cost: deckInformation.cardInfo[cardName]?.cost || '0',
        type: deckInformation.cardInfo[cardName]?.type || 'Unknown',
        rulesText: deckInformation.cardInfo[cardName]?.rulesText || '',
        tapped: false,
        counters: {}
      }));
      this.shuffleLibrary();

      // Reset game state
      this.resetGameState();

      // Show game content
      console.log('About to show game content...');
      this.showGameContent();

      // Update deck size display
      this.updateDeckSize();

      // Update the quick deck selector to show the selected deck
      this.updateDeckSelector(source);

      // Show success message
      this.showToast(`Loaded deck: ${this.currentDeck.name}`, 'success');

    } catch (error) {
      console.error('Error processing deck:', error);
      this.showErrorState('Failed to process deck. Please check the file format.');
    }
  }

  extractDeckName(xmlDoc, source) {
    // Try to extract deck name from XML
    const deckNameElement = xmlDoc.querySelector('deck name, deckname, title');
    if (deckNameElement) {
      return deckNameElement.textContent.trim();
    }

    // Fallback to filename
    if (typeof source === 'string') {
      return source.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
    }

    return 'Custom Deck';
  }

  resetGameState() {
    this.hand = [];
    this.battlefield = { lands: [], creatures: [], others: [] };
    this.graveyard = [];
    this.exile = [];
    this.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0,
      life: 20
    };
    this.selectedCards.clear();
    this.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

    // Reset turn state
    this.turnState = {
      activePlayer: 'player',
      phase: 'main1', // Start in main phase for initial setup
      step: 'main',
      priority: 'player',
      turnNumber: 1,
      isFirstTurn: true
    };

    // Reset opponent state
    this.opponent.hand = [];
    this.opponent.battlefield = { lands: [], creatures: [], others: [] };
    this.opponent.graveyard = [];
    this.opponent.exile = [];
    this.opponent.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      mulligans: 0,
      life: 20
    };
    this.opponent.selectedCards.clear();
    this.opponent.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

    this.activePlayer = 'player';
  }

  // Player switching functions
  switchToPlayer() {
    this.activePlayer = 'player';
    this.updateUI();
    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateActivePlayerView();
    this.showToast('Switched to Player', 'info');
  }

  switchToOpponent() {
    this.activePlayer = 'opponent';
    this.updateUI();
    this.updateOpponentHandDisplay();
    this.updateOpponentBattlefieldDisplay();
    this.updateActivePlayerView();
    this.showToast('Switched to Opponent', 'info');
  }

  getCurrentPlayer() {
    return this.activePlayer === 'player' ? this : this.opponent;
  }

  updateActivePlayerView() {
    // Update visual indicators for active player
    const playerArea = document.getElementById('playerArea');
    const opponentArea = document.getElementById('opponentArea');

    if (playerArea && opponentArea) {
      if (this.activePlayer === 'player') {
        playerArea.classList.add('active');
        opponentArea.classList.remove('active');
      } else {
        opponentArea.classList.add('active');
        playerArea.classList.remove('active');
      }
    }

    // Show appropriate hand display
    if (this.activePlayer === 'opponent') {
      this.updateOpponentHandDisplayDetailed();
    } else {
      this.updateHandDisplay();
    }
  }

  updateOpponentHandDisplayDetailed() {
    // When controlling opponent, show their actual cards
    if (this.activePlayer === 'opponent') {
      this.updateZoneDisplay('handContainer', this.opponent.hand);
      this.updateZoneDisplay('handContainer2', this.opponent.hand);
    }
  }

  shuffleLibrary() {
    for (let i = this.library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.library[i], this.library[j]] = [this.library[j], this.library[i]];
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Prevent shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case ' ':
          event.preventDefault();
          this.advancePhaseOrTurn();
          break;
        case 'd':
          event.preventDefault();
          this.drawCard();
          break;
        case 'm':
          event.preventDefault();
          this.mulligan();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          this.playCardFromHand(parseInt(key) - 1);
          break;
        case 'h':
        case '?':
          event.preventDefault();
          this.showKeyboardHelp();
          break;
        case 'escape':
          this.hideKeyboardHelp();
          break;
      }
    });
  }

  advancePhaseOrTurn() {
    const currentPhase = this.turnState.phase;
    const currentStep = this.turnState.step;

    // If in end phase cleanup step, advance to next turn
    if (currentPhase === 'end' && currentStep === 'cleanup') {
      this.nextTurn();
    } else {
      this.nextPhase();
    }

    this.showToast(`${currentPhase} phase`);
  }

  playCardFromHand(index) {
    const currentPlayer = this.getCurrentPlayer();
    if (index >= 0 && index < currentPlayer.hand.length) {
      const card = currentPlayer.hand[index];
      console.log('Playing card:', card);
      console.log('Card type_line:', card.type_line);
      console.log('Card type:', card.type);

      this.showToast(`Playing ${card.name}`);

      // Check multiple possible type properties and fallback
      const cardType = (card.type_line || card.type || '').toLowerCase();
      console.log('Processed card type:', cardType);

      // Determine where the card should go based on type
      if (cardType.includes('land')) {
        console.log('Moving to lands');
        this.moveCard(card, currentPlayer.hand, currentPlayer.battlefield.lands);
      } else if (cardType.includes('creature') || cardType.includes('planeswalker')) {
        console.log('Moving to creatures');
        this.moveCard(card, currentPlayer.hand, currentPlayer.battlefield.creatures);
      } else if (cardType.includes('artifact') || cardType.includes('enchantment')) {
        console.log('Moving to others');
        this.moveCard(card, currentPlayer.hand, currentPlayer.battlefield.others);
      } else {
        // Instants and sorceries go to graveyard after resolving
        console.log('Moving to graveyard - type not recognized or instant/sorcery');
        this.moveCard(card, currentPlayer.hand, currentPlayer.graveyard);
      }

      this.updateAllDisplays();
    }
  }

  moveCard(card, fromZone, toZone) {
    // Remove card from source zone
    const cardIndex = fromZone.indexOf(card);
    if (cardIndex !== -1) {
      fromZone.splice(cardIndex, 1);
    }

    // Add card to destination zone
    toZone.push(card);

    // Update game stats based on card type and destination
    const currentPlayer = this.getCurrentPlayer();
    const isToPlayerBattlefield = (
      toZone === currentPlayer.battlefield.lands ||
      toZone === currentPlayer.battlefield.creatures ||
      toZone === currentPlayer.battlefield.others
    );

    if (isToPlayerBattlefield) {
      if (card.type_line && card.type_line.toLowerCase().includes('land')) {
        currentPlayer.gameStats.landsPlayed++;
      } else {
        currentPlayer.gameStats.spellsCast++;
      }
    }
  }

  updateAllDisplays() {
    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateGraveyardDisplay();
    this.updateExileDisplay();
    this.updateOpponentHandDisplay();
    this.updateOpponentBattlefieldDisplay();
    this.updateUI();
  }

  showKeyboardHelp() {
    const helpOverlay = document.getElementById('keyboardHelpOverlay');
    if (helpOverlay) {
      helpOverlay.style.display = 'flex';
    } else {
      this.createKeyboardHelpOverlay();
    }
  }

  hideKeyboardHelp() {
    const helpOverlay = document.getElementById('keyboardHelpOverlay');
    if (helpOverlay) {
      helpOverlay.style.display = 'none';
    }
  }

  createKeyboardHelpOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'keyboardHelpOverlay';
    overlay.className = 'keyboard-help-overlay';

    overlay.innerHTML = `
      <div class="keyboard-help-modal">
        <div class="keyboard-help-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="close-help" onclick="game.hideKeyboardHelp()">×</button>
        </div>
        <div class="keyboard-help-content">
          <div class="shortcut-section">
            <h4>Game Control</h4>
            <div class="shortcut-item">
              <kbd>Space</kbd>
              <span>Advance Phase/End Turn</span>
            </div>
            <div class="shortcut-item">
              <kbd>D</kbd>
              <span>Draw Card</span>
            </div>
            <div class="shortcut-item">
              <kbd>M</kbd>
              <span>Mulligan</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>Play Cards</h4>
            <div class="shortcut-item">
              <kbd>1-9</kbd>
              <span>Play numbered card from hand (cards show numbers)</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>Help</h4>
            <div class="shortcut-item">
              <kbd>H</kbd> or <kbd>?</kbd>
              <span>Show this help</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>Close help</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'flex';

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideKeyboardHelp();
      }
    });
  }

  showLoadingState() {
    this.hideAllStates();
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.style.display = 'block';
      loadingState.classList.add('fade-in');
    }
  }

  showEmptyState() {
    this.hideAllStates();
    document.getElementById('emptyState').style.display = 'block';
  }

  showGameContent() {
    console.log('showGameContent called');
    this.hideAllStates();
    const gameContent = document.getElementById('gameContent');
    console.log('gameContent element found:', gameContent);
    if (gameContent) {
      console.log('Setting gameContent display to block');
      gameContent.style.display = 'block';

      // Trigger layout mode detection
      this.updateLayoutMode();
      gameContent.classList.add('slide-in-up');
      console.log('gameContent style.display after setting:', gameContent.style.display);
    } else {
      console.error('gameContent element not found!');
    }
  }

  hideAllStates() {
    ['loadingState', 'emptyState', 'gameContent', 'errorState'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
        element.classList.remove('fade-in', 'slide-in-up', 'scale-in');
      }
    });
  }

  showErrorState(message = 'Something went wrong') {
    this.hideAllStates();
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    if (errorState) {
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      errorState.style.display = 'block';
      errorState.classList.add('fade-in');
    }
  }

  updateDeckSize() {
    const deckSizeElement = document.getElementById('deckSize');
    if (deckSizeElement) {
      console.log('Updating deck size to:', this.library.length);
      deckSizeElement.textContent = this.library.length;
    } else {
      console.log('deckSize element not found');
    }
  }

  updateDeckSelector(deckPath) {
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      // Check if the deck is in the quick selector options
      const option = Array.from(quickDeckSelect.options).find(opt => opt.value === deckPath);
      if (option) {
        quickDeckSelect.value = deckPath;
      } else {
        // If not in quick selector, set to empty
        quickDeckSelect.value = '';
      }
    }

    // Update the hidden select for compatibility
    const hiddenDeckSelect = document.getElementById('hiddenDeckSelect');
    if (hiddenDeckSelect) {
      hiddenDeckSelect.value = deckPath;
    }
    console.log('Deck selected:', deckPath);
  }

  setDebugStatus(message) {
    const deckSizeElement = document.getElementById('deckSize');
    if (deckSizeElement) {
      deckSizeElement.textContent = message;
    }
  }

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">
        ${icons[type] || icons.info}
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
    `;

    // Add to container
    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    // Play sound effect
    this.playSound?.(type);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Manual dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
  }

  setupGame(deckData) {
    // Initialize library with deck cards
    this.library = [];
    deckData.deck.cards.forEach(card => {
      for (let i = 0; i < card.quantity; i++) {
        this.library.push({ ...card, id: `${card.name}_${i}` });
      }
    });

    // Shuffle the library
    this.shuffleArray(this.library);

    // Reset game state
    this.hand = [];
    this.battlefield = { lands: [], creatures: [], others: [] };
    this.graveyard = [];
    this.exile = [];
    this.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0,
      life: 20
    };

    this.updateUI();
    this.showGameContent();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawHand() {
    console.log('=== drawHand called ===');
    console.log('currentDeck:', this.currentDeck);
    console.log('library length:', this.library.length);

    if (!this.currentDeck) {
      console.log('No current deck loaded');
      this.showToast('No deck loaded. Please select a deck first.', 'warning');
      return;
    }

    if (this.library.length === 0) {
      console.log('Library is empty');
      this.showToast('Library is empty. Cannot draw cards.', 'warning');
      return;
    }

    // Force show game content
    console.log('Forcing game content to show...');
    this.showGameContent();

    // Clear current hand
    this.hand = [];
    this.selectedCards.clear();

    // Draw 7 cards
    const handSize = 7 - this.gameStats.mulligans;
    console.log('Drawing', handSize, 'cards');

    for (let i = 0; i < Math.min(handSize, this.library.length); i++) {
      this.drawCard(false);
    }

    console.log('Hand after drawing:', this.hand);
    this.updateHandDisplay();
    this.showToast(`Drew ${Math.min(handSize, this.library.length)} cards`, 'success');
  }

  drawCard(showAnimation = true) {
    console.log('drawCard called, showAnimation:', showAnimation);
    console.log('Active player:', this.activePlayer);

    const library = this.activePlayer === 'player' ? this.library : this.opponent.library;
    const hand = this.activePlayer === 'player' ? this.hand : this.opponent.hand;
    const gameStats = this.activePlayer === 'player' ? this.gameStats : this.opponent.gameStats;

    console.log('library length before draw:', library.length);

    if (library.length === 0) {
      console.log('Library is empty, cannot draw');
      this.showToast('Library is empty!', 'warning');
      return;
    }

    const card = library.pop();
    console.log('Drew card:', card);
    hand.push(card);
    gameStats.cardsDrawn++;

    if (showAnimation) {
      // Update the appropriate hand display based on active player
      if (this.activePlayer === 'player') {
        this.updateHandDisplay();
      } else {
        this.updateOpponentHandDisplayDetailed();
      }

      // Add card draw animation to the newest card
      setTimeout(() => {
        const handContainer = document.getElementById('handContainer');
        const newCards = handContainer.querySelectorAll('.card-in-hand:last-child');
        if (newCards.length > 0) {
          newCards[newCards.length - 1].classList.add('card-draw-animation');
        }
      }, 100);

      const playerName = this.activePlayer === 'player' ? 'You' : 'Opponent';
      this.showToast(`${playerName} drew ${card.name}`, 'info');
    }

    this.updateUI();
  }

  mulligan() {
    if (this.hand.length === 0) {
      this.showToast('No cards in hand to mulligan', 'warning');
      return;
    }

    // Put cards back in library
    this.library.push(...this.hand);
    this.shuffleArray(this.library);

    this.gameStats.mulligans++;
    this.drawHand();

    this.showToast(`Mulligan ${this.gameStats.mulligans}`, 'info');
  }

  // Turn Management System
  endTurn() {
    console.log('endTurn called - advancing to next turn');

    // Pass to opponent
    this.turnState.activePlayer = this.turnState.activePlayer === 'player' ? 'opponent' : 'player';

    // If back to player, increment turn number
    if (this.turnState.activePlayer === 'player') {
      this.turnState.turnNumber++;
      this.gameStats.turnNumber = this.turnState.turnNumber;
    }

    // Start new turn at beginning phase
    this.turnState.phase = 'beginning';
    this.turnState.step = 'untap';
    this.turnState.priority = this.turnState.activePlayer;
    this.turnState.isFirstTurn = this.turnState.turnNumber === 1 && this.turnState.activePlayer === 'player';

    // Execute beginning phase automatically
    this.executeBeginningPhase();

    // Clear mana pool
    this.clearManaPool();

    // Reset lands played for new turn
    this.gameStats.landsPlayedThisTurn = 0;

    // Update UI
    this.updateUI();
    this.updateTurnDisplay();

    const playerName = this.turnState.activePlayer === 'player' ? 'Your' : 'Opponent\'s';
    this.showToast(`${playerName} Turn ${this.turnState.turnNumber} - ${this.formatPhaseStep()}`, 'info');
  }

  executeBeginningPhase() {
    console.log('Executing beginning phase');

    // Untap Step
    this.executeUntapStep();

    // Upkeep Step (currently no mechanics)
    this.turnState.step = 'upkeep';

    // Draw Step (skip on first turn)
    this.turnState.step = 'draw';
    if (!this.turnState.isFirstTurn) {
      this.executeDrawStep();
    }

    // Move to main phase
    this.advanceToMainPhase();
  }

  executeUntapStep() {
    console.log('Untap step - untapping all permanents');

    // Untap all battlefield permanents for active player
    const battlefield = this.turnState.activePlayer === 'player' ? this.battlefield : this.opponent.battlefield;

    [...battlefield.lands, ...battlefield.creatures, ...battlefield.others].forEach(card => {
      if (card.tapped) {
        card.tapped = false;
      }
    });

    // Update battlefield display
    if (this.turnState.activePlayer === 'player') {
      this.updateBattlefieldDisplay();
    } else {
      this.updateOpponentBattlefieldDisplay();
    }
  }

  executeDrawStep() {
    console.log('Draw step - drawing card');

    if (this.turnState.activePlayer === 'player') {
      this.drawCard();
    } else {
      // Opponent draws (simulate)
      if (this.opponent.library.length > 0) {
        const drawnCard = this.opponent.library.pop();
        this.opponent.hand.push(drawnCard);
        this.opponent.gameStats.cardsDrawn++;
        this.updateOpponentHandDisplay();
        this.showToast('Opponent draws a card', 'info');
      }
    }
  }

  advanceToMainPhase() {
    this.turnState.phase = 'main1';
    this.turnState.step = 'main';
    console.log(`Advanced to ${this.formatPhaseStep()}`);
  }

  advancePhase() {
    console.log('Advancing phase from:', this.turnState.phase);

    // Clear mana pool when leaving certain phases (MTG rules)
    if (this.turnState.phase === 'main1' || this.turnState.phase === 'combat') {
      this.clearManaPool();
    }

    switch (this.turnState.phase) {
      case 'beginning':
        this.turnState.phase = 'main1';
        this.turnState.step = 'main';
        break;
      case 'main1':
        this.turnState.phase = 'combat';
        this.turnState.step = 'beginning-combat';
        break;
      case 'combat':
        this.turnState.phase = 'main2';
        this.turnState.step = 'main';
        break;
      case 'main2':
        this.turnState.phase = 'end';
        this.turnState.step = 'end';
        break;
      case 'end':
        // End turn
        this.endTurn();
        return;
    }

    this.updateTurnDisplay();
    this.updatePhaseButtons();
    this.showToast(`${this.formatPhaseStep()}`, 'info');
  }

  clearManaPool() {
    const hadMana = Object.values(this.manaPool).some(amount => amount > 0);
    this.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    this.updateManaDisplay();

    if (hadMana) {
      this.showToast('Mana pool empties', 'warning');
    }
  }

  formatPhaseStep() {
    const phaseNames = {
      beginning: 'Beginning Phase',
      main1: 'Main Phase 1',
      combat: 'Combat Phase',
      main2: 'Main Phase 2',
      end: 'End Phase'
    };

    const stepNames = {
      untap: 'Untap',
      upkeep: 'Upkeep',
      draw: 'Draw',
      main: '',
      'beginning-combat': 'Beginning of Combat',
      'declare-attackers': 'Declare Attackers',
      'declare-blockers': 'Declare Blockers',
      'combat-damage': 'Combat Damage',
      'end-combat': 'End of Combat',
      end: 'End Step',
      cleanup: 'Cleanup'
    };

    const phaseName = phaseNames[this.turnState.phase] || this.turnState.phase;
    const stepName = stepNames[this.turnState.step] || this.turnState.step;

    return stepName ? `${phaseName} - ${stepName}` : phaseName;
  }

  updateTurnDisplay() {
    // Update turn indicator in UI
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) {
      const activePlayerText = this.turnState.activePlayer === 'player' ? 'Your Turn' : 'Opponent\'s Turn';

      // Set data attribute for styling
      turnIndicator.setAttribute('data-player', this.turnState.activePlayer);

      turnIndicator.innerHTML = `
        <div class="turn-info">
          <span class="turn-player">${activePlayerText}</span>
          <span class="turn-number">Turn ${this.turnState.turnNumber}</span>
          <span class="turn-phase">${this.formatPhaseStep()}</span>
        </div>
      `;
    }

    // Update phase buttons
    this.updatePhaseButtons();
  }

  updatePhaseButtons() {
    // Update end turn button text based on phase
    const endTurnButton = document.getElementById('endTurnButton');
    if (endTurnButton) {
      if (this.turnState.phase === 'end') {
        endTurnButton.textContent = '🔄 End Turn';
      } else {
        endTurnButton.textContent = `➡️ ${this.getNextPhaseText()}`;
      }
    }
  }

  getNextPhaseText() {
    switch (this.turnState.phase) {
      case 'beginning':
      case 'main1':
        return 'Combat';
      case 'combat':
        return 'Main 2';
      case 'main2':
        return 'End Phase';
      case 'end':
        return 'End Turn';
      default:
        return 'Next Phase';
    }
  }

  showHandCardMenu(event, cardId) {
    event.preventDefault();

    // Find the card
    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex === -1) return;

    const card = this.hand[cardIndex];

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
      z-index: 1000;
      min-width: 140px;
    `;

    const cardType = this.getCardMainType(card.type || '').toLowerCase();
    const isLand = cardType === 'land';

    menu.innerHTML = `
      <div class="menu-item" onclick="window.handSimulator.playCardDirectly('${cardId}', event)">
        ⚔️ ${isLand ? 'Play Land' : 'Cast Spell'}
      </div>
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToGraveyard('${cardId}')">
        🪦 To Graveyard
      </div>
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToExile('${cardId}')">
        🚫 Exile
      </div>
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToLibrary('${cardId}')">
        📚 To Library
      </div>
      <div class="menu-item" onclick="window.handSimulator.showCardPreview('${this.escapeHtml(card.name)}')">
        👁️ View Card
      </div>
    `;

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

  showBattlefieldCardMenu(event, cardId) {
    event.preventDefault();

    // Find the card
    const card = this.findBattlefieldCard(cardId);
    if (!card) return;

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'battlefield-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 120px;
    `;

    // Use the new smart context menu system instead of the old menu
    this.removeExistingMenus();
    this.createSmartContextMenu(event, card, cardId, 'battlefield');
  }

  // New Smart Context Menu System
  createSmartContextMenu(event, card, cardId, zone) {
    const menu = document.createElement('div');
    menu.className = 'smart-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 180px;
      overflow: hidden;
    `;

    const cardType = this.getCardMainType(card.type || '').toLowerCase();
    const isTapped = card.tapped;
    const currentCounters = card.counters || {};

    // Get context-sensitive primary actions
    const primaryActions = this.getPrimaryActions(cardType, isTapped, cardId, zone);

    // Create menu structure
    let menuHTML = '<div class="menu-section primary-actions">';

    // Primary actions (always visible)
    primaryActions.forEach(action => {
      menuHTML += `<div class="menu-item primary" onclick="${action.onclick}">
        <span class="action-icon">${action.icon}</span>
        <span class="action-text">${action.text}</span>
        ${action.badge ? `<span class="action-badge">${action.badge}</span>` : ''}
      </div>`;
    });

    // +1/+1 Counter section (special treatment)
    if (zone === 'battlefield' && (cardType === 'creature' || cardType === 'planeswalker')) {
      const current = currentCounters['+1/+1'] || 0;
      menuHTML += `<div class="menu-item counter-quick" onclick="window.handSimulator.addCounter('${cardId}', '+1/+1')">
        <span class="action-icon">➕</span>
        <span class="action-text">+1/+1 Counter</span>
        ${current > 0 ? `<span class="counter-count">${current}</span>` : ''}
      </div>`;

      if (current > 0) {
        menuHTML += `<div class="menu-item counter-quick remove" onclick="window.handSimulator.removeCounter('${cardId}', '+1/+1')">
          <span class="action-icon">➖</span>
          <span class="action-text">Remove +1/+1</span>
        </div>`;
      }
    }

    menuHTML += '</div>';

    // More actions (expandable)
    if (zone === 'battlefield') {
      menuHTML += `<div class="menu-item expandable" onclick="window.handSimulator.expandMenuActions(event, '${cardId}', '${zone}')">
        <span class="action-icon">⋯</span>
        <span class="action-text">More Actions</span>
        <span class="expand-indicator">▶</span>
      </div>`;
    }

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);

    // Position adjustment if menu goes off screen
    this.adjustMenuPosition(menu, event);

    // Add click outside listener
    this.addMenuClickOutsideListener(menu);
  }

  getPrimaryActions(cardType, isTapped, cardId, zone) {
    const actions = [];

    // Context-sensitive primary actions based on realistic game flow
    switch (cardType) {
      case 'creature':
        // Creatures: Tap -> Die/Graveyard -> Counters
        actions.push({
          icon: isTapped ? '↺' : '⤵️',
          text: isTapped ? 'Untap' : 'Tap',
          onclick: `window.handSimulator.toggleTap('${cardId}')`
        });
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: 'Dies → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${cardId}')`
          });
          actions.push({
            icon: '🚫',
            text: 'Exile',
            onclick: `window.handSimulator.moveToExile('${cardId}')`
          });
        }
        break;

      case 'land':
        // Lands: Tap for mana -> Destroy/Sacrifice
        actions.push({
          icon: isTapped ? '↺' : '🔥',
          text: isTapped ? 'Untap' : 'Tap for Mana',
          onclick: `window.handSimulator.toggleTap('${cardId}')`
        });
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: 'Destroy → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${cardId}')`
          });
          actions.push({
            icon: '🤲',
            text: 'Bounce → Hand',
            onclick: `window.handSimulator.moveToHand('${cardId}')`
          });
        }
        break;

      case 'planeswalker': {
        // Planeswalkers: Loyalty abilities -> Death/Damage
        const card = this.findBattlefieldCard(cardId);
        const loyalty = card?.counters?.['loyalty'] || 0;
        actions.push({
          icon: '💎',
          text: 'Loyalty +1',
          badge: loyalty > 0 ? loyalty.toString() : '',
          onclick: `window.handSimulator.addCounter('${cardId}', 'loyalty')`
        });
        if (loyalty > 0) {
          actions.push({
            icon: '💎',
            text: 'Loyalty -1',
            onclick: `window.handSimulator.removeCounter('${cardId}', 'loyalty')`
          });
        }
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: loyalty === 0 ? 'Dies (0 Loyalty)' : 'Destroy',
            onclick: `window.handSimulator.moveToGraveyard('${cardId}')`
          });
        }
        break;
      }

      case 'artifact':
      case 'enchantment':
        // Artifacts/Enchantments: Tap (if applicable) -> Destroy
        actions.push({
          icon: isTapped ? '↺' : '⤵️',
          text: isTapped ? 'Untap' : 'Tap',
          onclick: `window.handSimulator.toggleTap('${cardId}')`
        });
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: 'Destroy → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${cardId}')`
          });
          actions.push({
            icon: '🚫',
            text: 'Exile',
            onclick: `window.handSimulator.moveToExile('${cardId}')`
          });
        }
        break;

      default:
        if (zone === 'battlefield') {
          actions.push({
            icon: isTapped ? '↺' : '⤵️',
            text: isTapped ? 'Untap' : 'Tap',
            onclick: `window.handSimulator.toggleTap('${cardId}')`
          });
          actions.push({
            icon: '⚰️',
            text: 'To Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${cardId}')`
          });
        }
    }

    // Zone-specific movement actions
    if (zone === 'graveyard') {
      actions.push({
        icon: '🤲',
        text: 'Return → Hand',
        onclick: `window.handSimulator.moveGraveyardToHand('${cardId}')`
      });
      actions.push({
        icon: '⚡',
        text: 'Reanimate → Battlefield',
        onclick: `window.handSimulator.moveGraveyardToBattlefield('${cardId}')`
      });
      actions.push({
        icon: '🚫',
        text: 'Exile from Graveyard',
        onclick: `window.handSimulator.moveGraveyardToExile('${cardId}')`
      });
    } else if (zone === 'exile') {
      actions.push({
        icon: '🤲',
        text: 'Return → Hand',
        onclick: `window.handSimulator.moveExileToHand('${cardId}')`
      });
      actions.push({
        icon: '⚡',
        text: 'Return → Battlefield',
        onclick: `window.handSimulator.moveExileToBattlefield('${cardId}')`
      });
      actions.push({
        icon: '⚰️',
        text: 'To Graveyard',
        onclick: `window.handSimulator.moveExileToGraveyard('${cardId}')`
      });
    }

    return actions.slice(0, 4); // Allow up to 4 primary actions for better coverage
  }

  removeExistingMenus() {
    const existingMenus = document.querySelectorAll('.smart-context-menu, .battlefield-context-menu, .graveyard-context-menu, .exile-context-menu, .hand-context-menu');
    existingMenus.forEach(menu => menu.remove());
  }

  adjustMenuPosition(menu, event) {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${event.clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${event.clientY - rect.height}px`;
    }
  }

  addMenuClickOutsideListener(menu) {
    const removeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', removeMenu), 100);
  }

  expandMenuActions(event, cardId, _zone) {
    event.stopPropagation();

    // Remove current menu
    this.removeExistingMenus();

    // Create expanded menu with all counter types
    const card = this.findBattlefieldCard(cardId);
    if (!card) return;

    const menu = document.createElement('div');
    menu.className = 'smart-context-menu expanded';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
      max-height: 400px;
      overflow-y: auto;
    `;

    const counters = card.counters || {};

    let menuHTML = `
      <div class="menu-header">
        <span onclick="window.handSimulator.showBattlefieldCardMenu(event, '${cardId}')" style="cursor: pointer;">← Back</span>
        <span>All Actions</span>
      </div>
      <div class="menu-section">
        <div class="section-title">Counters</div>
    `;

    // All counter types
    const counterTypes = [
      { type: '+1/+1', icon: '➕', name: '+1/+1 Counter' },
      { type: '-1/-1', icon: '➖', name: '-1/-1 Counter' },
      { type: 'loyalty', icon: '💎', name: 'Loyalty Counter' },
      { type: 'charge', icon: '⚡', name: 'Charge Counter' },
      { type: 'poison', icon: '☠️', name: 'Poison Counter' },
      { type: 'energy', icon: '⚡', name: 'Energy Counter' },
      { type: 'age', icon: '🕰️', name: 'Age Counter' },
      { type: 'experience', icon: '🌟', name: 'Experience Counter' }
    ];

    counterTypes.forEach(counter => {
      const current = counters[counter.type] || 0;
      menuHTML += `
        <div class="counter-group">
          <div class="menu-item" onclick="window.handSimulator.addCounter('${cardId}', '${counter.type}')">
            <span class="action-icon">${counter.icon}</span>
            <span class="action-text">Add ${counter.name}</span>
            ${current > 0 ? `<span class="counter-count">${current}</span>` : ''}
          </div>
          ${current > 0 ? `
            <div class="menu-item remove" onclick="window.handSimulator.removeCounter('${cardId}', '${counter.type}')">
              <span class="action-icon">➖</span>
              <span class="action-text">Remove ${counter.name}</span>
            </div>
          ` : ''}
        </div>
      `;
    });

    menuHTML += `
      </div>
      <div class="menu-section">
        <div class="section-title">Movement</div>
        <div class="menu-item" onclick="window.handSimulator.moveToExile('${cardId}')">
          <span class="action-icon">🚫</span>
          <span class="action-text">To Exile</span>
        </div>
        <div class="menu-item" onclick="window.handSimulator.moveToHand('${cardId}')">
          <span class="action-icon">🤲</span>
          <span class="action-text">To Hand</span>
        </div>
      </div>
    `;

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);

    this.adjustMenuPosition(menu, event);
    this.addMenuClickOutsideListener(menu);
  }

  findBattlefieldCard(cardId) {
    return [...this.battlefield.lands, ...this.battlefield.creatures, ...this.battlefield.others]
      .find(card => card.id === cardId);
  }

  moveToGraveyard(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      this.graveyard.push(card);
      this.updateBattlefieldDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      this.showToast(`${card.name} moved to graveyard`, 'info');
    }
  }

  moveToExile(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      this.exile.push(card);
      this.updateBattlefieldDisplay();
      this.updateExileDisplay();
      this.updateUI();
      this.showToast(`${card.name} exiled`, 'info');
    }
  }

  moveToHand(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      this.hand.push(card);
      this.updateBattlefieldDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand`, 'info');
    }
  }

  removeBattlefieldCard(cardId) {
    // Check lands
    let cardIndex = this.battlefield.lands.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return this.battlefield.lands.splice(cardIndex, 1)[0];
    }

    // Check creatures
    cardIndex = this.battlefield.creatures.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return this.battlefield.creatures.splice(cardIndex, 1)[0];
    }

    // Check others
    cardIndex = this.battlefield.others.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return this.battlefield.others.splice(cardIndex, 1)[0];
    }

    return null;
  }

  showGraveyardCardMenu(event, cardId) {
    event.preventDefault();

    // Find the card
    const card = this.findGraveyardCard(cardId);
    if (!card) return;

    // Use the new smart context menu system
    this.removeExistingMenus();
    this.createSmartContextMenu(event, card, cardId, 'graveyard');
  }

  showExileCardMenu(event, cardId) {
    event.preventDefault();

    // Find the card
    const card = this.findExileCard(cardId);
    if (!card) return;

    // Use the new smart context menu system
    this.removeExistingMenus();
    this.createSmartContextMenu(event, card, cardId, 'exile');
  }

  findGraveyardCard(cardId) {
    return this.graveyard.find(card => card.id === cardId);
  }

  findExileCard(cardId) {
    return this.exile.find(card => card.id === cardId);
  }

  moveGraveyardToHand(cardId) {
    const cardIndex = this.graveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.graveyard.splice(cardIndex, 1)[0];
      this.hand.push(card.name);
      this.updateGraveyardDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand from graveyard`, 'info');
    }
  }

  moveGraveyardToExile(cardId) {
    const cardIndex = this.graveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.graveyard.splice(cardIndex, 1)[0];
      this.exile.push(card);
      this.updateGraveyardDisplay();
      this.updateExileDisplay();
      this.updateUI();
      this.showToast(`${card.name} exiled from graveyard`, 'info');
    }
  }

  moveGraveyardToBattlefield(cardId) {
    const cardIndex = this.graveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.graveyard.splice(cardIndex, 1)[0];

      // Add to appropriate battlefield zone based on card type
      const cardType = this.getCardMainType(card.type).toLowerCase();
      if (cardType === 'land') {
        this.battlefield.lands.push(card);
      } else if (cardType === 'creature') {
        this.battlefield.creatures.push(card);
      } else {
        this.battlefield.others.push(card);
      }

      this.updateGraveyardDisplay();
      this.updateBattlefieldDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to battlefield from graveyard`, 'info');
    }
  }

  moveExileToHand(cardId) {
    const cardIndex = this.exile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.exile.splice(cardIndex, 1)[0];
      this.hand.push(card.name);
      this.updateExileDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand from exile`, 'info');
    }
  }

  moveExileToGraveyard(cardId) {
    const cardIndex = this.exile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.exile.splice(cardIndex, 1)[0];
      this.graveyard.push(card);
      this.updateExileDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      this.showToast(`${card.name} moved to graveyard from exile`, 'info');
    }
  }

  moveExileToBattlefield(cardId) {
    const cardIndex = this.exile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = this.exile.splice(cardIndex, 1)[0];

      // Add to appropriate battlefield zone based on card type
      const cardType = this.getCardMainType(card.type).toLowerCase();
      if (cardType === 'land') {
        this.battlefield.lands.push(card);
      } else if (cardType === 'creature') {
        this.battlefield.creatures.push(card);
      } else {
        this.battlefield.others.push(card);
      }

      this.updateExileDisplay();
      this.updateBattlefieldDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to battlefield from exile`, 'info');
    }
  }

  addMana(color) {
    this.manaPool[color]++;
    this.updateManaDisplay();
    this.showToast(`Added ${color} mana`, 'success');
  }

  clearMana() {
    this.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    this.updateManaDisplay();
    this.showToast('Mana pool cleared', 'info');
  }

  tapLandsForMana() {
    this.tapAllLandsForMana();
  }

  updateManaDisplay() {
    Object.keys(this.manaPool).forEach(color => {
      const element = document.getElementById(`mana${color}`);
      if (element) {
        element.textContent = this.manaPool[color];
      }
    });
  }

  // Life tracking functions
  changeLife(amount) {
    this.gameStats.life += amount;
    this.updateUI();

    if (amount > 0) {
      this.showToast(`Gained ${amount} life (${this.gameStats.life} life)`, 'success');
    } else {
      this.showToast(`Lost ${Math.abs(amount)} life (${this.gameStats.life} life)`, 'warning');
    }

    this.checkWinConditions();
  }

  setLife(amount) {
    this.gameStats.life = amount;
    this.updateUI();
    this.showToast(`Life set to ${amount}`, 'info');
    this.checkWinConditions();
  }

  checkWinConditions() {
    if (this.gameStats.life <= 0) {
      this.showToast('💀 You have lost the game! (Life <= 0)', 'error');
    }
    if (this.opponent.gameStats.life <= 0) {
      this.showToast('🎉 You have won the game! (Opponent life <= 0)', 'success');
    }
  }

  // Opponent life functions
  changeOpponentLife(amount) {
    this.opponent.gameStats.life += amount;
    this.updateUI();

    if (amount > 0) {
      this.showToast(`Opponent gained ${amount} life (${this.opponent.gameStats.life} life)`, 'info');
    } else {
      this.showToast(`Opponent lost ${Math.abs(amount)} life (${this.opponent.gameStats.life} life)`, 'info');
    }

    this.checkWinConditions();
  }

  setOpponentLife(amount) {
    this.opponent.gameStats.life = amount;
    this.updateUI();
    this.showToast(`Opponent life set to ${amount}`, 'info');
    this.checkWinConditions();
  }

  // Opponent deck management
  giveOpponentCards(count = 7) {
    // Give opponent copies of cards from the current deck for testing
    if (this.library.length === 0) {
      this.showToast('Load a deck first to give opponent cards', 'warning');
      return;
    }

    const availableCards = [...this.library];
    for (let i = 0; i < count && availableCards.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const card = availableCards[randomIndex];

      // Create opponent card with unique ID
      const opponentCard = {
        ...card,
        id: `opponent_${card.id || card.name}_${Date.now()}_${i}`
      };

      this.opponent.hand.push(opponentCard);
      this.opponent.gameStats.cardsDrawn++;

      // Remove from available cards to avoid duplicates in this draw
      availableCards.splice(randomIndex, 1);
    }

    this.updateUI();
    this.updateOpponentHandDisplay();
    this.showToast(`Gave opponent ${count} cards`, 'info');
  }

  clearOpponentHand() {
    this.opponent.hand = [];
    this.updateUI();
    this.updateOpponentHandDisplay();
    this.showToast('Cleared opponent hand', 'info');
  }

  // Opponent deck management
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

      // Set opponent deck
      this.opponent.currentDeck = {
        cardNames: deckInformation.cardNames,
        cardInfo: deckInformation.cardInfo
      };
      this.opponent.deckName = this.extractDeckName(xmlDoc, deckPath);

      // Reset opponent game state when loading new deck (but preserve deck info)
      this.resetOpponentGameState();

      // Set library after reset - create proper card objects
      this.opponent.library = deckInformation.cardNames.map((cardName, index) => ({
        name: cardName,
        id: `opponent_${cardName}_${index}_${Date.now()}`,
        cost: deckInformation.cardInfo[cardName]?.cost || '0',
        type: deckInformation.cardInfo[cardName]?.type || 'Unknown',
        rulesText: deckInformation.cardInfo[cardName]?.rulesText || '',
        tapped: false,
        counters: {}
      }));

      this.shuffleOpponentLibrary();
      this.updateUI();

      console.log('Opponent deck loaded successfully');
      console.log('Opponent library size:', this.opponent.library.length);
      console.log('First few cards:', this.opponent.library.slice(0, 3));

      this.showToast(`Opponent loaded: ${this.opponent.deckName}`, 'success');

    } catch (error) {
      console.error('Error loading opponent deck:', error);
      this.showToast(`Failed to load opponent deck: ${error.message}`, 'error');
    }
  }

  resetOpponentGameState() {
    this.opponent.hand = [];
    this.opponent.battlefield = { lands: [], creatures: [], others: [] };
    this.opponent.graveyard = [];
    this.opponent.exile = [];
    this.opponent.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      mulligans: 0,
      life: 20
    };
    this.opponent.selectedCards.clear();
    this.opponent.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  }

  shuffleOpponentLibrary() {
    for (let i = this.opponent.library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.opponent.library[i], this.opponent.library[j]] = [this.opponent.library[j], this.opponent.library[i]];
    }
  }

  drawOpponentHand(count = 7) {
    console.log('=== drawOpponentHand called ===');
    console.log('count:', count);
    console.log('opponent library length:', this.opponent.library?.length);

    if (!this.opponent.library || this.opponent.library.length === 0) {
      console.error('Opponent library is empty or undefined');
      this.showToast('Opponent has no deck loaded. Please select an opponent deck first.', 'warning');
      return;
    }

    this.opponent.hand = [];
    const cardsToDraw = Math.min(count, this.opponent.library.length);

    for (let i = 0; i < cardsToDraw; i++) {
      const card = this.opponent.library.shift();
      if (card) {
        // Create card with unique opponent ID
        const opponentCard = {
          ...card,
          id: `opponent_${card.id || card.name}_${Date.now()}_${i}`
        };
        this.opponent.hand.push(opponentCard);
        this.opponent.gameStats.cardsDrawn++;
      }
    }

    this.updateUI();
    this.updateOpponentHandDisplay();
    this.showToast(`Opponent drew ${cardsToDraw} cards`, 'info');
  }

  drawOpponentCard() {
    if (this.opponent.library.length === 0) {
      this.showToast('Opponent library is empty', 'warning');
      return;
    }

    const card = this.opponent.library.shift();
    if (card) {
      const opponentCard = {
        ...card,
        id: `opponent_${card.id || card.name}_${Date.now()}`
      };
      this.opponent.hand.push(opponentCard);
      this.opponent.gameStats.cardsDrawn++;

      this.updateUI();
      this.updateOpponentHandDisplay();
      this.showToast('Opponent drew a card', 'info');
    }
  }

  mulliganOpponent() {
    if (this.opponent.library.length === 0) {
      this.showToast('Opponent has no deck loaded', 'warning');
      return;
    }

    // Put hand back into library
    this.opponent.library.push(...this.opponent.hand);
    this.shuffleOpponentLibrary();

    // Draw new hand (one less card for each mulligan)
    const newHandSize = Math.max(1, 7 - this.opponent.gameStats.mulligans - 1);
    this.opponent.gameStats.mulligans++;

    this.drawOpponentHand(newHandSize);
    this.showToast(`Opponent mulliganed (${this.opponent.gameStats.mulligans} mulligans)`, 'info');
  }

  // Opponent card play functions
  playOpponentCard(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.opponent.hand.length) {
      const card = this.opponent.hand[cardIndex];
      const cardType = this.getCardMainType(card.type);

      // Play card to opponent's battlefield
      if (cardType === 'Land') {
        this.opponent.battlefield.lands.push(card);
        this.opponent.gameStats.landsPlayed++;
      } else if (cardType === 'Instant' || cardType === 'Sorcery') {
        this.opponent.graveyard.push(card);
        this.opponent.gameStats.spellsCast++;
        this.showToast(`Opponent cast ${card.name}`, 'info');
      } else if (cardType === 'Creature') {
        this.opponent.battlefield.creatures.push(card);
        this.opponent.gameStats.spellsCast++;
      } else {
        this.opponent.battlefield.others.push(card);
        this.opponent.gameStats.spellsCast++;
      }

      // Remove from opponent hand
      this.opponent.hand.splice(cardIndex, 1);

      this.updateUI();
      this.updateOpponentHandDisplay();
      this.updateOpponentBattlefieldDisplay();
      this.showToast(`Opponent played ${card.name}`, 'info');
    }
  }

  sortHand() {
    this.hand.sort((a, b) => {
      // Sort by type first, then by cost, then by name
      const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);

      if (typeOrder[aType] !== typeOrder[bType]) {
        return (typeOrder[aType] || 6) - (typeOrder[bType] || 6);
      }

      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      if (aCost !== bCost) {
        return aCost - bCost;
      }

      return a.name.localeCompare(b.name);
    });

    this.updateHandDisplay();
    this.showToast('Hand sorted', 'info');
  }

  getCardMainType(type) {
    const typeStr = (type || '').toLowerCase();
    if (typeStr.includes('land')) return 'Land';
    if (typeStr.includes('creature')) return 'Creature';
    if (typeStr.includes('artifact')) return 'Artifact';
    if (typeStr.includes('enchantment')) return 'Enchantment';
    if (typeStr.includes('sorcery')) return 'Sorcery';
    if (typeStr.includes('instant')) return 'Instant';
    return 'Other';
  }

  parseManaValue(cost) {
    if (!cost) return 0;

    let totalCost = 0;
    const numbers = cost.match(/\{(\d+)\}/g);
    if (numbers) {
      numbers.forEach(num => {
        const value = parseInt(num.replace(/[{}]/g, ''));
        if (!isNaN(value)) totalCost += value;
      });
    }

    const coloredMana = cost.match(/\{[WUBRG]\}/g);
    if (coloredMana) totalCost += coloredMana.length;

    return totalCost;
  }


  async loadHandImages() {
    console.log('loadHandImages called');
    const uniqueCardNames = [...new Set(this.hand)]; // hand contains card name strings directly
    console.log('Unique card names for images:', uniqueCardNames);

    for (const cardName of uniqueCardNames) {
      try {
        console.log('Loading image for:', cardName);
        const imageUrl = await CardImageService.getCardImageUrl(cardName, 'normal');
        this.updateHandCardImage(cardName, imageUrl);
      } catch (error) {
        console.warn(`Failed to load image for ${cardName}:`, error);
      }
    }
  }

  async loadZoneImages(cards) {
    const uniqueCardNames = [...new Set(cards.map(card => card.name))];

    for (const cardName of uniqueCardNames) {
      try {
        const imageUrl = await CardImageService.getCardImageUrl(cardName, 'normal');
        this.updateHandCardImage(cardName, imageUrl); // This method works for any element with data-card-name
      } catch (error) {
        console.warn(`Failed to load image for ${cardName}:`, error);
      }
    }
  }

  updateHandCardImage(cardName, imageUrl) {
    const cardElements = document.querySelectorAll(`[data-card-name="${cardName}"]`);

    cardElements.forEach(element => {
      const imageContainer = element.querySelector('.card-image-container');
      if (imageContainer) {
        // Create image element programmatically to avoid HTML escaping issues
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = cardName;
        img.style.cssText = 'width: 60px; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s ease; border-radius: 6px;';

        img.onload = function() {
          this.style.opacity = '1';
        };

        img.onerror = function() {
          this.parentElement.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              font-size: 0.8rem;
              color: var(--text-muted);
              text-align: center;
              background: var(--bg-tertiary);
              border-radius: 6px;
            ">
              <div style="font-size: 1.5rem; margin-bottom: 4px;">🎴</div>
              <div>No Image</div>
            </div>
          `;
        };

        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
      }
    });
  }

  toggleCardSelection(cardId) {
    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      this.selectedCards.add(cardId);
    }
    this.updateHandDisplay();
  }

  playSelectedCards() {
    if (this.selectedCards.size === 0) {
      this.showToast('No cards selected', 'warning');
      return;
    }

    // Convert selected card IDs back to indices and get the actual card names
    const cardsToPlay = [];
    const indicesToRemove = [];

    this.selectedCards.forEach(cardId => {
      // Find the card in hand that matches this cardId
      const index = this.hand.findIndex((card, idx) => {
        const actualCardId = card.id || `${card.name}_${idx}`;
        return actualCardId === cardId;
      });

      if (index >= 0 && index < this.hand.length) {
        const card = this.hand[index];

        cardsToPlay.push(card);
        indicesToRemove.push(index);
      }
    });

    // Play each selected card
    cardsToPlay.forEach(card => {
      this.playCard(card);
    });

    // Remove played cards from hand (in reverse order to maintain indices)
    indicesToRemove.sort((a, b) => b - a).forEach(index => {
      this.hand.splice(index, 1);
    });

    this.selectedCards.clear();

    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateUI();

    this.showToast(`Played ${cardsToPlay.length} card(s)`, 'success');
  }

  playCardDirectly(cardId, event) {
    // Prevent any event bubbling
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Determine which player is playing the card
    if (cardId.startsWith('opponent_')) {
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
      console.error('Available cards:', this.hand.map((card, index) => ({
        actualId: card.id || `${card.name}_${index}`,
        name: card.name
      })));
      return;
    }

    const card = this.hand[cardIndex];
    console.log('Found card:', card);

    // Play the card
    this.playCard(card);

    // Remove from hand
    this.hand.splice(cardIndex, 1);

    // Clear any selection for this card
    this.selectedCards.delete(cardId);

    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateUI();

    this.showToast(`Played ${card.name}`, 'success');
  }

  playOpponentCardDirectly(cardId, _event) {
    // Find the card in opponent's hand
    const cardIndex = this.opponent.hand.findIndex(card => card.id === cardId);

    if (cardIndex !== -1) {
      this.playOpponentCard(cardIndex);
    }
  }

  playCard(card) {
    const cardType = this.getCardMainType(card.type);

    // Determine which player's zones to use based on the card's owner
    const isOpponentCard = card.id && card.id.startsWith('opponent_');
    const battlefield = isOpponentCard ? this.opponent.battlefield : this.battlefield;
    const graveyard = isOpponentCard ? this.opponent.graveyard : this.graveyard;
    const gameStats = isOpponentCard ? this.opponent.gameStats : this.gameStats;

    if (cardType === 'Land') {
      battlefield.lands.push(card);
      gameStats.landsPlayed++;
    } else if (cardType === 'Instant' || cardType === 'Sorcery') {
      // Instants and sorceries go directly to graveyard after being cast
      graveyard.push(card);
      gameStats.spellsCast++;
      this.updateGraveyardDisplay();
      this.updateUI();
      const playerName = isOpponentCard ? 'Opponent' : 'Player';
      this.showToast(`${playerName}'s ${card.name} resolves and goes to graveyard`, 'info');
    } else if (cardType === 'Creature') {
      battlefield.creatures.push(card);
      gameStats.spellsCast++;
    } else {
      // Artifacts, enchantments, planeswalkers, etc. stay on battlefield
      battlefield.others.push(card);
      gameStats.spellsCast++;
    }
  }

  updateBattlefieldDisplay() {
    this.updateZoneDisplay('battlefieldLands', this.battlefield.lands);
    this.updateZoneDisplay('battlefieldCreatures', this.battlefield.creatures);
    this.updateZoneDisplay('battlefieldOthers', this.battlefield.others);

    // Also update two-player layout
    this.updateZoneDisplay('battlefieldLands2', this.battlefield.lands);
    this.updateZoneDisplay('battlefieldCreatures2', this.battlefield.creatures);
    this.updateZoneDisplay('battlefieldOthers2', this.battlefield.others);
  }

  updateOpponentBattlefieldDisplay() {
    this.updateZoneDisplay('opponentBattlefieldLands', this.opponent.battlefield.lands);
    this.updateZoneDisplay('opponentBattlefieldCreatures', this.opponent.battlefield.creatures);
    this.updateZoneDisplay('opponentBattlefieldOthers', this.opponent.battlefield.others);

    // Also update two-player layout
    this.updateZoneDisplay('opponentBattlefieldLands2', this.opponent.battlefield.lands);
    this.updateZoneDisplay('opponentBattlefieldCreatures2', this.opponent.battlefield.creatures);
    this.updateZoneDisplay('opponentBattlefieldOthers2', this.opponent.battlefield.others);
  }

  updateOpponentHandDisplay() {
    // For opponent, just show card backs or count
    const container2 = document.getElementById('opponentHandContainer2');

    const cardBacks = this.opponent.hand.map((_, index) =>
      `<div class="card-back">Card ${index + 1}</div>`
    ).join('');

    if (container2) {
      container2.innerHTML = cardBacks;
    } else {
      console.warn('opponentHandContainer2 not found');
    }
  }

  updateHandDisplay() {
    console.log('updateHandDisplay called, hand:', this.hand);
    // Update both single and two-player layouts
    this.updateZoneDisplay('handContainer', this.hand);
    this.updateZoneDisplay('handContainer2', this.hand);
  }

  updateGraveyardDisplay() {
    this.updateZoneDisplay('graveyardZone', this.graveyard);
  }

  updateExileDisplay() {
    this.updateZoneDisplay('exileZone', this.exile);
  }

  updateZoneDisplay(containerId, cards) {
    console.log('updateZoneDisplay called:', containerId, 'cards:', cards.length);
    const container = document.getElementById(containerId);
    console.log('container found:', container);
    if (!container) {
      console.warn('Container not found:', containerId);
      return;
    }

    // Special handling for hand containers
    if (containerId.includes('handContainer')) {
      console.log('Processing hand container:', containerId);
      console.log('Cards to display:', cards);
      console.log('First card structure:', cards[0]);

      try {
        container.innerHTML = cards.map((card, index) => {
          console.log('Processing card', index, ':', card);
          const cardId = card.id || `${card.name}_${index}`;
          const isSelected = this.selectedCards.has(cardId);
          const cardType = this.getCardMainType(card.type || '').toLowerCase();
          console.log('Card processed:', cardId, cardType);

        return `
          <div class="card-hand ${cardType} ${isSelected ? 'selected' : ''} card-dealt"
               data-card-id="${cardId}"
               data-card-name="${this.escapeHtml(card.name)}"
               style="animation-delay: ${index * 0.1}s; position: relative;"
               onclick="window.handSimulator.playCardDirectly('${cardId}', event)"
               oncontextmenu="window.handSimulator.showHandCardMenu(event, '${cardId}'); return false;"
               title="${this.escapeHtml(card.name)} - ${this.escapeHtml(card.cost || '0')} (Press ${index + 1} or Left-click to play, Right-click for options)">
            ${index < 9 ? `<div class="card-number" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.8); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; z-index: 10;">${index + 1}</div>` : ''}
            <div class="card-content">
              <div class="card-image-container">
                <div class="loading-placeholder">🎴</div>
              </div>
              <div class="card-info">
                <div class="card-name">${this.escapeHtml(card.name)}</div>
                <div class="card-details">
                  <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
                  <div class="card-type">${this.escapeHtml(this.getCardMainType(card.type || 'Unknown'))}</div>
                  ${card.counters && Object.keys(card.counters).length > 0 ?
                    `<div class="card-counters">
                      ${Object.entries(card.counters).map(([type, count]) =>
                        `<span class="counter-badge" data-type="${type}">${count} ${type}</span>`
                      ).join('')}
                    </div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
        }).join('');

        console.log('Hand HTML generated, setting container innerHTML');
        console.log('HTML length:', container.innerHTML.length);
        console.log('Container children after update:', container.children.length);

        // Load images for hand cards
        this.loadZoneImages(cards);
        console.log('Hand container processing complete');
        return;
      } catch (error) {
        console.error('Error in hand container processing:', error);
        return;
      }
    }

    // Determine which menu function to use based on the container ID
    let menuFunction = 'showBattlefieldCardMenu';
    if (containerId === 'graveyardZone') {
      menuFunction = 'showGraveyardCardMenu';
    } else if (containerId === 'exileZone') {
      menuFunction = 'showExileCardMenu';
    }

    container.innerHTML = cards.map((card, index) => {
      const isTapped = card.tapped || false;
      const counters = card.counters || {};
      const activeCounters = Object.entries(counters).filter(([_type, count]) => count > 0);
      const hasCounters = activeCounters.length > 0;
      const counterText = activeCounters.map(([type, count]) => `${count} ${type}`).join(', ');

      console.log(`Rendering card ${card.name}:`, {
        isTapped,
        hasCounters,
        counters,
        counterText
      });

      let counterHTML = '';
      if (hasCounters) {
        counterHTML = `<div class="counter-indicator">${counterText}</div>`;
        console.log(`Generated counterHTML for ${card.name}:`, counterHTML);
      }

      let tapHTML = '';
      if (isTapped) {
        tapHTML = '<div class=\'tap-indicator\' style=\'position: absolute; top: 2px; right: 2px; background: rgba(255, 255, 255, 0.9); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; z-index: 100;\'>⤵️</div>';
      }

      return `
        <div class="zone-card card-played ${isTapped ? 'tapped' : ''}"
             style="animation-delay: ${index * 0.05}s; cursor: pointer;"
             data-card-id="${card.id}"
             data-card-name="${this.escapeHtml(card.name)}"
             onclick="window.handSimulator.showCardPreview('${this.escapeHtml(card.name)}')"
             oncontextmenu="window.handSimulator.${menuFunction}(event, '${card.id}'); return false;"
             title="Left-click to view card, Right-click for options">
          <div class="card-content">
            <div class="card-image-container" style="position: relative;">
              <div class="loading-placeholder">🎴</div>
              ${tapHTML}
            </div>
            <div class="card-info">
              <div class="card-name">${this.escapeHtml(card.name)}</div>
              <div class="card-details">
                <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
                <div class="card-type">${this.escapeHtml(this.getCardMainType(card.type || 'Unknown'))}</div>
                ${hasCounters ?
                  `<div class="card-counters">
                    ${activeCounters.map(([type, count]) =>
                      `<span class="counter-badge" data-type="${type}">${count} ${type}</span>`
                    ).join('')}
                  </div>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Load images for cards
    this.loadZoneImages(cards);
  }

  showLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) {
      modal.style.display = 'flex';
      this.updateLibraryDisplay();
    }
  }

  hideLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  updateLibraryDisplay() {
    const container = document.getElementById('libraryContents');
    if (!container) return;

    container.innerHTML = this.library.map(card => `
      <div class="card-list-item">
        <div class="card-info">
          <div class="card-name">${this.escapeHtml(card.name)}</div>
          <div class="card-details">
            <span>Cost: ${this.escapeHtml(card.cost || '0')}</span>
            <span>Type: ${this.escapeHtml(card.type || '')}</span>
          </div>
        </div>
      </div>
    `).join('');
  }


  updateUI() {
    console.log('updateUI called');
    console.log('hand length:', this.hand.length);
    console.log('library length:', this.library.length);

    // Update counters
    const handCountEl = document.getElementById('handCount');
    const mulliganCountEl = document.getElementById('mulliganCount');
    const deckSizeEl = document.getElementById('deckSize');
    const graveyardCountEl = document.getElementById('graveyardCount');
    const exileCountEl = document.getElementById('exileCount');

    if (handCountEl) handCountEl.textContent = `${this.hand.length} cards`;
    if (mulliganCountEl) mulliganCountEl.textContent = `${this.gameStats.mulligans} mulligans`;
    if (deckSizeEl) deckSizeEl.textContent = this.library.length;
    if (graveyardCountEl) graveyardCountEl.textContent = this.graveyard.length;
    if (exileCountEl) exileCountEl.textContent = this.exile.length;

    // Update stats
    const cardsDrawnEl = document.getElementById('cardsDrawn');
    const landsPlayedEl = document.getElementById('landsPlayed');
    const spellsCastEl = document.getElementById('spellsCast');
    const turnNumberEl = document.getElementById('turnNumber');
    const lifeEl = document.getElementById('lifeTotal');

    if (cardsDrawnEl) cardsDrawnEl.textContent = this.gameStats.cardsDrawn;
    if (landsPlayedEl) landsPlayedEl.textContent = this.gameStats.landsPlayed;
    if (spellsCastEl) spellsCastEl.textContent = this.gameStats.spellsCast;
    if (turnNumberEl) turnNumberEl.textContent = this.gameStats.turnNumber;
    if (lifeEl) lifeEl.textContent = this.gameStats.life;

    // Update two-player layout player stats
    const handCount2El = document.getElementById('handCount2');
    const mulliganCount2El = document.getElementById('mulliganCount2');
    const lifeTotal2El = document.getElementById('lifeTotal2');
    const graveyardCount2El = document.getElementById('graveyardCount2');
    const exileCount2El = document.getElementById('exileCount2');

    if (handCount2El) handCount2El.textContent = `${this.hand.length} cards`;
    if (mulliganCount2El) mulliganCount2El.textContent = `${this.gameStats.mulligans} mulligans`;
    if (lifeTotal2El) lifeTotal2El.textContent = this.gameStats.life;
    if (graveyardCount2El) graveyardCount2El.textContent = this.graveyard.length;
    if (exileCount2El) exileCount2El.textContent = this.exile.length;

    // Update opponent info (both layouts)
    const opponentLifeEl = document.getElementById('opponentLife');
    const opponentHandCountEl = document.getElementById('opponentHandCount');
    const opponentGraveyardCountEl = document.getElementById('opponentGraveyardCount');
    const opponentExileCountEl = document.getElementById('opponentExileCount');

    // Two-player layout elements
    const opponentLife2El = document.getElementById('opponentLife2');
    const opponentHandCount2El = document.getElementById('opponentHandCount2');
    const opponentGraveyardCount2El = document.getElementById('opponentGraveyardCount2');
    const opponentExileCount2El = document.getElementById('opponentExileCount2');

    if (opponentLifeEl) opponentLifeEl.textContent = this.opponent.gameStats.life;
    if (opponentHandCountEl) opponentHandCountEl.textContent = this.opponent.hand.length;
    if (opponentGraveyardCountEl) opponentGraveyardCountEl.textContent = this.opponent.graveyard.length;
    if (opponentExileCountEl) opponentExileCountEl.textContent = this.opponent.exile.length;

    if (opponentLife2El) opponentLife2El.textContent = this.opponent.gameStats.life;
    if (opponentHandCount2El) opponentHandCount2El.textContent = this.opponent.hand.length;
    if (opponentGraveyardCount2El) opponentGraveyardCount2El.textContent = this.opponent.graveyard.length;
    if (opponentExileCount2El) opponentExileCount2El.textContent = this.opponent.exile.length;

    // Update opponent deck name
    const opponentDeckNameEl = document.getElementById('opponentDeckName');
    const opponentDeckName2El = document.getElementById('opponentDeckName2');
    const opponentDeckNameTopEl = document.getElementById('opponentDeckNameTop');
    if (opponentDeckNameEl) opponentDeckNameEl.textContent = this.opponent.deckName;
    if (opponentDeckName2El) opponentDeckName2El.textContent = this.opponent.deckName;
    if (opponentDeckNameTopEl) opponentDeckNameTopEl.textContent = this.opponent.deckName;

    // Update player switch button states
    const playerBtn = document.getElementById('switchToPlayer');
    const opponentBtn = document.getElementById('switchToOpponent');
    if (playerBtn && opponentBtn) {
      if (this.activePlayer === 'player') {
        playerBtn.classList.add('btn-primary');
        playerBtn.classList.remove('btn-secondary');
        opponentBtn.classList.add('btn-secondary');
        opponentBtn.classList.remove('btn-primary');
      } else {
        opponentBtn.classList.add('btn-primary');
        opponentBtn.classList.remove('btn-secondary');
        playerBtn.classList.add('btn-secondary');
        playerBtn.classList.remove('btn-primary');
      }
    }

    // Update mana display
    this.updateManaDisplay();

    console.log('UI updated - deck size element:', deckSizeEl, 'text:', deckSizeEl?.textContent);
  }

  showQuickActions() {
    if (this.selectedCards.size > 0) {
      this.playSelectedCards();
    } else {
      this.drawCard();
    }
  }


  async showCardPreview(cardName) {
    const modal = document.getElementById('cardPreviewModal');
    const previewCardName = document.getElementById('previewCardName');
    const previewCardImage = document.getElementById('previewCardImage');
    const previewCardInfo = document.getElementById('previewCardInfo');

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) return;

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';
    previewCardInfo.innerHTML = '<div class="text-center text-muted">Loading card details...</div>';
    modal.style.display = 'flex';
    modal.classList.add('fade-in');

    try {
      // Get high-quality image and card data
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'large');
      const cached = CardImageService.CARD_CACHE.get(`${cardName}-large`);

      // Update image
      if (imageUrl && !imageUrl.startsWith('data:')) {
        previewCardImage.src = imageUrl;
        previewCardImage.style.display = 'block';
      } else {
        previewCardImage.src = imageUrl;
        previewCardImage.style.display = 'block';
      }

      // Update card info
      if (cached?.cardData) {
        const cardData = cached.cardData;
        previewCardInfo.innerHTML = `
          <div class="mb-2">
            <strong>Type:</strong> ${this.escapeHtml(cardData.type_line || 'Unknown')}
          </div>
          ${cardData.mana_cost ? `
            <div class="mb-2">
              <strong>Mana Cost:</strong> ${this.escapeHtml(cardData.mana_cost)}
            </div>
          ` : ''}
          ${cardData.colors && cardData.colors.length > 0 ? `
            <div class="mb-2">
              <strong>Colors:</strong> ${cardData.colors.join(', ')}
            </div>
          ` : ''}
        `;
      } else {
        previewCardInfo.innerHTML = `
          <div class="text-muted">
            Card details will be available after the image loads.
          </div>
        `;
      }
    } catch (error) {
      console.error('Error showing card preview:', error);
      previewCardInfo.innerHTML = '<div class="text-danger">Failed to load card details</div>';
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Test functions for zone functionality
  addTestCardToGraveyard() {
    const testCard = {
      id: `test_graveyard_${Date.now()}`,
      name: 'Lightning Bolt',
      type: 'Instant',
      cost: '{R}',
      tapped: false,
      counters: {}
    };
    this.graveyard.push(testCard);
    this.updateGraveyardDisplay();
    this.updateUI();
    this.showToast('Added test card to graveyard', 'info');
  }

  addTestCardToExile() {
    const testCard = {
      id: `test_exile_${Date.now()}`,
      name: 'Path to Exile',
      type: 'Instant',
      cost: '{W}',
      tapped: false,
      counters: {}
    };
    this.exile.push(testCard);
    this.updateExileDisplay();
    this.updateUI();
    this.showToast('Added test card to exile', 'info');
  }

  // Test function to add a creature with counters to battlefield
  addTestCreatureWithCounters() {
    const testCreature = {
      id: `test_creature_${Date.now()}`,
      name: 'Grizzly Bears',
      type: 'Creature — Bear',
      cost: '{1}{G}',
      tapped: false,
      counters: {
        '+1/+1': 3,
        'charge': 1
      }
    };

    console.log('Adding test creature with counters:', testCreature);
    this.battlefield.creatures.push(testCreature);
    console.log('Battlefield creatures after adding:', this.battlefield.creatures);

    this.updateBattlefieldDisplay();
    this.updateUI();
    this.showToast('Added test creature with multiple counters to battlefield', 'success');
  }

  // Debug function for testing counters
  debugCounters() {
    console.log('=== COUNTER DEBUG ===');
    console.log('All battlefield creatures:', this.battlefield.creatures);

    if (this.battlefield.creatures.length > 0) {
      const firstCreature = this.battlefield.creatures[0];
      console.log('First creature:', firstCreature);
      console.log('First creature counters:', firstCreature.counters);

      // Manually add a counter and test
      if (!firstCreature.counters) firstCreature.counters = {};
      firstCreature.counters['debug'] = 99;
      console.log('Added debug counter, new counters:', firstCreature.counters);

      this.updateBattlefieldDisplay();
      this.showToast('Added debug counter - check console and battlefield', 'info');
    } else {
      this.showToast('No creatures on battlefield to debug', 'warning');
    }
  }

  // Modal functions for graveyard and exile in two-player layout
  showGraveyardModal() {
    this.showZoneModal('graveyardModal', 'graveyardModalContents', this.graveyard, 'Graveyard');
  }

  showExileModal() {
    this.showZoneModal('exileModal', 'exileModalContents', this.exile, 'Exile');
  }

  showOpponentGraveyardModal() {
    this.showZoneModal('graveyardModal', 'graveyardModalContents', this.opponent.graveyard, 'Opponent Graveyard');
  }

  showOpponentExileModal() {
    this.showZoneModal('exileModal', 'exileModalContents', this.opponent.exile, 'Opponent Exile');
  }

  showZoneModal(modalId, contentId, cards, title) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(contentId);
    const titleElement = modal.querySelector('h3');

    if (!modal || !content) return;

    titleElement.textContent = title;

    // Update modal content with cards
    if (cards.length === 0) {
      content.innerHTML = '<div class="text-muted text-center p-4">No cards in this zone</div>';
    } else {
      content.innerHTML = cards.map(card => `
        <div class="zone-card"
             data-card-id="${card.id}"
             data-card-name="${this.escapeHtml(card.name)}"
             style="cursor: pointer;"
             onclick="window.handSimulator.showCardPreview('${this.escapeHtml(card.name)}')"
             title="${this.escapeHtml(card.name)} - ${this.escapeHtml(card.cost || '0')}">
          <div class="card-image-container">
            <div class="loading-placeholder">🎴</div>
          </div>
          <div class="card-info">
            <div class="card-name">${this.escapeHtml(card.name)}</div>
            <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
          </div>
        </div>
      `).join('');

      // Load images for cards
      this.loadZoneImages(cards);
    }

    modal.style.display = 'flex';
    modal.classList.add('fade-in');
  }

  hideZoneModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('fade-in');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }

  // Hand card movement functions
  moveHandCardToGraveyard(cardId) {
    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = this.hand.splice(cardIndex, 1)[0];
      this.graveyard.push(card);
      this.updateHandDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      this.showToast(`${card.name} moved to graveyard`, 'info');
    }
  }

  moveHandCardToExile(cardId) {
    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = this.hand.splice(cardIndex, 1)[0];
      this.exile.push(card);
      this.updateHandDisplay();
      this.updateExileDisplay();
      this.updateUI();
      this.showToast(`${card.name} exiled`, 'info');
    }
  }

  moveHandCardToLibrary(cardId) {
    const cardIndex = this.hand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = this.hand.splice(cardIndex, 1)[0];

      // Ask where to put it in library
      const position = window.prompt('Put on top (t) or bottom (b) of library?', 't');
      if (position === null) {
        // Cancelled - put card back in hand
        this.hand.splice(cardIndex, 0, card);
        return;
      }

      if (position.toLowerCase() === 'b' || position.toLowerCase() === 'bottom') {
        this.library.unshift(card); // Bottom of library
        this.showToast(`${card.name} put on bottom of library`, 'info');
      } else {
        this.library.push(card); // Top of library
        this.showToast(`${card.name} put on top of library`, 'info');
      }

      this.updateHandDisplay();
      this.updateUI();
    }
  }

  // Tap/Untap functionality
  toggleTap(cardId) {
    const card = this.findBattlefieldCard(cardId);
    if (card) {
      card.tapped = !card.tapped;
      this.updateBattlefieldDisplay();
      this.showToast(`${card.name} ${card.tapped ? 'tapped' : 'untapped'}`, 'info');
    }
  }

  // Counter functionality
  addCounter(cardId, counterType) {
    const card = this.findBattlefieldCard(cardId);
    if (card) {
      if (!card.counters) {
        card.counters = {};
      }
      if (!card.counters[counterType]) {
        card.counters[counterType] = 0;
      }
      card.counters[counterType]++;
      console.log(`Added counter to ${card.name}:`, card.counters);
      this.updateBattlefieldDisplay();
      this.showToast(`Added ${counterType} counter to ${card.name} (${card.counters[counterType]} total)`, 'info');
    } else {
      console.error('Card not found for addCounter:', cardId);
    }
  }

  removeCounter(cardId, counterType) {
    const card = this.findBattlefieldCard(cardId);
    if (card && card.counters[counterType] && card.counters[counterType] > 0) {
      card.counters[counterType]--;
      if (card.counters[counterType] === 0) {
        delete card.counters[counterType];
      }
      this.updateBattlefieldDisplay();
      this.showToast(`Removed ${counterType} counter from ${card.name}`, 'info');
    }
  }

  // Tap all lands for mana (enhanced version)
  tapAllLandsForMana() {
    let manaAdded = 0;
    this.battlefield.lands.forEach(land => {
      if (!land.tapped) {
        land.tapped = true;
        manaAdded++;
      }
    });

    if (manaAdded > 0) {
      this.manaPool.C += manaAdded;
      this.updateManaDisplay();
      this.updateBattlefieldDisplay();
      this.showToast(`Tapped ${manaAdded} lands for ${manaAdded} colorless mana`, 'success');
    } else {
      this.showToast('No untapped lands available', 'warning');
    }
  }

  // Untap all permanents (for beginning of turn)
  untapAll() {
    let untappedCount = 0;

    [...this.battlefield.lands, ...this.battlefield.creatures, ...this.battlefield.others].forEach(card => {
      if (card.tapped) {
        card.tapped = false;
        untappedCount++;
      }
    });

    if (untappedCount > 0) {
      this.updateBattlefieldDisplay();
      this.showToast(`Untapped ${untappedCount} permanents`, 'success');
    }
  }

  // ========================================
  // ENHANCED UI/UX METHODS
  // ========================================

  /**
   * Initialize enhanced UI features like card zoom, animations, and sound effects
   */
  initializeEnhancedUI() {
    this.setupCardZoom();
    this.setupAnimationHelpers();
    this.setupToastSystem();
    this.setupKeyboardSounds();
    this.setupVisualFeedback();
    this.initSoundButton();
  }

  /**
   * Setup card zoom functionality - click any card to see large preview
   */
  setupCardZoom() {
    const overlay = document.getElementById('cardZoomOverlay');
    const zoomImage = document.getElementById('cardZoomImage');
    const closeBtn = document.getElementById('cardZoomClose');

    if (!overlay || !zoomImage || !closeBtn) return;

    // Add click listeners to all card elements
    this.addCardZoomListeners();

    // Close zoom overlay
    const closeZoom = () => {
      overlay.classList.remove('active');
      this.playSound('cardClose');
    };

    closeBtn.addEventListener('click', closeZoom);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeZoom();
    });

    // Keyboard shortcut to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeZoom();
      }
    });
  }

  /**
   * Add zoom click listeners to all card elements
   */
  addCardZoomListeners() {
    // Use event delegation for dynamically added cards
    document.addEventListener('click', (e) => {
      const cardElement = e.target.closest('.card-item, .card-hand, .zone-card');
      if (cardElement && e.altKey) { // Alt+click to zoom
        e.preventDefault();
        this.showCardZoom(cardElement);
      }
    });

    // Also add double-click zoom
    document.addEventListener('dblclick', (e) => {
      const cardElement = e.target.closest('.card-item, .card-hand, .zone-card');
      if (cardElement) {
        e.preventDefault();
        this.showCardZoom(cardElement);
      }
    });
  }

  /**
   * Show large card preview
   */
  async showCardZoom(cardElement) {
    const cardName = cardElement.textContent || cardElement.dataset.cardName;
    if (!cardName) return;

    const overlay = document.getElementById('cardZoomOverlay');
    const zoomImage = document.getElementById('cardZoomImage');

    if (!overlay || !zoomImage) return;

    this.playSound('cardOpen');

    try {
      // Get high-res card image
      const imageUrl = await this.cardImageService.getCardImageUrl(cardName);
      zoomImage.src = imageUrl;
      zoomImage.alt = cardName;

      overlay.classList.add('active');
    } catch (error) {
      console.warn('Could not load card image for zoom:', cardName, error);
      this.showToast(`Could not load image for ${cardName}`, 'warning');
    }
  }

  /**
   * Setup animation helper methods
   */
  setupAnimationHelpers() {
    // Store animation promise for chaining
    this.animationPromises = new Map();
  }

  /**
   * Animate card with specified animation class
   */
  animateCard(cardElement, animationType, duration = 600) {
    return new Promise((resolve) => {
      if (!cardElement) {
        resolve();
        return;
      }

      const animationClass = `card-${animationType}`;
      cardElement.classList.add(animationClass);

      // Play appropriate sound
      this.playSound(animationType);

      const cleanup = () => {
        cardElement.classList.remove(animationClass);
        resolve();
      };

      setTimeout(cleanup, duration);
    });
  }

  /**
   * Enhanced card draw with animation
   */
  async animatedDrawCard() {
    const newCard = this.drawCard(); // Original draw logic
    if (!newCard) return null;

    // Find the newly added card element and animate it
    await this.updateHandDisplay();
    const handContainer = document.getElementById('handContainer');
    const cardElements = handContainer?.querySelectorAll('.card-item');
    const newCardElement = cardElements?.[cardElements.length - 1];

    if (newCardElement) {
      await this.animateCard(newCardElement, 'drawing');
    }

    return newCard;
  }

  /**
   * Enhanced card play with animation
   */
  async animatedPlayCard(cardElement, _targetZone = 'battlefield') {
    if (!cardElement) return;

    // Add playing animation
    await this.animateCard(cardElement, 'playing');

    // Move card to target zone (original logic)
    // This would integrate with existing playCard methods

    // Update displays
    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
  }

  /**
   * Setup toast notification system
   */
  setupToastSystem() {
    // Toast container should already exist in HTML
    this.toastContainer = document.getElementById('toastContainer');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toastContainer';
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  }


  /**
   * Setup sound effects system
   */
  setupKeyboardSounds() {
    this.sounds = {
      drawing: this.createSound('draw', [800, 1000, 1200], 0.3),
      playing: this.createSound('play', [1200, 800, 600], 0.4),
      shuffling: this.createSound('shuffle', [400, 600, 500, 700], 0.2),
      flipping: this.createSound('flip', [600, 800], 0.3),
      success: this.createSound('success', [523, 659, 784], 0.3),
      error: this.createSound('error', [200, 150, 100], 0.4),
      warning: this.createSound('warning', [800, 600], 0.3),
      info: this.createSound('info', [800], 0.2),
      cardOpen: this.createSound('open', [600, 800, 1000], 0.2),
      cardClose: this.createSound('close', [1000, 800, 600], 0.2),
      click: this.createSound('click', [800], 0.1)
    };

    // Add sound to button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn, .mana-btn')) {
        this.playSound('click');
      }
    });
  }

  /**
   * Create Web Audio API sound
   */
  createSound(name, frequencies, volume = 0.3) {
    return {
      name,
      frequencies,
      volume,
      duration: 150
    };
  }

  /**
   * Play sound effect
   */
  playSound(soundName) {
    // Check if user has enabled sounds (respect accessibility)
    if (!this.soundsEnabled) return;

    const sound = this.sounds[soundName];
    if (!sound) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      sound.frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(sound.volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration / 1000);

        oscillator.start(audioContext.currentTime + index * 0.05);
        oscillator.stop(audioContext.currentTime + sound.duration / 1000 + index * 0.05);
      });
    } catch {
      // Silently fail if Web Audio API is not supported
      console.debug('Web Audio API not available for sound effects');
    }
  }

  /**
   * Setup enhanced visual feedback
   */
  setupVisualFeedback() {
    // Add visual feedback for drag and drop zones
    this.setupDropZoneHighlighting();

    // Add keyboard navigation visual indicators
    this.setupKeyboardNavigation();

    // Add mana cost highlighting
    this.setupManaCostFeedback();
  }

  /**
   * Setup drop zone highlighting for better UX
   */
  setupDropZoneHighlighting() {
    const zones = document.querySelectorAll('.zone-content');

    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drop-target');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drop-target', 'invalid-drop');
      });

      zone.addEventListener('drop', () => {
        zone.classList.remove('drop-target', 'invalid-drop');
      });
    });
  }

  /**
   * Setup keyboard navigation indicators
   */
  setupKeyboardNavigation() {
    // Add focus indicators for keyboard users
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Setup mana cost visual feedback
   */
  setupManaCostFeedback() {
    // This would integrate with card playing to show mana availability
    // Will be enhanced when we implement proper mana cost checking
  }


  /**
   * Toggle sound effects on/off
   */
  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    localStorage.setItem('mtg-sounds-enabled', this.soundsEnabled.toString());

    // Update button appearance
    const soundButton = document.getElementById('soundToggle');
    if (soundButton) {
      if (this.soundsEnabled) {
        soundButton.classList.add('sounds-enabled');
        soundButton.textContent = '🔊 Sound';
        soundButton.title = 'Sound effects enabled - click to disable';
      } else {
        soundButton.classList.remove('sounds-enabled');
        soundButton.textContent = '🔇 Sound';
        soundButton.title = 'Sound effects disabled - click to enable';
      }
    }

    this.showToast(
      `Sound effects ${this.soundsEnabled ? 'enabled' : 'disabled'}`,
      this.soundsEnabled ? 'success' : 'info'
    );
  }

  /**
   * Initialize sound button state
   */
  initSoundButton() {
    const soundButton = document.getElementById('soundToggle');
    if (soundButton) {
      if (this.soundsEnabled) {
        soundButton.classList.add('sounds-enabled');
        soundButton.textContent = '🔊 Sound';
        soundButton.title = 'Sound effects enabled - click to disable';
      } else {
        soundButton.classList.remove('sounds-enabled');
        soundButton.textContent = '🔇 Sound';
        soundButton.title = 'Sound effects disabled - click to enable';
      }
    }
  }
}

// Initialize when DOM is loaded
let handSimulator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    handSimulator = new ModernHandSimulator();
    window.handSimulator = handSimulator; // Make available globally for onclick handlers
  });
} else {
  handSimulator = new ModernHandSimulator();
  window.handSimulator = handSimulator;
}