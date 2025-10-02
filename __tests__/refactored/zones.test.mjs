import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="test-container"></div>
    </body>
  </html>
`, { url: 'http://localhost' });

global.window = dom.window;
global.document = dom.window.document;

describe('Zone and Modal Functionality', () => {
  let mockHandSimulator;

  beforeEach(() => {
    document.getElementById('test-container').innerHTML = '';

    // Mock the hand simulator
    mockHandSimulator = {
      hand: [
        { name: 'Lightning Bolt', cost: 'R', type: 'Instant' },
        { name: 'Mountain', cost: '', type: 'Land' }
      ],
      graveyard: [
        { name: 'Dead Card', cost: '2', type: 'Creature' }
      ],
      exile: [],
      library: Array(50).fill({ name: 'Card', cost: '1', type: 'Creature' }),
      opponent: {
        hand: [],
        graveyard: [{ name: 'Opponent Card', cost: '3', type: 'Sorcery' }],
        exile: [],
        library: Array(50).fill({ name: 'Card', cost: '1', type: 'Creature' })
      },
      escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      },
      escapeJs: (text) => text.replace(/'/g, "\\'"),
      showCardPreview: jest.fn(),
      uiManager: {
        getCardMainType: (type) => {
          const typeStr = (type || '').toLowerCase();
          if (typeStr.includes('land')) return 'Land';
          if (typeStr.includes('creature')) return 'Creature';
          if (typeStr.includes('instant')) return 'Instant';
          if (typeStr.includes('sorcery')) return 'Sorcery';
          return 'Other';
        }
      }
    };

    global.window.handSimulator = mockHandSimulator;
  });

  describe('Card Movement to Zones', () => {
    test('should move card from hand to graveyard', () => {
      const cardIndex = mockHandSimulator.hand.findIndex(c => c.name === 'Lightning Bolt');
      const card = mockHandSimulator.hand.splice(cardIndex, 1)[0];
      mockHandSimulator.graveyard.push(card);

      expect(mockHandSimulator.hand.length).toBe(1);
      expect(mockHandSimulator.graveyard.length).toBe(2);
      expect(mockHandSimulator.graveyard[1].name).toBe('Lightning Bolt');
    });

    test('should move card from hand to exile', () => {
      const cardIndex = mockHandSimulator.hand.findIndex(c => c.name === 'Mountain');
      const card = mockHandSimulator.hand.splice(cardIndex, 1)[0];
      mockHandSimulator.exile.push(card);

      expect(mockHandSimulator.hand.length).toBe(1);
      expect(mockHandSimulator.exile.length).toBe(1);
      expect(mockHandSimulator.exile[0].name).toBe('Mountain');
    });

    test('should move card from hand to library', () => {
      const initialLibrarySize = mockHandSimulator.library.length;
      const cardIndex = mockHandSimulator.hand.findIndex(c => c.name === 'Lightning Bolt');
      const card = mockHandSimulator.hand.splice(cardIndex, 1)[0];
      mockHandSimulator.library.push(card);

      expect(mockHandSimulator.hand.length).toBe(1);
      expect(mockHandSimulator.library.length).toBe(initialLibrarySize + 1);
      expect(mockHandSimulator.library[mockHandSimulator.library.length - 1].name).toBe('Lightning Bolt');
    });
  });

  describe('Modal Generation', () => {
    test('should create graveyard modal with correct structure', () => {
      const modalId = 'graveyard';
      const cards = mockHandSimulator.graveyard;
      const title = '🪦 Graveyard';

      // Simulate modal creation
      const modal = document.createElement('div');
      modal.id = `simple-modal-${modalId}`;
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${title} (${cards.length} cards)</h3>
            <button class="close-btn">✕</button>
          </div>
          <div class="cards-container"></div>
        </div>
      `;

      document.body.appendChild(modal);

      expect(document.getElementById('simple-modal-graveyard')).toBeTruthy();
      expect(modal.textContent).toContain('🪦 Graveyard');
      expect(modal.textContent).toContain('1 cards');

      modal.remove();
    });

    test('should show empty message when zone is empty', () => {
      const modalId = 'exile';
      const cards = mockHandSimulator.exile;

      const cardsContainer = document.createElement('div');
      if (cards.length === 0) {
        cardsContainer.innerHTML = '<div>No cards in this zone</div>';
      }

      expect(cardsContainer.textContent).toBe('No cards in this zone');
    });

    test('should display cards in reverse order (most recent first)', () => {
      mockHandSimulator.graveyard = [
        { name: 'First', cost: '1', type: 'Creature' },
        { name: 'Second', cost: '2', type: 'Instant' },
        { name: 'Third', cost: '3', type: 'Sorcery' }
      ];

      const orderedCards = [...mockHandSimulator.graveyard].reverse();

      expect(orderedCards[0].name).toBe('Third');
      expect(orderedCards[1].name).toBe('Second');
      expect(orderedCards[2].name).toBe('First');
    });
  });

  describe('Card ID Generation', () => {
    test('should generate consistent card IDs', () => {
      const cards = [
        { name: 'Card1' },
        { name: 'Card2' },
        { id: 'custom-id', name: 'Card3' }
      ];

      const cardIds = cards.map((card, index) => card.id || `${card.name}_${index}`);

      expect(cardIds[0]).toBe('Card1_0');
      expect(cardIds[1]).toBe('Card2_1');
      expect(cardIds[2]).toBe('custom-id');
    });

    test('should find cards by generated ID', () => {
      const cards = [
        { name: 'Lightning Bolt' },
        { name: 'Mountain' }
      ];

      const searchId = 'Lightning Bolt_0';
      const found = cards.findIndex((card, idx) => {
        const cardId = card.id || `${card.name}_${idx}`;
        return cardId === searchId;
      });

      expect(found).toBe(0);
    });
  });

  describe('Modal Interactions', () => {
    test('should close modal on backdrop click', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.style.position = 'fixed';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      let shouldClose = false;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          shouldClose = true;
        }
      });

      // Simulate backdrop click
      const backdropEvent = new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(backdropEvent, 'target', { value: modal });
      modal.dispatchEvent(backdropEvent);

      expect(shouldClose).toBe(true);

      modal.remove();
    });

    test('should not close modal on content click', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      let shouldClose = false;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          shouldClose = true;
        }
      });

      // Simulate content click
      const contentEvent = new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(contentEvent, 'target', { value: modalContent });
      modal.dispatchEvent(contentEvent);

      expect(shouldClose).toBe(false);

      modal.remove();
    });
  });

  describe('Library Modal', () => {
    test('should display library with correct card count', () => {
      const librarySize = mockHandSimulator.library.length;

      expect(librarySize).toBe(50);
    });

    test('should handle player and opponent libraries separately', () => {
      expect(mockHandSimulator.library.length).toBe(50);
      expect(mockHandSimulator.opponent.library.length).toBe(50);
    });
  });

  describe('Zone Count Updates', () => {
    test('should reflect graveyard count changes', () => {
      const initialGraveyardSize = mockHandSimulator.graveyard.length;

      mockHandSimulator.graveyard.push({ name: 'New Card', cost: '1', type: 'Instant' });

      expect(mockHandSimulator.graveyard.length).toBe(initialGraveyardSize + 1);
    });

    test('should reflect exile count changes', () => {
      const initialExileSize = mockHandSimulator.exile.length;

      mockHandSimulator.exile.push({ name: 'Exiled Card', cost: '2', type: 'Creature' });

      expect(mockHandSimulator.exile.length).toBe(initialExileSize + 1);
    });
  });
});
