/**
 * Modal Manager Module
 * Handles all modal dialogs for viewing zones (library, graveyard, exile)
 */

export const ModalManager = {
  /**
   * Show library modal for player or opponent
   */
  showLibraryModal(player = 'player') {
    console.log('showLibraryModal called for:', player);
    const library = player === 'player' ? this.gameState.player.library : this.gameState.opponent.library;
    console.log('Library cards:', library?.length);
    const title = player === 'player' ? '📚 Library' : '📚 Opponent Library';
    console.log('Calling showSimpleModal with:', title, library?.length, 'cards');
    this.showSimpleModal(`${player}-library`, library, title);
  },

  /**
   * Show graveyard modal
   */
  showGraveyardModal() {
    console.log('showGraveyardModal called');
    this.showSimpleModal('graveyard', this.gameState.player.graveyard, '🪦 Graveyard');
  },

  /**
   * Show exile modal
   */
  showExileModal() {
    console.log('showExileModal called');
    this.showSimpleModal('exile', this.gameState.player.exile, '🚫 Exile');
  },

  /**
   * Show opponent graveyard modal
   */
  showOpponentGraveyardModal() {
    this.showSimpleModal('opponent-graveyard', this.gameState.opponent.graveyard, '🪦 Opponent Graveyard');
  },

  /**
   * Show opponent exile modal
   */
  showOpponentExileModal() {
    this.showSimpleModal('opponent-exile', this.gameState.opponent.exile, '🚫 Opponent Exile');
  },

  /**
   * Generic modal for showing zone contents (XSS-safe)
   */
  async showSimpleModal(modalId, cards, title) {
    console.log(`showSimpleModal called: ${modalId}, cards: ${cards?.length || 0}`);

    // Remove any existing modal with this ID
    const existingModal = document.getElementById(`simple-modal-${modalId}`);
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = `simple-modal-${modalId}`;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #ffffff;
      color: #000000;
      border-radius: 8px;
      max-width: 95%;
      max-height: 90%;
      overflow: hidden;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    // Header (XSS-safe)
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 10px;
    `;

    const titleH3 = document.createElement('h3');
    titleH3.style.cssText = 'margin: 0; color: #000;';
    titleH3.textContent = `${title} (${cards?.length || 0} cards)`;
    header.appendChild(titleH3);

    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.style.cssText = 'background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 18px; font-weight: bold;';
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => modal.remove());
    header.appendChild(closeButton);

    // Cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.setAttribute('data-zone-type', modalId); // Track which zone this modal represents
    cardsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      overflow-y: auto;
      padding: 10px;
    `;

    if (!cards || cards.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'text-align: center; color: var(--text-secondary); padding: 40px; grid-column: 1 / -1;';
      emptyDiv.textContent = 'No cards in this zone';
      cardsContainer.appendChild(emptyDiv);
    } else {
      // Show cards in reverse order (most recent first)
      const orderedCards = [...cards].reverse();

      orderedCards.forEach((card, index) => {
        const originalIndex = cards.findIndex(c => c === card);
        const cardId = card.id || `${card.name}_${originalIndex}`;
        const orderNumber = cards.length - index;

        const zoneCard = this.createZoneCardElement(card, cardId, orderNumber);
        cardsContainer.appendChild(zoneCard);
      });

      // Load images for modal cards
      setTimeout(() => {
        this.uiManager.loadCardImages(cardsContainer);
        this.uiManager.attachCardEventListeners(cardsContainer);
      }, 100);
    }

    modalContent.appendChild(header);
    modalContent.appendChild(cardsContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },

  /**
   * Create a zone card element (XSS-safe)
   */
  createZoneCardElement(card, cardId, orderNumber) {
    const zoneCard = document.createElement('div');
    zoneCard.className = 'zone-card';
    zoneCard.setAttribute('data-card-id', cardId);
    zoneCard.setAttribute('data-card-name', card.name);
    zoneCard.draggable = true;
    zoneCard.style.cssText = 'position: relative; cursor: grab; width: 100px; min-width: 100px; flex-shrink: 0;';

    // Order number badge
    if (orderNumber) {
      const orderBadge = document.createElement('div');
      orderBadge.style.cssText = 'position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.8); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;';
      orderBadge.textContent = orderNumber;
      zoneCard.appendChild(orderBadge);
    }

    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image-container';
    imageContainer.style.cssText = 'width: 100%; height: 140px;';

    const img = document.createElement('img');
    img.className = 'card-image-lazy';
    img.setAttribute('data-card-name', card.name);
    img.alt = card.name;
    img.loading = 'lazy';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    imageContainer.appendChild(img);

    const placeholder = document.createElement('div');
    placeholder.className = 'loading-placeholder';
    placeholder.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    placeholder.textContent = '🎴';
    imageContainer.appendChild(placeholder);

    cardContent.appendChild(imageContainer);

    // Card info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    cardInfo.style.cssText = 'padding: 4px;';

    const cardName = document.createElement('div');
    cardName.className = 'card-name';
    cardName.style.cssText = 'font-size: 0.75rem; font-weight: 600;';
    cardName.textContent = card.name;
    cardInfo.appendChild(cardName);

    const cardDetails = document.createElement('div');
    cardDetails.className = 'card-details';
    cardDetails.style.cssText = 'font-size: 0.7rem;';

    const cardCost = document.createElement('div');
    cardCost.className = 'card-cost';
    cardCost.textContent = card.cost || '0';
    cardDetails.appendChild(cardCost);

    const cardType = document.createElement('div');
    cardType.className = 'card-type';
    cardType.textContent = this.uiManager.getCardMainType(card.type || 'Unknown');
    cardDetails.appendChild(cardType);

    cardInfo.appendChild(cardDetails);
    cardContent.appendChild(cardInfo);
    zoneCard.appendChild(cardContent);

    return zoneCard;
  },

  /**
   * Show card preview modal (large image + details)
   */
  async showCardPreview(cardName) {
    const modal = document.getElementById('cardPreviewModal');
    const previewCardName = document.getElementById('previewCardName');
    const previewCardImage = document.getElementById('previewCardImage');
    const previewCardInfo = document.getElementById('previewCardInfo');

    if (!modal || !previewCardName || !previewCardImage || !previewCardInfo) {
      console.error('Missing modal elements for card preview');
      return;
    }

    // Show modal with loading state
    previewCardName.textContent = cardName;
    previewCardImage.src = '';
    previewCardImage.style.display = 'none';

    // Clear and set loading message (XSS-safe)
    previewCardInfo.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-center text-muted';
    loadingDiv.textContent = 'Loading card details...';
    previewCardInfo.appendChild(loadingDiv);

    // Ensure modal is visible with high z-index
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    modal.classList.add('fade-in');

    // Check if modal content needs show class for visibility
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.add('show');
      modalContent.style.opacity = '1';
      modalContent.style.transform = 'scale(1) translateY(0)';
    }

    // Force visible background
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.opacity = '1';

    try {
      // Get high-quality image and card data
      const CardImageService = (await import('/src/services/cardImageService.mjs')).CardImageService;
      const imageUrl = await CardImageService.getCardImageUrl(cardName, 'large');
      const cached = CardImageService.CARD_CACHE.get(`${cardName}-large`);

      // Update image
      previewCardImage.src = imageUrl;
      previewCardImage.style.display = 'block';

      // Update card info (XSS-safe)
      previewCardInfo.innerHTML = '';

      if (cached?.cardData) {
        const cardData = cached.cardData;

        // Type line
        const typeDiv = document.createElement('div');
        typeDiv.className = 'mb-2';
        const typeStrong = document.createElement('strong');
        typeStrong.textContent = 'Type: ';
        typeDiv.appendChild(typeStrong);
        typeDiv.appendChild(document.createTextNode(cardData.type_line || 'Unknown'));
        previewCardInfo.appendChild(typeDiv);

        // Mana cost
        if (cardData.mana_cost) {
          const costDiv = document.createElement('div');
          costDiv.className = 'mb-2';
          const costStrong = document.createElement('strong');
          costStrong.textContent = 'Mana Cost: ';
          costDiv.appendChild(costStrong);
          costDiv.appendChild(document.createTextNode(cardData.mana_cost));
          previewCardInfo.appendChild(costDiv);
        }

        // Colors
        if (cardData.colors && cardData.colors.length > 0) {
          const colorsDiv = document.createElement('div');
          colorsDiv.className = 'mb-2';
          const colorsStrong = document.createElement('strong');
          colorsStrong.textContent = 'Colors: ';
          colorsDiv.appendChild(colorsStrong);
          colorsDiv.appendChild(document.createTextNode(cardData.colors.join(', ')));
          previewCardInfo.appendChild(colorsDiv);
        }
      } else {
        const mutedDiv = document.createElement('div');
        mutedDiv.className = 'text-muted';
        mutedDiv.textContent = 'Card details will be available after the image loads.';
        previewCardInfo.appendChild(mutedDiv);
      }
    } catch (error) {
      console.error('Error showing card preview:', error);
      previewCardInfo.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-danger';
      errorDiv.textContent = 'Failed to load card details';
      previewCardInfo.appendChild(errorDiv);
    }
  },

  /**
   * Hide card preview modal
   */
  hideCardPreview() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) {
      modal.classList.remove('fade-in');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }
};
