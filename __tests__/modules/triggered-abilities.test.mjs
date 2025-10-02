import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="delverRevealModal"></div>
    </body>
  </html>
`, { url: 'http://localhost' });

global.window = dom.window;
global.document = dom.window.document;

// Import the module
const { TriggeredAbilities } = await import('../../scripts/modules/triggered-abilities.mjs');

describe('TriggeredAbilities Module', () => {
  let mockContext;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';

    // Mock window.handSimulator for button clicks
    global.window.handSimulator = {
      resolveDelverTrigger: jest.fn()
    };

    // Mock context (this would be the ModernHandSimulator instance)
    mockContext = {
      gameState: {
        player: {
          library: [
            { id: 'creature1', name: 'Tarmogoyf', type: 'Creature — Lhurgoyf' },
            { id: 'bolt1', name: 'Lightning Bolt', type: 'Instant' } // Top of library (last element)
          ],
          battlefield: {
            creatures: [
              { id: 'delver1', name: 'Delver of Secrets', currentFace: 'Delver of Secrets' }
            ]
          }
        },
        opponent: {
          library: [],
          battlefield: { creatures: [] }
        },
        turnState: {
          activePlayer: 'player'
        },
        addToGameLog: jest.fn()
      },
      uiManager: {
        showToast: jest.fn(),
        escapeHtml: (text) => {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        },
        getCardMainType: (type) => {
          const typeStr = (type || '').toLowerCase();
          if (typeStr.includes('instant')) return 'Instant';
          if (typeStr.includes('sorcery')) return 'Sorcery';
          if (typeStr.includes('creature')) return 'Creature';
          return 'Other';
        }
      },
      transformCard: jest.fn(),
      pendingDelverTrigger: null
    };
  });

  describe('checkDelverTriggers', () => {
    test('should find Delver of Secrets on battlefield', () => {
      const checkTriggers = TriggeredAbilities.checkDelverTriggers.bind(mockContext);
      const triggerReveal = jest.fn();
      mockContext.triggerDelverReveal = triggerReveal;

      checkTriggers();

      expect(triggerReveal).toHaveBeenCalledTimes(1);
      // The delver object should have been passed
      const callArg = triggerReveal.mock.calls[0][0];
      expect(callArg.name).toBe('Delver of Secrets');
    });

    test('should not trigger if Delver is already transformed', () => {
      const checkTriggers = TriggeredAbilities.checkDelverTriggers.bind(mockContext);
      const triggerReveal = jest.fn();
      mockContext.triggerDelverReveal = triggerReveal;

      // Transform Delver
      mockContext.gameState.player.battlefield.creatures[0].currentFace = 'Insectile Aberration';

      checkTriggers();

      expect(triggerReveal).not.toHaveBeenCalled();
    });

    test('should not trigger if no Delvers on battlefield', () => {
      const checkTriggers = TriggeredAbilities.checkDelverTriggers.bind(mockContext);
      const triggerReveal = jest.fn();
      mockContext.triggerDelverReveal = triggerReveal;

      mockContext.gameState.player.battlefield.creatures = [];

      checkTriggers();

      expect(triggerReveal).not.toHaveBeenCalled();
    });
  });

  describe('triggerDelverReveal', () => {
    test('should show modal if library has cards', () => {
      const trigger = TriggeredAbilities.triggerDelverReveal.bind(mockContext);
      mockContext.showDelverRevealModal = jest.fn();

      const delver = mockContext.gameState.player.battlefield.creatures[0];
      trigger(delver);

      expect(mockContext.showDelverRevealModal).toHaveBeenCalledTimes(1);
    });

    test('should show toast if library is empty', () => {
      const trigger = TriggeredAbilities.triggerDelverReveal.bind(mockContext);
      mockContext.gameState.player.library = [];

      const delver = mockContext.gameState.player.battlefield.creatures[0];
      trigger(delver);

      expect(mockContext.uiManager.showToast).toHaveBeenCalledWith(
        'Library is empty - cannot reveal for Delver',
        'warning'
      );
    });

    test('should determine if card is instant or sorcery correctly', () => {
      const trigger = TriggeredAbilities.triggerDelverReveal.bind(mockContext);
      let modalCalled = false;
      let transformDecision = null;

      mockContext.showDelverRevealModal = (delver, card, shouldTransform) => {
        modalCalled = true;
        transformDecision = shouldTransform;
      };

      const delver = mockContext.gameState.player.battlefield.creatures[0];
      trigger(delver);

      expect(modalCalled).toBe(true);
      expect(transformDecision).toBe(true); // Lightning Bolt is an instant
    });

    test('should not transform on creature reveal', () => {
      const trigger = TriggeredAbilities.triggerDelverReveal.bind(mockContext);
      let transformDecision = null;

      mockContext.showDelverRevealModal = (delver, card, shouldTransform) => {
        transformDecision = shouldTransform;
      };

      // Put creature on top of library
      mockContext.gameState.player.library.push({
        id: 'creature1',
        name: 'Tarmogoyf',
        type: 'Creature — Lhurgoyf'
      });

      const delver = mockContext.gameState.player.battlefield.creatures[0];
      trigger(delver);

      expect(transformDecision).toBe(false); // Creature should not transform
    });
  });

  describe('showDelverRevealModal', () => {
    test('should create modal with correct content', () => {
      const showModal = TriggeredAbilities.showDelverRevealModal.bind(mockContext);

      const delver = { name: 'Delver of Secrets' };
      const revealedCard = { name: 'Lightning Bolt', type: 'Instant' };

      showModal(delver, revealedCard, true);

      const modal = document.getElementById('delverRevealModal');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('Lightning Bolt');
      expect(modal.innerHTML).toContain('Transform Delver');
    });

    test('should show "does not transform" for non-instant/sorcery', () => {
      const showModal = TriggeredAbilities.showDelverRevealModal.bind(mockContext);

      const delver = { name: 'Delver of Secrets' };
      const revealedCard = { name: 'Tarmogoyf', type: 'Creature' };

      showModal(delver, revealedCard, false);

      const modal = document.getElementById('delverRevealModal');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('Does not transform');
      expect(modal.innerHTML).toContain('Continue');
    });

    test('should store pending trigger', () => {
      const showModal = TriggeredAbilities.showDelverRevealModal.bind(mockContext);

      const delver = { name: 'Delver of Secrets' };
      const revealedCard = { name: 'Lightning Bolt', type: 'Instant' };

      showModal(delver, revealedCard, true);

      expect(mockContext.pendingDelverTrigger).toEqual({
        delver: delver,
        shouldTransform: true
      });
    });
  });

  describe('resolveDelverTrigger', () => {
    test('should transform Delver if shouldTransform is true', () => {
      const resolve = TriggeredAbilities.resolveDelverTrigger.bind(mockContext);

      const delver = { id: 'delver1', name: 'Delver of Secrets' };
      mockContext.pendingDelverTrigger = {
        delver: delver,
        shouldTransform: true
      };

      // Create and append modal
      const modal = document.createElement('div');
      modal.id = 'delverRevealModal';
      document.body.appendChild(modal);

      resolve(true);

      expect(mockContext.transformCard).toHaveBeenCalledWith('delver1');
      expect(mockContext.uiManager.showToast).toHaveBeenCalledWith(
        'Delver of Secrets transformed!',
        'success'
      );
      expect(mockContext.pendingDelverTrigger).toBeNull();
    });

    test('should not transform if shouldTransform is false', () => {
      const resolve = TriggeredAbilities.resolveDelverTrigger.bind(mockContext);

      const delver = { id: 'delver1', name: 'Delver of Secrets' };
      mockContext.pendingDelverTrigger = {
        delver: delver,
        shouldTransform: false
      };

      // Create and append modal
      const modal = document.createElement('div');
      modal.id = 'delverRevealModal';
      document.body.appendChild(modal);

      resolve(false);

      expect(mockContext.transformCard).not.toHaveBeenCalled();
      expect(mockContext.uiManager.showToast).toHaveBeenCalledWith(
        'Delver of Secrets does not transform',
        'info'
      );
      expect(mockContext.pendingDelverTrigger).toBeNull();
    });

    test('should remove modal from DOM', () => {
      const resolve = TriggeredAbilities.resolveDelverTrigger.bind(mockContext);

      mockContext.pendingDelverTrigger = {
        delver: { id: 'delver1' },
        shouldTransform: true
      };

      // Create and append modal
      const modal = document.createElement('div');
      modal.id = 'delverRevealModal';
      document.body.appendChild(modal);

      expect(document.getElementById('delverRevealModal')).toBeTruthy();

      resolve(true);

      expect(document.getElementById('delverRevealModal')).toBeNull();
    });

    test('should handle missing pendingDelverTrigger', () => {
      const resolve = TriggeredAbilities.resolveDelverTrigger.bind(mockContext);
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      mockContext.pendingDelverTrigger = null;

      // Create and append modal
      const modal = document.createElement('div');
      modal.id = 'delverRevealModal';
      document.body.appendChild(modal);

      resolve(true);

      expect(consoleError).toHaveBeenCalledWith('No pending Delver trigger');
      consoleError.mockRestore();
    });
  });
});
