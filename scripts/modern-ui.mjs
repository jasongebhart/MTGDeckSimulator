/**
 * Modern UI JavaScript - Powers the modernized MTG Simulator interface
 * Features: API integration, card images, loading states, error handling, responsive design
 */

import { CardImageService } from '/src/services/cardImageService.mjs';
import { loadXMLDoc, getCardNameXML } from './config.mjs';

class ModernUI {
  constructor() {
    this.apiBase = '/api/v1';
    this.currentDeck = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';

    // Chart instances
    this.manaCurveChart = null;
    this.colorChart = null;
    this.typesChart = null;

    this.predefinedDecks = [
      './xml/BigRedMachine.xml',
      './xml/Stasis.xml',
      './xml/ZombieRenewal.xml',
      './xml/Rith.xml',
      './xml/BlackRack.xml',
      './decks/classic/affinity.xml',
      './decks/classic/goblins.xml',
      './decks/classic/belcher.xml'
    ];

    // Visual debug indicator
    this.setDebugStatus('Script loaded');
    this.init();
  }

  async init() {
    this.setupTheme();
    this.setupEventListeners();
    this.populatePredefinedDecks();
    this.showEmptyState();

    // Load default deck after a short delay to ensure deck-selector is ready
    setTimeout(() => {
      this.setDebugStatus('Timer fired');
      console.log('Timer callback executing...');
      console.log('this.currentDeck:', this.currentDeck);
      console.log('window.getSelectedDeck:', window.getSelectedDeck);

      if (!this.currentDeck && window.getSelectedDeck) {
        const selectedDeck = window.getSelectedDeck();
        console.log('Found selected deck:', selectedDeck);
        this.setDebugStatus('Found: ' + selectedDeck);
        if (selectedDeck && selectedDeck !== '') {
          this.setDebugStatus('Loading: ' + selectedDeck.split('/').pop());
          this.loadPredefinedDeck(selectedDeck);
        } else {
          this.setDebugStatus('Empty deck path');
        }
      } else if (!this.currentDeck) {
        console.log('No getSelectedDeck function, loading default');
        this.setDebugStatus('Loading default');
        this.loadPredefinedDeck('./decks/classic/affinity.xml');
      } else {
        this.setDebugStatus('Deck already loaded');
      }
    }, 200);
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

    // Quick deck selector
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      quickDeckSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.loadPredefinedDeck(e.target.value);
        }
      });
    }

    // Expand deck selector button
    const expandDeckSelector = document.getElementById('expandDeckSelector');
    const expandedDeckSelector = document.getElementById('expandedDeckSelector');
    if (expandDeckSelector && expandedDeckSelector) {
      expandDeckSelector.addEventListener('click', () => {
        const isVisible = expandedDeckSelector.style.display !== 'none';
        expandedDeckSelector.style.display = isVisible ? 'none' : 'block';
        expandDeckSelector.textContent = isVisible ? '⋯ More' : '× Close';

        // Add click listeners to deck items when expanded
        if (!isVisible) {
          setTimeout(() => {
            const deckItems = expandedDeckSelector.querySelectorAll('.deck-item');
            deckItems.forEach(item => {
              item.addEventListener('click', () => {
                // Close the expanded selector immediately
                expandedDeckSelector.style.display = 'none';
                expandDeckSelector.textContent = '⋯ More';
              });
            });
          }, 100);
        }
      });
    }

    // Change deck button (show expanded state)
    const changeDeckButton = document.getElementById('changeDeckButton');
    if (changeDeckButton) {
      changeDeckButton.addEventListener('click', () => {
        this.showDeckSelectorExpanded();
      });
    }

    // Deck selection - Listen for deck selection events from the modern selector
    document.addEventListener('deckSelected', (e) => {
      console.log('deckSelected event received:', e.detail);
      this.setDebugStatus('Loading: ' + e.detail.deckName);
      this.loadPredefinedDeck(e.detail.deckPath);
    });

    // Fallback for legacy select element
    const preDefinedDecks = document.getElementById('preDefinedDecks');
    if (preDefinedDecks) {
      preDefinedDecks.addEventListener('change', (e) => this.loadPredefinedDeck(e.target.value));
    }

    // Also listen for changes on the hidden select from deck-selector.mjs
    const hiddenDeckSelect = document.getElementById('hiddenDeckSelect');
    if (hiddenDeckSelect) {
      hiddenDeckSelect.addEventListener('change', (e) => this.loadPredefinedDeck(e.target.value));
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

    // Card preview modal
    const closeCardPreview = document.getElementById('closeCardPreview');
    const cardPreviewModal = document.getElementById('cardPreviewModal');
    if (closeCardPreview && cardPreviewModal) {
      closeCardPreview.addEventListener('click', () => this.hideCardPreview());
      cardPreviewModal.addEventListener('click', (e) => {
        if (e.target === cardPreviewModal) this.hideCardPreview();
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

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a deck...';
    select.appendChild(defaultOption);

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
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'block';
    }
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
    console.log('loadPredefinedDeck called with:', deckPath);
    if (!deckPath) {
      console.log('No deck path provided, showing empty state');
      this.setDebugStatus('No deck path');
      this.showEmptyState();
      return;
    }

    // Prevent loading the same deck multiple times
    if (this.currentDeck && this.currentDeck.source === deckPath) {
      console.log('Deck already loaded, skipping');
      return;
    }

    this.setDebugStatus('Starting load...');
    await this.loadDeck(deckPath);
  }

  async loadDeck(deckPath) {
    try {
      console.log('loadDeck called with:', deckPath);
      this.setDebugStatus('Loading XML...');
      this.showLoadingState();
      console.log('Fetching XML from:', deckPath);
      const xmlDoc = await loadXMLDoc(deckPath);
      console.log('XML loaded, processing...', xmlDoc);
      this.setDebugStatus('Processing XML...');
      await this.processDeckXML(xmlDoc, deckPath);
      console.log('Deck processing completed');
    } catch (error) {
      console.error('Error loading deck:', error);
      this.setDebugStatus('Error: ' + error.message);
      this.showErrorState('Failed to load deck. Please try again.');
    }
  }

  async processDeckXML(xmlDoc, source) {
    try {
      console.log('processDeckXML: Starting processing for source:', source);
      console.log('processDeckXML: xmlDoc type:', typeof xmlDoc, xmlDoc);

      // Extract deck information using the config function
      console.log('processDeckXML: Calling getCardNameXML...');
      const deckInformation = getCardNameXML(xmlDoc);
      console.log('processDeckXML: deckInformation result:', deckInformation);

      if (!deckInformation) {
        console.error('processDeckXML: getCardNameXML returned null/undefined');
        throw new Error('getCardNameXML returned no data');
      }

      if (!deckInformation.cardNames) {
        console.error('processDeckXML: cardNames is missing:', deckInformation);
        throw new Error('cardNames missing from deck data');
      }

      console.log('processDeckXML: cardNames length:', deckInformation.cardNames.length);

      // Set current deck
      this.currentDeck = {
        name: this.extractDeckName(xmlDoc, source),
        cards: deckInformation.cardNames,
        cardInfo: deckInformation.cardInfo,
        totalCards: deckInformation.cardNames.length,
        source: source
      };

      console.log('processDeckXML: currentDeck set:', this.currentDeck);

      // Display deck information
      this.displayDeck();

      // Show success message
      this.showToast(`Loaded deck: ${this.currentDeck.name}`, 'success');

    } catch (error) {
      console.error('Error processing deck:', error);
      console.error('Error stack:', error.stack);
      // Update technical error details
      const technicalError = document.getElementById('technicalError');
      if (technicalError) {
        technicalError.textContent = `${error.message}\n\nStack trace:\n${error.stack}`;
      }
      this.showErrorState('Failed to process deck. Please check the file format.');
    }
  }

  extractDeckName(xmlDoc, source) {
    // Try to extract deck name from XML
    const deckNameElement = xmlDoc.querySelector('deck name, deckname, title');
    if (deckNameElement) {
      return deckNameElement.textContent.trim();
    }

    // Fallback to filename
    if (typeof source === 'string') {
      return source.split('/').pop().replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();
    }

    return 'Custom Deck';
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      await this.processDeckXML(xmlDoc, file.name);
    } catch (error) {
      console.error('Error loading file:', error);
      this.showToast('Error loading deck file', 'error');
      this.showErrorState('Failed to process deck file. Please check the file format.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  }

  displayDeck() {
    if (!this.currentDeck) return;

    console.log('Displaying deck:', this.currentDeck);

    // Transform the legacy deck format to the modern format expected by the UI
    const modernDeckData = this.transformLegacyDeckData(this.currentDeck);

    this.updateDeckHeader();
    this.updateDeckMetadata(this.currentDeck);
    this.updateCardTypesOverview(modernDeckData);
    this.updateCardList(modernDeckData);
    this.updateManaCurve(modernDeckData);
    this.updateDeckSelector(this.currentDeck.source);
    this.showDeckContent();
  }

  transformLegacyDeckData(legacyDeck) {
    // Transform legacy deck format to modern format
    const cards = [];
    const cardTypeCounts = {
      creatures: 0,
      spells: 0,
      lands: 0,
      artifacts: 0,
      planeswalkers: 0,
      enchantments: 0,
      other: 0
    };

    const manaCurve = {};
    const colorDistribution = {};

    // Process card info to create modern format
    for (const [cardName, cardData] of Object.entries(legacyDeck.cardInfo)) {
      const card = {
        name: cardName,
        quantity: cardData.quantity,
        type: cardData.type || '',
        cost: cardData.cost || ''
      };
      cards.push(card);

      // Count card types
      const type = cardData.type.toLowerCase();
      if (type.includes('creature')) {
        cardTypeCounts.creatures += cardData.quantity;
      } else if (type.includes('land')) {
        cardTypeCounts.lands += cardData.quantity;
        manaCurve[0] = (manaCurve[0] || 0) + cardData.quantity;
      } else if (type.includes('artifact')) {
        cardTypeCounts.artifacts += cardData.quantity;
      } else if (type.includes('planeswalker')) {
        cardTypeCounts.planeswalkers += cardData.quantity;
      } else if (type.includes('enchantment')) {
        cardTypeCounts.enchantments += cardData.quantity;
      } else if (type.includes('instant') || type.includes('sorcery')) {
        cardTypeCounts.spells += cardData.quantity;
      } else {
        cardTypeCounts.other += cardData.quantity;
      }

      // Build mana curve (simplified)
      if (cardData.cost && !type.includes('land')) {
        const manaCost = this.parseManaValue(cardData.cost);
        manaCurve[manaCost] = (manaCurve[manaCost] || 0) + cardData.quantity;
      }
    }

    // Calculate statistics
    const statistics = {
      creatures: cardTypeCounts.creatures,
      spells: cardTypeCounts.spells + cardTypeCounts.artifacts + cardTypeCounts.enchantments + cardTypeCounts.planeswalkers + cardTypeCounts.other,
      lands: cardTypeCounts.lands,
      totalCards: legacyDeck.totalCards,
      averageCost: this.calculateAverageManaValue(legacyDeck.cards),
      manaCurve: manaCurve,
      colorDistribution: colorDistribution,
      cardTypeDetails: cardTypeCounts
    };

    return {
      deck: {
        name: legacyDeck.name,
        cards: cards,
        totalCards: legacyDeck.totalCards
      },
      statistics: statistics
    };
  }

  updateDeckHeader() {
    if (!this.currentDeck) return;

    const deckName = document.getElementById('deckName');
    const deckStats = document.getElementById('deckStats');

    if (deckName) deckName.textContent = this.currentDeck.name || 'Unnamed Deck';
    if (deckStats) {
      deckStats.textContent = `${this.currentDeck.totalCards} cards loaded successfully`;
    }
  }

  updateDeckMetadata(currentDeck) {
    console.log('updateDeckMetadata called with:', currentDeck);
    const deckSize = document.getElementById('deckSize');
    const avgManaCost = document.getElementById('avgManaCost');

    if (deckSize) {
      const cardCount = currentDeck.totalCards || currentDeck.cards?.length || 0;
      console.log('Setting deck size to:', cardCount);
      deckSize.textContent = cardCount;
    }

    // Calculate average mana cost
    if (avgManaCost) {
      const avgCost = this.calculateAverageManaValue(currentDeck.cards || []);
      console.log('Setting avg mana cost to:', avgCost);
      avgManaCost.textContent = avgCost !== null ? avgCost.toFixed(1) : 'N/A';
    }
  }

  setDebugStatus(message) {
    const deckSize = document.getElementById('deckSize');
    const avgManaCost = document.getElementById('avgManaCost');
    if (deckSize) deckSize.textContent = message;
    if (avgManaCost) avgManaCost.textContent = message;
  }

  updateDeckSelector(deckPath) {
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    if (quickDeckSelect) {
      // Check if the deck is in the quick selector options
      const option = Array.from(quickDeckSelect.options).find(opt => opt.value === deckPath);
      if (option) {
        quickDeckSelect.value = deckPath;
      } else {
        // If not in quick selector, set to empty
        quickDeckSelect.value = '';
      }
    }

    // Update the hidden select for compatibility
    const hiddenDeckSelect = document.getElementById('hiddenDeckSelect');
    if (hiddenDeckSelect) {
      hiddenDeckSelect.value = deckPath;
    }

    // Keep collapsed - deck selection is now at bottom and minimal
    this.showDeckSelectorCollapsed();

    console.log('Deck selected:', deckPath);
  }

  showDeckSelectorExpanded() {
    const expanded = document.getElementById('deckSelectorExpanded');
    const collapsed = document.getElementById('deckSelectorCollapsed');
    if (expanded && collapsed) {
      expanded.style.display = 'block';
      collapsed.style.display = 'none';
    }
  }

  showDeckSelectorCollapsed() {
    const expanded = document.getElementById('deckSelectorExpanded');
    const collapsed = document.getElementById('deckSelectorCollapsed');

    if (expanded && collapsed) {
      expanded.style.display = 'none';
      collapsed.style.display = 'block';
    }
  }

  calculateAverageManaValue(cards) {
    if (!cards || cards.length === 0) return null;

    let totalCost = 0;
    let totalCards = 0;

    cards.forEach(cardName => {
      const cardInfo = this.currentDeck?.cardInfo?.[cardName];
      if (cardInfo && cardInfo.cost) {
        const manaCost = this.parseManaValue(cardInfo.cost);
        totalCost += manaCost;
        totalCards++;
      }
    });

    return totalCards > 0 ? totalCost / totalCards : null;
  }

  parseManaValue(cost) {
    if (!cost) return 0;

    // Handle simple numeric costs first (like "2", "3", etc.)
    const simpleNumber = parseInt(cost);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    let totalCost = 0;

    // Handle MTG format with curly braces like {2}{U}
    const numbers = cost.match(/\{(\d+)\}/g);
    if (numbers) {
      numbers.forEach(num => {
        const value = parseInt(num.replace(/[{}]/g, ''));
        if (!isNaN(value)) totalCost += value;
      });
    }

    const coloredMana = cost.match(/\{[WUBRG]\}/g);
    if (coloredMana) totalCost += coloredMana.length;

    // Handle simple letter format (like "B", "U", "RR", "2U", etc.)
    if (totalCost === 0) {
      // Count numeric parts in mixed costs like "2U" or "1RR"
      const numericPart = cost.match(/\d+/);
      if (numericPart) {
        totalCost += parseInt(numericPart[0]);
      }

      // Count colored mana symbols (W, U, B, R, G)
      const colorMatches = cost.match(/[WUBRG]/g);
      if (colorMatches) {
        totalCost += colorMatches.length;
      }
    }

    return totalCost;
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

  async updateCardList(deckData) {
    const { deck } = deckData;
    const container = document.getElementById('cardList');
    if (!container) return;

    const sortedCards = [...deck.cards].sort((a, b) => a.name.localeCompare(b.name));

    // Create initial layout without images
    container.innerHTML = sortedCards.map((card, index) => `
      <div class="card-list-item" style="animation-delay: ${index * 0.05}s" data-card-name="${this.escapeHtml(card.name)}">
        <div class="card-image-container" style="width: 100px; height: 140px; background: var(--bg-tertiary); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center; margin-right: var(--space-4); flex-shrink: 0;">
          <div class="loading-placeholder" style="font-size: 0.75rem; color: var(--text-muted);">📷</div>
        </div>
        <div class="card-info" style="flex: 1; min-width: 0;">
          <div class="card-name" style="font-weight: 600; margin-bottom: var(--space-1); word-wrap: break-word;">${this.escapeHtml(card.name)}</div>
          <div class="card-details" style="display: flex; flex-wrap: wrap; gap: var(--space-2); font-size: 0.875rem; color: var(--text-secondary);">
            ${card.cost ? `<span>Cost: ${this.escapeHtml(card.cost)}</span>` : ''}
            ${card.type ? `<span>Type: ${this.escapeHtml(card.type)}</span>` : ''}
          </div>
        </div>
        <div class="card-quantity">
          ${card.quantity || 1}x
        </div>
      </div>
    `).join('');

    // Add staggered animation class and click handlers
    setTimeout(() => {
      container.querySelectorAll('.card-list-item').forEach(item => {
        item.classList.add('slide-in-up');

        // Add click handler for card preview
        const imageContainer = item.querySelector('.card-image-container');
        if (imageContainer) {
          imageContainer.addEventListener('click', () => {
            const cardName = item.getAttribute('data-card-name');
            this.showCardPreview(cardName);
          });
          imageContainer.style.cursor = 'pointer';
        }
      });
    }, 100);

    // Load images asynchronously
    this.loadCardImages(sortedCards);
  }

  async loadCardImages(cards) {
    const uniqueCards = [...new Set(cards.map(card => card.name))];

    // Load images with progress
    await CardImageService.getCardImageUrls(
      uniqueCards,
      'small',
      (processed, total, cardName, imageUrl) => {
        this.updateCardImage(cardName, imageUrl);
      }
    );
  }

  updateCardImage(cardName, imageUrl) {
    const cardElements = document.querySelectorAll(`[data-card-name="${cardName}"]`);

    cardElements.forEach(element => {
      const imageContainer = element.querySelector('.card-image-container');
      if (imageContainer) {
        // Create image element programmatically to avoid HTML escaping issues
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = cardName;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: var(--border-radius); opacity: 0; transition: opacity 0.3s ease;';

        img.onload = function() {
          this.style.opacity = '1';
        };

        img.onerror = function() {
          this.parentElement.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              font-size: 0.6rem;
              color: var(--text-muted);
              text-align: center;
              background: var(--bg-tertiary);
              border-radius: var(--border-radius);
            ">
              <div style="font-size: 1.5rem; margin-bottom: 4px;">🃏</div>
              <div>No Image</div>
            </div>
          `;
        };

        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
      }
    });
  }

  updateManaCurve(deckData) {
    this.createManaCurveChart(deckData);
    this.createColorDistributionChart(deckData);
    this.createCardTypesChart(deckData);
  }

  createManaCurveChart(deckData) {
    const canvas = document.getElementById('manaCurveChart');
    const placeholder = document.getElementById('manaCurvePlaceholder');

    console.log('Creating mana curve chart:', deckData.statistics);

    if (!canvas || !deckData.statistics.manaCurve) {
      console.log('Missing canvas or mana curve data:', { canvas: !!canvas, manaCurve: deckData.statistics.manaCurve });
      return;
    }

    // Prepare mana curve data (0-7+ mana costs)
    const manaCurveData = [];
    const labels = [];
    for (let i = 0; i <= 7; i++) {
      if (i === 7) {
        // Aggregate 7+ mana costs
        let count = 0;
        Object.keys(deckData.statistics.manaCurve).forEach(cost => {
          if (parseInt(cost) >= 7) {
            count += deckData.statistics.manaCurve[cost];
          }
        });
        manaCurveData.push(count);
        labels.push('7+');
      } else {
        manaCurveData.push(deckData.statistics.manaCurve[i] || 0);
        labels.push(i.toString());
      }
    }

    // Destroy existing chart if it exists
    if (this.manaCurveChart) {
      this.manaCurveChart.destroy();
    }

    // Show canvas, hide placeholder
    canvas.style.display = 'block';
    placeholder.style.display = 'none';

    // Create new chart
    if (typeof globalThis.Chart !== 'undefined') {
      this.manaCurveChart = new globalThis.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Card Count',
          data: manaCurveData,
          backgroundColor: 'rgba(30, 58, 138, 0.8)',
          borderColor: 'rgba(30, 58, 138, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Mana Curve (Avg: ${deckData.statistics.averageCost || 'N/A'})`,
            color: 'rgb(107, 114, 128)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: 'rgb(107, 114, 128)'
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)'
            }
          },
          x: {
            ticks: {
              color: 'rgb(107, 114, 128)'
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)'
            }
          }
        }
      }
    });
    } else {
      console.warn('Chart.js library not available for mana curve chart');
      placeholder.textContent = 'Chart.js library not loaded';
      placeholder.style.display = 'block';
      canvas.style.display = 'none';
    }
  }

  createColorDistributionChart(deckData) {
    const canvas = document.getElementById('colorDistributionChart');
    const placeholder = document.getElementById('colorPlaceholder');

    if (!canvas || !deckData.statistics.colorDistribution) return;

    const colorData = deckData.statistics.colorDistribution;
    const colorNames = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };
    const colorColors = { W: '#FFFBD5', U: '#0E68AB', B: '#150B00', R: '#D3202A', G: '#00733E' };

    const data = [];
    const labels = [];
    const backgroundColors = [];

    Object.entries(colorData).forEach(([color, count]) => {
      if (count > 0 && colorNames[color]) {
        data.push(count);
        labels.push(colorNames[color]);
        backgroundColors.push(colorColors[color]);
      }
    });

    if (data.length === 0) {
      // No color data available
      return;
    }

    // Destroy existing chart if it exists
    if (this.colorChart) {
      this.colorChart.destroy();
    }

    // Show canvas, hide placeholder
    canvas.style.display = 'block';
    placeholder.style.display = 'none';

    // Create pie chart
    if (typeof globalThis.Chart !== 'undefined') {
      this.colorChart = new globalThis.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 10
              },
              color: 'rgb(107, 114, 128)'
            }
          },
          title: {
            display: true,
            text: 'Color Distribution',
            color: 'rgb(107, 114, 128)',
            font: {
              size: 12
            }
          }
        }
      }
    });
    } else {
      console.warn('Chart.js library not available for color distribution chart');
      placeholder.textContent = 'Chart.js library not loaded';
      placeholder.style.display = 'block';
      canvas.style.display = 'none';
    }
  }

  createCardTypesChart(deckData) {
    const canvas = document.getElementById('cardTypesChart');
    const placeholder = document.getElementById('typesPlaceholder');

    if (!canvas || !deckData.statistics.cardTypeDetails) return;

    const typeData = deckData.statistics.cardTypeDetails;
    const data = [];
    const labels = [];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#9ca3af', '#8b5cf6', '#ec4899', '#6b7280'];

    Object.entries(typeData).forEach(([type, count], index) => {
      if (count > 0) {
        data.push(count);
        labels.push(type.charAt(0).toUpperCase() + type.slice(1));
      }
    });

    if (data.length === 0) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.typesChart) {
      this.typesChart.destroy();
    }

    // Show canvas, hide placeholder
    canvas.style.display = 'block';
    placeholder.style.display = 'none';

    // Create pie chart
    if (typeof globalThis.Chart !== 'undefined') {
      this.typesChart = new globalThis.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 10
              },
              color: 'rgb(107, 114, 128)'
            }
          },
          title: {
            display: true,
            text: 'Card Types',
            color: 'rgb(107, 114, 128)',
            font: {
              size: 12
            }
          }
        }
      }
    });
    } else {
      console.warn('Chart.js library not available for card types chart');
      placeholder.textContent = 'Chart.js library not loaded';
      placeholder.style.display = 'block';
      canvas.style.display = 'none';
    }
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

  async showCardPreview(cardName) {
    const modal = document.getElementById('cardPreviewModal');
    const previewCardName = document.getElementById('previewCardName');
    const previewCardImage = document.getElementById('previewCardImage');
    const previewCardInfo = document.getElementById('previewCardInfo');

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) return;

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';
    previewCardInfo.innerHTML = '<div class="text-center text-muted">Loading card details...</div>';
    modal.style.display = 'flex';
    modal.classList.add('fade-in');

    try {
      // Get high-quality image and card data
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'large');
      const cached = CardImageService.CARD_CACHE.get(`${cardName}-large`);

      // Update image
      if (imageUrl && !imageUrl.startsWith('data:')) {
        previewCardImage.src = imageUrl;
        previewCardImage.style.display = 'block';
      } else {
        previewCardImage.src = imageUrl;
        previewCardImage.style.display = 'block';
      }

      // Update card info
      if (cached?.cardData) {
        const cardData = cached.cardData;
        previewCardInfo.innerHTML = `
          <div class="mb-2">
            <strong>Type:</strong> ${this.escapeHtml(cardData.type_line || 'Unknown')}
          </div>
          ${cardData.mana_cost ? `
            <div class="mb-2">
              <strong>Mana Cost:</strong> ${this.escapeHtml(cardData.mana_cost)}
            </div>
          ` : ''}
          ${cardData.colors && cardData.colors.length > 0 ? `
            <div class="mb-2">
              <strong>Colors:</strong> ${cardData.colors.join(', ')}
            </div>
          ` : ''}
        `;
      } else {
        previewCardInfo.innerHTML = `
          <div class="text-muted">
            Card details will be available after the image loads.
          </div>
        `;
      }
    } catch (error) {
      console.error('Error showing card preview:', error);
      previewCardInfo.innerHTML = '<div class="text-danger">Failed to load card details</div>';
    }
  }

  hideCardPreview() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) {
      modal.classList.remove('fade-in');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ModernUI());
} else {
  new ModernUI();
}