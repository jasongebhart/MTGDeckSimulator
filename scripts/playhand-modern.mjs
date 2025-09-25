/**
 * Modern Hand Simulator - Powers the modernized MTG Hand Simulator interface
 * Features: Deck integration, hand simulation, battlefield management, modern animations
 */

class ModernHandSimulator {
  constructor() {
    this.apiBase = '/api/v1';
    this.currentDeck = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.library = [];
    this.hand = [];
    this.battlefield = { lands: [], creatures: [], others: [] };
    this.graveyard = [];
    this.exile = [];
    this.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0
    };
    this.selectedCards = new Set();
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
    this.setupZoneTabs();
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

    // Hand controls
    const drawHandButton = document.getElementById('drawHandButton');
    if (drawHandButton) {
      drawHandButton.addEventListener('click', () => this.drawHand());
    }

    const drawCardButton = document.getElementById('drawCardButton');
    if (drawCardButton) {
      drawCardButton.addEventListener('click', () => this.drawCard());
    }

    const mulliganButton = document.getElementById('mulligan');
    if (mulliganButton) {
      mulliganButton.addEventListener('click', () => this.mulligan());
    }

    const sortHandButton = document.getElementById('sortHandButton');
    if (sortHandButton) {
      sortHandButton.addEventListener('click', () => this.sortHand());
    }

    // Library controls
    const viewLibraryButton = document.getElementById('viewLibraryButton');
    if (viewLibraryButton) {
      viewLibraryButton.addEventListener('click', () => this.showLibraryModal());
    }

    const closeLibraryModal = document.getElementById('closeLibraryModal');
    if (closeLibraryModal) {
      closeLibraryModal.addEventListener('click', () => this.hideLibraryModal());
    }

    // FAB button
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
      fabButton.addEventListener('click', () => this.showQuickActions());
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

  setupZoneTabs() {
    const zoneTabs = document.querySelectorAll('.zone-tab');
    zoneTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetZone = e.target.getAttribute('data-zone');
        this.switchZone(targetZone);
      });
    });
  }

  switchZone(zoneName) {
    // Update tab appearance
    document.querySelectorAll('.zone-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-zone="${zoneName}"]`).classList.add('active');

    // Switch zone content
    document.querySelectorAll('.zone-content').forEach(zone => zone.style.display = 'none');
    document.getElementById(`${zoneName}Zone`).style.display = 'flex';
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

  showEmptyState() {
    this.hideAllStates();
    document.getElementById('emptyState').style.display = 'block';
  }

  showGameContent() {
    this.hideAllStates();
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
      gameContent.style.display = 'block';
      gameContent.classList.add('slide-in-up');
    }
  }

  hideAllStates() {
    ['loadingState', 'emptyState', 'gameContent'].forEach(id => {
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
        this.setupGame(result.data);
        this.showToast(`Loaded ${result.data.deck.name}`, 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to load deck');
      }

    } catch (error) {
      console.error('Error loading predefined deck:', error);
      this.showToast(`Error: ${error.message}`, 'error');
      this.showEmptyState();
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
        this.setupGame(result.data);
        this.showToast(`Uploaded ${file.name}`, 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to upload deck');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      this.showToast(`Upload error: ${error.message}`, 'error');
      this.showEmptyState();
    } finally {
      event.target.value = '';
    }
  }

  setupGame(deckData) {
    // Initialize library with deck cards
    this.library = [];
    deckData.deck.cards.forEach(card => {
      for (let i = 0; i < card.quantity; i++) {
        this.library.push({ ...card, id: `${card.name}_${i}` });
      }
    });

    // Shuffle the library
    this.shuffleArray(this.library);

    // Reset game state
    this.hand = [];
    this.battlefield = { lands: [], creatures: [], others: [] };
    this.graveyard = [];
    this.exile = [];
    this.gameStats = {
      cardsDrawn: 0,
      landsPlayed: 0,
      spellsCast: 0,
      turnNumber: 1,
      mulligans: 0
    };

    this.updateUI();
    this.showGameContent();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  drawHand() {
    if (!this.currentDeck) return;

    // Clear current hand
    this.hand = [];
    this.selectedCards.clear();

    // Draw 7 cards
    const handSize = 7 - this.gameStats.mulligans;
    for (let i = 0; i < Math.min(handSize, this.library.length); i++) {
      this.drawCard(false);
    }

    this.updateHandDisplay();
    this.showToast(`Drew ${Math.min(handSize, this.library.length)} cards`, 'success');
  }

  drawCard(showAnimation = true) {
    if (this.library.length === 0) {
      this.showToast('Library is empty!', 'warning');
      return;
    }

    const card = this.library.pop();
    this.hand.push(card);
    this.gameStats.cardsDrawn++;

    if (showAnimation) {
      this.updateHandDisplay();
      this.showToast(`Drew ${card.name}`, 'info');
    }

    this.updateUI();
  }

  mulligan() {
    if (this.hand.length === 0) {
      this.showToast('No cards in hand to mulligan', 'warning');
      return;
    }

    // Put cards back in library
    this.library.push(...this.hand);
    this.shuffleArray(this.library);

    this.gameStats.mulligans++;
    this.drawHand();

    this.showToast(`Mulligan ${this.gameStats.mulligans}`, 'info');
  }

  sortHand() {
    this.hand.sort((a, b) => {
      // Sort by type first, then by cost, then by name
      const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);

      if (typeOrder[aType] !== typeOrder[bType]) {
        return (typeOrder[aType] || 6) - (typeOrder[bType] || 6);
      }

      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      if (aCost !== bCost) {
        return aCost - bCost;
      }

      return a.name.localeCompare(b.name);
    });

    this.updateHandDisplay();
    this.showToast('Hand sorted', 'info');
  }

  getCardMainType(type) {
    const typeStr = (type || '').toLowerCase();
    if (typeStr.includes('land')) return 'Land';
    if (typeStr.includes('creature')) return 'Creature';
    if (typeStr.includes('artifact')) return 'Artifact';
    if (typeStr.includes('enchantment')) return 'Enchantment';
    if (typeStr.includes('sorcery')) return 'Sorcery';
    if (typeStr.includes('instant')) return 'Instant';
    return 'Other';
  }

  parseManaValue(cost) {
    if (!cost) return 0;

    let totalCost = 0;
    const numbers = cost.match(/\{(\d+)\}/g);
    if (numbers) {
      numbers.forEach(num => {
        const value = parseInt(num.replace(/[{}]/g, ''));
        if (!isNaN(value)) totalCost += value;
      });
    }

    const coloredMana = cost.match(/\{[WUBRG]\}/g);
    if (coloredMana) totalCost += coloredMana.length;

    return totalCost;
  }

  updateHandDisplay() {
    const container = document.getElementById('handContainer');
    if (!container) return;

    container.innerHTML = this.hand.map((card, index) => {
      const cardType = this.getCardMainType(card.type).toLowerCase();
      const isSelected = this.selectedCards.has(card.id);

      return `
        <div class="card-hand ${cardType} ${isSelected ? 'selected' : ''} card-dealt"
             data-card-id="${card.id}"
             style="animation-delay: ${index * 0.1}s"
             onclick="window.handSimulator.toggleCardSelection('${card.id}')">
          <div class="card-name">${this.escapeHtml(card.name)}</div>
          <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
          <div class="card-type">${this.escapeHtml(this.getCardMainType(card.type))}</div>
        </div>
      `;
    }).join('');
  }

  toggleCardSelection(cardId) {
    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      this.selectedCards.add(cardId);
    }
    this.updateHandDisplay();
  }

  playSelectedCards() {
    if (this.selectedCards.size === 0) {
      this.showToast('No cards selected', 'warning');
      return;
    }

    const cardsToPlay = this.hand.filter(card => this.selectedCards.has(card.id));

    cardsToPlay.forEach(card => {
      this.playCard(card);
    });

    // Remove played cards from hand
    this.hand = this.hand.filter(card => !this.selectedCards.has(card.id));
    this.selectedCards.clear();

    this.updateHandDisplay();
    this.updateBattlefieldDisplay();
    this.updateUI();
  }

  playCard(card) {
    const cardType = this.getCardMainType(card.type);

    if (cardType === 'Land') {
      this.battlefield.lands.push(card);
      this.gameStats.landsPlayed++;
    } else if (cardType === 'Creature') {
      this.battlefield.creatures.push(card);
      this.gameStats.spellsCast++;
    } else {
      this.battlefield.others.push(card);
      this.gameStats.spellsCast++;
    }
  }

  updateBattlefieldDisplay() {
    this.updateZoneDisplay('battlefieldLands', this.battlefield.lands);
    this.updateZoneDisplay('battlefieldCreatures', this.battlefield.creatures);
    this.updateZoneDisplay('battlefieldOthers', this.battlefield.others);
  }

  updateZoneDisplay(containerId, cards) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = cards.map((card, index) => `
      <div class="zone-card card-played"
           style="animation-delay: ${index * 0.05}s"
           onclick="window.handSimulator.selectBattlefieldCard('${card.id}')">
        <div class="card-name">${this.escapeHtml(card.name)}</div>
        <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
      </div>
    `).join('');
  }

  showLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) {
      modal.style.display = 'flex';
      this.updateLibraryDisplay();
    }
  }

  hideLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  updateLibraryDisplay() {
    const container = document.getElementById('libraryContents');
    if (!container) return;

    container.innerHTML = this.library.map(card => `
      <div class="card-list-item">
        <div class="card-info">
          <div class="card-name">${this.escapeHtml(card.name)}</div>
          <div class="card-details">
            <span>Cost: ${this.escapeHtml(card.cost || '0')}</span>
            <span>Type: ${this.escapeHtml(card.type || '')}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateUI() {
    // Update counters
    document.getElementById('handCount').textContent = `${this.hand.length} cards`;
    document.getElementById('mulliganCount').textContent = `${this.gameStats.mulligans} mulligans`;
    document.getElementById('deckSize').textContent = `${this.library.length} cards remaining`;
    document.getElementById('graveyardCount').textContent = this.graveyard.length;
    document.getElementById('exileCount').textContent = this.exile.length;

    // Update stats
    document.getElementById('cardsDrawn').textContent = this.gameStats.cardsDrawn;
    document.getElementById('landsPlayed').textContent = this.gameStats.landsPlayed;
    document.getElementById('spellsCast').textContent = this.gameStats.spellsCast;
    document.getElementById('turnNumber').textContent = this.gameStats.turnNumber;
  }

  showQuickActions() {
    if (this.selectedCards.size > 0) {
      this.playSelectedCards();
    } else {
      this.drawCard();
    }
  }

  showToast(message, type = 'info') {
    // Reuse toast functionality from modern-ui.mjs
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

    container.appendChild(toast);

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
let handSimulator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    handSimulator = new ModernHandSimulator();
    window.handSimulator = handSimulator; // Make available globally for onclick handlers
  });
} else {
  handSimulator = new ModernHandSimulator();
  window.handSimulator = handSimulator;
}