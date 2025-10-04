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
        this.setDebugStatus(`Found: ${  selectedDeck}`);
        if (selectedDeck && selectedDeck !== '') {
          this.setDebugStatus(`Loading: ${  selectedDeck.split('/').pop()}`);
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
      this.setDebugStatus(`Loading: ${  e.detail.deckName}`);
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

    // Edit mode buttons
    const editDeckButton = document.getElementById('editDeckButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const saveDeckButton = document.getElementById('saveDeckButton');
    const addCardButton = document.getElementById('addCardButton');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const cardSearchInput = document.getElementById('cardSearchInput');

    if (editDeckButton) {
      editDeckButton.addEventListener('click', () => this.enterEditMode());
    }
    if (cancelEditButton) {
      cancelEditButton.addEventListener('click', () => this.exitEditMode());
    }
    if (saveDeckButton) {
      saveDeckButton.addEventListener('click', () => this.saveDeckChanges());
    }
    if (addCardButton) {
      addCardButton.addEventListener('click', () => this.toggleAddCardPanel());
    }
    if (closeSearchButton) {
      closeSearchButton.addEventListener('click', () => this.toggleAddCardPanel());
    }
    if (cardSearchInput) {
      let searchTimeout;
      cardSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.searchCards(e.target.value), 300);
      });
    }

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
      this.setDebugStatus(`Error: ${  error.message}`);
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
    container.innerHTML = sortedCards.map((card, index) => {
      const quantity = card.quantity || 1;

      // Edit mode controls
      const quantityDisplay = this.isEditMode ? `
        <div class="card-quantity-controls" style="display: flex; align-items: center; gap: 8px;">
          <button class="btn btn-sm btn-secondary" onclick="window.modernUI.changeCardQuantity('${this.escapeHtml(card.name).replace(/'/g, "\\'")}', -1)" style="padding: 4px 8px;">−</button>
          <span style="min-width: 30px; text-align: center; font-weight: 600;">${quantity}x</span>
          <button class="btn btn-sm btn-secondary" onclick="window.modernUI.changeCardQuantity('${this.escapeHtml(card.name).replace(/'/g, "\\'")}', 1)" style="padding: 4px 8px;">+</button>
        </div>
      ` : `
        <div class="card-quantity">
          ${quantity}x
        </div>
      `;

      return `
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
        ${quantityDisplay}
      </div>
      `;
    }).join('');

    // Add staggered animation class and click/hover handlers
    setTimeout(() => {
      container.querySelectorAll('.card-list-item').forEach(item => {
        item.classList.add('slide-in-up');

        const cardName = item.getAttribute('data-card-name');
        const imageContainer = item.querySelector('.card-image-container');

        if (imageContainer && !imageContainer.dataset.listenersAttached) {
          // Click handler for card preview modal
          imageContainer.addEventListener('click', () => {
            this.showCardPreview(cardName);
          });
          imageContainer.style.cursor = 'pointer';

          // Hover handler for quick preview
          let hoverTimeout;
          imageContainer.addEventListener('mouseenter', (e) => {
            hoverTimeout = setTimeout(() => {
              this.showHoverPreview(cardName, e.target);
            }, 300); // 300ms delay before showing
          });

          imageContainer.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            this.hideHoverPreview();
          });

          // Mark as having listeners to prevent duplicates
          imageContainer.dataset.listenersAttached = 'true';
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

    Object.entries(typeData).forEach(([type, count]) => {
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

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) {
      console.warn('Card preview modal elements not found');
      return;
    }

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';
    previewCardInfo.innerHTML = '<div class="text-center text-muted">Loading card details...</div>';
    modal.style.display = 'flex';
    modal.classList.add('fade-in');

    // Add show class to modal-content to make it visible
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      setTimeout(() => {
        modalContent.classList.add('show');
      }, 10); // Small delay to trigger animation
    }

    // Ensure close handlers are attached (re-attach each time to be safe)
    this.attachModalCloseHandlers();

    try {
      // Get high-quality image and card data
      console.log('Fetching large image for:', cardName);
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'large');
      console.log('Image URL received:', imageUrl ? imageUrl.substring(0, 100) : 'null');

      const cached = CardImageService.CARD_CACHE.get(`${cardName}-large`);

      // Update image
      if (imageUrl) {
        // Set image source first
        previewCardImage.src = imageUrl;

        // Force display with !important-like inline styling
        previewCardImage.setAttribute('style', 'display: block !important; max-width: 100%; width: auto; height: auto; border-radius: var(--border-radius); margin: 0 auto;');

        // Add load handler to check if image loads
        previewCardImage.onload = () => {
          console.log('Card image loaded successfully');
          console.log('Image dimensions:', previewCardImage.naturalWidth, 'x', previewCardImage.naturalHeight);
          console.log('Image display style:', window.getComputedStyle(previewCardImage).display);
          console.log('Image visibility:', window.getComputedStyle(previewCardImage).visibility);
        };

        previewCardImage.onerror = (err) => {
          console.error('Failed to load card image:', err);
          previewCardInfo.innerHTML = '<div class="text-danger">Failed to load card image</div>';
        };
      } else {
        console.warn('No image URL received');
        previewCardImage.style.display = 'none';
        previewCardInfo.innerHTML = '<div class="text-warning">No image available for this card</div>';
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
            ${imageUrl ? 'Image loading...' : 'Searching for card...'}
          </div>
        `;
      }
    } catch (error) {
      console.error('Error showing card preview:', error);
      previewCardImage.style.display = 'none';
      previewCardInfo.innerHTML = `<div class="text-danger">Failed to load card: ${error.message}</div>`;
    }
  }

  attachModalCloseHandlers() {
    const modal = document.getElementById('cardPreviewModal');
    const closeButton = document.getElementById('closeCardPreview');

    if (closeButton && !closeButton.dataset.listenerAttached) {
      closeButton.addEventListener('click', () => {
        console.log('Close button clicked');
        this.hideCardPreview();
      });
      closeButton.dataset.listenerAttached = 'true';
    }

    if (modal && !modal.dataset.listenerAttached) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('Modal overlay clicked');
          this.hideCardPreview();
        }
      });
      modal.dataset.listenerAttached = 'true';
    }

    // Add Escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideCardPreview();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  hideCardPreview() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) {
      console.log('Hiding card preview modal');
      const modalContent = modal.querySelector('.modal-content');

      // Remove show class for hide animation
      if (modalContent) {
        modalContent.classList.remove('show');
      }

      modal.classList.remove('fade-in');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }

  async showHoverPreview(cardName, targetElement) {
    // Remove any existing hover preview
    this.hideHoverPreview();

    // Create hover preview container
    const hoverPreview = document.createElement('div');
    hoverPreview.id = 'hoverCardPreview';
    hoverPreview.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      transition: opacity 0.2s ease;
      opacity: 0;
    `;

    // Get target position
    const rect = targetElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determine positioning - show on right if there's space, otherwise left
    const previewWidth = 300;
    const previewHeight = 420;
    let left, top;

    if (rect.right + previewWidth + 20 < windowWidth) {
      // Show on right
      left = rect.right + 10;
    } else {
      // Show on left
      left = rect.left - previewWidth - 10;
    }

    // Center vertically around the card, but keep within viewport
    top = rect.top + (rect.height / 2) - (previewHeight / 2);
    top = Math.max(10, Math.min(top, windowHeight - previewHeight - 10));

    hoverPreview.style.left = `${left}px`;
    hoverPreview.style.top = `${top}px`;

    // Add content with loading placeholder
    hoverPreview.innerHTML = `
      <div style="
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        width: ${previewWidth}px;
      ">
        <div style="
          width: 100%;
          height: ${previewHeight - 16}px;
          background: var(--bg-secondary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        ">
          Loading...
        </div>
      </div>
    `;

    document.body.appendChild(hoverPreview);

    // Fade in
    setTimeout(() => {
      hoverPreview.style.opacity = '1';
    }, 10);

    // Load the card image
    try {
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'normal');

      // Check if preview still exists (user might have moved mouse away)
      const currentPreview = document.getElementById('hoverCardPreview');
      if (currentPreview) {
        currentPreview.innerHTML = `
          <div style="
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            width: ${previewWidth}px;
          ">
            <img src="${imageUrl}" alt="${cardName}" style="
              width: 100%;
              border-radius: 8px;
              display: block;
            ">
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading hover preview:', error);
      this.hideHoverPreview();
    }
  }

  hideHoverPreview() {
    const existing = document.getElementById('hoverCardPreview');
    if (existing) {
      existing.remove();
    }
  }

  // ===== DECK EDITING METHODS =====

  enterEditMode() {
    this.isEditMode = true;
    this.originalDeck = JSON.parse(JSON.stringify(this.currentDeck)); // Deep clone for cancel

    // Toggle button visibility
    document.getElementById('viewModeControls').style.display = 'none';
    document.getElementById('editModeControls').style.display = 'flex';

    // Update subtitle
    document.getElementById('cardListSubtitle').textContent = 'Edit mode - Add, remove, or change quantities';

    // Re-render card list with edit controls
    this.renderCardList();

    this.showToast('Edit mode activated', 'info');
  }

  exitEditMode() {
    this.isEditMode = false;

    // Restore original deck
    this.currentDeck = this.originalDeck;

    // Toggle button visibility
    document.getElementById('viewModeControls').style.display = 'flex';
    document.getElementById('editModeControls').style.display = 'none';

    // Hide add card panel
    document.getElementById('addCardPanel').style.display = 'none';

    // Update subtitle
    document.getElementById('cardListSubtitle').textContent = 'All cards in your deck';

    // Re-render card list without edit controls
    this.renderCardList();

    this.showToast('Changes cancelled', 'info');
  }

  toggleAddCardPanel() {
    const panel = document.getElementById('addCardPanel');
    const searchInput = document.getElementById('cardSearchInput');

    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      searchInput.focus();
    } else {
      panel.style.display = 'none';
      searchInput.value = '';
      document.getElementById('searchResults').innerHTML = '';
    }
  }

  async searchCards(query) {
    if (!query || query.length < 2) {
      document.getElementById('searchResults').innerHTML = '';
      return;
    }

    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div style="padding: 8px; color: var(--text-muted);">Searching...</div>';

    try {
      // Use Scryfall autocomplete API
      const response = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const resultsHTML = data.data.slice(0, 10).map(cardName => `
          <div class="search-result-item"
               style="padding: 8px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s;"
               onmouseover="this.style.background='var(--bg-secondary)'"
               onmouseout="this.style.background='transparent'"
               onclick="window.modernUI.addCardToDeck('${cardName.replace(/'/g, "\\'")}')">
            ${cardName}
          </div>
        `).join('');
        resultsContainer.innerHTML = resultsHTML;
      } else {
        resultsContainer.innerHTML = '<div style="padding: 8px; color: var(--text-muted);">No cards found</div>';
      }
    } catch (error) {
      console.error('Search error:', error);
      resultsContainer.innerHTML = '<div style="padding: 8px; color: var(--error);">Search failed</div>';
    }
  }

  async addCardToDeck(cardName) {
    // Find if card already exists
    const existingCard = this.currentDeck.cards.find(c => c.name === cardName);

    if (existingCard) {
      existingCard.quantity = (existingCard.quantity || 1) + 1;
      this.showToast(`Added another ${cardName} (now ${existingCard.quantity}x)`, 'success');
    } else {
      // Fetch card details from Scryfall
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
        const cardData = await response.json();

        this.currentDeck.cards.push({
          name: cardName,
          quantity: 1,
          cost: cardData.mana_cost || '0',
          type: cardData.type_line || 'Unknown',
          colors: cardData.colors || [],
          cmc: cardData.cmc || 0
        });

        this.showToast(`Added ${cardName} to deck`, 'success');
      } catch (error) {
        console.error('Error fetching card details:', error);
        // Add with minimal info
        this.currentDeck.cards.push({
          name: cardName,
          quantity: 1,
          cost: '0',
          type: 'Unknown',
          colors: [],
          cmc: 0
        });
        this.showToast(`Added ${cardName} (details unavailable)`, 'warning');
      }
    }

    // Update displays
    this.renderCardList();
    this.updateDeckStats();

    // Clear search
    document.getElementById('cardSearchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
  }

  changeCardQuantity(cardName, delta) {
    const card = this.currentDeck.cards.find(c => c.name === cardName);
    if (!card) return;

    card.quantity = (card.quantity || 1) + delta;

    if (card.quantity <= 0) {
      // Remove card from deck
      this.currentDeck.cards = this.currentDeck.cards.filter(c => c.name !== cardName);
      this.showToast(`Removed ${cardName} from deck`, 'info');
    } else if (card.quantity > 4) {
      // Warn about 4-of limit
      card.quantity = 4;
      this.showToast(`Maximum 4 copies of ${cardName}`, 'warning');
    }

    // Update displays
    this.renderCardList();
    this.updateDeckStats();
  }

  saveDeckChanges() {
    // Generate XML from current deck
    const xml = this.generateDeckXML();

    // Download as file
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentDeck.name.replace(/\s+/g, '_')}_edited.xml`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Deck saved! Check your downloads.', 'success');

    // Exit edit mode
    this.exitEditMode();
  }

  generateDeckXML() {
    const deckName = this.currentDeck.name || 'Custom Deck';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<deck>\n';
    xml += `  <deckname>${this.escapeXml(deckName)}</deckname>\n`;
    xml += '  <cards>\n';

    this.currentDeck.cards.forEach(card => {
      const quantity = card.quantity || 1;
      for (let i = 0; i < quantity; i++) {
        xml += `    <card>\n`;
        xml += `      <cardname>${this.escapeXml(card.name)}</cardname>\n`;
        xml += `      <cost>${this.escapeXml(card.cost)}</cost>\n`;
        xml += `      <type>${this.escapeXml(card.type)}</type>\n`;
        xml += `    </card>\n`;
      }
    });

    xml += '  </cards>\n';
    xml += '</deck>';

    return xml;
  }

  escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Make instance globally accessible for onclick handlers
window.modernUI = null;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modernUI = new ModernUI();
  });
} else {
  window.modernUI = new ModernUI();
}