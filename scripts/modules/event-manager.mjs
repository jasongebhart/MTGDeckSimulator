/**
 * Event Manager Module
 * Centralized event listener management
 * Replaces inline onclick handlers with proper event delegation
 */

export const EventManager = {
  /**
   * Initialize all event listeners
   * Called once on page load
   */
  init(simulator) {
    this.simulator = simulator;
    this.setupTopBarEvents();
    this.setupPlayerEvents();
    this.setupOpponentEvents();
    this.setupDropdownEvents();
    this.setupBoardWipeEvents();
    this.setupKeyboardEvents();
    this.setupModalEvents();
    this.setupLifeCounterEvents();
  },

  /**
   * Top Control Bar Events
   */
  setupTopBarEvents() {
    // Deck selection button
    const deckBtn = document.querySelector('[data-action="openDeckModal"]');
    if (deckBtn) {
      deckBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openDeckSelectionModal(e);
      });
    }

    // Quick setup button
    const setupBtn = document.querySelector('[data-action="quickSetup"]');
    if (setupBtn) {
      setupBtn.addEventListener('click', () => {
        this.simulator?.quickTwoPlayerSetup();
      });
    }

    // End turn button
    const endTurnBtn = document.getElementById('endTurnButton');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => {
        this.simulator?.endTurn();
      });
    }

    // Combat button
    const combatBtn = document.querySelector('[data-action="combat"]');
    if (combatBtn) {
      combatBtn.addEventListener('click', () => {
        this.simulator?.initializeCombat();
      });
    }

    // Overflow menu toggle
    const overflowBtn = document.querySelector('[data-action="toggleOverflow"]');
    if (overflowBtn) {
      overflowBtn.addEventListener('click', (e) => {
        const menu = overflowBtn.nextElementSibling;
        if (menu) {
          menu.classList.toggle('show');
        }
      });
    }

    // Start game (in overflow menu)
    const startGameBtn = document.querySelector('[data-action="startGame"]');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        this.simulator?.startTwoPlayerGame();
        this.closeDropdown(startGameBtn);
      });
    }

    // Test counters (in overflow menu)
    const testCountersBtn = document.getElementById('testCountersButton');
    if (testCountersBtn) {
      testCountersBtn.addEventListener('click', () => {
        this.simulator?.testCountersFeature();
        this.closeDropdown(testCountersBtn);
      });
    }

    // Sound toggle (in overflow menu)
    const soundToggleBtn = document.querySelector('[data-action="toggleSound"]');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        this.simulator?.toggleSounds();
        this.closeDropdown(soundToggleBtn);
      });
    }
  },

  /**
   * Player Action Events
   */
  setupPlayerEvents() {
    // New game
    const newGameBtn = document.querySelector('[data-action="newGame"][data-player="player"]');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.simulator?.resetAndDraw7();
      });
    }

    // Draw card
    const drawBtn = document.querySelector('[data-action="draw"][data-player="player"]');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        this.simulator?.drawCard();
      });
    }

    // Mulligan
    const mulliganBtn = document.querySelector('[data-action="mulligan"][data-player="player"]');
    if (mulliganBtn) {
      mulliganBtn.addEventListener('click', () => {
        this.simulator?.mulligan();
      });
    }

    // Pass turn
    const passBtn = document.querySelector('[data-action="passTurn"][data-player="player"]');
    if (passBtn) {
      passBtn.addEventListener('click', () => {
        this.simulator?.passTurn();
      });
    }

    // Untap all
    const untapBtn = document.querySelector('[data-action="untapAll"][data-player="player"]');
    if (untapBtn) {
      untapBtn.addEventListener('click', () => {
        this.simulator?.untapAll();
      });
    }

    // Library button toggle
    const libraryBtn = document.querySelector('[data-action="toggleLibrary"][data-player="player"]');
    if (libraryBtn) {
      libraryBtn.addEventListener('click', () => {
        const menu = document.getElementById('playerLibraryActionsMenu');
        if (menu) {
          menu.classList.toggle('show');
        }
      });
    }

    // Library actions
    this.setupLibraryActions('player');

    // Token button toggle
    const tokenBtn = document.querySelector('[data-action="toggleTokens"][data-player="player"]');
    if (tokenBtn) {
      tokenBtn.addEventListener('click', () => {
        const menu = document.getElementById('playerTokenMenu');
        if (menu) {
          menu.classList.toggle('show');
        }
      });
    }

    // Token creation
    this.setupTokenActions('player');

    // Advanced menu toggle
    const advancedBtn = document.querySelector('[data-action="toggleAdvanced"][data-player="player"]');
    if (advancedBtn) {
      advancedBtn.addEventListener('click', () => {
        const menu = document.getElementById('playerAdvancedMenu');
        if (menu) {
          menu.classList.toggle('show');
        }
      });
    }

    // Discard buttons
    const discard1Btn = document.querySelector('[data-action="discard"][data-amount="1"][data-player="player"]');
    if (discard1Btn) {
      discard1Btn.addEventListener('click', () => {
        this.simulator?.executeDiscard('player', 1, 'random');
      });
    }

    const discard2Btn = document.querySelector('[data-action="discard"][data-amount="2"][data-player="player"]');
    if (discard2Btn) {
      discard2Btn.addEventListener('click', () => {
        this.simulator?.executeDiscard('player', 2, 'random');
      });
    }

    // Fetch land / Ramp
    const fetchBtn = document.querySelector('[data-action="fetchLand"][data-player="player"]');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => {
        this.simulator?.evolvingWilds('player');
      });
    }

    const rampBtn = document.querySelector('[data-action="ramp"][data-player="player"]');
    if (rampBtn) {
      rampBtn.addEventListener('click', () => {
        this.simulator?.cultivate('player');
      });
    }
  },

  /**
   * Opponent Action Events
   */
  setupOpponentEvents() {
    // New game
    const newGameBtn = document.querySelector('[data-action="newGame"][data-player="opponent"]');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.simulator?.resetAndDrawOpponent7();
      });
    }

    // Draw card
    const drawBtn = document.querySelector('[data-action="draw"][data-player="opponent"]');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        this.simulator?.drawOpponentCard();
      });
    }

    // Mulligan
    const mulliganBtn = document.querySelector('[data-action="mulligan"][data-player="opponent"]');
    if (mulliganBtn) {
      mulliganBtn.addEventListener('click', () => {
        this.simulator?.mulliganOpponent();
      });
    }

    // Pass turn
    const passBtn = document.querySelector('[data-action="passTurn"][data-player="opponent"]');
    if (passBtn) {
      passBtn.addEventListener('click', () => {
        this.simulator?.passTurn();
      });
    }

    // Untap all
    const untapBtn = document.querySelector('[data-action="untapAll"][data-player="opponent"]');
    if (untapBtn) {
      untapBtn.addEventListener('click', () => {
        this.simulator?.untapAllOpponent();
      });
    }

    // Library actions
    this.setupLibraryActions('opponent');

    // Token creation
    this.setupTokenActions('opponent');

    // Discard buttons
    const discard1Btn = document.querySelector('[data-action="discard"][data-amount="1"][data-player="opponent"]');
    if (discard1Btn) {
      discard1Btn.addEventListener('click', () => {
        this.simulator?.executeDiscard('opponent', 1, 'random');
      });
    }

    const discard2Btn = document.querySelector('[data-action="discard"][data-amount="2"][data-player="opponent"]');
    if (discard2Btn) {
      discard2Btn.addEventListener('click', () => {
        this.simulator?.executeDiscard('opponent', 2, 'random');
      });
    }

    // Fetch land / Ramp
    const fetchBtn = document.querySelector('[data-action="fetchLand"][data-player="opponent"]');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => {
        this.simulator?.evolvingWilds('opponent');
      });
    }

    const rampBtn = document.querySelector('[data-action="ramp"][data-player="opponent"]');
    if (rampBtn) {
      rampBtn.addEventListener('click', () => {
        this.simulator?.cultivate('opponent');
      });
    }
  },

  /**
   * Library action events
   */
  setupLibraryActions(player) {
    const menuId = player === 'player' ? 'playerLibraryActionsMenu' : 'topOpponentLibraryActionsMenu';
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // View library
    const viewBtn = menu.querySelector('[data-action="viewLibrary"]');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        this.simulator?.showLibraryModal(player);
        this.closeDropdown(viewBtn);
      });
    }

    // Scry
    const scryBtn = menu.querySelector('[data-action="scry"]');
    if (scryBtn) {
      scryBtn.addEventListener('click', () => {
        this.simulator?.showScryInterface(1, 'Scry', {player});
        this.closeDropdown(scryBtn);
      });
    }

    // Ponder
    const ponderBtn = menu.querySelector('[data-action="ponder"]');
    if (ponderBtn) {
      ponderBtn.addEventListener('click', () => {
        this.simulator?.ponder(player);
        this.closeDropdown(ponderBtn);
      });
    }

    // Brainstorm
    const brainstormBtn = menu.querySelector('[data-action="brainstorm"]');
    if (brainstormBtn) {
      brainstormBtn.addEventListener('click', () => {
        this.simulator?.brainstorm(player);
        this.closeDropdown(brainstormBtn);
      });
    }

    // Surveil
    const surveil1Btn = menu.querySelector('[data-action="surveil1"]');
    if (surveil1Btn) {
      surveil1Btn.addEventListener('click', () => {
        this.simulator?.surveil(1, player);
        this.closeDropdown(surveil1Btn);
      });
    }

    const surveil2Btn = menu.querySelector('[data-action="surveil2"]');
    if (surveil2Btn) {
      surveil2Btn.addEventListener('click', () => {
        this.simulator?.surveil(2, player);
        this.closeDropdown(surveil2Btn);
      });
    }

    // Cascade
    const cascadeBtn = menu.querySelector('[data-action="cascade"]');
    if (cascadeBtn) {
      cascadeBtn.addEventListener('click', () => {
        this.simulator?.triggerManualCascade(player);
        this.closeDropdown(cascadeBtn);
      });
    }

    // Shuffle
    const shuffleBtn = menu.querySelector('[data-action="shuffle"]');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (player === 'player') {
          this.simulator?.shuffleLibrary();
        } else {
          this.simulator?.shuffleOpponentLibrary();
        }
        this.closeDropdown(shuffleBtn);
      });
    }
  },

  /**
   * Token creation events
   */
  setupTokenActions(player) {
    const menuId = player === 'player' ? 'playerTokenMenu' : 'opponentTokenMenu';
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // Artifact tokens
    const tokens = ['Treasure', 'Clue', 'Blood', 'Food', 'Map', 'Powerstone'];
    tokens.forEach(tokenName => {
      const btn = menu.querySelector(`[data-action="createToken"][data-token="${tokenName}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.simulator?.createToken(tokenName, 'Artifact', player);
          this.closeDropdown(btn);
        });
      }
    });

    // Creature tokens
    const creatures = [
      {name: '1/1 Soldier', type: 'Creature — Soldier'},
      {name: '2/2 Zombie', type: 'Creature — Zombie'},
      {name: '1/1 Goblin', type: 'Creature — Goblin'},
      {name: '1/1 Elf', type: 'Creature — Elf'},
      {name: '3/3 Beast', type: 'Creature — Beast'},
      {name: '4/4 Angel', type: 'Creature — Angel'},
      {name: '5/5 Dragon', type: 'Creature — Dragon'},
      {name: '1/1 Spirit', type: 'Creature — Spirit'},
      {name: '2/2 Knight', type: 'Creature — Knight'},
      {name: '1/1 Insect', type: 'Creature — Insect'}
    ];

    creatures.forEach(creature => {
      const btn = menu.querySelector(`[data-action="createToken"][data-token="${creature.name}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.simulator?.createToken(creature.name, creature.type, player);
          this.closeDropdown(btn);
        });
      }
    });
  },

  /**
   * Board wipe events
   */
  setupBoardWipeEvents() {
    // Toggle board wipes panel
    const toggleBtn = document.getElementById('boardWipesToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const panel = document.getElementById('boardWipesPanel');
        if (panel) {
          panel.classList.toggle('show');
        }
      });
    }

    // Individual board wipe actions
    const wipes = {
      'wrath': 'wrathOfGod',
      'damnation': 'damnation',
      'verdict': 'supremeVerdict',
      'pyroclasm': 'pyroclasm',
      'anger': 'angerOfTheGods',
      'rift': 'cyclonicRift',
      'armageddon': 'armageddon'
    };

    Object.entries(wipes).forEach(([key, method]) => {
      const btn = document.querySelector(`[data-action="boardWipe"][data-spell="${key}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.simulator?.[method]();
        });
      }
    });
  },

  /**
   * Life counter events
   */
  setupLifeCounterEvents() {
    // Player life changes
    const playerPlus1 = document.querySelector('[data-action="changeLife"][data-player="player"][data-amount="1"]');
    if (playerPlus1) {
      playerPlus1.addEventListener('click', () => {
        this.simulator?.changeLife(1);
      });
    }

    const playerMinus1 = document.querySelector('[data-action="changeLife"][data-player="player"][data-amount="-1"]');
    if (playerMinus1) {
      playerMinus1.addEventListener('click', () => {
        this.simulator?.changeLife(-1);
      });
    }

    const playerPlus3 = document.querySelector('[data-action="changeLife"][data-player="player"][data-amount="3"]');
    if (playerPlus3) {
      playerPlus3.addEventListener('click', () => {
        this.simulator?.changeLife(3);
      });
    }

    const playerMinus3 = document.querySelector('[data-action="changeLife"][data-player="player"][data-amount="-3"]');
    if (playerMinus3) {
      playerMinus3.addEventListener('click', () => {
        this.simulator?.changeLife(-3);
      });
    }

    const playerMinus2 = document.querySelector('[data-action="changeLife"][data-player="player"][data-amount="-2"]');
    if (playerMinus2) {
      playerMinus2.addEventListener('click', () => {
        this.simulator?.changeLife(-2);
      });
    }

    // Opponent life changes
    const opponentPlus1 = document.querySelector('[data-action="changeLife"][data-player="opponent"][data-amount="1"]');
    if (opponentPlus1) {
      opponentPlus1.addEventListener('click', () => {
        this.simulator?.changeOpponentLife(1);
      });
    }

    const opponentMinus1 = document.querySelector('[data-action="changeLife"][data-player="opponent"][data-amount="-1"]');
    if (opponentMinus1) {
      opponentMinus1.addEventListener('click', () => {
        this.simulator?.changeOpponentLife(-1);
      });
    }

    const opponentPlus3 = document.querySelector('[data-action="changeLife"][data-player="opponent"][data-amount="3"]');
    if (opponentPlus3) {
      opponentPlus3.addEventListener('click', () => {
        this.simulator?.changeOpponentLife(3);
      });
    }

    const opponentMinus3 = document.querySelector('[data-action="changeLife"][data-player="opponent"][data-amount="-3"]');
    if (opponentMinus3) {
      opponentMinus3.addEventListener('click', () => {
        this.simulator?.changeOpponentLife(-3);
      });
    }

    const opponentMinus2 = document.querySelector('[data-action="changeLife"][data-player="opponent"][data-amount="-2"]');
    if (opponentMinus2) {
      opponentMinus2.addEventListener('click', () => {
        this.simulator?.changeOpponentLife(-2);
      });
    }

    // Set life (click on life total)
    const playerLifeDisplay = document.getElementById('playerLife');
    if (playerLifeDisplay) {
      playerLifeDisplay.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.prompt) {
          const newLife = window.prompt('Set life total:', playerLifeDisplay.textContent);
          if (newLife !== null) {
            this.simulator?.setLife(parseInt(newLife));
          }
        }
      });
    }

    const opponentLifeDisplay = document.getElementById('opponentLife2');
    if (opponentLifeDisplay) {
      opponentLifeDisplay.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.prompt) {
          const newLife = window.prompt('Set opponent life:', opponentLifeDisplay.textContent);
          if (newLife !== null) {
            this.simulator?.setOpponentLife(parseInt(newLife));
          }
        }
      });
    }
  },

  /**
   * Dropdown management
   */
  setupDropdownEvents() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const isDropdownButton = e.target.closest('[data-dropdown-toggle]');
      const isInsideDropdown = e.target.closest('.dropdown-menu, .advanced-actions-panel');

      if (!isDropdownButton && !isInsideDropdown) {
        this.closeAllDropdowns();
      }
    });

    // Keyboard navigation in dropdowns
    document.addEventListener('keydown', (e) => {
      const activeDropdown = document.querySelector('.dropdown-menu.show, .advanced-actions-panel.show');
      if (!activeDropdown) return;

      if (e.key === 'Escape') {
        this.closeAllDropdowns();
        e.preventDefault();
      }
    });
  },

  /**
   * Modal events
   */
  setupModalEvents() {
    // Deck selection modal close
    const deckModalClose = document.querySelector('[data-action="closeDeckModal"]');
    if (deckModalClose) {
      deckModalClose.addEventListener('click', () => {
        this.closeDeckSelectionModal();
      });
    }

    // Close modal on backdrop click
    const deckModal = document.getElementById('deckSelectionModal');
    if (deckModal) {
      deckModal.addEventListener('click', (e) => {
        if (e.target === deckModal) {
          this.closeDeckSelectionModal();
        }
      });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal[style*="display: flex"]');
        if (modal) {
          this.closeDeckSelectionModal();
        }
      }
    });
  },

  /**
   * Keyboard shortcuts
   */
  setupKeyboardEvents() {
    // Already handled in playhand-modern-refactored.mjs
    // This is a placeholder for additional keyboard events
  },

  /**
   * Helper: Close dropdown menu
   */
  closeDropdown(element) {
    const dropdown = element.closest('.dropdown-menu, .advanced-actions-panel');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  },

  /**
   * Helper: Close all dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.show, .advanced-actions-panel.show').forEach(menu => {
      menu.classList.remove('show');
    });
  },

  /**
   * Helper: Open deck selection modal
   */
  openDeckSelectionModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const modal = document.getElementById('deckSelectionModal');
    if (modal) {
      modal.style.display = 'flex';

      // Add show class for animation
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        setTimeout(() => modalContent.classList.add('show'), 10);
      }

      // Update deck displays
      const playerDeckNameModal = document.getElementById('playerDeckNameModal');
      const opponentDeckNameModal = document.getElementById('opponentDeckNameModal');

      if (playerDeckNameModal && this.simulator?.currentDeck?.name) {
        playerDeckNameModal.textContent = this.simulator.currentDeck.name;
      } else if (playerDeckNameModal) {
        playerDeckNameModal.textContent = 'No Deck';
      }

      if (opponentDeckNameModal && this.simulator?.gameState?.opponent?.deckName) {
        opponentDeckNameModal.textContent = this.simulator.gameState.opponent.deckName;
      } else if (opponentDeckNameModal) {
        opponentDeckNameModal.textContent = 'No Deck';
      }

      // Focus first focusable element
      const firstInput = modal.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  },

  /**
   * Helper: Close deck selection modal
   */
  closeDeckSelectionModal() {
    const modal = document.getElementById('deckSelectionModal');
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
};
