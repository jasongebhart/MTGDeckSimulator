import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Helper function to read file content
const readFile = (filePath) => {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
};

// Load the EJS file content
const ejsContent = readFile('views/playhand-modern.ejs');

// Mock the ejs include
const renderedHtml = ejsContent.replace('<%- include(\'partials/nav-modern\', { activePage: \'playhand\' }); -%>', '');

describe('Context Menu Integration Test', () => {
  let dom;
  let window;
  let document;

  beforeEach(async () => {
    dom = new JSDOM(renderedHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'file://' + process.cwd() + '/views/index.html', // Set a base URL for module resolution
    });
    window = dom.window;
    document = window.document;

    // Mock the gameState and other necessary properties on the window object
    window.handSimulator = {
      gameState: {
        player: {
          hand: [{ id: 'Wasteland_123', name: 'Wasteland', type: 'Land' }],
        },
        opponent: {
          hand: [],
        },
      },
      uiManager: {
        getCardMainType: jest.fn().mockReturnValue('land'),
        showToast: jest.fn(),
      },
      playCardDirectly: jest.fn(),
      moveHandCardToGraveyard: jest.fn(),
      moveHandCardToExile: jest.fn(),
      moveHandCardToLibrary: jest.fn(),
      showCardPreview: jest.fn(),
    };

    // Manually load the script
    const scriptContent = readFile('scripts/playhand-modern-refactored.mjs');
    const scriptEl = document.createElement('script');
    scriptEl.type = 'module';
    scriptEl.textContent = scriptContent;
    document.head.appendChild(scriptEl);

    // Wait for the script to be loaded and executed
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (window.ModernHandSimulator) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    // Instantiate the class
    window.handSimulatorInstance = new window.ModernHandSimulator();
    
    // Mock the necessary methods on the instance
    Object.assign(window.handSimulatorInstance, window.handSimulator);
  });

  test('should show context menu when showHandCardMenu is called', () => {
    // Create a mock card element
    const cardElement = document.createElement('div');
    cardElement.className = 'card-hand';
    document.body.appendChild(cardElement);

    const mockEvent = {
      target: cardElement,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    const cardId = 'Wasteland_123';

    // Call the function
    window.handSimulatorInstance.showHandCardMenu(mockEvent, cardId);

    // Check if the menu exists in the document
    const menu = document.querySelector('.context-menu');
    expect(menu).not.toBeNull();
    expect(menu.style.display).toBe('block');

    // Check for menu items
    const menuOptions = menu.querySelectorAll('.context-menu-option');
    expect(menuOptions.length).toBe(5);
    expect(menuOptions[0].textContent).toContain('Play Land');
  });
});
