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

// Import the module
const { Fetchlands } = await import('../../scripts/modules/fetchlands.mjs');

describe('Fetchlands Module', () => {
  let mockContext;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';

    // Mock context (this would be the ModernHandSimulator instance)
    mockContext = {
      gameState: {
        player: {
          library: [
            { id: 'volcanic1', name: 'Volcanic Island', type: 'Land' },
            { id: 'island1', name: 'Island', type: 'Land — Island' },
            { id: 'mountain1', name: 'Mountain', type: 'Land — Mountain' },
            { id: 'plains1', name: 'Plains', type: 'Land — Plains' }
          ],
          battlefield: {
            lands: [
              { id: 'fetch1', name: 'Scalding Tarn', type: 'Land' }
            ]
          },
          graveyard: [],
          life: 20
        },
        opponent: {
          library: [],
          battlefield: { lands: [] },
          graveyard: [],
          life: 20
        },
        turnState: {
          activePlayer: 'player'
        },
        addToGameLog: jest.fn()
      },
      uiManager: {
        showToast: jest.fn(),
        updateZoneDisplay: jest.fn(),
        updateZoneCounts: jest.fn(),
        updateLifeDisplay: jest.fn()
      },
      cardMechanics: {},
      escapeJs: (str) => String(str).replace(/'/g, "\\'"),
      shuffleArray: jest.fn((arr) => arr),
      // Add isBasicLand to mock context
      isBasicLand: (cardName) => {
        const name = cardName.toLowerCase();
        const basicLands = ['plains', 'island', 'swamp', 'mountain', 'forest'];
        return basicLands.includes(name);
      }
    };
  });

  describe('isFetchland', () => {
    test('should identify true fetchlands', () => {
      const isFetchland = Fetchlands.isFetchland.bind(mockContext);

      expect(isFetchland('Scalding Tarn')).toBe(true);
      expect(isFetchland('Polluted Delta')).toBe(true);
      expect(isFetchland('Flooded Strand')).toBe(true);
    });

    test('should identify slow fetchlands', () => {
      const isFetchland = Fetchlands.isFetchland.bind(mockContext);

      expect(isFetchland('Evolving Wilds')).toBe(true);
      expect(isFetchland('Terramorphic Expanse')).toBe(true);
    });

    test('should return false for non-fetchlands', () => {
      const isFetchland = Fetchlands.isFetchland.bind(mockContext);

      expect(isFetchland('Island')).toBe(false);
      expect(isFetchland('Lightning Bolt')).toBe(false);
    });
  });

  describe('getFetchlandTypes', () => {
    test('should return correct land types for Scalding Tarn', () => {
      const getTypes = Fetchlands.getFetchlandTypes.bind(mockContext);

      const types = getTypes('Scalding Tarn');
      expect(types).toEqual(['island', 'mountain']);
    });

    test('should return all basic land types for Evolving Wilds', () => {
      const getTypes = Fetchlands.getFetchlandTypes.bind(mockContext);

      const types = getTypes('Evolving Wilds');
      expect(types).toEqual(['plains', 'island', 'swamp', 'mountain', 'forest']);
    });

    test('should return empty array for non-fetchlands', () => {
      const getTypes = Fetchlands.getFetchlandTypes.bind(mockContext);

      const types = getTypes('Island');
      expect(types).toEqual([]);
    });
  });

  describe('getFetchlandLifeCost', () => {
    test('should return 1 life for true fetchlands', () => {
      const getLifeCost = Fetchlands.getFetchlandLifeCost.bind(mockContext);

      expect(getLifeCost('Scalding Tarn')).toBe(1);
      expect(getLifeCost('Polluted Delta')).toBe(1);
      expect(getLifeCost('Flooded Strand')).toBe(1);
    });

    test('should return 0 life for slow fetchlands', () => {
      const getLifeCost = Fetchlands.getFetchlandLifeCost.bind(mockContext);

      expect(getLifeCost('Evolving Wilds')).toBe(0);
      expect(getLifeCost('Terramorphic Expanse')).toBe(0);
    });
  });

  describe('fetchlandProducesTaskedLands', () => {
    test('should return false for true fetchlands (lands enter untapped)', () => {
      const producesTapped = Fetchlands.fetchlandProducesTaskedLands.bind(mockContext);

      expect(producesTapped('Scalding Tarn')).toBe(false);
      expect(producesTapped('Polluted Delta')).toBe(false);
    });

    test('should return true for slow fetchlands (lands enter tapped)', () => {
      const producesTapped = Fetchlands.fetchlandProducesTaskedLands.bind(mockContext);

      expect(producesTapped('Evolving Wilds')).toBe(true);
      expect(producesTapped('Terramorphic Expanse')).toBe(true);
    });
  });

  describe('isBasicLand', () => {
    test('should identify basic lands', () => {
      const isBasic = Fetchlands.isBasicLand.bind(mockContext);

      expect(isBasic('Plains')).toBe(true);
      expect(isBasic('Island')).toBe(true);
      expect(isBasic('Swamp')).toBe(true);
      expect(isBasic('Mountain')).toBe(true);
      expect(isBasic('Forest')).toBe(true);
    });

    test('should return false for non-basic lands', () => {
      const isBasic = Fetchlands.isBasicLand.bind(mockContext);

      expect(isBasic('Volcanic Island')).toBe(false);
      expect(isBasic('Scalding Tarn')).toBe(false);
    });
  });

  describe('getAvailableDualLands', () => {
    test('should find dual lands that match fetchland types', () => {
      const getDualLands = Fetchlands.getAvailableDualLands.bind(mockContext);

      // Scalding Tarn fetches Island or Mountain
      mockContext.isLandOfType = (card, type) => {
        const name = card.name.toLowerCase();
        if (type === 'island') return name.includes('island');
        if (type === 'mountain') return name.includes('volcanic');
        return false;
      };

      const duals = getDualLands(mockContext.gameState.player.library, ['island', 'mountain']);
      expect(duals.length).toBe(1);
      expect(duals[0].name).toBe('Volcanic Island');
    });

    test('should return empty array if no dual lands match', () => {
      const getDualLands = Fetchlands.getAvailableDualLands.bind(mockContext);

      mockContext.isLandOfType = jest.fn(() => false);

      const duals = getDualLands(mockContext.gameState.player.library, ['swamp', 'forest']);
      expect(duals.length).toBe(0);
    });
  });

  describe('getAvailableLandsInLibrary', () => {
    test('should count available lands by type', () => {
      const getAvailable = Fetchlands.getAvailableLandsInLibrary.bind(mockContext);

      mockContext.isLandOfType = (card, type) => {
        const name = card.name.toLowerCase();
        return name === type;
      };

      const available = getAvailable(mockContext.gameState.player.library, ['island', 'mountain']);
      expect(available.island).toBe(1);
      expect(available.mountain).toBe(1);
    });
  });

  describe('analyzeManaBase', () => {
    test('should analyze mana base correctly', () => {
      const analyze = Fetchlands.analyzeManaBase.bind(mockContext);

      // Add some lands to battlefield
      mockContext.gameState.player.battlefield.lands = [
        { name: 'Island', type: 'Land — Island' },
        { name: 'Island', type: 'Land — Island' },
        { name: 'Mountain', type: 'Land — Mountain' }
      ];

      const manaBase = analyze();

      expect(manaBase.blue).toBe(2);
      expect(manaBase.red).toBe(1);
      expect(manaBase.white).toBe(0);
      expect(manaBase.black).toBe(0);
      expect(manaBase.green).toBe(0);
    });
  });

  describe('getFetchSuggestions', () => {
    test('should suggest land type if color has no sources', () => {
      const getSuggestions = Fetchlands.getFetchSuggestions.bind(mockContext);

      const availableLands = { plains: 2, island: 1 }; // Island available but no blue sources
      const manaBase = { white: 3, blue: 0, black: 0, red: 0, green: 0 };

      const suggestion = getSuggestions(availableLands, manaBase);
      expect(suggestion).toBeTruthy();
      expect(suggestion).toContain('island');
    });

    test('should return null if mana base is balanced', () => {
      const getSuggestions = Fetchlands.getFetchSuggestions.bind(mockContext);

      const availableLands = { plains: 2, island: 2 };
      const manaBase = { white: 2, blue: 2, black: 0, red: 0, green: 0 };

      const suggestion = getSuggestions(availableLands, manaBase);
      expect(suggestion).toBeNull();
    });
  });

  describe('closeFetchlandQuickSelect', () => {
    test('should remove fetchland popup if it exists', () => {
      const close = Fetchlands.closeFetchlandQuickSelect.bind(mockContext);

      // Add a popup to DOM
      const popup = document.createElement('div');
      popup.id = 'fetchlandQuickSelect';
      document.body.appendChild(popup);

      expect(document.getElementById('fetchlandQuickSelect')).toBeTruthy();

      close();

      expect(document.getElementById('fetchlandQuickSelect')).toBeNull();
    });

    test('should not error if popup does not exist', () => {
      const close = Fetchlands.closeFetchlandQuickSelect.bind(mockContext);

      expect(() => close()).not.toThrow();
    });
  });
});
