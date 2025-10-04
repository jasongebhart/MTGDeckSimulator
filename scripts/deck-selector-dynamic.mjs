/**
 * Dynamic Deck Selector
 * Fetches deck list from API and renders dynamically
 */

class DynamicDeckSelector {
  constructor() {
    this.decks = [];
    this.init();
  }

  async init() {
    try {
      await this.fetchDecks();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Failed to initialize deck selector:', error);
    }
  }

  async fetchDecks() {
    try {
      const response = await fetch('/api/v1/decks/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.decks = await response.json();
      console.log(`Loaded ${this.decks.length} decks dynamically`);
    } catch (error) {
      console.error('Error fetching decks:', error);
      this.decks = [];
    }
  }

  render() {
    const container = document.querySelector('.deck-selector-grid');
    if (!container) {
      console.warn('Deck selector container not found');
      return;
    }

    // Hide loading state
    const loadingState = document.querySelector('.deck-loading');
    if (loadingState) {
      loadingState.style.display = 'none';
    }

    // Group decks by category
    const grouped = this.groupByCategory();

    // Generate HTML
    let html = '';
    for (const [category, decks] of Object.entries(grouped)) {
      html += `
        <div class="deck-category">
          <h4 class="category-title">${category}</h4>
          <div class="deck-grid">
            ${decks.map(deck => this.renderDeckItem(deck)).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  renderDeckItem(deck) {
    // Add star for optimized decks
    const displayName = deck.name.includes('Optimized') ? `⭐ ${deck.name}` : deck.name;

    return `
      <div class="deck-item" data-path="${this.escapeHtml(deck.path)}" data-deck-name="${this.escapeHtml(deck.name)}">
        <div class="deck-name">${this.escapeHtml(displayName)}</div>
        <div class="deck-type">${this.escapeHtml(deck.type)}</div>
      </div>
    `;
  }

  groupByCategory() {
    const grouped = {};

    this.decks.forEach(deck => {
      const category = deck.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(deck);
    });

    return grouped;
  }

  attachEventListeners() {
    const deckItems = document.querySelectorAll('.deck-item');

    deckItems.forEach(item => {
      item.addEventListener('click', () => {
        const deckPath = item.getAttribute('data-path');
        const deckName = item.getAttribute('data-deck-name');

        // Dispatch custom event for deck selection
        document.dispatchEvent(new CustomEvent('deckSelected', {
          detail: { deckPath, deckName }
        }));

        // Close expanded selector if exists
        const expandedSelector = document.getElementById('expandedDeckSelector');
        if (expandedSelector) {
          expandedSelector.style.display = 'none';
        }

        // Update expand button text if exists
        const expandButton = document.getElementById('expandDeckSelector');
        if (expandButton) {
          expandButton.textContent = '⋯ More';
        }
      });
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Method to refresh deck list
  async refresh() {
    await this.fetchDecks();
    this.render();
    this.attachEventListeners();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.deckSelector = new DynamicDeckSelector();
  });
} else {
  window.deckSelector = new DynamicDeckSelector();
}

export default DynamicDeckSelector;
