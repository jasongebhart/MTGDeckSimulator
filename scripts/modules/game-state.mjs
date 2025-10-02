/**
 * Game State Management Module
 * Handles all game state, player state, and state transitions
 */

export class GameState {
  constructor() {
    this.resetState();
  }

  resetState() {
    // Player state
    this.player = {
      library: [],
      hand: [],
      battlefield: { lands: [], creatures: [], others: [] },
      graveyard: [],
      exile: [],
      gameStats: {
        cardsDrawn: 0,
        landsPlayed: 0,
        spellsCast: 0,
        turnNumber: 1,
        mulligans: 0,
        life: 20
      },
      selectedCards: new Set(),
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      currentDeck: null
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

    // Turn management
    this.turnState = {
      activePlayer: 'player',
      phase: 'beginning',
      step: 'untap',
      priority: 'player',
      turnNumber: 1,
      isFirstTurn: true
    };

    // Combat system
    this.combatState = {
      step: 'none',
      attackers: [],
      blockers: [],
      combatDamage: [],
      isSelectingAttackers: false,
      isSelectingBlockers: false
    };

    // Stack and priority
    this.stack = [];
    this.priorityPlayer = 'player';
    this.waitingForResponse = false;
    this.pendingDamage = [];

    // Spell stack for responses
    this.spellStack = [];
    this.awaitingResponse = false;

    // Game log
    this.gameLog = [];
    this.maxLogEntries = 50;

    // Undo/Redo system
    this.history = [];
    this.maxHistorySize = 20;
    this.historyIndex = -1;

    // Targeting mode
    this.targetingMode = { active: false };

    // Phase definitions
    this.phases = {
      beginning: ['untap', 'upkeep', 'draw'],
      main1: ['main'],
      combat: ['beginning-combat', 'declare-attackers', 'declare-blockers', 'combat-damage', 'end-combat'],
      main2: ['main'],
      end: ['end', 'cleanup']
    };

    this.activePlayer = 'player';
    this.gameMode = 'local';
    this.turnPhase = 'setup';
  }

  getCurrentPlayer() {
    return this.activePlayer === 'player' ? this.player : this.opponent;
  }

  getCurrentOpponent() {
    return this.activePlayer === 'player' ? this.opponent : this.player;
  }

  getPlayerState(playerName) {
    return playerName === 'player' ? this.player : this.opponent;
  }

  switchActivePlayer() {
    this.activePlayer = this.activePlayer === 'player' ? 'opponent' : 'player';
    this.turnState.activePlayer = this.activePlayer;
  }

  addToGameLog(message, type = 'info') {
    const logEntry = {
      message,
      type,
      timestamp: new Date().toISOString(),
      turn: this.turnState.turnNumber,
      phase: this.turnState.phase
    };

    this.gameLog.unshift(logEntry);

    if (this.gameLog.length > this.maxLogEntries) {
      this.gameLog.pop();
    }

    // Trigger UI update if uiManager is available
    if (this.uiManager && this.uiManager.updateGameLog) {
      this.uiManager.updateGameLog();
    }
  }

  // State serialization for save/load
  serialize() {
    return {
      player: {
        ...this.player,
        selectedCards: Array.from(this.player.selectedCards)
      },
      opponent: {
        ...this.opponent,
        selectedCards: Array.from(this.opponent.selectedCards)
      },
      turnState: { ...this.turnState },
      combatState: { ...this.combatState },
      stack: [...this.stack],
      spellStack: [...this.spellStack],
      gameLog: [...this.gameLog],
      activePlayer: this.activePlayer,
      gameMode: this.gameMode,
      turnPhase: this.turnPhase
    };
  }

  deserialize(data) {
    this.player = {
      ...data.player,
      selectedCards: new Set(data.player.selectedCards)
    };
    this.opponent = {
      ...data.opponent,
      selectedCards: new Set(data.opponent.selectedCards)
    };
    this.turnState = { ...data.turnState };
    this.combatState = { ...data.combatState };
    this.stack = [...data.stack];
    this.spellStack = [...data.spellStack];
    this.gameLog = [...data.gameLog];
    this.activePlayer = data.activePlayer;
    this.gameMode = data.gameMode;
    this.turnPhase = data.turnPhase;
  }

  // Helper methods
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  shuffleLibrary(playerName = 'player') {
    const playerState = this.getPlayerState(playerName);
    playerState.library = this.shuffleArray(playerState.library);
  }

  clearManaPool(playerName = 'player') {
    const playerState = this.getPlayerState(playerName);
    playerState.manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  }
}
