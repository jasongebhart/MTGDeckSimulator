/**
 * Event Listeners Module
 * Centralizes all event handling to eliminate inline onclick handlers
 * Enables proper CSP compliance and keyboard navigation
 */

export class EventListenerManager {
  constructor(handSimulator) {
    this.handSimulator = handSimulator;
    this.initialized = false;
  }

  /**
   * Initialize all event listeners
   */
  init() {
    if (this.initialized) {
      console.warn('EventListenerManager already initialized');
      return;
    }

    this.setupTopBarListeners();
    this.setupPlayerControlListeners();
    this.setupOpponentControlListeners();
    this.setupLifeCounterListeners();
    this.setupModalListeners();
    this.setupDropdownListeners();
    this.setupBoardWipesListeners();
    this.setupTokenMenuListeners();
    this.setupZoneButtonListeners();
    this.setupAdvancedActionsListeners();
    this.setupCombatListeners();
    this.setupDeckManagementListeners();
    this.setupMiscellaneousListeners();
    this.setupKeyboardShortcuts();
    this.setupAccessibilityFeatures();

    this.initialized = true;
    console.log('EventListenerManager initialized successfully');
  }

  /**
   * Top control bar event listeners
   */
  setupTopBarListeners() {
    // Deck selection button
    const deckBtn = document.querySelector('[data-action="open-deck-modal"]');
    if (deckBtn) {
      deckBtn.addEventListener('click', (e) => this.openDeckSelectionModal(e));
    }

    // Quick setup button
    const setupBtn = document.querySelector('[data-action="quick-setup"]');
    if (setupBtn) {
      setupBtn.addEventListener('click', () => {
        this.handSimulator?.quickTwoPlayerSetup();
      });
    }

    // Combat button
    const combatBtn = document.getElementById('combatButton');
    if (combatBtn) {
      combatBtn.addEventListener('click', () => {
        this.handSimulator?.initializeCombat();
      });
    }

    // Board wipes toggle
    const boardWipesBtn = document.getElementById('boardWipesToggleBtn');
    if (boardWipesBtn) {
      boardWipesBtn.addEventListener('click', () => {
        const panel = document.getElementById('boardWipesActionPanel');
        if (panel) panel.classList.add('show');
      });
    }
  }

  /**
   * Player control event listeners
   */
  setupPlayerControlListeners() {
    // Draw card
    const drawBtn = document.querySelector('[data-action="draw-card"]');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        this.handSimulator?.drawCard();
      });
    }

    // Mulligan
    const mulliganBtn = document.querySelector('[data-action="mulligan"]');
    if (mulliganBtn) {
      mulliganBtn.addEventListener('click', () => {
        this.handSimulator?.mulligan();
      });
    }

    // New game / Reset and draw 7
    const newGameBtn = document.querySelector('[data-action="new-game"]');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.handSimulator?.resetAndDraw7();
      });
    }

    // Untap all
    const untapBtn = document.querySelector('[data-action="untap-all"]');
    if (untapBtn) {
      untapBtn.addEventListener('click', () => {
        this.handSimulator?.untapAll();
      });
    }

    // Pass turn
    const passTurnBtn = document.querySelector('[data-action="pass-turn"]');
    if (passTurnBtn) {
      passTurnBtn.addEventListener('click', () => {
        this.handSimulator?.passTurn();
      });
    }

    // End turn
    const endTurnBtn = document.querySelector('[data-action="end-turn"]');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => {
        this.handSimulator?.endTurn();
      });
    }

    // Shuffle
    const shuffleBtn = document.querySelector('[data-action="shuffle"]');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.handSimulator?.shuffleDeck();
      });
    }

    // Sort hand
    const sortHandBtn = document.querySelector('[data-action="sort-hand"]');
    if (sortHandBtn) {
      sortHandBtn.addEventListener('click', () => {
        this.handSimulator?.sortHand();
      });
    }
  }

  /**
   * Opponent control event listeners
   */
  setupOpponentControlListeners() {
    // Draw opponent card
    const drawOpponentBtn = document.querySelector('[data-action="draw-opponent-card"]');
    if (drawOpponentBtn) {
      drawOpponentBtn.addEventListener('click', () => {
        this.handSimulator?.drawOpponentCard();
      });
    }

    // Mulligan opponent
    const mulliganOpponentBtn = document.querySelector('[data-action="mulligan-opponent"]');
    if (mulliganOpponentBtn) {
      mulliganOpponentBtn.addEventListener('click', () => {
        this.handSimulator?.mulliganOpponent();
      });
    }

    // Reset and draw 7 for opponent
    const newGameOpponentBtn = document.querySelector('[data-action="new-game-opponent"]');
    if (newGameOpponentBtn) {
      newGameOpponentBtn.addEventListener('click', () => {
        this.handSimulator?.resetAndDrawOpponent7();
      });
    }

    // Untap opponent
    const untapOpponentBtn = document.querySelector('[data-action="untap-opponent"]');
    if (untapOpponentBtn) {
      untapOpponentBtn.addEventListener('click', () => {
        this.handSimulator?.untapOpponent();
      });
    }

    // Sort opponent hand
    const sortOpponentHandBtn = document.querySelector('[data-action="sort-opponent-hand"]');
    if (sortOpponentHandBtn) {
      sortOpponentHandBtn.addEventListener('click', () => {
        this.handSimulator?.sortOpponentHand();
      });
    }
  }

  /**
   * Life counter event listeners with delegation for dynamic buttons
   */
  setupLifeCounterListeners() {
    // Player life changes - use event delegation
    document.addEventListener('click', (e) => {
      const lifeBtn = e.target.closest('[data-action="change-life"]');
      if (lifeBtn) {
        const amount = parseInt(lifeBtn.dataset.amount, 10);
        this.handSimulator?.changeLife(amount);
        e.stopPropagation();
      }
    });

    // Opponent life changes - use event delegation
    document.addEventListener('click', (e) => {
      const opponentLifeBtn = e.target.closest('[data-action="change-opponent-life"]');
      if (opponentLifeBtn) {
        const amount = parseInt(opponentLifeBtn.dataset.amount, 10);
        this.handSimulator?.changeOpponentLife(amount);
        e.stopPropagation();
      }
    });

    // Click on life total to set exact value
    const playerLife = document.getElementById('playerLife');
    if (playerLife) {
      playerLife.addEventListener('click', () => {
        const newLife = prompt('Set your life:', playerLife.textContent);
        if (newLife !== null) {
          this.handSimulator?.setLife(parseInt(newLife, 10));
        }
      });
    }

    const opponentLife = document.getElementById('opponentLife2');
    if (opponentLife) {
      opponentLife.addEventListener('click', () => {
        const newLife = prompt('Set opponent life:', opponentLife.textContent);
        if (newLife !== null) {
          this.handSimulator?.setOpponentLife(parseInt(newLife, 10));
        }
      });
    }
  }

  /**
   * Modal event listeners
   */
  setupModalListeners() {
    // Close modal buttons
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close-modal"]');
      if (closeBtn) {
        const modalId = closeBtn.dataset.modalId;
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.style.display = 'none';
          const modalContent = modal.querySelector('.modal-content');
          if (modalContent) modalContent.classList.remove('show');
        }
      }
    });

    // Close modal when clicking backdrop
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        const modalContent = e.target.querySelector('.modal-content');
        if (modalContent) modalContent.classList.remove('show');
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="display: flex"]');
        if (openModal) {
          openModal.style.display = 'none';
          const modalContent = openModal.querySelector('.modal-content');
          if (modalContent) modalContent.classList.remove('show');
        }
      }
    });
  }

  /**
   * Dropdown menu event listeners
   */
  setupDropdownListeners() {
    // Toggle dropdowns
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-dropdown"]');
      if (toggleBtn) {
        const targetId = toggleBtn.dataset.target;
        const dropdown = document.getElementById(targetId);
        if (dropdown) {
          dropdown.classList.toggle('show');
        }
        e.stopPropagation();
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const isDropdownButton = e.target.closest('[data-action="toggle-dropdown"]');
      const isInsideDropdown = e.target.closest('.dropdown-menu, .advanced-actions-panel');

      if (!isDropdownButton && !isInsideDropdown) {
        document.querySelectorAll('.dropdown-menu.show, .advanced-actions-panel.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });

    // Dropdown items
    document.addEventListener('click', (e) => {
      const dropdownItem = e.target.closest('.dropdown-item[data-action]');
      if (dropdownItem) {
        const action = dropdownItem.dataset.action;

        // Execute action based on data attribute
        switch (action) {
          case 'start-two-player':
            this.handSimulator?.startTwoPlayerGame();
            break;
          case 'toggle-sounds':
            this.handSimulator?.toggleSounds();
            break;
          case 'test-counters':
            // Handle test counters action
            break;
        }

        // Close the dropdown
        const dropdown = dropdownItem.closest('.dropdown-menu');
        if (dropdown) {
          dropdown.classList.remove('show');
        }
      }
    });
  }

  /**
   * Board wipes panel event listeners
   */
  setupBoardWipesListeners() {
    // Delegate board wipe spell clicks
    document.addEventListener('click', (e) => {
      const wipeBtn = e.target.closest('[data-action="cast-board-wipe"]');
      if (wipeBtn) {
        const spellName = wipeBtn.dataset.spell;
        this.handSimulator?.castBoardWipe?.(spellName);
      }
    });

    // Close board wipes panel
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close-board-wipes"]');
      if (closeBtn) {
        const panel = document.getElementById('boardWipesActionPanel');
        if (panel) panel.classList.remove('show');
      }
    });
  }

  /**
   * Token menu event listeners
   */
  setupTokenMenuListeners() {
    // Show token menu
    const tokenMenuBtn = document.querySelector('[data-action="show-token-menu"]');
    if (tokenMenuBtn) {
      tokenMenuBtn.addEventListener('click', (e) => {
        const container = document.getElementById('playerTokenMenuContainer');
        if (!container) return;

        const rect = tokenMenuBtn.getBoundingClientRect();
        container.style.display = 'block';
        container.style.left = rect.left + 'px';
        container.style.top = (rect.bottom + 4) + 'px';
        e.stopPropagation();
      });
    }

    // Create token with updated parameters (token-name, token-type, player)
    document.addEventListener('click', (e) => {
      const tokenBtn = e.target.closest('[data-action="create-token"]');
      if (tokenBtn) {
        const tokenName = tokenBtn.dataset.tokenName;
        const tokenType = tokenBtn.dataset.tokenType;
        const player = tokenBtn.dataset.player || 'player';
        this.handSimulator?.createToken?.(tokenName, tokenType, player);

        // Close token menu if it exists
        const container = document.getElementById('playerTokenMenuContainer');
        if (container) container.style.display = 'none';
      }
    });

    // Close token menu when clicking outside
    document.addEventListener('click', (e) => {
      const container = document.getElementById('playerTokenMenuContainer');
      const isTokenButton = e.target.closest('[data-action="show-token-menu"]');
      const isInsideMenu = e.target.closest('#playerTokenMenuContainer');

      if (container && !isTokenButton && !isInsideMenu) {
        container.style.display = 'none';
      }
    });
  }

  /**
   * Zone button event listeners (Library, Graveyard, Exile)
   */
  setupZoneButtonListeners() {
    // Show library
    document.addEventListener('click', (e) => {
      const libBtn = e.target.closest('[data-action="show-library"]');
      if (libBtn) {
        const player = libBtn.dataset.player || 'player';
        this.handSimulator?.showLibraryModal?.(player);
      }
    });

    // Show graveyard
    document.addEventListener('click', (e) => {
      const gyBtn = e.target.closest('[data-action="show-graveyard"]');
      if (gyBtn) {
        const player = gyBtn.dataset.player || 'player';
        this.handSimulator?.showGraveyardModal?.(player);
      }
    });

    // Show exile
    document.addEventListener('click', (e) => {
      const exileBtn = e.target.closest('[data-action="show-exile"]');
      if (exileBtn) {
        const player = exileBtn.dataset.player || 'player';
        this.handSimulator?.showExileModal?.(player);
      }
    });

    // Untap all opponent
    document.addEventListener('click', (e) => {
      const untapBtn = e.target.closest('[data-action="untap-all-opponent"]');
      if (untapBtn) {
        this.handSimulator?.untapOpponent?.();
      }
    });
  }

  /**
   * Advanced action event listeners (Scry, Cascade, etc.)
   */
  setupAdvancedActionsListeners() {
    // View top card
    document.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('[data-action="view-top-card"]');
      if (viewBtn) {
        const player = viewBtn.dataset.player || 'player';
        this.handSimulator?.viewTopCard?.(player);
      }
    });

    // View top cards (multiple)
    document.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('[data-action="view-top-cards"]');
      if (viewBtn) {
        const player = viewBtn.dataset.player || 'player';
        const amount = parseInt(viewBtn.dataset.amount, 10) || 3;
        this.handSimulator?.viewTopCards?.(player, amount);
      }
    });

    // Scry
    document.addEventListener('click', (e) => {
      const scryBtn = e.target.closest('[data-action="scry"]');
      if (scryBtn) {
        const player = scryBtn.dataset.player || 'player';
        const amount = parseInt(scryBtn.dataset.amount, 10) || 1;
        this.handSimulator?.scry?.(player, amount);
      }
    });

    // Ponder
    document.addEventListener('click', (e) => {
      const ponderBtn = e.target.closest('[data-action="ponder"]');
      if (ponderBtn) {
        const player = ponderBtn.dataset.player || 'player';
        this.handSimulator?.ponder?.(player);
      }
    });

    // Brainstorm
    document.addEventListener('click', (e) => {
      const brainstormBtn = e.target.closest('[data-action="brainstorm"]');
      if (brainstormBtn) {
        const player = brainstormBtn.dataset.player || 'player';
        this.handSimulator?.brainstorm?.(player);
      }
    });

    // Surveil
    document.addEventListener('click', (e) => {
      const surveilBtn = e.target.closest('[data-action="surveil"]');
      if (surveilBtn) {
        const player = surveilBtn.dataset.player || 'player';
        const amount = parseInt(surveilBtn.dataset.amount, 10) || 1;
        this.handSimulator?.surveil?.(player, amount);
      }
    });

    // Shuffle library
    document.addEventListener('click', (e) => {
      const shuffleBtn = e.target.closest('[data-action="shuffle-library"]');
      if (shuffleBtn) {
        const player = shuffleBtn.dataset.player || 'player';
        this.handSimulator?.shuffleLibrary?.(player);
      }
    });

    // Mill cards
    document.addEventListener('click', (e) => {
      const millBtn = e.target.closest('[data-action="mill-cards"]');
      if (millBtn) {
        const player = millBtn.dataset.player || 'player';
        const amount = parseInt(millBtn.dataset.amount, 10) || 1;
        this.handSimulator?.millCards?.(player, amount);
      }
    });

    // Cascade
    document.addEventListener('click', (e) => {
      const cascadeBtn = e.target.closest('[data-action="cascade"]');
      if (cascadeBtn) {
        const player = cascadeBtn.dataset.player || 'player';
        this.handSimulator?.cascade?.(player);
      }
    });

    // Evolving Wilds / Fetch land
    document.addEventListener('click', (e) => {
      const fetchBtn = e.target.closest('[data-action="evolving-wilds"]');
      if (fetchBtn) {
        const player = fetchBtn.dataset.player || 'player';
        this.handSimulator?.evolvingWilds?.(player);

        // Close panel if specified
        const panelId = fetchBtn.dataset.closePanel;
        if (panelId) {
          const panel = document.getElementById(panelId);
          if (panel) panel.classList.remove('show');
        }
      }
    });

    // Cultivate
    document.addEventListener('click', (e) => {
      const cultivateBtn = e.target.closest('[data-action="cultivate"]');
      if (cultivateBtn) {
        const player = cultivateBtn.dataset.player || 'player';
        this.handSimulator?.cultivate?.(player);

        // Close panel if specified
        const panelId = cultivateBtn.dataset.closePanel;
        if (panelId) {
          const panel = document.getElementById(panelId);
          if (panel) panel.classList.remove('show');
        }
      }
    });

    // Execute discard
    document.addEventListener('click', (e) => {
      const discardBtn = e.target.closest('[data-action="execute-discard"]');
      if (discardBtn) {
        const player = discardBtn.dataset.player || 'player';
        const amount = parseInt(discardBtn.dataset.amount, 10) || 1;
        const mode = discardBtn.dataset.mode || 'random';
        this.handSimulator?.executeDiscard?.(player, amount, mode);
      }
    });

    // Test actions
    document.addEventListener('click', (e) => {
      const testGYBtn = e.target.closest('[data-action="add-test-card-to-graveyard"]');
      if (testGYBtn) {
        this.handSimulator?.addTestCardToGraveyard?.();
      }
    });

    document.addEventListener('click', (e) => {
      const testExileBtn = e.target.closest('[data-action="add-test-card-to-exile"]');
      if (testExileBtn) {
        this.handSimulator?.addTestCardToExile?.();
      }
    });

    document.addEventListener('click', (e) => {
      const testCreatureBtn = e.target.closest('[data-action="add-test-creature-with-counters"]');
      if (testCreatureBtn) {
        this.handSimulator?.addTestCreatureWithCounters?.();
      }
    });

    // Toggle panel (generic)
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-panel"]');
      if (toggleBtn) {
        const panelId = toggleBtn.dataset.panelId;
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.toggle('show');
      }
    });

    // Close panel (generic)
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close-panel"]');
      if (closeBtn) {
        const panelId = closeBtn.dataset.panelId;
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.remove('show');
      }
    });
  }

  /**
   * Deck management event listeners
   */
  setupDeckManagementListeners() {
    // Load player deck
    document.addEventListener('click', (e) => {
      const loadBtn = e.target.closest('[data-action="load-player-deck"]');
      if (loadBtn) {
        const selectId = loadBtn.dataset.selectId;
        const selector = document.getElementById(selectId);
        const selectedOption = selector?.querySelector('.deck-option.selected');
        if (selectedOption?.dataset.path) {
          this.handSimulator?.loadDeck?.(selectedOption.dataset.path);
        }
      }
    });

    // Load opponent deck
    document.addEventListener('click', (e) => {
      const loadBtn = e.target.closest('[data-action="load-opponent-deck"]');
      if (loadBtn) {
        const selectId = loadBtn.dataset.selectId;
        const selector = document.getElementById(selectId);
        const selectedOption = selector?.querySelector('.deck-option.selected');
        if (selectedOption?.dataset.path) {
          this.handSimulator?.loadOpponentDeck?.(selectedOption.dataset.path);
        }
      }
    });

    // Set player 1 deck as default
    document.addEventListener('click', (e) => {
      const setDefaultBtn = e.target.closest('[data-action="set-player1-deck-default"]');
      if (setDefaultBtn) {
        this.handSimulator?.setPlayer1DeckAsDefault?.();
      }
    });

    // Clear player 1 default deck
    document.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-action="clear-default-player1-deck"]');
      if (clearBtn) {
        this.handSimulator?.clearDefaultPlayer1Deck?.();
      }
    });

    // Set opponent deck as default
    document.addEventListener('click', (e) => {
      const setDefaultBtn = e.target.closest('[data-action="set-opponent-deck-default"]');
      if (setDefaultBtn) {
        this.handSimulator?.setOpponentDeckAsDefault?.();
      }
    });

    // Clear opponent default deck
    document.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-action="clear-default-opponent-deck"]');
      if (clearBtn) {
        this.handSimulator?.clearDefaultOpponentDeck?.();
      }
    });

    // Trigger XML upload
    document.addEventListener('click', (e) => {
      const uploadBtn = e.target.closest('[data-action="trigger-xml-upload"]');
      if (uploadBtn) {
        const fileInput = document.getElementById('xmlFile');
        if (fileInput) fileInput.click();
      }
    });

    // Filter decks (deck search input)
    document.addEventListener('input', (e) => {
      const searchInput = e.target.closest('[data-action="filter-decks"]');
      if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        if (window.filterDecks) {
          window.filterDecks(searchTerm);
        }
      }
    });
  }

  /**
   * Miscellaneous event listeners
   */
  setupMiscellaneousListeners() {
    // Focus deck search
    document.addEventListener('click', (e) => {
      const focusBtn = e.target.closest('[data-action="focus-deck-search"]');
      if (focusBtn) {
        const searchInput = document.querySelector('.deck-search-input');
        if (searchInput) searchInput.focus();
      }
    });

    // Trigger file upload
    document.addEventListener('click', (e) => {
      const triggerBtn = e.target.closest('[data-action="trigger-file-upload"]');
      if (triggerBtn) {
        const fileButton = document.getElementById('loadXMLFileButton');
        if (fileButton) fileButton.click();
      }
    });

    // Close mobile sidebar
    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('[data-action="close-mobile-sidebar"]');
      if (overlay) {
        document.body.classList.remove('mobile-sidebar-open');
      }
    });

    // Open deck modal (delegate for all instances)
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-action="open-deck-modal"]');
      if (openBtn) {
        this.openDeckSelectionModal(e);
      }
    });

    // Stop propagation (for modal content)
    document.addEventListener('click', (e) => {
      const stopProp = e.target.closest('[data-action="stop-propagation"]');
      if (stopProp) {
        e.stopPropagation();
      }
    });

    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
      const backdrop = e.target.closest('[data-action="close-modal-on-backdrop"]');
      if (backdrop && e.target === backdrop) {
        const modalId = backdrop.dataset.modalId;
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
      }
    });
  }

  /**
   * Keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'd':
          this.handSimulator?.drawCard();
          e.preventDefault();
          break;
        case 'n':
          this.handSimulator?.resetAndDraw7();
          e.preventDefault();
          break;
        case 'm':
          this.handSimulator?.mulligan();
          e.preventDefault();
          break;
        case 'p':
          this.handSimulator?.passTurn();
          e.preventDefault();
          break;
        case 't':
          this.handSimulator?.endTurn();
          e.preventDefault();
          break;
        case 'u':
          this.handSimulator?.untapAll();
          e.preventDefault();
          break;
        case 'c':
          this.handSimulator?.initializeCombat();
          e.preventDefault();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+S / Cmd+S - Save state
            e.preventDefault();
            // Add save functionality if available
          } else {
            this.handSimulator?.shuffleDeck();
            e.preventDefault();
          }
          break;
        case '?':
          // Show keyboard shortcuts help
          this.showKeyboardHelp();
          e.preventDefault();
          break;
      }
    });
  }

  /**
   * Accessibility features
   */
  setupAccessibilityFeatures() {
    // Add ARIA live region for announcements if not exists
    if (!document.getElementById('ariaLiveRegion')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'ariaLiveRegion';
      liveRegion.className = 'live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }

    // Add skip link if not exists
    if (!document.querySelector('.skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Make cards keyboard accessible
    this.makeCardsAccessible();
  }

  /**
   * Make card elements keyboard accessible
   */
  makeCardsAccessible() {
    // Add to all existing cards
    const cards = document.querySelectorAll('.card, .zone-card');
    cards.forEach(card => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'button');
      }

      // Add keyboard support for card interactions
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          card.click();
          e.preventDefault();
        }
      });
    });
  }

  /**
   * Show keyboard shortcuts help overlay
   */
  showKeyboardHelp() {
    // Check if help overlay exists
    let helpOverlay = document.getElementById('keyboardHelpOverlay');

    if (!helpOverlay) {
      helpOverlay = this.createKeyboardHelpOverlay();
      document.body.appendChild(helpOverlay);
    }

    helpOverlay.style.display = 'block';

    // Focus the close button
    const closeBtn = helpOverlay.querySelector('[data-action="close-keyboard-help"]');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Create keyboard help overlay element
   */
  createKeyboardHelpOverlay() {
    const backdrop = document.createElement('div');
    backdrop.className = 'keyboard-help-backdrop';
    backdrop.id = 'keyboardHelpOverlay';

    const overlay = document.createElement('div');
    overlay.className = 'keyboard-help-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'keyboardHelpTitle');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <h2 id="keyboardHelpTitle">⌨️ Keyboard Shortcuts</h2>
      <div class="keyboard-help-grid">
        <span class="keyboard-help-key">D</span>
        <span class="keyboard-help-description">Draw Card</span>

        <span class="keyboard-help-key">N</span>
        <span class="keyboard-help-description">New Game (Draw 7)</span>

        <span class="keyboard-help-key">M</span>
        <span class="keyboard-help-description">Mulligan</span>

        <span class="keyboard-help-key">T</span>
        <span class="keyboard-help-description">End Turn</span>

        <span class="keyboard-help-key">P</span>
        <span class="keyboard-help-description">Pass Turn</span>

        <span class="keyboard-help-key">U</span>
        <span class="keyboard-help-description">Untap All</span>

        <span class="keyboard-help-key">C</span>
        <span class="keyboard-help-description">Combat</span>

        <span class="keyboard-help-key">S</span>
        <span class="keyboard-help-description">Shuffle Deck</span>

        <span class="keyboard-help-key">?</span>
        <span class="keyboard-help-description">Show This Help</span>

        <span class="keyboard-help-key">Esc</span>
        <span class="keyboard-help-description">Close Modals</span>
      </div>
      <button class="btn btn-primary keyboard-help-close" data-action="close-keyboard-help">
        Close
      </button>
    `;

    backdrop.appendChild(overlay);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });

    // Close button
    const closeBtn = overlay.querySelector('[data-action="close-keyboard-help"]');
    closeBtn.addEventListener('click', () => {
      backdrop.style.display = 'none';
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.style.display === 'block') {
        backdrop.style.display = 'none';
      }
    });

    return backdrop;
  }

  /**
   * Open deck selection modal
   */
  async openDeckSelectionModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const modal = document.getElementById('deckSelectionModal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Add show class for animation
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      setTimeout(() => modalContent.classList.add('show'), 10);
    }

    // Fetch and populate decks
    try {
      const response = await fetch('/api/v1/decks/list');
      const decks = await response.json();
      this.populateDeckSelect(decks, 'deckSelectModal');
      this.populateDeckSelect(decks, 'opponentDeckSelectModal');
    } catch (error) {
      console.error('Error fetching deck list:', error);
    }

    // Update current deck displays
    const playerDeckNameModal = document.getElementById('playerDeckNameModal');
    const opponentDeckNameModal = document.getElementById('opponentDeckNameModal');

    if (playerDeckNameModal && this.handSimulator?.currentDeck?.name) {
      playerDeckNameModal.textContent = this.handSimulator.currentDeck.name;
    } else if (playerDeckNameModal) {
      playerDeckNameModal.textContent = 'No Deck';
    }

    if (opponentDeckNameModal && this.handSimulator?.gameState?.opponent?.deckName) {
      opponentDeckNameModal.textContent = this.handSimulator.gameState.opponent.deckName;
    } else if (opponentDeckNameModal) {
      opponentDeckNameModal.textContent = 'No Deck';
    }
  }

  /**
   * Populate deck selection dropdown
   */
  populateDeckSelect(decks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing options
    container.innerHTML = '';

    // Group decks by category
    const groupedDecks = decks.reduce((acc, deck) => {
      const category = deck.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(deck);
      return acc;
    }, {});

    // Populate container
    for (const category in groupedDecks) {
      const details = document.createElement('details');
      details.open = true;

      const summary = document.createElement('summary');
      summary.textContent = category;
      summary.style.fontWeight = 'bold';
      summary.style.cursor = 'pointer';
      summary.style.padding = '8px';
      summary.style.borderBottom = '1px solid var(--border-color)';

      details.appendChild(summary);

      const deckList = document.createElement('div');
      groupedDecks[category].forEach(deck => {
        const deckItem = document.createElement('div');
        deckItem.textContent = deck.name;
        deckItem.dataset.path = deck.path;
        deckItem.className = 'deck-option';
        deckItem.style.padding = '8px 16px';
        deckItem.style.cursor = 'pointer';

        deckItem.addEventListener('click', () => {
          // Load deck based on container
          if (containerId === 'deckSelectModal') {
            this.handSimulator?.loadDeck?.(deck.path);
          } else {
            this.handSimulator?.loadOpponentDeck?.(deck.path);
          }
        });

        deckItem.addEventListener('mouseenter', () => {
          deckItem.style.background = 'var(--bg-secondary)';
        });

        deckItem.addEventListener('mouseleave', () => {
          deckItem.style.background = 'none';
        });

        deckList.appendChild(deckItem);
      });

      details.appendChild(deckList);
      container.appendChild(details);
    }
  }

  /**
   * Announce to screen readers
   */
  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('ariaLiveRegion');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Combat system event listeners
   */
  setupCombatListeners() {
    // Combat toggle attacker
    document.addEventListener('click', (e) => {
      const attackerBtn = e.target.closest('[data-action="combat-toggle-attacker"]');
      if (attackerBtn) {
        const cardId = attackerBtn.dataset.cardId;
        this.handSimulator?.combatManager?.toggleAttacker(cardId);
        e.stopPropagation();
      }
    });

    // Combat select blocker (click)
    document.addEventListener('click', (e) => {
      const blockerBtn = e.target.closest('[data-action="combat-select-blocker"]');
      if (blockerBtn) {
        const cardId = blockerBtn.dataset.cardId;
        this.handSimulator?.combatManager?.selectBlocker(cardId);
        e.stopPropagation();
      }
    });

    // Combat assign blocker to attacker (click on attacker)
    document.addEventListener('click', (e) => {
      const assignBtn = e.target.closest('[data-action="combat-assign-blocker"]');
      if (assignBtn) {
        const attackerId = assignBtn.dataset.attackerId;
        this.handSimulator?.combatManager?.assignBlocker(attackerId);
        e.stopPropagation();
      }
    });

    // Combat confirm attackers
    document.addEventListener('click', (e) => {
      const confirmBtn = e.target.closest('[data-action="combat-confirm-attackers"]');
      if (confirmBtn) {
        this.handSimulator?.combatManager?.finalizeDeclareAttackers();
        e.stopPropagation();
      }
    });

    // Combat confirm blockers
    document.addEventListener('click', (e) => {
      const confirmBtn = e.target.closest('[data-action="combat-confirm-blockers"]');
      if (confirmBtn) {
        this.handSimulator?.combatManager?.finalizeDeclareBlockers();
        e.stopPropagation();
      }
    });

    // Combat advance step
    document.addEventListener('click', (e) => {
      const advanceBtn = e.target.closest('[data-action="combat-advance-step"]');
      if (advanceBtn) {
        this.handSimulator?.combatManager?.advanceCombatStep();
        e.stopPropagation();
      }
    });

    // Combat cancel
    document.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('[data-action="combat-cancel"]');
      if (cancelBtn) {
        this.handSimulator?.combatManager?.cancelCombat();
        e.stopPropagation();
      }
    });

    // ===== DRAG AND DROP FOR BLOCKERS =====

    // Drag start - store blocker ID
    document.addEventListener('dragstart', (e) => {
      const blocker = e.target.closest('[data-action="combat-select-blocker"][draggable="true"]');
      if (blocker) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', blocker.dataset.cardId);
        blocker.style.opacity = '0.5';
        blocker.style.cursor = 'grabbing';
      }
    });

    // Drag end - restore opacity
    document.addEventListener('dragend', (e) => {
      const blocker = e.target.closest('[data-action="combat-select-blocker"][draggable="true"]');
      if (blocker) {
        blocker.style.opacity = '';
        blocker.style.cursor = 'grab';
      }
    });

    // Drag over - allow drop
    document.addEventListener('dragover', (e) => {
      const dropZone = e.target.closest('[data-attacker-drop-zone]');
      if (dropZone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropZone.style.background = 'rgba(59, 130, 246, 0.4)';
        dropZone.style.borderLeft = '3px solid #fbbf24';
      }
    });

    // Drag leave - restore styling
    document.addEventListener('dragleave', (e) => {
      const dropZone = e.target.closest('[data-attacker-drop-zone]');
      if (dropZone && !dropZone.contains(e.relatedTarget)) {
        dropZone.style.background = 'rgba(59, 130, 246, 0.2)';
        dropZone.style.borderLeft = '3px solid #3b82f6';
      }
    });

    // Drop - assign blocker
    document.addEventListener('drop', (e) => {
      const dropZone = e.target.closest('[data-attacker-drop-zone]');
      if (dropZone) {
        e.preventDefault();
        const blockerId = e.dataTransfer.getData('text/plain');
        const attackerId = dropZone.dataset.attackerDropZone;

        // Restore styling
        dropZone.style.background = 'rgba(59, 130, 246, 0.2)';
        dropZone.style.borderLeft = '3px solid #3b82f6';

        // Select blocker and assign it
        if (blockerId && attackerId) {
          this.handSimulator?.combatManager?.selectBlocker(blockerId);
          this.handSimulator?.combatManager?.assignBlocker(attackerId);
        }
      }
    });
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    // Remove event listeners if needed
    this.initialized = false;
  }
}

export default EventListenerManager;
