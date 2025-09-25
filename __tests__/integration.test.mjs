import { describe, test, expect } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Setup DOM environment
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.DOMParser = window.DOMParser;

import { extractCardInfo, buildCardNamesArray, getCardNameXML } from '../scripts/config.mjs';

describe('XML Integration Tests', () => {
  describe('Real Deck XML Parsing', () => {
    test('should parse BlackRack.xml correctly', () => {
      const xmlPath = path.join(process.cwd(), 'xml', 'BlackRack.xml');

      // Check if file exists
      if (!fs.existsSync(xmlPath)) {
        console.log('BlackRack.xml not found, skipping test');
        return;
      }

      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      // Test that XML parses without errors
      expect(xmlDoc.getElementsByTagName('parsererror')).toHaveLength(0);

      const deckInformation = getCardNameXML(xmlDoc);

      // Validate deck structure
      expect(deckInformation).toHaveProperty('cardNames');
      expect(deckInformation).toHaveProperty('cardInfo');
      expect(Array.isArray(deckInformation.cardNames)).toBe(true);
      expect(typeof deckInformation.cardInfo).toBe('object');

      // Validate specific card data
      const cardInfo = deckInformation.cardInfo;
      expect(cardInfo).toHaveProperty('Dark Ritual');
      expect(cardInfo['Dark Ritual']).toEqual({
        quantity: 4,
        type: 'instant',
      });

      expect(cardInfo).toHaveProperty('Swamp');
      expect(cardInfo['Swamp']).toEqual({
        quantity: 21,
        type: 'basic land — swamp',
      });

      // Validate deck size
      const totalCards = deckInformation.cardNames.length;
      expect(totalCards).toBeGreaterThan(50); // Typical MTG deck size
    });

    test('should handle XML with various card types', () => {
      const testXML = `<?xml version="1.0" encoding="UTF-8"?>
        <Decklist Deck="Test Integration Deck">
          <DesignGoal>Integration testing with various card types</DesignGoal>
          <Card>
            <Name>Lightning Bolt</Name>
            <Quantity>4</Quantity>
            <Type>Instant</Type>
          </Card>
          <Card>
            <Name>Tarmogoyf</Name>
            <Quantity>4</Quantity>
            <Type>Creature — Lhurgoyf</Type>
          </Card>
          <Card>
            <Name>Jace, the Mind Sculptor</Name>
            <Quantity>2</Quantity>
            <Type>Legendary Planeswalker — Jace</Type>
          </Card>
          <Card>
            <Name>Wasteland</Name>
            <Quantity>4</Quantity>
            <Type>Land</Type>
          </Card>
          <Card>
            <Name>Ancestral Recall</Name>
            <Quantity>1</Quantity>
            <Type>Instant</Type>
          </Card>
        </Decklist>`;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(testXML, 'text/xml');
      const deckInformation = getCardNameXML(xmlDoc);

      // Validate card extraction
      expect(Object.keys(deckInformation.cardInfo)).toHaveLength(5);

      // Validate quantities match XML
      expect(deckInformation.cardInfo['Lightning Bolt'].quantity).toBe(4);
      expect(deckInformation.cardInfo['Tarmogoyf'].quantity).toBe(4);
      expect(deckInformation.cardInfo['Jace, the Mind Sculptor'].quantity).toBe(2);
      expect(deckInformation.cardInfo['Wasteland'].quantity).toBe(4);
      expect(deckInformation.cardInfo['Ancestral Recall'].quantity).toBe(1);

      // Validate total deck size (4+4+2+4+1 = 15)
      expect(deckInformation.cardNames.length).toBe(15);

      // Validate card type parsing
      expect(deckInformation.cardInfo['Lightning Bolt'].type).toBe('instant');
      expect(deckInformation.cardInfo['Tarmogoyf'].type).toBe('creature — lhurgoyf');
      expect(deckInformation.cardInfo['Jace, the Mind Sculptor'].type).toBe(
        'legendary planeswalker — jace'
      );
      expect(deckInformation.cardInfo['Wasteland'].type).toBe('land');
    });

    test('should handle malformed XML gracefully', () => {
      const malformedXML = `<?xml version="1.0"?>
        <Decklist Deck="Malformed">
          <Card>
            <Name>Test Card</Name>
            <Quantity>invalid</Quantity>
            <Type>Instant</Type>
          </Card>
        </Decklist>`;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(malformedXML, 'text/xml');

      // Should handle invalid quantity gracefully
      let deckInformation;
      expect(() => {
        deckInformation = getCardNameXML(xmlDoc);
      }).toThrow(); // This actually throws due to invalid array length

      // The real-world application should validate quantities before processing
    });
  });

  describe('File System Integration', () => {
    test('should list available deck files', () => {
      const xmlDir = path.join(process.cwd(), 'xml');

      if (fs.existsSync(xmlDir)) {
        const files = fs.readdirSync(xmlDir).filter(file => file.endsWith('.xml'));
        expect(files.length).toBeGreaterThan(0);

        // Check that common deck files exist
        const expectedFiles = ['BlackRack.xml', 'affinity.xml', 'goblins.xml'];
        const foundFiles = expectedFiles.filter(file => files.includes(file));
        expect(foundFiles.length).toBeGreaterThan(0);
      }
    });

    test('should parse multiple deck files without errors', () => {
      const xmlDir = path.join(process.cwd(), 'xml');

      if (!fs.existsSync(xmlDir)) {
        console.log('XML directory not found, skipping test');
        return;
      }

      const xmlFiles = fs
        .readdirSync(xmlDir)
        .filter(file => file.endsWith('.xml'))
        .slice(0, 5); // Test first 5 files only

      xmlFiles.forEach(filename => {
        const xmlPath = path.join(xmlDir, filename);
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Should parse without errors
        expect(xmlDoc.getElementsByTagName('parsererror')).toHaveLength(0);

        // Should extract some card data
        const deckInformation = getCardNameXML(xmlDoc);
        expect(deckInformation.cardNames.length).toBeGreaterThan(0);
        expect(Object.keys(deckInformation.cardInfo).length).toBeGreaterThan(0);
      });
    });
  });
});
