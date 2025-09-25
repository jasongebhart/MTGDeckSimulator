import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment with required elements for card movement
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="section_spells"></div>
      <div id="section_lands"></div>
      <div id="section_battlefield-spells"></div>
      <div id="section_battlefield-lands"></div>
      <div id="section_graveyard"></div>
      <div id="section_exile"></div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;

describe('Card Movement Mechanics', () => {
  let mockCardInfo;

  // Helper function available to all tests
  function createMockCardElement(cardName, section) {
    const targetSection = document.getElementById(`section_${section}`);
    if (!targetSection) return null;

    const cardDiv = document.createElement('div');
    cardDiv.id = `div1_${section}_${cardName}`;
    cardDiv.classList.add('card');
    cardDiv.textContent = cardName; // Simple text content for testing

    targetSection.appendChild(cardDiv);
    return cardDiv;
  }

  beforeEach(() => {
    // Reset DOM elements
    document.querySelectorAll('[id^="section_"]').forEach(section => {
      section.innerHTML = '';
    });

    // Mock card information
    mockCardInfo = {
      'Lightning Bolt': { quantity: 4, type: 'instant' },
      Mountain: { quantity: 20, type: 'basic land — mountain' },
      Tarmogoyf: { quantity: 4, type: 'creature — lhurgoyf' },
      Forest: { quantity: 4, type: 'basic land — forest' },
    };
  });

  describe('Card Categorization', () => {
    test('should categorize cards by type correctly', () => {
      function getDestinationSection(toLocation, cardName, cardInfo) {
        let destinationSection = toLocation;

        if (toLocation === 'hand' || toLocation === 'battlefield') {
          const card = cardInfo[cardName];
          if (card) {
            if (/(^|\s)land($|\s)/i.test(card.type)) {
              destinationSection = toLocation === 'hand' ? 'lands' : 'battlefield-lands';
            } else {
              destinationSection = toLocation === 'hand' ? 'spells' : 'battlefield-spells';
            }
          }
        }

        return destinationSection;
      }

      // Test hand categorization
      expect(getDestinationSection('hand', 'Lightning Bolt', mockCardInfo)).toBe('spells');
      expect(getDestinationSection('hand', 'Mountain', mockCardInfo)).toBe('lands');
      expect(getDestinationSection('hand', 'Tarmogoyf', mockCardInfo)).toBe('spells');

      // Test battlefield categorization
      expect(getDestinationSection('battlefield', 'Lightning Bolt', mockCardInfo)).toBe(
        'battlefield-spells'
      );
      expect(getDestinationSection('battlefield', 'Mountain', mockCardInfo)).toBe(
        'battlefield-lands'
      );
      expect(getDestinationSection('battlefield', 'Forest', mockCardInfo)).toBe(
        'battlefield-lands'
      );

      // Test direct sections
      expect(getDestinationSection('graveyard', 'Lightning Bolt', mockCardInfo)).toBe('graveyard');
      expect(getDestinationSection('exile', 'Mountain', mockCardInfo)).toBe('exile');
    });
  });

  describe('Card Creation and Movement', () => {
    test('should create card elements in correct sections', () => {
      // Create cards in different sections
      const boltInHand = createMockCardElement('Lightning Bolt', 'spells');
      const mountainInHand = createMockCardElement('Mountain', 'lands');

      expect(boltInHand).toBeTruthy();
      expect(mountainInHand).toBeTruthy();

      // Verify cards are in correct sections
      const spellsSection = document.getElementById('section_spells');
      const landsSection = document.getElementById('section_lands');

      expect(spellsSection.children.length).toBe(1);
      expect(landsSection.children.length).toBe(1);

      expect(spellsSection.querySelector('[id="div1_spells_Lightning Bolt"]')).toBeTruthy();
      expect(landsSection.querySelector('[id="div1_lands_Mountain"]')).toBeTruthy();
    });

    test('should move cards between sections', () => {
      function moveCardBetweenSections(cardName, fromSection, toSection) {
        const fromElement = document.getElementById(`section_${fromSection}`);
        const toElement = document.getElementById(`section_${toSection}`);
        const cardElement = document.getElementById(`div1_${fromSection}_${cardName}`);

        if (!cardElement || !toElement) return false;

        // Remove from current location
        cardElement.remove();

        // Create new element in destination
        const newCardElement = document.createElement('div');
        newCardElement.id = `div1_${toSection}_${cardName}`;
        newCardElement.classList.add('card');
        newCardElement.textContent = cardName;

        toElement.appendChild(newCardElement);
        return true;
      }

      // Create card in spells section
      createMockCardElement('Lightning Bolt', 'spells');

      // Move to graveyard
      const moved = moveCardBetweenSections('Lightning Bolt', 'spells', 'graveyard');

      expect(moved).toBe(true);
      expect(document.getElementById('div1_spells_Lightning Bolt')).toBeFalsy();
      expect(document.getElementById('div1_graveyard_Lightning Bolt')).toBeTruthy();

      // Verify sections have correct counts
      expect(document.getElementById('section_spells').children.length).toBe(0);
      expect(document.getElementById('section_graveyard').children.length).toBe(1);
    });
  });

  describe('Game State Management', () => {
    test('should track cards in different zones', () => {
      function getCardsInZone(zone) {
        const section = document.getElementById(`section_${zone}`);
        if (!section) return [];

        return Array.from(section.children).map(card => {
          const id = card.id;
          const parts = id.split('_');
          return parts[parts.length - 1]; // Card name is the last part
        });
      }

      // Add cards to different zones
      createMockCardElement('Lightning Bolt', 'spells');
      createMockCardElement('Mountain', 'lands');
      createMockCardElement('Tarmogoyf', 'battlefield-spells');
      createMockCardElement('Forest', 'battlefield-lands');

      // Test zone tracking
      expect(getCardsInZone('spells')).toEqual(['Lightning Bolt']);
      expect(getCardsInZone('lands')).toEqual(['Mountain']);
      expect(getCardsInZone('battlefield-spells')).toEqual(['Tarmogoyf']);
      expect(getCardsInZone('battlefield-lands')).toEqual(['Forest']);
      expect(getCardsInZone('graveyard')).toEqual([]);
    });

    test('should handle card visibility toggles', () => {
      function toggleSectionVisibility(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return false;

        const hasContent = section.children.length > 0;
        section.style.display = hasContent ? 'flex' : 'none';
        return hasContent;
      }

      const graveyardSection = document.getElementById('section_graveyard');

      // Test empty section
      expect(toggleSectionVisibility('section_graveyard')).toBe(false);
      expect(graveyardSection.style.display).toBe('none');

      // Add card and test again
      createMockCardElement('Dead Card', 'graveyard');
      expect(toggleSectionVisibility('section_graveyard')).toBe(true);
      expect(graveyardSection.style.display).toBe('flex');
    });
  });
});
