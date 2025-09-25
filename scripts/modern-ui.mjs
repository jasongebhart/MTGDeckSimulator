/**
 * Modern UI JavaScript - Powers the modernized MTG Simulator interface
 * Features: API integration, loading states, error handling, responsive design
 */

class ModernUI {
  constructor() {
    this.apiBase = '/api/v1';
    this.currentDeck = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.predefinedDecks = [
      './xml/BigRedMachine.xml',
      './xml/Stasis.xml',
      './xml/ZombieRenewal.xml',
      './xml/Rith.xml',
      './xml/BlackRack.xml',
      './xml/UndeadCurse.xml',
      './xml/GoblinGlory.xml',
      './xml/GreenMachine.xml'
    ];

    this.init();
  }

  async init() {
    this.setupTheme();
    this.setupEventListeners();
    this.populatePredefinedDecks();
    this.showEmptyState();
  }

  setupTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Deck selection
    const preDefinedDecks = document.getElementById('preDefinedDecks');
    if (preDefinedDecks) {
      preDefinedDecks.addEventListener('change', (e) => this.loadPredefinedDeck(e.target.value));
    }

    // File upload
    const loadXMLButton = document.getElementById('loadXMLFileButton');
    const xmlFile = document.getElementById('xmlFile');
    if (loadXMLButton && xmlFile) {
      loadXMLButton.addEventListener('click', () => xmlFile.click());
      xmlFile.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Retry button
    const retryButton = document.getElementById('retryButton');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.retryLastAction());
    }

    // Sort buttons
    ['sortByName', 'sortByCost', 'sortByType'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this.sortCards(id.replace('sortBy', '').toLowerCase()));
      }
    });

    // FAB button
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
      fabButton.addEventListener('click', () => {
        const xmlFile = document.getElementById('xmlFile');
        if (xmlFile) xmlFile.click();
      });
    }

    // Responsive handling
    this.setupResponsiveHandling();
  }

  setupResponsiveHandling() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    const handleResponsive = (e) => {
      if (mobileMenuToggle) {
        if (e.matches) {
          mobileMenuToggle.classList.remove('d-none');
        } else {
          mobileMenuToggle.classList.add('d-none');
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    };

    mediaQuery.addListener(handleResponsive);
    handleResponsive(mediaQuery);
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.setupTheme();
    this.showToast(`Switched to ${this.currentTheme} theme`, 'info');
  }

  toggleMobileMenu() {
    document.body.classList.toggle('mobile-sidebar-open');
  }

  populatePredefinedDecks() {
    const select = document.getElementById('preDefinedDecks');
    if (!select) return;

    this.predefinedDecks.forEach(deckPath => {
      const deckName = deckPath.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
      const option = document.createElement('option');
      option.value = deckPath;
      option.textContent = deckName;
      select.appendChild(option);
    });
  }

  showLoadingState() {
    this.hideAllStates();
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.style.display = 'block';
      loadingState.classList.add('fade-in');
    }
  }

  showErrorState(message) {
    this.hideAllStates();
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    if (errorState && errorMessage) {
      errorMessage.textContent = message;
      errorState.style.display = 'block';
    }
  }

  showEmptyState() {
    this.hideAllStates();
    document.getElementById('emptyState').style.display = 'block';
  }

  showDeckContent() {
    this.hideAllStates();
    const deckContent = document.getElementById('deckContent');
    if (deckContent) {
      deckContent.style.display = 'block';
      deckContent.classList.add('slide-in-up');
    }
  }

  hideAllStates() {
    ['loadingState', 'errorState', 'emptyState', 'deckContent'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
        element.classList.remove('fade-in', 'slide-in-up', 'scale-in');
      }
    });
  }

  async loadPredefinedDeck(deckPath) {
    if (!deckPath) {
      this.showEmptyState();
      return;
    }

    this.showLoadingState();

    try {
      const fileName = deckPath.split('/').pop();
      const response = await fetch(`${this.apiBase}/decks/${fileName}`);

      if (!response.ok) {
        throw new Error(`Failed to load deck: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentDeck = result.data;
        this.displayDeck(result.data);
        this.showToast(`Loaded ${result.data.deck.name}`, 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to load deck');
      }

    } catch (error) {
      console.error('Error loading predefined deck:', error);
      this.showErrorState(error.message);
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.showLoadingState();

    try {
      const formData = new FormData();
      formData.append('deckFile', file);

      const response = await fetch(`${this.apiBase}/decks/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload deck: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentDeck = result.data;
        this.displayDeck(result.data);
        this.showToast(`Uploaded ${file.name}`, 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to upload deck');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      this.showErrorState(error.message);
      this.showToast(`Upload error: ${error.message}`, 'error');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  }

  displayDeck(deckData) {
    this.updateDeckHeader(deckData);
    this.updateDeckMetadata(deckData);
    this.updateCardTypesOverview(deckData);
    this.updateCardList(deckData);
    this.updateManaCurve(deckData);
    this.showDeckContent();
  }

  updateDeckHeader(deckData) {
    const { deck, statistics } = deckData;

    const deckName = document.getElementById('deckName');
    const deckStats = document.getElementById('deckStats');

    if (deckName) deckName.textContent = deck.name || 'Unnamed Deck';
    if (deckStats) {
      deckStats.textContent = `${deck.totalCards} cards • ${statistics.creatures} creatures • ${statistics.spells} spells • ${statistics.lands} lands`;
    }
  }

  updateDeckMetadata(deckData) {
    const { deck, statistics } = deckData;

    const deckSize = document.getElementById('deckSize');
    const avgManaCost = document.getElementById('avgManaCost');

    if (deckSize) deckSize.textContent = deck.totalCards;
    if (avgManaCost) avgManaCost.textContent = statistics.averageCost || 'N/A';
  }

  updateCardTypesOverview(deckData) {
    const { statistics } = deckData;
    const container = document.getElementById('cardTypesGrid');
    if (!container) return;

    const cardTypes = [
      { name: 'Creatures', count: statistics.creatures, icon: '⚔️', color: 'var(--success)' },
      { name: 'Spells', count: statistics.spells, icon: '✨', color: 'var(--primary)' },
      { name: 'Lands', count: statistics.lands, icon: '🏔️', color: 'var(--warning)' }
    ];

    container.className = 'd-flex gap-4 flex-wrap card-types-grid';
    container.innerHTML = cardTypes.map(type => `
      <div class="card" style="min-width: 140px; flex: 1;">
        <div class="card-body text-center">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">${type.icon}</div>
          <div class="font-weight-bold" style="color: ${type.color}; font-size: 1.5rem;">${type.count}</div>
          <div class="text-muted">${type.name}</div>
        </div>
      </div>
    `).join('');
  }

  updateCardList(deckData) {
    const { deck } = deckData;
    const container = document.getElementById('cardList');
    if (!container) return;

    const sortedCards = [...deck.cards].sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = sortedCards.map((card, index) => `
      <div class="card-list-item" style="animation-delay: ${index * 0.05}s">
        <div class="card-info">
          <div class="card-name">${this.escapeHtml(card.name)}</div>
          <div class="card-details">
            ${card.cost ? `<span>Cost: ${this.escapeHtml(card.cost)}</span>` : ''}
            ${card.type ? `<span>Type: ${this.escapeHtml(card.type)}</span>` : ''}
          </div>
        </div>
        <div class="card-quantity">
          ${card.quantity || 1}x
        </div>
      </div>
    `).join('');

    // Add staggered animation class
    setTimeout(() => {
      container.querySelectorAll('.card-list-item').forEach(item => {
        item.classList.add('slide-in-up');
      });
    }, 100);
  }

  updateManaCurve(deckData) {
    const container = document.getElementById('manaCurveChart');
    if (!container) return;

    // Simple mana curve visualization
    // This would be enhanced with a proper charting library
    container.innerHTML = `
      <div style="padding: var(--space-4); text-center;">
        <div class="text-muted">Mana Curve Chart</div>
        <div style="margin-top: var(--space-2);">
          Average CMC: <strong>${deckData.statistics.averageCost || 'N/A'}</strong>
        </div>
      </div>
    `;
  }

  sortCards(sortBy) {
    if (!this.currentDeck) return;

    const sortFunctions = {
      name: (a, b) => a.name.localeCompare(b.name),
      cost: (a, b) => (parseFloat(a.cost) || 0) - (parseFloat(b.cost) || 0),
      type: (a, b) => (a.type || '').localeCompare(b.type || '')
    };

    const sortFunction = sortFunctions[sortBy];
    if (sortFunction) {
      this.currentDeck.deck.cards.sort(sortFunction);
      this.updateCardList(this.currentDeck);
      this.showToast(`Sorted by ${sortBy}`, 'info');
    }
  }

  retryLastAction() {
    // This would retry the last failed action
    // For now, just hide the error state
    this.showEmptyState();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const colors = {
      success: 'var(--success)',
      error: 'var(--error)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ModernUI());
} else {
  new ModernUI();
}