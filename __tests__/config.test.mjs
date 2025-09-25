import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Mock DOM environment for config functions
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.DOMParser = window.DOMParser;

import { extractCardInfo, buildCardNamesArray, cardDraw } from '../scripts/config.mjs';

describe('Config Module', () => {
  describe('extractCardInfo', () => {
    test('should extract card information from deck XML', () => {
      // Create a mock deck list XML structure
      const mockXML = `
        <Decklist>
          <Card>
            <Name>Lightning Bolt</Name>
            <Quantity>4</Quantity>
            <Type>instant</Type>
          </Card>
          <Card>
            <Name>Mountain</Name>
            <Quantity>20</Quantity>
            <Type>basic land — mountain</Type>
          </Card>
        </Decklist>
      `;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(mockXML, 'text/xml');
      const deckList = xmlDoc.getElementsByTagName('Decklist')[0];

      const result = extractCardInfo(deckList);

      expect(result).toHaveProperty('Lightning Bolt');
      expect(result['Lightning Bolt']).toEqual({
        quantity: 4,
        type: 'instant',
      });

      expect(result).toHaveProperty('Mountain');
      expect(result['Mountain']).toEqual({
        quantity: 20,
        type: 'basic land — mountain',
      });
    });
  });

  describe('buildCardNamesArray', () => {
    test('should create array with proper card quantities', () => {
      const cardInfo = {
        'Lightning Bolt': { quantity: 4, type: 'instant' },
        Mountain: { quantity: 2, type: 'basic land — mountain' },
      };

      const result = buildCardNamesArray(cardInfo);

      expect(result).toHaveLength(6);
      expect(result.filter(card => card === 'Lightning Bolt')).toHaveLength(4);
      expect(result.filter(card => card === 'Mountain')).toHaveLength(2);
    });
  });

  describe('cardDraw', () => {
    test('should draw correct number of cards and separate lands from spells', () => {
      const cardNames = [
        'Lightning Bolt',
        'Lightning Bolt',
        'Lightning Bolt',
        'Lightning Bolt',
        'Mountain',
        'Mountain',
        'Plains',
        'Plains',
      ];
      const cardInfo = {
        'Lightning Bolt': { quantity: 4, type: 'instant' },
        Mountain: { quantity: 2, type: 'basic land — mountain' },
        Plains: { quantity: 2, type: 'basic land — plains' },
      };

      // cardDraw modifies the cardNames array in place
      const originalCardNames = [...cardNames];
      const result = cardDraw(cardNames, cardInfo, 7);

      expect(result.spells.length + result.lands.length).toBe(7);
      expect(cardNames).toHaveLength(1); // 8 - 7 = 1 remaining

      // Check that lands and spells are properly categorized
      result.lands.forEach(land => {
        expect(['Mountain', 'Plains']).toContain(land);
      });
      result.spells.forEach(spell => {
        expect(['Lightning Bolt']).toContain(spell);
      });
    });
  });
});
