import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="currentTurnDisplay"></div>
      <div id="currentPhaseDisplay"></div>
      <div id="playerLifeTotal"></div>
      <div id="opponentLifeTotal"></div>
      <div id="playerHandCount"></div>
      <div id="opponentHandCount"></div>
      <div id="handContainer2"></div>
      <div id="opponentHandContainer2"></div>
      <div id="graveyardZone"></div>
      <div id="exileZone"></div>
      <div id="graveyardCount"></div>
      <div id="graveyardCount2"></div>
      <div id="exileCount"></div>
      <div id="exileCount2"></div>
      <div id="playerLibraryCount2"></div>
      <div id="opponentLibraryCount2"></div>
      <div id="gameLogPanel"></div>
    </body>
  </html>
`, { url: 'http://localhost' });

global.window = dom.window;
global.document = dom.window.document;

// Mock CardImageService
global.CardImageService = {
  getCardImageUrl: jest.fn().mockResolvedValue('/assets/MagicImages/test.jpg')
};

// Import the module after setting up globals
const { UIManager } = await import('../../scripts/modules/ui-updates.mjs');

describe('UIManager', () => {
  let uiManager;
  let mockGameState;

  beforeEach(() => {
    // Reset DOM
    document.getElementById('gameLogPanel').innerHTML = '';

    // Mock game state
    mockGameState = {
      turn: 1,
      phase: 'Main',
      activePlayer: 'player',
      gameLog: [
        { turn: 1, phase: 'Draw', type: 'action', message: 'Player drew a card' }
      ],
      getPlayerState: jest.fn((player) => ({
        life: 20,
        hand: [
          { name: 'Lightning Bolt', cost: 'R', type: 'Instant' },
          { name: 'Mountain', cost: '', type: 'Land' }
        ],
        library: Array(50).fill({ name: 'Card', cost: '1', type: 'Creature' }),
        graveyard: [
          { name: 'Dead Card', cost: '2', type: 'Creature' }
        ],
        exile: [],
        battlefield: {
          lands: [],
          creatures: [],
          others: []
        }
      }))
    };

    uiManager = new UIManager(mockGameState);
  });

  describe('Turn Display', () => {
    test('should update turn number', () => {
      uiManager.updateTurnDisplay();
      expect(document.getElementById('currentTurnDisplay').textContent).toBe('1');
    });

    test('should update phase name', () => {
      uiManager.updateTurnDisplay();
      expect(document.getElementById('currentPhaseDisplay').textContent).toBe('Main');
    });
  });

  describe('Life Display', () => {
    test('should update player life total', () => {
      uiManager.updateLifeDisplay('player');
      expect(document.getElementById('playerLifeTotal').textContent).toBe('20');
    });

    test('should update opponent life total', () => {
      uiManager.updateLifeDisplay('opponent');
      expect(document.getElementById('opponentLifeTotal').textContent).toBe('20');
    });
  });

  describe('Hand Count Display', () => {
    test('should update player hand count', () => {
      uiManager.updateHandCountDisplay('player');
      expect(document.getElementById('playerHandCount').textContent).toBe('2');
    });

    test('should update opponent hand count', () => {
      uiManager.updateHandCountDisplay('opponent');
      expect(document.getElementById('opponentHandCount').textContent).toBe('2');
    });
  });

  describe('Zone Counts', () => {
    test('should update graveyard counts', () => {
      uiManager.updateZoneCounts();
      expect(document.getElementById('graveyardCount').textContent).toBe('1');
      expect(document.getElementById('graveyardCount2').textContent).toBe('1');
    });

    test('should update exile counts', () => {
      uiManager.updateZoneCounts();
      expect(document.getElementById('exileCount').textContent).toBe('0');
      expect(document.getElementById('exileCount2').textContent).toBe('0');
    });

    test('should update library counts', () => {
      uiManager.updateZoneCounts();
      expect(document.getElementById('playerLibraryCount2').textContent).toBe('50');
    });
  });

  describe('Game Log', () => {
    test('should render game log entries', () => {
      uiManager.updateGameLog();
      const logPanel = document.getElementById('gameLogPanel');
      expect(logPanel.children.length).toBe(1);
      expect(logPanel.textContent).toContain('Player drew a card');
    });

    test('should display turn and phase in log entry', () => {
      uiManager.updateGameLog();
      const logPanel = document.getElementById('gameLogPanel');
      expect(logPanel.textContent).toContain('Turn 1');
      expect(logPanel.textContent).toContain('Draw');
    });
  });

  describe('Card Main Type Detection', () => {
    test('should identify land cards', () => {
      expect(uiManager.getCardMainType('Basic Land — Mountain')).toBe('Land');
    });

    test('should identify creature cards', () => {
      expect(uiManager.getCardMainType('Creature — Human Wizard')).toBe('Creature');
    });

    test('should identify instant cards', () => {
      expect(uiManager.getCardMainType('Instant')).toBe('Instant');
    });

    test('should identify sorcery cards', () => {
      expect(uiManager.getCardMainType('Sorcery')).toBe('Sorcery');
    });

    test('should identify artifact cards', () => {
      expect(uiManager.getCardMainType('Artifact — Equipment')).toBe('Artifact');
    });

    test('should identify enchantment cards', () => {
      expect(uiManager.getCardMainType('Enchantment — Aura')).toBe('Enchantment');
    });

    test('should handle unknown types', () => {
      expect(uiManager.getCardMainType('Unknown Type')).toBe('Other');
    });
  });

  describe('HTML Escaping', () => {
    test('should escape HTML entities', () => {
      const escaped = uiManager.escapeHtml('<script>alert("xss")</script>');
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should escape quotes', () => {
      const escaped = uiManager.escapeHtml('Card "Name" with quotes');
      expect(escaped).toContain('&quot;');
    });
  });

  describe('Zone Display', () => {
    test('should skip zones without containers', () => {
      // Opponent graveyard has no container
      expect(() => {
        uiManager.updateZoneDisplay('graveyard', 'opponent');
      }).not.toThrow();
    });

    test('should render player graveyard zone', () => {
      uiManager.updateZoneDisplay('graveyard', 'player');
      const graveyardZone = document.getElementById('graveyardZone');
      expect(graveyardZone.innerHTML).toContain('Dead Card');
    });
  });
});
