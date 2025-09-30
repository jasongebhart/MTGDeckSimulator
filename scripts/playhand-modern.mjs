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
    this.targetingMode = { active: false };

    // Double-Faced Card (DFC) Database (case-insensitive keys)
    this.dfcDatabase = {
      // Delver and similar upkeep triggers
      'delver of secrets': {
        frontFace: 'Delver Of Secrets',
        backFace: 'Insectile Aberration',
        transformTrigger: 'upkeep_reveal_instant_sorcery',
        canTransformBack: false
      },

      // Werewolves (Innistrad)
      'huntmaster of the fells': {
        frontFace: 'Huntmaster of the Fells',
        backFace: 'Ravager of the Fells',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'mayor of avabruck': {
        frontFace: 'Mayor of Avabruck',
        backFace: 'Howlpack Alpha',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'daybreak ranger': {
        frontFace: 'Daybreak Ranger',
        backFace: 'Nightfall Predator',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'village ironsmith': {
        frontFace: 'Village Ironsmith',
        backFace: 'Ironfang',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'kruin outlaw': {
        frontFace: 'Kruin Outlaw',
        backFace: 'Terror of Kruin Pass',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'tormented pariah': {
        frontFace: 'Tormented Pariah',
        backFace: 'Rampaging Werewolf',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'garruk relentless': {
        frontFace: 'Garruk Relentless',
        backFace: 'Garruk, the Veil-Cursed',
        transformTrigger: 'loyalty_2_or_less',
        canTransformBack: false
      },

      // Innistrad Horror/Transforms
      'civilized scholar': {
        frontFace: 'Civilized Scholar',
        backFace: 'Homicidal Brute',
        transformTrigger: 'discard_creature',
        canTransformBack: true
      },
      'ludevic\'s test subject': {
        frontFace: 'Ludevic\'s Test Subject',
        backFace: 'Ludevic\'s Abomination',
        transformTrigger: 'counter_based',
        canTransformBack: false
      },
      'chalice of life': {
        frontFace: 'Chalice of Life',
        backFace: 'Chalice of Death',
        transformTrigger: 'life_30_or_more',
        canTransformBack: false
      },

      // Eldritch Moon DFCs
      'thing in the ice': {
        frontFace: 'Thing in the Ice',
        backFace: 'Awoken Horror',
        transformTrigger: 'counter_removal',
        canTransformBack: false
      },
      'ulvenwald observer': {
        frontFace: 'Ulvenwald Observer',
        backFace: 'Ulvenwald Abomination',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },

      // Shadows over Innistrad DFCs
      'westvale abbey': {
        frontFace: 'Westvale Abbey',
        backFace: 'Ormendahl, Profane Prince',
        transformTrigger: 'sacrifice_five_creatures',
        canTransformBack: false
      },
      'hanweir battlements': {
        frontFace: 'Hanweir Battlements',
        backFace: 'Hanweir, the Writhing Township',
        transformTrigger: 'meld',
        canTransformBack: false
      },

      // Midnight Hunt/Crimson Vow DFCs
      'suspicious stowaway': {
        frontFace: 'Suspicious Stowaway',
        backFace: 'Seafaring Werewolf',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'village watch': {
        frontFace: 'Village Watch',
        backFace: 'Village Reavers',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'tovolar, dire overlord': {
        frontFace: 'Tovolar, Dire Overlord',
        backFace: 'Tovolar, the Midnight Scourge',
        transformTrigger: 'werewolf',
        canTransformBack: true
      },
      'arlinn, the pack\'s hope': {
        frontFace: 'Arlinn, the Pack\'s Hope',
        backFace: 'Arlinn, the Moon\'s Fury',
        transformTrigger: 'daybound_nightbound',
        canTransformBack: true
      },

      // Zendikar Rising MDFCs (Modal Double-Faced Cards)
      'valakut awakening': {
        frontFace: 'Valakut Awakening',
        backFace: 'Valakut Stoneforge',
        transformTrigger: 'mdfc',
        canTransformBack: false
      },
      'agadeem\'s awakening': {
        frontFace: 'Agadeem\'s Awakening',
        backFace: 'Agadeem, the Undercrypt',
        transformTrigger: 'mdfc',
        canTransformBack: false
      },
      'glasspool mimic': {
        frontFace: 'Glasspool Mimic',
        backFace: 'Glasspool Shore',
        transformTrigger: 'mdfc',
        canTransformBack: false
      }
      // Add more DFCs as needed
    };

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

    // Sorted hand order for keyboard shortcuts
    this.sortedHandOrder = [];
    this.sortedOpponentHandOrder = [];

    // Game action log
    this.gameLog = [];
    this.maxLogEntries = 50;

    // Undo/Redo system
    this.history = [];
    this.maxHistorySize = 20;
    this.historyIndex = -1;

    // Priority and Stack System
    this.stack = []; // Spells/abilities waiting to resolve
    this.priorityPlayer = 'player'; // Who currently has priority
    this.waitingForResponse = false; // True when waiting for opponent to respond
    this.pendingDamage = []; // Damage that needs to be applied

    // Turn Management System
    this.turnState = {
      activePlayer: 'player', // 'player' or 'opponent'
      phase: 'beginning', // 'beginning', 'main1', 'combat', 'main2', 'end'
      step: 'untap', // varies by phase
      priority: 'player', // who has priority
      turnNumber: 1,
      isFirstTurn: true
    };

    // Combat System
    this.combatState = {
      step: 'none', // 'beginning', 'declare-attackers', 'declare-blockers', 'combat-damage', 'end'
      attackers: [], // {cardId, playerId}
      blockers: [], // {attackerCardId, blockerCardId, playerId}
      combatDamage: [], // {cardId, damage, target}
      isSelectingAttackers: false,
      isSelectingBlockers: false
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
      deckName: 'No Deck',
      deckPath: null
    };

    this.activePlayer = 'player'; // 'player' or 'opponent'
    this.gameMode = 'local'; // 'local' or 'network' (future)
    this.turnPhase = 'setup'; // 'setup', 'playing', 'waiting-for-opponent'

    // Spell Stack System for responses
    this.spellStack = [];
    this.awaitingResponse = false;
    this.priorityPlayer = null; // Who has priority to respond
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

  async loadDefaultDeck() {
    // Always try to load opponent deck regardless of player deck status
    console.log('Scheduling opponent deck load in 1500ms...');
    setTimeout(() => {
      console.log('Timeout fired - calling loadDefaultOpponentDeckFromStorage');
      this.loadDefaultOpponentDeckFromStorage();
      this.updateOpponentDeckSelectorLabels();
    }, 1500);

    if (this.currentDeck) {
      this.setDebugStatus('Deck already loaded');
      return;
    }

    // First, try to load from localStorage (saved default deck)
    const savedDefault = localStorage.getItem('mtg_default_deck');
    if (savedDefault) {
      console.log('Loading saved default deck:', savedDefault);
      this.setDebugStatus(`Loading saved default: ${savedDefault.split('/').pop().replace('.xml', '')}`);
      try {
        await this.loadPredefinedDeck(savedDefault);
        return;
      } catch (error) {
        console.error('Failed to load saved default, trying selector:', error);
      }
    }

    // Fallback to deck selector or hardcoded default
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
    console.log('Deck selector elements:', { expandDeckSelector: !!expandDeckSelector, expandedDeckSelector: !!expandedDeckSelector });
    if (expandDeckSelector && expandedDeckSelector) {
      expandDeckSelector.addEventListener('click', () => {
        console.log('Deck selector clicked!');
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

  async loadDeck(deckPath, saveAsDefault = false) {
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

      // Save as default deck if requested
      if (saveAsDefault) {
        this.saveDefaultDeck(deckPath);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
      this.setDebugStatus(`Error: ${  error.message}`);
      this.showErrorState('Failed to load deck. Please try again.');
    }
  }

  saveDefaultDeck(deckPath) {
    localStorage.setItem('mtg_default_deck', deckPath);
    this.showToast('✓ Set as default deck', 'success');
    console.log('Default deck saved:', deckPath);
  }

  setCurrentDeckAsDefault() {
    console.log('setCurrentDeckAsDefault called, currentDeck:', this.currentDeck);
    if (!this.currentDeck || !this.currentDeck.source) {
      console.log('No deck loaded or no source');
      this.showToast('No deck loaded', 'warning');
      return;
    }
    console.log('Saving default deck:', this.currentDeck.source);
    this.saveDefaultDeck(this.currentDeck.source);

    // Update the deck selector to show the star
    this.updateDeckSelectorLabels();
  }

  async loadDefaultDeckFromStorage() {
    const defaultDeck = localStorage.getItem('mtg_default_deck');
    if (defaultDeck) {
      console.log('Loading default deck from storage:', defaultDeck);
      try {
        await this.loadDeck(defaultDeck);
        this.showToast(`Loaded default: ${this.currentDeck.name}`, 'info');
        return true;
      } catch (error) {
        console.error('Failed to load default deck:', error);
        this.showToast('Failed to load default deck', 'warning');
        return false;
      }
    }
    return false;
  }

  getDefaultDeckPath() {
    return localStorage.getItem('mtg_default_deck');
  }

  isDefaultDeck(deckPath) {
    const defaultDeck = localStorage.getItem('mtg_default_deck');
    return defaultDeck === deckPath;
  }

  clearDefaultDeck() {
    const hadDefault = localStorage.getItem('mtg_default_deck');
    localStorage.removeItem('mtg_default_deck');
    if (hadDefault) {
      this.showToast('Default deck cleared', 'info');
      // Remove star from all deck selector options
      const quickDeckSelect = document.getElementById('quickDeckSelect');
      if (quickDeckSelect) {
        Array.from(quickDeckSelect.options).forEach(option => {
          option.textContent = option.textContent.replace('⭐ ', '');
        });
      }
    } else {
      this.showToast('No default deck set', 'warning');
    }
  }

  // ===== OPPONENT DEFAULT DECK METHODS =====

  setOpponentDeckAsDefault() {
    console.log('=== setOpponentDeckAsDefault called ===');
    console.log('opponent object:', this.opponent);
    console.log('opponent.deckPath:', this.opponent.deckPath);
    console.log('opponent.deckName:', this.opponent.deckName);

    if (!this.opponent.deckPath) {
      console.log('No opponent deck loaded - deckPath is missing');
      this.showToast('No opponent deck loaded', 'warning');
      return;
    }

    console.log('Saving to localStorage:', this.opponent.deckPath);
    localStorage.setItem('mtg_default_opponent_deck', this.opponent.deckPath);

    // Verify it was saved
    const saved = localStorage.getItem('mtg_default_opponent_deck');
    console.log('Verified saved value:', saved);

    this.showToast(`✓ Set ${this.opponent.deckName} as default opponent deck`, 'success');
    console.log('Default opponent deck saved successfully');

    // Update the opponent deck selector to show the star
    this.updateOpponentDeckSelectorLabels();
  }

  async loadDefaultOpponentDeckFromStorage() {
    console.log('=== loadDefaultOpponentDeckFromStorage called ===');
    console.log('Current opponent state:', {
      deckName: this.opponent.deckName,
      deckPath: this.opponent.deckPath,
      librarySize: this.opponent.library?.length
    });

    const defaultDeck = localStorage.getItem('mtg_default_opponent_deck');
    console.log('Retrieved from localStorage:', defaultDeck);
    console.log('localStorage keys:', Object.keys(localStorage));

    if (defaultDeck) {
      console.log('Found default opponent deck, loading:', defaultDeck);
      try {
        await this.loadOpponentDeck(defaultDeck);
        console.log('Default opponent deck loaded successfully');
        console.log('After load - opponent state:', {
          deckName: this.opponent.deckName,
          deckPath: this.opponent.deckPath,
          librarySize: this.opponent.library?.length
        });
        return true;
      } catch (error) {
        console.error('Failed to load default opponent deck:', error);
        return false;
      }
    } else {
      console.log('No default opponent deck found in localStorage');
      console.log('All localStorage items:', localStorage);
    }
    return false;
  }

  clearDefaultOpponentDeck() {
    const hadDefault = localStorage.getItem('mtg_default_opponent_deck');
    localStorage.removeItem('mtg_default_opponent_deck');
    if (hadDefault) {
      this.showToast('Default opponent deck cleared', 'info');
      // Remove star from opponent deck selector options
      const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
      if (opponentDeckSelect) {
        Array.from(opponentDeckSelect.options).forEach(option => {
          option.textContent = option.textContent.replace('⭐ ', '');
        });
      }
    } else {
      this.showToast('No default opponent deck set', 'warning');
    }
  }

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

      // Check if this is the default deck
      const isDefault = this.isDefaultDeck(source);

      // Show success message with default indicator
      const message = isDefault
        ? `Loaded deck: ${this.currentDeck.name} ⭐ (Default)`
        : `Loaded deck: ${this.currentDeck.name}`;
      this.showToast(message, 'success');

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

    // Only reset opponent state if no opponent deck is loaded
    // This prevents losing opponent data during two-player setup
    if (!this.opponent.currentDeck) {
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

    this.activePlayer = 'player';
  }

  // Enhanced player switching functions
  switchToPlayer() {
    if (this.activePlayer === 'player') {
      this.showToast('Already controlling Player', 'info');
      return;
    }

    this.activePlayer = 'player';
    this.updatePlayerContextUI();
    this.updateUI();
    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateActivePlayerView();
    this.playSound?.('success');
    this.showToast('Now controlling: Player', 'success');
  }

  switchToOpponent() {
    console.log('=== switchToOpponent method called ===');
    console.log('Current activePlayer:', this.activePlayer);

    if (this.activePlayer === 'opponent') {
      console.log('Already controlling opponent, but updating display...');
      this.showToast('Already controlling Opponent', 'info');
      // Update displays but keep both hands visible
      this.updateActivePlayerView();
      return;
    }

    this.activePlayer = 'opponent';
    console.log('Active player set to:', this.activePlayer);
    console.log('Opponent hand:', this.opponent.hand);
    console.log('Opponent hand count:', this.opponent.hand.length);

    this.updatePlayerContextUI();
    this.updateUI();

    // Update active player view - this will keep both hands visible
    console.log('About to call updateActivePlayerView...');
    this.updateActivePlayerView();

    this.playSound?.('success');
    this.showToast('Now controlling: Opponent', 'warning');
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

    // ALWAYS keep both hands visible for playtesting
    // Update player hand
    this.updateZoneDisplay('handContainer', this.hand);
    this.updateZoneDisplay('handContainer2', this.hand);

    // Update opponent hand separately
    const opponentContainer = document.getElementById('opponentHandContainer2');
    if (opponentContainer) {
      this.updateZoneDisplay('opponentHandContainer2', this.opponent.hand);
    }

    // Update battlefields
    this.updateBattlefieldDisplay();
    this.updateOpponentBattlefieldDisplay();
  }

  updateOpponentBattlefieldDisplayDetailed() {
    // When controlling opponent, show their battlefield cards in main interactive areas
    if (this.activePlayer === 'opponent') {
      console.log('Updating detailed opponent battlefield display');
      console.log('Opponent battlefield:', this.opponent.battlefield);

      // Show opponent battlefield cards in the main battlefield containers for interaction
      this.updateZoneDisplay('battlefieldLands', this.opponent.battlefield.lands);
      this.updateZoneDisplay('battlefieldCreatures', this.opponent.battlefield.creatures);
      this.updateZoneDisplay('battlefieldOthers', this.opponent.battlefield.others);

      // Also update the dedicated opponent containers
      this.updateOpponentBattlefieldDisplay();
    }
  }

  updateOpponentHandDisplayDetailed() {
    // In two-player mode, opponent hand always stays in opponentHandContainer2
    // Never overwrite the player's hand containers
    console.log('=== updateOpponentHandDisplayDetailed ===');
    console.log('Active player:', this.activePlayer);
    console.log('Opponent hand length:', this.opponent.hand.length);

    // Only update the opponent's dedicated container
    console.log('Calling updateZoneDisplay for opponentHandContainer2...');
    this.updateZoneDisplay('opponentHandContainer2', this.opponent.hand);
  }

  shuffleLibrary() {
    for (let i = this.library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.library[i], this.library[j]] = [this.library[j], this.library[i]];
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Prevent shortcuts when typing in inputs or in modals
      if (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          document.getElementById('delverRevealModal')) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // Ctrl/Cmd shortcuts
      if (ctrl) {
        switch (key) {
          case 'z':
            event.preventDefault();
            this.undo();
            break;
          case 's':
            event.preventDefault();
            console.log('Ctrl+S pressed - saving game state');
            this.saveGameState();
            break;
          case 'l':
            event.preventDefault();
            this.loadGameState();
            break;
          case 'n':
            event.preventDefault();
            this.resetGame();
            break;
          case 'd':
            if (shift) {
              // Ctrl+Shift+D - Set current deck as default
              event.preventDefault();
              console.log('Ctrl+Shift+D pressed - setting default deck');
              this.setCurrentDeckAsDefault();
            } else {
              // Ctrl+D - Clear default deck
              event.preventDefault();
              this.clearDefaultDeck();
            }
            break;
          case 'o':
            if (shift) {
              // Ctrl+Shift+O - Set opponent deck as default
              event.preventDefault();
              console.log('Ctrl+Shift+O pressed - setting default opponent deck');
              this.setOpponentDeckAsDefault();
            } else {
              // Ctrl+O - Clear default opponent deck
              event.preventDefault();
              this.clearDefaultOpponentDeck();
            }
            break;
          default:
            return;
        }
        return;
      }

      // Regular shortcuts
      switch (key) {
        case ' ':
          event.preventDefault();
          console.log('Spacebar pressed - advancing phase/turn');
          console.log('Current turn state:', this.turnState);
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
        case 'u':
          event.preventDefault();
          this.untapAll();
          break;
        case 't':
          event.preventDefault();
          this.nextTurn();
          break;
        case 'g':
          event.preventDefault();
          this.showSimpleModal('graveyard', this.graveyard, '🪦 Graveyard');
          break;
        case 'x':
          event.preventDefault();
          this.showSimpleModal('exile', this.exile, '🚫 Exile');
          break;
        case 'l':
          event.preventDefault();
          this.showLibraryModal();
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
        case 'c':
          event.preventDefault();
          this.jumpToCombat();
          break;
        case 'e':
          event.preventDefault();
          this.endTurnImmediately();
          break;
        case 'escape':
          this.hideKeyboardHelp();
          this.closeFetchlandQuickSelect();
          break;
        case 'f':
          // Quick fetchland activation for most recent fetchland
          event.preventDefault();
          this.activateLastFetchland();
          break;
        case 's':
          if (shift) {
            event.preventDefault();
            this.switchPlayer();
          }
          break;
        case 'r':
          event.preventDefault();
          this.shuffleLibrary();
          this.showToast('Library shuffled', 'info');
          break;
        case 'a':
          event.preventDefault();
          this.showDeckAnalytics();
          break;
      }
    });
  }

  advancePhaseOrTurn() {
    const currentPhase = this.turnState.phase;
    const currentStep = this.turnState.step;

    console.log('advancePhaseOrTurn called with:', currentPhase, currentStep);

    // If in end phase cleanup step, advance to next turn
    if (currentPhase === 'end' && currentStep === 'cleanup') {
      console.log('Advancing to next turn');
      this.nextTurn();
    } else {
      console.log('Advancing to next phase');
      this.advancePhase();
    }

    console.log('New turn state after advancement:', this.turnState);
    this.showToast(`${this.turnState.phase} phase`);
  }

  playCardFromHand(index) {
    const currentPlayer = this.getCurrentPlayer();

    // Use sorted hand order for keyboard shortcuts
    const sortedHand = this.activePlayer === 'player' ? this.sortedHandOrder : this.sortedOpponentHandOrder;

    if (index >= 0 && index < sortedHand.length) {
      const card = sortedHand[index];

      // Find the card in the actual hand array to remove it
      const handArray = currentPlayer.hand;
      const actualIndex = handArray.findIndex(c => c.id === card.id);
      if (actualIndex === -1) {
        console.error('Card not found in actual hand:', card);
        return;
      }
      console.log('Playing card:', card);
      console.log('Card type_line:', card.type_line);
      console.log('Card type:', card.type);

      // Log the card play
      this.logAction(`Played ${card.name}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);

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
            <h4>⚡ Quick Actions</h4>
            <div class="shortcut-item">
              <kbd>Ctrl+Z</kbd>
              <span>Undo Last Action</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+S</kbd>
              <span>Save Game State</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+Shift+D</kbd>
              <span>Set Current Deck as Default</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+L</kbd>
              <span>Load Game State</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+D</kbd>
              <span>Clear Default Deck</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+Shift+O</kbd>
              <span>Set Opponent Deck as Default</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+O</kbd>
              <span>Clear Default Opponent Deck</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl+N</kbd>
              <span>New Game / Reset</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>Game Control</h4>
            <div class="shortcut-item">
              <kbd>Space</kbd>
              <span>Advance Phase/End Turn</span>
            </div>
            <div class="shortcut-item">
              <kbd>T</kbd>
              <span>Next Turn</span>
            </div>
            <div class="shortcut-item">
              <kbd>D</kbd>
              <span>Draw Card</span>
            </div>
            <div class="shortcut-item">
              <kbd>M</kbd>
              <span>Mulligan</span>
            </div>
            <div class="shortcut-item">
              <kbd>U</kbd>
              <span>Untap All</span>
            </div>
            <div class="shortcut-item">
              <kbd>R</kbd>
              <span>Shuffle Library</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>View Zones</h4>
            <div class="shortcut-item">
              <kbd>G</kbd>
              <span>View Graveyard</span>
            </div>
            <div class="shortcut-item">
              <kbd>X</kbd>
              <span>View Exile</span>
            </div>
            <div class="shortcut-item">
              <kbd>L</kbd>
              <span>View Library</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>Play Cards</h4>
            <div class="shortcut-item">
              <kbd>1-9</kbd>
              <span>Play numbered card from hand</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>Advanced Actions</h4>
            <div class="shortcut-item">
              <kbd>C</kbd>
              <span>Jump to Combat Phase</span>
            </div>
            <div class="shortcut-item">
              <kbd>E</kbd>
              <span>End Turn Immediately</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+S</kbd>
              <span>Switch Player Control</span>
            </div>
            <div class="shortcut-item">
              <kbd>A</kbd>
              <span>View Deck Analytics</span>
            </div>
          </div>
          <div class="shortcut-section">
            <h4>🏞️ Fetchland Shortcuts</h4>
            <div class="shortcut-item">
              <kbd>F</kbd>
              <span>Activate most recent fetchland</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+P</kbd>
              <span>Quick fetch Plains</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+I</kbd>
              <span>Quick fetch Island</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+S</kbd>
              <span>Quick fetch Swamp</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+M</kbd>
              <span>Quick fetch Mountain</span>
            </div>
            <div class="shortcut-item">
              <kbd>Shift+F</kbd>
              <span>Quick fetch Forest</span>
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
              <span>Close help / Cancel fetchland</span>
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

    // Update all deck selector options to show default indicator
    this.updateDeckSelectorLabels();

    console.log('Deck selected:', deckPath);
  }

  updateDeckSelectorLabels() {
    const defaultDeck = localStorage.getItem('mtg_default_deck');
    if (!defaultDeck) return;

    // Update main deck selector
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      Array.from(quickDeckSelect.options).forEach(option => {
        if (option.value === defaultDeck) {
          // Add star indicator if not already there
          if (!option.textContent.includes('⭐')) {
            option.textContent = `⭐ ${option.textContent}`;
          }
        } else {
          // Remove star indicator if present
          option.textContent = option.textContent.replace('⭐ ', '');
        }
      });
    }
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
    console.log('Active player:', this.activePlayer);

    // Use active player's data
    if (this.activePlayer === 'opponent') {
      return this.drawOpponentHand(7);
    }

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
    console.log('Turn active player:', this.turnState.activePlayer);
    console.log('Viewing player:', this.activePlayer);

    // Use turnState.activePlayer to determine whose turn it is (not this.activePlayer which is for viewing)
    const turnPlayer = this.turnState.activePlayer;
    const library = turnPlayer === 'player' ? this.library : this.opponent.library;
    const hand = turnPlayer === 'player' ? this.hand : this.opponent.hand;
    const gameStats = turnPlayer === 'player' ? this.gameStats : this.opponent.gameStats;

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

    // Log the manual draw
    this.logAction(`Drew ${card.name}`, turnPlayer === 'player' ? 'You' : 'Opponent', false);

    if (showAnimation) {
      // Update the appropriate hand display based on whose turn it is
      if (turnPlayer === 'player') {
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

      const playerName = turnPlayer === 'player' ? 'You' : 'Opponent';
      this.showToast(`${playerName} drew ${card.name}`, 'info');
    }

    this.updateUI();
  }

  mulligan() {
    if (this.hand.length === 0) {
      this.showToast('No cards in hand to mulligan', 'warning');
      return;
    }

    // Save state before mulligan
    this.saveHistoryState('mulligan');

    // Put cards back in library
    this.library.push(...this.hand);
    this.shuffleArray(this.library);

    this.gameStats.mulligans++;
    this.drawHand();

    this.showToast(`Mulligan ${this.gameStats.mulligans}`, 'info');
  }

  redrawHand() {
    // Redraw 7 cards without mulligan penalty
    if (this.library.length === 0) {
      this.showToast('Library is empty. Cannot redraw cards.', 'warning');
      return;
    }

    // Put cards back in library
    this.library.push(...this.hand);
    this.shuffleArray(this.library);

    // Clear current hand
    this.hand = [];
    this.selectedCards.clear();

    // Draw 7 cards (ignore mulligan count)
    const handSize = Math.min(7, this.library.length);
    for (let i = 0; i < handSize; i++) {
      this.drawCard(false);
    }

    this.updateHandDisplay();
    this.showToast(`Redrew ${handSize} cards (no penalty)`, 'success');
  }

  redrawOpponentHand() {
    // Redraw 7 cards for opponent without mulligan penalty
    if (!this.opponent.library || this.opponent.library.length === 0) {
      this.showToast('Opponent has no deck loaded', 'warning');
      return;
    }

    // Put cards back in library
    this.opponent.library.push(...this.opponent.hand);
    this.shuffleOpponentLibrary();

    // Draw 7 cards (ignore mulligan count)
    this.drawOpponentHand(7);
    this.showToast('Opponent redrew 7 cards (no penalty)', 'success');
  }

  // ===== SPELL STACK SYSTEM =====

  castSpellWithResponse(spellConfig) {
    // Add spell to stack
    const spell = {
      id: `spell_${Date.now()}`,
      name: spellConfig.source,
      type: spellConfig.type,
      caster: this.activePlayer,
      target: null,
      targetId: null,
      config: spellConfig,
      timestamp: Date.now()
    };

    this.spellStack.push(spell);
    this.updateStackDisplay();

    // Give priority to opponent
    const opponent = this.activePlayer === 'player' ? 'opponent' : 'player';
    this.priorityPlayer = opponent;
    this.awaitingResponse = true;

    this.showResponseUI(spell);
    this.showToast(`${spell.name} on the stack - ${opponent} may respond`, 'info');
  }

  addSpellToStack(spellName, type, caster, targetId, config) {
    const spell = {
      id: `spell_${Date.now()}`,
      name: spellName,
      type: type,
      caster: caster,
      target: null,
      targetId: targetId,
      config: config,
      timestamp: Date.now()
    };

    this.spellStack.push(spell);
    this.updateStackDisplay();

    // Give priority to the other player
    const opponent = caster === 'player' ? 'opponent' : 'player';
    this.priorityPlayer = opponent;
    this.awaitingResponse = true;

    this.showResponseUI(spell);
    return spell;
  }

  passResponse() {
    if (!this.awaitingResponse) return;

    // Switch priority back to original caster
    const topSpell = this.spellStack[this.spellStack.length - 1];
    if (topSpell.caster === this.priorityPlayer) {
      // Both players passed - resolve the stack
      this.resolveStack();
    } else {
      // Give priority back to caster
      this.priorityPlayer = topSpell.caster;
      this.showToast(`${this.priorityPlayer} has priority`, 'info');
      // If both passed, resolve
      if (!this.awaitingResponse) {
        this.resolveStack();
      }
    }
  }

  respondToSpell(responseSpellName, responseType, targetId) {
    // Add response spell to stack
    const responseSpell = {
      id: `spell_${Date.now()}`,
      name: responseSpellName,
      type: responseType,
      caster: this.priorityPlayer,
      target: null,
      targetId: targetId,
      isResponse: true,
      timestamp: Date.now()
    };

    this.spellStack.push(responseSpell);
    this.updateStackDisplay();

    // Give priority back to other player
    const opponent = this.priorityPlayer === 'player' ? 'opponent' : 'player';
    this.priorityPlayer = opponent;

    this.showResponseUI(responseSpell);
    this.showToast(`${responseSpellName} added to stack - ${opponent} may respond`, 'info');
  }

  resolveStack() {
    if (this.spellStack.length === 0) {
      this.awaitingResponse = false;
      this.hideResponseUI();
      return;
    }

    // Resolve spells in LIFO order (last in, first out)
    const spell = this.spellStack.pop();
    this.updateStackDisplay();

    this.showToast(`Resolving ${spell.name}...`, 'info');

    // Execute the spell effect
    if (spell.type === 'counter') {
      // Counter the next spell on the stack
      if (this.spellStack.length > 0) {
        const counteredSpell = this.spellStack.pop();
        this.showToast(`${spell.name} counters ${counteredSpell.name}`, 'success');
        this.updateStackDisplay();
      } else {
        this.showToast(`${spell.name} fizzles (no target)`, 'warning');
      }
    } else if (spell.targetId) {
      // Execute targeted spell
      this.executeSpellEffect(spell);
    }

    // Continue resolving if there are more spells
    setTimeout(() => {
      if (this.spellStack.length > 0) {
        this.resolveStack();
      } else {
        this.awaitingResponse = false;
        this.hideResponseUI();
        this.showToast('Stack empty', 'info');
      }
    }, 1000);
  }

  executeSpellEffect(spell) {
    const config = spell.config;
    if (!config) return;

    // Use existing executeTargeting logic
    switch (config.type) {
      case 'damage':
        this.dealDamageToCreature(spell.targetId, config.damage, config.source);
        break;
      case 'destroy':
        this.destroyPermanent(spell.targetId, config.source);
        break;
      case 'exile':
        this.exilePermanent(spell.targetId, config.source);
        break;
      case 'bounce':
        this.bouncePermanent(spell.targetId, config.source);
        break;
    }
  }

  showResponseUI(spell) {
    let responseUI = document.getElementById('responseUI');
    if (!responseUI) {
      responseUI = document.createElement('div');
      responseUI.id = 'responseUI';
      responseUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-primary);
        border: 3px solid #ffa502;
        border-radius: var(--border-radius);
        padding: 2rem;
        z-index: 10000;
        box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        min-width: 400px;
      `;
      document.body.appendChild(responseUI);
    }

    const casterName = spell.caster === 'player' ? 'You' : 'Opponent';
    const responderName = this.priorityPlayer === 'player' ? 'You' : 'Opponent';

    responseUI.innerHTML = `
      <div style="text-align: center;">
        <h3 style="color: #ffa502; margin-bottom: 1rem;">⚡ Spell on the Stack</h3>
        <div style="margin-bottom: 1.5rem;">
          <strong>${casterName}</strong> cast <strong style="color: #e74c3c;">${spell.name}</strong>
        </div>
        <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 4px;">
          <div style="font-size: 0.9rem; color: var(--text-muted);">Stack (${this.spellStack.length} spells):</div>
          ${this.spellStack.map((s, i) => `
            <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px;">
              ${i + 1}. ${s.name} <span style="color: var(--text-muted);">(${s.caster})</span>
            </div>
          `).join('')}
        </div>
        <div style="font-weight: bold; margin-bottom: 1.5rem;">
          ${responderName} have priority - respond or pass?
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.handSimulator.counterSpell()"
                  style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
            ❌ Counterspell
          </button>
          <button onclick="window.handSimulator.castResponseSpell()"
                  style="background: #9b59b6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
            ⚡ Cast Response
          </button>
          <button onclick="window.handSimulator.passResponse()"
                  style="background: #27ae60; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
            ✓ Pass Priority
          </button>
        </div>
      </div>
    `;
  }

  hideResponseUI() {
    const responseUI = document.getElementById('responseUI');
    if (responseUI) {
      responseUI.remove();
    }
  }

  updateStackDisplay() {
    // Update the response UI if it exists
    if (this.spellStack.length > 0 && document.getElementById('responseUI')) {
      const topSpell = this.spellStack[this.spellStack.length - 1];
      this.showResponseUI(topSpell);
    }
  }

  counterSpell() {
    // Add counterspell to stack
    this.respondToSpell('Counterspell', 'counter', null);
  }

  castResponseSpell() {
    // Close response UI and enable targeting for response spell
    this.hideResponseUI();
    this.showToast('Select a response spell from the targeting controls', 'info');
    // The player can then click one of the spell buttons to cast in response
  }

  // ===== UNDO/REDO SYSTEM =====

  saveHistoryState(actionName = 'action') {
    // Create a snapshot of the current game state
    const state = {
      actionName,
      timestamp: Date.now(),
      library: JSON.parse(JSON.stringify(this.library)),
      hand: JSON.parse(JSON.stringify(this.hand)),
      battlefield: JSON.parse(JSON.stringify(this.battlefield)),
      graveyard: JSON.parse(JSON.stringify(this.graveyard)),
      exile: JSON.parse(JSON.stringify(this.exile)),
      gameStats: JSON.parse(JSON.stringify(this.gameStats)),
      manaPool: JSON.parse(JSON.stringify(this.manaPool)),
      turnState: JSON.parse(JSON.stringify(this.turnState)),
      opponent: {
        hand: JSON.parse(JSON.stringify(this.opponent.hand)),
        battlefield: JSON.parse(JSON.stringify(this.opponent.battlefield)),
        graveyard: JSON.parse(JSON.stringify(this.opponent.graveyard)),
        exile: JSON.parse(JSON.stringify(this.opponent.exile)),
        gameStats: JSON.parse(JSON.stringify(this.opponent.gameStats)),
        manaPool: JSON.parse(JSON.stringify(this.opponent.manaPool))
      },
      activePlayer: this.activePlayer
    };

    // Remove any states after current index (for redo)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state
    this.history.push(state);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    console.log(`Saved history state: ${actionName} (${this.historyIndex + 1}/${this.history.length})`);
  }

  undo() {
    if (this.historyIndex < 0) {
      this.showToast('Nothing to undo', 'warning');
      return;
    }

    const state = this.history[this.historyIndex];
    this.restoreState(state);
    this.historyIndex--;

    this.showToast(`Undo: ${state.actionName}`, 'info');
    console.log(`Undone action: ${state.actionName} (now at ${this.historyIndex + 1}/${this.history.length})`);
  }

  restoreState(state) {
    // Restore game state from snapshot
    this.library = JSON.parse(JSON.stringify(state.library));
    this.hand = JSON.parse(JSON.stringify(state.hand));
    this.battlefield = JSON.parse(JSON.stringify(state.battlefield));
    this.graveyard = JSON.parse(JSON.stringify(state.graveyard));
    this.exile = JSON.parse(JSON.stringify(state.exile));
    this.gameStats = JSON.parse(JSON.stringify(state.gameStats));
    this.manaPool = JSON.parse(JSON.stringify(state.manaPool));
    this.turnState = JSON.parse(JSON.stringify(state.turnState));
    this.activePlayer = state.activePlayer;

    // Restore opponent state
    this.opponent.hand = JSON.parse(JSON.stringify(state.opponent.hand));
    this.opponent.battlefield = JSON.parse(JSON.stringify(state.opponent.battlefield));
    this.opponent.graveyard = JSON.parse(JSON.stringify(state.opponent.graveyard));
    this.opponent.exile = JSON.parse(JSON.stringify(state.opponent.exile));
    this.opponent.gameStats = JSON.parse(JSON.stringify(state.opponent.gameStats));
    this.opponent.manaPool = JSON.parse(JSON.stringify(state.opponent.manaPool));

    // Update all displays
    this.updateAllDisplays();
    this.updateUI();
  }

  // ===== SAVE/LOAD GAME STATE =====

  saveGameState() {
    const saveData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      deckName: this.currentDeck?.name || 'Unknown Deck',
      gameState: {
        library: this.library,
        hand: this.hand,
        battlefield: this.battlefield,
        graveyard: this.graveyard,
        exile: this.exile,
        gameStats: this.gameStats,
        manaPool: this.manaPool,
        turnState: this.turnState,
        activePlayer: this.activePlayer,
        opponent: {
          hand: this.opponent.hand,
          battlefield: this.opponent.battlefield,
          graveyard: this.opponent.graveyard,
          exile: this.opponent.exile,
          gameStats: this.opponent.gameStats,
          manaPool: this.opponent.manaPool,
          library: this.opponent.library
        },
        gameLog: this.gameLog.slice(-20) // Save last 20 log entries
      }
    };

    // Save to localStorage
    const saveKey = `mtg_save_${Date.now()}`;
    localStorage.setItem(saveKey, JSON.stringify(saveData));
    localStorage.setItem('mtg_last_save', saveKey);

    // Also allow download as JSON
    this.downloadGameState(saveData);

    this.showToast('Game saved successfully', 'success');
    console.log('Game state saved:', saveKey);
  }

  loadGameState() {
    // Try to load from localStorage
    const lastSaveKey = localStorage.getItem('mtg_last_save');
    if (!lastSaveKey) {
      this.showToast('No saved game found', 'warning');
      this.showLoadGameDialog();
      return;
    }

    const saveData = JSON.parse(localStorage.getItem(lastSaveKey));
    if (!saveData) {
      this.showToast('Failed to load saved game', 'error');
      return;
    }

    this.restoreGameState(saveData);
    this.showToast(`Game loaded: ${saveData.deckName}`, 'success');
  }

  restoreGameState(saveData) {
    const state = saveData.gameState;

    // Restore all game state
    this.library = state.library;
    this.hand = state.hand;
    this.battlefield = state.battlefield;
    this.graveyard = state.graveyard;
    this.exile = state.exile;
    this.gameStats = state.gameStats;
    this.manaPool = state.manaPool;
    this.turnState = state.turnState;
    this.activePlayer = state.activePlayer;

    // Restore opponent
    this.opponent.hand = state.opponent.hand;
    this.opponent.battlefield = state.opponent.battlefield;
    this.opponent.graveyard = state.opponent.graveyard;
    this.opponent.exile = state.opponent.exile;
    this.opponent.gameStats = state.opponent.gameStats;
    this.opponent.manaPool = state.opponent.manaPool;
    this.opponent.library = state.opponent.library || [];

    // Restore game log
    this.gameLog = state.gameLog || [];

    // Update all displays
    this.updateAllDisplays();
    this.updateUI();

    console.log('Game state restored:', saveData.timestamp);
  }

  downloadGameState(saveData) {
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mtg-save-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  showLoadGameDialog() {
    // Create a simple file input dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const saveData = JSON.parse(event.target.result);
          this.restoreGameState(saveData);
          this.showToast(`Game loaded: ${saveData.deckName}`, 'success');
        } catch (error) {
          this.showToast('Failed to load game file', 'error');
          console.error('Load error:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ===== DECK STATISTICS & ANALYSIS =====

  showDeckAnalytics() {
    const stats = this.calculateDeckStatistics();

    const modal = document.createElement('div');
    modal.id = 'deckAnalyticsModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="
        background: var(--bg-primary);
        border: 2px solid var(--accent-color);
        border-radius: 12px;
        padding: 2rem;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; color: var(--text-primary); font-size: 1.5rem;">
            📊 Deck Analytics
          </h2>
          <button
            onclick="document.getElementById('deckAnalyticsModal').remove()"
            style="
              background: transparent;
              border: none;
              font-size: 2rem;
              cursor: pointer;
              color: var(--text-secondary);
              line-height: 1;
              padding: 0;
              width: 32px;
              height: 32px;
            ">×</button>
        </div>

        <!-- Game Stats -->
        <div style="
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        ">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--accent-color);">
            Game Progress
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            <div>
              <div style="color: var(--text-secondary); font-size: 0.85rem;">Turn</div>
              <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${stats.currentTurn}</div>
            </div>
            <div>
              <div style="color: var(--text-secondary); font-size: 0.85rem;">Cards Drawn</div>
              <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${stats.cardsDrawn}</div>
            </div>
            <div>
              <div style="color: var(--text-secondary); font-size: 0.85rem;">Lands Played</div>
              <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${stats.landsPlayed}</div>
            </div>
            <div>
              <div style="color: var(--text-secondary); font-size: 0.85rem;">Spells Cast</div>
              <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${stats.spellsCast}</div>
            </div>
          </div>
        </div>

        <!-- Library Stats -->
        <div style="
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        ">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--accent-color);">
            Library Composition
          </h3>
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>Cards Remaining</span>
              <strong>${stats.library.total}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>🏞️ Lands</span>
              <strong>${stats.library.lands} (${stats.library.landPercent}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>⚡ Spells</span>
              <strong>${stats.library.spells} (${stats.library.spellPercent}%)</strong>
            </div>
          </div>
          <div style="
            height: 24px;
            background: var(--bg-tertiary);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
          ">
            <div style="
              width: ${stats.library.landPercent}%;
              background: linear-gradient(90deg, #10b981, #059669);
              transition: width 0.3s ease;
            "></div>
            <div style="
              width: ${stats.library.spellPercent}%;
              background: linear-gradient(90deg, #3b82f6, #2563eb);
              transition: width 0.3s ease;
            "></div>
          </div>
        </div>

        <!-- Mana Curve -->
        <div style="
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        ">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--accent-color);">
            Mana Curve (Library)
          </h3>
          ${this.renderManaCurve(stats.manaCurve)}
        </div>

        <!-- Zones -->
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        ">
          <div style="
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
          ">
            <div style="font-size: 1.75rem; margin-bottom: 0.25rem;">✋</div>
            <div style="font-size: 1.25rem; font-weight: bold;">${stats.hand}</div>
            <div style="color: var(--text-secondary); font-size: 0.8rem;">Hand</div>
          </div>
          <div style="
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
          ">
            <div style="font-size: 1.75rem; margin-bottom: 0.25rem;">⚔️</div>
            <div style="font-size: 1.25rem; font-weight: bold;">${stats.battlefield}</div>
            <div style="color: var(--text-secondary); font-size: 0.8rem;">Battlefield</div>
          </div>
          <div style="
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
          ">
            <div style="font-size: 1.75rem; margin-bottom: 0.25rem;">🪦</div>
            <div style="font-size: 1.25rem; font-weight: bold;">${stats.graveyard}</div>
            <div style="color: var(--text-secondary); font-size: 0.8rem;">Graveyard</div>
          </div>
          <div style="
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
          ">
            <div style="font-size: 1.75rem; margin-bottom: 0.25rem;">🚫</div>
            <div style="font-size: 1.25rem; font-weight: bold;">${stats.exile}</div>
            <div style="color: var(--text-secondary); font-size: 0.8rem;">Exile</div>
          </div>
        </div>

        <div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem;">
          Press <kbd style="padding: 2px 6px; background: var(--bg-tertiary); border-radius: 3px;">Esc</kbd> to close
        </div>
      </div>
    `;

    // Close on Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    });

    document.body.appendChild(modal);
  }

  calculateDeckStatistics() {
    const library = this.library;
    const lands = library.filter(card =>
      (card.type || '').toLowerCase().includes('land')
    );
    const spells = library.filter(card =>
      !(card.type || '').toLowerCase().includes('land')
    );

    // Calculate mana curve for spells in library
    const manaCurve = {};
    for (let i = 0; i <= 7; i++) manaCurve[i] = 0;
    manaCurve['7+'] = 0;

    library.forEach(card => {
      if ((card.type || '').toLowerCase().includes('land')) return;

      const cmc = this.calculateCMC(card.cost || '');
      if (cmc >= 7) {
        manaCurve['7+']++;
      } else {
        manaCurve[cmc]++;
      }
    });

    return {
      currentTurn: this.turnState.turnNumber,
      cardsDrawn: this.gameStats.cardsDrawn,
      landsPlayed: this.gameStats.landsPlayed,
      spellsCast: this.gameStats.spellsCast,
      library: {
        total: library.length,
        lands: lands.length,
        spells: spells.length,
        landPercent: library.length > 0 ? Math.round((lands.length / library.length) * 100) : 0,
        spellPercent: library.length > 0 ? Math.round((spells.length / library.length) * 100) : 0
      },
      manaCurve,
      hand: this.hand.length,
      battlefield: this.battlefield.lands.length + this.battlefield.creatures.length + this.battlefield.others.length,
      graveyard: this.graveyard.length,
      exile: this.exile.length
    };
  }

  renderManaCurve(manaCurve) {
    const maxCount = Math.max(...Object.values(manaCurve));
    const bars = [];

    for (let i = 0; i <= 7; i++) {
      const key = i === 7 ? '7+' : i;
      const count = manaCurve[key] || 0;
      const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

      bars.push(`
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">
            ${count}
          </div>
          <div style="
            width: 100%;
            height: 80px;
            background: var(--bg-tertiary);
            border-radius: 4px 4px 0 0;
            position: relative;
            display: flex;
            align-items: flex-end;
          ">
            <div style="
              width: 100%;
              height: ${heightPercent}%;
              background: linear-gradient(180deg, #3b82f6, #2563eb);
              border-radius: 4px 4px 0 0;
              transition: height 0.3s ease;
            "></div>
          </div>
          <div style="
            color: var(--text-primary);
            font-weight: bold;
            font-size: 0.85rem;
            margin-top: 0.25rem;
          ">${key}</div>
        </div>
      `);
    }

    return `
      <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
        ${bars.join('')}
      </div>
    `;
  }

  // Turn Management System
  endTurn() {
    console.log('endTurn called - advancing to next turn');

    // Clear mana pool for current player
    this.clearManaForActivePlayer();

    // Pass to opponent
    this.turnState.activePlayer = this.turnState.activePlayer === 'player' ? 'opponent' : 'player';
    this.activePlayer = this.turnState.activePlayer; // Keep activePlayer in sync

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

    // Log turn beginning BEFORE executing steps
    const playerName = this.turnState.activePlayer === 'player' ? 'Your' : 'Opponent\'s';
    this.logAction(`Turn ${this.turnState.turnNumber} begins`, this.turnState.activePlayer === 'player' ? 'You' : 'Opponent', true);

    // Execute beginning phase automatically
    this.executeBeginningPhase();

    // Reset lands played for new turn
    this.gameStats.landsPlayedThisTurn = 0;

    // Update UI with player context
    this.updatePlayerContextUI();
    this.updateUI();
    this.updateTurnDisplay();

    this.showToast(`${playerName} Turn ${this.turnState.turnNumber} - ${this.formatPhaseStep()}`, 'info');
  }

  executeBeginningPhase() {
    console.log('Executing beginning phase');

    // Untap Step
    this.turnState.step = 'untap';
    this.logAction('Untap step', this.turnState.activePlayer === 'player' ? 'You' : 'Opponent', true);
    this.executeUntapStep();

    // Upkeep Step
    this.turnState.step = 'upkeep';
    this.logAction('Upkeep step', this.turnState.activePlayer === 'player' ? 'You' : 'Opponent', true);
    this.executeUpkeepStep();

    // Draw Step (manual - no auto-draw to allow for upkeep triggers like Delver)
    this.turnState.step = 'draw';
    this.logAction('Draw step - use Draw Card button when ready', this.turnState.activePlayer === 'player' ? 'You' : 'Opponent', true);
    // Auto-draw disabled to allow upkeep trigger handling
    // if (!this.turnState.isFirstTurn) {
    //   this.executeDrawStep();
    // } else {
    //   this.logAction('No card drawn (first turn)', this.turnState.activePlayer === 'player' ? 'You' : 'Opponent', true);
    // }

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

  executeUpkeepStep() {
    console.log('Upkeep step - checking for upkeep triggers');

    // Check for Delver of Secrets triggers
    this.checkDelverTriggers();
  }

  checkDelverTriggers() {
    const activePlayer = this.activePlayer === 'player' ? this : this.opponent;
    const battlefield = activePlayer.battlefield;

    // Find all Delver of Secrets on battlefield (not transformed)
    const delvers = battlefield.creatures.filter(card => {
      const cardName = (card.name || '').toLowerCase();
      const currentFace = (card.currentFace || card.name).toLowerCase();
      return cardName === 'delver of secrets' && currentFace === 'delver of secrets';
    });

    if (delvers.length === 0) {
      console.log('No Delver of Secrets found on battlefield');
      return;
    }

    console.log(`Found ${delvers.length} Delver(s) of Secrets`);

    // Process each Delver trigger
    delvers.forEach((delver, index) => {
      this.triggerDelverReveal(delver, index);
    });
  }

  triggerDelverReveal(delver, index = 0) {
    const activePlayer = this.activePlayer === 'player' ? this : this.opponent;
    const library = activePlayer.library;

    if (library.length === 0) {
      this.showToast('Library is empty - cannot reveal for Delver', 'warning');
      this.logAction('Delver of Secrets trigger - no cards in library',
        this.activePlayer === 'player' ? 'You' : 'Opponent', true);
      return;
    }

    // Get top card
    const topCard = library[library.length - 1];
    const cardType = this.getCardMainType(topCard.type || '').toLowerCase();
    const isInstantOrSorcery = cardType === 'instant' || cardType === 'sorcery';

    console.log('Delver trigger:', topCard.name, 'Type:', cardType, 'Transform?', isInstantOrSorcery);

    // Show modal with reveal
    this.showDelverRevealModal(delver, topCard, isInstantOrSorcery);
  }

  showDelverRevealModal(delver, revealedCard, shouldTransform) {
    const modal = document.createElement('div');
    modal.id = 'delverRevealModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const cardType = this.getCardMainType(revealedCard.type || '');

    modal.innerHTML = `
      <div style="
        background: var(--bg-primary);
        border: 3px solid ${shouldTransform ? '#10b981' : '#ef4444'};
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <h2 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.5rem;">
          🔮 Delver of Secrets Trigger
        </h2>

        <div style="
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
        ">
          <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            Revealed card:
          </div>
          <div style="font-size: 1.25rem; font-weight: bold; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${this.escapeHtml(revealedCard.name)}
          </div>
          <div style="
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: ${shouldTransform ? '#10b98120' : '#ef444420'};
            color: ${shouldTransform ? '#10b981' : '#ef4444'};
            border-radius: 6px;
            font-weight: bold;
            font-size: 0.9rem;
          ">
            ${cardType}
          </div>
        </div>

        <div style="
          font-size: 1.1rem;
          font-weight: bold;
          color: ${shouldTransform ? '#10b981' : '#ef4444'};
          margin: 1rem 0;
        ">
          ${shouldTransform ?
            '✅ Transform into Insectile Aberration!' :
            '❌ Does not transform (not an instant or sorcery)'}
        </div>

        <button
          onclick="window.handSimulator.resolveDelverTrigger(${shouldTransform})"
          style="
            background: ${shouldTransform ? '#10b981' : '#3b82f6'};
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
          "
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'">
          ${shouldTransform ? 'Transform Delver' : 'Continue'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Store the delver and decision for resolution
    this.pendingDelverTrigger = {
      delver: delver,
      shouldTransform: shouldTransform
    };
  }

  resolveDelverTrigger(shouldTransform) {
    // Close modal
    document.getElementById('delverRevealModal')?.remove();

    if (!this.pendingDelverTrigger) {
      console.error('No pending Delver trigger');
      return;
    }

    const delver = this.pendingDelverTrigger.delver;

    if (shouldTransform) {
      // Transform the Delver
      const cardId = delver.id || `${delver.name}_0`;
      this.transformCard(cardId);
      this.showToast('Delver of Secrets transformed!', 'success');
      this.logAction('Delver of Secrets transformed into Insectile Aberration',
        this.activePlayer === 'player' ? 'You' : 'Opponent', true);
    } else {
      this.showToast('Delver of Secrets does not transform', 'info');
      this.logAction('Delver of Secrets revealed a non-instant/sorcery',
        this.activePlayer === 'player' ? 'You' : 'Opponent', true);
    }

    // Clear pending trigger
    this.pendingDelverTrigger = null;
  }

  executeDrawStep() {
    console.log('Draw step - drawing card');

    if (this.turnState.activePlayer === 'player') {
      this.logAction('Drew a card for turn', 'You', true);
      this.drawCard();
    } else {
      // Opponent draws (simulate)
      if (this.opponent.library.length > 0) {
        const drawnCard = this.opponent.library.pop();
        this.opponent.hand.push(drawnCard);
        this.opponent.gameStats.cardsDrawn++;
        this.logAction('Drew a card for turn', 'Opponent', true);
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
        this.initializeCombat();
        break;
      case 'combat':
        this.advanceCombatStep();
        return; // Combat step advancement handles its own progression
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

  // =====================================================
  // COMBAT SYSTEM
  // =====================================================

  initializeCombat() {
    console.log('Initializing combat phase');
    this.combatState = {
      step: 'beginning',
      attackers: [],
      blockers: [],
      combatDamage: [],
      isSelectingAttackers: false,
      isSelectingBlockers: false
    };

    this.showToast('Beginning of Combat', 'info');
    this.updateCombatUI();
  }

  advanceCombatStep() {
    console.log('Advancing combat step from:', this.combatState.step);

    switch (this.combatState.step) {
      case 'beginning':
        this.startDeclareAttackersStep();
        break;
      case 'declare-attackers':
        this.startDeclareBlockersStep();
        break;
      case 'declare-blockers':
        this.startCombatDamageStep();
        break;
      case 'combat-damage':
        this.endCombatStep();
        break;
      case 'end':
        // Exit combat phase to main2
        this.turnState.phase = 'main2';
        this.turnState.step = 'main';
        this.combatState.step = 'none';
        this.showToast('Main Phase 2', 'info');
        break;
    }

    this.updateTurnDisplay();
    this.updateCombatUI();
  }

  startDeclareAttackersStep() {
    console.log('Starting declare attackers step');
    this.combatState.step = 'declare-attackers';
    this.combatState.isSelectingAttackers = true;
    this.turnState.step = 'declare-attackers';

    this.showToast('Declare Attackers - Click creatures to attack', 'warning');
    this.highlightAttackableCreatures();
    this.showDeclareAttackersUI();
  }

  startDeclareBlockersStep() {
    console.log('Starting declare blockers step');
    this.combatState.step = 'declare-blockers';
    this.combatState.isSelectingAttackers = false;
    this.combatState.isSelectingBlockers = true;
    this.turnState.step = 'declare-blockers';

    if (this.combatState.attackers.length === 0) {
      this.showToast('No attackers declared - skipping to combat damage', 'info');
      this.startCombatDamageStep();
      return;
    }

    this.showToast('Declare Blockers', 'warning');
    this.highlightBlockableCreatures();
    this.showDeclareBlockersUI();
  }

  startCombatDamageStep() {
    console.log('Starting combat damage step');
    this.combatState.step = 'combat-damage';
    this.combatState.isSelectingBlockers = false;
    this.turnState.step = 'combat-damage';

    this.calculateCombatDamage();
    this.applyCombatDamage();
    this.showToast('Combat Damage', 'info');
  }

  endCombatStep() {
    console.log('Ending combat');
    this.combatState.step = 'end';
    this.turnState.step = 'end-combat';

    this.clearCombatHighlights();
    this.showToast('End of Combat', 'info');
  }

  // Combat Creature Selection
  toggleAttacker(cardId) {
    if (!this.combatState.isSelectingAttackers) return;

    console.log('Toggling attacker:', cardId);

    // Check if creature can attack (not tapped, not summoning sick)
    const creature = this.findBattlefieldCard(cardId);
    if (!creature) return;

    if (creature.tapped) {
      this.showToast(`${creature.name} is tapped and cannot attack`, 'error');
      return;
    }

    if (creature.summoningSick) {
      this.showToast(`${creature.name} has summoning sickness`, 'error');
      return;
    }

    // Toggle attacker status
    const attackerIndex = this.combatState.attackers.findIndex(a => a.cardId === cardId);
    if (attackerIndex >= 0) {
      // Remove from attackers
      this.combatState.attackers.splice(attackerIndex, 1);
      this.showToast(`${creature.name} no longer attacking`, 'info');
    } else {
      // Add to attackers
      this.combatState.attackers.push({
        cardId: cardId,
        playerId: this.activePlayer,
        creatureName: creature.name,
        power: this.getCreaturePower(creature),
        toughness: this.getCreatureToughness(creature)
      });
      this.logAction(`Declared ${creature.name} as attacker`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
      this.showToast(`${creature.name} declared as attacker`, 'success');
    }

    this.updateAttackerHighlights();
    this.updateDeclareAttackersUI();
  }

  highlightAttackableCreatures() {
    console.log('Highlighting attackable creatures');
    const battlefield = this.activePlayer === 'opponent' ? this.opponent.battlefield : this.battlefield;

    battlefield.creatures.forEach(creature => {
      const element = document.querySelector(`[data-card-id="${creature.id}"]`);
      if (element && !creature.tapped && !creature.summoningSick) {
        element.classList.add('attackable-creature');
        element.style.cursor = 'pointer';
        element.title = 'Click to declare as attacker';
      }
    });
  }

  updateAttackerHighlights() {
    // Clear all attacker highlights
    document.querySelectorAll('.attacking-creature').forEach(el => {
      el.classList.remove('attacking-creature');
    });

    // Add highlights to current attackers
    this.combatState.attackers.forEach(attacker => {
      const element = document.querySelector(`[data-card-id="${attacker.cardId}"]`);
      if (element) {
        element.classList.add('attacking-creature');
      }
    });
  }

  clearCombatHighlights() {
    document.querySelectorAll('.attackable-creature, .attacking-creature, .blocking-creature').forEach(el => {
      el.classList.remove('attackable-creature', 'attacking-creature', 'blocking-creature');
      el.style.cursor = '';
      el.title = '';
    });
  }

  showDeclareAttackersUI() {
    // Create or update combat UI panel
    this.updateCombatUI();
  }

  updateDeclareAttackersUI() {
    this.updateCombatUI();
  }

  updateCombatUI() {
    // Add combat CSS if not already added
    if (!document.getElementById('combatStyles')) {
      const style = document.createElement('style');
      style.id = 'combatStyles';
      style.textContent = `
        .attackable-creature {
          border: 3px solid #4CAF50 !important;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
          animation: attackable-pulse 2s infinite;
        }

        .attacking-creature {
          border: 3px solid #f44336 !important;
          box-shadow: 0 0 15px rgba(244, 67, 54, 0.7) !important;
          background: rgba(244, 67, 54, 0.1) !important;
        }

        .blocking-creature {
          border: 3px solid #2196F3 !important;
          box-shadow: 0 0 10px rgba(33, 150, 243, 0.5) !important;
        }

        @keyframes attackable-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
          50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
        }
      `;
      document.head.appendChild(style);
    }

    // This will create/update a combat information panel
    let combatPanel = document.getElementById('combatPanel');
    if (!combatPanel) {
      combatPanel = document.createElement('div');
      combatPanel.id = 'combatPanel';
      combatPanel.className = 'combat-panel';
      combatPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        border: 2px solid var(--accent-color);
        border-radius: var(--border-radius);
        padding: var(--space-3);
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        display: ${this.combatState.step === 'none' ? 'none' : 'block'};
      `;
      document.body.appendChild(combatPanel);
    }

    if (this.combatState.step === 'none') {
      combatPanel.style.display = 'none';
      return;
    }

    combatPanel.style.display = 'block';

    let content = `
      <div class="combat-header">
        <h3>⚔️ Combat Phase</h3>
        <p>Step: ${this.combatState.step.replace('-', ' ').toUpperCase()}</p>
      </div>
    `;

    if (this.combatState.step === 'declare-attackers') {
      content += `
        <div class="combat-section">
          <h4>Declare Attackers (${this.combatState.attackers.length})</h4>
          ${this.combatState.attackers.length === 0 ?
            '<p>Click creatures to declare as attackers</p>' :
            this.combatState.attackers.map(a => `<div>• ${a.creatureName} (${a.power}/${a.toughness})</div>`).join('')
          }
          <button onclick="window.handSimulator.finalizeDeclareAttackers()"
                  class="btn btn-primary" style="margin-top: 10px;">
            Declare Attackers
          </button>
        </div>
      `;
    }

    combatPanel.innerHTML = content;
  }

  finalizeDeclareAttackers() {
    console.log('Finalizing declare attackers:', this.combatState.attackers);
    this.combatState.isSelectingAttackers = false;
    this.clearCombatHighlights();

    if (this.combatState.attackers.length > 0) {
      this.showToast(`${this.combatState.attackers.length} attackers declared`, 'success');
      // Tap attacking creatures
      this.combatState.attackers.forEach(attacker => {
        const creature = this.findBattlefieldCard(attacker.cardId);
        if (creature) {
          creature.tapped = true;
        }
      });
      this.updateBattlefieldDisplay();
    } else {
      this.showToast('No attackers declared', 'info');
    }

    // Advance to declare blockers
    this.advanceCombatStep();
  }

  getCreaturePower(creature) {
    // Extract power from power/toughness string like "2/2" or from separate property
    if (creature.power !== undefined) return creature.power;
    if (creature.powerToughness) {
      const match = creature.powerToughness.match(/^(\d+)\/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  getCreatureToughness(creature) {
    // Extract toughness from power/toughness string like "2/2" or from separate property
    if (creature.toughness !== undefined) return creature.toughness;
    if (creature.powerToughness) {
      const match = creature.powerToughness.match(/^(\d+)\/(\d+)$/);
      return match ? parseInt(match[2]) : 0;
    }
    return 0;
  }

  // Placeholder functions for combat steps
  highlightBlockableCreatures() {
    console.log('Highlighting blockable creatures - TODO');
  }

  showDeclareBlockersUI() {
    console.log('Showing declare blockers UI - TODO');
  }

  calculateCombatDamage() {
    console.log('Calculating combat damage - TODO');
  }

  applyCombatDamage() {
    console.log('Applying combat damage - TODO');
  }

  handleBattlefieldCardClick(event, cardId, cardName) {
    console.log('Battlefield card clicked:', cardId, cardName);

    // If we're in targeting mode, handle targeting
    if (this.targetingMode && this.targetingMode.active) {
      // Check if this card is a valid target
      const element = document.querySelector(`[data-card-id="${cardId}"]`);
      if (element && element.hasAttribute('data-targeting-valid')) {
        event.preventDefault();
        this.executeTargeting(cardId);
        return;
      } else {
        this.showToast('Invalid target for this spell', 'warning');
        return;
      }
    }

    // If we're in declare attackers step and it's a creature, handle combat selection
    if (this.combatState.isSelectingAttackers) {
      const creature = this.findBattlefieldCard(cardId);
      if (creature && this.getCardMainType(creature.type).toLowerCase() === 'creature') {
        event.preventDefault();
        this.toggleAttacker(cardId);
        return;
      }
    }

    // Prevent event from bubbling to avoid conflicts
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Default behavior - show card preview
    console.log('Showing card preview for:', cardName);
    this.showCardPreview(cardName);
  }

  jumpToCombat() {
    console.log('Jumping to combat phase');

    // Skip phases until we reach combat
    while (this.turnState.phase !== 'combat' && this.turnState.phase !== 'end') {
      this.turnState.phase = this.getNextPhase(this.turnState.phase);
    }

    if (this.turnState.phase === 'combat') {
      this.turnState.step = 'beginning-combat';
      this.initializeCombat();
      this.updateTurnDisplay();
      this.showToast('Jumped to Combat Phase', 'info');
    } else {
      this.showToast('Cannot jump to combat - already at end of turn', 'warning');
    }
  }

  getNextPhase(currentPhase) {
    const phaseOrder = ['beginning', 'main1', 'combat', 'main2', 'end'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    return currentIndex >= 0 && currentIndex < phaseOrder.length - 1 ?
           phaseOrder[currentIndex + 1] : 'end';
  }

  endTurnImmediately() {
    console.log('Ending turn immediately');

    // Clean up any ongoing combat
    if (this.turnState.phase === 'combat') {
      this.clearCombatHighlights();
      this.combatState.step = 'none';
    }

    // Jump straight to end turn
    this.endTurn();
    this.showToast('Turn ended', 'info');
  }

  // =====================================================
  // PRIORITY AND STACK SYSTEM
  // =====================================================

  dealDamageToCreature(creatureId, damage, source = 'Unknown') {
    const result = this.findBattlefieldCardAnyPlayer(creatureId);
    if (!result) return;

    const creature = result.card;
    const owner = result.owner;

    // Add damage to creature
    if (!creature.damage) creature.damage = 0;
    creature.damage += damage;

    this.logAction(`${source} deals ${damage} damage to ${creature.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, true);

    // Check for lethal damage
    const toughness = this.getCreatureToughness(creature);
    if (creature.damage >= toughness) {
      this.logAction(`${creature.name} destroyed (lethal damage)`, null, true);
      this.destroyCreatureByOwner(creatureId, owner);
    } else {
      // Update both battlefields to show damage markers
      this.updateBattlefieldDisplay();
      this.updateOpponentBattlefieldDisplay();
      this.showToast(`${creature.name} takes ${damage} damage (${creature.damage}/${toughness})`, 'warning');
    }
  }

  destroyCreature(creatureId) {
    const creature = this.removeBattlefieldCard(creatureId);
    if (creature) {
      // Add to appropriate graveyard
      const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
      currentGraveyard.push(creature);

      this.updateBattlefieldDisplay();
      this.updateGraveyardDisplay();
      this.showToast(`${creature.name} destroyed`, 'info');
    }
  }

  destroyCreatureByOwner(creatureId, owner) {
    const creature = this.removeBattlefieldCardByOwner(creatureId, owner);
    if (creature) {
      // Add to the creature owner's graveyard (not the active player's)
      const graveyard = owner === 'opponent' ? this.opponent.graveyard : this.graveyard;
      graveyard.push(creature);

      // Update both battlefields and graveyards
      this.updateBattlefieldDisplay();
      this.updateOpponentBattlefieldDisplay();
      this.updateGraveyardDisplay();
      this.showToast(`${creature.name} destroyed`, 'info');
    }
  }

  removeBattlefieldCardByOwner(cardId, owner) {
    // Remove from the specified player's battlefield
    const battlefield = owner === 'opponent' ? this.opponent.battlefield : this.battlefield;

    // Check lands
    let cardIndex = battlefield.lands.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return battlefield.lands.splice(cardIndex, 1)[0];
    }

    // Check creatures
    cardIndex = battlefield.creatures.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return battlefield.creatures.splice(cardIndex, 1)[0];
    }

    // Check other permanents
    cardIndex = battlefield.others.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return battlefield.others.splice(cardIndex, 1)[0];
    }

    return null;
  }

  // Quick damage functions for testing
  dealDamage1(creatureId) { this.dealDamageToCreature(creatureId, 1, 'Test'); }
  dealDamage2(creatureId) { this.dealDamageToCreature(creatureId, 2, 'Test'); }
  dealDamage3(creatureId) { this.dealDamageToCreature(creatureId, 3, 'Lightning Bolt'); }
  dealDamage4(creatureId) { this.dealDamageToCreature(creatureId, 4, 'Test'); }

  // Cross-player targeting functions
  enableTargetingMode(damage, source = 'Spell') {
    // Legacy function for damage spells - redirect to new comprehensive system
    this.enableComprehensiveTargeting({
      type: 'damage',
      damage: damage,
      source: source,
      validTargets: ['creature']
    });
  }

  enableComprehensiveTargeting(options) {
    this.targetingMode = {
      active: true,
      type: options.type || 'damage',
      damage: options.damage || 0,
      source: options.source || 'Spell',
      validTargets: options.validTargets || ['creature'], // ['creature', 'permanent', 'player', 'planeswalker']
      restrictions: options.restrictions || [], // ['nonlegendary', 'nonblack', 'tapped', etc.]
      effect: options.effect || null, // Custom effect function
      description: options.description || this.getTargetingDescription(options)
    };

    this.showTargetingUI();
    this.highlightValidTargets();
    this.showToast(this.targetingMode.description, 'info');
  }

  getTargetingDescription(options) {
    switch (options.type) {
      case 'damage':
        return `Select a creature to deal ${options.damage} damage`;
      case 'destroy':
        return `Select a ${options.validTargets.join(' or ')} to destroy`;
      case 'exile':
        return `Select a ${options.validTargets.join(' or ')} to exile`;
      case 'bounce':
        return `Select a ${options.validTargets.join(' or ')} to return to hand`;
      case 'tap':
        return `Select a ${options.validTargets.join(' or ')} to tap`;
      case 'untap':
        return `Select a ${options.validTargets.join(' or ')} to untap`;
      case 'enchant':
        return `Select a ${options.validTargets.join(' or ')} to enchant`;
      case 'counter':
        return 'Select a spell to counter';
      default:
        return 'Select a valid target';
    }
  }

  disableTargetingMode() {
    this.targetingMode = { active: false };
    this.hideTargetingUI();
    this.clearAllTargetHighlights();
  }

  showTargetingUI() {
    let targetingUI = document.getElementById('targetingUI');
    if (!targetingUI) {
      targetingUI = document.createElement('div');
      targetingUI.id = 'targetingUI';
      targetingUI.className = 'targeting-ui';
      targetingUI.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-primary);
        border: 2px solid #ff6b6b;
        border-radius: var(--border-radius);
        padding: 1rem;
        z-index: 1000;
        box-shadow: var(--shadow);
      `;
      document.body.appendChild(targetingUI);
    }

    targetingUI.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="color: #ff6b6b; font-weight: bold;">🎯 ${this.targetingMode.source}</span>
        <span>${this.targetingMode.description}</span>
        <button onclick="window.handSimulator.disableTargetingMode()"
                style="background: #ff4757; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;
  }

  hideTargetingUI() {
    const targetingUI = document.getElementById('targetingUI');
    if (targetingUI) {
      targetingUI.remove();
    }
  }

  highlightValidTargets() {
    this.clearAllTargetHighlights();

    const validTargets = this.getValidTargets();

    validTargets.forEach(target => {
      const element = document.querySelector(`[data-card-id="${target.id}"]`);
      if (element) {
        element.classList.add('targeting-highlight');
        element.setAttribute('data-targeting-valid', 'true');
      }
    });
  }

  getValidTargets() {
    const targets = [];
    const mode = this.targetingMode;

    if (!mode.active) return targets;

    // Get all battlefield permanents if targeting permanents
    if (mode.validTargets.includes('creature')) {
      targets.push(...this.getAllBattlefieldCreatures());
    }

    if (mode.validTargets.includes('permanent')) {
      // Add all permanents with owner information
      const playerPermanents = [
        ...this.battlefield.lands.map(card => ({ ...card, owner: 'player' })),
        ...this.battlefield.creatures.map(card => ({ ...card, owner: 'player' })),
        ...this.battlefield.others.map(card => ({ ...card, owner: 'player' }))
      ];
      const opponentPermanents = [
        ...this.opponent.battlefield.lands.map(card => ({ ...card, owner: 'opponent' })),
        ...this.opponent.battlefield.creatures.map(card => ({ ...card, owner: 'opponent' })),
        ...this.opponent.battlefield.others.map(card => ({ ...card, owner: 'opponent' }))
      ];
      targets.push(...playerPermanents, ...opponentPermanents);
    }

    if (mode.validTargets.includes('land')) {
      targets.push(
        ...this.battlefield.lands.map(card => ({ ...card, owner: 'player' })),
        ...this.opponent.battlefield.lands.map(card => ({ ...card, owner: 'opponent' }))
      );
    }

    if (mode.validTargets.includes('artifact')) {
      const playerArtifacts = this.battlefield.others
        .filter(card => this.getCardMainType(card.type).toLowerCase() === 'artifact')
        .map(card => ({ ...card, owner: 'player' }));
      const opponentArtifacts = this.opponent.battlefield.others
        .filter(card => this.getCardMainType(card.type).toLowerCase() === 'artifact')
        .map(card => ({ ...card, owner: 'opponent' }));
      targets.push(...playerArtifacts, ...opponentArtifacts);
    }

    if (mode.validTargets.includes('enchantment')) {
      const playerEnchantments = this.battlefield.others
        .filter(card => this.getCardMainType(card.type).toLowerCase() === 'enchantment')
        .map(card => ({ ...card, owner: 'player' }));
      const opponentEnchantments = this.opponent.battlefield.others
        .filter(card => this.getCardMainType(card.type).toLowerCase() === 'enchantment')
        .map(card => ({ ...card, owner: 'opponent' }));
      targets.push(...playerEnchantments, ...opponentEnchantments);
    }

    // Apply restrictions
    return targets.filter(target => this.meetsTargetingRestrictions(target));
  }

  meetsTargetingRestrictions(target) {
    const restrictions = this.targetingMode.restrictions;

    for (const restriction of restrictions) {
      switch (restriction) {
        case 'nonlegendary':
          if (target.type && target.type.toLowerCase().includes('legendary')) return false;
          break;
        case 'nonblack':
          if (target.color && target.color.includes('B')) return false;
          break;
        case 'tapped':
          if (!target.tapped) return false;
          break;
        case 'untapped':
          if (target.tapped) return false;
          break;
        case 'opponent':
          // Only target opponent's permanents
          if (!target.id || !target.id.startsWith('opponent_')) return false;
          break;
        case 'own':
          // Only target your own permanents
          if (target.id && target.id.startsWith('opponent_')) return false;
          break;
      }
    }

    return true;
  }

  clearAllTargetHighlights() {
    document.querySelectorAll('.targeting-highlight').forEach(element => {
      element.classList.remove('targeting-highlight');
      element.removeAttribute('data-targeting-valid');
    });
  }

  targetCreature(creatureId) {
    // Legacy function - redirect to new comprehensive targeting
    this.executeTargeting(creatureId);
  }

  executeTargeting(targetId) {
    if (!this.targetingMode.active) return;

    const mode = this.targetingMode;
    const target = this.findAnyCard(targetId);

    console.log('executeTargeting called with:', targetId);
    console.log('targeting mode:', mode);
    console.log('found target:', target);

    if (!target) {
      this.showToast('Invalid target', 'error');
      return;
    }

    // Check if target is valid
    const validTargets = this.getValidTargets();
    console.log('valid targets:', validTargets);
    console.log('looking for target id:', targetId);
    console.log('valid target ids:', validTargets.map(t => t.id));

    if (!validTargets.some(t => t.id === targetId)) {
      this.showToast('Invalid target for this spell', 'error');
      console.log('Target not found in valid targets list');
      return;
    }

    // ADD SPELL TO STACK instead of immediately resolving
    // This allows for responses/counterspells
    const spell = this.addSpellToStack(mode.source, mode.type, this.activePlayer, targetId, mode);

    this.disableTargetingMode();
  }

  // =====================================================
  // SPELL EFFECT FUNCTIONS
  // =====================================================

  destroyPermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    this.logAction(`${source} destroys ${card.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.moveCardToGraveyard(targetId, owner);
    this.showToast(`${card.name} destroyed`, 'info');
  }

  exilePermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    this.logAction(`${source} exiles ${card.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.moveCardToExile(targetId, owner);
    this.showToast(`${card.name} exiled`, 'info');
  }

  bouncePermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    this.logAction(`${source} returns ${card.name} to hand (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.moveCardToHand(targetId, owner);
    this.showToast(`${card.name} returned to hand`, 'info');
  }

  tapPermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    if (card.tapped) {
      this.showToast(`${card.name} is already tapped`, 'warning');
      return;
    }

    card.tapped = true;
    this.logAction(`${source} taps ${card.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.updateBattlefieldDisplay();
    this.showToast(`${card.name} tapped`, 'info');
  }

  untapPermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    if (!card.tapped) {
      this.showToast(`${card.name} is already untapped`, 'warning');
      return;
    }

    card.tapped = false;
    this.logAction(`${source} untaps ${card.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.updateBattlefieldDisplay();
    this.showToast(`${card.name} untapped`, 'info');
  }

  enchantPermanent(targetId, source = 'Spell') {
    const result = this.findBattlefieldCardAnyPlayer(targetId);
    if (!result) return;

    const card = result.card;
    const owner = result.owner;

    // For now, just add a marker that this permanent is enchanted
    if (!card.enchantments) card.enchantments = [];
    card.enchantments.push(source);

    this.logAction(`${source} enchants ${card.name} (${owner === 'player' ? 'Your' : 'Opponent\'s'})`, null, false);
    this.updateBattlefieldDisplay();
    this.showToast(`${card.name} enchanted by ${source}`, 'info');
  }

  findAnyCard(cardId) {
    // Search all zones for a card
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (result) return result.card;

    // Search hands
    let card = this.hand.find(c => c.id === cardId);
    if (card) return card;

    card = this.opponent.hand.find(c => c.id === cardId);
    if (card) return card;

    // Search graveyards
    card = this.graveyard.find(c => c.id === cardId);
    if (card) return card;

    card = this.opponent.graveyard.find(c => c.id === cardId);
    if (card) return card;

    // Search exile
    card = this.exile.find(c => c.id === cardId);
    if (card) return card;

    card = this.opponent.exile.find(c => c.id === cardId);
    if (card) return card;

    return null;
  }

  moveCardToGraveyard(cardId, owner) {
    const battlefield = owner === 'player' ? this.battlefield : this.opponent.battlefield;
    const graveyard = owner === 'player' ? this.graveyard : this.opponent.graveyard;

    // Find and remove from battlefield
    for (const zone of [battlefield.lands, battlefield.creatures, battlefield.others]) {
      const index = zone.findIndex(card => card.id === cardId);
      if (index !== -1) {
        const card = zone.splice(index, 1)[0];
        graveyard.push(card);
        this.updateBattlefieldDisplay();
        this.updateGraveyardDisplay();
        return;
      }
    }
  }

  moveCardToExile(cardId, owner) {
    const battlefield = owner === 'player' ? this.battlefield : this.opponent.battlefield;
    const exile = owner === 'player' ? this.exile : this.opponent.exile;

    // Find and remove from battlefield
    for (const zone of [battlefield.lands, battlefield.creatures, battlefield.others]) {
      const index = zone.findIndex(card => card.id === cardId);
      if (index !== -1) {
        const card = zone.splice(index, 1)[0];
        exile.push(card);
        this.updateBattlefieldDisplay();
        this.updateExileDisplay();
        return;
      }
    }
  }

  moveCardToHand(cardId, owner) {
    const battlefield = owner === 'player' ? this.battlefield : this.opponent.battlefield;
    const hand = owner === 'player' ? this.hand : this.opponent.hand;

    // Find and remove from battlefield
    for (const zone of [battlefield.lands, battlefield.creatures, battlefield.others]) {
      const index = zone.findIndex(card => card.id === cardId);
      if (index !== -1) {
        const card = zone.splice(index, 1)[0];
        hand.push(card);
        this.updateBattlefieldDisplay();
        this.updateHandDisplay();
        if (owner === 'opponent') {
          this.updateOpponentHandDisplay();
        }
        return;
      }
    }
  }

  // =====================================================
  // SPECIFIC SPELL FUNCTIONS
  // =====================================================

  // Damage spells
  lightningBolt() {
    this.enableComprehensiveTargeting({
      type: 'damage',
      damage: 3,
      source: 'Lightning Bolt',
      validTargets: ['creature', 'player'],
      description: 'Lightning Bolt deals 3 damage to any target'
    });
  }

  shock() {
    this.enableComprehensiveTargeting({
      type: 'damage',
      damage: 2,
      source: 'Shock',
      validTargets: ['creature', 'player'],
      description: 'Shock deals 2 damage to any target'
    });
  }

  // Removal spells
  swordsToPlowshares() {
    this.enableComprehensiveTargeting({
      type: 'exile',
      source: 'Swords to Plowshares',
      validTargets: ['creature'],
      description: 'Exile target creature. Its controller gains life equal to its power.'
    });
  }

  terror() {
    this.enableComprehensiveTargeting({
      type: 'destroy',
      source: 'Terror',
      validTargets: ['creature'],
      restrictions: ['nonblack'],
      description: 'Destroy target non-black creature'
    });
  }

  murder() {
    this.enableComprehensiveTargeting({
      type: 'destroy',
      source: 'Murder',
      validTargets: ['creature'],
      description: 'Destroy target creature'
    });
  }

  // Bounce spells
  unsummon() {
    this.enableComprehensiveTargeting({
      type: 'bounce',
      source: 'Unsummon',
      validTargets: ['creature'],
      description: 'Return target creature to its owner\'s hand'
    });
  }

  boomerang() {
    this.enableComprehensiveTargeting({
      type: 'bounce',
      source: 'Boomerang',
      validTargets: ['permanent'],
      description: 'Return target permanent to its owner\'s hand'
    });
  }

  // Tap spells
  sleep() {
    this.enableComprehensiveTargeting({
      type: 'tap',
      source: 'Sleep',
      validTargets: ['creature'],
      restrictions: ['untapped'],
      description: 'Tap target creature'
    });
  }

  // Enchantments
  pacifism() {
    this.enableComprehensiveTargeting({
      type: 'enchant',
      source: 'Pacifism',
      validTargets: ['creature'],
      description: 'Enchant target creature (creature cannot attack or block)'
    });
  }

  // =====================================================
  // LIBRARY AND GRAVEYARD MANIPULATION
  // =====================================================

  // Scry effects
  scry(amount = 1) {
    this.showScryInterface(amount, 'Scry');
  }

  scry1() { this.scry(1); }
  scry2() { this.scry(2); }

  // Ponder-style effects
  ponder() {
    this.showPonderInterface(3, 'Ponder', {
      canShuffle: true,
      drawAfter: 1,
      description: 'Look at the top three cards of your library, then put them back in any order. You may shuffle your library. Draw a card.'
    });
  }

  preordain() {
    this.showScryInterface(2, 'Preordain', {
      drawAfter: 1,
      description: 'Scry 2, then draw a card.'
    });
  }

  brainstorm() {
    this.drawCards(3);
    this.showPutBackInterface(2, 'Brainstorm', {
      description: 'Draw three cards, then put two cards from your hand on top of your library in any order.'
    });
  }

  // Surveil effects
  surveil(amount = 1) {
    this.showSurveilInterface(amount, 'Surveil');
  }

  surveil1() { this.surveil(1); }
  surveil2() { this.surveil(2); }
  surveil4() { this.surveil(4); }

  // Tutor effects
  diabolicTutor() {
    this.showTutorInterface('any', 'Diabolic Tutor', {
      description: 'Search your library for a card and put it into your hand. Then shuffle your library.',
      destination: 'hand'
    });
  }

  demonicTutor() {
    this.showTutorInterface('any', 'Demonic Tutor', {
      description: 'Search your library for any card and put it into your hand. Then shuffle your library.',
      destination: 'hand'
    });
  }

  // Fetchland effects
  fetchland() {
    this.showTutorInterface('land', 'Fetchland', {
      description: 'Search your library for a basic land card and put it onto the battlefield tapped. Then shuffle your library.',
      destination: 'battlefield',
      tapped: true,
      restrictions: ['basic']
    });
  }

  // True fetchlands (enter untapped, cost life)
  scalding_tarn() {
    const options = {
      description: 'Pay 1 life, sacrifice Scalding Tarn: Search your library for an Island or Mountain card, put it onto the battlefield, then shuffle.',
      destination: 'battlefield',
      tapped: false, // True fetchlands produce untapped lands
      restrictions: ['basic'],
      types: ['island', 'mountain'],
      fetchlandName: 'Scalding Tarn'
    };
    console.log('Scalding Tarn options:', options);
    this.showTutorInterface('land', 'Scalding Tarn', options);
  }

  flooded_strand() {
    this.showTutorInterface('land', 'Flooded Strand', {
      description: 'Pay 1 life, sacrifice Flooded Strand: Search your library for a Plains or Island card, put it onto the battlefield, then shuffle.',
      destination: 'battlefield',
      tapped: false,
      restrictions: ['basic'],
      types: ['plains', 'island'],
      fetchlandName: 'Flooded Strand'
    });
  }

  polluted_delta() {
    this.showTutorInterface('land', 'Polluted Delta', {
      description: 'Pay 1 life, sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.',
      destination: 'battlefield',
      tapped: false,
      restrictions: ['basic'],
      types: ['island', 'swamp'],
      fetchlandName: 'Polluted Delta'
    });
  }

  evolving_wilds() {
    this.showTutorInterface('land', 'Evolving Wilds', {
      description: 'Search your library for a basic land card and put it onto the battlefield tapped. Then shuffle your library.',
      destination: 'battlefield',
      tapped: true,
      restrictions: ['basic']
    });
  }

  rampantGrowth() {
    this.showTutorInterface('land', 'Rampant Growth', {
      description: 'Search your library for a basic land card and put it onto the battlefield tapped. Then shuffle your library.',
      destination: 'battlefield',
      tapped: true,
      restrictions: ['basic']
    });
  }

  cultivate() {
    this.showTutorInterface('land', 'Cultivate', {
      description: 'Search your library for up to two basic land cards. Put one onto the battlefield tapped and the other into your hand. Then shuffle your library.',
      destination: 'both',
      amount: 2,
      restrictions: ['basic']
    });
  }

  // Alias for evolvingWilds to match HTML button calls
  evolvingWilds() {
    this.evolving_wilds();
  }

  // Graveyard targeting
  reanimate() {
    this.enableGraveyardTargeting({
      type: 'reanimate',
      source: 'Reanimate',
      validTargets: ['creature'],
      description: 'Put target creature card from a graveyard onto the battlefield under your control'
    });
  }

  regrowth() {
    this.enableGraveyardTargeting({
      type: 'return-to-hand',
      source: 'Regrowth',
      validTargets: ['any'],
      description: 'Return target card from your graveyard to your hand'
    });
  }

  // =====================================================
  // LIBRARY MANIPULATION INTERFACES
  // =====================================================

  showScryInterface(amount, source, options = {}) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;

    if (library.length === 0) {
      this.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToScry = library.slice(-Math.min(amount, library.length));
    this.createScryModal(cardsToScry, amount, source, options);
  }

  createScryModal(cards, amount, source, options = {}) {
    let modal = document.getElementById('scryModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'scryModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const modalContent = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 800px; width: 90%;">
        <h3>${source} ${amount}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          ${options.description || `Look at the top ${amount} card${amount > 1 ? 's' : ''} of your library. Put any number on the bottom and the rest on top in any order.`}
        </p>

        <div id="scryCards" style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3); flex-wrap: wrap;">
          ${cards.map((card, index) => `
            <div class="scry-card" data-card-index="${index}" style="
              border: 2px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--space-2);
              background: var(--bg-secondary);
              cursor: pointer;
              min-width: 120px;
              text-align: center;
            ">
              <div style="font-weight: bold; margin-bottom: 4px;">${card.name}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${card.cost || ''}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${this.getCardMainType(card.type)}</div>
              <div style="margin-top: 8px;">
                <button onclick="window.handSimulator.scryCardToBottom(${index})" style="background: var(--error); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Bottom</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <button onclick="window.handSimulator.finishScry('${source}')"
                  style="background: var(--accent-color); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
            Finish
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Store scry state
    this.scryState = {
      cards: [...cards],
      bottomCards: [],
      source: source,
      options: options
    };
  }

  scryCardToBottom(cardIndex) {
    if (!this.scryState) return;

    const card = this.scryState.cards[cardIndex];
    this.scryState.bottomCards.push(card);
    this.scryState.cards.splice(cardIndex, 1);

    // Update display
    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
    if (cardElement) {
      cardElement.style.opacity = '0.5';
      cardElement.style.pointerEvents = 'none';
      cardElement.innerHTML += '<div style="color: var(--error); font-weight: bold; margin-top: 4px;">→ Bottom</div>';
    }
  }

  finishScry(source) {
    if (!this.scryState) return;

    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const options = this.scryState.options;

    // Remove the original cards from library
    const originalAmount = this.scryState.cards.length + this.scryState.bottomCards.length;
    library.splice(-originalAmount, originalAmount);

    // Put remaining cards back on top (in reverse order)
    this.scryState.cards.reverse().forEach(card => {
      library.push(card);
    });

    // Put bottom cards on bottom
    this.scryState.bottomCards.forEach(card => {
      library.unshift(card);
    });

    this.logAction(`${source}: ${this.scryState.bottomCards.length} to bottom, ${this.scryState.cards.length} on top`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);

    // Clean up
    document.getElementById('scryModal')?.remove();
    this.scryState = null;

    // Draw card if specified
    if (options && options.drawAfter) {
      this.drawCards(options.drawAfter);
    }

    this.showToast(`${source} complete`, 'success');
  }

  showPonderInterface(amount, source, options = {}) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;

    if (library.length === 0) {
      this.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToPonder = library.slice(-Math.min(amount, library.length));
    this.createPonderModal(cardsToPonder, amount, source, options);
  }

  createPonderModal(cards, amount, source, options = {}) {
    let modal = document.getElementById('ponderModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'ponderModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const modalContent = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 900px; width: 95%;">
        <h3>${source}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          ${options.description}
        </p>

        <div style="margin-bottom: var(--space-3);">
          <h4 style="margin-bottom: var(--space-2);">Top ${amount} cards of your library:</h4>
          <div id="ponderCards" style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3); flex-wrap: wrap;">
            ${cards.map((card, index) => `
              <div class="ponder-card" data-card-index="${index}" style="
                border: 2px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--space-2);
                background: var(--bg-secondary);
                cursor: pointer;
                min-width: 140px;
                text-align: center;
                position: relative;
              ">
                <div style="font-weight: bold; margin-bottom: 4px;">${card.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${card.cost || ''}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${this.getCardMainType(card.type)}</div>
                <div style="margin-top: 8px; display: flex; gap: 4px; justify-content: center;">
                  <button onclick="window.handSimulator.setPonderCardPosition(${index}, 1)"
                          style="background: var(--success); color: white; border: none; padding: 2px 6px; border-radius: 3px; font-size: 10px;">1st</button>
                  <button onclick="window.handSimulator.setPonderCardPosition(${index}, 2)"
                          style="background: var(--warning); color: white; border: none; padding: 2px 6px; border-radius: 3px; font-size: 10px;">2nd</button>
                  <button onclick="window.handSimulator.setPonderCardPosition(${index}, 3)"
                          style="background: var(--error); color: white; border: none; padding: 2px 6px; border-radius: 3px; font-size: 10px;">3rd</button>
                </div>
                <div class="position-indicator" style="position: absolute; top: 4px; right: 4px; background: var(--accent-color); color: white; border-radius: 50%; width: 20px; height: 20px; display: none; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;"></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; gap: var(--space-2); justify-content: space-between; align-items: center;">
          <div>
            ${options.canShuffle ? `
              <button onclick="window.handSimulator.shuffleAfterPonder(true)"
                      style="background: var(--warning); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
                Shuffle Library
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button onclick="window.handSimulator.cancelPonder()"
                    style="background: var(--error); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
              Cancel
            </button>
            <button onclick="window.handSimulator.finishPonder('${source}')"
                    style="background: var(--accent-color); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
              Finish
            </button>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Store ponder state
    this.ponderState = {
      cards: [...cards],
      positions: new Array(cards.length).fill(null), // Track which position each card is assigned
      source: source,
      options: options,
      willShuffle: false
    };
  }

  setPonderCardPosition(cardIndex, position) {
    if (!this.ponderState) return;

    // Clear any existing assignment to this position
    this.ponderState.positions.forEach((pos, i) => {
      if (pos === position) {
        this.ponderState.positions[i] = null;
        const otherElement = document.querySelector(`[data-card-index="${i}"] .position-indicator`);
        if (otherElement) {
          otherElement.style.display = 'none';
        }
      }
    });

    // Set new position
    this.ponderState.positions[cardIndex] = position;

    // Update visual indicator
    const indicator = document.querySelector(`[data-card-index="${cardIndex}"] .position-indicator`);
    if (indicator) {
      indicator.textContent = position;
      indicator.style.display = 'flex';
    }
  }

  shuffleAfterPonder(willShuffle) {
    if (!this.ponderState) return;
    this.ponderState.willShuffle = willShuffle;
    this.showToast(willShuffle ? 'Will shuffle library after Ponder' : 'Will not shuffle library', 'info');
  }

  finishPonder(source) {
    if (!this.ponderState) return;

    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const options = this.ponderState.options;

    // Remove the original cards from library
    library.splice(-this.ponderState.cards.length, this.ponderState.cards.length);

    if (this.ponderState.willShuffle) {
      // If shuffling, just put all cards back and shuffle
      this.ponderState.cards.forEach(card => {
        library.push(card);
      });
      this.shuffleLibrary();
      this.logAction(`${source}: Looked at ${this.ponderState.cards.length} cards, then shuffled library`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
    } else {
      // Put cards back in specified order (or original order if not all positioned)
      const orderedCards = new Array(this.ponderState.cards.length);

      // Place positioned cards
      this.ponderState.positions.forEach((position, cardIndex) => {
        if (position !== null) {
          orderedCards[position - 1] = this.ponderState.cards[cardIndex];
        }
      });

      // Fill remaining slots with unpositioned cards
      let nextSlot = 0;
      this.ponderState.cards.forEach((card, cardIndex) => {
        if (this.ponderState.positions[cardIndex] === null) {
          while (orderedCards[nextSlot] !== undefined) nextSlot++;
          orderedCards[nextSlot] = card;
        }
      });

      // Put cards back on library (in reverse order since we're adding to end)
      orderedCards.reverse().forEach(card => {
        library.push(card);
      });

      this.logAction(`${source}: Rearranged top ${this.ponderState.cards.length} cards`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
    }

    // Clean up
    document.getElementById('ponderModal')?.remove();
    this.ponderState = null;

    // Draw card if specified
    if (options && options.drawAfter) {
      this.drawCards(options.drawAfter);
    }

    this.showToast(`${source} complete`, 'success');
  }

  cancelPonder() {
    this.ponderState = null;
    document.getElementById('ponderModal')?.remove();
  }


  showSurveilInterface(amount, source) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;

    if (library.length === 0) {
      this.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToSurveil = library.slice(-Math.min(amount, library.length));
    this.createSurveilModal(cardsToSurveil, amount, source);
  }

  createSurveilModal(cards, amount, source) {
    let modal = document.getElementById('surveilModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'surveilModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const modalContent = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 800px; width: 90%;">
        <h3>Surveil ${amount}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          Look at the top ${amount} card${amount > 1 ? 's' : ''} of your library. Put any number into your graveyard and the rest on top in any order.
        </p>

        <div id="surveilCards" style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3); flex-wrap: wrap;">
          ${cards.map((card, index) => `
            <div class="surveil-card" data-card-index="${index}" style="
              border: 2px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--space-2);
              background: var(--bg-secondary);
              cursor: pointer;
              min-width: 120px;
              text-align: center;
            ">
              <div style="font-weight: bold; margin-bottom: 4px;">${card.name}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${card.cost || ''}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${this.getCardMainType(card.type)}</div>
              <div style="margin-top: 8px;">
                <button onclick="window.handSimulator.surveilCardToGraveyard(${index})" style="background: var(--warning); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Graveyard</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <button onclick="window.handSimulator.finishSurveil('${source}')"
                  style="background: var(--accent-color); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
            Finish
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Store surveil state
    this.surveilState = {
      cards: [...cards],
      graveyardCards: [],
      source: source
    };
  }

  surveilCardToGraveyard(cardIndex) {
    if (!this.surveilState) return;

    const card = this.surveilState.cards[cardIndex];
    this.surveilState.graveyardCards.push(card);
    this.surveilState.cards.splice(cardIndex, 1);

    // Update display
    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
    if (cardElement) {
      cardElement.style.opacity = '0.5';
      cardElement.style.pointerEvents = 'none';
      cardElement.innerHTML += '<div style="color: var(--warning); font-weight: bold; margin-top: 4px;">→ Graveyard</div>';
    }
  }

  finishSurveil(source) {
    if (!this.surveilState) return;

    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const graveyard = currentPlayer.graveyard;

    // Remove the original cards from library
    const originalAmount = this.surveilState.cards.length + this.surveilState.graveyardCards.length;
    library.splice(-originalAmount, originalAmount);

    // Put remaining cards back on top (in reverse order)
    this.surveilState.cards.reverse().forEach(card => {
      library.push(card);
    });

    // Put graveyard cards in graveyard
    this.surveilState.graveyardCards.forEach(card => {
      graveyard.push(card);
    });

    this.logAction(`${source}: ${this.surveilState.graveyardCards.length} to graveyard, ${this.surveilState.cards.length} on top`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);

    // Clean up
    document.getElementById('surveilModal')?.remove();
    this.surveilState = null;

    this.updateGraveyardDisplay();
    this.showToast(`${source} complete`, 'success');
  }

  drawCards(amount) {
    for (let i = 0; i < amount; i++) {
      this.drawCard();
    }
  }

  enableGraveyardTargeting(options) {
    const currentPlayer = this.getCurrentPlayer();
    const graveyard = currentPlayer.graveyard;

    if (graveyard.length === 0) {
      this.showToast('Graveyard is empty', 'warning');
      return;
    }

    this.graveyardTargetingMode = {
      active: true,
      type: options.type,
      source: options.source,
      validTargets: options.validTargets,
      description: options.description
    };

    this.showGraveyardTargetingInterface(graveyard, options);
  }

  showGraveyardTargetingInterface(graveyard, options) {
    let modal = document.getElementById('graveyardTargetingModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'graveyardTargetingModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const validCards = graveyard.filter(card => {
      if (options.validTargets.includes('any')) return true;
      if (options.validTargets.includes('creature')) {
        return this.getCardMainType(card.type).toLowerCase() === 'creature';
      }
      return false;
    });

    const modalContent = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 800px; width: 90%;">
        <h3>${options.source}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          ${options.description}
        </p>

        <div id="graveyardTargets" style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3); flex-wrap: wrap;">
          ${validCards.map((card) => `
            <div class="graveyard-target" onclick="window.handSimulator.selectGraveyardTarget('${card.id}')" style="
              border: 2px solid var(--border-color);
              border-radius: var(--border-radius);
              padding: var(--space-2);
              background: var(--bg-secondary);
              cursor: pointer;
              min-width: 120px;
              text-align: center;
            ">
              <div style="font-weight: bold; margin-bottom: 4px;">${card.name}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${card.cost || ''}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${this.getCardMainType(card.type)}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <button onclick="window.handSimulator.cancelGraveyardTargeting()"
                  style="background: var(--error); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
            Cancel
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
  }

  selectGraveyardTarget(cardId) {
    if (!this.graveyardTargetingMode.active) return;

    const mode = this.graveyardTargetingMode;
    const currentPlayer = this.getCurrentPlayer();
    const graveyard = currentPlayer.graveyard;
    const cardIndex = graveyard.findIndex(card => card.id === cardId);

    if (cardIndex === -1) return;

    const card = graveyard[cardIndex];

    switch (mode.type) {
      case 'reanimate': {
        // Remove from graveyard and put on battlefield
        graveyard.splice(cardIndex, 1);
        const battlefield = this.activePlayer === 'player' ? this.battlefield : this.opponent.battlefield;
        battlefield.creatures.push(card);
        this.logAction(`${mode.source}: ${card.name} returned to battlefield`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
        this.updateBattlefieldDisplay();
        break;
      }

      case 'return-to-hand': {
        // Remove from graveyard and put in hand
        graveyard.splice(cardIndex, 1);
        const hand = this.activePlayer === 'player' ? this.hand : this.opponent.hand;
        hand.push(card);
        this.logAction(`${mode.source}: ${card.name} returned to hand`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
        this.updateHandDisplay();
        break;
      }
    }

    this.updateGraveyardDisplay();
    this.cancelGraveyardTargeting();
    this.showToast(`${card.name} targeted by ${mode.source}`, 'success');
  }

  cancelGraveyardTargeting() {
    this.graveyardTargetingMode = { active: false };
    document.getElementById('graveyardTargetingModal')?.remove();
  }

  // =====================================================
  // TUTOR EFFECTS (LIBRARY SEARCH)
  // =====================================================

  showTutorInterface(cardType, source, options = {}) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;


    if (library.length === 0) {
      this.showToast('Library is empty', 'warning');
      return;
    }


    // Filter library for valid targets
    const validCards = library.filter(card => this.cardMatchesTutorCriteria(card, cardType, options.restrictions || []));


    if (validCards.length === 0) {
      this.showToast(`No valid ${cardType} cards found in library`, 'warning');
      return;
    }

    this.createTutorModal(validCards, cardType, source, options);
  }

  isFetchland(cardName) {
    const name = cardName.toLowerCase();
    const fetchlands = [
      'flooded strand', 'polluted delta', 'bloodstained mire', 'wooded foothills', 'windswept heath',
      'scalding tarn', 'verdant catacombs', 'arid mesa', 'misty rainforest', 'marsh flats',
      'prismatic vista', 'evolving wilds', 'terramorphic expanse'
    ];
    return fetchlands.includes(name);
  }

  isWasteland(cardName) {
    const name = cardName.toLowerCase();
    return name === 'wasteland' || name === 'strip mine' || name === 'dust bowl' || name === 'ghost quarter';
  }

  hasSurveil(cardName) {
    const name = cardName.toLowerCase();
    // Check if card text or name includes surveil
    return name.includes('surveil') ||
           name === 'dimir spybug' ||
           name === 'thoughtbound phantasm' ||
           name === 'doom whisperer' ||
           name === 'nightveil sprite' ||
           name === 'disinformation campaign' ||
           name === 'consider' ||
           name === 'curate' ||
           name === 'taigam\'s scheming';
  }

  getSurveilAmount(cardName) {
    const name = cardName.toLowerCase();
    // Default amounts for common surveil cards
    const surveilMap = {
      'doom whisperer': 2,
      'thoughtbound phantasm': 1,
      'dimir spybug': 1,
      'nightveil sprite': 1,
      'disinformation campaign': 1,
      'consider': 1,
      'curate': 2,
      'taigam\'s scheming': 5
    };

    // Check if card name contains "surveil X"
    const match = name.match(/surveil (\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    return surveilMap[name] || 1;
  }

  hasScry(cardName) {
    const name = cardName.toLowerCase();
    // Check if card text or name includes scry
    return name.includes('scry') ||
           name === 'preordain' ||
           name === 'serum visions' ||
           name === 'opt' ||
           name === 'magma jet' ||
           name === 'crystal ball';
  }

  getScryAmount(cardName) {
    const name = cardName.toLowerCase();
    // Default amounts for common scry cards
    const scryMap = {
      'preordain': 2,
      'serum visions': 2,
      'opt': 1,
      'magma jet': 2,
      'crystal ball': 2,
      'condescend': 2,
      'anticipate': 1
    };

    // Check if card name contains "scry X"
    const match = name.match(/scry (\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    return scryMap[name] || 1;
  }

  // ===== DELVE MECHANIC =====

  hasDelve(cardName) {
    const name = cardName.toLowerCase();
    return name.includes('murktide regent') ||
           name.includes('gurmag angler') ||
           name.includes('tasigur') ||
           name.includes('hooting mandrills') ||
           name === 'dig through time' ||
           name === 'treasure cruise' ||
           name === 'temporal trespass' ||
           name === 'soul spike' ||
           name === 'tombstalker';
  }

  isMurktideRegent(cardName) {
    const name = cardName.toLowerCase();
    return name.includes('murktide regent');
  }

  getMurktidePowerToughness() {
    // Count instant and sorcery cards in exile
    const instantsAndSorceriesInExile = this.exile.filter(card => {
      const type = this.getCardMainType(card.type).toLowerCase();
      return type === 'instant' || type === 'sorcery';
    }).length;

    // Base 3/3 + number of instants/sorceries in exile
    const power = 3 + instantsAndSorceriesInExile;
    const toughness = 3 + instantsAndSorceriesInExile;

    return { power, toughness };
  }

  // =====================================================
  // MASS SPELL DETECTION
  // =====================================================

  isMassSpell(cardName) {
    const name = cardName.toLowerCase();
    return this.isBoardWipe(name) || this.isMassLandDestruction(name) || this.isMassArtifactEnchantmentDestruction(name);
  }

  isBoardWipe(cardName) {
    const name = cardName.toLowerCase();
    // Cards that destroy all creatures
    return name === 'wrath of god' ||
           name === 'damnation' ||
           name === 'day of judgment' ||
           name === 'supreme verdict' ||
           name === 'terminus' ||
           name === 'blasphemous act' ||
           name === 'toxic deluge' ||
           name === 'languish' ||
           name === 'anger of the gods' ||
           name === 'cry of the carnarium' ||
           name === 'extinction event' ||
           name === 'shatter the sky' ||
           name === 'settle the wreckage';
  }

  isMassLandDestruction(cardName) {
    const name = cardName.toLowerCase();
    // Cards that destroy all/many lands
    return name === 'armageddon' ||
           name === 'ravages of war' ||
           name === 'global ruin' ||
           name === 'obliterate' ||
           name === 'worldslayer' ||
           name === 'jokulhaups' ||
           name === 'devastation' ||
           name === 'decree of annihilation';
  }

  isMassArtifactEnchantmentDestruction(cardName) {
    const name = cardName.toLowerCase();
    return name === 'cleansing nova' ||
           name === 'austere command' ||
           name === 'merciless eviction' ||
           name === 'fractured identity' ||
           name === 'vandalblast' ||
           name === 'shatterstorm' ||
           name === 'creeping corrosion';
  }

  getMassSpellType(cardName) {
    const name = cardName.toLowerCase();

    if (this.isBoardWipe(name)) {
      return {
        type: 'creatures',
        description: 'Destroy all creatures',
        icon: '💀',
        targets: ['creatures']
      };
    }

    if (this.isMassLandDestruction(name)) {
      return {
        type: 'lands',
        description: 'Destroy all lands',
        icon: '🌋',
        targets: ['lands']
      };
    }

    // Special cases
    if (name === 'cleansing nova') {
      return {
        type: 'choice',
        description: 'Choose: destroy all creatures OR all artifacts/enchantments',
        icon: '✨',
        targets: ['creatures', 'artifacts', 'enchantments']
      };
    }

    if (name === 'austere command') {
      return {
        type: 'choice',
        description: 'Choose two: destroy all creatures, artifacts, enchantments, or lands',
        icon: '⚖️',
        targets: ['creatures', 'artifacts', 'enchantments', 'lands']
      };
    }

    if (name === 'merciless eviction') {
      return {
        type: 'choice',
        description: 'Choose a permanent type, exile all permanents of that type',
        icon: '🚫',
        targets: ['creatures', 'artifacts', 'enchantments', 'planeswalkers']
      };
    }

    if (this.isMassArtifactEnchantmentDestruction(name)) {
      return {
        type: 'artifacts-enchantments',
        description: 'Destroy all artifacts and/or enchantments',
        icon: '💥',
        targets: ['artifacts', 'enchantments']
      };
    }

    return {
      type: 'generic',
      description: 'Mass destruction',
      icon: '💥',
      targets: []
    };
  }

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
  }

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
      background: var(--bg-primary);
      border: 2px solid var(--accent-color);
      border-radius: var(--border-radius);
      padding: var(--space-4);
      z-index: 3000;
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
          <div style="font-size: 12px; font-weight: bold; color: var(--text-primary); margin-bottom: 8px;">Dual Lands:</div>
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

      return `<button onclick="${isAvailable ? `window.handSimulator.quickFetchBasic('${type}', '${fetchlandCard.name}')` : 'void(0)'}"
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
        <h3 style="margin: 0; color: var(--text-primary);">🏞️ ${fetchlandCard.name}</h3>
        ${options.fromRightClick ? '<span style="margin-left: 10px; font-size: 12px; color: var(--text-muted);">(Right-click)</span>' : ''}
      </div>

      ${suggestions ? `<div style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; margin-bottom: 15px; font-size: 12px; color: var(--text-secondary);">
        💡 ${suggestions}
      </div>` : ''}

      ${dualLandButtons}

      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; font-weight: bold; color: var(--text-primary); margin-bottom: 8px;">Basic Lands:</div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
          ${typeButtons}
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
        <button onclick="window.handSimulator.showEnhancedFetchSearch('${fetchlandCard.name}')"
                style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          🔍 Advanced Search
        </button>
        <button onclick="window.handSimulator.showManaBaseAnalysis()"
                style="background: #6f42c1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          📊 Mana Base
        </button>
        <button onclick="window.handSimulator.closeFetchlandQuickSelect()"
                style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ❌ Cancel
        </button>
      </div>

      <div style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">
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
  }


  showFullFetchSearch(fetchlandName) {
    this.closeFetchlandQuickSelect();
    // Use the existing tutor interface but specify it's for a fetchland
    // Determine if this fetchland produces tapped lands
    const shouldEnterTapped = this.fetchlandProducesTaskedLands(fetchlandName);
    this.showTutorInterface('land', fetchlandName, {
      description: `Search your library for a land card and put it onto the battlefield${shouldEnterTapped ? ' tapped' : ''}. Then shuffle your library.`,
      destination: 'battlefield',
      tapped: shouldEnterTapped,
      restrictions: ['basic'],
      isFetchlandSacrifice: true,
      fetchlandName: fetchlandName
    });
  }

  closeFetchlandQuickSelect() {
    document.getElementById('fetchlandQuickSelect')?.remove();
  }

  getAvailableDualLands(library, types) {
    // Find dual lands that produce the specified mana types
    const dualLands = [];

    library.forEach(card => {
      const cardName = card.name.toLowerCase();
      const cardType = (card.type_line || card.type || '').toLowerCase();

      // Check if it's a land
      if (!cardType.includes('land')) return;

      // Check if it's a dual land that produces the right colors
      // Common dual land patterns: "Volcanic Island", "Tropical Island", "Taiga", etc.
      const isDualLand = !this.isBasicLand(card.name) &&
                         (cardName.includes('volcanic') || cardName.includes('tropical') ||
                          cardName.includes('underground') || cardName.includes('badlands') ||
                          cardName.includes('bayou') || cardName.includes('savannah') ||
                          cardName.includes('scrubland') || cardName.includes('taiga') ||
                          cardName.includes('tundra') || cardName.includes('plateau'));

      if (isDualLand) {
        // Check if this dual produces the right colors
        const producesRightColors = types.some(type => this.isLandOfType(card, type));
        if (producesRightColors) {
          dualLands.push(card);
        }
      }
    });

    return dualLands;
  }

  quickFetchSpecificLand(landId, fetchlandName) {
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const battlefield = currentPlayer.battlefield;

    // Find the specific land by ID
    const landIndex = library.findIndex(card => card.id === landId);
    if (landIndex === -1) {
      this.showToast('Land not found in library', 'error');
      return;
    }

    const land = library[landIndex];

    // Pay life cost for fetchlands
    const lifeCost = this.getFetchlandLifeCost(fetchlandName);
    if (lifeCost > 0) {
      currentPlayer.gameStats.life -= lifeCost;
      this.logAction(`Pay ${lifeCost} life for ${fetchlandName}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
    }

    // Sacrifice the fetchland
    const fetchlandIndex = battlefield.lands.findIndex(l => l.name === fetchlandName);
    if (fetchlandIndex >= 0) {
      const sacrificedFetchland = battlefield.lands.splice(fetchlandIndex, 1)[0];
      const graveyard = this.activePlayer === 'player' ? this.graveyard : this.opponent.graveyard;
      graveyard.push(sacrificedFetchland);
      this.logAction(`Sacrifice ${fetchlandName}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
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

    this.logAction(`${fetchlandName}: Found ${land.name}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
    this.showToast(`Fetched ${land.name}${shouldEnterTapped ? ' (tapped)' : ''}`, 'success');

    // Update displays
    this.closeFetchlandQuickSelect();
    this.updateBattlefieldDisplay();
    this.updateUI();
  }

  // =====================================================
  // WASTELAND LOGIC
  // =====================================================

  showWastelandTargetSelectById(wastelandId) {
    const wasteland = this.battlefield.lands.find(land => land.id === wastelandId);
    if (!wasteland) {
      this.showToast('Wasteland not found', 'error');
      return;
    }
    this.showWastelandTargetSelect(wasteland);
  }

  showWastelandTargetSelect(wastelandCard) {
    // Get all nonbasic lands on both battlefields
    const playerNonbasicLands = this.battlefield.lands.filter(land => !this.isBasicLand(land.name));
    const opponentNonbasicLands = this.opponent.battlefield.lands.filter(land => !this.isBasicLand(land.name));

    const allTargets = [
      ...playerNonbasicLands.map(land => ({ ...land, owner: 'player' })),
      ...opponentNonbasicLands.map(land => ({ ...land, owner: 'opponent' }))
    ];

    if (allTargets.length === 0) {
      this.showToast('No nonbasic lands to target', 'warning');
      return;
    }

    // Remove any existing wasteland popup
    document.getElementById('wastelandTargetSelect')?.remove();

    const popup = document.createElement('div');
    popup.id = 'wastelandTargetSelect';
    popup.className = 'wasteland-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border: 2px solid #8b4513;
      border-radius: var(--border-radius);
      padding: var(--space-4);
      z-index: 3000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 350px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      animation: fetchlandSlideIn 0.2s ease-out;
    `;

    const targetButtons = allTargets.map(target => {
      const ownerLabel = target.owner === 'player' ? '🟢 Your' : '🔴 Opponent';
      return `
        <button onclick="window.handSimulator.activateWasteland('${this.escapeJs(wastelandCard.id)}', '${this.escapeJs(target.id)}', '${target.owner}')"
                style="background: #dc3545; color: white; border: none; padding: 12px 16px; margin: 5px; border-radius: 6px; cursor: pointer; font-size: 14px; width: calc(100% - 10px); text-align: left; display: flex; justify-content: space-between; align-items: center;"
                title="Destroy ${target.name}">
          <span>${target.name}</span>
          <span style="font-size: 12px; opacity: 0.9;">${ownerLabel}</span>
        </button>
      `;
    }).join('');

    popup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: var(--text-primary);">💥 ${wastelandCard.name}</h3>
      </div>

      <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 14px; text-align: center;">
        {T}, Sacrifice: Destroy target nonbasic land
      </p>

      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-align: center;">
          Select a nonbasic land to destroy:
        </div>
        ${targetButtons}
      </div>

      <div style="display: flex; justify-content: center;">
        <button onclick="window.handSimulator.closeWastelandTargetSelect()"
                style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ❌ Cancel
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add keyboard listener for Escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        this.closeWastelandTargetSelect();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  activateWasteland(wastelandId, targetLandId, targetOwner) {
    // Find the wasteland on battlefield
    const wastelandIndex = this.battlefield.lands.findIndex(land => land.id === wastelandId);
    if (wastelandIndex === -1) {
      this.showToast('Wasteland not found on battlefield', 'error');
      return;
    }

    const wasteland = this.battlefield.lands[wastelandIndex];

    // Check if wasteland is tapped
    if (wasteland.tapped) {
      this.showToast('Wasteland is already tapped', 'warning');
      return;
    }

    // Find the target land
    const targetBattlefield = targetOwner === 'player' ? this.battlefield : this.opponent.battlefield;
    const targetGraveyard = targetOwner === 'player' ? this.graveyard : this.opponent.graveyard;
    const targetIndex = targetBattlefield.lands.findIndex(land => land.id === targetLandId);

    if (targetIndex === -1) {
      this.showToast('Target land not found', 'error');
      return;
    }

    const targetLand = targetBattlefield.lands[targetIndex];

    // Verify it's nonbasic
    if (this.isBasicLand(targetLand.name)) {
      this.showToast('Cannot target basic lands with Wasteland', 'warning');
      return;
    }

    // Tap and sacrifice Wasteland
    this.battlefield.lands.splice(wastelandIndex, 1);
    this.graveyard.push(wasteland);

    // Destroy target land (move to its owner's graveyard)
    targetBattlefield.lands.splice(targetIndex, 1);
    targetGraveyard.push(targetLand);

    const ownerText = targetOwner === 'player' ? 'your' : "opponent's";
    this.logAction(`${wasteland.name} destroys ${ownerText} ${targetLand.name}`, 'You', false);
    this.showToast(`💥 ${wasteland.name} destroys ${targetLand.name}`, 'success');

    // Update UI - need to update both battlefield displays and graveyard
    this.updateAllDisplays();
    this.closeWastelandTargetSelect();
  }

  closeWastelandTargetSelect() {
    document.getElementById('wastelandTargetSelect')?.remove();
  }

  // =====================================================
  // SURVEIL LOGIC
  // =====================================================

  showSurveilUI(cardName, amount = 1, isOpponent = false) {
    const player = isOpponent ? this.opponent : this;
    const library = player.library;

    if (library.length === 0) {
      this.showToast('No cards in library to surveil', 'warning');
      return;
    }

    // Get the top N cards
    const surveilCards = library.slice(0, Math.min(amount, library.length));

    // Remove any existing surveil popup
    document.getElementById('surveilUI')?.remove();

    const popup = document.createElement('div');
    popup.id = 'surveilUI';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border: 2px solid var(--accent-color);
      border-radius: var(--border-radius);
      padding: var(--space-4);
      z-index: 3000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 400px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      animation: fetchlandSlideIn 0.2s ease-out;
    `;

    // Create card display with checkboxes for graveyard
    const cardButtons = surveilCards.map((card, index) => {
      return `
        <div id="surveil-card-${card.id}"
             draggable="true"
             class="surveil-draggable-card"
             style="display: flex; align-items: center; padding: 10px; margin: 5px 0; background: var(--bg-secondary); border-radius: 6px; border: 2px solid transparent; cursor: move;"
             data-card-id="${card.id}"
             data-to-graveyard="false"
             ondragstart="window.handSimulator.handleSurveilDragStart(event, '${this.escapeJs(card.id)}')"
             ondragover="window.handSimulator.handleSurveilDragOver(event)"
             ondrop="window.handSimulator.handleSurveilDrop(event, '${this.escapeJs(card.id)}')"
             ondragend="window.handSimulator.handleSurveilDragEnd(event)">
          <span style="margin-right: 8px; color: var(--text-muted); cursor: move;">⋮⋮</span>
          <input type="checkbox" id="surveil-check-${card.id}" onchange="window.handSimulator.toggleSurveilGraveyard('${this.escapeJs(card.id)}')" style="width: 20px; height: 20px; margin-right: 12px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: var(--text-primary);">${card.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${card.type || 'Unknown'}</div>
          </div>
          <button onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')" style="background: var(--accent-color); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 10px;">
            👁️ View
          </button>
        </div>
      `;
    }).join('');

    popup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: var(--text-primary);">🔍 Surveil ${amount}</h3>
      </div>

      <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 14px; text-align: center;">
        Check cards to put into graveyard. Unchecked cards go back on top.
      </p>

      <div id="surveilCardList" style="margin-bottom: 20px;">
        ${cardButtons}
      </div>

      <div style="margin-bottom: 15px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 5px;">Order remaining cards (drag to reorder):</div>
        <div id="surveilOrderHint" style="font-size: 11px; color: var(--text-secondary);">Cards will go back on top in the order shown above</div>
      </div>

      <div style="display: flex; justify-content: center; gap: 10px;">
        <button onclick="window.handSimulator.completeSurveil(${isOpponent})"
                style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
          ✓ Done
        </button>
        <button onclick="window.handSimulator.closeSurveilUI()"
                style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
          ❌ Cancel
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add escape key listener
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        this.closeSurveilUI();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  toggleSurveilGraveyard(cardId) {
    const cardDiv = document.querySelector(`#surveil-card-${cardId}`);
    const checkbox = document.getElementById(`surveil-check-${cardId}`);

    if (!cardDiv || !checkbox) return;

    const toGraveyard = checkbox.checked;
    cardDiv.dataset.toGraveyard = toGraveyard;

    // Visual feedback
    if (toGraveyard) {
      cardDiv.style.borderColor = '#dc3545';
      cardDiv.style.background = '#3d1e1e';
      cardDiv.style.opacity = '0.6';
    } else {
      cardDiv.style.borderColor = 'transparent';
      cardDiv.style.background = 'var(--bg-secondary)';
      cardDiv.style.opacity = '1';
    }
  }

  handleSurveilDragStart(event, cardId) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
    event.target.style.opacity = '0.5';
  }

  handleSurveilDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  handleSurveilDrop(event, targetCardId) {
    event.preventDefault();
    event.stopPropagation();

    const draggedCardId = event.dataTransfer.getData('text/plain');
    if (draggedCardId === targetCardId) return;

    const container = document.getElementById('surveilCardList');
    const draggedElement = document.getElementById(`surveil-card-${draggedCardId}`);
    const targetElement = document.getElementById(`surveil-card-${targetCardId}`);

    if (!draggedElement || !targetElement || !container) return;

    // Get all cards in order
    const allCards = Array.from(container.children);
    const draggedIndex = allCards.indexOf(draggedElement);
    const targetIndex = allCards.indexOf(targetElement);

    // Reorder
    if (draggedIndex < targetIndex) {
      targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
    } else {
      targetElement.parentNode.insertBefore(draggedElement, targetElement);
    }

    return false;
  }

  handleSurveilDragEnd(event) {
    event.target.style.opacity = '';
    // Remove any drag styling from all cards
    document.querySelectorAll('.surveil-draggable-card').forEach(card => {
      card.style.opacity = card.dataset.toGraveyard === 'true' ? '0.6' : '1';
    });
  }

  completeSurveil(isOpponent = false) {
    const player = isOpponent ? this.opponent : this;
    const cardList = document.getElementById('surveilCardList');
    if (!cardList) return;

    const cardDivs = Array.from(cardList.querySelectorAll('[data-card-id]'));
    const toGraveyard = [];
    const toTop = [];

    // Separate cards based on checkbox state
    cardDivs.forEach(div => {
      const cardId = div.dataset.cardId;
      const shouldGraveyard = div.dataset.toGraveyard === 'true';
      const card = player.library.find(c => c.id === cardId);

      if (card) {
        if (shouldGraveyard) {
          toGraveyard.push(card);
        } else {
          toTop.push(card);
        }
      }
    });

    // Remove all surveiled cards from library
    const surveiledIds = [...toGraveyard, ...toTop].map(c => c.id);
    player.library = player.library.filter(c => !surveiledIds.includes(c.id));

    // Add cards to graveyard
    toGraveyard.forEach(card => {
      player.graveyard.push(card);
    });

    // Put remaining cards back on top (in current order)
    player.library = [...toTop, ...player.library];

    // Log the action
    const graveyardCount = toGraveyard.length;
    const topCount = toTop.length;
    const message = graveyardCount > 0 ?
      `Surveiled: ${graveyardCount} to graveyard, ${topCount} on top` :
      `Surveiled: all ${topCount} cards back on top`;

    this.logAction(message, isOpponent ? 'Opponent' : 'You', false);
    this.showToast(message, 'success');

    // Update UI
    this.updateAllDisplays();
    this.closeSurveilUI();
  }

  closeSurveilUI() {
    document.getElementById('surveilUI')?.remove();
  }

  // =====================================================
  // DELVE UI
  // =====================================================

  showDelveUI(cardId, cardName) {
    if (this.graveyard.length === 0) {
      this.showToast('No cards in graveyard to delve', 'warning');
      return;
    }

    // Remove any existing delve popup
    document.getElementById('delveUI')?.remove();

    const popup = document.createElement('div');
    popup.id = 'delveUI';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border: 2px solid var(--accent-color);
      border-radius: var(--border-radius);
      padding: var(--space-4);
      z-index: 3000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 500px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    `;

    const cardButtons = this.graveyard.map((card) => {
      return `
        <div id="delve-card-${card.id}" style="display: flex; align-items: center; padding: 10px; margin: 5px 0; background: var(--bg-secondary); border-radius: 6px; border: 2px solid transparent;" data-card-id="${card.id}" data-will-exile="false">
          <input type="checkbox" id="delve-check-${card.id}" onchange="window.handSimulator.toggleDelveExile('${this.escapeJs(card.id)}')" style="width: 20px; height: 20px; margin-right: 12px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: var(--text-primary);">${card.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${card.type || 'Unknown'}</div>
          </div>
          <button onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')" style="background: var(--accent-color); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 10px;">
            👁️ View
          </button>
        </div>
      `;
    }).join('');

    popup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: var(--text-primary);">💀 Delve - ${this.escapeHtml(cardName)}</h3>
      </div>

      <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 14px; text-align: center;">
        Select cards to exile from graveyard. Each exiled card reduces the cost by {1}.
      </p>

      <div id="delveCardList" style="margin-bottom: 20px;">
        ${cardButtons}
      </div>

      <div style="margin-bottom: 15px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px; text-align: center;">
        <div style="font-size: 14px; color: var(--text-primary); font-weight: bold;">
          Cards to exile: <span id="delveCount" style="color: var(--accent-color);">0</span>
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 10px;">
        <button onclick="window.handSimulator.completeDelve('${this.escapeJs(cardId)}', '${this.escapeJs(cardName)}')"
                style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
          ✓ Cast Spell
        </button>
        <button onclick="window.handSimulator.closeDelveUI()"
                style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
          ❌ Cancel
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add escape key listener
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        this.closeDelveUI();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  toggleDelveExile(cardId) {
    const cardDiv = document.querySelector(`#delve-card-${cardId}`);
    const checkbox = document.getElementById(`delve-check-${cardId}`);

    if (!cardDiv || !checkbox) return;

    const willExile = checkbox.checked;
    cardDiv.dataset.willExile = willExile;

    // Visual feedback
    if (willExile) {
      cardDiv.style.borderColor = '#9333ea';
      cardDiv.style.background = '#2e1065';
    } else {
      cardDiv.style.borderColor = 'transparent';
      cardDiv.style.background = 'var(--bg-secondary)';
    }

    // Update count
    this.updateDelveCount();
  }

  updateDelveCount() {
    const cardList = document.getElementById('delveCardList');
    if (!cardList) return;

    const count = Array.from(cardList.querySelectorAll('[data-will-exile="true"]')).length;
    const countEl = document.getElementById('delveCount');
    if (countEl) {
      countEl.textContent = count;
    }
  }

  completeDelve(cardId, cardName) {
    const cardList = document.getElementById('delveCardList');
    if (!cardList) return;

    const cardDivs = Array.from(cardList.querySelectorAll('[data-card-id]'));
    const toExile = [];

    // Collect cards marked for exile
    cardDivs.forEach(div => {
      const graveyardCardId = div.dataset.cardId;
      const shouldExile = div.dataset.willExile === 'true';
      const card = this.graveyard.find(c => c.id === graveyardCardId);

      if (card && shouldExile) {
        toExile.push(card);
      }
    });

    // Move cards from graveyard to exile
    toExile.forEach(card => {
      const index = this.graveyard.findIndex(c => c.id === card.id);
      if (index !== -1) {
        this.graveyard.splice(index, 1);
        this.exile.push(card);
      }
    });

    // Now play the card from hand
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;
    const cardIndex = currentHand.findIndex((c, idx) => {
      const actualId = c.id || `${c.name}_${idx}`;
      return actualId === cardId;
    });

    if (cardIndex !== -1) {
      const card = currentHand[cardIndex];
      this.playCard(card);
      currentHand.splice(cardIndex, 1);

      const exileCount = toExile.length;
      this.showToast(`Cast ${cardName} with Delve (exiled ${exileCount} cards)`, 'success');
      this.logAction(`Cast ${cardName} with Delve (exiled ${exileCount} cards)`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
    }

    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateUI();
    this.closeDelveUI();
  }

  closeDelveUI() {
    document.getElementById('delveUI')?.remove();
  }

  // =====================================================
  // ENHANCED FETCHLAND HELPER FUNCTIONS
  // =====================================================

  getAvailableLandsInLibrary(library, types) {
    const available = {};
    types.forEach(type => {
      available[type] = library.filter(card => this.isLandOfType(card, type)).length;
    });
    return available;
  }

  isLandOfType(card, basicType) {
    if (!card.type || !card.type.toLowerCase().includes('land')) {
      return false;
    }

    const cardName = card.name.toLowerCase();
    const cardType = card.type.toLowerCase();

    // Check for exact basic land names first
    if (cardName === basicType) {
      return true;
    }

    // Handle dual lands and special lands by name patterns
    switch (basicType) {
      case 'plains':
        return this.isWhiteLand(cardName, cardType);
      case 'island':
        return this.isBlueLand(cardName, cardType);
      case 'swamp':
        return this.isBlackLand(cardName, cardType);
      case 'mountain':
        return this.isRedLand(cardName, cardType);
      case 'forest':
        return this.isGreenLand(cardName, cardType);
      default:
        return false;
    }
  }

  isBasicLand(cardName) {
    const name = cardName.toLowerCase();
    const basicLands = ['plains', 'island', 'swamp', 'mountain', 'forest'];
    return basicLands.includes(name);
  }

  isWhiteLand(name, type) {
    const whiteLands = [
      'plains', 'scrubland', 'plateau', 'savannah', 'tundra', 'badlands',
      'temple garden', 'godless shrine', 'sacred foundry', 'hallowed fountain',
      'temple of silence', 'temple of triumph', 'temple of plenty', 'temple of enlightenment',
      'coastal tower', 'elfhame palace', 'salt marsh', 'urborg volcano'
    ];
    return whiteLands.some(land => name.includes(land)) ||
           type.includes('plains') ||
           (name.includes('white') && type.includes('land'));
  }

  isBlueLand(name, type) {
    const blueLands = [
      'island', 'underground sea', 'volcanic island', 'tropical island', 'tundra',
      'hallowed fountain', 'steam vents', 'breeding pool', 'watery grave',
      'temple of deceit', 'temple of mystery', 'temple of enlightenment', 'temple of epiphany',
      'coastal tower', 'salt marsh', 'saprazzan skies', 'waterview'
    ];
    return blueLands.some(land => name.includes(land)) ||
           type.includes('island') ||
           (name.includes('blue') && type.includes('land'));
  }

  isBlackLand(name, type) {
    const blackLands = [
      'swamp', 'scrubland', 'badlands', 'bayou', 'underground sea',
      'godless shrine', 'blood crypt', 'overgrown tomb', 'watery grave',
      'temple of silence', 'temple of malice', 'temple of deceit', 'temple of malady',
      'urborg volcano', 'salt marsh', 'shadowblood ridge', 'tainted field'
    ];
    return blackLands.some(land => name.includes(land)) ||
           type.includes('swamp') ||
           (name.includes('black') && type.includes('land'));
  }

  isRedLand(name, type) {
    const redLands = [
      'mountain', 'plateau', 'badlands', 'taiga', 'volcanic island',
      'sacred foundry', 'blood crypt', 'steam vents', 'stomping ground',
      'temple of triumph', 'temple of malice', 'temple of abandon', 'temple of epiphany',
      'urborg volcano', 'shadowblood ridge', 'barbarian ring', 'ghitu encampment'
    ];
    return redLands.some(land => name.includes(land)) ||
           type.includes('mountain') ||
           (name.includes('red') && type.includes('land'));
  }

  isGreenLand(name, type) {
    const greenLands = [
      'forest', 'savannah', 'taiga', 'bayou', 'tropical island',
      'temple garden', 'overgrown tomb', 'breeding pool', 'stomping ground',
      'temple of plenty', 'temple of malady', 'temple of mystery', 'temple of abandon',
      'elfhame palace', 'treetop village', 'tranquil thicket', 'wirewood lodge'
    ];
    return greenLands.some(land => name.includes(land)) ||
           type.includes('forest') ||
           (name.includes('green') && type.includes('land'));
  }

  getBasicLandIcon(type) {
    const icons = {
      'plains': '☀️',
      'island': '🌊',
      'swamp': '🌑',
      'mountain': '⛰️',
      'forest': '🌲'
    };
    return icons[type] || '🏞️';
  }

  analyzeManaBase() {
    const battlefield = this.battlefield;
    const lands = battlefield.lands;
    const manaBase = {
      white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0
    };

    lands.forEach(land => {
      if (this.isWhiteLand(land.name.toLowerCase(), land.type?.toLowerCase() || '')) manaBase.white++;
      if (this.isBlueLand(land.name.toLowerCase(), land.type?.toLowerCase() || '')) manaBase.blue++;
      if (this.isBlackLand(land.name.toLowerCase(), land.type?.toLowerCase() || '')) manaBase.black++;
      if (this.isRedLand(land.name.toLowerCase(), land.type?.toLowerCase() || '')) manaBase.red++;
      if (this.isGreenLand(land.name.toLowerCase(), land.type?.toLowerCase() || '')) manaBase.green++;
    });

    return manaBase;
  }

  getFetchSuggestions(availableLands, manaBase) {
    const totalLands = Object.values(manaBase).reduce((a, b) => a + b, 0);
    if (totalLands === 0) return 'Consider your mana curve when choosing';

    // Find the color with lowest representation
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
  }

  storeFetchChoice(fetchlandName, basicType) {
    if (!this.fetchChoiceHistory) {
      this.fetchChoiceHistory = {};
    }

    if (!this.fetchChoiceHistory[fetchlandName]) {
      this.fetchChoiceHistory[fetchlandName] = [];
    }

    this.fetchChoiceHistory[fetchlandName].push({
      type: basicType,
      timestamp: Date.now(),
      gameState: { turn: this.turnState.turn, phase: this.turnState.phase }
    });

    // Keep only last 5 choices per fetchland
    if (this.fetchChoiceHistory[fetchlandName].length > 5) {
      this.fetchChoiceHistory[fetchlandName].shift();
    }
  }

  showFetchAnimation(landName) {
    // Create a brief animation showing the land being fetched
    const animation = document.createElement('div');
    animation.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: bold;
      z-index: 4000;
      animation: fetchSlideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    animation.textContent = `🏞️ Fetching ${landName}...`;
    document.body.appendChild(animation);

    setTimeout(() => {
      animation.style.animation = 'fetchSlideOut 0.3s ease-in forwards';
      setTimeout(() => animation.remove(), 300);
    }, 1500);

    // Add animation CSS if not present
    if (!document.getElementById('fetchAnimationStyles')) {
      const style = document.createElement('style');
      style.id = 'fetchAnimationStyles';
      style.textContent = `
        @keyframes fetchSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fetchSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  showEnhancedFetchSearch(fetchlandName) {
    this.closeFetchlandQuickSelect();

    // Enhanced search that shows detailed land information
    // Determine if this fetchland produces tapped lands
    const shouldEnterTapped = this.fetchlandProducesTaskedLands(fetchlandName);
    this.showTutorInterface('land', fetchlandName, {
      description: `Search your library for a land card and put it onto the battlefield${shouldEnterTapped ? ' tapped' : ''}. Then shuffle your library.`,
      destination: 'battlefield',
      tapped: shouldEnterTapped,
      restrictions: ['basic', 'fetchable'],
      isFetchlandSacrifice: true,
      fetchlandName: fetchlandName,
      enhanced: true
    });
  }

  showManaBaseAnalysis() {
    const manaBase = this.analyzeManaBase();
    const handAnalysis = this.analyzeHandManaRequirements();

    // Create mana base analysis modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); display: flex; align-items: center;
      justify-content: center; z-index: 3500;
    `;

    const colors = ['white', 'blue', 'black', 'red', 'green'];
    const icons = ['☀️', '🌊', '🌑', '⛰️', '🌲'];

    const manaChart = colors.map((color, i) => {
      const count = manaBase[color];
      const handNeeds = handAnalysis[color] || 0;
      const percentage = Object.values(manaBase).reduce((a, b) => a + b, 0) > 0 ?
                        Math.round(count / Object.values(manaBase).reduce((a, b) => a + b, 0) * 100) : 0;

      return `
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <span style="font-size: 20px; margin-right: 10px;">${icons[i]}</span>
          <span style="min-width: 60px; text-transform: capitalize;">${color}:</span>
          <div style="background: var(--bg-tertiary); border-radius: 10px; width: 100px; height: 20px; margin: 0 10px; overflow: hidden;">
            <div style="background: ${color === 'white' ? '#FFF8DC' : color === 'blue' ? '#4169E1' : color === 'black' ? '#2F2F2F' : color === 'red' ? '#DC143C' : '#228B22'}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
          </div>
          <span>${count} lands (${percentage}%)</span>
          ${handNeeds > 0 ? `<span style="margin-left: 10px; color: #ffc107; font-size: 12px;">Need: ${handNeeds}</span>` : ''}
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 500px; width: 90%;">
        <h3 style="margin: 0 0 20px 0; text-align: center;">📊 Mana Base Analysis</h3>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">Current Battlefield:</h4>
          ${manaChart}
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0;">Hand Analysis:</h4>
          <p style="margin: 0; font-size: 14px; color: var(--text-secondary);">
            ${handAnalysis.summary || 'Your hand looks balanced for the current mana base.'}
          </p>
        </div>

        <div style="text-align: center;">
          <button onclick="window.handSimulator.closeManaBaseModal(this)"
                  style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s ease;"
                  onmouseover="this.style.background='#c82333'; this.style.transform='scale(1.05)'"
                  onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'">
            ✕ Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add keyboard listener for Escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        this.closeManaBaseModal(modal.querySelector('button'));
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Add click-outside-to-close functionality
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeManaBaseModal(modal.querySelector('button'));
      }
    });
  }

  closeManaBaseModal(buttonElement) {
    // Find the modal overlay (should be the grandparent of the button)
    const modal = buttonElement.closest('.modal-overlay');
    if (modal) {
      // Add fade out animation
      modal.style.transition = 'opacity 0.3s ease';
      modal.style.opacity = '0';

      // Remove the modal after animation completes
      setTimeout(() => {
        modal.remove();
      }, 300);
    }

    // Ensure focus returns to the main game window
    const gameContainer = document.querySelector('.game-container') || document.body;
    gameContainer.focus();

    // Log the action
    this.logAction('Mana base analysis closed', 'You', false);
  }

  analyzeHandManaRequirements() {
    const requirements = { white: 0, blue: 0, black: 0, red: 0, green: 0 };
    let summary = '';

    this.hand.forEach(card => {
      if (card.cost) {
        const cost = card.cost.toLowerCase();
        if (cost.includes('w')) requirements.white++;
        if (cost.includes('u')) requirements.blue++;
        if (cost.includes('b')) requirements.black++;
        if (cost.includes('r')) requirements.red++;
        if (cost.includes('g')) requirements.green++;
      }
    });

    const totalRequirements = Object.values(requirements).reduce((a, b) => a + b, 0);
    if (totalRequirements === 0) {
      summary = 'No colored mana requirements in current hand.';
    } else {
      const mainColors = Object.entries(requirements)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([color, _]) => color);

      if (mainColors.length === 1) {
        summary = `Hand is primarily ${mainColors[0]} - consider fetching ${this.getBasicForColor(mainColors[0])}.`;
      } else if (mainColors.length === 2) {
        summary = `Hand needs ${mainColors[0]} and ${mainColors[1]} - prioritize the missing color.`;
      }
    }

    return { ...requirements, summary };
  }

  getBasicForColor(color) {
    const mapping = {
      white: 'Plains',
      blue: 'Island',
      black: 'Swamp',
      red: 'Mountain',
      green: 'Forest'
    };
    return mapping[color] || 'basic land';
  }

  showFetchlandQuickSelectById(cardId, fromRightClick = false) {
    const card = this.findBattlefieldCard(cardId);
    if (!card) return;

    this.showFetchlandQuickSelect(card, { fromRightClick });
  }

  activateLastFetchland() {
    // Find the most recently played fetchland on battlefield
    const fetchlands = this.battlefield.lands.filter(land => this.isFetchland(land.name));
    if (fetchlands.length === 0) {
      this.showToast('No fetchlands on battlefield', 'warning');
      return;
    }

    // Get the most recent one (assuming last in array is most recent)
    const lastFetchland = fetchlands[fetchlands.length - 1];
    this.showFetchlandQuickSelect(lastFetchland, { fromKeyboard: true });
  }

  quickFetchByType(basicType) {
    // Find any available fetchland and auto-fetch the specified type
    const fetchlands = this.battlefield.lands.filter(land => {
      if (!this.isFetchland(land.name)) return false;
      const types = this.getFetchlandTypes(land.name);
      return types.includes(basicType);
    });

    if (fetchlands.length === 0) {
      this.showToast(`No fetchlands available for ${basicType}`, 'warning');
      return;
    }

    // Use the first available fetchland
    const fetchland = fetchlands[0];
    this.quickFetchBasic(basicType, fetchland.name);
  }

  quickFetchBasic(basicType, fetchlandName) {
    // Automatically fetch the specified basic land type
    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;

    // Find a basic land of the specified type in library
    const targetLand = library.find(card => {
      return this.isLandOfType(card, basicType) && this.isBasicLand(card.name);
    });

    if (!targetLand) {
      this.showToast(`No ${basicType} found in library`, 'warning');
      return;
    }

    // Find the fetchland on battlefield by name AND sacrifice it
    const fetchlandIndex = this.battlefield.lands.findIndex(land => land.name === fetchlandName);
    if (fetchlandIndex === -1) {
      this.showToast(`${fetchlandName} not found on battlefield`, 'error');
      return;
    }

    // Pay the life cost (most fetchlands cost 1 life)
    const lifeCost = this.getFetchlandLifeCost(fetchlandName);
    if (lifeCost > 0) {
      this.gameStats.life -= lifeCost;
      this.logAction(`Pay ${lifeCost} life for ${fetchlandName}`, 'You', false);
    }

    // Sacrifice the fetchland to graveyard
    const fetchland = this.battlefield.lands.splice(fetchlandIndex, 1)[0];
    this.graveyard.push(fetchland);

    // Remove the found land from library
    const libraryIndex = library.findIndex(card => card.id === targetLand.id);
    if (libraryIndex !== -1) {
      library.splice(libraryIndex, 1);
    }

    // Put the land onto battlefield - tapped status depends on fetchland type
    const shouldEnterTapped = this.fetchlandProducesTaskedLands(fetchlandName);
    targetLand.tapped = shouldEnterTapped;
    this.battlefield.lands.push(targetLand);

    // Shuffle library
    this.shuffleLibrary();

    // Close the fetchland popup
    this.closeFetchlandQuickSelect();

    // Log the action
    const tappedStatus = shouldEnterTapped ? 'enters tapped' : 'enters untapped';
    this.logAction(`${fetchlandName} fetches ${targetLand.name} (${tappedStatus})`, 'You', false);

    // Update displays
    this.updateBattlefieldDisplay();
    this.updateGraveyardDisplay();
    this.updateUI(); // Update life total display

    const lifeCostText = lifeCost > 0 ? `, paid ${lifeCost} life` : '';
    this.showToast(`Fetched ${targetLand.name} with ${fetchlandName} (${tappedStatus}${lifeCostText})`, 'success');
  }

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
  }

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

    // Default to tapped for unknown fetchlands (safer assumption)
    return true;
  }

  isFetchableLand(cardName) {
    const name = cardName.toLowerCase();

    // Basic lands
    if (name === 'island' || name === 'mountain' || name === 'forest' ||
        name === 'plains' || name === 'swamp') {
      return true;
    }

    // Dual lands (original dual lands)
    const dualLands = [
      'volcanic island', 'underground sea', 'badlands', 'taiga', 'savannah',
      'scrubland', 'tropical island', 'tundra', 'bayou', 'plateau'
    ];
    if (dualLands.includes(name)) {
      return true;
    }

    // Shock lands
    const shockLands = [
      'steam vents', 'watery grave', 'blood crypt', 'stomping ground', 'temple garden',
      'godless shrine', 'breeding pool', 'sacred foundry', 'overgrown tomb', 'hallowed fountain'
    ];
    if (shockLands.includes(name)) {
      return true;
    }

    // Battle lands (from Battle for Zendikar)
    const battleLands = [
      'sunken hollow', 'smoldering marsh', 'cinder glade', 'canopy vista', 'prairie stream'
    ];
    if (battleLands.includes(name)) {
      return true;
    }

    // Triomes (from Ikoria)
    const triomes = [
      'ketria triome', 'indatha triome', 'raugrin triome', 'zagoth triome', 'savai triome'
    ];
    if (triomes.includes(name)) {
      return true;
    }

    // Fetchlands (even though they fetch themselves, they should be findable by other fetchlands)
    const fetchlands = [
      'flooded strand', 'polluted delta', 'bloodstained mire', 'wooded foothills', 'windswept heath',
      'scalding tarn', 'verdant catacombs', 'arid mesa', 'misty rainforest', 'marsh flats',
      'prismatic vista'
    ];
    if (fetchlands.includes(name)) {
      return true;
    }

    return false;
  }

  cardMatchesTutorCriteria(card, cardType, restrictions) {

    // Check card type match
    if (cardType !== 'any') {
      const actualType = this.getCardMainType(card.type).toLowerCase();
      if (actualType !== cardType) {
        return false;
      }
    }

    // Check restrictions
    for (const restriction of restrictions) {
      switch (restriction) {
        case 'basic': {
          // For fetchlands, check if it's a fetchable land by name (since XML doesn't have detailed types)
          if (!card.type) {
            return false;
          }
          const cardTypeLower = card.type.toLowerCase();
          if (!cardTypeLower.includes('land')) {
            return false;
          }

          const isFetchableLand = this.isFetchableLand(card.name);
          if (!isFetchableLand) {
            return false;
          }
          break;
        }
        case 'nonbasic':
          if (card.type && card.type.toLowerCase().includes('basic')) return false;
          break;
        case 'creature':
          if (this.getCardMainType(card.type).toLowerCase() !== 'creature') return false;
          break;
        case 'instant':
          if (this.getCardMainType(card.type).toLowerCase() !== 'instant') return false;
          break;
        case 'sorcery':
          if (this.getCardMainType(card.type).toLowerCase() !== 'sorcery') return false;
          break;
      }
    }

    return true;
  }

  createTutorModal(validCards, cardType, source, options = {}) {
    let modal = document.getElementById('tutorModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'tutorModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const amount = options.amount || 1;
    const maxSelections = amount;

    const modalContent = `
      <div style="background: var(--bg-primary); border-radius: var(--border-radius); padding: var(--space-4); max-width: 1000px; width: 95%; max-height: 80vh; overflow-y: auto;">
        <h3>${source}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-3);">
          ${options.description}
        </p>

        <div style="margin-bottom: var(--space-3);">
          <h4 style="margin-bottom: var(--space-2);">
            Library Search - Select ${amount > 1 ? `up to ${amount}` : 'a'} ${cardType}${amount > 1 ? ' cards' : ' card'}:
            <span id="tutorSelectionCount" style="color: var(--accent-color);">(0/${maxSelections} selected)</span>
          </h4>
          <div id="tutorCards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-2); margin-bottom: var(--space-3); max-height: 400px; overflow-y: auto;">
            ${validCards.map((card, index) => `
              <div class="tutor-card" data-card-index="${index}" onclick="window.handSimulator.toggleTutorCardSelection(${index})" style="
                border: 2px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--space-2);
                background: var(--bg-secondary);
                cursor: pointer;
                text-align: center;
                transition: all 0.2s ease;
              ">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 12px;">${card.name}</div>
                <div style="font-size: 10px; color: var(--text-secondary);">${card.cost || ''}</div>
                <div style="font-size: 9px; color: var(--text-muted);">${this.getCardMainType(card.type)}</div>
                <div class="selection-indicator" style="
                  position: absolute;
                  top: 4px;
                  right: 4px;
                  background: var(--success);
                  color: white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: none;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                ">✓</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; gap: var(--space-2); justify-content: space-between; align-items: center;">
          <div style="color: var(--text-muted); font-size: 12px;">
            ${validCards.length} cards available
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button onclick="window.handSimulator.cancelTutor()"
                    style="background: var(--error); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius);">
              Cancel
            </button>
            <button onclick="window.handSimulator.finishTutor('${source}')"
                    style="background: #007bff; color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--border-radius); cursor: pointer;">
              Search
            </button>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Store tutor state
    this.tutorState = {
      validCards: [...validCards],
      selectedIndices: [],
      maxSelections: maxSelections,
      source: source,
      options: options,
      cardType: cardType
    };
  }

  toggleTutorCardSelection(cardIndex) {
    if (!this.tutorState) {
      return;
    }

    const selectedIndices = this.tutorState.selectedIndices;
    const currentIndex = selectedIndices.indexOf(cardIndex);

    if (currentIndex >= 0) {
      // Deselect
      selectedIndices.splice(currentIndex, 1);
      this.updateTutorCardDisplay(cardIndex, false);
    } else {
      // Select (if under limit)
      if (selectedIndices.length < this.tutorState.maxSelections) {
        selectedIndices.push(cardIndex);
        this.updateTutorCardDisplay(cardIndex, true);
      } else {
        this.showToast(`Maximum ${this.tutorState.maxSelections} selections allowed`, 'warning');
      }
    }

    // Update counter
    const counter = document.getElementById('tutorSelectionCount');
    if (counter) {
      counter.textContent = `(${selectedIndices.length}/${this.tutorState.maxSelections} selected)`;
    }

    // Update button text from "Search" to "OK" when something is selected
    const searchButton = document.querySelector('button[onclick*="finishTutor"]');
    if (searchButton) {
      if (selectedIndices.length > 0) {
        searchButton.textContent = 'OK';
      } else {
        searchButton.textContent = 'Search';
      }
    }
  }

  updateTutorCardDisplay(cardIndex, selected) {
    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
    const indicator = cardElement?.querySelector('.selection-indicator');

    if (cardElement && indicator) {
      if (selected) {
        cardElement.style.borderColor = 'var(--success)';
        cardElement.style.backgroundColor = 'var(--success-bg, rgba(76, 175, 80, 0.1))';
        indicator.style.display = 'flex';
      } else {
        cardElement.style.borderColor = 'var(--border-color)';
        cardElement.style.backgroundColor = 'var(--bg-secondary)';
        indicator.style.display = 'none';
      }
    }
  }

  finishTutor(source) {
    if (!this.tutorState) {
      return;
    }

    const currentPlayer = this.getCurrentPlayer();
    const library = currentPlayer.library;
    const selectedCards = this.tutorState.selectedIndices.map(index => this.tutorState.validCards[index]);

    if (selectedCards.length === 0) {
      this.showToast('No cards selected', 'warning');
      return;
    }

    // Remove selected cards from library
    selectedCards.forEach(selectedCard => {
      const index = library.findIndex(card => card.id === selectedCard.id);
      if (index !== -1) {
        library.splice(index, 1);
      }
    });

    // Put cards in appropriate destination(s)
    const options = this.tutorState.options;
    console.log('finishTutor options:', options);
    console.log('Selected cards:', selectedCards.map(c => c.name));
    const battlefield = this.activePlayer === 'player' ? this.battlefield : this.opponent.battlefield;
    const hand = this.activePlayer === 'player' ? this.hand : this.opponent.hand;

    selectedCards.forEach((card, index) => {
      switch (options.destination) {
        case 'hand':
          hand.push(card);
          break;
        case 'battlefield':
          const cardType = this.getCardMainType(card.type).toLowerCase();

          // Instants and sorceries should go to graveyard, not battlefield
          if (cardType === 'instant' || cardType === 'sorcery') {
            const graveyard = this.activePlayer === 'player' ? this.graveyard : this.opponent.graveyard;
            graveyard.push(card);
          } else {
            // Set tapped status based on options for permanents
            // Initialize tapped property if it doesn't exist
            if (card.tapped === undefined) {
              card.tapped = false;
            }

            console.log(`Setting tapped status: options.tapped=${options.tapped}, card.name=${card.name}, initial card.tapped=${card.tapped}`);
            if (options.tapped === true) {
              card.tapped = true;
              console.log(`Set ${card.name} to tapped=true`);
            } else if (options.tapped === false) {
              card.tapped = false;
              console.log(`Set ${card.name} to tapped=false`);
            }
            console.log(`Final card.tapped=${card.tapped}`);
            // If options.tapped is undefined, don't modify the card's tapped status

            if (cardType === 'land') {
              battlefield.lands.push(card);
              console.log(`${card.name} added to battlefield with tapped=${card.tapped}`);
            } else if (cardType === 'creature') {
              battlefield.creatures.push(card);
            } else {
              battlefield.others.push(card);
            }
          }
          break;
        case 'both':
          // For spells like Cultivate - first card to battlefield, rest to hand
          if (index === 0) {
            if (options.tapped === true) {
              card.tapped = true;
            } else if (options.tapped === false) {
              card.tapped = false;
            }
            battlefield.lands.push(card);
          } else {
            hand.push(card);
          }
          break;
      }
    });

    // Shuffle library
    this.shuffleLibrary();

    // Handle fetchland effects if this was triggered by a fetchland
    if (options.fetchlandName) {
      // Pay life cost for true fetchlands
      const lifeCost = this.getFetchlandLifeCost(options.fetchlandName);
      if (lifeCost > 0) {
        if (this.activePlayer === 'player') {
          this.gameStats.life -= lifeCost;
        } else {
          this.opponent.gameStats.life -= lifeCost;
        }
        this.logAction(`Pay ${lifeCost} life for ${options.fetchlandName}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
      }

      // Sacrifice the fetchland
      const fetchlandIndex = battlefield.lands.findIndex(land => land.name === options.fetchlandName);
      if (fetchlandIndex >= 0) {
        const sacrificedFetchland = battlefield.lands.splice(fetchlandIndex, 1)[0];
        const graveyard = this.activePlayer === 'player' ? this.graveyard : this.opponent.graveyard;
        graveyard.push(sacrificedFetchland);
        this.logAction(`Sacrifice ${options.fetchlandName}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);
      }
    }

    // Log the action
    const cardNames = selectedCards.map(card => card.name).join(', ');
    this.logAction(`${source}: Found ${cardNames}`, this.activePlayer === 'player' ? 'You' : 'Opponent', false);

    // Clean up and update displays
    document.getElementById('tutorModal')?.remove();
    this.tutorState = null;

    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateGraveyardDisplay();
    this.updateUI(); // Update life totals and other stats
    this.showToast(`${source} complete - ${selectedCards.length} card(s) found`, 'success');
  }

  cancelTutor() {
    this.tutorState = null;
    document.getElementById('tutorModal')?.remove();
  }

  checkStateBasedActions() {
    // Check all creatures for lethal damage using the new cross-player system
    const allCreatures = this.getAllBattlefieldCreatures();

    allCreatures.forEach(creature => {
      if (creature.damage && creature.damage >= this.getCreatureToughness(creature)) {
        this.destroyCreatureByOwner(creature.id, creature.owner);
      }
    });
  }

  // =====================================================
  // GAME LOG SYSTEM
  // =====================================================

  logAction(action, player = null, automatic = false) {
    const timestamp = new Date().toLocaleTimeString();
    const playerName = player || (this.activePlayer === 'player' ? 'You' : 'Opponent');
    const actionType = automatic ? 'auto' : 'manual';

    const logEntry = {
      timestamp,
      player: playerName,
      action,
      type: actionType,
      turn: this.turnState.turnNumber,
      phase: this.turnState.phase
    };

    this.gameLog.unshift(logEntry); // Add to beginning

    // Keep log size manageable
    if (this.gameLog.length > this.maxLogEntries) {
      this.gameLog = this.gameLog.slice(0, this.maxLogEntries);
    }

    // Show life change indicator if action involves life
    if (action.toLowerCase().includes('pay') && action.toLowerCase().includes('life')) {
      this.showLifeChangeIndicator('loss', playerName);
    } else if (action.toLowerCase().includes('damage') && action.toLowerCase().includes('deal')) {
      this.showLifeChangeIndicator('damage', playerName);
    } else if (action.toLowerCase().includes('gain') && action.toLowerCase().includes('life')) {
      this.showLifeChangeIndicator('gain', playerName);
    }

    this.updateGameLogDisplay();
  }

  updateGameLogDisplay() {
    let gameLogPanel = document.getElementById('gameLogPanel');

    if (!gameLogPanel) {
      gameLogPanel = document.createElement('div');
      gameLogPanel.id = 'gameLogPanel';
      gameLogPanel.className = 'game-log-panel';
      gameLogPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 280px;
        max-height: 200px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--space-3);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999;
        overflow-y: auto;
        font-size: 12px;
      `;

      // Add toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = '📜 Log';
      toggleButton.style.cssText = `
        position: fixed;
        bottom: 230px;
        left: 20px;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        padding: 8px 12px;
        cursor: pointer;
        z-index: 1000;
        font-size: 12px;
      `;
      toggleButton.onclick = () => {
        const isVisible = gameLogPanel.style.display !== 'none';
        gameLogPanel.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? '📜 Log' : '📜 Hide';
      };

      document.body.appendChild(toggleButton);
      document.body.appendChild(gameLogPanel);
    }

    // Update log content
    const logHTML = this.gameLog.slice(0, 8).map(entry => {
      const typeIcon = entry.type === 'auto' ? '⚙️' : '👤';
      const playerColor = entry.player === 'You' ? 'var(--accent-color)' : 'var(--text-secondary)';

      // Detect life loss actions and add special icons
      let lifeIcon = '';
      let actionColor = 'var(--text-primary)';
      if (entry.action.toLowerCase().includes('pay') && entry.action.toLowerCase().includes('life')) {
        lifeIcon = ' 💔';
        actionColor = '#dc2626'; // red color for life loss
      } else if (entry.action.toLowerCase().includes('damage') && entry.action.toLowerCase().includes('deal')) {
        lifeIcon = ' 💥';
        actionColor = '#dc2626'; // red color for damage
      } else if (entry.action.toLowerCase().includes('gain') && entry.action.toLowerCase().includes('life')) {
        lifeIcon = ' 💚';
        actionColor = '#16a34a'; // green color for life gain
      }

      return `
        <div style="margin-bottom: 6px; padding: 4px; border-left: 3px solid ${playerColor}; background: var(--bg-tertiary); border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #2563eb; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">T${entry.turn}</span>
              <span style="color: ${playerColor}; font-weight: bold; font-size: 11px;">${typeIcon} ${entry.player}</span>
            </div>
            <span style="color: var(--text-muted); font-size: 9px;">${entry.timestamp}</span>
          </div>
          <div style="color: ${actionColor}; font-size: 11px; line-height: 1.3; font-weight: ${lifeIcon ? 'bold' : 'normal'};">${entry.action}${lifeIcon}</div>
          <div style="color: var(--text-muted); font-size: 9px; margin-top: 2px;">${entry.phase || 'Unknown Phase'}</div>
        </div>
      `;
    }).join('');

    gameLogPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: var(--accent-color);">Game Log</div>
      ${logHTML || '<div style="color: var(--text-muted); font-style: italic;">No actions yet</div>'}
    `;
  }

  showLifeChangeIndicator(type, player) {
    // Determine which life total to flash
    const isPlayerLife = player === 'You' || player === 'Player';
    const lifeElement = document.getElementById(isPlayerLife ? 'playerLife' : 'opponentLife');

    if (!lifeElement) return;

    // Create indicator element
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: -10px;
      right: -15px;
      font-size: 18px;
      font-weight: bold;
      z-index: 1000;
      animation: lifePulse 1.5s ease-out;
      pointer-events: none;
    `;

    // Set icon and color based on type
    if (type === 'loss' || type === 'damage') {
      indicator.textContent = '💔';
      indicator.style.color = '#dc2626';
    } else if (type === 'gain') {
      indicator.textContent = '💚';
      indicator.style.color = '#16a34a';
    }

    // Add CSS animation if not already present
    if (!document.getElementById('lifeChangeAnimation')) {
      const style = document.createElement('style');
      style.id = 'lifeChangeAnimation';
      style.textContent = `
        @keyframes lifePulse {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          50% { transform: scale(1.3) translateY(-5px); opacity: 0.8; }
          100% { transform: scale(1) translateY(-10px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Position relative to life element
    lifeElement.style.position = 'relative';
    lifeElement.appendChild(indicator);

    // Remove indicator after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1500);

    // Flash the life total background
    const originalBackground = lifeElement.style.backgroundColor;
    lifeElement.style.backgroundColor = type === 'gain' ? '#16a34a20' : '#dc262620';
    lifeElement.style.transition = 'background-color 0.3s ease';

    setTimeout(() => {
      lifeElement.style.backgroundColor = originalBackground;
    }, 500);
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
    console.log('updateTurnDisplay called');
    console.log('turnIndicator element:', turnIndicator);
    console.log('activePlayer:', this.activePlayer);
    console.log('turnState:', this.turnState);
    console.log('formatPhaseStep result:', this.formatPhaseStep());

    if (turnIndicator) {
      const activePlayerText = this.activePlayer === 'player' ? 'Your Turn' : 'Opponent\'s Turn';

      // Set data attribute for styling
      turnIndicator.setAttribute('data-player', this.activePlayer);

      // Create phase progression display - showing proper MTG turn structure
      const currentPhase = this.turnState.phase;
      const currentStep = this.turnState.step;

      // Show compact phase display - only current and next phase
      let currentPhaseLabel, nextPhaseLabel;

      if (currentPhase === 'combat') {
        // Combat phase details
        const combatPhases = ['beginning-combat', 'declare-attackers', 'declare-blockers', 'combat-damage', 'end-combat'];
        const combatLabels = {
          'beginning-combat': 'Begin Combat',
          'declare-attackers': 'Attackers',
          'declare-blockers': 'Blockers',
          'combat-damage': 'Damage',
          'end-combat': 'End Combat'
        };
        currentPhaseLabel = combatLabels[currentStep] || 'Combat';
        const currentIndex = combatPhases.indexOf(currentStep);
        nextPhaseLabel = currentIndex < combatPhases.length - 1 ? combatLabels[combatPhases[currentIndex + 1]] : 'Main 2';
      } else {
        // Main turn phases
        const mainPhases = ['untap', 'upkeep', 'draw', 'main1', 'combat', 'main2', 'end'];
        const mainLabels = {
          'untap': 'Untap',
          'upkeep': 'Upkeep',
          'draw': 'Draw',
          'main1': 'Main 1',
          'combat': 'Combat',
          'main2': 'Main 2',
          'end': 'End'
        };
        currentPhaseLabel = mainLabels[currentPhase] || currentPhase;
        const currentIndex = mainPhases.indexOf(currentPhase);
        nextPhaseLabel = currentIndex < mainPhases.length - 1 ? mainLabels[mainPhases[currentIndex + 1]] : 'Next Turn';
      }

      const phaseProgressHTML = `
        <span class="phase-indicator current-phase">${currentPhaseLabel}</span>
        <span class="phase-arrow">→</span>
        <span class="phase-indicator next-phase">${nextPhaseLabel}</span>
      `;

      turnIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; padding: 1px 4px; background: var(--bg-tertiary); border-radius: 3px;">
          <span style="color: var(--text-primary); font-weight: bold;">${activePlayerText}</span>
          <span style="color: var(--text-muted);">•</span>
          <span style="color: var(--text-muted);">T${this.turnState.turnNumber}</span>
          <span style="color: var(--text-muted);">•</span>
          <span style="color: var(--primary); font-weight: bold;">${currentPhaseLabel}</span>
          <span style="color: var(--text-muted);">→</span>
          <span style="color: var(--text-muted);">${nextPhaseLabel}</span>
        </div>
      `;
      console.log('Updated turnIndicator innerHTML:', turnIndicator.innerHTML);
    } else {
      console.log('turnIndicator element not found');
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
    console.log('=== showHandCardMenu called ===');
    console.log('cardId:', cardId);
    console.log('event:', event);
    console.log('activePlayer:', this.activePlayer);

    event.preventDefault();

    // Determine which hand to search based on active player
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;

    // Find the card
    const cardIndex = currentHand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex === -1) {
      console.log('Card not found in hand');
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

    const cardType = this.getCardMainType(card.type || '').toLowerCase();
    const isLand = cardType === 'land';
    const hasSurveil = this.hasSurveil(card.name);
    const surveilAmount = hasSurveil ? this.getSurveilAmount(card.name) : 0;
    const hasScryAbility = this.hasScry(card.name);
    const scryAmount = hasScryAbility ? this.getScryAmount(card.name) : 0;
    const hasDelveAbility = !isLand && this.hasDelve(card.name);

    let menuItems = `
      <div class="menu-item" onclick="window.handSimulator.playCardDirectly('${this.escapeJs(cardId)}', event)">
        ⚔️ ${isLand ? 'Play Land' : 'Cast Spell'}
      </div>`;

    // Add delve option for delve cards
    if (hasDelveAbility && this.graveyard.length > 0) {
      menuItems += `
      <div class="menu-item" onclick="window.handSimulator.showDelveUI('${this.escapeJs(cardId)}', '${this.escapeJs(card.name)}')">
        💀 Cast with Delve
      </div>`;
    }

    // Add scry option if card has scry
    if (hasScryAbility) {
      menuItems += `
      <div class="menu-item" onclick="window.handSimulator.scry(${scryAmount})">
        🔮 Scry ${scryAmount}
      </div>`;
    }

    // Add surveil option if card has surveil
    if (hasSurveil) {
      menuItems += `
      <div class="menu-item" onclick="window.handSimulator.showSurveilUI('${this.escapeJs(card.name)}', ${surveilAmount}, ${this.activePlayer === 'opponent'})">
        🔍 Surveil ${surveilAmount}
      </div>`;
    }

    menuItems += `
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToGraveyard('${this.escapeJs(cardId)}')">
        🪦 To Graveyard
      </div>
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToExile('${this.escapeJs(cardId)}')">
        🚫 Exile
      </div>
      <div class="menu-item" onclick="window.handSimulator.moveHandCardToLibrary('${this.escapeJs(cardId)}')">
        📚 To Library
      </div>
      <div class="menu-item" onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')">
        👁️ View Card
      </div>
    `;

    menu.innerHTML = menuItems;

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
    console.log('=== showBattlefieldCardMenu called ===');
    console.log('cardId:', cardId);

    event.preventDefault();

    // Find the card
    const card = this.findBattlefieldCard(cardId);
    console.log('Found card:', card);
    if (!card) {
      console.error('Card not found in battlefield');
      return;
    }

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
      z-index: 1000000;
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
      z-index: 1000000;
      min-width: 180px;
      overflow: hidden;
    `;

    const cardType = this.getCardMainType(card.type || '').toLowerCase();
    const isTapped = card.tapped;
    const currentCounters = card.counters || {};

    // Get context-sensitive primary actions
    const primaryActions = this.getPrimaryActions(cardType, isTapped, cardId, zone, card);

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
      menuHTML += `<div class="menu-item counter-quick" onclick="window.handSimulator.addCounter('${this.escapeJs(cardId)}', '+1/+1')">
        <span class="action-icon">➕</span>
        <span class="action-text">+1/+1 Counter</span>
        ${current > 0 ? `<span class="counter-count">${current}</span>` : ''}
      </div>`;

      if (current > 0) {
        menuHTML += `<div class="menu-item counter-quick remove" onclick="window.handSimulator.removeCounter('${this.escapeJs(cardId)}', '+1/+1')">
          <span class="action-icon">➖</span>
          <span class="action-text">Remove +1/+1</span>
        </div>`;
      }
    }

    menuHTML += '</div>';

    // More actions (expandable)
    if (zone === 'battlefield') {
      menuHTML += `<div class="menu-item expandable" onclick="window.handSimulator.expandMenuActions(event, '${this.escapeJs(cardId)}', '${zone}')">
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

  getPrimaryActions(cardType, isTapped, cardId, zone, card = null) {
    const actions = [];

    // Context-sensitive primary actions based on realistic game flow
    switch (cardType) {
      case 'creature':
        // Check if this is a DFC and add transform option first
        if (card && this.isDFC(card.name)) {
          const dfcData = this.getDFCData(card.name);
          const currentFace = card.currentFace || card.name;
          const isOnFront = currentFace === dfcData.frontFace;

          actions.push({
            icon: '🔄',
            text: isOnFront ? `Transform → ${dfcData.backFace.split(' ')[0]}` : `Transform → ${dfcData.frontFace.split(' ')[0]}`,
            onclick: `window.handSimulator.transformCard('${this.escapeJs(cardId)}')`,
            badge: 'DFC'
          });
        }

        // Creatures: Tap -> Die/Graveyard -> Counters
        actions.push({
          icon: isTapped ? '↺' : '⤵️',
          text: isTapped ? 'Untap' : 'Tap',
          onclick: `window.handSimulator.toggleTap('${this.escapeJs(cardId)}')`
        });
        if (zone === 'battlefield') {
          // Damage options for creatures
          actions.push({
            icon: '💔',
            text: '1 Damage',
            onclick: `window.handSimulator.dealDamage1('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '⚡',
            text: '3 Damage (Bolt)',
            onclick: `window.handSimulator.dealDamage3('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '⚰️',
            text: 'Dies → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '🚫',
            text: 'Exile',
            onclick: `window.handSimulator.moveToExile('${this.escapeJs(cardId)}')`
          });
        }
        break;

      case 'land': {
        // Check if this is a fetchland or wasteland for special actions
        const card = zone === 'battlefield' ? this.findBattlefieldCard(cardId) : null;
        const isFetchland = card && this.isFetchland(card.name);
        const isWasteland = card && this.isWasteland(card.name);

        if (isFetchland && zone === 'battlefield') {
          // Fetchland-specific actions
          actions.push({
            icon: '🏞️',
            text: 'Fetch Land',
            onclick: `window.handSimulator.showFetchlandQuickSelectById('${this.escapeJs(cardId)}', true)`
          });
          actions.push({
            icon: '🔍',
            text: 'Advanced Fetch',
            onclick: `window.handSimulator.showEnhancedFetchSearch('${card.name}')`
          });
          // Sacrifice option (since fetchlands are sacrificed)
          actions.push({
            icon: '💀',
            text: 'Sacrifice → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
          });
        } else if (isWasteland && zone === 'battlefield') {
          // Wasteland-specific actions
          actions.push({
            icon: '💥',
            text: 'Destroy Nonbasic Land',
            onclick: `window.handSimulator.showWastelandTargetSelectById('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: isTapped ? '↺' : '🔥',
            text: isTapped ? 'Untap' : 'Tap for Mana',
            onclick: `window.handSimulator.toggleTap('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '💀',
            text: 'Sacrifice → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
          });
        } else {
          // Regular land actions
          actions.push({
            icon: isTapped ? '↺' : '🔥',
            text: isTapped ? 'Untap' : 'Tap for Mana',
            onclick: `window.handSimulator.toggleTap('${this.escapeJs(cardId)}')`
          });
          if (zone === 'battlefield') {
            actions.push({
              icon: '⚰️',
              text: 'Destroy → Graveyard',
              onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
            });
            actions.push({
              icon: '🤲',
              text: 'Bounce → Hand',
              onclick: `window.handSimulator.moveToHand('${this.escapeJs(cardId)}')`
            });
          }
        }
        break;
      }

      case 'planeswalker': {
        // Planeswalkers: Loyalty abilities -> Death/Damage
        const card = this.findBattlefieldCard(cardId);
        const loyalty = card?.counters?.['loyalty'] || 0;
        actions.push({
          icon: '💎',
          text: 'Loyalty +1',
          badge: loyalty > 0 ? loyalty.toString() : '',
          onclick: `window.handSimulator.addCounter('${this.escapeJs(cardId)}', 'loyalty')`
        });
        if (loyalty > 0) {
          actions.push({
            icon: '💎',
            text: 'Loyalty -1',
            onclick: `window.handSimulator.removeCounter('${this.escapeJs(cardId)}', 'loyalty')`
          });
        }
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: loyalty === 0 ? 'Dies (0 Loyalty)' : 'Destroy',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
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
          onclick: `window.handSimulator.toggleTap('${this.escapeJs(cardId)}')`
        });
        if (zone === 'battlefield') {
          actions.push({
            icon: '⚰️',
            text: 'Destroy → Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '🚫',
            text: 'Exile',
            onclick: `window.handSimulator.moveToExile('${this.escapeJs(cardId)}')`
          });
        }
        break;

      default:
        if (zone === 'battlefield') {
          actions.push({
            icon: isTapped ? '↺' : '⤵️',
            text: isTapped ? 'Untap' : 'Tap',
            onclick: `window.handSimulator.toggleTap('${this.escapeJs(cardId)}')`
          });
          actions.push({
            icon: '⚰️',
            text: 'To Graveyard',
            onclick: `window.handSimulator.moveToGraveyard('${this.escapeJs(cardId)}')`
          });
        }
    }

    // Zone-specific movement actions
    if (zone === 'graveyard') {
      actions.push({
        icon: '🤲',
        text: 'Return → Hand',
        onclick: `window.handSimulator.moveGraveyardToHand('${this.escapeJs(cardId)}')`
      });
      actions.push({
        icon: '⚡',
        text: 'Reanimate → Battlefield',
        onclick: `window.handSimulator.moveGraveyardToBattlefield('${this.escapeJs(cardId)}')`
      });
      actions.push({
        icon: '🚫',
        text: 'Exile from Graveyard',
        onclick: `window.handSimulator.moveGraveyardToExile('${this.escapeJs(cardId)}')`
      });
    } else if (zone === 'exile') {
      actions.push({
        icon: '🤲',
        text: 'Return → Hand',
        onclick: `window.handSimulator.moveExileToHand('${this.escapeJs(cardId)}')`
      });
      actions.push({
        icon: '⚡',
        text: 'Return → Battlefield',
        onclick: `window.handSimulator.moveExileToBattlefield('${this.escapeJs(cardId)}')`
      });
      actions.push({
        icon: '⚰️',
        text: 'To Graveyard',
        onclick: `window.handSimulator.moveExileToGraveyard('${this.escapeJs(cardId)}')`
      });
    }

    // Always add View Card option for all zones and card types
    if (card && card.name) {
      actions.push({
        icon: '👁️',
        text: 'View Card',
        onclick: `window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')`
      });
    }

    return actions.slice(0, 5); // Allow up to 5 primary actions to include View Card
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
      z-index: 1000000;
      min-width: 200px;
      max-height: 400px;
      overflow-y: auto;
    `;

    const counters = card.counters || {};

    let menuHTML = `
      <div class="menu-header">
        <span onclick="window.handSimulator.showBattlefieldCardMenu(event, '${this.escapeJs(cardId)}')" style="cursor: pointer;">← Back</span>
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
          <div class="menu-item" onclick="window.handSimulator.addCounter('${this.escapeJs(cardId)}', '${counter.type}')">
            <span class="action-icon">${counter.icon}</span>
            <span class="action-text">Add ${counter.name}</span>
            ${current > 0 ? `<span class="counter-count">${current}</span>` : ''}
          </div>
          ${current > 0 ? `
            <div class="menu-item remove" onclick="window.handSimulator.removeCounter('${this.escapeJs(cardId)}', '${counter.type}')">
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
        <div class="menu-item" onclick="window.handSimulator.moveToExile('${this.escapeJs(cardId)}')">
          <span class="action-icon">🚫</span>
          <span class="action-text">To Exile</span>
        </div>
        <div class="menu-item" onclick="window.handSimulator.moveToHand('${this.escapeJs(cardId)}')">
          <span class="action-icon">🤲</span>
          <span class="action-text">To Hand</span>
        </div>
      </div>
      <div class="menu-section">
        <div class="menu-item" onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')">
          <span class="action-icon">👁️</span>
          <span class="action-text">View Card</span>
        </div>
      </div>
    `;

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);

    this.adjustMenuPosition(menu, event);
    this.addMenuClickOutsideListener(menu);
  }

  findBattlefieldCard(cardId) {
    // Search in the appropriate battlefield based on active player
    const currentBattlefield = this.activePlayer === 'opponent' ? this.opponent.battlefield : this.battlefield;
    return [...currentBattlefield.lands, ...currentBattlefield.creatures, ...currentBattlefield.others]
      .find(card => card.id === cardId);
  }

  findBattlefieldCardAnyPlayer(cardId) {
    // Search across all players' battlefields
    const playerCard = [...this.battlefield.lands, ...this.battlefield.creatures, ...this.battlefield.others]
      .find(card => card.id === cardId);
    if (playerCard) return { card: playerCard, owner: 'player' };

    const opponentCard = [...this.opponent.battlefield.lands, ...this.opponent.battlefield.creatures, ...this.opponent.battlefield.others]
      .find(card => card.id === cardId);
    if (opponentCard) return { card: opponentCard, owner: 'opponent' };

    return null;
  }

  getAllBattlefieldCreatures() {
    // Get all creatures from all battlefields with owner information
    const playerCreatures = this.battlefield.creatures.map(creature => ({
      ...creature,
      owner: 'player'
    }));

    const opponentCreatures = this.opponent.battlefield.creatures.map(creature => ({
      ...creature,
      owner: 'opponent'
    }));

    return [...playerCreatures, ...opponentCreatures];
  }

  moveToGraveyard(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      // Add to the appropriate graveyard based on active player
      const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
      currentGraveyard.push(card);
      this.updateBattlefieldDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      this.showToast(`${card.name} moved to graveyard`, 'info');
    }
  }

  moveToExile(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      // Add to the appropriate exile zone based on active player
      const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;
      currentExile.push(card);
      this.updateBattlefieldDisplay();
      this.updateExileDisplay();
      this.updateUI();
      this.showToast(`${card.name} exiled`, 'info');
    }
  }

  moveToHand(cardId) {
    const card = this.removeBattlefieldCard(cardId);
    if (card) {
      // Add to the appropriate hand based on active player
      const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;
      currentHand.push(card);
      this.updateBattlefieldDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand`, 'info');
    }
  }

  removeBattlefieldCard(cardId) {
    // Remove from the appropriate battlefield based on active player
    const currentBattlefield = this.activePlayer === 'opponent' ? this.opponent.battlefield : this.battlefield;

    // Check lands
    let cardIndex = currentBattlefield.lands.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return currentBattlefield.lands.splice(cardIndex, 1)[0];
    }

    // Check creatures
    cardIndex = currentBattlefield.creatures.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return currentBattlefield.creatures.splice(cardIndex, 1)[0];
    }

    // Check others
    cardIndex = currentBattlefield.others.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      return currentBattlefield.others.splice(cardIndex, 1)[0];
    }

    return null;
  }

  showGraveyardCardMenu(event, cardId) {
    event.preventDefault();
    console.log('showGraveyardCardMenu called with cardId:', cardId);

    // Find the card
    const card = this.findGraveyardCard(cardId);
    console.log('Found graveyard card:', card);
    if (!card) {
      console.log('Card not found in graveyard');
      return;
    }

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
    console.log('findGraveyardCard called with cardId:', cardId);
    // Search in the appropriate graveyard based on active player
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
    console.log('Current graveyard:', currentGraveyard);

    // First try to find by actual card ID
    let card = currentGraveyard.find(card => card.id === cardId);
    console.log('Found by ID:', card);

    // If not found and this looks like a modal card ID, try to find by name_index pattern
    if (!card && cardId.includes('_')) {
      console.log('Trying name_index pattern');
      const parts = cardId.split('_');
      if (parts.length >= 2) {
        const index = parseInt(parts[parts.length - 1]);
        const cardName = parts.slice(0, -1).join('_');
        console.log('Looking for card name:', cardName, 'at index:', index);
        // Try to find card by name and position
        const cardsWithName = currentGraveyard.filter(c => c.name === cardName);
        console.log('Cards with name:', cardsWithName);
        if (cardsWithName.length > index) {
          card = cardsWithName[index];
          console.log('Found by name/index:', card);
        }
      }
    }

    console.log('Final result:', card);
    return card;
  }

  findExileCard(cardId) {
    // Search in the appropriate exile zone based on active player
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;

    // First try to find by actual card ID
    let card = currentExile.find(card => card.id === cardId);

    // If not found and this looks like a modal card ID, try to find by name_index pattern
    if (!card && cardId.includes('_')) {
      const parts = cardId.split('_');
      if (parts.length >= 2) {
        const index = parseInt(parts[parts.length - 1]);
        const cardName = parts.slice(0, -1).join('_');
        // Try to find card by name and position
        const cardsWithName = currentExile.filter(c => c.name === cardName);
        if (cardsWithName.length > index) {
          card = cardsWithName[index];
        }
      }
    }

    return card;
  }

  moveGraveyardToHand(cardId) {
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;

    const cardIndex = currentGraveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentGraveyard.splice(cardIndex, 1)[0];
      currentHand.push(card.name);
      this.updateGraveyardDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand from graveyard`, 'info');
    }
  }

  moveGraveyardToExile(cardId) {
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;

    const cardIndex = currentGraveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentGraveyard.splice(cardIndex, 1)[0];
      currentExile.push(card);
      this.updateGraveyardDisplay();
      this.updateExileDisplay();
      this.updateUI();
      this.showToast(`${card.name} exiled from graveyard`, 'info');
    }
  }

  moveGraveyardToBattlefield(cardId) {
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
    const currentBattlefield = this.activePlayer === 'opponent' ? this.opponent.battlefield : this.battlefield;

    const cardIndex = currentGraveyard.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentGraveyard.splice(cardIndex, 1)[0];

      // Add to appropriate battlefield zone based on card type
      const cardType = this.getCardMainType(card.type).toLowerCase();
      if (cardType === 'land') {
        currentBattlefield.lands.push(card);
      } else if (cardType === 'creature') {
        currentBattlefield.creatures.push(card);
      } else {
        currentBattlefield.others.push(card);
      }

      this.updateGraveyardDisplay();
      this.updateBattlefieldDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to battlefield from graveyard`, 'info');
    }
  }

  moveExileToHand(cardId) {
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;

    const cardIndex = currentExile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentExile.splice(cardIndex, 1)[0];
      currentHand.push(card.name);
      this.updateExileDisplay();
      this.updateHandDisplay();
      this.updateUI();
      this.showToast(`${card.name} returned to hand from exile`, 'info');
    }
  }

  moveExileToGraveyard(cardId) {
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;

    const cardIndex = currentExile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentExile.splice(cardIndex, 1)[0];
      currentGraveyard.push(card);
      this.updateExileDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      this.showToast(`${card.name} moved to graveyard from exile`, 'info');
    }
  }

  moveExileToBattlefield(cardId) {
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;
    const currentBattlefield = this.activePlayer === 'opponent' ? this.opponent.battlefield : this.battlefield;

    const cardIndex = currentExile.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const card = currentExile.splice(cardIndex, 1)[0];

      // Add to appropriate battlefield zone based on card type
      const cardType = this.getCardMainType(card.type).toLowerCase();
      if (cardType === 'land') {
        currentBattlefield.lands.push(card);
      } else if (cardType === 'creature') {
        currentBattlefield.creatures.push(card);
      } else {
        currentBattlefield.others.push(card);
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
      this.opponent.deckPath = deckPath;

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

      // Check if this is the default opponent deck
      const isDefault = localStorage.getItem('mtg_default_opponent_deck') === deckPath;
      const message = isDefault
        ? `Opponent loaded: ${this.opponent.deckName} ⭐ (Default)`
        : `Opponent loaded: ${this.opponent.deckName}`;

      this.showToast(message, 'success');

      // Update opponent deck selector labels
      this.updateOpponentDeckSelectorLabels();

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

    // Save the current active player to restore it after updating
    const previousActivePlayer = this.activePlayer;

    this.updateUI();

    // Only update opponent hand display without switching context
    // This ensures the player's hand remains visible
    const container2 = document.getElementById('opponentHandContainer2');
    if (container2) {
      this.updateZoneDisplay('opponentHandContainer2', this.opponent.hand);
    }

    // Restore the active player context
    this.activePlayer = previousActivePlayer;

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

      // Save the current active player to restore it after updating
      const previousActivePlayer = this.activePlayer;

      this.updateUI();

      // Only update opponent hand display without switching context
      const container2 = document.getElementById('opponentHandContainer2');
      if (container2) {
        this.updateZoneDisplay('opponentHandContainer2', this.opponent.hand);
      }

      // Restore the active player context
      this.activePlayer = previousActivePlayer;

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
    if (typeStr.includes('planeswalker')) return 'Planeswalker';
    if (typeStr.includes('battle')) return 'Battle';
    return 'Other';
  }

  // ===== DELIRIUM TRACKING (EFFICIENT) =====

  getGraveyardTypes(graveyard) {
    // Uses Set for O(n) time complexity with early exit
    const types = new Set();

    for (const card of graveyard) {
      const mainType = this.getCardMainType(card.type);
      if (mainType !== 'Other') {
        types.add(mainType);
        // Early exit optimization - can't have more than 8 types
        if (types.size >= 8) break;
      }
    }

    return types;
  }

  checkDelirium(graveyard) {
    // Fast check: needs at least 4 cards for delirium
    if (graveyard.length < 4) return false;

    const types = this.getGraveyardTypes(graveyard);
    return types.size >= 4;
  }

  getDeliriumCount(graveyard) {
    const types = this.getGraveyardTypes(graveyard);
    return types.size;
  }

  updateDeliriumIndicator() {
    // Fast early exit if no graveyard
    if (this.graveyard.length === 0) {
      const indicator = document.getElementById('deliriumIndicator2');
      if (indicator) indicator.style.display = 'none';
      return;
    }

    const typeCount = this.getDeliriumCount(this.graveyard);
    const hasDelirium = typeCount >= 4;

    const indicator = document.getElementById('deliriumIndicator2');
    const typesSpan = document.getElementById('deliriumTypes2');

    if (!indicator || !typesSpan) return;

    // Show indicator and update count
    indicator.style.display = 'inline-block';
    typesSpan.textContent = typeCount;

    // Visual styling based on delirium status
    if (hasDelirium) {
      indicator.classList.add('btn-success');
      indicator.classList.remove('btn-warning', 'btn-outline-secondary');
      indicator.title = 'Delirium active! (4+ card types in graveyard)';
    } else {
      indicator.classList.add('btn-outline-secondary');
      indicator.classList.remove('btn-success', 'btn-warning');
      indicator.title = `${typeCount}/4 card types for Delirium`;
    }
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

  // ===== DOUBLE-FACED CARD (DFC) SYSTEM =====

  isDFC(cardName) {
    // Check both original name and current name (in case it's transformed)
    const baseName = cardName.replace(' // ', '/').split(' //')[0].trim().toLowerCase();
    return this.dfcDatabase[baseName] !== undefined ||
           Object.values(this.dfcDatabase).some(dfc => dfc.backFace.toLowerCase() === baseName);
  }

  getDFCData(cardName) {
    const baseName = cardName.replace(' // ', '/').split(' //')[0].trim().toLowerCase();
    // Check if it's a front face
    if (this.dfcDatabase[baseName]) {
      return this.dfcDatabase[baseName];
    }
    // Check if it's a back face
    for (const [frontName, dfcData] of Object.entries(this.dfcDatabase)) {
      if (dfcData.backFace.toLowerCase() === baseName) {
        return dfcData;
      }
    }
    return null;
  }

  transformCard(cardId) {
    console.log(`Attempting to transform card: ${cardId}`);

    // Find the card in all zones
    let card = null;
    let zone = null;
    let zoneArray = null;

    // Check player battlefield
    for (const zoneType of ['lands', 'creatures', 'others']) {
      const found = this.battlefield[zoneType].find(c => (c.id || `${c.name}_0`) === cardId);
      if (found) {
        card = found;
        zone = 'player_battlefield';
        zoneArray = this.battlefield[zoneType];
        break;
      }
    }

    // Check opponent battlefield
    if (!card) {
      for (const zoneType of ['lands', 'creatures', 'others']) {
        const found = this.opponent.battlefield[zoneType].find(c => (c.id || `${c.name}_0`) === cardId);
        if (found) {
          card = found;
          zone = 'opponent_battlefield';
          zoneArray = this.opponent.battlefield[zoneType];
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
    const isOnFrontFace = currentName === dfcData.frontFace;

    if (isOnFrontFace) {
      // Transform to back face
      card.currentFace = dfcData.backFace;
      card.transformed = true;
      this.logAction('You', `Transform ${dfcData.frontFace} → ${dfcData.backFace}`, 'manual');
      this.showToast(`${dfcData.frontFace} transformed into ${dfcData.backFace}!`, 'info');
    } else if (dfcData.canTransformBack) {
      // Transform back to front face
      card.currentFace = dfcData.frontFace;
      card.transformed = false;
      this.logAction('You', `Transform ${dfcData.backFace} → ${dfcData.frontFace}`, 'manual');
      this.showToast(`${dfcData.backFace} transformed back into ${dfcData.frontFace}!`, 'info');
    } else {
      this.showToast(`${card.name} cannot transform back`, 'warning');
      return;
    }

    // Update displays
    this.updateBattlefieldDisplay();
    this.updateUI();
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
    // Create a map of card names to their original/front face for DFC support
    const cardNameMap = new Map();

    for (const card of cards) {
      const displayName = card.currentFace || card.name;
      if (!cardNameMap.has(displayName)) {
        // Store both the display name and the original name (for DFC lookup)
        cardNameMap.set(displayName, card.name);
      }
    }

    for (const [displayName, originalName] of cardNameMap) {
      try {
        // Pass the original name as dfcFrontFace hint if this is a transformed card
        const dfcFrontFace = displayName !== originalName ? originalName : null;
        const imageUrl = await CardImageService.getCardImageUrl(displayName, 'normal', dfcFrontFace);
        this.updateHandCardImage(displayName, imageUrl); // This method works for any element with data-card-name
      } catch (error) {
        console.warn(`Failed to load image for ${displayName}:`, error);
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

  playModalCard(cardId, event, modalId) {
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    console.log('playModalCard called:', cardId, modalId);

    // Find the card in the appropriate zone
    let card = null;
    let sourceZone = null;
    let currentZone = null;

    if (modalId === 'graveyard' || modalId === 'opponent-graveyard') {
      card = this.findGraveyardCard(cardId);
      sourceZone = 'graveyard';
      currentZone = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;
    } else if (modalId === 'exile' || modalId === 'opponent-exile') {
      card = this.findExileCard(cardId);
      sourceZone = 'exile';
      currentZone = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;
    }

    if (!card) {
      console.log('Card not found in', sourceZone);
      this.showToast('Card not found', 'warning');
      return;
    }

    // Remove from source zone
    const cardIndex = currentZone.findIndex(c => c === card);
    if (cardIndex !== -1) {
      currentZone.splice(cardIndex, 1);

      // Add to battlefield using existing logic
      this.playCard(card);

      // Close the modal
      document.getElementById(`simple-modal-${modalId}`)?.remove();

      // Update displays
      this.updateAllDisplays();
      this.showToast(`Played ${card.name} from ${sourceZone}`, 'success');
    }
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
    console.log('=== playCardDirectly called ===');
    console.log('cardId:', cardId);
    console.log('event:', event);
    console.log('event target:', event ? event.target : 'no event');

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

      // Check if this is a fetchland and show quick-select popup
      if (this.isFetchland(card.name)) {
        setTimeout(() => this.showFetchlandQuickSelect(card, { fromPlay: true }), 100);
      }
    } else if (cardType === 'Instant' || cardType === 'Sorcery') {
      // Instants and sorceries go directly to graveyard after being cast
      graveyard.push(card);
      gameStats.spellsCast++;

      // Trigger: Dragon's Rage Channeler and similar cards
      this.checkNoncreatureSpellTriggers(isOpponentCard);

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

      // Trigger for noncreature spells (artifacts/enchantments/planeswalkers)
      this.checkNoncreatureSpellTriggers(isOpponentCard);
    }
  }

  // ===== TRIGGERED ABILITIES =====

  checkNoncreatureSpellTriggers(isOpponent = false) {
    // Check for Dragon's Rage Channeler
    const battlefield = isOpponent ? this.opponent.battlefield : this.battlefield;
    const drcInPlay = battlefield.creatures.some(c =>
      c.name.toLowerCase().includes("dragon's rage channeler")
    );

    if (drcInPlay) {
      const playerName = isOpponent ? 'Opponent' : 'You';
      this.showToast(`🐉 Dragon's Rage Channeler trigger - Surveil 1`, 'info');

      // Prompt for surveil 1
      setTimeout(() => {
        this.showSurveilUI("Dragon's Rage Channeler", 1, isOpponent);
      }, 500);
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
    // Check if we're actively controlling the opponent
    if (this.activePlayer === 'opponent') {
      // When controlling opponent, show detailed cards
      this.updateOpponentHandDisplayDetailed();
    } else {
      // When not controlling opponent, show card backs or count
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
  }

  updateHandDisplay() {
    console.log('updateHandDisplay called, activePlayer:', this.activePlayer);

    // ALWAYS show player's hand in player hand containers for playtesting
    console.log('Showing player hand:', this.hand);
    this.updateZoneDisplay('handContainer', this.hand);
    this.updateZoneDisplay('handContainer2', this.hand);

    // Also update opponent hand in their separate container
    const opponentContainer = document.getElementById('opponentHandContainer2');
    if (opponentContainer) {
      this.updateZoneDisplay('opponentHandContainer2', this.opponent.hand);
    }
  }

  updateGraveyardDisplay() {
    this.updateZoneDisplay('graveyardZone', this.graveyard);
  }

  updateExileDisplay() {
    this.updateZoneDisplay('exileZone', this.exile);
  }

  updateZoneDisplay(containerId, cards) {
    console.log('updateZoneDisplay called:', containerId, 'cards:', cards.length);
    console.log('Testing container ID logic:', containerId, 'includes handContainer?', containerId.includes('handContainer'));
    const container = document.getElementById(containerId);
    console.log('container found:', container);
    if (!container) {
      console.warn('Container not found:', containerId);
      return;
    }

    // Special handling for hand containers
    if (containerId.includes('handContainer') || containerId.includes('HandContainer')) {
      console.log('ENHANCED TEMPLATE - Processing hand container:', containerId);
      console.log('Cards to display:', cards);
      console.log('First card structure:', cards[0]);
      console.trace('Call stack for enhanced template rendering');

      try {
        // Sort cards with lands first, then by type
        const sortedCards = [...cards].sort((a, b) => {
          const aType = this.getCardMainType(a.type || '').toLowerCase();
          const bType = this.getCardMainType(b.type || '').toLowerCase();

          // Lands first
          if (aType === 'land' && bType !== 'land') return -1;
          if (bType === 'land' && aType !== 'land') return 1;

          // Then sort alphabetically by type
          if (aType !== bType) return aType.localeCompare(bType);

          // Finally sort by name within same type
          return a.name.localeCompare(b.name);
        });

        // Store sorted order for keyboard shortcuts (only for main hand containers)
        if (containerId === 'handContainer' && this.activePlayer === 'player') {
          this.sortedHandOrder = sortedCards;
        } else if (containerId === 'handContainer' && this.activePlayer === 'opponent') {
          this.sortedOpponentHandOrder = sortedCards;
        }

        container.innerHTML = sortedCards.map((card, index) => {
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
               onclick="window.handSimulator.playCardDirectly('${this.escapeJs(cardId)}', event)"
               oncontextmenu="window.handSimulator.showHandCardMenu(event, '${this.escapeJs(cardId)}'); return false;"
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

      // Damage display for creatures
      const damage = card.damage || 0;
      const hasDamage = damage > 0;
      const toughness = this.getCreatureToughness(card);
      const isCreature = this.getCardMainType(card.type).toLowerCase() === 'creature';

      // Use currentFace for transformed cards
      const displayName = card.currentFace || card.name;
      const isTransformed = card.transformed || false;

      console.log(`SIMPLE TEMPLATE - Rendering card ${card.name} in container ${containerId}:`, {
        isTapped,
        hasCounters,
        counters,
        counterText,
        isTransformed,
        displayName
      });
      console.trace('Call stack for simple template rendering');

      let counterHTML = '';
      if (hasCounters) {
        counterHTML = `<div class="counter-indicator">${counterText}</div>`;
        console.log(`Generated counterHTML for ${card.name}:`, counterHTML);
      }

      let tapHTML = '';
      if (isTapped) {
        tapHTML = '<div class=\'tap-indicator\' style=\'position: absolute; top: 2px; right: 2px; background: rgba(255, 255, 255, 0.9); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; z-index: 100; pointer-events: none;\'>⤵️</div>';
      }

      let damageHTML = '';
      if (isCreature && hasDamage) {
        const damageColor = damage >= toughness ? 'red' : 'orange';
        damageHTML = `<div class="damage-indicator" style="position: absolute; bottom: 2px; right: 2px; background: ${damageColor}; color: white; border-radius: 3px; padding: 2px 6px; font-size: 11px; font-weight: bold; z-index: 100; pointer-events: none;">💔 ${damage}</div>`;
      }

      // Add transform indicator for DFCs
      let transformHTML = '';
      if (isTransformed) {
        transformHTML = '<div class=\'transform-indicator\' style=\'position: absolute; top: 2px; left: 2px; background: rgba(139, 92, 246, 0.9); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; z-index: 100; pointer-events: none;\' title=\'Transformed\'>🔄</div>';
      }

      // Add delirium indicator for Dragon's Rage Channeler
      let deliriumHTML = '';
      const isDRC = card.name.toLowerCase().includes("dragon's rage channeler");
      if (isDRC && this.checkDelirium(this.graveyard)) {
        deliriumHTML = '<div class=\'delirium-indicator\' style=\'position: absolute; top: 24px; left: 2px; background: rgba(34, 197, 94, 0.95); border-radius: 3px; padding: 2px 5px; font-size: 10px; font-weight: bold; color: white; z-index: 100; pointer-events: none;\' title=\'Delirium active: +1/+0, Flying\'>🌀</div>';
      }

      // Add Murktide Regent P/T display
      let murktideHTML = '';
      const isMurktide = this.isMurktideRegent(card.name);
      if (isMurktide && isCreature) {
        const { power, toughness } = this.getMurktidePowerToughness();
        murktideHTML = `<div class='murktide-pt' style='position: absolute; bottom: 2px; left: 2px; background: rgba(139, 69, 19, 0.95); border-radius: 3px; padding: 2px 6px; font-size: 11px; font-weight: bold; color: white; z-index: 100; pointer-events: none;' title='Flying. Power/toughness based on instants/sorceries in exile'>${power}/${toughness}</div>`;
      }

      return `
        <div class="zone-card card-played ${isTapped ? 'tapped' : ''} ${isTransformed ? 'transformed' : ''}"
             style="animation-delay: ${index * 0.05}s; cursor: pointer;"
             data-card-id="${card.id}"
             data-card-name="${this.escapeHtml(displayName)}"
             onclick="window.handSimulator.handleBattlefieldCardClick(event, '${this.escapeJs(card.id)}', '${this.escapeJs(displayName)}')"
             oncontextmenu="window.handSimulator.${menuFunction}(event, '${this.escapeJs(card.id)}'); return false;"
             title="Left-click to view card, Right-click for options">
          <div class="card-content">
            <div class="card-image-container" style="position: relative;">
              <div class="loading-placeholder">🎴</div>
              ${transformHTML}
              ${deliriumHTML}
              ${tapHTML}
              ${murktideHTML}
              ${damageHTML}
            </div>
            <div class="card-info">
              <div class="card-name">${this.escapeHtml(displayName)}</div>
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
    console.log('showLibraryModal called');
    console.log('Library size:', this.library.length);
    console.log('Library contents:', this.library);
    const modal = document.getElementById('libraryModal');
    console.log('Modal element:', modal);
    if (modal) {
      modal.style.display = 'flex';

      // Update library count
      const countDisplay = document.getElementById('libraryCountDisplay');
      if (countDisplay) {
        countDisplay.textContent = this.library.length;
      }

      this.updateLibraryDisplay();

      // Add show class for animation
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        setTimeout(() => modalContent.classList.add('show'), 10);
      }
    } else {
      console.error('Library modal element not found!');
    }
  }

  hideLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) {
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        modalContent.classList.remove('show');
      }
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }

  updateLibraryDisplay() {
    console.log('updateLibraryDisplay called');
    const container = document.getElementById('libraryContents');
    console.log('Container element:', container);
    if (!container) {
      console.error('libraryContents element not found!');
      return;
    }

    console.log('Library array:', this.library);
    console.log('Library length:', this.library.length);

    if (this.library.length === 0) {
      console.log('Library is empty, showing message');
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Library is empty</div>';
      return;
    }

    // Use card grid display similar to hand display
    const html = this.library.map((card, index) => {
      const cardId = card.id || `library-${index}`;
      return `
        <div class="zone-card"
             data-card-id="${cardId}"
             data-card-name="${this.escapeHtml(card.name)}"
             style="cursor: pointer; position: relative;"
             onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')"
             title="${this.escapeHtml(card.name)} - ${this.escapeHtml(card.cost || '0')}">
          <div class="card-image-container">
            <div class="loading-placeholder">🎴</div>
          </div>
          <div class="card-overlay">
            <div class="card-name">${this.escapeHtml(card.name)}</div>
            <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
          </div>
        </div>
      `;
    }).join('');

    console.log('Generated HTML length:', html.length);
    container.innerHTML = html;
    console.log('Container innerHTML set');

    // Load card images
    this.loadZoneImages(this.library);
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
    if (cardsDrawnEl) cardsDrawnEl.textContent = this.gameStats.cardsDrawn;
    if (landsPlayedEl) landsPlayedEl.textContent = this.gameStats.landsPlayed;
    if (spellsCastEl) spellsCastEl.textContent = this.gameStats.spellsCast;
    if (turnNumberEl) turnNumberEl.textContent = this.gameStats.turnNumber;

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

    // Update delirium indicator (efficient - only if graveyard has cards)
    this.updateDeliriumIndicator();

    // Update opponent info (two-player layout only)
    const opponentLife2El = document.getElementById('opponentLife2');
    const opponentHandCount2El = document.getElementById('opponentHandCount2');
    const opponentGraveyardCount2El = document.getElementById('opponentGraveyardCount2');
    const opponentExileCount2El = document.getElementById('opponentExileCount2');

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

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) {
      console.error('Missing modal elements for card preview');
      return;
    }

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';
    previewCardInfo.innerHTML = '<div class="text-center text-muted">Loading card details...</div>';

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

  escapeJs(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\\/g, '\\\\')
               .replace(/'/g, "\\'")
               .replace(/"/g, '\\"')
               .replace(/\n/g, '\\n')
               .replace(/\r/g, '\\r')
               .replace(/\t/g, '\\t');
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

    // Generate cards HTML with full card display like hand section
    let cardsHtml = '';
    if (cards.length === 0) {
      cardsHtml = '<div style="text-align: center; color: #666; padding: 40px; font-size: 16px;">No cards in this zone</div>';
    } else {
      // Show cards in reverse order (most recent first, which is typical for graveyard viewing)
      const orderedCards = [...cards].reverse();

      cardsHtml = orderedCards.map((card, index) => {
        const orderNumber = cards.length - index; // Show original position
        // Use the actual card ID if available, otherwise find the original index in the non-reversed array
        const originalIndex = cards.findIndex(c => c === card);
        const cardId = card.id || `${card.name}_${originalIndex}`;
        const cardType = this.getCardMainType(card.type || '').toLowerCase();
        const menuFunction = modalId === 'graveyard' || modalId === 'opponent-graveyard' ? 'showGraveyardCardMenu' : 'showExileCardMenu';
        const sourceZone = modalId.includes('graveyard') ? 'graveyard' : 'exile';

        return `
        <div class="card-hand ${cardType} card-dealt modal-card-item"
             data-card-id="${cardId}"
             data-card-name="${this.escapeHtml(card.name)}"
             style="position: relative;"
             onclick="window.handSimulator.playModalCard('${this.escapeJs(cardId)}', event, '${modalId}')"
             oncontextmenu="window.handSimulator.${menuFunction}(event, '${this.escapeJs(cardId)}'); return false;"
             title="${this.escapeHtml(card.name)} - ${this.escapeHtml(card.cost || '0')} (Left-click to play from ${sourceZone || 'zone'}, Right-click for options)">

          <!-- Order indicator -->
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #007bff;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 10;
          ">${orderNumber}</div>

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
    }

    // Create modal content
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      ">
        <div style="
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        ">
          <div>
            <h3 style="margin: 0; font-size: 18px; color: #333;">${title}</h3>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">
              ${cards.length} cards • ${cards.length > 0 ? 'Most recent first • Numbers show original order' : 'Empty zone'}
            </div>
          </div>
          <button onclick="document.getElementById('simple-modal-${modalId}').remove()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">✕ Close</button>
        </div>
        <div style="
          padding: 20px;
          overflow-y: auto;
          max-height: 70vh;
        ">
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
          ">
            ${cardsHtml}
          </div>
        </div>
      </div>
    `;

    // Add click-to-close on backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Add to document
    document.body.appendChild(modal);

    // Load card images if there are cards - use same method as hand cards
    if (cards.length > 0) {
      await this.loadZoneImages(cards);
    }

    console.log(`Modal ${modalId} created and added to DOM`);
  }

  async loadModalCardImages(cards, modal) {
    console.log('loadModalCardImages called with cards:', cards.length);
    console.log('Original cards order:', cards.map(c => c.name));

    const orderedCards = [...cards].reverse();
    console.log('Reversed cards order:', orderedCards.map(c => c.name));

    // Collect all placeholders upfront before any modifications
    const placeholders = modal.querySelectorAll('.loading-placeholder');
    console.log(`Found ${placeholders.length} placeholders for ${orderedCards.length} cards`);

    for (let i = 0; i < orderedCards.length; i++) {
      const card = orderedCards[i];
      const cardName = card.name;

      try {
        console.log(`Loading image for ${cardName} using CardImageService`);
        const imageUrl = await CardImageService.getCardImageUrl(cardName, 'small');

        if (placeholders[i]) {
          const placeholder = placeholders[i];
          console.log(`Updating placeholder ${i} with image for ${cardName} (position ${i+1} of ${orderedCards.length})`);

          // Create image element with proper styling like hand display
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = cardName;
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
            opacity: 0;
            transition: opacity 0.3s ease;
          `;

          img.onload = function() {
            this.style.opacity = '1';
          };

          // Replace the placeholder content but keep the container structure
          placeholder.innerHTML = '';
          placeholder.appendChild(img);
          // Remove the loading-placeholder class since we're done loading
          placeholder.classList.remove('loading-placeholder');
        } else {
          console.log('No placeholder found for card at index', i);
        }
      } catch (error) {
        console.log(`Failed to load image for ${cardName}:`, error);
        // Show a better placeholder for failed images
        if (placeholders[i]) {
          const placeholder = placeholders[i];
          placeholder.innerHTML = `<div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            border-radius: 8px;
          ">
            <div style="font-size: 20px; margin-bottom: 4px;">🎴</div>
            <div style="font-size: 10px; line-height: 1.2;">${cardName}</div>
          </div>`;
          placeholder.classList.remove('loading-placeholder');
        }
      }
    }
  }

  showOpponentExileModal() {
    this.showSimpleModal('opponent-exile', this.opponent.exile, '🚫 Opponent Exile');
  }

  showZoneModal(modalId, contentId, cards, title) {
    console.log(`showZoneModal called: modalId=${modalId}, contentId=${contentId}, title=${title}`);
    console.log('Cards to display:', cards);
    const modal = document.getElementById(modalId);
    const content = document.getElementById(contentId);
    console.log('Modal found:', !!modal);
    console.log('Content found:', !!content);

    if (modal) {
      console.log('Modal current display style:', modal.style.display);
      console.log('Modal current innerHTML length:', modal.innerHTML.length);
      console.log('Modal HTML starts with:', modal.innerHTML.substring(0, 100));
    }

    if (!modal || !content) {
      console.log('Modal or content not found, returning');
      return;
    }

    const titleElement = modal.querySelector('h3');
    console.log('Title element found:', !!titleElement);
    console.log('Modal structure:', modal.innerHTML.substring(0, 200));

    if (titleElement) {
      titleElement.textContent = title;
      console.log('Title set to:', title);
    } else {
      console.log('ERROR: No h3 element found in modal');
    }

    // Update modal content with cards
    if (cards.length === 0) {
      console.log('No cards in zone, showing empty message');
      content.innerHTML = '<div class="text-muted text-center p-4">No cards in this zone</div>';
    } else {
      console.log(`Generating HTML for ${cards.length} cards`);
      const cardHtml = cards.map(card => {
        console.log('Processing card:', card);
        return `
        <div class="zone-card"
             data-card-id="${card.id}"
             data-card-name="${this.escapeHtml(card.name)}"
             style="cursor: pointer; background: white; border: 1px solid #ccc; padding: 8px; margin: 4px; min-height: 100px;"
             onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')"
             title="${this.escapeHtml(card.name)} - ${this.escapeHtml(card.cost || '0')}">
          <div class="card-image-container">
            <div class="loading-placeholder">🎴</div>
          </div>
          <div class="card-info">
            <div class="card-name">${this.escapeHtml(card.name)}</div>
            <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
          </div>
        </div>
      `;
      }).join('');

      console.log('Generated HTML length:', cardHtml.length);
      content.innerHTML = cardHtml;
      console.log('Content innerHTML set, length:', content.innerHTML.length);

      // Add a test div to ensure something is visible
      content.innerHTML += '<div style="background: red; color: white; padding: 20px; margin: 10px;">TEST: Graveyard Modal Content</div>';

      // Load images for cards
      this.loadZoneImages(cards);
    }

    // Use the original modal structure but update only the content
    const modalTitleElement = modal.querySelector('h3');
    console.log('Title element found:', !!modalTitleElement);
    console.log('Modal structure:', modal.innerHTML.substring(0, 200));

    if (modalTitleElement) {
      modalTitleElement.textContent = title;
      console.log('Title set to:', title);
    } else {
      console.log('ERROR: No h3 element found in modal');
    }

    // Generate card HTML with simple, visible styling
    let cardHtml = '';
    if (cards.length === 0) {
      console.log('No cards in zone, showing empty message');
      cardHtml = '<div style="color: #666; text-align: center; padding: 20px;">No cards in this zone</div>';
    } else {
      console.log(`Generating HTML for ${cards.length} cards`);
      cardHtml = cards.map(card => {
        console.log('Processing card:', card);
        return `
        <div style="
          background: #f0f0f0;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 12px;
          margin: 8px;
          display: inline-block;
          min-width: 120px;
          text-align: center;
          cursor: pointer;
        " onclick="window.handSimulator.showCardPreview('${this.escapeJs(card.name)}')">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${this.escapeHtml(card.name)}</div>
          <div style="font-size: 12px; color: #666;">${this.escapeHtml(card.cost || 'N/A')}</div>
          <div style="font-size: 10px; color: #999;">${this.escapeHtml(card.type || '')}</div>
        </div>
        `;
      }).join('');

      console.log('Generated HTML length:', cardHtml.length);
    }

    // Update only the content area, not the entire modal
    if (content) {
      content.innerHTML = cardHtml;
      console.log('Content innerHTML set, length:', content.innerHTML.length);
    } else {
      console.log('ERROR: Content element not found, using modal body');
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.innerHTML = cardHtml;
      }
    }

    // Simple test - just override the modal content completely to see if it works
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border: 3px solid red;
        border-radius: 8px;
        z-index: 999999;
        max-width: 600px;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      ">
        <h3>🪦 ${title} TEST</h3>
        <div style="background: yellow; padding: 20px; margin: 20px 0; border: 2px solid black;">
          MODAL IS WORKING! Cards: ${cards.length}
        </div>
        <button onclick="window.handSimulator.hideZoneModal('${modalId}')"
                style="background: red; color: white; padding: 10px 20px; border: none; border-radius: 4px;">
          CLOSE
        </button>
      </div>
    `;

    console.log('Setting modal display to flex');
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '999999';
    modal.classList.add('fade-in');
    console.log('Modal should now be visible with all styles applied');
  }

  hideZoneModal(modalId) {
    console.log('hideZoneModal called for:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
      console.log('Modal found, hiding...');
      modal.classList.remove('fade-in');
      modal.style.display = 'none';

      // Reset the modal structure to ensure it can be reused
      modal.style.position = '';
      modal.style.top = '';
      modal.style.left = '';
      modal.style.width = '';
      modal.style.height = '';
      modal.style.backgroundColor = '';
      modal.style.zIndex = '';

      console.log('Modal hidden and reset');
    } else {
      console.log('Modal not found:', modalId);
    }
  }

  // Hand card movement functions
  moveHandCardToGraveyard(cardId) {
    // Determine which player's hand and graveyard to use
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;
    const currentGraveyard = this.activePlayer === 'opponent' ? this.opponent.graveyard : this.graveyard;

    const cardIndex = currentHand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = currentHand.splice(cardIndex, 1)[0];
      currentGraveyard.push(card);
      this.updateHandDisplay();
      this.updateGraveyardDisplay();
      this.updateUI();
      const playerName = this.activePlayer === 'opponent' ? 'Opponent\'s' : '';
      this.showToast(`${playerName} ${card.name} moved to graveyard`, 'info');
    }
  }

  moveHandCardToExile(cardId) {
    // Determine which player's hand and exile to use
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;
    const currentExile = this.activePlayer === 'opponent' ? this.opponent.exile : this.exile;

    const cardIndex = currentHand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = currentHand.splice(cardIndex, 1)[0];
      currentExile.push(card);
      this.updateHandDisplay();
      this.updateExileDisplay();
      this.updateUI();
      const playerName = this.activePlayer === 'opponent' ? 'Opponent\'s' : '';
      this.showToast(`${playerName} ${card.name} exiled`, 'info');
    }
  }

  moveHandCardToLibrary(cardId) {
    // Determine which player's hand and library to use
    const currentHand = this.activePlayer === 'opponent' ? this.opponent.hand : this.hand;
    const currentLibrary = this.activePlayer === 'opponent' ? this.opponent.library : this.library;

    const cardIndex = currentHand.findIndex((card, idx) => {
      const actualCardId = card.id || `${card.name}_${idx}`;
      return actualCardId === cardId;
    });

    if (cardIndex !== -1) {
      const card = currentHand.splice(cardIndex, 1)[0];

      // Ask where to put it in library
      const position = window.prompt('Put on top (t) or bottom (b) of library?', 't');
      if (position === null) {
        // Cancelled - put card back in hand
        currentHand.splice(cardIndex, 0, card);
        return;
      }

      const playerName = this.activePlayer === 'opponent' ? 'Opponent\'s ' : '';
      if (position.toLowerCase() === 'b' || position.toLowerCase() === 'bottom') {
        currentLibrary.unshift(card); // Bottom of library
        this.showToast(`${playerName}${card.name} put on bottom of library`, 'info');
      } else {
        currentLibrary.push(card); // Top of library
        this.showToast(`${playerName}${card.name} put on top of library`, 'info');
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
    this.updatePlayerContextUI();
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

  // ========================================
  // ENHANCED TWO-PLAYER SYSTEM
  // ========================================


  /**
   * Pass turn to the other player (for structured gameplay)
   */
  passTurn() {
    const previousPlayer = this.activePlayer;

    // Use the existing endTurn() method which handles everything
    // including switching players, drawing cards, and advancing phases
    this.endTurn();

    // Update our enhanced UI context
    this.updatePlayerContextUI();

    this.playSound?.('success');
    this.showToast(`Turn passed from ${previousPlayer} to ${this.activePlayer}`, 'info');
  }

  /**
   * Start a player's turn (used by startTwoPlayerGame)
   */
  startTurn() {
    // This method is mainly for initial game setup
    // Normal turn progression uses the existing endTurn() -> executeBeginningPhase() flow

    // Reset phase to beginning for proper turn structure
    this.turnState.phase = 'beginning';
    this.turnState.step = 'untap';
    this.turnState.isFirstTurn = false;

    // Use the existing beginning phase logic
    this.executeBeginningPhase();

    this.updateTurnDisplay();
    this.showToast(`${this.activePlayer}'s turn begins`, 'info');
  }

  /**
   * Draw card for currently active player
   */
  drawCardForActivePlayer() {
    if (this.activePlayer === 'player') {
      return this.drawCard();
    } else {
      return this.drawOpponentCard();
    }
  }

  /**
   * Get the state object for the currently active player
   */
  getActivePlayerState() {
    return this.activePlayer === 'player' ? this : this.opponent;
  }

  /**
   * Clear mana pool for active player
   */
  clearManaForActivePlayer() {
    const playerState = this.getActivePlayerState();
    playerState.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    this.updateUI();
  }

  /**
   * Untap all permanents for active player
   */
  untapAllPermanents() {
    const playerState = this.getActivePlayerState();

    // Untap all battlefield permanents
    ['lands', 'creatures', 'others'].forEach(zone => {
      playerState.battlefield[zone].forEach(card => {
        if (card.tapped) {
          card.tapped = false;
        }
      });
    });

    this.updateBattlefieldDisplay();
  }

  /**
   * Update UI to show which player is active
   */
  updatePlayerContextUI() {
    // Update player switch buttons
    const playerBtn = document.getElementById('switchToPlayer');
    const opponentBtn = document.getElementById('switchToOpponent');

    if (playerBtn && opponentBtn) {
      // Reset classes
      playerBtn.classList.remove('btn-primary', 'btn-secondary');
      opponentBtn.classList.remove('btn-primary', 'btn-secondary');

      if (this.activePlayer === 'player') {
        playerBtn.classList.add('btn-primary');
        opponentBtn.classList.add('btn-secondary');
        playerBtn.textContent = '🧙‍♂️ You (Active)';
        opponentBtn.textContent = '👤 Opponent';
      } else {
        playerBtn.classList.add('btn-secondary');
        opponentBtn.classList.add('btn-primary');
        playerBtn.textContent = '🧙‍♂️ You';
        opponentBtn.textContent = '👤 Opponent (Active)';
      }
    }

    // Update main control buttons context
    this.updateControlButtonContexts();

    // Update turn indicator
    this.updateTurnDisplay();
  }

  /**
   * Update control buttons to show which player they affect
   */
  updateControlButtonContexts() {
    const contextIndicator = document.getElementById('activePlayerIndicator');
    if (contextIndicator) {
      contextIndicator.textContent = this.activePlayer === 'player' ?
        'Controlling: You' : 'Controlling: Opponent';
      contextIndicator.className = `player-context ${this.activePlayer}`;
    }

    // Update button text to be clearer about who they affect
    const drawHandBtn = document.getElementById('drawHandButton');
    const drawCardBtn = document.getElementById('drawCardButton');
    const mulliganBtn = document.getElementById('mulligan');

    // Show whose turn it is (not who you're viewing)
    const turnPlayer = this.turnState.activePlayer === 'player' ? 'You' : 'Opponent';
    const viewingPlayer = this.activePlayer === 'player' ? 'You' : 'Opponent';

    if (drawHandBtn) drawHandBtn.textContent =
      `🎲 Draw Hand (Viewing: ${viewingPlayer})`;
    if (drawCardBtn) drawCardBtn.textContent =
      `📄 +1 (Turn: ${turnPlayer})`;
    if (mulliganBtn) mulliganBtn.textContent =
      `🔄 Mulligan (Viewing: ${viewingPlayer})`;
  }


  /**
   * Quick setup for two-player testing
   */
  async quickTwoPlayerSetup() {
    try {
      // Load default decks for both players
      const playerDeck = './xml/BigRedMachine.xml';
      const opponentDeck = './xml/Stasis.xml';

      this.showToast('Setting up two-player game...', 'info');

      // Load player deck first (this will reset game state)
      this.switchToPlayer();
      console.log('Loading player deck:', playerDeck);
      await this.loadDeck(playerDeck);
      console.log('Player deck loaded, drawing hand...');
      this.drawHand();

      // Load opponent deck AFTER player deck to avoid reset
      console.log('Loading opponent deck:', opponentDeck);
      await this.loadOpponentDeck(opponentDeck);
      console.log('Opponent deck loaded, drawing opponent hand...');
      this.drawOpponentHand(7);

      this.showToast('Two-player setup complete! Switch between players to control each side.', 'success');
      this.updatePlayerContextUI();

      console.log('Quick setup completed successfully');
    } catch (error) {
      console.error('Error during quick setup:', error);
      this.showToast('Error setting up two-player game. Please try manual setup.', 'error');
    }
  }

  /**
   * Start structured two-player game
   */
  startTwoPlayerGame() {
    if (!this.currentDeck || !this.opponent.currentDeck) {
      this.showToast('Both players need decks loaded first!', 'error');
      return;
    }

    // Reset game state
    this.turnState.turnNumber = 1;
    this.turnState.isFirstTurn = true;
    this.turnState.phase = 'beginning';

    // Determine starting player (could be random or player choice)
    this.activePlayer = 'player';

    this.showToast('Two-player game started! Player goes first.', 'success');
    this.updatePlayerContextUI();
    this.startTurn();
  }
}

// Initialize when DOM is loaded
let handSimulator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    handSimulator = new ModernHandSimulator();
    window.handSimulator = handSimulator; // Make available globally for onclick handlers

    console.log('=== GLOBAL ASSIGNMENT DEBUG ===');
    console.log('window.handSimulator set:', !!window.handSimulator);
    console.log('switchToOpponent method exists:', typeof window.handSimulator?.switchToOpponent);

    // Test the button after DOM is loaded
    setTimeout(() => {
      const opponentBtn = document.getElementById('switchToOpponent');
      console.log('Opponent button found:', !!opponentBtn);
      if (opponentBtn) {
        console.log('Button onclick attribute:', opponentBtn.getAttribute('onclick'));

        // Test direct method call
        console.log('Testing direct method call...');
        try {
          window.handSimulator.switchToOpponent();
        } catch (error) {
          console.error('Direct call failed:', error);
        }
      }
    }, 2000);
  });
} else {
  handSimulator = new ModernHandSimulator();
  window.handSimulator = handSimulator;
}