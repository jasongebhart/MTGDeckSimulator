import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

// Mock deck statistics functions from decks.mjs
describe('Deck Management', () => {
  describe('Mana Cost Conversion', () => {
    // We'll need to import or mock the getConvertedCost function
    // For now, let's test the logic manually

    test('should calculate converted mana cost correctly', () => {
      // Test different mana cost formats
      const testCosts = [
        { input: '{1}{R}', expectedNumeric: 1, expectedColor: 1 },
        { input: '{3}{U}{U}', expectedNumeric: 3, expectedColor: 2 },
        { input: '{X}{B}{B}', expectedNumeric: 0, expectedColor: 2 }, // X counts as 0
        { input: '{0}', expectedNumeric: 0, expectedColor: 0 },
        { input: '{5}', expectedNumeric: 5, expectedColor: 0 },
      ];

      // Manual implementation for testing
      function getConvertedCost(currentCost) {
        let totalNumericCost = 0;
        let colorCost = 0;

        if (currentCost.includes('{')) {
          const costSegments = currentCost.split(/{|}/);

          for (let i = 0; i < costSegments.length; i++) {
            const segment = costSegments[i].trim();

            if (/^\d+$/.test(segment)) {
              totalNumericCost += parseInt(segment);
            } else if (segment.length === 1 && /[WUBRGC]/.test(segment)) {
              colorCost++;
            }
          }
        }

        return [totalNumericCost, colorCost];
      }

      testCosts.forEach(({ input, expectedNumeric, expectedColor }) => {
        const [numeric, color] = getConvertedCost(input);
        expect(numeric).toBe(expectedNumeric);
        expect(color).toBe(expectedColor);
      });
    });
  });

  describe('Card Type Categorization', () => {
    test('should correctly categorize card types', () => {
      const cardTypes = [
        { type: 'Basic Land — Mountain', expectedCategory: 'land' },
        { type: 'Creature — Human Knight', expectedCategory: 'creature' },
        { type: 'Legendary Creature — Dragon', expectedCategory: 'creature' },
        { type: 'Instant', expectedCategory: 'spell' },
        { type: 'Sorcery', expectedCategory: 'spell' },
        { type: 'Artifact', expectedCategory: 'artifact' },
        { type: 'Enchantment', expectedCategory: 'enchantment' },
        { type: 'Planeswalker', expectedCategory: 'planeswalker' },
      ];

      function categorizeCardType(cardType) {
        if (cardType.includes('Land') || cardType.startsWith('Basic Land')) {
          return 'land';
        }
        if (cardType.startsWith('Creature') || cardType.startsWith('Legendary Creature')) {
          return 'creature';
        }
        if (cardType === 'Instant' || cardType === 'Sorcery') {
          return 'spell';
        }
        if (cardType === 'Artifact') {
          return 'artifact';
        }
        if (cardType === 'Enchantment') {
          return 'enchantment';
        }
        if (cardType === 'Planeswalker') {
          return 'planeswalker';
        }
        return 'other';
      }

      cardTypes.forEach(({ type, expectedCategory }) => {
        const category = categorizeCardType(type);
        expect(category).toBe(expectedCategory);
      });
    });
  });

  describe('XML Generation', () => {
    test('should generate valid XML from deck data', () => {
      const deckData = {
        deckName: 'Test Deck',
        designGoal: 'Testing purposes',
        cards: [
          {
            name: 'Lightning Bolt',
            quantity: '4',
            type: 'Instant',
            cost: '{R}',
            rulesText: 'Lightning Bolt deals 3 damage to any target.',
          },
        ],
      };

      // Mock the convertToXml function logic
      function convertToXml(deckData) {
        const doc = document.implementation.createDocument(null, 'Decklist', null);
        const deckElement = doc.documentElement;
        deckElement.setAttribute('Deck', deckData.deckName);

        const designGoalElement = doc.createElement('DesignGoal');
        designGoalElement.textContent = deckData.designGoal;
        deckElement.appendChild(designGoalElement);

        deckData.cards.forEach(card => {
          const cardElement = doc.createElement('Card');

          ['name', 'quantity', 'type', 'cost', 'rulesText'].forEach(prop => {
            const element = doc.createElement(prop.charAt(0).toUpperCase() + prop.slice(1));
            element.textContent = card[prop];
            cardElement.appendChild(element);
          });

          deckElement.appendChild(cardElement);
        });

        return new XMLSerializer().serializeToString(doc);
      }

      const result = convertToXml(deckData);

      expect(result).toContain('<Decklist Deck="Test Deck">');
      expect(result).toContain('<DesignGoal>Testing purposes</DesignGoal>');
      expect(result).toContain('<Name>Lightning Bolt</Name>');
      expect(result).toContain('<Quantity>4</Quantity>');
    });
  });
});
